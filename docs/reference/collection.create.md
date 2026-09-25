# collection.create

Create a collection of projects (v3 API)

| | |
|---|---|
| Tier | `write` |
| CLI | `modrinth collection create` |
| MCP tool | `collection_create` |
| Token scope | `COLLECTION_CREATE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `name` | `--name` | string | yes |  |
| `description` | `--description` | string |  |  |
| `projects` | `--projects` | string[] |  | Project IDs Default: `[]`. |
