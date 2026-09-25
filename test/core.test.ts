import assert from "node:assert/strict";
import { test } from "node:test";
import { mapError } from "../src/client/http.js";
import { hashFromCdnUrl } from "../src/files.js";
import { effectiveTier, execute, isConfirmRequired } from "../src/op.js";
import { findOp } from "../src/ops/index.js";
import { fromBitfield, toBitfield } from "../src/ops/shared.js";
import { extractChangelogSection, inferChannel } from "../src/sync/changelog.js";
import { plan, type Desired } from "../src/sync/plan.js";
import { allowedTiers } from "../src/mcp/server.js";
import { parseArgv } from "../src/cli/args.js";
import { ModrinthClient } from "../src/client/http.js";

const CL = `# Changelog

## [1.4.5] - 2026-09-25

### Fixed
- thing

## [1.4.4] - 2026-09-12
- older
`;

test("changelog section extraction", () => {
  assert.equal(extractChangelogSection(CL, "1.4.5"), "### Fixed\n- thing");
  assert.equal(extractChangelogSection(CL, "v1.4.4"), "- older");
  assert.equal(extractChangelogSection(CL, "1.4"), undefined);
});

test("channel inference", () => {
  assert.equal(inferChannel("1.0.0"), "release");
  assert.equal(inferChannel("1.0.0-beta.2"), "beta");
  assert.equal(inferChannel("1.0.0-rc1"), "beta");
  assert.equal(inferChannel("2.0-alpha"), "alpha");
});

test("cdn hash extraction", () => {
  const h = "d84313e6f57dc9e7896961dbd2dfc2689d482758";
  assert.equal(hashFromCdnUrl(`https://cdn.modrinth.com/data/X/images/${h}_350.webp`), h);
  assert.equal(hashFromCdnUrl(`https://cdn.modrinth.com/data/X/${h}.png`), h);
  assert.equal(hashFromCdnUrl(null), undefined);
});

test("permission bitfield round-trip", () => {
  assert.equal(toBitfield(["UPLOAD_VERSION", "EDIT_BODY"]), 0b1001);
  assert.deepEqual(fromBitfield(0b1001), ["UPLOAD_VERSION", "EDIT_BODY"]);
  assert.equal(toBitfield(127), 127);
});

test("error mapping", () => {
  assert.equal(mapError(401, {}, "GET", "/x", "PROJECT_WRITE", true).code, "auth");
  assert.match(mapError(401, {}, "GET", "/x", "PROJECT_WRITE", true).hint!, /PROJECT_WRITE/);
  assert.match(mapError(401, {}, "GET", "/x", undefined, false).hint!, /MODRINTH_TOKEN/);
  assert.equal(mapError(404, {}, "GET", "/x", undefined, true).code, "not_found");
  assert.equal(mapError(400, { description: "bad slug" }, "GET", "/x", undefined, true).message, "bad slug");
  assert.equal(mapError(502, "", "GET", "/x", undefined, true).code, "api");
});

test("tier gating: destructive ops preview without confirm, never hit the network", async () => {
  const client = new ModrinthClient({ token: "t", fetch: (async () => assert.fail("network called")) as typeof fetch });
  const r = await execute(findOp("team.member.remove")!, { project: "p", user: "u" }, { client, confirm: false });
  assert.ok(isConfirmRequired(r));
  assert.equal(effectiveTier(findOp("project.update")!, { project: "p", status: "approved" }), "destructive");
  assert.equal(effectiveTier(findOp("project.update")!, { project: "p", title: "x" }), "write");
  assert.equal(findOp("gallery.delete")!.tier, "destructive");
});

test("write ops require a token", async () => {
  const client = new ModrinthClient({ fetch: (async () => assert.fail("network called")) as typeof fetch });
  await assert.rejects(execute(findOp("project.icon.set")!, { project: "p", file: "x.png" }, { client, confirm: true }), /requires a token/);
});

