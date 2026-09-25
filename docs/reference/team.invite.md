# team.invite

Invite a user to a project's team (they must accept)

| | |
|---|---|
| Tier | `write` |
| CLI | `modrinth team invite <project> <user>` |
| MCP tool | `team_invite` |
| Token scope | `PROJECT_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `project` | `--project` | string | yes | Project ID or slug |
| `user` | `--user` | string | yes | User ID or username |
