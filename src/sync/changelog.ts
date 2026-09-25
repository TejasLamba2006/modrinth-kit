/**
 * Extract the section for `version` from a Keep-a-Changelog style file.
 * Matches headings like `## [1.4.5] - 2026-09-25`, `## 1.4.5`, `## v1.4.5`.
 * Returns undefined when the version has no section.
 */
export function extractChangelogSection(markdown: string, version: string): string | undefined {
  const v = version.replace(/^v/, "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const lines = markdown.split(/\r?\n/);
  const head = new RegExp(`^(#{1,3})\\s+\\[?v?${v}\\]?(\\s|$)`);
  const start = lines.findIndex((l) => head.test(l));
  if (start === -1) return undefined;
  const level = lines[start]!.match(/^#+/)![0].length;
  const next = new RegExp(`^#{1,${level}}\\s`);
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (next.test(lines[i]!)) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join("\n").trim();
}

export function inferChannel(version: string): "release" | "beta" | "alpha" {
  if (/alpha|-a\d*$/i.test(version)) return "alpha";
  if (/beta|rc|pre|-b\d*$/i.test(version)) return "beta";
  return "release";
}
