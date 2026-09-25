---
name: modrinth-page-sync
description: Keep a Modrinth project page (title, summary, description body, icon, gallery screenshots, links, license, categories, donation links) in sync with a modrinth.toml file in the repo using modrinth-kit sync. Use when the user wants to update their Modrinth description/gallery/links from the repo, manage the page as code, or set up automatic page updates.
---

# Project page as code with modrinth-kit

`modrinth.toml` describes the project page. `modrinth sync` changes the live page to match it. **Only keys that appear in the file are managed.** Anything you leave out stays as it is on Modrinth.

## Workflow

1. **Start from the live page.** If the repo has no `modrinth.toml`, run `modrinth init <project>`. It writes `modrinth.toml` and `modrinth.md` (the body) from the current page. `--force` overwrites existing files.
2. **Edit the file.** Point `metadata.icon` and the gallery `file` entries at real local images; `init` writes placeholder gallery paths.
3. **Always dry-run first and show the user the diff:**
   ```sh
   modrinth sync --dry-run
   ```
   The output looks like `{"changes":["~ summary","~ icon (changed)","+ gallery \"Menu\""]}`.
4. **Apply.** Run `modrinth sync`. If the plan replaces or deletes gallery images, it returns `confirmRequired` and exit code 4 without changing anything. Ask the user, then run `modrinth sync --yes`.
5. **Check it's finished.** Run `modrinth sync --dry-run` again; it should report `"upToDate":true`.

If a step fails partway through, sync stops and reports `applied` / `failed` / `pending`. Fix the cause and run it again; steps already applied won't repeat.

## File format

```toml
project = "my-plugin"

[metadata]
title = "My Plugin"
summary = "One line shown in search"
body_file = "docs/modrinth.md"
icon = "assets/icon.png"                   # re-uploaded only if the file's sha1 changes
categories = ["utility", "management"]     # max 3; `modrinth tag list category`
license = "MIT"
# client_side / server_side: mods only. Leave them out for plugins.

[links]                                    # "" clears a link
source = "https://github.com/me/my-plugin"
issues = "https://github.com/me/my-plugin/issues"
discord = "https://discord.gg/invite"

[[donations]]                              # replaces the donation list
platform = "ko-fi"                         # `modrinth tag list donation_platform`
url = "https://ko-fi.com/me"

[[gallery]]
file = "assets/gallery/menu.png"
title = "Menu"                             # images are matched by title
description = "The config GUI"
featured = true

[[gallery]]
files = "assets/gallery/*.png"             # glob: one image per file, title = file name without extension
```

How gallery images are handled:

| Situation | What sync does | Needs confirmation? |
|---|---|---|
| New title | Upload | No |
| Same title, different metadata | Update in place | No |
| Same title, different file | Delete, then re-upload | Yes |
| Same file under a new title | Rename in place | No |
| Two entries use the same file | Error before any request is sent | n/a |
| Image on Modrinth but not in the file | Left alone; deleted only with `--prune` | Yes |

## Automate on push

```yaml
on:
  push:
    branches: [main]
    paths: [modrinth.toml, docs/modrinth.md, assets/**]
jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: TejasLamba2006/modrinth-kit@v0
        with:
          token: ${{ secrets.MODRINTH_TOKEN }}   # needs PROJECT_WRITE
          command: sync --yes
```
