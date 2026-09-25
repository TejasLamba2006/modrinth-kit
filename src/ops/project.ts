import { z } from "zod";
import { loadFile } from "../files.js";
import { defineOp } from "../op.js";
import { enc, getProject, projectId, strList } from "./shared.js";

const side = z.enum(["required", "optional", "unsupported"]);
const donation = z.object({ id: z.string().describe("Platform id, see `tag list donation_platform`"), platform: z.string().optional(), url: z.string().url() });

/** Fields editable via PATCH /project and settable at creation. */
const editable = {
  slug: z.string().min(3).max(64).optional(),
  title: z.string().min(3).max(64).optional(),
  summary: z.string().min(3).max(255).optional().describe("Short description shown in search (API field `description`)"),
  body: z.string().max(65536).optional().describe("Long markdown description"),
  categories: strList.max(3).optional().describe("Up to 3 primary categories (see `tag list category`)"),
  additional_categories: strList.optional().describe("Secondary categories, not shown prominently"),
  issues_url: z.string().url().nullable().optional(),
  source_url: z.string().url().nullable().optional(),
  wiki_url: z.string().url().nullable().optional(),
  discord_url: z.string().url().nullable().optional(),
  donation_urls: z.array(donation).optional(),
  license_id: z.string().optional().describe("SPDX id, or LicenseRef-<name> for custom"),
  license_url: z.string().url().nullable().optional(),
  client_side: side.optional(),
  server_side: side.optional(),
};

type Editable = { [K in keyof typeof editable]?: z.infer<(typeof editable)[K]> };

/** Our input uses `summary`; Modrinth's API calls it `description`. */
function toApi(i: Editable): Record<string, unknown> {
  const { summary, ...rest } = i;
  const out: Record<string, unknown> = { ...rest };
  if (summary !== undefined) out.description = summary;
  for (const k of Object.keys(out)) if (out[k] === undefined) delete out[k];
  return out;
}

export const projectGet = defineOp({
  name: "project.get",
  tier: "read",
  summary: "Get a project's full metadata (body, gallery, links, team id, status...)",
  input: z.object({ project: projectId }),
  positional: ["project"],
  examples: [{ args: { project: "sodium" }, note: "by slug" }],
  run: ({ project }, ctx) => getProject(ctx, project),
});

export const projectGetMany = defineOp({
  name: "project.get-many",
  tier: "read",
  summary: "Get several projects at once",
  input: z.object({ projects: strList.min(1).describe("Project IDs or slugs") }),
  run: ({ projects }, ctx) => ctx.client.request("GET", "/projects", { query: { ids: projects } }),
});

export const projectCheckSlug = defineOp({
  name: "project.check-slug",
  tier: "read",
  summary: "Check whether a slug/ID is taken; returns {id} if it exists, not_found otherwise",
  input: z.object({ project: projectId }),
  positional: ["project"],
  run: ({ project }, ctx) => ctx.client.request("GET", `/project/${enc(project)}/check`),
});

export const projectDependencies = defineOp({
  name: "project.dependencies",
  tier: "read",
  summary: "List every project and version this project's versions depend on",
  input: z.object({ project: projectId }),
  positional: ["project"],
  run: ({ project }, ctx) => ctx.client.request("GET", `/project/${enc(project)}/dependencies`),
});

export const projectCreate = defineOp({
  name: "project.create",
  tier: "write",
  scope: "PROJECT_CREATE",
  summary: "Create a new project as a draft (submit it for review later with project.submit)",
  description:
    "Plugins use project_type `mod` on the v2 API; the loaders on its versions (paper, spigot...) make it a plugin. " +
    "Always created as a draft so nothing is public until you run project.submit.",
  input: z.object({
    ...editable,
    slug: editable.slug.unwrap(),
    title: editable.title.unwrap(),
    summary: editable.summary.unwrap(),
    body: z.string().max(65536).default(""),
    categories: strList.max(3).default([]),
    client_side: side,
    server_side: side,
    license_id: z.string(),
    project_type: z.enum(["mod", "modpack", "resourcepack", "shader"]).default("mod"),
    icon: z.string().optional().describe("Path to an icon image file"),
  }),
  examples: [
    {
      args: { slug: "my-plugin", title: "My Plugin", summary: "Does things", license_id: "MIT", client_side: "unsupported", server_side: "required" },
      note: "Minimal server plugin draft",
    },
  ],
  async run({ icon, project_type, ...rest }, ctx) {
    const form = new FormData();
    form.set(
      "data",
      JSON.stringify({ ...toApi(rest), project_type, is_draft: true, initial_versions: [], additional_categories: rest.additional_categories ?? [] }),
    );
    if (icon) {
      const f = await loadFile(icon);
      form.set("icon", f.blob, f.name);
    }
    return ctx.client.request("POST", "/project", { body: form, scope: "PROJECT_CREATE" });
  },
});

