# gallery.delete

Delete a gallery image

| | |
|---|---|
| Tier | `destructive` |
| CLI | `modrinth gallery delete <project>` |
| MCP tool | `gallery_delete` |
| Token scope | `PROJECT_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `project` | `--project` | string | yes | Project ID or slug |
| `url` | `--url` | string | yes | Image url from gallery.list |
| `confirm` | `--yes` | boolean | | Required to actually perform the destructive action. Without it a preview is returned (exit 4). |
