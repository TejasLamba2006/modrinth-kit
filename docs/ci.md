# CI

Every command prints JSON and exits with a meaningful code, so later CI steps can parse the output and failures stop the pipeline.

Store the token as a secret. Publishing needs a token with `VERSION_CREATE`; syncing needs `PROJECT_WRITE`.

## GitHub Actions

### Publish on release

```yaml
name: Publish to Modrinth
on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: 21 }
      - run: mvn -B package

      - uses: TejasLamba2006/modrinth-kit@v0
        id: modrinth
        with:
          token: ${{ secrets.MODRINTH_TOKEN }}
          command: publish ${{ github.event.release.tag_name }}

      - run: echo '${{ steps.modrinth.outputs.result }}'
```

### Sync the project page when docs change

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
          token: ${{ secrets.MODRINTH_TOKEN }}
          command: sync --yes
```

`--yes` is needed only when gallery images are replaced or pruned. Leave it out and a sync that would do either exits with code 4 without changing anything, which is a reasonable failure for CI.

### Action inputs

| Input | Default | |
|---|---|---|
| `token` | | Modrinth PAT (required for writes) |
| `command` | `sync` | Any modrinth-kit command line, e.g. `publish 1.2.0 --dry-run` |
| `working-directory` | `.` | Where modrinth.toml lives |
| `staging` | `false` | Use the staging API |
| `version` | the version of the action you referenced | npm version of modrinth-kit to run |

The `result` output holds the JSON the command printed.

## Other CI systems

Anything with Node 22+ can run it directly:

```sh
MODRINTH_TOKEN=$TOKEN npx -y modrinth-kit@0 publish "$CI_COMMIT_TAG"
```

GitLab example:

```yaml
publish:
  image: node:22
  rules: [{ if: $CI_COMMIT_TAG }]
  script:
    - npx -y modrinth-kit@0 publish "$CI_COMMIT_TAG"
  variables:
    MODRINTH_TOKEN: $MODRINTH_TOKEN
```
