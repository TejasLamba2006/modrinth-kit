import { z } from "zod";
import { loadFile } from "../files.js";
import { defineOp } from "../op.js";
import { enc, getProject, projectId } from "./shared.js";

const meta = {
  title: z.string().optional(),
  description: z.string().optional(),
  ordering: z.number().int().optional().describe("Lower comes first"),
};

export const galleryList = defineOp({
  name: "gallery.list",
  tier: "read",
  summary: "List a project's gallery images (url identifies an image for update/delete)",
  input: z.object({ project: projectId }),
  positional: ["project"],
  run: async ({ project }, ctx) => (await getProject(ctx, project)).gallery ?? [],
});

export const galleryAdd = defineOp({
  name: "gallery.add",
  tier: "write",
  scope: "PROJECT_WRITE",
  summary: "Upload a gallery image (max 5 MiB)",
  input: z.object({ project: projectId, file: z.string().describe("Path to image"), featured: z.boolean().default(false), ...meta }),
  positional: ["project", "file"],
  async run({ project, file, ...q }, ctx) {
    const f = await loadFile(file);
    await ctx.client.request("POST", `/project/${enc(project)}/gallery`, {
      query: { ext: f.ext, ...q },
      body: f.blob,
      headers: { "Content-Type": f.blob.type },
      scope: "PROJECT_WRITE",
    });
    return { ok: true, project, file, sha1: f.sha1 };
  },
});

export const galleryUpdate = defineOp({
  name: "gallery.update",
  tier: "write",
  scope: "PROJECT_WRITE",
  summary: "Edit a gallery image's title, description, featured flag, or ordering",
  input: z.object({ project: projectId, url: z.string().url().describe("Image url from gallery.list"), featured: z.boolean().optional(), ...meta }),
  positional: ["project"],
  async run({ project, ...q }, ctx) {
    await ctx.client.request("PATCH", `/project/${enc(project)}/gallery`, { query: q, scope: "PROJECT_WRITE" });
    return { ok: true, project, url: q.url };
  },
});

export const galleryDelete = defineOp({
  name: "gallery.delete",
  tier: "destructive",
  scope: "PROJECT_WRITE",
  summary: "Delete a gallery image",
  input: z.object({ project: projectId, url: z.string().url().describe("Image url from gallery.list") }),
  positional: ["project"],
  async preview({ project, url }, ctx) {
    const img = (await getProject(ctx, project)).gallery?.find((g) => g?.url === url);
    return `delete gallery image ${img?.title ? `"${img.title}"` : url} from project ${project}`;
  },
  async run({ project, url }, ctx) {
    await ctx.client.request("DELETE", `/project/${enc(project)}/gallery`, { query: { url }, scope: "PROJECT_WRITE" });
    return { ok: true, project, deleted: url };
  },
});

export default [galleryList, galleryAdd, galleryUpdate, galleryDelete];
