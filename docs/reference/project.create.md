# project.create

Create a new project as a draft (submit it for review later with project.submit)

Plugins use project_type `mod` on the v2 API; the loaders on its versions (paper, spigot...) make it a plugin. Always created as a draft so nothing is public until you run project.submit.

| | |
|---|---|
| Tier | `write` |
| CLI | `modrinth project create` |
| MCP tool | `project_create` |
| Token scope | `PROJECT_CREATE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `slug` | `--slug` | string | yes |  |
| `title` | `--title` | string | yes |  |
| `summary` | `--summary` | string | yes |  |
| `body` | `--body` | string |  |  Default: `""`. |
| `categories` | `--categories` | string[] |  |  Default: `[]`. |
| `additional_categories` | `--additional-categories` | string[] |  | Secondary categories, not shown prominently |
| `issues_url` | `--issues-url` | string \| null |  |  |
| `source_url` | `--source-url` | string \| null |  |  |
| `wiki_url` | `--wiki-url` | string \| null |  |  |
| `discord_url` | `--discord-url` | string \| null |  |  |
| `donation_urls` | `--donation-urls` | object[] |  |  |
| `license_id` | `--license-id` | string | yes |  |
| `license_url` | `--license-url` | string \| null |  |  |
| `client_side` | `--client-side` | `required` \| `optional` \| `unsupported` | yes |  |
| `server_side` | `--server-side` | `required` \| `optional` \| `unsupported` | yes |  |
| `project_type` | `--project-type` | `mod` \| `modpack` \| `resourcepack` \| `shader` |  |  Default: `"mod"`. |
| `icon` | `--icon` | string |  | Path to an icon image file |

## Example: Minimal server plugin draft

```sh
modrinth project create --slug my-plugin --title "My Plugin" --summary "Does things" --license-id MIT --client-side unsupported --server-side required
```

MCP arguments:

```json
{"slug":"my-plugin","title":"My Plugin","summary":"Does things","license_id":"MIT","client_side":"unsupported","server_side":"required"}
```
