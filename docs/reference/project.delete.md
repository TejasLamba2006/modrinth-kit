# project.delete

Permanently delete a project and all its versions

| | |
|---|---|
| Tier | `destructive` |
| CLI | `modrinth project delete <project>` |
| MCP tool | `project_delete` |
| Token scope | `PROJECT_DELETE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `project` | `--project` | string | yes | Project ID or slug |
| `confirm` | `--yes` | boolean | | Required to actually perform the destructive action. Without it a preview is returned (exit 4). |
