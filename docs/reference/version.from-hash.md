# version.from-hash

Find the version that contains a file with this hash

| | |
|---|---|
| Tier | `read` |
| CLI | `modrinth version from-hash <hash>` |
| MCP tool | `version_from_hash` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `hash` | `--hash` | string | yes |  |
| `algorithm` | `--algorithm` | `sha1` \| `sha512` |  |  Default: `"sha1"`. |
