import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";

export const IMAGE_EXTS = ["png", "jpg", "jpeg", "bmp", "gif", "webp", "svg", "svgz", "rgb"] as const;

const MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  bmp: "image/bmp",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  svgz: "image/svg+xml",
  rgb: "image/x-rgb",
  jar: "application/java-archive",
  zip: "application/zip",
  mrpack: "application/x-modrinth-modpack+zip",
};

export function ext(path: string): string {
  return extname(path).slice(1).toLowerCase();
}

export async function loadFile(path: string) {
  const bytes = await readFile(path);
  const e = ext(path);
  return {
    name: basename(path),
    ext: e,
    bytes,
    blob: new Blob([bytes], { type: MIME[e] ?? "application/octet-stream" }),
    sha1: createHash("sha1").update(bytes).digest("hex"),
  };
}

export function sha1(bytes: Uint8Array): string {
  return createHash("sha1").update(bytes).digest("hex");
}

/** Modrinth stores uploaded images as `<sha1-of-original>.<ext>`; extract that hash from a CDN URL. */
export function hashFromCdnUrl(url: string | null | undefined): string | undefined {
  return url?.match(/\/([0-9a-f]{40})(?:_\d+)?\.[a-z0-9]+$/i)?.[1]?.toLowerCase();
}
