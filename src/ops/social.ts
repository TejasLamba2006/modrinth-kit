// Account & social operations (roadmap scope B). Routes verified against
// apps/labrinth/src/routes/{v2/users,v2/notifications,v2/reports,v2/threads,v3/collections}.rs
import { z } from "zod";
import { loadFile } from "../files.js";
import { defineOp } from "../op.js";
import { enc, projectId, strList, type User } from "./shared.js";

const me = async (ctx: Parameters<typeof userGet.run>[1]) => (await ctx.client.request<User>("GET", "/user")).id;
const userArg = z.string().optional().describe("User ID or username; omit for yourself");
const idList = z.array(z.string()).min(1);

// --- users -----------------------------------------------------------------

export const userGet = defineOp({
  name: "user.get",
  tier: "read",
  summary: "Get a user's public profile",
  input: z.object({ user: z.string().describe("User ID or username") }),
  positional: ["user"],
  run: ({ user }, ctx) => ctx.client.request("GET", `/user/${enc(user)}`),
});

export const userUpdate = defineOp({
  name: "user.update",
  tier: "write",
  scope: "USER_WRITE",
  summary: "Edit your profile: username, display name, bio",
  input: z.object({
    user: userArg,
    username: z.string().min(1).max(39).optional(),
    name: z.string().max(64).nullable().optional().describe("Display name; null clears it"),
    bio: z.string().max(160).nullable().optional(),
  }),
  async run({ user, ...rest }, ctx) {
    const id = user ?? (await me(ctx));
    const json = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
    await ctx.client.request("PATCH", `/user/${enc(id)}`, { json, scope: "USER_WRITE" });
    return { ok: true, user: id, updated: Object.keys(json) };
  },
});

export const userIconSet = defineOp({
  name: "user.icon.set",
  tier: "write",
  scope: "USER_WRITE",
  summary: "Upload your avatar",
  input: z.object({ file: z.string(), user: userArg }),
  positional: ["file"],
  async run({ file, user }, ctx) {
    const id = user ?? (await me(ctx));
    const f = await loadFile(file);
    await ctx.client.request("PATCH", `/user/${enc(id)}/icon`, {
      query: { ext: f.ext },
      body: f.blob,
      headers: { "Content-Type": f.blob.type },
      scope: "USER_WRITE",
    });
    return { ok: true, user: id, sha1: f.sha1 };
  },
});

export const userIconDelete = defineOp({
  name: "user.icon.delete",
  tier: "destructive",
  scope: "USER_WRITE",
  summary: "Remove your avatar",
  input: z.object({ user: userArg }),
  preview: (i) => `remove the avatar of ${i.user ?? "your account"}`,
  async run({ user }, ctx) {
    const id = user ?? (await me(ctx));
    await ctx.client.request("DELETE", `/user/${enc(id)}/icon`, { scope: "USER_WRITE" });
    return { ok: true, user: id };
  },
});

// --- follows ---------------------------------------------------------------

export const userFollows = defineOp({
  name: "user.follows",
  tier: "read",
  scope: "USER_READ",
  summary: "List projects a user follows (only your own is permitted)",
  input: z.object({ user: userArg }),
  positional: ["user"],
  async run({ user }, ctx) {
    return ctx.client.request("GET", `/user/${enc(user ?? (await me(ctx)))}/follows`, { scope: "USER_READ" });
  },
});

export const followAdd = defineOp({
  name: "follow.add",
  tier: "write",
  scope: "USER_WRITE",
  summary: "Follow a project",
  input: z.object({ project: projectId }),
  positional: ["project"],
  async run({ project }, ctx) {
    await ctx.client.request("POST", `/project/${enc(project)}/follow`, { scope: "USER_WRITE" });
    return { ok: true, followed: project };
  },
});

