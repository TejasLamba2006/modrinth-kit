# report.create

File a report to Modrinth moderators about a project, version, or user

Outward-facing (sent to moderators), so it needs confirmation. Get valid `report_type` values from `tag list report_type`.

| | |
|---|---|
| Tier | `destructive` |
| CLI | `modrinth report create` |
| MCP tool | `report_create` |
| Token scope | `REPORT_CREATE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `item_type` | `--item-type` | `project` \| `version` \| `user` | yes |  |
| `item_id` | `--item-id` | string | yes | ID of the reported item |
| `report_type` | `--report-type` | string | yes | e.g. spam, copyright, malicious; see `tag list report_type` |
| `body` | `--body` | string | yes | Markdown explanation |
| `confirm` | `--yes` | boolean | | Required to actually perform the destructive action. Without it a preview is returned (exit 4). |
