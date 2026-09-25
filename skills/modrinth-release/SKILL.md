---
name: modrinth-release
description: Release a new version of a Minecraft mod, plugin, modpack or resource pack to Modrinth with modrinth-kit - build, pick the changelog section, dry-run, publish, and set up a GitHub Action or other CI to do it on every tag. Use when the user wants to publish, release, upload or ship a version to Modrinth, or automate Modrinth releases.
---

# Releasing to Modrinth with modrinth-kit

Run commands as `modrinth ...`, or as `npx -y modrinth-kit ...` if it isn't installed. When the `modrinth` MCP server is connected, its `publish` tool does the same job as the CLI command.

## One-off release

1. **Check the token.** Run `modrinth auth whoami`. The token needs the `VERSION_CREATE` scope.
2. **Build the project** with its own build tool (`./gradlew build`, `mvn package`, ...). Find the output jar, and skip `-sources`/`-dev` jars unless the user wants them attached.
3. **Pick the metadata.**
   - Loaders: `modrinth tag list loader`.
   - Game versions: `modrinth tag list game_version`. Otherwise copy them from the latest release with `modrinth version list <project>`.
   - Channel: `release`, `beta` or `alpha`.
4. **Publish.**
   - If the repo has a `modrinth.toml` with a `[version]` section:
     ```sh
     modrinth publish 1.2.0 --dry-run   # show the user what will be created
     modrinth publish 1.2.0
     ```
     `publish` takes that version's section from CHANGELOG.md, or from `changelog_file`. It fails rather than publish an empty changelog. It is idempotent: if the version already exists it returns `{"skipped":true}`.
   - Without a manifest:
     ```sh
     modrinth version create <project> --version-number 1.2.0 --files build/libs/x.jar \
       --loaders paper,folia --game-versions 1.21.11 --version-type release --changelog @CHANGES.md
     ```
5. **Verify.** Run `modrinth version get 1.2.0 --project <project>` and report the version's URL: `https://modrinth.com/<type>/<slug>/version/<version_number>`.

## Minimal `[version]` section

```toml
project = "my-plugin"

[version]
files = ["build/libs/*.jar"]      # first match = primary file
loaders = ["paper", "folia"]
game_versions = ["1.21.11"]
changelog_file = "CHANGELOG.md"   # uses the "## [1.2.0]" section
# channel = "beta"                # otherwise inferred from -alpha/-beta/-rc in the version

[[version.dependencies]]
project = "luckperms"
type = "optional"
```

## Release on every tag (GitHub Actions)

Add the token as the repository secret `MODRINTH_TOKEN`, then:

```yaml
on:
  release:
    types: [published]
jobs:
  modrinth:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      # ... build steps producing the jar ...
      - uses: TejasLamba2006/modrinth-kit@v0
        with:
          token: ${{ secrets.MODRINTH_TOKEN }}
          command: publish ${{ github.event.release.tag_name }}
```

A `refs/tags/` or `v` prefix is fine; `publish` strips `refs/tags/`. On GitLab or other CI, run `npx -y modrinth-kit@0 publish "$TAG"` with `MODRINTH_TOKEN` set.

## Fixing a release

- Edit metadata: `modrinth version update <version-id> --changelog @CHANGES.md --game-versions 1.21.11,26.1`.
- Attach an extra file: `modrinth version file add <version-id> --files x-sources.jar --input '{"file_types":{"x-sources.jar":"sources-jar"}}'`.
- Deleting a version is destructive. Show the preview from `modrinth version delete <id>` and ask the user before you add `--yes`.
