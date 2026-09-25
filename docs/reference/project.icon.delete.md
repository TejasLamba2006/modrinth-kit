# project.icon.delete

Remove the project icon

| | |
|---|---|
| Tier | `destructive` |
| CLI | `modrinth project icon delete <project>` |
| MCP tool | `project_icon_delete` |
| Token scope | `PROJECT_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `project` | `--project` | string | yes | Project ID or slug |
| `confirm` | `--yes` | boolean | | Required to actually perform the destructive action. Without it a preview is returned (exit 4). |
