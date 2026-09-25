# version.delete

Delete a version and its files

| | |
|---|---|
| Tier | `destructive` |
| CLI | `modrinth version delete <version>` |
| MCP tool | `version_delete` |
| Token scope | `VERSION_DELETE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `version` | `--version` | string | yes | Version ID |
| `confirm` | `--yes` | boolean | | Required to actually perform the destructive action. Without it a preview is returned (exit 4). |
