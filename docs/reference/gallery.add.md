# gallery.add

Upload a gallery image (max 5 MiB)

| | |
|---|---|
| Tier | `write` |
| CLI | `modrinth gallery add <project> <file>` |
| MCP tool | `gallery_add` |
| Token scope | `PROJECT_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `project` | `--project` | string | yes | Project ID or slug |
| `file` | `--file` | string | yes | Path to image |
| `featured` | `--featured` | boolean |  |  Default: `false`. |
| `title` | `--title` | string |  |  |
| `description` | `--description` | string |  |  |
| `ordering` | `--ordering` | integer |  | Lower comes first |
