# version.latest

Given file hash(es), find the newest compatible version of each project (update checking)

One hash returns a version; several return a hash -> version map.

| | |
|---|---|
| Tier | `read` |
| CLI | `modrinth version latest` |
| MCP tool | `version_latest` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `hashes` | `--hashes` | string[] | yes |  |
| `algorithm` | `--algorithm` | `sha1` \| `sha512` |  |  Default: `"sha1"`. |
| `loaders` | `--loaders` | string[] | yes |  |
| `game_versions` | `--game-versions` | string[] | yes |  |
| `version_types` | `--version-types` | `release` \| `beta` \| `alpha` |  |  |
