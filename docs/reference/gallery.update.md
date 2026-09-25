# gallery.update

Edit a gallery image's title, description, featured flag, or ordering

| | |
|---|---|
| Tier | `write` |
| CLI | `modrinth gallery update <project>` |
| MCP tool | `gallery_update` |
| Token scope | `PROJECT_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `project` | `--project` | string | yes | Project ID or slug |
| `url` | `--url` | string | yes | Image url from gallery.list |
| `featured` | `--featured` | boolean |  |  |
| `title` | `--title` | string |  |  |
| `description` | `--description` | string |  |  |
| `ordering` | `--ordering` | integer |  | Lower comes first |