export const followRemove = defineOp({
  name: "follow.remove",
  tier: "write",
  scope: "USER_WRITE",
  summary: "Unfollow a project",
  input: z.object({ project: projectId }),
  positional: ["project"],
  async run({ project }, ctx) {
    await ctx.client.request("DELETE", `/project/${enc(project)}/follow`, { scope: "USER_WRITE" });
    return { ok: true, unfollowed: project };
  },
});

// --- notifications ---------------------------------------------------------

export const notificationList = defineOp({
  name: "notification.list",
  tier: "read",
  scope: "NOTIFICATION_READ",
  summary: "List your notifications (team invites, new versions of followed projects, moderation...)",
  input: z.object({ unread: z.boolean().optional().describe("Only unread ones") }),
  async run({ unread }, ctx) {
    const list = await ctx.client.request<{ read: boolean }[]>("GET", `/user/${enc(await me(ctx))}/notifications`, {
      scope: "NOTIFICATION_READ",
    });
    return unread ? list.filter((n) => !n.read) : list;
  },
});

export const notificationGet = defineOp({
  name: "notification.get",
  tier: "read",
  scope: "NOTIFICATION_READ",
  summary: "Get a notification by ID",
  input: z.object({ id: z.string() }),
  positional: ["id"],
  run: ({ id }, ctx) => ctx.client.request("GET", `/notification/${enc(id)}`, { scope: "NOTIFICATION_READ" }),
});

export const notificationRead = defineOp({
  name: "notification.read",
  tier: "write",
  scope: "NOTIFICATION_WRITE",
  summary: "Mark one or more notifications as read",
  input: z.object({ ids: idList }),
  async run({ ids }, ctx) {
    if (ids.length === 1) await ctx.client.request("PATCH", `/notification/${enc(ids[0]!)}`, { scope: "NOTIFICATION_WRITE" });
    else await ctx.client.request("PATCH", "/notifications", { query: { ids }, scope: "NOTIFICATION_WRITE" });
    return { ok: true, read: ids };
  },
});

export const notificationDelete = defineOp({
  name: "notification.delete",
  tier: "destructive",
  scope: "NOTIFICATION_WRITE",
  summary: "Delete one or more notifications",
  input: z.object({ ids: idList }),
  preview: (i) => `delete ${i.ids.length} notification(s): ${i.ids.join(", ")}`,
  async run({ ids }, ctx) {
    if (ids.length === 1) await ctx.client.request("DELETE", `/notification/${enc(ids[0]!)}`, { scope: "NOTIFICATION_WRITE" });
    else await ctx.client.request("DELETE", "/notifications", { query: { ids }, scope: "NOTIFICATION_WRITE" });
    return { ok: true, deleted: ids };
  },
});

// --- reports ---------------------------------------------------------------

export const reportCreate = defineOp({
  name: "report.create",
  tier: "destructive",
  scope: "REPORT_CREATE",
  summary: "File a report to Modrinth moderators about a project, version, or user",
  description: "Outward-facing (sent to moderators), so it needs confirmation. Get valid `report_type` values from `tag list report_type`.",
  input: z.object({
    item_type: z.enum(["project", "version", "user"]),
    item_id: z.string().describe("ID of the reported item"),
    report_type: z.string().describe("e.g. spam, copyright, malicious; see `tag list report_type`"),
    body: z.string().min(1).describe("Markdown explanation"),
  }),
  preview: (i) => `send a "${i.report_type}" report about ${i.item_type} ${i.item_id} to Modrinth moderators`,
  run: (json, ctx) => ctx.client.request("POST", "/report", { json, scope: "REPORT_CREATE" }),
});

export const reportList = defineOp({
  name: "report.list",
  tier: "read",
  scope: "REPORT_READ",
  summary: "List reports you have filed",
  input: z.object({ count: z.number().int().min(1).max(1000).optional(), all: z.boolean().optional().describe("Include closed reports") }),
  run: (query, ctx) => ctx.client.request("GET", "/report", { query, scope: "REPORT_READ" }),
});

