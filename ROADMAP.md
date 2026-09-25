# Roadmap

v0.1 covers **author workflows**: projects, gallery, versions and files, team, organizations, and analytics. The items below aren't built yet, and contributions are welcome.

## How to add an operation

1. Add a `defineOp({...})` to the right file in `src/ops/`, or create a new file and register it in `src/ops/index.ts`.
   - Set `tier`: `read`, `write`, or `destructive`.
   - Write a `preview` for destructive operations so users can see what will happen.
   - Add at least one entry to `examples`.
2. v2 endpoints are typed in `src/client/generated.ts`. For v3-only endpoints, point to the labrinth route source in a comment, as `src/ops/org.ts` does.
3. Run `npm run gen:docs`, `npm run typecheck` and `npm test`.

That's all: the CLI command, the MCP tool and the reference docs are generated from the operation automatically.

## B: account and social

- [ ] `follow.add` / `follow.remove` / `user.follows`
- [ ] Collections (v3): list, create, update, delete, add/remove projects
- [ ] Notifications: list, mark read, delete (single and bulk)
- [ ] Reports: submit, list your reports, get, update
- [ ] Threads: get a project's moderation thread, send a message, delete a message (for replying to moderators)
- [ ] `user.get`, `user.update` (bio, username), user icon set/delete
- [ ] `team.join` (accept an invite)
- [ ] Bulk project edit (`PATCH /projects`)
- [ ] `version.from-hashes` and latest-version-by-hash updates (useful for modpack tooling)
- [ ] Project/version disclosures (v3)

## C: money and moderation (high risk)

These need extra guardrails before an agent should touch them: each should probably be off by default and have to be enabled with a flag.

- [ ] Payout history and balance (read)
- [ ] Withdrawals
- [ ] Modrinth+ / billing
- [ ] Moderator-only endpoints

## Tooling

- [ ] Local audit log of write operations (JSONL)
- [ ] `sync` support for version metadata (edit existing versions from the manifest)
- [ ] `sync` for donation links
- [ ] Nightly integration test against staging (`MODRINTH_STAGING_TOKEN`)
- [ ] Automatic retry/resume for large uploads
