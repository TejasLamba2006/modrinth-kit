# version.create

Publish a new version by uploading one or more files (.jar/.zip/.mrpack)

The first file is the primary file unless `primary` is set. `file_types` marks extra files (e.g. sources-jar). For CI, prefer `modrinth publish`, which reads defaults from modrinth.toml and is idempotent.

| | |
|---|---|
| Tier | `write` |
| CLI | `modrinth version create <project>` |
| MCP tool | `version_create` |
| Token scope | `VERSION_CREATE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `project` | `--project` | string | yes | Project ID or slug |
| `version_number` | `--version-number` | string | yes |  |
| `name` | `--name` | string |  | Display name; defaults to version_number |
| `files` | `--files` | string[] | yes | Paths to files to upload |
| `primary` | `--primary` | string |  | Which of `files` is primary (path); defaults to the first |
| `file_types` | `--file-types` | object |  | Map of file path -> file type for non-primary files |
| `loaders` | `--loaders` | string[] | yes |  |
| `game_versions` | `--game-versions` | string[] | yes |  |
| `version_type` | `--version-type` | `release` \| `beta` \| `alpha` |  |  Default: `"release"`. |
| `changelog` | `--changelog` | string |  |  |
| `dependencies` | `--dependencies` | object[] |  |  Default: `[]`. |
| `featured` | `--featured` | boolean |  |  Default: `false`. |
| `status` | `--status` | `listed` \| `archived` \| `draft` \| `unlisted` |  |  |

## Example: Upload a plugin jar

```sh
modrinth version create adminwatchdog --version-number 1.4.6 --files target/AdminWatchdog.jar --loaders paper,folia --game-versions 1.21.11
```

MCP arguments:

```json
{"project":"adminwatchdog","version_number":"1.4.6","files":["target/AdminWatchdog.jar"],"loaders":["paper","folia"],"game_versions":["1.21.11"]}
```
