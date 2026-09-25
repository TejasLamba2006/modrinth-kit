# version.from-hashes

Look up the versions containing each of several file hashes (returns hash -> version)

| | |
|---|---|
| Tier | `read` |
| CLI | `modrinth version from-hashes` |
| MCP tool | `version_from_hashes` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `hashes` | `--hashes` | string[] | yes |  |
| `algorithm` | `--algorithm` | `sha1` \| `sha512` |  |  Default: `"sha1"`. |