export const reportGet = defineOp({
  name: "report.get",
  tier: "read",
  scope: "REPORT_READ",
  summary: "Get a report by ID",
  input: z.object({ id: z.string() }),
  positional: ["id"],
  run: ({ id }, ctx) => ctx.client.request("GET", `/report/${enc(id)}`, { scope: "REPORT_READ" }),
});

export const reportUpdate = defineOp({
  name: "report.update",
  tier: "write",
  scope: "REPORT_WRITE",
  summary: "Edit the body of your report, or close it",
  input: z.object({ id: z.string(), body: z.string().optional(), closed: z.boolean().optional() }),
  positional: ["id"],
  async run({ id, ...rest }, ctx) {
    const json = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
    await ctx.client.request("PATCH", `/report/${enc(id)}`, { json, scope: "REPORT_WRITE" });
    return { ok: true, id, updated: Object.keys(json) };
  },
});

// --- threads (moderation conversations) -------------------------------------

export const threadGet = defineOp({
  name: "thread.get",
  tier: "read",
  scope: "THREAD_READ",
  summary: "Read a moderation thread: by thread ID, or a project's thread via `project`",
  input: z.object({ id: z.string().optional().describe("Thread ID"), project: projectId.optional() }).refine((i) => !!i.id !== !!i.project, {
    message: "Pass exactly one of `id` or `project`",
  }),
  positional: ["id"],
  async run({ id, project }, ctx) {
    const threadId = id ?? (await ctx.client.request<{ thread_id: string }>("GET", `/project/${enc(project!)}`)).thread_id;
    return ctx.client.request("GET", `/thread/${enc(threadId)}`, { scope: "THREAD_READ" });
  },
});

export const threadSend = defineOp({
  name: "thread.send",
  tier: "write",
  scope: "THREAD_WRITE",
  summary: "Reply in a moderation thread (e.g. answer a moderator about your project)",
  input: z.object({
    id: z.string().optional().describe("Thread ID"),
    project: projectId.optional(),
    body: z.string().min(1),
    replying_to: z.string().optional().describe("Message ID being replied to"),
  }).refine((i) => !!i.id !== !!i.project, { message: "Pass exactly one of `id` or `project`" }),
  positional: ["id"],
  async run({ id, project, body, replying_to }, ctx) {
    const threadId = id ?? (await ctx.client.request<{ thread_id: string }>("GET", `/project/${enc(project!)}`)).thread_id;
    await ctx.client.request("POST", `/thread/${enc(threadId)}`, {
      json: { body: { type: "text", body, replying_to: replying_to ?? null } },
      scope: "THREAD_WRITE",
    });
    return { ok: true, thread: threadId };
  },
});

export const threadMessageDelete = defineOp({
  name: "thread.message.delete",
  tier: "destructive",
  scope: "THREAD_WRITE",
  summary: "Delete one of your messages in a thread",
  input: z.object({ id: z.string().describe("Message ID") }),
  positional: ["id"],
  preview: (i) => `delete thread message ${i.id}`,
  async run({ id }, ctx) {
    await ctx.client.request("DELETE", `/message/${enc(id)}`, { scope: "THREAD_WRITE" });
    return { ok: true, deleted: id };
  },
});

// --- collections (v3) ------------------------------------------------------

const v3 = { api: "v3" as const };
const collectionStatus = z.enum(["listed", "unlisted", "private"]);

export const collectionList = defineOp({
  name: "collection.list",
  tier: "read",
  scope: "COLLECTION_READ",
  summary: "List a user's collections (v3 API)",
  input: z.object({ user: userArg }),
  positional: ["user"],
  async run({ user }, ctx) {
    return ctx.client.request("GET", `/user/${enc(user ?? (await me(ctx)))}/collections`, { ...v3, scope: "COLLECTION_READ" });
  },
});

