# collection.update

Edit a collection's name, description, visibility, or project list (v3 API)

`projects` replaces the whole list. Use `add`/`remove` to change it incrementally.

| | |
|---|---|
| Tier | `write` |
| CLI | `modrinth collection update <id>` |
| MCP tool | `collection_update` |
| Token scope | `COLLECTION_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `id` | `--id` | string | yes |  |
| `name` | `--name` | string |  |  |
| `description` | `--description` | string \| null |  |  |
| `status` | `--status` | `listed` \| `unlisted` \| `private` |  |  |
| `projects` | `--projects` | string[] |  | Full replacement list of project IDs |
| `add` | `--add` | string[] |  | Project IDs to add |
| `remove` | `--remove` | string[] |  | Project IDs to remove |
