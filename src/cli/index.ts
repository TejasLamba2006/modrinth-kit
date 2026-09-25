#!/usr/bin/env node
import { ModrinthClient } from "../client/http.js";
import { configPath, readStored, resolveToken, writeStored } from "../config.js";
import { EXIT, ModrinthError, toModrinthError } from "../errors.js";
import { execute, isConfirmRequired, type Op, type OpContext } from "../op.js";
import { ops } from "../ops/index.js";
import { fields } from "../schema.js";
import { init, publish, sync } from "../sync/index.js";
import { VERSION } from "../version.js";
import { coerce, keyToFlag, parseArgv } from "./args.js";
import { commandHelp, mainHelp } from "./help.js";

const GLOBAL_BOOL = ["staging", "pretty", "yes", "help", "dry_run", "prune", "force", "read_only", "global"];

async function main(argv: string[]): Promise<number> {
  if (argv[0] === "--version" || argv[0] === "-v") {
    process.stdout.write(VERSION + "\n");
    return 0;
  }
  const parsed = parseArgv(argv, new Set([...GLOBAL_BOOL, ...ops.flatMap((o) => fields(o).filter((f) => f.type === "boolean").map((f) => f.name))]));
  const flag = (k: string) => parsed.flags.get(k)?.at(-1);
  const bool = (k: string) => flag(k) === "true";
  const pos = parsed.positionals;
  const pretty = bool("pretty");
  const out = (v: unknown) => process.stdout.write(JSON.stringify(v, null, pretty ? 2 : undefined) + "\n");

  if (!pos.length || pos[0] === "help") {
    const target = pos.slice(pos[0] === "help" ? 1 : 0);
    const op = target.length ? matchOp(target)?.op : undefined;
    process.stdout.write(op ? commandHelp(op) : mainHelp());
    return 0;
  }
  const staging = bool("staging");
  const token = await resolveToken(flag("token"), staging);
  const ctx: OpContext = { client: new ModrinthClient({ token, staging }), confirm: bool("yes") };

  const [cmd, ...rest] = pos;
  switch (cmd) {
    case "ops":
      out(ops.map((o) => ({ name: o.name, tier: o.tier, summary: o.summary })));
      return 0;
    case "skills": {
      const sk = await import("../skills.js");
      const opts = { agents: parsed.flags.get("agent")?.flatMap((v) => v.split(",")), global: bool("global"), force: bool("force") };
      if (rest[0] === "install") return emit(out, await sk.installSkills(opts));
      if (rest[0] === "update") return emit(out, await sk.installSkills({ ...opts, force: true }));
      if (rest[0] === "uninstall") return emit(out, await sk.uninstallSkills(opts));
      if (!rest[0] || rest[0] === "list") return emit(out, await sk.listSkills());
      throw new ModrinthError("usage", "Usage: modrinth skills <list|install|update|uninstall> [--agent claude,cursor,codex,agents] [--global]");
    }
    case "mcp": {
      const { startMcp } = await import("../mcp/server.js");
      await startMcp({ ctx, readOnly: bool("read_only"), allow: parsed.flags.get("allow")?.flatMap((v) => v.split(",")) });
      return -1; // keep running
    }
    case "auth":
      if (rest[0] === "login") {
        const t = flag("token") ?? rest[1];
        if (!t) throw new ModrinthError("usage", "Usage: modrinth auth login --token <pat> [--staging]");
        const who = await new ModrinthClient({ token: t, staging }).request<{ username: string }>("GET", "/user");
        const stored = await readStored();
        const path = await writeStored(staging ? { ...stored, staging_token: t } : { ...stored, token: t });
        out({ ok: true, username: who.username, staging, stored: path });
        return 0;
      }
      if (rest[0] === "logout") {
        const stored = await readStored();
        if (staging) delete stored.staging_token;
        else delete stored.token;
        await writeStored(stored);
        out({ ok: true, removed: staging ? "staging_token" : "token", from: configPath() });
        return 0;
      }
      break;
    case "sync":
      return emit(out, await sync({ manifest: flag("manifest"), dryRun: bool("dry_run"), prune: bool("prune") }, ctx));
    case "publish": {
      const version = flag("version_number") ?? flag("version") ?? rest[0];
      if (!version) throw new ModrinthError("usage", "Usage: modrinth publish <version> [--changelog ..] [--channel ..] [--dry-run]");
      const list = (k: string) => parsed.flags.get(k)?.flatMap((v) => v.split(",")).filter(Boolean);
      return emit(
        out,
        await publish(
          {
            manifest: flag("manifest"),
            version,
            changelog: flag("changelog"),
            channel: flag("channel") as "release" | undefined,
            files: list("file"),
            loaders: list("loader"),
            gameVersions: list("game_version"),
            dryRun: bool("dry_run"),
          },
          ctx,
        ),
      );
    }
    case "init": {
      const project = flag("project") ?? rest[0];
      if (!project) throw new ModrinthError("usage", "Usage: modrinth init <project> [--out modrinth.toml] [--force]");
      return emit(out, await init({ project, out: flag("out"), force: bool("force") }, ctx));
    }
  }

  const match = matchOp(pos);
  if (!match) throw new ModrinthError("usage", `Unknown command: ${pos.join(" ")}`, undefined, "Run `modrinth help` or `modrinth ops`.");
  const { op, args } = match;
  if (bool("help")) {
    process.stdout.write(commandHelp(op));
    return 0;
  }
  return emit(out, await execute(op, await buildInput(op, args, parsed.flags), ctx));
}

