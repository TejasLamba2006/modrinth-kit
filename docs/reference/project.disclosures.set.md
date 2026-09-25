# project.disclosures.set

Add/replace or remove content disclosures on a project (v3 API)

| | |
|---|---|
| Tier | `write` |
| CLI | `modrinth project disclosures set <project>` |
| MCP tool | `project_disclosures_set` |
| Token scope | `PROJECT_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `project` | `--project` | string | yes | Project ID or slug |
| `set` | `--set` | object[] |  |  Default: `[]`. |
| `remove` | `--remove` | string[] |  | Disclosure types to remove Default: `[]`. |

## Example: Declare opt-in telemetry

```sh
modrinth project disclosures set my-plugin --set "[object Object]"
```

MCP arguments:

```json
{"project":"my-plugin","set":[{"type":"telemetry","consent":"opt_in","data_collected":["errors"]}]}
```
