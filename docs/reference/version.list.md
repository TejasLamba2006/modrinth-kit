# version.list

List a project's versions, optionally filtered by loader / game version / featured

| | |
|---|---|
| Tier | `read` |
| CLI | `modrinth version list <project>` |
| MCP tool | `version_list` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `project` | `--project` | string | yes | Project ID or slug |
| `loaders` | `--loaders` | string[] |  |  |
| `game_versions` | `--game-versions` | string[] |  |  |
| `featured` | `--featured` | boolean |  |  |
