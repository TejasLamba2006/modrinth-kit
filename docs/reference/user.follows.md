# user.follows

List projects a user follows (only your own is permitted)

| | |
|---|---|
| Tier | `read` |
| CLI | `modrinth user follows <user>` |
| MCP tool | `user_follows` |
| Token scope | `USER_READ` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `user` | `--user` | string |  | User ID or username; omit for yourself |
