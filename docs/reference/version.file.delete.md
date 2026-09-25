# version.file.delete

Delete a single file (by hash) from its version

| | |
|---|---|
| Tier | `destructive` |
| CLI | `modrinth version file delete <hash>` |
| MCP tool | `version_file_delete` |
| Token scope | `VERSION_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `hash` | `--hash` | string | yes |  |
| `algorithm` | `--algorithm` | `sha1` \| `sha512` |  |  Default: `"sha1"`. |
| `confirm` | `--yes` | boolean | | Required to actually perform the destructive action. Without it a preview is returned (exit 4). |