export const projectUpdate = defineOp({
  name: "project.update",
  tier: "write",
  scope: "PROJECT_WRITE",
  summary: "Edit project metadata: title, summary, body, links, license, categories, sides, slug, status",
  description:
    "Only the fields you pass are changed; pass null to clear a link. Setting `status`/`requested_status` is treated as " +
    "destructive (it can make a project public or hide it) and needs confirmation.",
  input: z.object({
    project: projectId,
    ...editable,
    status: z.enum(["approved", "archived", "unlisted", "private", "draft", "processing"]).optional(),
    requested_status: z.enum(["approved", "archived", "unlisted", "private", "draft"]).nullable().optional(),
  }),
  positional: ["project"],
  destructiveIf: (i) => i.status !== undefined || i.requested_status !== undefined,
  preview: (i) => `change status of project ${i.project} to ${i.status ?? i.requested_status}`,
  examples: [{ args: { project: "my-plugin", summary: "New summary", source_url: "https://github.com/me/my-plugin" }, note: "Edit summary and source link" }],
  async run({ project, status, requested_status, ...rest }, ctx) {
    const body = toApi(rest);
    if (status !== undefined) body.status = status;
    if (requested_status !== undefined) body.requested_status = requested_status;
    await ctx.client.request("PATCH", `/project/${enc(project)}`, { json: body, scope: "PROJECT_WRITE" });
    return { ok: true, project, updated: Object.keys(body) };
  },
});

export const projectSubmit = defineOp({
  name: "project.submit",
  tier: "destructive",
  scope: "PROJECT_WRITE",
  summary: "Submit a draft project for Modrinth moderator review (it goes public once approved)",
  input: z.object({
    project: projectId,
    requested_status: z.enum(["approved", "unlisted", "private", "archived"]).default("approved").describe("Status to receive after approval"),
  }),
  positional: ["project"],
  preview: (i) => `submit project ${i.project} for review (requested status after approval: ${i.requested_status})`,
  async run({ project, requested_status }, ctx) {
    await ctx.client.request("PATCH", `/project/${enc(project)}`, {
      json: { status: "processing", requested_status },
      scope: "PROJECT_WRITE",
    });
    return { ok: true, project, status: "processing" };
  },
});

export const projectDelete = defineOp({
  name: "project.delete",
  tier: "destructive",
  scope: "PROJECT_DELETE",
  summary: "Permanently delete a project and all its versions",
  input: z.object({ project: projectId }),
  positional: ["project"],
  async preview({ project }, ctx) {
    const p = await getProject(ctx, project);
    return `PERMANENTLY delete project "${p.title}" (${p.slug}, ${p.id}) with ${p.versions?.length ?? 0} versions and ${p.downloads} downloads`;
  },
  async run({ project }, ctx) {
    await ctx.client.request("DELETE", `/project/${enc(project)}`, { scope: "PROJECT_DELETE" });
    return { ok: true, deleted: project };
  },
});

export const iconSet = defineOp({
  name: "project.icon.set",
  tier: "write",
  scope: "PROJECT_WRITE",
  summary: "Upload a new project icon (max 256 KiB; png/jpg/webp/gif/svg...)",
  input: z.object({ project: projectId, file: z.string().describe("Path to image") }),
  positional: ["project", "file"],
  async run({ project, file }, ctx) {
    const f = await loadFile(file);
    await ctx.client.request("PATCH", `/project/${enc(project)}/icon`, {
      query: { ext: f.ext },
      body: f.blob,
      headers: { "Content-Type": f.blob.type },
      scope: "PROJECT_WRITE",
    });
    return { ok: true, project, sha1: f.sha1 };
  },
});

export const iconDelete = defineOp({
  name: "project.icon.delete",
  tier: "destructive",
  scope: "PROJECT_WRITE",
  summary: "Remove the project icon",
  input: z.object({ project: projectId }),
  positional: ["project"],
  preview: (i) => `remove the icon of project ${i.project}`,
  async run({ project }, ctx) {
    await ctx.client.request("DELETE", `/project/${enc(project)}/icon`, { scope: "PROJECT_WRITE" });
    return { ok: true, project };
  },
});

export default [
  projectGet,
  projectGetMany,
  projectCheckSlug,
  projectDependencies,
  projectCreate,
  projectUpdate,
  projectSubmit,
  projectDelete,
  iconSet,
  iconDelete,
];
