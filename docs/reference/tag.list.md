# tag.list

List valid values for categories, loaders, game versions, licenses, etc.

Use before creating/updating projects or versions to get valid category/loader/game_version values.

| | |
|---|---|
| Tier | `read` |
| CLI | `modrinth tag list <type>` |
| MCP tool | `tag_list` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `type` | `--type` | `category` \| `loader` \| `game_version` \| `license` \| `donation_platform` \| `report_type` \| `project_type` \| `side_type` | yes |  |

## Example: All loaders

```sh
modrinth tag list loader
```

MCP arguments:

```json
{"type":"loader"}
```