function emit(out: (v: unknown) => void, result: unknown): number {
  out(result);
  return isConfirmRequired(result) ? EXIT.confirm_required : 0;
}

/** Longest dotted-name prefix match: `project icon set x.png` -> project.icon.set + [x.png]. */
function matchOp(words: string[]): { op: Op; args: string[] } | undefined {
  for (let n = Math.min(words.length, 4); n > 0; n--) {
    const name = words.slice(0, n).join(".");
    const op = ops.find((o) => o.name === name);
    if (op) return { op, args: words.slice(n) };
  }
  return undefined;
}

const RESERVED = new Set(["token", "staging", "pretty", "yes", "help", "input"]);

async function buildInput(op: Op, args: string[], flags: Map<string, string[]>): Promise<Record<string, unknown>> {
  const fs = fields(op);
  const input: Record<string, unknown> = {};
  const inputFlag = flags.get("input")?.at(-1);
  if (inputFlag) Object.assign(input, await coerce({ name: "input", type: "object", required: false, nullable: false }, [inputFlag]));

  const positional = op.positional ?? [];
  if (args.length > positional.length) {
    // allow a trailing list positional, e.g. `version create proj a.jar b.jar` is not supported; be explicit
    throw new ModrinthError("usage", `Too many arguments for ${op.name}: ${args.slice(positional.length).join(" ")}`, undefined, `Positional: ${positional.join(", ") || "(none)"}`);
  }
  for (const [i, v] of args.entries()) {
    const f = fs.find((x) => x.name === positional[i])!;
    input[f.name] = await coerce(f, [v]);
  }
  for (const [k, v] of flags) {
    if (RESERVED.has(k)) continue;
    const f = fs.find((x) => x.name === k);
    if (!f) throw new ModrinthError("usage", `Unknown flag --${keyToFlag(k)} for ${op.name}`, undefined, `Run \`modrinth ${op.name.replace(/\./g, " ")} --help\`.`);
    input[k] = await coerce(f, v);
  }
  return input;
}

main(process.argv.slice(2)).then(
  (code) => {
    if (code >= 0) process.exitCode = code;
  },
  (e) => {
    const err = toModrinthError(e);
    process.stderr.write(JSON.stringify(err.toJSON()) + "\n");
    process.exitCode = EXIT[err.code];
  },
);
