# version.update

Edit a version's name, number, changelog, loaders, game versions, channel, deps, status, primary file

| | |
|---|---|
| Tier | `write` |
| CLI | `modrinth version update <version>` |
| MCP tool | `version_update` |
| Token scope | `VERSION_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `version` | `--version` | string | yes | Version ID |
| `name` | `--name` | string |  |  |
| `version_number` | `--version-number` | string |  |  |
| `changelog` | `--changelog` | string,null |  |  |
| `loaders` | `--loaders` | string[] |  |  |
| `game_versions` | `--game-versions` | string[] |  |  |
| `version_type` | `--version-type` | `release` \| `beta` \| `alpha` |  |  |
| `dependencies` | `--dependencies` | object[] |  |  |
| `featured` | `--featured` | boolean |  |  |
| `status` | `--status` | `listed` \| `archived` \| `draft` \| `unlisted` |  |  |
| `primary_file_sha1` | `--primary-file-sha1` | string |  | sha1 of the file to make primary |
