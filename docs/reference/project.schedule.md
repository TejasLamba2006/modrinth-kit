# project.schedule

Schedule an approved project to change status (e.g. go public) at a future time

| | |
|---|---|
| Tier | `destructive` |
| CLI | `modrinth project schedule <project>` |
| MCP tool | `project_schedule` |
| Token scope | `PROJECT_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `project` | `--project` | string | yes | Project ID or slug |
| `time` | `--time` | string | yes | ISO-8601 time |
| `requested_status` | `--requested-status` | `approved` \| `archived` \| `unlisted` \| `private` \| `draft` | yes |  |
| `confirm` | `--yes` | boolean | | Required to actually perform the destructive action. Without it a preview is returned (exit 4). |
