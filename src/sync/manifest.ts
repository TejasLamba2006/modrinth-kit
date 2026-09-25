import { glob, readFile } from "node:fs/promises";
import { basename, dirname, extname, resolve } from "node:path";
import { parse } from "smol-toml";
import { z } from "zod";
import { ModrinthError } from "../errors.js";

const side = z.enum(["required", "optional", "unsupported"]);

const galleryEntry = z.union([
  z.object({
    file: z.string(),
    title: z.string().optional(),
    description: z.string().optional(),
    featured: z.boolean().default(false),
    ordering: z.number().int().optional(),
  }),
  z.object({ files: z.string().describe("glob") }),
]);

export const manifestSchema = z.object({
  project: z.string(),
  metadata: z
    .object({
      title: z.string(),
      summary: z.string(),
      body: z.string(),
      body_file: z.string(),
      icon: z.string(),
      categories: z.array(z.string()),
      additional_categories: z.array(z.string()),
      license: z.string(),
      license_url: z.string().nullable(),
      client_side: side,
      server_side: side,
    })
    .partial()
    .strict()
    .default({}),
  links: z
    .object({ source: z.string(), issues: z.string(), wiki: z.string(), discord: z.string() })
    .partial()
    .strict()
    .default({}),
  gallery: z.array(galleryEntry).optional(),
  version: z
    .object({
      files: z.array(z.string()).min(1),
      loaders: z.array(z.string()).min(1),
      game_versions: z.array(z.string()).min(1),
      channel: z.enum(["release", "beta", "alpha"]).optional(),
      changelog: z.string().optional(),
      changelog_file: z.string().optional(),
      changelog_section: z.boolean().default(true),
      featured: z.boolean().default(false),
      name: z.string().optional().describe("Name template; {version} is replaced"),
      dependencies: z
        .array(
          z.object({
            project: z.string(),
            type: z.enum(["required", "optional", "incompatible", "embedded"]).default("required"),
            version_id: z.string().optional(),
          }),
        )
        .default([]),
    })
    .strict()
    .optional(),
});

export type Manifest = z.infer<typeof manifestSchema>;

export interface LoadedManifest {
  manifest: Manifest;
  /** Directory the manifest lives in; relative paths resolve against it. */
  root: string;
  path: string;
}

export async function loadManifest(path = "modrinth.toml"): Promise<LoadedManifest> {
  const abs = resolve(path);
  let text: string;
  try {
    text = await readFile(abs, "utf8");
  } catch {
    throw new ModrinthError("usage", `No manifest at ${abs}`, undefined, "Run `modrinth init --project <slug>` to create one.");
  }
  let raw: unknown;
  try {
    raw = parse(text);
  } catch (e) {
    throw new ModrinthError("invalid", `${abs}: ${(e as Error).message}`);
  }
  const res = manifestSchema.safeParse(raw);
  if (!res.success) {
    throw new ModrinthError(
      "invalid",
      `${abs}: ` + res.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "),
    );
  }
  return { manifest: res.data, root: dirname(abs), path: abs };
}

export interface DesiredImage {
  file: string;
  title: string;
  description?: string;
  featured: boolean;
  ordering?: number;
}

/** Expand explicit entries and globs; explicit entries win for the same file. Globs sort alphabetically. */
export async function expandGallery(entries: Manifest["gallery"], root: string): Promise<DesiredImage[]> {
  if (!entries) return [];
  const out = new Map<string, DesiredImage>();
  const explicit = new Set<string>();
  for (const e of entries) {
    if ("file" in e) {
      const file = resolve(root, e.file);
      explicit.add(file);
      out.set(file, { ...e, file, title: e.title ?? stem(file) });
    }
  }
  for (const e of entries) {
    if ("files" in e) {
      const matches: string[] = [];
      for await (const m of glob(e.files, { cwd: root })) matches.push(resolve(root, m));
      for (const file of matches.sort()) {
        if (!explicit.has(file) && !out.has(file)) out.set(file, { file, title: stem(file), featured: false });
      }
    }
  }
  return [...out.values()];
}

export async function expandFiles(patterns: string[], root: string): Promise<string[]> {
  const out: string[] = [];
  for (const p of patterns) {
    const matches: string[] = [];
    for await (const m of glob(p, { cwd: root })) matches.push(resolve(root, m));
    if (!matches.length) throw new ModrinthError("usage", `No files match ${p} (relative to ${root})`);
    for (const m of matches.sort()) if (!out.includes(m)) out.push(m);
  }
  return out;
}

const stem = (f: string) => basename(f, extname(f));
