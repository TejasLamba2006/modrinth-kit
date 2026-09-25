# notification.delete

Delete one or more notifications

| | |
|---|---|
| Tier | `destructive` |
| CLI | `modrinth notification delete` |
| MCP tool | `notification_delete` |
| Token scope | `NOTIFICATION_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `ids` | `--ids` | string[] | yes |  |
| `confirm` | `--yes` | boolean | | Required to actually perform the destructive action. Without it a preview is returned (exit 4). |
