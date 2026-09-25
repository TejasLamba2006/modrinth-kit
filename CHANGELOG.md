# Changelog

## [0.2.0] - 2026-09-26

Account and social operations (roadmap scope B). All verified against the Modrinth staging API.

### Added
- Users: `user get`, `user update` (username, display name, bio), `user icon set` / `user icon delete`.
- Follows: `follow add`, `follow remove`, `user follows`.
- Notifications: `notification list [--unread]`, `notification get`, `notification read` and `notification delete` (single or bulk).
- Reports: `report create` (needs confirmation; it goes to moderators), `report list`, `report get`, `report update`.
- Moderation threads: `thread get` (by ID or `--project`), `thread send` (reply to moderators), `thread message delete`.
- Collections (v3): `collection list/get/create/update/icon set/delete`; `update` supports `--add` / `--remove`.
- `team join` to accept an invite, `project bulk-update` for many projects at once.
- `version from-hashes` and `version latest` (newest compatible version for file hashes).
- `project disclosures get/set` (v3 content disclosures: telemetry, AI use, ads, paid features...).
- `[[donations]]` in modrinth.toml, managed by `sync`.
- `test/staging.sh` end-to-end script and a nightly staging workflow.

## [0.1.1] - 2026-09-26

Every operation was exercised end to end against the Modrinth staging API (CLI and MCP).

### Fixed
- `version file add` failed with "`data` field must come before file fields": the multipart `data` part is now sent first.
- `sync` crashed on "You may not upload duplicate gallery images": two manifest entries pointing at the same image are now rejected up front, and an image that only changed title is renamed in place instead of re-uploaded.
- `init` wrote `client_side`/`server_side` for plugin projects, which made the next `sync` fail (plugins have no side fields on Modrinth).
- API errors now include labrinth's `details` (e.g. "editing project: loader field `environment` does not exist...") instead of just the generic description.
- Auth error for unverified accounts now says to verify the email instead of blaming token scopes.

### Removed
- `project.schedule` and `version.schedule`: Modrinth removed these routes (they return 404 even though the official spec still lists them).

## [0.1.0] - 2026-09-26

First release.
