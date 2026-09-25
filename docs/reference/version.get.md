# version.get

Get a version by ID, or by project + version number

| | |
|---|---|
| Tier | `read` |
| CLI | `modrinth version get <version>` |
| MCP tool | `version_get` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `version` | `--version` | string | yes | Version ID, or version number when `project` is given |
| `project` | `--project` | string |  | Project ID or slug |

## Example: by version number

```sh
modrinth version get 1.4.5 --project adminwatchdog
```

MCP arguments:

```json
{"project":"adminwatchdog","version":"1.4.5"}
```
