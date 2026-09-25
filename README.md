# modrinth-kit

A single tool for managing Modrinth projects from the terminal, from AI coding agents, and from CI.

- **CLI**: `modrinth <command>` covers every author action the website offers: create and edit projects, manage the gallery, upload versions, manage team members and organizations, and read analytics.
- **MCP server**: `modrinth mcp` exposes the same operations as tools for Claude Code, Claude Desktop, Cursor, and other MCP clients.
- **CI**: check a `modrinth.toml` into your repo, then use `modrinth sync` to keep the project page in step with it and `modrinth publish` to release versions. The same commands run in the included GitHub Action and in any other CI.

All three share one core, and the [operation reference](docs/reference/README.md) is generated from that same core, so the docs always match what the tool does.

## Install

```sh
npm i -g modrinth-kit      # or run anything with: npx modrinth-kit <command>
```

Requires Node 22+.

## Authenticate

Create a [personal access token](https://modrinth.com/settings/pats) with the scopes you need. Then either set it as an environment variable:

```sh
export MODRINTH_TOKEN=mrp_...
```

or store it in the config file:

```sh
modrinth auth login --token mrp_...
modrinth auth whoami
```

Read-only commands don't need a token. Pass `--staging` to work against `staging-api.modrinth.com`; staging reads `MODRINTH_STAGING_TOKEN` if it's set.

## CLI

```sh
modrinth search "admin" --project-type plugin --loaders paper
modrinth project get sodium --pretty
modrinth project update my-plugin --summary "New summary" --body @README.md
modrinth version create my-plugin --version-number 1.2.0 --files build/libs/my-plugin.jar \
  --loaders paper,folia --game-versions 1.21.11 --changelog @CHANGES.md
modrinth gallery add my-plugin screenshots/menu.png --title "Menu" --featured
modrinth team member update my-plugin alice --permissions UPLOAD_VERSION,EDIT_BODY
modrinth analytics get --start 2026-09-01T00:00:00Z --pretty
modrinth help version create
```

- Output is JSON on stdout. Errors go to stderr as `{"error":{code,status,message,hint}}`.
- Any flag value written as `@path` is read from that file.
- Array flags accept either repeated flags or comma-separated values.
- `--input '{"...":...}'` or `--input @file.json` passes the whole input as JSON.

| Exit code | Meaning |
|---|---|
| 0 | Success |
| 1 | Usage or validation error |
| 2 | API or network error |
| 3 | Auth error (missing token or scope) |
| 4 | Confirmation required; the output is a preview and nothing was changed |

### Safety

Every operation is classed as `read`, `write`, or `destructive`. Destructive operations are deletions, ownership transfers, and status changes that make a project public or hide it. Without `--yes` they change nothing: they print `{"dryRun":true,"confirmRequired":true,"wouldDo":"..."}` and exit with code 4. Add `--yes` to actually run them.

## modrinth.toml, sync, and publish

```sh
modrinth init my-plugin      # writes modrinth.toml + modrinth.md from the live project
modrinth sync --dry-run      # shows what would change
modrinth sync                # applies it (add --yes if gallery images get replaced/deleted)
modrinth publish 1.2.0       # uploads files per [version]; re-running for an existing version is a no-op
```

See [docs/modrinth-toml.md](docs/modrinth-toml.md) for the full format.

## MCP

Add this to your MCP client config:

```json
{
  "mcpServers": {
    "modrinth": {
      "command": "npx",
      "args": ["-y", "modrinth-kit", "mcp"],
      "env": { "MODRINTH_TOKEN": "mrp_..." }
    }
  }
}
```

For Claude Code: `claude mcp add modrinth -e MODRINTH_TOKEN=mrp_... -- npx -y modrinth-kit mcp`

| Flag | Tools exposed |
|---|---|
| (none) | All 44 tools. Destructive tools take a `confirm` argument; without it they return a preview. |
| `--allow read,write` | No destructive tools, and status changes can only return previews. |
| `--read-only` | Only the read tools. |
| `--staging` | Same tools, pointed at the staging API. |

## GitHub Actions

```yaml
- uses: TejasLamba2006/modrinth-kit@v0
  with:
    token: ${{ secrets.MODRINTH_TOKEN }}
    command: publish ${{ github.ref_name }}
```

See [docs/ci.md](docs/ci.md) for full workflows, including other CI systems.

## Docs

- [Operation reference](docs/reference/README.md): every operation with its inputs, tier, and CLI and MCP forms
- [modrinth.toml](docs/modrinth-toml.md)
- [CI](docs/ci.md)
- [AGENTS.md](AGENTS.md): guide for coding agents
- [ROADMAP.md](ROADMAP.md): what isn't covered yet, and how to contribute

## Development

```sh
npm install
npm run dev -- project get sodium   # run from source
npm test                            # unit tests
npm run typecheck
npm run gen:types                   # regenerate src/client/generated.ts from spec/openapi.yaml
npm run gen:docs                    # regenerate docs/reference
```

## License

MIT
