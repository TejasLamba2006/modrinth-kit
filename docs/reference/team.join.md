# team.join

Accept a pending invite to a project's team

Pass the project (its team is looked up) or a team ID. Pending invites also show up in `notification list`.

| | |
|---|---|
| Tier | `write` |
| CLI | `modrinth team join <project>` |
| MCP tool | `team_join` |
| Token scope | `PROJECT_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `project` | `--project` | string |  | Project ID or slug |
| `team` | `--team` | string |  |  |