test("MCP tier filter", () => {
  assert.deepEqual([...allowedTiers({ readOnly: true })], ["read"]);
  assert.deepEqual([...allowedTiers({ allow: ["read", "write", "bogus"] })], ["read", "write"]);
  assert.equal(allowedTiers({}).size, 3);
});

test("argv parsing", () => {
  const p = parseArgv(["project", "get", "x", "--game-versions", "1.21", "--game-versions=1.20", "--yes", "--no-featured"], new Set(["yes", "featured"]));
  assert.deepEqual(p.positionals, ["project", "get", "x"]);
  assert.deepEqual(p.flags.get("game_versions"), ["1.21", "1.20"]);
  assert.deepEqual(p.flags.get("yes"), ["true"]);
  assert.deepEqual(p.flags.get("featured"), ["false"]);
});

const H1 = "a".repeat(40);
const H2 = "b".repeat(40);
const H3 = "c".repeat(40);
const remote = {
  id: "PID",
  slug: "p",
  title: "Old",
  description: "Summary",
  body: "Body\r\n",
  categories: ["utility", "admin"],
  license: { id: "MIT", name: "MIT", url: null },
  source_url: null,
  icon_url: `https://cdn.modrinth.com/data/PID/${H1}_96.webp`,
  gallery: [
    { url: "u1", raw_url: `https://cdn/x/${H1}.png`, title: "Keep", description: "d", featured: false, ordering: 0, created: "" },
    { url: "u2", raw_url: `https://cdn/x/${H1}.png`, title: "Changed", featured: false, created: "" },
    { url: "u3", raw_url: `https://cdn/x/${H1}.png`, title: "Stale", featured: false, created: "" },
  ],
} as any;

test("sync plan: only managed keys, normalized compare", () => {
  const d: Desired = { project: "p", update: { title: "Old", body: "Body", categories: ["admin", "utility"], summary: "New", source_url: "https://s" } };
  const steps = plan(d, remote);
  assert.equal(steps.length, 1);
  assert.deepEqual(steps[0]!.input, { project: "PID", summary: "New", source_url: "https://s" });
});

test("sync plan: icon by hash", () => {
  assert.equal(plan({ project: "p", update: {}, icon: { file: "i.png", sha1: H1 } }, remote).length, 0);
  assert.equal(plan({ project: "p", update: {}, icon: { file: "i.png", sha1: H2 } }, remote)[0]!.op, "project.icon.set");
});

test("sync plan: gallery add/update/replace/prune", () => {
  const d: Desired = {
    project: "p",
    update: {},
    gallery: [
      { file: "k.png", title: "Keep", description: "d2", featured: false, sha1: H1 },
      { file: "c.png", title: "Changed", featured: false, sha1: H2 },
      { file: "n.png", title: "New", featured: true, sha1: H3 },
    ],
  };
  const changes = plan(d, remote).map((s) => `${s.op}:${s.destructive}`);
  assert.deepEqual(changes, ["gallery.update:false", "gallery.delete:true", "gallery.add:false", "gallery.add:false"]);
  const pruned = plan(d, remote, { prune: true });
  assert.equal(pruned.at(-1)!.change, '- gallery "Stale" (not in manifest)');
});

test("sync plan: duplicate local images rejected, same file under new title is renamed", () => {
  assert.throws(
    () => plan({ project: "p", update: {}, gallery: [
      { file: "a.png", title: "A", featured: false, sha1: H2 },
      { file: "b.png", title: "B", featured: false, sha1: H2 },
    ] }, remote),
    /same file/,
  );
  const steps = plan({ project: "p", update: {}, gallery: [{ file: "s.png", title: "Renamed", featured: false, sha1: H1 }] }, { ...remote, gallery: [remote.gallery[2]] });
  assert.equal(steps.length, 1);
  assert.equal(steps[0]!.op, "gallery.update");
  assert.equal(steps[0]!.input.title, "Renamed");
});
