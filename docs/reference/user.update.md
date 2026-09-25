# user.update

Edit your profile: username, display name, bio

| | |
|---|---|
| Tier | `write` |
| CLI | `modrinth user update` |
| MCP tool | `user_update` |
| Token scope | `USER_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `user` | `--user` | string |  | User ID or username; omit for yourself |
| `username` | `--username` | string |  |  |
| `name` | `--name` | string \| null |  | Display name; null clears it |
| `bio` | `--bio` | string \| null |  |  |