export const collectionGet = defineOp({
  name: "collection.get",
  tier: "read",
  summary: "Get a collection (v3 API)",
  input: z.object({ id: z.string() }),
  positional: ["id"],
  run: ({ id }, ctx) => ctx.client.request("GET", `/collection/${enc(id)}`, v3),
});

export const collectionCreate = defineOp({
  name: "collection.create",
  tier: "write",
  scope: "COLLECTION_CREATE",
  summary: "Create a collection of projects (v3 API)",
  input: z.object({
    name: z.string().min(3).max(64),
    description: z.string().min(3).max(255).optional(),
    projects: strList.default([]).describe("Project IDs"),
  }),
  run: (json, ctx) => ctx.client.request("POST", "/collection", { ...v3, json, scope: "COLLECTION_CREATE" }),
});

export const collectionUpdate = defineOp({
  name: "collection.update",
  tier: "write",
  scope: "COLLECTION_WRITE",
  summary: "Edit a collection's name, description, visibility, or project list (v3 API)",
  description: "`projects` replaces the whole list. Use `add`/`remove` to change it incrementally.",
  input: z.object({
    id: z.string(),
    name: z.string().min(3).max(64).optional(),
    description: z.string().min(3).max(256).nullable().optional(),
    status: collectionStatus.optional(),
    projects: strList.optional().describe("Full replacement list of project IDs"),
    add: strList.optional().describe("Project IDs to add"),
    remove: strList.optional().describe("Project IDs to remove"),
  }),
  positional: ["id"],
  async run({ id, projects, add, remove, ...rest }, ctx) {
    const json: Record<string, unknown> = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
    if (projects || add || remove) {
      let list = projects;
      if (!list) {
        const cur = await ctx.client.request<{ projects: string[] }>("GET", `/collection/${enc(id)}`, v3);
        list = cur.projects;
      }
      json.new_projects = [...new Set([...list, ...(add ?? [])])].filter((p) => !remove?.includes(p));
    }
    await ctx.client.request("PATCH", `/collection/${enc(id)}`, { ...v3, json, scope: "COLLECTION_WRITE" });
    return { ok: true, id, updated: Object.keys(json) };
  },
});

export const collectionIconSet = defineOp({
  name: "collection.icon.set",
  tier: "write",
  scope: "COLLECTION_WRITE",
  summary: "Upload a collection icon (v3 API)",
  input: z.object({ id: z.string(), file: z.string() }),
  positional: ["id", "file"],
  async run({ id, file }, ctx) {
    const f = await loadFile(file);
    await ctx.client.request("PATCH", `/collection/${enc(id)}/icon`, {
      ...v3,
      query: { ext: f.ext },
      body: f.blob,
      headers: { "Content-Type": f.blob.type },
      scope: "COLLECTION_WRITE",
    });
    return { ok: true, id };
  },
});

export const collectionDelete = defineOp({
  name: "collection.delete",
  tier: "destructive",
  scope: "COLLECTION_DELETE",
  summary: "Delete a collection (v3 API)",
  input: z.object({ id: z.string() }),
  positional: ["id"],
  async preview({ id }, ctx) {
    const c = await ctx.client.request<{ name: string; projects: string[] }>("GET", `/collection/${enc(id)}`, v3);
    return `delete collection "${c.name}" (${id}) with ${c.projects.length} project(s)`;
  },
  async run({ id }, ctx) {
    await ctx.client.request("DELETE", `/collection/${enc(id)}`, { ...v3, scope: "COLLECTION_DELETE" });
    return { ok: true, deleted: id };
  },
});

export default [
  userGet,
  userUpdate,
  userIconSet,
  userIconDelete,
  userFollows,
  followAdd,
  followRemove,
  notificationList,
  notificationGet,
  notificationRead,
  notificationDelete,
  reportCreate,
  reportList,
  reportGet,
  reportUpdate,
  threadGet,
  threadSend,
  threadMessageDelete,
  collectionList,
  collectionGet,
  collectionCreate,
  collectionUpdate,
  collectionIconSet,
  collectionDelete,
];
