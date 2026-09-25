# Operation reference

Generated from the operation registry by `npm run gen:docs`. Do not edit by hand.

## auth

| Operation | Tier | Summary |
|---|---|---|
| [`auth.whoami`](auth.whoami.md) | read | Return the user the current token belongs to |

## user

| Operation | Tier | Summary |
|---|---|---|
| [`user.projects`](user.projects.md) | read | List projects owned by or shared with a user (defaults to the token's user) |
| [`user.get`](user.get.md) | read | Get a user's public profile |
| [`user.update`](user.update.md) | write | Edit your profile: username, display name, bio |
| [`user.icon.set`](user.icon.set.md) | write | Upload your avatar |
| [`user.icon.delete`](user.icon.delete.md) | destructive | Remove your avatar |
| [`user.follows`](user.follows.md) | read | List projects a user follows (only your own is permitted) |

## search

| Operation | Tier | Summary |
|---|---|---|
| [`search`](search.md) | read | Search public Modrinth projects |

## tag

| Operation | Tier | Summary |
|---|---|---|
| [`tag.list`](tag.list.md) | read | List valid values for categories, loaders, game versions, licenses, etc. |

## project

| Operation | Tier | Summary |
|---|---|---|
| [`project.get`](project.get.md) | read | Get a project's full metadata (body, gallery, links, team id, status...) |
| [`project.get-many`](project.get-many.md) | read | Get several projects at once |
| [`project.check-slug`](project.check-slug.md) | read | Check whether a slug/ID is taken; returns {id} if it exists, not_found otherwise |
| [`project.dependencies`](project.dependencies.md) | read | List every project and version this project's versions depend on |
| [`project.create`](project.create.md) | write | Create a new project as a draft (submit it for review later with project.submit) |
| [`project.update`](project.update.md) | write | Edit project metadata: title, summary, body, links, license, categories, sides, slug, status |
| [`project.submit`](project.submit.md) | destructive | Submit a draft project for Modrinth moderator review (it goes public once approved) |
| [`project.delete`](project.delete.md) | destructive | Permanently delete a project and all its versions |
| [`project.icon.set`](project.icon.set.md) | write | Upload a new project icon (max 256 KiB; png/jpg/webp/gif/svg...) |
| [`project.icon.delete`](project.icon.delete.md) | destructive | Remove the project icon |
| [`project.bulk-update`](project.bulk-update.md) | write | Edit categories and links on many projects at once |
| [`project.disclosures.get`](project.disclosures.get.md) | read | Get a project's content disclosures (AI use, telemetry, ads, paid features...) (v3 API) |
| [`project.disclosures.set`](project.disclosures.set.md) | write | Add/replace or remove content disclosures on a project (v3 API) |

## gallery

| Operation | Tier | Summary |
|---|---|---|
| [`gallery.list`](gallery.list.md) | read | List a project's gallery images (url identifies an image for update/delete) |
| [`gallery.add`](gallery.add.md) | write | Upload a gallery image (max 5 MiB) |
| [`gallery.update`](gallery.update.md) | write | Edit a gallery image's title, description, featured flag, or ordering |
| [`gallery.delete`](gallery.delete.md) | destructive | Delete a gallery image |

## version

| Operation | Tier | Summary |
|---|---|---|
| [`version.list`](version.list.md) | read | List a project's versions, optionally filtered by loader / game version / featured |
| [`version.get`](version.get.md) | read | Get a version by ID, or by project + version number |
| [`version.from-hash`](version.from-hash.md) | read | Find the version that contains a file with this hash |
| [`version.create`](version.create.md) | write | Publish a new version by uploading one or more files (.jar/.zip/.mrpack) |
| [`version.update`](version.update.md) | write | Edit a version's name, number, changelog, loaders, game versions, channel, deps, status, primary file |
| [`version.file.add`](version.file.add.md) | write | Attach extra files to an existing version |
| [`version.file.delete`](version.file.delete.md) | destructive | Delete a single file (by hash) from its version |
| [`version.delete`](version.delete.md) | destructive | Delete a version and its files |
| [`version.from-hashes`](version.from-hashes.md) | read | Look up the versions containing each of several file hashes (returns hash -> version) |
| [`version.latest`](version.latest.md) | read | Given file hash(es), find the newest compatible version of each project (update checking) |

## team

| Operation | Tier | Summary |
|---|---|---|
| [`team.members`](team.members.md) | read | List a project's team members with roles and decoded permissions |
| [`team.invite`](team.invite.md) | write | Invite a user to a project's team (they must accept) |
| [`team.member.update`](team.member.update.md) | write | Change a member's role, permissions, payout split, or ordering |
| [`team.member.remove`](team.member.remove.md) | destructive | Remove a member (or cancel an invite) from a project's team |
| [`team.transfer-ownership`](team.transfer-ownership.md) | destructive | Transfer project ownership to another existing team member |
| [`team.join`](team.join.md) | write | Accept a pending invite to a project's team |

## org

| Operation | Tier | Summary |
|---|---|---|
| [`org.get`](org.get.md) | read | Get an organization (v3 API) |
| [`org.projects`](org.projects.md) | read | List an organization's projects (v3 API) |
| [`org.create`](org.create.md) | write | Create an organization (v3 API) |
| [`org.update`](org.update.md) | write | Edit an organization's slug, name, or description (v3 API) |
| [`org.icon.set`](org.icon.set.md) | write | Upload an organization icon (v3 API) |
| [`org.project.add`](org.project.add.md) | write | Move one of your projects into an organization (v3 API) |
| [`org.project.remove`](org.project.remove.md) | destructive | Remove a project from an organization, handing it to a new owner (v3 API) |
| [`org.delete`](org.delete.md) | destructive | Delete an organization; its projects go back to the org owner (v3 API) |

## analytics

| Operation | Tier | Summary |
|---|---|---|
| [`analytics.get`](analytics.get.md) | read | Fetch views/downloads/playtime/revenue time series for your projects (v3 API) |

## follow

| Operation | Tier | Summary |
|---|---|---|
| [`follow.add`](follow.add.md) | write | Follow a project |
| [`follow.remove`](follow.remove.md) | write | Unfollow a project |

## notification

| Operation | Tier | Summary |
|---|---|---|
| [`notification.list`](notification.list.md) | read | List your notifications (team invites, new versions of followed projects, moderation...) |
| [`notification.get`](notification.get.md) | read | Get a notification by ID |
| [`notification.read`](notification.read.md) | write | Mark one or more notifications as read |
| [`notification.delete`](notification.delete.md) | destructive | Delete one or more notifications |

## report

| Operation | Tier | Summary |
|---|---|---|
| [`report.create`](report.create.md) | destructive | File a report to Modrinth moderators about a project, version, or user |
| [`report.list`](report.list.md) | read | List reports you have filed |
| [`report.get`](report.get.md) | read | Get a report by ID |
| [`report.update`](report.update.md) | write | Edit the body of your report, or close it |

## thread

| Operation | Tier | Summary |
|---|---|---|
| [`thread.get`](thread.get.md) | read | Read a moderation thread: by thread ID, or a project's thread via `project` |
| [`thread.send`](thread.send.md) | write | Reply in a moderation thread (e.g. answer a moderator about your project) |
| [`thread.message.delete`](thread.message.delete.md) | destructive | Delete one of your messages in a thread |

## collection

| Operation | Tier | Summary |
|---|---|---|
| [`collection.list`](collection.list.md) | read | List a user's collections (v3 API) |
| [`collection.get`](collection.get.md) | read | Get a collection (v3 API) |
| [`collection.create`](collection.create.md) | write | Create a collection of projects (v3 API) |
| [`collection.update`](collection.update.md) | write | Edit a collection's name, description, visibility, or project list (v3 API) |
| [`collection.icon.set`](collection.icon.set.md) | write | Upload a collection icon (v3 API) |
| [`collection.delete`](collection.delete.md) | destructive | Delete a collection (v3 API) |
