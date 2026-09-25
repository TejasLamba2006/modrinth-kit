import { z } from "zod";
import { defineOp } from "../op.js";
import { enc, type User } from "./shared.js";

export const whoami = defineOp({
  name: "auth.whoami",
  tier: "read",
  summary: "Return the user the current token belongs to",
  description: "Use this first to verify a token works. Fails with code `auth` if no/invalid token.",
  input: z.object({}),
  run: (_, ctx) => ctx.client.request<User>("GET", "/user"),
});

export const userProjects = defineOp({
  name: "user.projects",
  tier: "read",
  summary: "List projects owned by or shared with a user (defaults to the token's user)",
  input: z.object({ user: z.string().optional().describe("User ID or username; omit for yourself") }),
  positional: ["user"],
  async run({ user }, ctx) {
    const id = user ?? (await ctx.client.request<User>("GET", "/user")).id;
    return ctx.client.request("GET", `/user/${enc(id)}/projects`);
  },
});

export const search = defineOp({
  name: "search",
  tier: "read",
  summary: "Search public Modrinth projects",
  description:
    "Convenience filters (`project_type`, `categories`, `versions`, `loaders`) are ANDed and turned into Modrinth facets. " +
    "Pass raw `facets` (array of OR-groups) for anything else.",
  input: z.object({
    query: z.string().optional(),
    project_type: z.string().optional().describe("mod, plugin, modpack, resourcepack, shader, datapack"),
    categories: z.array(z.string()).optional(),
    versions: z.array(z.string()).optional().describe("Minecraft versions"),
    loaders: z.array(z.string()).optional().describe("Loaders are categories on Modrinth, e.g. paper, fabric"),
    facets: z.array(z.array(z.string())).optional().describe('Raw facets, e.g. [["categories:fabric"],["versions:1.21.1"]]'),
    index: z.enum(["relevance", "downloads", "follows", "newest", "updated"]).optional(),
    offset: z.number().int().min(0).optional(),
    limit: z.number().int().min(1).max(100).optional(),
  }),
  positional: ["query"],
  examples: [{ args: { query: "admin", project_type: "plugin", loaders: ["paper"] }, note: "Paper admin plugins" }],
  run(i, ctx) {
    const facets = [...(i.facets ?? [])];
    if (i.project_type) facets.push([`project_type:${i.project_type}`]);
    for (const c of [...(i.categories ?? []), ...(i.loaders ?? [])]) facets.push([`categories:${c}`]);
    if (i.versions?.length) facets.push(i.versions.map((v) => `versions:${v}`));
    return ctx.client.request("GET", "/search", {
      query: {
        query: i.query,
        facets: facets.length ? JSON.stringify(facets) : undefined,
        index: i.index,
        offset: i.offset,
        limit: i.limit,
      },
    });
  },
});

const TAGS = [
  "category",
  "loader",
  "game_version",
  "license",
  "donation_platform",
  "report_type",
  "project_type",
  "side_type",
] as const;

export const tagList = defineOp({
  name: "tag.list",
  tier: "read",
  summary: "List valid values for categories, loaders, game versions, licenses, etc.",
  description: "Use before creating/updating projects or versions to get valid category/loader/game_version values.",
  input: z.object({ type: z.enum(TAGS) }),
  positional: ["type"],
  examples: [{ args: { type: "loader" }, note: "All loaders" }],
  run: ({ type }, ctx) => ctx.client.request("GET", `/tag/${type}`),
});

export default [whoami, userProjects, search, tagList];
