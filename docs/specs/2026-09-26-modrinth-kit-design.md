# modrinth-kit — design

Date: 2026-09-26. Status: approved.

## Goal

One TypeScript/Node package that lets humans, coding agents, and CI do everything a Modrinth
project author can do in the web UI. Three surfaces — CLI, MCP server, GitHub Action — over one
shared core, with generated docs so nothing drifts.

No maintained all-in-one exists (existing: a 7-tool MCP server, dead download-only CLIs,
Gradle-only Minotaur, CI-only Actions).

## Scope

- **v1 (A) — author workflows:** projects, gallery, versions/files, team members,
  organizations, analytics (read).
- **Later (B) — account/social:** follows, collections, notifications, reports, threads,
  user profile/settings. Tracked in `ROADMAP.md`.
- **Later (C) — money/moderation:** payouts, withdrawals, billing, moderator endpoints.
  Tracked in `ROADMAP.md`.

## Architecture

One npm package `modrinth-kit`, one bin `modrinth`. `modrinth mcp` starts the stdio MCP server.

```
spec/openapi.yaml        vendored official spec (docs.modrinth.com/openapi.yaml)
src/client/generated.ts  openapi-typescript output, checked in
src/client/http.ts       fetch wrapper: auth, User-Agent, staging, retries, error mapping
src/client/v3.ts         hand-typed v3 endpoints (orgs, analytics — absent from the v2 spec)
src/op.ts                defineOp({ name, tier, summary, description, input, examples, run })
src/ops/*.ts             the registry, grouped by resource
src/cli/                 commander; commands built from the registry + sync/publish/init/auth
src/mcp/                 @modelcontextprotocol/sdk; one tool per registry op
src/sync/                modrinth.toml -> plan -> apply
scripts/gen-docs.ts      registry -> docs/reference/*.md
action.yml               composite GitHub Action running the CLI
```

Every CLI call, MCP call, and sync step goes through `op.run(input, ctx)`; `ctx` carries the
HTTP client, confirm flag, and dry-run flag. There is no second code path.

Runtime deps: `commander`, `zod`, `@modelcontextprotocol/sdk`, `smol-toml`. Node >= 20 (native
fetch / FormData / Blob). Dev: `typescript`, `openapi-typescript`, `tsx`.

## Output contract

- CLI prints JSON to stdout (`--pretty` for indented). Errors to stderr as
  `{"error":{"code","status","message","hint"}}`.
- Exit codes: 0 ok, 1 usage/validation, 2 API error, 3 auth, 4 confirmation required.
- MCP tools return the same JSON as text content; errors set `isError: true`.

## Operations (v1)

Names are `resource.action`; CLI `modrinth resource action`, MCP `resource_action`.

| Group | read | write | destructive |
|---|---|---|---|
| auth | whoami | | |
| search/tag | search, tag.* | | |
| project | get, get-many, check-slug, dependencies | create (draft), update, icon.set | delete, icon.delete, submit, update→public status |
| gallery | | add, update | delete |
| version | list, get, get-by-number, from-hash | create, update, file.add, schedule | delete, file.delete |
| team | members | invite, member.update | member.remove, transfer-ownership |
| org (v3) | get, projects | create, update, project.add | project.remove, delete |
| analytics (v3) | downloads, views, revenue | | |

## Safety

- Every op has a tier: `read`, `write`, `destructive`. Publicity changes count as destructive.
- Destructive ops without `--yes` (CLI) / `confirm: true` (MCP) return
  `{"dryRun":true,"wouldDo":"..."}` and exit 4. MCP descriptions instruct agents to show the
  preview to the user before confirming.
- `modrinth mcp --read-only` or `--allow read,write`: ops above the allowed tier are not
  registered.
- `--staging` targets `https://staging-api.modrinth.com`.
- Token resolution: `--token` > `MODRINTH_TOKEN` > `~/.config/modrinth-kit/config.json`
  (written by `modrinth auth login --token <t>`).

## modrinth.toml

```toml
project = "adminwatchdog"

[metadata]            # only listed keys are managed
title = "AdminWatchdog"
summary = "..."
body_file = "docs/modrinth.md"
icon = "assets/icon.png"
categories = ["utility"]
additional_categories = []
license = "LicenseRef-Proprietary"
client_side = "unsupported"
server_side = "required"

[links]
source = "https://github.com/..."
issues = "..."
wiki = "..."
discord = "..."

[[gallery]]
file = "assets/gallery/embed.png"
title = "Discord embed"
description = "..."
featured = true
ordering = 0

[[gallery]]
files = "assets/gallery/*.png"   # glob: one image per file, title = file stem

[version]
files = ["target/*.jar"]         # globs; first match is primary
loaders = ["paper", "folia"]
game_versions = ["1.21.11"]
channel = "release"              # default: inferred (-alpha/-beta in version number)
changelog_file = "CHANGELOG.md"
changelog_section = true         # extract only the `## <version>` section
featured = false
```

- `modrinth sync [--dry-run] [--prune] [--yes]`: fetch remote, build plan, apply.
  Metadata diffs → `project.update`. Icon compared by sha1 → `icon.set`. Gallery matched by
  title: new → add; metadata change → update; file hash change → delete+add (destructive);
  remote-only → delete only with `--prune` (destructive). Explicit gallery entries win over
  glob matches for the same file.
- Apply is sequential; on failure returns `{applied, failed, pending}` and exits non-zero.
- `modrinth publish --version <n> [overrides]`: builds `version.create` from `[version]`.
  Idempotent: if the version number exists, exits 0 with `{"skipped":true}`.
- `modrinth init [--project <slug>]`: writes a `modrinth.toml` from an existing project.

## Errors

HTTP layer maps: 401/403 → `auth` (exit 3, hint names the required scope from the spec);
404 → `not_found`; 400 → `invalid` with Modrinth's description; 429 → retry honoring
`X-Ratelimit-Reset` (max 3); 5xx → 2 retries with backoff, then `api` (exit 2). zod validation
runs before any request.

## Docs

Generated from the registry: `docs/reference/<op>.md`, `modrinth help <op>`, MCP descriptions.
Hand-written: `README.md`, `AGENTS.md` (agent guide: exit codes, confirm flow, dry-run first),
`docs/modrinth-toml.md`, `docs/ci.md`, `ROADMAP.md`. CI fails if generated docs are stale.

## Testing

`node:test` via `tsx`. Unit: sync planning (pure), changelog extraction, gallery matching,
tier gating, error mapping. `tsc --noEmit` type-checks ops against generated types.
Opt-in integration against staging with `MODRINTH_STAGING_TOKEN`. Weekly spec-drift workflow.
