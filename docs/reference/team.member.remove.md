# team.member.remove

Remove a member (or cancel an invite) from a project's team

| | |
|---|---|
| Tier | `destructive` |
| CLI | `modrinth team member remove <project> <user>` |
| MCP tool | `team_member_remove` |
| Token scope | `PROJECT_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `project` | `--project` | string | yes | Project ID or slug |
| `user` | `--user` | string | yes |  |
| `confirm` | `--yes` | boolean | | Required to actually perform the destructive action. Without it a preview is returned (exit 4). |
