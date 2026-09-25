# project.get

Get a project's full metadata (body, gallery, links, team id, status...)

| | |
|---|---|
| Tier | `read` |
| CLI | `modrinth project get <project>` |
| MCP tool | `project_get` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `project` | `--project` | string | yes | Project ID or slug |

## Example: by slug

```sh
modrinth project get sodium
```

MCP arguments:

```json
{"project":"sodium"}
```
