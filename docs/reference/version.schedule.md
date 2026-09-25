# version.schedule

Schedule a version to change status (e.g. become listed) at a future time

| | |
|---|---|
| Tier | `destructive` |
| CLI | `modrinth version schedule <version>` |
| MCP tool | `version_schedule` |
| Token scope | `VERSION_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `version` | `--version` | string | yes | Version ID |
| `time` | `--time` | string | yes |  |
| `requested_status` | `--requested-status` | `listed` \| `archived` \| `draft` \| `unlisted` | yes |  |
| `confirm` | `--yes` | boolean | | Required to actually perform the destructive action. Without it a preview is returned (exit 4). |
