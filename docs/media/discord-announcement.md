Hey all, I made a thing for Modrinth project authors: **modrinth-kit**.

I kept doing the same clicks on the Modrinth site for every release and every page edit, and I couldn't find one tool that covered it. Minotaur only works in Gradle, the GitHub Actions only upload versions, and the CLIs I found were download-only or abandoned. So I wrote one.

It lets you do what you'd normally do on the website (projects, versions, gallery, team, orgs, analytics, collections, replying to moderators), in three ways:

- **CLI**: `modrinth <command>`. Prints JSON, uses fixed exit codes, so it's easy to script.
- **MCP server**: the same operations as tools for Claude Code, Claude Desktop or Cursor.
- **CI**: keep a `modrinth.toml` in your repo. `modrinth sync` makes the project page match it (use `--dry-run` to see the diff first), and `modrinth publish 1.2.0` uploads your build with that version's CHANGELOG section. Running it twice is a no-op. There's a GitHub Action, and it runs on any CI through npx.
- **Destructive stuff needs confirmation.** Deletes, ownership transfers and making a project public only print a preview until you pass `--yes`. You can also start the MCP server with `--read-only` so an agent can't change anything.

Try it:
```
npm i -g modrinth-kit
modrinth mcp --read-only
```

I ran every operation against Modrinth's staging API before publishing, but it's still early, so expect rough edges. Bug reports and "it doesn't do X" issues are very welcome.

GitHub: <https://github.com/TejasLamba2006/modrinth-kit>
npm: <https://www.npmjs.com/package/modrinth-kit>

MIT licensed. This is a community tool, not an official Modrinth product.

---

Attach (not part of the message text): `discord-banner.png` as the main image. If the channel allows more than one, add `ci-flow.png` and `agent-safety.png`.
