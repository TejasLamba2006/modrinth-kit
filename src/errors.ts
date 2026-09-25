export type ErrorCode =
  | "usage"
  | "invalid"
  | "auth"
  | "not_found"
  | "rate_limited"
  | "api"
  | "confirm_required"
  | "network";

export const EXIT: Record<ErrorCode, number> = {
  usage: 1,
  invalid: 1,
  auth: 3,
  not_found: 2,
  rate_limited: 2,
  api: 2,
  network: 2,
  confirm_required: 4,
};

export class ModrinthError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public status?: number,
    public hint?: string,
    public details?: unknown,
  ) {
    super(message);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        status: this.status,
        message: this.message,
        hint: this.hint,
        details: this.details,
      },
    };
  }
}

export function toModrinthError(e: unknown): ModrinthError {
  if (e instanceof ModrinthError) return e;
  if (e && typeof e === "object" && "issues" in e) {
    // zod error
    const issues = (e as { issues: { path: PropertyKey[]; message: string }[] }).issues;
    return new ModrinthError(
      "invalid",
      issues.map((i) => `${i.path.join(".") || "(input)"}: ${i.message}`).join("; "),
      undefined,
      undefined,
      issues,
    );
  }
  return new ModrinthError("api", e instanceof Error ? e.message : String(e));
}
