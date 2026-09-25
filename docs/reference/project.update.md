# project.update

Edit project metadata: title, summary, body, links, license, categories, sides, slug, status

Only the fields you pass are changed; pass null to clear a link. Setting `status`/`requested_status` is treated as destructive (it can make a project public or hide it) and needs confirmation.

| | |
|---|---|
| Tier | `write` (destructive for some inputs) |
| CLI | `modrinth project update <project>` |
| MCP tool | `project_update` |
| Token scope | `PROJECT_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `project` | `--project` | string | yes | Project ID or slug |
| `slug` | `--slug` | string |  |  |
| `title` | `--title` | string |  |  |
| `summary` | `--summary` | string |  | Short description shown in search (API field `description`) |
| `body` | `--body` | string |  | Long markdown description |
| `categories` | `--categories` | string[] |  | Up to 3 primary categories (see `tag list category`) |
| `additional_categories` | `--additional-categories` | string[] |  | Secondary categories, not shown prominently |
| `issues_url` | `--issues-url` | string \| null |  |  |
| `source_url` | `--source-url` | string \| null |  |  |
| `wiki_url` | `--wiki-url` | string \| null |  |  |
| `discord_url` | `--discord-url` | string \| null |  |  |
| `donation_urls` | `--donation-urls` | object[] |  |  |
| `license_id` | `--license-id` | string |  | SPDX id, or LicenseRef-<name> for custom |
| `license_url` | `--license-url` | string \| null |  |  |
| `client_side` | `--client-side` | `required` \| `optional` \| `unsupported` |  |  |
| `server_side` | `--server-side` | `required` \| `optional` \| `unsupported` |  |  |
| `status` | `--status` | `approved` \| `archived` \| `unlisted` \| `private` \| `draft` \| `processing` |  |  |
| `requested_status` | `--requested-status` | `approved` \| `archived` \| `unlisted` \| `private` \| `draft` \| null |  |  |
| `confirm` | `--yes` | boolean | | Required to actually perform the destructive action. Without it a preview is returned (exit 4). |

## Example: Edit summary and source link

```sh
modrinth project update my-plugin --summary "New summary" --source-url https://github.com/me/my-plugin
```

MCP arguments:

```json
{"project":"my-plugin","summary":"New summary","source_url":"https://github.com/me/my-plugin"}
```
