# team.member.update

Change a member's role, permissions, payout split, or ordering

| | |
|---|---|
| Tier | `write` |
| CLI | `modrinth team member update <project> <user>` |
| MCP tool | `team_member_update` |
| Token scope | `PROJECT_WRITE` |

## Input

| Field | CLI flag | Type | Required | Description |
|---|---|---|---|---|
| `project` | `--project` | string | yes | Project ID or slug |
| `user` | `--user` | string | yes | User ID or username |
| `role` | `--role` | string |  | Free-text role label, e.g. Developer |
| `permissions` | `--permissions` | any |  | Bitfield integer, or a list of names: UPLOAD_VERSION, DELETE_VERSION, EDIT_DETAILS, EDIT_BODY, MANAGE_INVITES, REMOVE_MEMBER, EDIT_MEMBER, DELETE_PROJECT, VIEW_ANALYTICS, VIEW_PAYOUTS |
| `payouts_split` | `--payouts-split` | integer |  |  |
| `ordering` | `--ordering` | integer |  |  |

## Example: Named permissions

```sh
modrinth team member update my-plugin alice --role Developer --permissions UPLOAD_VERSION,EDIT_BODY
```

MCP arguments:

```json
{"project":"my-plugin","user":"alice","role":"Developer","permissions":["UPLOAD_VERSION","EDIT_BODY"]}
```
