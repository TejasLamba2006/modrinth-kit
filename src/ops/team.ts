import { z } from "zod";
import { defineOp } from "../op.js";
import { enc, fromBitfield, getProject, permissionsInput, projectId, resolveUserId, toBitfield, type TeamMember } from "./shared.js";

const teamOf = async (ctx: Parameters<typeof resolveUserId>[0], project: string) => (await getProject(ctx, project)).team;

export const teamMembers = defineOp({
  name: "team.members",
  tier: "read",
  summary: "List a project's team members with roles and decoded permissions",
  input: z.object({ project: projectId }),
  positional: ["project"],
  async run({ project }, ctx) {
    const members = await ctx.client.request<TeamMember[]>("GET", `/project/${enc(project)}/members`);
    return members.map((m) => ({ ...m, permission_names: m.permissions == null ? undefined : fromBitfield(m.permissions) }));
  },
});

export const teamInvite = defineOp({
  name: "team.invite",
  tier: "write",
  scope: "PROJECT_WRITE",
  summary: "Invite a user to a project's team (they must accept)",
  input: z.object({ project: projectId, user: z.string().describe("User ID or username") }),
  positional: ["project", "user"],
  async run({ project, user }, ctx) {
    const [team, user_id] = await Promise.all([teamOf(ctx, project), resolveUserId(ctx, user)]);
    await ctx.client.request("POST", `/team/${enc(team)}/members`, { json: { user_id }, scope: "PROJECT_WRITE" });
    return { ok: true, project, invited: user_id };
  },
});

export const teamMemberUpdate = defineOp({
  name: "team.member.update",
  tier: "write",
  scope: "PROJECT_WRITE",
  summary: "Change a member's role, permissions, payout split, or ordering",
  input: z.object({
    project: projectId,
    user: z.string().describe("User ID or username"),
    role: z.string().optional().describe("Free-text role label, e.g. Developer"),
    permissions: permissionsInput.optional(),
    payouts_split: z.number().int().min(0).optional(),
    ordering: z.number().int().optional(),
  }),
  positional: ["project", "user"],
  examples: [{ args: { project: "my-plugin", user: "alice", role: "Developer", permissions: ["UPLOAD_VERSION", "EDIT_BODY"] }, note: "Named permissions" }],
  async run({ project, user, permissions, ...rest }, ctx) {
    const [team, id] = await Promise.all([teamOf(ctx, project), resolveUserId(ctx, user)]);
    const json: Record<string, unknown> = Object.fromEntries(Object.entries(rest).filter(([, v]) => v !== undefined));
    if (permissions !== undefined) json.permissions = toBitfield(permissions);
    await ctx.client.request("PATCH", `/team/${enc(team)}/members/${enc(id)}`, { json, scope: "PROJECT_WRITE" });
    return { ok: true, project, user: id, updated: Object.keys(json) };
  },
});

export const teamMemberRemove = defineOp({
  name: "team.member.remove",
  tier: "destructive",
  scope: "PROJECT_WRITE",
  summary: "Remove a member (or cancel an invite) from a project's team",
  input: z.object({ project: projectId, user: z.string() }),
  positional: ["project", "user"],
  preview: (i) => `remove ${i.user} from the team of project ${i.project}`,
  async run({ project, user }, ctx) {
    const [team, id] = await Promise.all([teamOf(ctx, project), resolveUserId(ctx, user)]);
    await ctx.client.request("DELETE", `/team/${enc(team)}/members/${enc(id)}`, { scope: "PROJECT_WRITE" });
    return { ok: true, project, removed: id };
  },
});

export const teamTransferOwnership = defineOp({
  name: "team.transfer-ownership",
  tier: "destructive",
  scope: "PROJECT_WRITE",
  summary: "Transfer project ownership to another existing team member",
  input: z.object({ project: projectId, user: z.string() }),
  positional: ["project", "user"],
  preview: (i) => `transfer ownership of project ${i.project} to ${i.user} (you lose owner rights)`,
  async run({ project, user }, ctx) {
    const [team, user_id] = await Promise.all([teamOf(ctx, project), resolveUserId(ctx, user)]);
    await ctx.client.request("PATCH", `/team/${enc(team)}/owner`, { json: { user_id }, scope: "PROJECT_WRITE" });
    return { ok: true, project, owner: user_id };
  },
});

export default [teamMembers, teamInvite, teamMemberUpdate, teamMemberRemove, teamTransferOwnership];
