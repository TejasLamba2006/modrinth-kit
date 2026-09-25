import type { Op } from "../op.js";
import { ops } from "../ops/index.js";
import { fields } from "../schema.js";
import { VERSION } from "../version.js";
import { keyToFlag } from "./args.js";

export const cliName = (op: Op) => `modrinth ${op.name.replace(/\./g, " ")}`;

export function mainHelp(): string {
  const groups = new Map<string, Op[]>();
  for (const op of ops) {
    const g = op.name.split(".")[0]!;
    groups.set(g, [...(groups.get(g) ?? []), op]);
  }
  const lines = [
    `modrinth-kit ${VERSION} - Modrinth CLI, MCP server, and CI tool`,
    "",
    "Usage: modrinth <command> [args] [--flags]",
    "",
    "Workflow commands:",
    "  sync [--dry-run] [--prune] [--yes]   Apply modrinth.toml to the project (metadata, icon, gallery)",
    "  publish <version> [--dry-run]        Create a version from modrinth.toml [version] (idempotent)",
    "  init <project> [--force]             Write modrinth.toml + modrinth.md from an existing project",
    "  auth login --token <pat>             Store a token (also: auth logout)",
    "  mcp [--read-only] [--allow read,write]  Start the MCP server on stdio",
    "  ops                                  List all operations as JSON",
    "",
  ];
  for (const [g, list] of groups) {
    lines.push(`${g}:`);
    for (const op of list) lines.push(`  ${cliName(op).slice(9).padEnd(34)} ${tierTag(op)} ${op.summary}`);
    lines.push("");
  }
  lines.push(
    "Global flags: --token <pat>  --staging  --yes (confirm destructive)  --pretty  --input <json|@file>",
    "Any value can be @path to read from a file, e.g. --body @README.md",
    "Exit codes: 0 ok, 1 usage/invalid, 2 api, 3 auth, 4 confirmation required",
    "Details: modrinth help <command>",
    "",
  );
  return lines.join("\n");
}

const tierTag = (op: Op) => (op.tier === "read" ? "   " : op.tier === "write" ? "[w]" : "[!]");

export function commandHelp(op: Op): string {
  const fs = fields(op);
  const pos = op.positional ?? [];
  const usage = [cliName(op), ...pos.map((p) => (fs.find((f) => f.name === p)?.required ? `<${p}>` : `[${p}]`))].join(" ");
  const lines = [`${usage} [flags]`, "", op.summary, ""];
  if (op.description) lines.push(op.description, "");
  lines.push(`Tier: ${op.tier}${op.tier === "destructive" ? " (needs --yes, otherwise prints a preview and exits 4)" : ""}`);
  if (op.destructiveIf) lines.push("Becomes destructive for some inputs (e.g. status changes).");
  if (op.scope) lines.push(`Token scope: ${op.scope}`);
  lines.push("", "Flags:");
  for (const f of fs) {
    const t = f.enum ? f.enum.join("|") : f.type === "array" ? `${f.itemType ?? "value"},...` : f.type;
    const extra = [f.required ? "required" : "", f.default !== undefined ? `default ${JSON.stringify(f.default)}` : ""].filter(Boolean).join(", ");
    lines.push(`  --${keyToFlag(f.name).padEnd(22)} ${t}${extra ? ` (${extra})` : ""}${f.description ? `  ${f.description}` : ""}`);
  }
  for (const ex of op.examples ?? []) {
    lines.push("", `Example (${ex.note}):`, `  ${exampleCli(op, ex.args)}`);
  }
  return lines.join("\n") + "\n";
}

export function exampleCli(op: Op, args: Record<string, unknown>): string {
  const pos = op.positional ?? [];
  const parts = [cliName(op)];
  for (const p of pos) if (p in args) parts.push(String(args[p]));
  for (const [k, v] of Object.entries(args)) {
    if (pos.includes(k)) continue;
    const val = Array.isArray(v) ? v.join(",") : String(v);
    parts.push(`--${keyToFlag(k)} ${/\s/.test(val) ? JSON.stringify(val) : val}`);
  }
  return parts.join(" ");
}
