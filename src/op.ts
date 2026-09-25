import { z } from "zod";
import type { ModrinthClient } from "./client/http.js";
import { ModrinthError } from "./errors.js";

export type Tier = "read" | "write" | "destructive";
export const TIERS: Tier[] = ["read", "write", "destructive"];

export interface OpContext {
  client: ModrinthClient;
  /** Caller explicitly confirmed a destructive action (--yes / confirm:true). */
  confirm: boolean;
}

export interface Op<S extends z.ZodObject = z.ZodObject> {
  /** Dotted name: `project.update`. CLI: `modrinth project update`. MCP: `project_update`. */
  name: string;
  tier: Tier;
  summary: string;
  description?: string;
  /** Modrinth PAT scope required, for docs and auth hints. */
  scope?: string;
  input: S;
  examples?: { args: Record<string, unknown>; note: string }[];
  /** Positional CLI args, in order (must be keys of input). */
  positional?: string[];
  /** Escalate a write op to destructive for some inputs (e.g. making a project public). */
  destructiveIf?: (input: z.infer<S>) => boolean;
  /** Human sentence describing what a destructive call would do. */
  preview?: (input: z.infer<S>, ctx: OpContext) => string | Promise<string>;
  run: (input: z.infer<S>, ctx: OpContext) => Promise<unknown>;
}

export function defineOp<S extends z.ZodObject>(op: Op<S>): Op<S> {
  return op;
}

export interface ConfirmRequired {
  dryRun: true;
  confirmRequired: true;
  op: string;
  wouldDo: string;
  hint: string;
}

export function isConfirmRequired(x: unknown): x is ConfirmRequired {
  return !!x && typeof x === "object" && (x as ConfirmRequired).confirmRequired === true;
}

export function effectiveTier(op: Op, input: unknown): Tier {
  return op.tier === "write" && op.destructiveIf?.(input as never) ? "destructive" : op.tier;
}

/** The single execution path for CLI, MCP, and sync. */
export async function execute(op: Op, rawInput: unknown, ctx: OpContext): Promise<unknown> {
  const input = op.input.parse(rawInput ?? {});
  if (effectiveTier(op, input) === "destructive" && !ctx.confirm) {
    const wouldDo = op.preview ? await op.preview(input, ctx) : `${op.name} ${JSON.stringify(input)}`;
    return {
      dryRun: true,
      confirmRequired: true,
      op: op.name,
      wouldDo,
      hint: "Destructive or public action. Show this to the user; re-run with --yes (CLI) or confirm:true (MCP) once approved.",
    } satisfies ConfirmRequired;
  }
  if (op.tier !== "read" && !ctx.client.hasToken) {
    throw new ModrinthError(
      "auth",
      `${op.name} requires a token`,
      undefined,
      "Set MODRINTH_TOKEN or run `modrinth auth login --token <pat>`.",
    );
  }
  return op.run(input, ctx);
}
