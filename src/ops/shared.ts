import { z } from "zod";
import type { components } from "../client/generated.js";
import type { OpContext } from "../op.js";

export type Project = components["schemas"]["Project"];
export type Version = components["schemas"]["Version"];
export type TeamMember = components["schemas"]["TeamMember"];
export type User = components["schemas"]["User"];
export type GalleryImage = components["schemas"]["GalleryImage"];

export const projectId = z.string().min(1).describe("Project ID or slug");
export const versionId = z.string().min(1).describe("Version ID");
export const strList = z.array(z.string());

export const enc = encodeURIComponent;

export function getProject(ctx: OpContext, id: string): Promise<Project> {
  return ctx.client.request<Project>("GET", `/project/${enc(id)}`);
}

/** Accept a user ID or username; team endpoints need the ID. */
export async function resolveUserId(ctx: OpContext, user: string): Promise<string> {
  const u = await ctx.client.request<User>("GET", `/user/${enc(user)}`);
  return u.id;
}

// Bit order from the Modrinth spec (ModifyTeamMemberBody.permissions).
export const PERMISSIONS = [
  "UPLOAD_VERSION",
  "DELETE_VERSION",
  "EDIT_DETAILS",
  "EDIT_BODY",
  "MANAGE_INVITES",
  "REMOVE_MEMBER",
  "EDIT_MEMBER",
  "DELETE_PROJECT",
  "VIEW_ANALYTICS",
  "VIEW_PAYOUTS",
] as const;

export const permissionsInput = z
  .union([z.number().int().min(0), z.array(z.enum(PERMISSIONS))])
  .describe(`Bitfield integer, or a list of names: ${PERMISSIONS.join(", ")}`);

export function toBitfield(p: number | readonly string[]): number {
  if (typeof p === "number") return p;
  return p.reduce((acc, name) => acc | (1 << PERMISSIONS.indexOf(name as (typeof PERMISSIONS)[number])), 0);
}

export function fromBitfield(bits: number): string[] {
  return PERMISSIONS.filter((_, i) => bits & (1 << i));
}
