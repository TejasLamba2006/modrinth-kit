# thread.get

Read a moderation thread: by thread ID, or a project's thread via `project`

| | |
|---|---|
| Tier | `read` |
| CLI | `modrinth thread get <id>` |
| MCP tool | `thread_get` |
| Token scope | `THREAD_READ` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `id` | `--id` | string |  | Thread ID |
| `project` | `--project` | string |  | Project ID or slug |
