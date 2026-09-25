# version.file.add

Attach extra files to an existing version

| | |
|---|---|
| Tier | `write` |
| CLI | `modrinth version file add <version>` |
| MCP tool | `version_file_add` |
| Token scope | `VERSION_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `version` | `--version` | string | yes | Version ID |
| `files` | `--files` | string[] | yes |  |
| `file_types` | `--file-types` | object |  |  |
