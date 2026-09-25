# thread.send

Reply in a moderation thread (e.g. answer a moderator about your project)

| | |
|---|---|
| Tier | `write` |
| CLI | `modrinth thread send <id>` |
| MCP tool | `thread_send` |
| Token scope | `THREAD_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `id` | `--id` | string |  | Thread ID |
| `project` | `--project` | string |  | Project ID or slug |
| `body` | `--body` | string | yes |  |
| `replying_to` | `--replying-to` | string |  | Message ID being replied to |
