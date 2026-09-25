import { z } from "zod";
import { loadFile } from "../files.js";
import { defineOp } from "../op.js";
import { enc, projectId, strList, versionId, type Version } from "./shared.js";

const channel = z.enum(["release", "beta", "alpha"]);
const fileType = z.enum(["required-resource-pack", "optional-resource-pack", "sources-jar", "dev-jar", "javadoc-jar", "signature", "unknown"]);
const dependency = z.object({
  project_id: z.string().optional(),
  version_id: z.string().optional(),
  file_name: z.string().optional(),
  dependency_type: z.enum(["required", "optional", "incompatible", "embedded"]),
});

const versionStatus = z.enum(["listed", "archived", "draft", "unlisted"]);

export const versionList = defineOp({
  name: "version.list",
  tier: "read",
  summary: "List a project's versions, optionally filtered by loader / game version / featured",
  input: z.object({
    project: projectId,
    loaders: strList.optional(),
    game_versions: strList.optional(),
    featured: z.boolean().optional(),
  }),
  positional: ["project"],
  run: ({ project, ...q }, ctx) => ctx.client.request<Version[]>("GET", `/project/${enc(project)}/version`, { query: q }),
});

export const versionGet = defineOp({
  name: "version.get",
  tier: "read",
  summary: "Get a version by ID, or by project + version number",
  input: z.object({
    version: z.string().min(1).describe("Version ID, or version number when `project` is given"),
    project: projectId.optional(),
  }),
  positional: ["version"],
  examples: [{ args: { project: "adminwatchdog", version: "1.4.5" }, note: "by version number" }],
  run: ({ version, project }, ctx) =>
    ctx.client.request<Version>("GET", project ? `/project/${enc(project)}/version/${enc(version)}` : `/version/${enc(version)}`),
});

export const versionFromHash = defineOp({
  name: "version.from-hash",
  tier: "read",
  summary: "Find the version that contains a file with this hash",
  input: z.object({ hash: z.string(), algorithm: z.enum(["sha1", "sha512"]).default("sha1") }),
  positional: ["hash"],
  run: ({ hash, algorithm }, ctx) => ctx.client.request("GET", `/version_file/${enc(hash)}`, { query: { algorithm } }),
});

export const versionCreate = defineOp({
  name: "version.create",
  tier: "write",
  scope: "VERSION_CREATE",
  summary: "Publish a new version by uploading one or more files (.jar/.zip/.mrpack)",
  description:
    "The first file is the primary file unless `primary` is set. `file_types` marks extra files (e.g. sources-jar). " +
    "For CI, prefer `modrinth publish`, which reads defaults from modrinth.toml and is idempotent.",
  input: z.object({
    project: projectId,
    version_number: z.string().min(1),
    name: z.string().optional().describe("Display name; defaults to version_number"),
    files: strList.min(1).describe("Paths to files to upload"),
    primary: z.string().optional().describe("Which of `files` is primary (path); defaults to the first"),
    file_types: z.record(z.string(), fileType).optional().describe("Map of file path -> file type for non-primary files"),
    loaders: strList.min(1),
    game_versions: strList.min(1),
    version_type: channel.default("release"),
    changelog: z.string().optional(),
    dependencies: z.array(dependency).default([]),
    featured: z.boolean().default(false),
    status: versionStatus.optional(),
  }),
  positional: ["project"],
  examples: [
    {
      args: { project: "adminwatchdog", version_number: "1.4.6", files: ["target/AdminWatchdog.jar"], loaders: ["paper", "folia"], game_versions: ["1.21.11"] },
      note: "Upload a plugin jar",
    },
  ],
  async run(i, ctx) {
    const project = await ctx.client.request<{ id: string }>("GET", `/project/${enc(i.project)}/check`);
    const primaryPath = i.primary ?? i.files[0]!;
    const form = new FormData();
    const parts: string[] = [];
    const fileTypes: Record<string, string> = {};
    const loaded = await Promise.all(i.files.map(loadFile));
    loaded.forEach((f, idx) => {
      const part = `file${idx}`;
      parts.push(part);
      const t = i.file_types?.[i.files[idx]!];
      if (t) fileTypes[part] = t;
    });
    form.set(
      "data",
      JSON.stringify({
        project_id: project.id,
        version_number: i.version_number,
        name: i.name ?? i.version_number,
        changelog: i.changelog ?? null,
        dependencies: i.dependencies,
        game_versions: i.game_versions,
        version_type: i.version_type,
        loaders: i.loaders,
        featured: i.featured,
        status: i.status,
        file_parts: parts,
        primary_file: parts[i.files.indexOf(primaryPath)] ?? parts[0],
        file_types: fileTypes,
      }),
    );
    loaded.forEach((f, idx) => form.set(parts[idx]!, f.blob, f.name));
    return ctx.client.request<Version>("POST", "/version", { body: form, scope: "VERSION_CREATE" });
  },
});

