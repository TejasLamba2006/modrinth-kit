Hey all, I made a thing for Modrinth project authors: **modrinth-kit** (v0.3.0).

I kept doing the same clicks on the Modrinth site for every release and page edit, and couldn't find one tool that covered it. Minotaur is Gradle-only, the GitHub Actions only upload versions, and the CLIs I found were download-only or abandoned. So I wrote one.

It covers 70 operations, basically what you'd do on the website: projects, versions, gallery, team, orgs, analytics, collections, notifications, and replying to moderators. You can use it three ways:

- **CLI**: `modrinth <command>`. JSON output and fixed exit codes, so it's easy to script.
- **MCP server**: the same operations as tools for Claude Code, Claude Desktop or Cursor.
- **CI**: keep a `modrinth.toml` in your repo. `modrinth sync --dry-run` shows the diff, `sync` applies it, and `modrinth publish 1.2.0` uploads your build with that version's CHANGELOG section. Safe to re-run. There's a GitHub Action, or use npx on any CI.

New in 0.3: agent skills, so your coding agent knows how to release and sync pages without guessing.
```
/plugin marketplace add TejasLamba2006/modrinth-kit
npx skills add TejasLamba2006/modrinth-kit
```
The first is for Claude Code and also sets up the MCP server. The second works with Cursor, Codex, OpenCode and others.

Deletes, ownership transfers, reports and making a project public only print a preview until you pass `--yes`. You can also start the MCP server with `--read-only`.

Every release was run end to end against Modrinth's staging API, and a nightly test keeps doing that. It's still early, so bug reports and "it doesn't do X" issues are very welcome.

GitHub: <https://github.com/TejasLamba2006/modrinth-kit>
npm: <https://www.npmjs.com/package/modrinth-kit>

MIT licensed. Community tool, not an official Modrinth product.

---

Attach (not part of the message text): `discord-banner.png` as the main image. If the channel allows more, add `agent-skills.png` and `agent-safety.png`.
