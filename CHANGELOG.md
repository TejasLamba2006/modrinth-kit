# Changelog

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
