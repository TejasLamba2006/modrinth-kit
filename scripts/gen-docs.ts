// Generates docs/reference/*.md from the op registry. `--check` fails if files are stale (CI).
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { cliName, exampleCli } from "../src/cli/help.js";
import { keyToFlag } from "../src/cli/args.js";
import { toolName } from "../src/mcp/server.js";
import { ops } from "../src/ops/index.js";
import { fields } from "../src/schema.js";

const dir = "docs/reference";
const check = process.argv.includes("--check");
const files = new Map<string, string>();

const esc = (s = "") => s.replace(/\|/g, "\\|").replace(/\n/g, " ");

for (const op of ops) {
  const fs = fields(op);
  const confirmable = op.tier === "destructive" || !!op.destructiveIf;
  const lines = [
    `# ${op.name}`,
    "",
    op.summary,
    "",
    ...(op.description ? [op.description, ""] : []),
    `| | |`,
    `|---|---|`,
    `| Tier | \`${op.tier}\`${op.destructiveIf ? " (destructive for some inputs)" : ""} |`,
    `| CLI | \`${cliName(op)}${(op.positional ?? []).map((p) => ` <${p}>`).join("")}\` |`,
    `| MCP tool | \`${toolName(op.name)}\` |`,
    ...(op.scope ? [`| Token scope | \`${op.scope}\` |`] : []),
    "",
    "## Input",
    "",
    "| Field | CLI flag | Type | Required | Description |",
    "|---|---|---|---|---|",
    ...fs.map((f) => {
      const t = f.enum ? f.enum.map((e) => `\`${e}\``).join(" \\| ") : f.type === "array" ? `${f.itemType ?? "any"}[]` : f.type;
      const def = f.default !== undefined ? ` Default: \`${JSON.stringify(f.default)}\`.` : "";
      return `| \`${f.name}\` | \`--${keyToFlag(f.name)}\` | ${t}${f.nullable ? " \\| null" : ""} | ${f.required ? "yes" : ""} | ${esc(f.description)}${def} |`;
    }),
    ...(confirmable ? ["| `confirm` | `--yes` | boolean | | Required to actually perform the destructive action. Without it a preview is returned (exit 4). |"] : []),
    "",
  ];
  for (const ex of op.examples ?? []) {
    lines.push(`## Example: ${ex.note}`, "", "```sh", exampleCli(op, ex.args), "```", "", "MCP arguments:", "", "```json", JSON.stringify(ex.args), "```", "");
  }
  files.set(`${op.name}.md`, lines.join("\n"));
}

const groups = new Map<string, typeof ops>();
for (const op of ops) groups.set(op.name.split(".")[0]!, [...(groups.get(op.name.split(".")[0]!) ?? []), op]);
const index = ["# Operation reference", "", "Generated from the operation registry by `npm run gen:docs`. Do not edit by hand.", ""];
for (const [g, list] of groups) {
  index.push(`## ${g}`, "", "| Operation | Tier | Summary |", "|---|---|---|");
  for (const op of list) index.push(`| [\`${op.name}\`](${op.name}.md) | ${op.tier} | ${esc(op.summary)} |`);
  index.push("");
}
files.set("README.md", index.join("\n"));

// Skill: splice the operation catalogue between markers in skills/modrinth-kit/SKILL.md.
const skillPath = "skills/modrinth-kit/SKILL.md";
const skillCur = (await readFile(skillPath, "utf8")).replace(/\r\n/g, "\n");
const catalogue = [...groups]
  .map(([g, list]) => `**${g}**: ` + list.map((op) => `\`${op.name.replace(/\./g, " ")}\`${op.tier === "destructive" ? " (destructive)" : ""}`).join(", "))
  .join("\n\n");
const skillNew = skillCur.replace(
  /(<!-- ops:start[^\n]*-->\n)[\s\S]*?(<!-- ops:end -->)/,
  `$1Run \`modrinth help <op>\` for flags. MCP tool = name with \`_\`.\n\n${catalogue}\n$2`,
);

if (check) {
  const stale: string[] = [];
  if (skillNew !== skillCur) stale.push(skillPath);
  for (const [name, content] of files) {
    const cur = await readFile(join(dir, name), "utf8").catch(() => "");
    if (cur.replace(/\r\n/g, "\n") !== content) stale.push(name);
  }
  const existing = await readdir(dir).catch(() => [] as string[]);
  stale.push(...existing.filter((f) => !files.has(f)));
  if (stale.length) {
    console.error(`Stale docs (run npm run gen:docs): ${stale.join(", ")}`);
    process.exit(1);
  }
  console.log(`docs up to date (${files.size} files)`);
} else {
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  for (const [name, content] of files) await writeFile(join(dir, name), content);
  await writeFile(skillPath, skillNew);
  console.log(`wrote ${files.size} files to ${dir}`);
}
