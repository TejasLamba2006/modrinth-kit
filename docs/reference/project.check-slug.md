# project.check-slug

Check whether a slug/ID is taken; returns {id} if it exists, not_found otherwise

| | |
|---|---|
| Tier | `read` |
| CLI | `modrinth project check-slug <project>` |
| MCP tool | `project_check_slug` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `project` | `--project` | string | yes | Project ID or slug |
