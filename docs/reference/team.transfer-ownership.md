# team.transfer-ownership

Transfer project ownership to another existing team member

| | |
|---|---|
| Tier | `destructive` |
| CLI | `modrinth team transfer-ownership <project> <user>` |
| MCP tool | `team_transfer_ownership` |
| Token scope | `PROJECT_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `project` | `--project` | string | yes | Project ID or slug |
| `user` | `--user` | string | yes |  |
| `confirm` | `--yes` | boolean | | Required to actually perform the destructive action. Without it a preview is returned (exit 4). |
