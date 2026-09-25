import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { ModrinthError } from "../errors.js";
import { hashFromCdnUrl, sha1 } from "../files.js";
import type { Project } from "../ops/shared.js";
import { expandGallery, type DesiredImage, type LoadedManifest } from "./manifest.js";

export interface Step {
  op: string;
  input: Record<string, unknown>;
  /** Human-readable diff line, e.g. `~ summary`. */
  change: string;
  destructive: boolean;
}

/** Local state with file contents already hashed, so planning stays pure. */
export interface Desired {
  project: string;
  update: Record<string, unknown>;
  icon?: { file: string; sha1: string };
  gallery?: (DesiredImage & { sha1: string })[];
}

export async function gatherDesired({ manifest: m, root }: LoadedManifest): Promise<Desired> {
  const md = m.metadata;
  const update: Record<string, unknown> = {};
  if (md.title !== undefined) update.title = md.title;
  if (md.summary !== undefined) update.summary = md.summary;
  if (md.body !== undefined) update.body = md.body;
  if (md.body_file !== undefined) update.body = await readFile(resolve(root, md.body_file), "utf8");
  if (md.categories !== undefined) update.categories = md.categories;
  if (md.additional_categories !== undefined) update.additional_categories = md.additional_categories;
  if (md.license !== undefined) update.license_id = md.license;
  if (md.license_url !== undefined) update.license_url = md.license_url;
  if (md.client_side !== undefined) update.client_side = md.client_side;
  if (md.server_side !== undefined) update.server_side = md.server_side;
  for (const k of ["source", "issues", "wiki", "discord"] as const) {
    if (m.links[k] !== undefined) update[`${k}_url`] = m.links[k] === "" ? null : m.links[k];
  }

  const desired: Desired = { project: m.project, update };
  if (md.icon) {
    const file = resolve(root, md.icon);
    desired.icon = { file, sha1: sha1(await readFile(file)) };
  }
  if (m.gallery) {
    const imgs = await expandGallery(m.gallery, root);
    desired.gallery = await Promise.all(imgs.map(async (i) => ({ ...i, sha1: sha1(await readFile(i.file)) })));
  }
  return desired;
}

const REMOTE_KEY: Record<string, string> = { summary: "description" };

function remoteValue(p: Project, key: string): unknown {
  if (key === "license_id") return p.license?.id;
  if (key === "license_url") return p.license?.url ?? null;
  return (p as Record<string, unknown>)[REMOTE_KEY[key] ?? key] ?? null;
}

const norm = (v: unknown) => (typeof v === "string" ? v.replace(/\r\n/g, "\n").trim() : v);
const same = (a: unknown, b: unknown) => {
  if (Array.isArray(a) && Array.isArray(b)) return JSON.stringify([...a].sort()) === JSON.stringify([...b].sort());
  return JSON.stringify(norm(a)) === JSON.stringify(norm(b));
};

/** Pure: desired + remote -> ordered steps. Only keys present in the manifest are compared. */
export function plan(desired: Desired, remote: Project, opts: { prune?: boolean } = {}): Step[] {
  const steps: Step[] = [];
  const project = remote.id;

  const changed = Object.fromEntries(Object.entries(desired.update).filter(([k, v]) => !same(v, remoteValue(remote, k))));
  if (Object.keys(changed).length) {
    steps.push({
      op: "project.update",
      input: { project, ...changed },
      change: Object.keys(changed).map((k) => `~ ${k}`).join(", "),
      destructive: false,
    });
  }

  if (desired.icon && hashFromCdnUrl(remote.icon_url) !== desired.icon.sha1) {
    steps.push({
      op: "project.icon.set",
      input: { project, file: desired.icon.file },
      change: `~ icon (${remote.icon_url ? "changed" : "new"})`,
      destructive: false,
    });
  }

  if (desired.gallery) {
    // raw_url (hash of the original upload) is returned by the API but missing from the spec.
    const remoteHash = (g: { url: string }) => hashFromCdnUrl((g as { raw_url?: string }).raw_url ?? g.url);
    const remoteImgs = (remote.gallery ?? []).filter((g) => g).map((g) => g!);
    const remoteByTitle = new Map(remoteImgs.map((g) => [g.title ?? "", g]));
    const seen = new Map<string, string>();
    for (const img of desired.gallery) {
      const dup = seen.get(img.sha1);
      if (dup) throw new ModrinthError("usage", `Gallery images "${dup}" and "${img.title}" are the same file; Modrinth rejects duplicate images.`);
      seen.set(img.sha1, img.title);
    }
    const wantedTitles = new Set(desired.gallery.map((i) => i.title));
    const wanted = new Set<string>();
    for (const img of desired.gallery) {
      wanted.add(img.title);
      let r = remoteByTitle.get(img.title);
      // Same file under a different, unclaimed title: rename in place instead of re-uploading.
      const renamed = !r && remoteImgs.find((g) => remoteHash(g) === img.sha1 && !wantedTitles.has(g.title ?? ""));
      if (renamed) {
        wanted.add(renamed.title ?? "");
        const input: Record<string, unknown> = { project, url: renamed.url, title: img.title, featured: img.featured };
        if (img.description !== undefined) input.description = img.description;
        if (img.ordering !== undefined) input.ordering = img.ordering;
        steps.push({ op: "gallery.update", input, change: `~ gallery "${renamed.title}" -> "${img.title}" (renamed)`, destructive: false });
        continue;
      }
      const add: Step = {
        op: "gallery.add",
        input: { project, file: img.file, title: img.title, description: img.description, featured: img.featured, ordering: img.ordering },
        change: `+ gallery "${img.title}"`,
        destructive: false,
      };
      if (!r) {
        steps.push(add);
      } else if (remoteHash(r) !== img.sha1) {
        steps.push({ op: "gallery.delete", input: { project, url: r.url }, change: `- gallery "${img.title}" (file changed)`, destructive: true });
        steps.push({ ...add, change: `+ gallery "${img.title}" (file changed)` });
      } else {
        const meta: Record<string, unknown> = {};
        if (!same(img.description ?? null, r.description ?? null)) meta.description = img.description ?? "";
        if (img.featured !== r.featured) meta.featured = img.featured;
        if (img.ordering !== undefined && img.ordering !== r.ordering) meta.ordering = img.ordering;
        if (Object.keys(meta).length) {
          steps.push({
            op: "gallery.update",
            input: { project, url: r.url, ...meta },
            change: `~ gallery "${img.title}" (${Object.keys(meta).join(", ")})`,
            destructive: false,
          });
        }
      }
    }
    if (opts.prune) {
      for (const [title, r] of remoteByTitle) {
        if (!wanted.has(title)) {
          steps.push({ op: "gallery.delete", input: { project, url: r.url }, change: `- gallery "${title}" (not in manifest)`, destructive: true });
        }
      }
    }
  }
  return steps;
}
