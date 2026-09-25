# search

Search public Modrinth projects

Convenience filters (`project_type`, `categories`, `versions`, `loaders`) are ANDed and turned into Modrinth facets. Pass raw `facets` (array of OR-groups) for anything else.

| | |
|---|---|
| Tier | `read` |
| CLI | `modrinth search <query>` |
| MCP tool | `search` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `query` | `--query` | string |  |  |
| `project_type` | `--project-type` | string |  | mod, plugin, modpack, resourcepack, shader, datapack |
| `categories` | `--categories` | string[] |  |  |
| `versions` | `--versions` | string[] |  | Minecraft versions |
| `loaders` | `--loaders` | string[] |  | Loaders are categories on Modrinth, e.g. paper, fabric |
| `facets` | `--facets` | array[] |  | Raw facets, e.g. [["categories:fabric"],["versions:1.21.1"]] |
| `index` | `--index` | `relevance` \| `downloads` \| `follows` \| `newest` \| `updated` |  |  |
| `offset` | `--offset` | integer |  |  |
| `limit` | `--limit` | integer |  |  |

## Example: Paper admin plugins

```sh
modrinth search admin --project-type plugin --loaders paper
```

MCP arguments:

```json
{"query":"admin","project_type":"plugin","loaders":["paper"]}
```
