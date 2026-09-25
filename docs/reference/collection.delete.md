# collection.delete

Delete a collection (v3 API)

| | |
|---|---|
| Tier | `destructive` |
| CLI | `modrinth collection delete <id>` |
| MCP tool | `collection_delete` |
| Token scope | `COLLECTION_DELETE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `id` | `--id` | string | yes |  |
| `confirm` | `--yes` | boolean | | Required to actually perform the destructive action. Without it a preview is returned (exit 4). |
