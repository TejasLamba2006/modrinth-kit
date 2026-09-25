# org.project.remove

Remove a project from an organization, handing it to a new owner (v3 API)

| | |
|---|---|
| Tier | `destructive` |
| CLI | `modrinth org project remove <org> <project>` |
| MCP tool | `org_project_remove` |
| Token scope | `PROJECT_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `org` | `--org` | string | yes | Organization ID or slug |
| `project` | `--project` | string | yes | Project ID or slug |
| `new_owner` | `--new-owner` | string | yes | User ID or username; must be an org member |
| `confirm` | `--yes` | boolean | | Required to actually perform the destructive action. Without it a preview is returned (exit 4). |
