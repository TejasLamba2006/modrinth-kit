// Remaining scope-B author tools: team invites, bulk edits, hash lookups, disclosures.
import { z } from "zod";
import { defineOp } from "../op.js";
import { enc, getProject, projectId, strList } from "./shared.js";

const hashAlgo = z.enum(["sha1", "sha512"]).default("sha1");
const channel = z.array(z.enum(["release", "beta", "alpha"]));

export const teamJoin = defineOp({
  name: "team.join",
  tier: "write",
  scope: "PROJECT_WRITE",
  summary: "Accept a pending invite to a project's team",
  description: "Pass the project (its team is looked up) or a team ID. Pending invites also show up in `notification list`.",
  input: z.object({ project: projectId.optional(), team: z.string().optional() }).refine((i) => !!i.project !== !!i.team, {
    message: "Pass exactly one of `project` or `team`",
  }),
  positional: ["project"],
  async run({ project, team }, ctx) {
    const id = team ?? (await getProject(ctx, project!)).team;
    await ctx.client.request("POST", `/team/${enc(id)}/join`, { scope: "PROJECT_WRITE" });
    return { ok: true, joined: id };
  },
});

export const projectBulkUpdate = defineOp({
  name: "project.bulk-update",
  tier: "write",
  scope: "PROJECT_WRITE",
  summary: "Edit categories and links on many projects at once",
  description: "`categories` replaces; `add_*`/`remove_*` change incrementally. Links set to null are cleared on every project.",
  input: z.object({
    projects: strList.min(1).describe("Project IDs"),
    categories: strList.max(3).optional(),
    add_categories: strList.max(3).optional(),
    remove_categories: strList.optional(),
    additional_categories: strList.optional(),
    add_additional_categories: strList.optional(),
    remove_additional_categories: strList.optional(),
    issues_url: z.string().url().nullable().optional(),
    source_url: z.string().url().nullable().optional(),
    wiki_url: z.string().url().nullable().optional(),
    discord_url: z.string().url().nullable().optional(),
  }),
  async run({ projects, ...rest }, ctx) {
    const json = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
    await ctx.client.request("PATCH", "/projects", { query: { ids: projects }, json, scope: "PROJECT_WRITE" });
    return { ok: true, projects, updated: Object.keys(json) };
  },
});

export const versionFromHashes = defineOp({
  name: "version.from-hashes",
  tier: "read",
  summary: "Look up the versions containing each of several file hashes (returns hash -> version)",
  input: z.object({ hashes: strList.min(1), algorithm: hashAlgo }),
  run: (json, ctx) => ctx.client.request("POST", "/version_files", { json }),
});

export const versionLatest = defineOp({
  name: "version.latest",
  tier: "read",
  summary: "Given file hash(es), find the newest compatible version of each project (update checking)",
  description: "One hash returns a version; several return a hash -> version map.",
  input: z.object({
    hashes: strList.min(1),
    algorithm: hashAlgo,
    loaders: strList.min(1),
    game_versions: strList.min(1),
    version_types: channel.optional(),
  }),
  run({ hashes, algorithm, ...filter }, ctx) {
    if (hashes.length === 1) {
      return ctx.client.request("POST", `/version_file/${enc(hashes[0]!)}/update`, { query: { algorithm }, json: filter });
    }
    return ctx.client.request("POST", "/version_files/update", { json: { hashes, algorithm, ...filter } });
  },
});

// v3 only; shape from apps/labrinth/src/models/v3/disclosures.rs
const disclosure = z
  .object({ type: z.enum(["ai_content", "ai_functionality", "advertisements", "epilepsy_triggers", "system_interactions", "telemetry", "derivative_work", "paid_features", "archived"]) })
  .passthrough()
  .describe(
    'Tagged object, e.g. {"type":"telemetry","consent":"opt_in","data_collected":["crashes"]} or {"type":"ai_content","uses":["code"],"note":null}',
  );

export const disclosuresGet = defineOp({
  name: "project.disclosures.get",
  tier: "read",
  scope: "PROJECT_READ",
  summary: "Get a project's content disclosures (AI use, telemetry, ads, paid features...) (v3 API)",
  input: z.object({ project: projectId }),
  positional: ["project"],
  async run({ project }, ctx) {
    const { id } = await ctx.client.request<{ id: string }>("GET", `/project/${enc(project)}/check`);
    return ctx.client.request("GET", `/project/${enc(id)}/disclosures`, { api: "v3", scope: "PROJECT_READ" });
  },
});

export const disclosuresSet = defineOp({
  name: "project.disclosures.set",
  tier: "write",
  scope: "PROJECT_WRITE",
  summary: "Add/replace or remove content disclosures on a project (v3 API)",
  input: z.object({
    project: projectId,
    set: z.array(disclosure).default([]),
    remove: strList.default([]).describe("Disclosure types to remove"),
  }),
  positional: ["project"],
  examples: [{ args: { project: "my-plugin", set: [{ type: "telemetry", consent: "opt_in", data_collected: ["errors"] }] }, note: "Declare opt-in telemetry" }],
  async run({ project, set, remove }, ctx) {
    const { id } = await ctx.client.request<{ id: string }>("GET", `/project/${enc(project)}/check`);
    await ctx.client.request("PATCH", `/project/${enc(id)}/disclosures`, { api: "v3", json: { set, remove }, scope: "PROJECT_WRITE" });
    return { ok: true, project, set: set.map((d) => d.type), removed: remove };
  },
});

export default [teamJoin, projectBulkUpdate, versionFromHashes, versionLatest, disclosuresGet, disclosuresSet];
