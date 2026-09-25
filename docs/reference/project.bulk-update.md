# project.bulk-update

Edit categories and links on many projects at once

`categories` replaces; `add_*`/`remove_*` change incrementally. Links set to null are cleared on every project.

| | |
|---|---|
| Tier | `write` |
| CLI | `modrinth project bulk-update` |
| MCP tool | `project_bulk_update` |
| Token scope | `PROJECT_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `projects` | `--projects` | string[] | yes | Project IDs |
| `categories` | `--categories` | string[] |  |  |
| `add_categories` | `--add-categories` | string[] |  |  |
| `remove_categories` | `--remove-categories` | string[] |  |  |
| `additional_categories` | `--additional-categories` | string[] |  |  |
| `add_additional_categories` | `--add-additional-categories` | string[] |  |  |
| `remove_additional_categories` | `--remove-additional-categories` | string[] |  |  |
| `issues_url` | `--issues-url` | string \| null |  |  |
| `source_url` | `--source-url` | string \| null |  |  |
| `wiki_url` | `--wiki-url` | string \| null |  |  |
| `discord_url` | `--discord-url` | string \| null |  |  |
