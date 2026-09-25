import { ModrinthError } from "../errors.js";
import { VERSION } from "../version.js";

export const PROD_URL = "https://api.modrinth.com";
export const STAGING_URL = "https://staging-api.modrinth.com";

export interface ClientOptions {
  token?: string;
  staging?: boolean;
  baseUrl?: string;
  userAgent?: string;
  /** Max retries for 429/5xx. */
  retries?: number;
  fetch?: typeof fetch;
}

export interface RequestOptions {
  query?: Record<string, string | number | boolean | string[] | undefined>;
  json?: unknown;
  body?: BodyInit;
  headers?: Record<string, string>;
  /** API version prefix; defaults to v2. */
  api?: "v2" | "v3";
  /** Token scope the endpoint needs; used in auth error hints. */
  scope?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class ModrinthClient {
  readonly baseUrl: string;
  private readonly token?: string;
  private readonly userAgent: string;
  private readonly retries: number;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: ClientOptions = {}) {
    this.baseUrl = opts.baseUrl ?? (opts.staging ? STAGING_URL : PROD_URL);
    this.token = opts.token;
    this.userAgent =
      opts.userAgent ?? `modrinth-kit/${VERSION} (github.com/TejasLamba2006/modrinth-kit)`;
    this.retries = opts.retries ?? 3;
    this.fetchImpl = opts.fetch ?? fetch;
  }

  get hasToken() {
    return !!this.token;
  }

  url(path: string, opts: RequestOptions = {}): string {
    const u = new URL(`${this.baseUrl}/${opts.api ?? "v2"}${path}`);
    for (const [k, v] of Object.entries(opts.query ?? {})) {
      if (v === undefined) continue;
      u.searchParams.set(k, Array.isArray(v) ? JSON.stringify(v) : String(v));
    }
    return u.toString();
  }

  async request<T = unknown>(method: string, path: string, opts: RequestOptions = {}): Promise<T> {
    const headers: Record<string, string> = { "User-Agent": this.userAgent, ...opts.headers };
    if (this.token) headers.Authorization = this.token;
    let body = opts.body;
    if (opts.json !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(opts.json);
    }
    const url = this.url(path, opts);

    for (let attempt = 0; ; attempt++) {
      let res: Response;
      try {
        res = await this.fetchImpl(url, { method, headers, body });
      } catch (e) {
        if (attempt < this.retries) {
          await sleep(500 * 2 ** attempt);
          continue;
        }
        throw new ModrinthError("network", `${method} ${url} failed: ${(e as Error).message}`);
      }

      const retryable = res.status === 429 || res.status >= 500;
      if (retryable && attempt < this.retries) {
        const reset = Number(res.headers.get("x-ratelimit-reset"));
        await sleep(res.status === 429 && reset > 0 ? reset * 1000 : 500 * 2 ** attempt);
        continue;
      }

      const text = await res.text();
      let data: unknown = undefined;
      if (text) {
        try {
          data = JSON.parse(text);
        } catch {
          data = text;
        }
      }
      if (res.ok) return data as T;
      throw mapError(res.status, data, method, path, opts.scope, !!this.token);
    }
  }
}

export function mapError(
  status: number,
  data: unknown,
  method: string,
  path: string,
  scope: string | undefined,
  hasToken: boolean,
): ModrinthError {
  const d = (data && typeof data === "object" ? data : {}) as { error?: string; description?: string; details?: unknown };
  const base = d.description ?? (typeof data === "string" && data ? data : `${method} ${path} -> HTTP ${status}`);
  // Newer labrinth errors put the real cause in `details`, e.g. description "editing project".
  const detail = Array.isArray(d.details) ? d.details.filter((x) => typeof x === "string").join("; ") : "";
  const msg = detail ? `${base}: ${detail}` : base;
  if (/loader field `environment` does not exist/.test(msg)) {
    return new ModrinthError("invalid", msg, status, "Plugins have no client/server side on Modrinth; drop client_side/server_side.", data);
  }
  if (status === 401 || status === 403) {
    const hint = !hasToken
      ? "No token set. Set MODRINTH_TOKEN or run `modrinth auth login --token <pat>`."
      : /verify your email/i.test(msg)
        ? "Your Modrinth account has no verified email. Add and verify one in account settings, then retry."
        : scope
        ? `Token may be missing the ${scope} scope, or you lack permission on this resource.`
        : "Token lacks the required scope or permission.";
    return new ModrinthError("auth", msg, status, hint, data);
  }
  if (status === 404) return new ModrinthError("not_found", msg, status, undefined, data);
  if (status === 429) return new ModrinthError("rate_limited", msg, status, "Retry later.", data);
  if (status === 400) return new ModrinthError("invalid", msg, status, undefined, data);
  return new ModrinthError("api", msg, status, undefined, data);
}
