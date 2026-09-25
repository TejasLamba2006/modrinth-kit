# modrinth.toml

A declarative description of your Modrinth project, checked into your repository.

- `modrinth sync` makes the live project match the file.
- `modrinth publish <version>` creates versions from the `[version]` section.

Every key is optional except `project`. **sync only manages the keys you include**, so anything you leave out stays as it is on Modrinth.

Relative paths are resolved from the directory the manifest is in. Use `--manifest path/to/modrinth.toml` to point at a manifest somewhere else.

`modrinth init <project>` creates a starting manifest from an existing project.

```toml
project = "my-plugin"                 # slug or ID (required)

[metadata]
title = "My Plugin"
summary = "One-line summary shown in search"
body_file = "docs/modrinth.md"        # or: body = "inline markdown"
icon = "assets/icon.png"              # re-uploaded only when the file's sha1 changes
categories = ["utility", "management"]   # max 3; see `modrinth tag list category`
additional_categories = ["technology"]
license = "MIT"                       # SPDX id, or LicenseRef-<Name>
license_url = "https://example.com/license"
client_side = "unsupported"           # required | optional | unsupported
server_side = "required"

[links]                               # set a link to "" to clear it
source = "https://github.com/me/my-plugin"
issues = "https://github.com/me/my-plugin/issues"
wiki = "https://github.com/me/my-plugin/wiki"
discord = "https://discord.gg/invite"

# Gallery: one [[gallery]] block per image...
[[gallery]]
file = "assets/gallery/menu.png"
title = "Main menu"                   # defaults to the file name without its extension
description = "The config GUI"
featured = true
ordering = 0

# ...or a glob that adds one image per matching file (alphabetical order, title = file name without extension).
# If a file also has its own [[gallery]] block, that block takes precedence.
[[gallery]]
files = "assets/gallery/*.png"

[version]                             # defaults for `modrinth publish`
files = ["target/*.jar"]              # globs; the first match is the primary file
loaders = ["paper", "folia"]          # see `modrinth tag list loader`
game_versions = ["1.21.11"]
channel = "release"                   # optional; otherwise inferred: -alpha -> alpha, -beta/-rc/-pre -> beta
changelog_file = "CHANGELOG.md"
changelog_section = true              # use only the "## [<version>]" section (default true)
# changelog = "inline text"           # alternative to changelog_file
name = "My Plugin {version}"          # optional name template
featured = false

[[version.dependencies]]
project = "luckperms"                 # slug or ID
type = "optional"                     # required | optional | incompatible | embedded
```

## How sync matches gallery images

Images are matched by **title**.

| Situation | Action | Needs `--yes`? |
|---|---|---|
| Image is in the manifest but not on Modrinth | Uploaded | no |
| Same title, different description, featured flag or ordering | Updated in place | no |
| Same title, different image file (by sha1) | Deleted, then re-uploaded (Modrinth can't replace an image's file in place) | yes |
| Image is on Modrinth but not in the manifest | Left alone. With `--prune` it's deleted. | yes |

If a plan contains any step that needs `--yes`, nothing is applied until you confirm. That way a project is never left half-synced.

If a step fails partway through, sync stops and reports which steps were applied, which one failed and which are still pending. Running it again picks up where it left off.

## publish

- Uses `--version`, or the first positional argument. A `refs/tags/` prefix is removed, so `${{ github.ref }}` works.
- **Idempotent:** if the version number already exists, it exits 0 and prints `{"skipped":true}`.
- Fails if `changelog_section` is on and the changelog has no section for this version, rather than publishing an empty changelog.
- These flags override the manifest: `--changelog`, `--channel`, `--file`, `--loader`, `--game-version`.
- `--dry-run` prints the version it would create.
