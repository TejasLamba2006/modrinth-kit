# org.delete

Delete an organization; its projects go back to the org owner (v3 API)

| | |
|---|---|
| Tier | `destructive` |
| CLI | `modrinth org delete <org>` |
| MCP tool | `org_delete` |
| Token scope | `ORGANIZATION_DELETE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `org` | `--org` | string | yes | Organization ID or slug |
| `confirm` | `--yes` | boolean | | Required to actually perform the destructive action. Without it a preview is returned (exit 4). |
