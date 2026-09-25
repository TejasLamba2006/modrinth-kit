# org.project.add

Move one of your projects into an organization (v3 API)

| | |
|---|---|
| Tier | `write` |
| CLI | `modrinth org project add <org> <project>` |
| MCP tool | `org_project_add` |
| Token scope | `PROJECT_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `org` | `--org` | string | yes | Organization ID or slug |
| `project` | `--project` | string | yes | Project ID or slug |
