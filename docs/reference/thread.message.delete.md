# thread.message.delete

Delete one of your messages in a thread

| | |
|---|---|
| Tier | `destructive` |
| CLI | `modrinth thread message delete <id>` |
| MCP tool | `thread_message_delete` |
| Token scope | `THREAD_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `id` | `--id` | string | yes | Message ID |
| `confirm` | `--yes` | boolean | | Required to actually perform the destructive action. Without it a preview is returned (exit 4). |
