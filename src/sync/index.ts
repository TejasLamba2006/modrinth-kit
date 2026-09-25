import { readFile, writeFile, access } from "node:fs/promises";
import { resolve, relative } from "node:path";
import { stringify } from "smol-toml";
import { ModrinthError, toModrinthError } from "../errors.js";
import { execute, type OpContext } from "../op.js";
import { findOp } from "../ops/index.js";
import { enc, getProject, type Version } from "../ops/shared.js";
import { extractChangelogSection, inferChannel } from "./changelog.js";
import { expandFiles, loadManifest, type Manifest } from "./manifest.js";
import { gatherDesired, plan, type Step } from "./plan.js";

async function runStep(step: Step, ctx: OpContext) {
  return execute(findOp(step.op)!, step.input, ctx);
}

export interface SyncOptions {
  manifest?: string;
  dryRun?: boolean;
  prune?: boolean;
}

export async function sync(opts: SyncOptions, ctx: OpContext) {
  const loaded = await loadManifest(opts.manifest);
  const [desired, remote] = await Promise.all([gatherDesired(loaded), getProject(ctx, loaded.manifest.project)]);
  const steps = plan(desired, remote, { prune: opts.prune });
  const summary = steps.map((s) => s.change);
  const destructive = steps.filter((s) => s.destructive).map((s) => s.change);

  if (opts.dryRun || !steps.length) return { dryRun: !!opts.dryRun, project: remote.slug, changes: summary, upToDate: !steps.length };
  if (destructive.length && !ctx.confirm) {
    // Nothing is applied: a half-synced project is worse than an unsynced one.
    return {
      dryRun: true,
      confirmRequired: true,
      op: "sync",
      wouldDo: `apply ${steps.length} change(s) to ${remote.slug}, including destructive: ${destructive.join("; ")}`,
      changes: summary,
      hint: "Re-run with --yes to apply.",
    };
  }

  const applied: string[] = [];
  for (const [i, step] of steps.entries()) {
    try {
      await runStep(step, ctx);
      applied.push(step.change);
    } catch (e) {
      const err = toModrinthError(e);
      throw new ModrinthError(err.code, `sync stopped at "${step.change}": ${err.message}`, err.status, "Fix the error and re-run; applied steps won't repeat.", {
        applied,
        failed: step.change,
        pending: steps.slice(i + 1).map((s) => s.change),
      });
    }
  }
  return { project: remote.slug, applied };
}

export interface PublishOptions {
  manifest?: string;
  version: string;
  changelog?: string;
  channel?: "release" | "beta" | "alpha";
  files?: string[];
  gameVersions?: string[];
  loaders?: string[];
  dryRun?: boolean;
}

