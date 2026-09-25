# org.update

Edit an organization's slug, name, or description (v3 API)

| | |
|---|---|
| Tier | `write` |
| CLI | `modrinth org update <org>` |
| MCP tool | `org_update` |
| Token scope | `ORGANIZATION_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `org` | `--org` | string | yes | Organization ID or slug |
| `slug` | `--slug` | string |  |  |
| `name` | `--name` | string |  |  |
| `description` | `--description` | string |  |  |
