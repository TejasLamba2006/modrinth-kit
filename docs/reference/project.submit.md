# project.submit

Submit a draft project for Modrinth moderator review (it goes public once approved)

| | |
|---|---|
| Tier | `destructive` |
| CLI | `modrinth project submit <project>` |
| MCP tool | `project_submit` |
| Token scope | `PROJECT_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `project` | `--project` | string | yes | Project ID or slug |
| `requested_status` | `--requested-status` | `approved` \| `unlisted` \| `private` \| `archived` |  | Status to receive after approval Default: `"approved"`. |
| `confirm` | `--yes` | boolean | | Required to actually perform the destructive action. Without it a preview is returned (exit 4). |
