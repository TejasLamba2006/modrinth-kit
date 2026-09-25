# analytics.get

Fetch views/downloads/playtime/revenue time series for your projects (v3 API)

Needs a token with ANALYTICS scope (revenue additionally needs PAYOUTS_READ). `bucket_by` groups results, e.g. ["project_id","country"]. Returns Modrinth's raw response: `metrics` is a list of time slices.

| | |
|---|---|
| Tier | `read` |
| CLI | `modrinth analytics get` |
| MCP tool | `analytics_get` |
| Token scope | `ANALYTICS` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `projects` | `--projects` | string[] |  | Project IDs; empty = all your projects Default: `[]`. |
| `start` | `--start` | string | yes |  |
| `end` | `--end` | string |  | Defaults to now |
| `slices` | `--slices` | integer |  | Number of time buckets Default: `30`. |
| `metrics` | `--metrics` | `project_views` \| `project_downloads` \| `project_playtime` \| `project_revenue` |  |  Default: `["project_downloads","project_views"]`. |
| `bucket_by` | `--bucket-by` | string[] |  |  Default: `["project_id"]`. |

## Example: Downloads this month

```sh
modrinth analytics get --start 2026-09-01T00:00:00Z --metrics project_downloads
```

MCP arguments:

```json
{"start":"2026-09-01T00:00:00Z","metrics":["project_downloads"]}
```
