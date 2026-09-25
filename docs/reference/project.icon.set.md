# project.icon.set

Upload a new project icon (max 256 KiB; png/jpg/webp/gif/svg...)

| | |
|---|---|
| Tier | `write` |
| CLI | `modrinth project icon set <project> <file>` |
| MCP tool | `project_icon_set` |
| Token scope | `PROJECT_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `project` | `--project` | string | yes | Project ID or slug |
| `file` | `--file` | string | yes | Path to image |
