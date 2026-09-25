// `modrinth skills install|update|list|uninstall`: copy the bundled agent skills into agent
// skill directories. For the long tail of agents, `npx skills add TejasLamba2006/modrinth-kit`.
import { cp, readdir, readFile, rm, stat } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ModrinthError } from "./errors.js";
import { VERSION } from "./version.js";

// dist/skills.js -> <pkg>/skills ; src/skills.ts -> <pkg>/skills
export const BUNDLED = resolve(dirname(fileURLToPath(import.meta.url)), "..", "skills");

/** Skill directories per agent: [project-relative, global]. */
export const AGENTS: Record<string, [string, string]> = {
  claude: [".claude/skills", join(homedir(), ".claude", "skills")],
  cursor: [".cursor/skills", join(homedir(), ".cursor", "skills")],
  codex: [".agents/skills", join(homedir(), ".codex", "skills")],
  agents: [".agents/skills", join(homedir(), ".agents", "skills")],
};

const exists = (p: string) => stat(p).then(() => true, () => false);

export async function bundledSkills(): Promise<string[]> {
  const entries = await readdir(BUNDLED, { withFileTypes: true }).catch(() => []);
  return entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
}

function targets(agents: string[] | undefined, global: boolean, cwd: string): { agent: string; dir: string }[] {
  const names = agents?.length ? agents : ["claude"];
  const unknown = names.filter((a) => !(a in AGENTS));
  if (unknown.length) {
    throw new ModrinthError("usage", `Unknown agent(s): ${unknown.join(", ")}`, undefined, `Known: ${Object.keys(AGENTS).join(", ")}. For others: npx skills add TejasLamba2006/modrinth-kit`);
  }
  const seen = new Set<string>();
  return names.flatMap((agent) => {
    const [proj, glob] = AGENTS[agent]!;
    const dir = global ? glob : resolve(cwd, proj);
    if (seen.has(dir)) return [];
    seen.add(dir);
    return [{ agent, dir }];
  });
}

export interface SkillsOptions {
  agents?: string[];
  global?: boolean;
  cwd?: string;
  force?: boolean;
}

/** Install (or with force, overwrite) the bundled skills. `update` = install with force. */
export async function installSkills(opts: SkillsOptions) {
  const skills = await bundledSkills();
  if (!skills.length) throw new ModrinthError("api", `No bundled skills found at ${BUNDLED}`);
  const out: { agent: string; dir: string; installed: string[]; skipped: string[] }[] = [];
  for (const { agent, dir } of targets(opts.agents, !!opts.global, opts.cwd ?? process.cwd())) {
    const installed: string[] = [];
    const skipped: string[] = [];
    for (const s of skills) {
      const dest = join(dir, s);
      if (!opts.force && (await exists(dest))) {
        skipped.push(s);
        continue;
      }
      await rm(dest, { recursive: true, force: true });
      await cp(join(BUNDLED, s), dest, { recursive: true });
      installed.push(s);
    }
    out.push({ agent, dir, installed, skipped });
  }
  const anySkipped = out.some((o) => o.skipped.length);
  return { version: VERSION, targets: out, ...(anySkipped ? { hint: "Some skills already existed; run `modrinth skills update` to overwrite them." } : {}) };
}

export async function uninstallSkills(opts: SkillsOptions) {
  const skills = await bundledSkills();
  const out = [];
  for (const { agent, dir } of targets(opts.agents, !!opts.global, opts.cwd ?? process.cwd())) {
    const removed: string[] = [];
    for (const s of skills) {
      if (await exists(join(dir, s))) {
        await rm(join(dir, s), { recursive: true, force: true });
        removed.push(s);
      }
    }
    out.push({ agent, dir, removed });
  }
  return { targets: out };
}

export async function listSkills() {
  const skills = await bundledSkills();
  return Promise.all(
    skills.map(async (name) => {
      const md = await readFile(join(BUNDLED, name, "SKILL.md"), "utf8");
      return { name, description: md.match(/^description:\s*(.+)$/m)?.[1]?.trim() };
    }),
  );
}
