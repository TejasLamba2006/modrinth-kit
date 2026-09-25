// Organizations and analytics exist only on the v3 API (marked UNSTABLE upstream) and are
// absent from the official OpenAPI spec, so inputs are hand-typed from labrinth's routes:
// apps/labrinth/src/routes/v3/{organizations.rs,analytics_get/}.
import { z } from "zod";
import { loadFile } from "../files.js";
import { defineOp } from "../op.js";
import { enc, projectId, resolveUserId, strList } from "./shared.js";

const v3 = { api: "v3" as const };
const orgId = z.string().min(1).describe("Organization ID or slug");

export const orgGet = defineOp({
  name: "org.get",
  tier: "read",
  summary: "Get an organization (v3 API)",
  input: z.object({ org: orgId }),
  positional: ["org"],
  run: ({ org }, ctx) => ctx.client.request("GET", `/organization/${enc(org)}`, v3),
});

export const orgProjects = defineOp({
  name: "org.projects",
  tier: "read",
  summary: "List an organization's projects (v3 API)",
  input: z.object({ org: orgId }),
  positional: ["org"],
  run: ({ org }, ctx) => ctx.client.request("GET", `/organization/${enc(org)}/projects`, v3),
});

export const orgCreate = defineOp({
  name: "org.create",
  tier: "write",
  scope: "ORGANIZATION_CREATE",
  summary: "Create an organization (v3 API)",
  input: z.object({ slug: z.string().min(3).max(64), name: z.string().min(3).max(64), description: z.string().min(3).max(256) }),
  run: (json, ctx) => ctx.client.request("POST", "/organization", { ...v3, json, scope: "ORGANIZATION_CREATE" }),
});

export const orgUpdate = defineOp({
  name: "org.update",
  tier: "write",
  scope: "ORGANIZATION_WRITE",
  summary: "Edit an organization's slug, name, or description (v3 API)",
  input: z.object({ org: orgId, slug: z.string().optional(), name: z.string().optional(), description: z.string().optional() }),
  positional: ["org"],
  async run({ org, ...rest }, ctx) {
    const json = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
    await ctx.client.request("PATCH", `/organization/${enc(org)}`, { ...v3, json, scope: "ORGANIZATION_WRITE" });
    return { ok: true, org, updated: Object.keys(json) };
  },
});

export const orgIconSet = defineOp({
  name: "org.icon.set",
  tier: "write",
  scope: "ORGANIZATION_WRITE",
  summary: "Upload an organization icon (v3 API)",
  input: z.object({ org: orgId, file: z.string() }),
  positional: ["org", "file"],
  async run({ org, file }, ctx) {
    const f = await loadFile(file);
    await ctx.client.request("PATCH", `/organization/${enc(org)}/icon`, {
      ...v3,
      query: { ext: f.ext },
      body: f.blob,
      headers: { "Content-Type": f.blob.type },
      scope: "ORGANIZATION_WRITE",
    });
    return { ok: true, org };
  },
});

export const orgProjectAdd = defineOp({
  name: "org.project.add",
  tier: "write",
  scope: "PROJECT_WRITE",
  summary: "Move one of your projects into an organization (v3 API)",
  input: z.object({ org: orgId, project: projectId }),
  positional: ["org", "project"],
  async run({ org, project }, ctx) {
    await ctx.client.request("POST", `/organization/${enc(org)}/projects`, {
      ...v3,
      json: { project_id: project },
      scope: "PROJECT_WRITE ORGANIZATION_WRITE",
    });
    return { ok: true, org, project };
  },
});

export const orgProjectRemove = defineOp({
  name: "org.project.remove",
  tier: "destructive",
  scope: "PROJECT_WRITE",
  summary: "Remove a project from an organization, handing it to a new owner (v3 API)",
  input: z.object({ org: orgId, project: projectId, new_owner: z.string().describe("User ID or username; must be an org member") }),
  positional: ["org", "project"],
  preview: (i) => `remove project ${i.project} from organization ${i.org}; ${i.new_owner} becomes owner`,
  async run({ org, project, new_owner }, ctx) {
    const id = await resolveUserId(ctx, new_owner);
    await ctx.client.request("DELETE", `/organization/${enc(org)}/projects/${enc(project)}`, {
      ...v3,
      json: { new_owner: id },
      scope: "PROJECT_WRITE ORGANIZATION_WRITE",
    });
    return { ok: true, org, project, new_owner: id };
  },
});

export const orgDelete = defineOp({
  name: "org.delete",
  tier: "destructive",
  scope: "ORGANIZATION_DELETE",
  summary: "Delete an organization; its projects go back to the org owner (v3 API)",
  input: z.object({ org: orgId }),
  positional: ["org"],
  preview: (i) => `PERMANENTLY delete organization ${i.org}`,
  async run({ org }, ctx) {
    await ctx.client.request("DELETE", `/organization/${enc(org)}`, { ...v3, scope: "ORGANIZATION_DELETE" });
    return { ok: true, deleted: org };
  },
});

const METRICS = ["project_views", "project_downloads", "project_playtime", "project_revenue"] as const;

export const analytics = defineOp({
  name: "analytics.get",
  tier: "read",
  summary: "Fetch views/downloads/playtime/revenue time series for your projects (v3 API)",
  description:
    "Needs a token with ANALYTICS scope (revenue additionally needs PAYOUTS_READ). `bucket_by` groups results, " +
    "e.g. [\"project_id\",\"country\"]. Returns Modrinth's raw response: `metrics` is a list of time slices.",
  scope: "ANALYTICS",
  input: z.object({
    projects: strList.default([]).describe("Project IDs; empty = all your projects"),
    start: z.string().datetime(),
    end: z.string().datetime().optional().describe("Defaults to now"),
    slices: z.number().int().min(1).max(1024).default(30).describe("Number of time buckets"),
    metrics: z.array(z.enum(METRICS)).min(1).default(["project_downloads", "project_views"]),
    bucket_by: strList.default(["project_id"]),
  }),
  examples: [{ args: { start: "2026-09-01T00:00:00Z", metrics: ["project_downloads"] }, note: "Downloads this month" }],
  async run(i, ctx) {
    // Analytics wants real IDs, not slugs.
    const ids = await Promise.all(
      i.projects.map(async (p) => (await ctx.client.request<{ id: string }>("GET", `/project/${enc(p)}/check`)).id),
    );
    const return_metrics = Object.fromEntries(i.metrics.map((m) => [m, { bucket_by: i.bucket_by }]));
    return ctx.client.request("POST", "/analytics", {
      ...v3,
      json: {
        time_range: { start: i.start, end: i.end ?? new Date().toISOString(), resolution: { slices: i.slices } },
        return_metrics,
        project_ids: ids,
      },
      scope: "ANALYTICS",
    });
  },
});

export default [orgGet, orgProjects, orgCreate, orgUpdate, orgIconSet, orgProjectAdd, orgProjectRemove, orgDelete, analytics];
