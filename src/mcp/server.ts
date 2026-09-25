import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { toModrinthError } from "../errors.js";
import { execute, TIERS, type OpContext, type Tier } from "../op.js";
import { ops } from "../ops/index.js";
import { publish, sync } from "../sync/index.js";
import { VERSION } from "../version.js";

export const toolName = (opName: string) => opName.replace(/[.-]/g, "_");

const CONFIRM_NOTE =
  "\n\nDESTRUCTIVE: without `confirm: true` this returns a preview ({confirmRequired, wouldDo}) and changes nothing. " +
  "Show `wouldDo` to the user and only call again with confirm:true after they approve.";

export interface McpOptions {
  ctx: OpContext;
  readOnly?: boolean;
  allow?: string[];
}

export function allowedTiers(opts: Pick<McpOptions, "readOnly" | "allow">): Set<Tier> {
  if (opts.readOnly) return new Set(["read"]);
  if (opts.allow?.length) return new Set(opts.allow.filter((t): t is Tier => (TIERS as string[]).includes(t)));
  return new Set(TIERS);
}

export function buildServer(opts: McpOptions): McpServer {
  const server = new McpServer({ name: "modrinth-kit", version: VERSION });
  const allowed = allowedTiers(opts);
  const call = async (fn: (ctx: OpContext) => Promise<unknown>, confirm: boolean) => {
    try {
      const result = await fn({ ...opts.ctx, confirm });
      return { content: [{ type: "text" as const, text: JSON.stringify(result) }] };
    } catch (e) {
      return { isError: true, content: [{ type: "text" as const, text: JSON.stringify(toModrinthError(e).toJSON()) }] };
    }
  };

  for (const op of ops) {
    if (!allowed.has(op.tier)) continue;
    // Without the destructive tier, `confirm` is never offered, so escalating writes (status changes) can only preview.
    const canConfirm = allowed.has("destructive") && (op.tier === "destructive" || !!op.destructiveIf);
    const shape = canConfirm ? op.input.extend({ confirm: z.boolean().optional().describe("Set true only after the user approved the preview") }) : op.input;
    server.registerTool(
      toolName(op.name),
      {
        title: op.summary,
        description: [op.summary, op.description, op.scope ? `Token scope: ${op.scope}.` : ""].filter(Boolean).join("\n\n") + (canConfirm ? CONFIRM_NOTE : ""),
        inputSchema: shape.shape,
        annotations: {
          readOnlyHint: op.tier === "read",
          destructiveHint: op.tier === "destructive" || !!op.destructiveIf,
          openWorldHint: true,
        },
      },
      async (args: Record<string, unknown>) => {
        const { confirm, ...input } = args;
        return call((ctx) => execute(op, input, ctx), canConfirm && confirm === true);
      },
    );
  }

  if (allowed.has("write")) {
    server.registerTool(
      "sync",
      {
        title: "Apply modrinth.toml to the project",
        description:
          "Reads modrinth.toml (metadata, body file, icon, gallery) from the working directory and updates the Modrinth project to match. " +
          "Call with dry_run:true first and show the change list to the user." + (allowed.has("destructive") ? CONFIRM_NOTE : ""),
        inputSchema: {
          manifest: z.string().optional().describe("Path to modrinth.toml"),
          dry_run: z.boolean().optional(),
          prune: z.boolean().optional().describe("Delete remote gallery images not in the manifest"),
          ...(allowed.has("destructive") ? { confirm: z.boolean().optional() } : {}),
        },
        annotations: { destructiveHint: true, openWorldHint: true },
      },
      async (a) => call((ctx) => sync({ manifest: a.manifest, dryRun: a.dry_run, prune: a.prune }, ctx), a.confirm === true),
    );
    server.registerTool(
      "publish",
      {
        title: "Publish a version from modrinth.toml",
        description: "Creates a version using [version] defaults from modrinth.toml. Idempotent: returns {skipped:true} if the version number exists.",
        inputSchema: {
          version: z.string().describe("Version number, e.g. 1.4.6"),
          manifest: z.string().optional(),
          changelog: z.string().optional().describe("Overrides changelog_file"),
          channel: z.enum(["release", "beta", "alpha"]).optional(),
          dry_run: z.boolean().optional(),
        },
        annotations: { openWorldHint: true },
      },
      async (a) => call((ctx) => publish({ version: a.version, manifest: a.manifest, changelog: a.changelog, channel: a.channel, dryRun: a.dry_run }, ctx), false),
    );
  }
  return server;
}

export async function startMcp(opts: McpOptions) {
  const server = buildServer(opts);
  await server.connect(new StdioServerTransport());
  process.stderr.write(`modrinth-kit MCP ${VERSION} on stdio (${opts.ctx.client.baseUrl})\n`);
}
