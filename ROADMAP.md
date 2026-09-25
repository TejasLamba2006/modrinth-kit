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

## B: account and social (done in 0.2.0)

- [x] `follow.add` / `follow.remove` / `user.follows`
- [x] Collections (v3): list, get, create, update (incl. add/remove projects), icon, delete
- [x] Notifications: list, get, mark read, delete (single and bulk)
- [x] Reports: create, list, get, update
- [x] Threads: get (by ID or a project's), send, delete message
- [x] `user.get`, `user.update`, user icon set/delete
- [x] `team.join`
- [x] `project.bulk-update`
- [x] `version.from-hashes`, `version.latest` (update checking by hash)
- [x] Project disclosures (v3)

Still open in this area:

- [ ] Friends and blocked users (v3)
- [ ] User preferences (v3)
- [ ] OAuth applications

## C: money and moderation (high risk)

These need extra guardrails before an agent should touch them: each should probably be off by default and have to be enabled with a flag.

- [ ] Payout history and balance (read)
- [ ] Withdrawals
- [ ] Modrinth+ / billing
- [ ] Moderator-only endpoints

## Tooling

- [ ] Local audit log of write operations (JSONL)
- [ ] `sync` support for version metadata (edit existing versions from the manifest)
- [x] `sync` for donation links (`[[donations]]`)
- [x] Nightly integration test against staging (`test/staging.sh`, `.github/workflows/staging.yml`)
- [ ] Automatic retry/resume for large uploads
