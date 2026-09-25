# user.icon.delete

Remove your avatar

| | |
|---|---|
| Tier | `destructive` |
| CLI | `modrinth user icon delete` |
| MCP tool | `user_icon_delete` |
| Token scope | `USER_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `user` | `--user` | string |  | User ID or username; omit for yourself |
| `confirm` | `--yes` | boolean | | Required to actually perform the destructive action. Without it a preview is returned (exit 4). |
