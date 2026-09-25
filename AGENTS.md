# Guide for coding agents

This file is for AI agents that use modrinth-kit through the CLI or the MCP server. The same guidance ships as installable skills in `skills/`; see the README section "Agent skills".

## Rules

1. **Preview destructive actions, then ask.** Deletes, ownership transfers, `project.submit`, reports to moderators, and status changes return `{"confirmRequired":true,"wouldDo":"..."}` unless you pass `--yes` (CLI) or `confirm: true` (MCP). Show `wouldDo` to the user word for word. Repeat the call with confirmation only after the user explicitly approves.
2. **Before `sync`, always run `sync --dry-run`** and show the list of changes.
3. **Look up valid values first.** Before setting categories, loaders, game versions, or licenses, call `tag list <type>`. Guessed values fail with `invalid`.
4. **Read the error.** Errors are JSON with `code` and `hint`. On `auth`, the hint names the token scope that's missing; tell the user instead of retrying.
5. **Never print or store the user's token.** Tokens come from `MODRINTH_TOKEN` or `modrinth auth login`.

## CLI exit codes

| Code | Meaning | What to do |
|---|---|---|
| 0 | Success | Parse the JSON on stdout |
| 1 | Bad input | Read `error.message`; it names the field that failed |
| 2 | API or network error | Retrying once is fine |
| 3 | Auth error | Ask the user for a token or the missing scope |
| 4 | Confirmation required | Show the preview and ask the user |

## Common tasks

| Goal | Command |
|---|---|
| Check the token works | `modrinth auth whoami` |
| List the user's projects | `modrinth user projects` |
| Release a jar | `modrinth publish <version>` (needs a `[version]` section in modrinth.toml) or `modrinth version create ...` |
| Update the project description | `modrinth project update <p> --body @docs/modrinth.md` |
| Replace the icon | `modrinth project icon set <p> icon.png` |
| Screenshots | `modrinth gallery add/update/delete`, or list them under `[[gallery]]` and run `sync` |
| Make a draft public | `modrinth project submit <p>` (destructive; ask first) |
| Downloads and views | `modrinth analytics get --start <iso>` |
| Answer a moderator | `modrinth thread get --project <p>`, then `modrinth thread send --project <p> --body "..."` |
| Check for updates of a jar | `modrinth version latest --hashes <sha1> --loaders paper --game-versions 1.21.11` |
| Accept a team invite | `modrinth notification list`, then `modrinth team join <project>` |

Run `modrinth ops` to get the full operation list as JSON, and `modrinth help <op>` for the flags of any operation. MCP tool names are the operation names with `.` and `-` replaced by `_` (`project.icon.set` becomes `project_icon_set`).

## Modrinth quirks

- Plugins use `project_type: mod` on the v2 API. The version loaders (`paper`, `spigot`, `folia`...) are what make a project a plugin.
- `summary` in modrinth-kit is the field Modrinth's API calls `description`: the short text shown in search. `body` is the long markdown description.
- New projects are always created as drafts. `project submit` sends a draft to moderators for review.
- Plugins (paper, spigot, folia... loaders) have no client/server side; omit `client_side`/`server_side` when updating them.
- Modrinth removed project/version scheduling from its API (still listed in the official spec, returns 404), so there is no schedule operation.
- Gallery images are identified by their `url`, which you get from `gallery list`.
- Organizations and analytics use Modrinth's v3 API, which upstream marks as unstable.