export const versionUpdate = defineOp({
  name: "version.update",
  tier: "write",
  scope: "VERSION_WRITE",
  summary: "Edit a version's name, number, changelog, loaders, game versions, channel, deps, status, primary file",
  input: z.object({
    version: versionId,
    name: z.string().optional(),
    version_number: z.string().optional(),
    changelog: z.string().nullable().optional(),
    loaders: strList.optional(),
    game_versions: strList.optional(),
    version_type: channel.optional(),
    dependencies: z.array(dependency).optional(),
    featured: z.boolean().optional(),
    status: versionStatus.optional(),
    primary_file_sha1: z.string().optional().describe("sha1 of the file to make primary"),
  }),
  positional: ["version"],
  async run({ version, primary_file_sha1, ...rest }, ctx) {
    const body: Record<string, unknown> = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
    if (primary_file_sha1) body.primary_file = ["sha1", primary_file_sha1];
    await ctx.client.request("PATCH", `/version/${enc(version)}`, { json: body, scope: "VERSION_WRITE" });
    return { ok: true, version, updated: Object.keys(body) };
  },
});

export const versionFileAdd = defineOp({
  name: "version.file.add",
  tier: "write",
  scope: "VERSION_WRITE",
  summary: "Attach extra files to an existing version",
  input: z.object({ version: versionId, files: strList.min(1), file_types: z.record(z.string(), fileType).optional() }),
  positional: ["version"],
  async run({ version, files, file_types }, ctx) {
    const form = new FormData();
    const types: Record<string, string> = {};
    const loaded = await Promise.all(files.map(loadFile));
    loaded.forEach((f, idx) => {
      form.set(`file${idx}`, f.blob, f.name);
      const t = file_types?.[files[idx]!];
      if (t) types[`file${idx}`] = t;
    });
    form.set("data", JSON.stringify({ file_types: types }));
    await ctx.client.request("POST", `/version/${enc(version)}/file`, { body: form, scope: "VERSION_WRITE" });
    return { ok: true, version, added: loaded.map((f) => ({ name: f.name, sha1: f.sha1 })) };
  },
});

export const versionFileDelete = defineOp({
  name: "version.file.delete",
  tier: "destructive",
  scope: "VERSION_WRITE",
  summary: "Delete a single file (by hash) from its version",
  input: z.object({ hash: z.string(), algorithm: z.enum(["sha1", "sha512"]).default("sha1") }),
  positional: ["hash"],
  async preview({ hash, algorithm }, ctx) {
    const v = await ctx.client.request<Version>("GET", `/version_file/${enc(hash)}`, { query: { algorithm } });
    const f = v.files?.find((x) => x.hashes?.sha1 === hash || x.hashes?.sha512 === hash);
    return `delete file ${f?.filename ?? hash} from version ${v.version_number} (${v.id})`;
  },
  async run({ hash, algorithm }, ctx) {
    await ctx.client.request("DELETE", `/version_file/${enc(hash)}`, { query: { algorithm }, scope: "VERSION_WRITE" });
    return { ok: true, deleted: hash };
  },
});

export const versionSchedule = defineOp({
  name: "version.schedule",
  tier: "destructive",
  scope: "VERSION_WRITE",
  summary: "Schedule a version to change status (e.g. become listed) at a future time",
  input: z.object({ version: versionId, time: z.string().datetime(), requested_status: versionStatus }),
  positional: ["version"],
  preview: (i) => `schedule version ${i.version} to become ${i.requested_status} at ${i.time}`,
  async run({ version, ...json }, ctx) {
    await ctx.client.request("POST", `/version/${enc(version)}/schedule`, { json, scope: "VERSION_WRITE" });
    return { ok: true, version, ...json };
  },
});

export const versionDelete = defineOp({
  name: "version.delete",
  tier: "destructive",
  scope: "VERSION_DELETE",
  summary: "Delete a version and its files",
  input: z.object({ version: versionId }),
  positional: ["version"],
  async preview({ version }, ctx) {
    const v = await ctx.client.request<Version>("GET", `/version/${enc(version)}`);
    return `delete version ${v.version_number} (${v.id}) with ${v.files?.length ?? 0} file(s) and ${v.downloads} downloads`;
  },
  async run({ version }, ctx) {
    await ctx.client.request("DELETE", `/version/${enc(version)}`, { scope: "VERSION_DELETE" });
    return { ok: true, deleted: version };
  },
});

export default [
  versionList,
  versionGet,
  versionFromHash,
  versionCreate,
  versionUpdate,
  versionFileAdd,
  versionFileDelete,
  versionSchedule,
  versionDelete,
];