export async function publish(opts: PublishOptions, ctx: OpContext) {
  const { manifest: m, root } = await loadManifest(opts.manifest);
  const v = m.version;
  if (!v && !(opts.files && opts.loaders && opts.gameVersions)) {
    throw new ModrinthError("usage", "No [version] section in manifest", undefined, "Add [version] with files/loaders/game_versions, or pass --file/--loader/--game-version.");
  }
  const number = opts.version.replace(/^refs\/tags\//, "");

  try {
    const existing = await ctx.client.request<Version>("GET", `/project/${enc(m.project)}/version/${enc(number)}`);
    if (existing.version_number === number) return { skipped: true, reason: "version already exists", version: existing.id, version_number: number };
  } catch (e) {
    if (toModrinthError(e).code !== "not_found") throw e;
  }

  const files = await expandFiles(opts.files ?? v!.files, opts.files ? process.cwd() : root);
  const changelog = opts.changelog ?? (await resolveChangelog(m, root, number));
  const deps = await Promise.all(
    (v?.dependencies ?? []).map(async (d) => ({
      project_id: (await ctx.client.request<{ id: string }>("GET", `/project/${enc(d.project)}/check`)).id,
      version_id: d.version_id,
      dependency_type: d.type,
    })),
  );

  const input = {
    project: m.project,
    version_number: number,
    name: v?.name?.replaceAll("{version}", number) ?? number,
    files,
    loaders: opts.loaders ?? v!.loaders,
    game_versions: opts.gameVersions ?? v!.game_versions,
    version_type: opts.channel ?? v?.channel ?? inferChannel(number),
    changelog,
    dependencies: deps,
    featured: v?.featured ?? false,
  };
  if (opts.dryRun) return { dryRun: true, wouldCreate: { ...input, files: files.map((f) => relative(process.cwd(), f)) } };
  return execute(findOp("version.create")!, input, ctx);
}

async function resolveChangelog(m: Manifest, root: string, number: string): Promise<string | undefined> {
  const v = m.version;
  if (v?.changelog) return v.changelog;
  if (!v?.changelog_file) return undefined;
  const text = await readFile(resolve(root, v.changelog_file), "utf8");
  if (!v.changelog_section) return text;
  const section = extractChangelogSection(text, number);
  if (section === undefined) {
    throw new ModrinthError("usage", `No "## ${number}" section in ${v.changelog_file}`, undefined, "Add a section for this version, set changelog_section = false, or pass --changelog.");
  }
  return section;
}

export async function init(opts: { project: string; out?: string; force?: boolean }, ctx: OpContext) {
  const out = resolve(opts.out ?? "modrinth.toml");
  const bodyFile = resolve("modrinth.md");
  if (!opts.force) {
    for (const f of [out, bodyFile]) {
      if (await access(f).then(() => true, () => false)) throw new ModrinthError("usage", `${f} exists`, undefined, "Pass --force to overwrite.");
    }
  }
  const p = await getProject(ctx, opts.project);
  const links = Object.fromEntries(
    (["source", "issues", "wiki", "discord"] as const).flatMap((k) => {
      const url = (p as Record<string, unknown>)[`${k}_url`];
      return url ? [[k, url]] : [];
    }),
  );
  const toml: Record<string, unknown> = {
    project: p.slug,
    metadata: {
      title: p.title,
      summary: p.description,
      body_file: "modrinth.md",
      categories: p.categories,
      additional_categories: p.additional_categories ?? [],
      license: p.license?.id,
      // Plugins have no side fields on Modrinth; writing them back makes sync fail.
      ...(isPlugin(p) || p.client_side === "unknown" ? {} : { client_side: p.client_side, server_side: p.server_side }),
    },
    links,
  };
  if (p.gallery?.length) {
    toml.gallery = p.gallery.filter((g) => g).map((g) => ({
      file: `gallery/${(g!.title ?? "image").replace(/[^a-z0-9-_]+/gi, "-").toLowerCase()}.png`,
      title: g!.title ?? undefined,
      description: g!.description ?? undefined,
      featured: g!.featured,
      ordering: g!.ordering,
    }));
  }
  const versions = await ctx.client.request<Version[]>("GET", `/project/${enc(p.id)}/version`);
  const latest = versions[0];
  if (latest) {
    toml.version = {
      files: ["build/libs/*.jar"],
      loaders: latest.loaders,
      game_versions: latest.game_versions,
      changelog_file: "CHANGELOG.md",
    };
  }
  await writeFile(out, stringify(dropUndefined(toml)) + "\n");
  await writeFile(bodyFile, (p.body ?? "") + "\n");
  return {
    wrote: [out, bodyFile],
    todo: [
      "Set [version].files to your build output glob.",
      p.gallery?.length ? "Gallery `file` paths are placeholders; point them at your local images before running sync." : undefined,
      p.icon_url ? "Add metadata.icon = \"path/to/icon.png\" to manage the icon." : undefined,
    ].filter(Boolean),
  };
}

function dropUndefined<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

const PLUGIN_LOADERS = new Set(["bukkit", "spigot", "paper", "purpur", "folia", "sponge", "bungeecord", "waterfall", "velocity"]);
function isPlugin(p: { loaders?: string[] }): boolean {
  return !!p.loaders?.length && p.loaders.every((l) => PLUGIN_LOADERS.has(l));
}
