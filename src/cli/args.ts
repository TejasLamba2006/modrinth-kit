import { readFile } from "node:fs/promises";
import { ModrinthError } from "../errors.js";
import type { Field } from "../schema.js";

/** `--game-versions` -> `game_versions` */
export const flagToKey = (f: string) => f.replace(/-/g, "_");
export const keyToFlag = (k: string) => k.replace(/_/g, "-");

/**
 * Coerce a CLI string into the schema type. Arrays accept repeated flags or comma lists.
 * Any value may be `@path` to read it from a file (e.g. `--body @README.md`), or JSON.
 */
export async function coerce(field: Field, raw: string[]): Promise<unknown> {
  const vals = await Promise.all(raw.map(readAt));
  const one = vals[vals.length - 1]!;
  if (field.nullable && one === "null") return null;
  switch (field.type) {
    case "boolean":
      return one === "" || one === "true" ? true : one === "false" ? false : fail(field, one);
    case "number":
    case "integer": {
      const n = Number(one);
      return Number.isFinite(n) ? n : fail(field, one);
    }
    case "array": {
      if (vals.length === 1 && one.startsWith("[")) return parseJson(field, one);
      const items = vals.flatMap((v) => v.split(",")).map((s) => s.trim()).filter(Boolean);
      return field.itemType === "number" || field.itemType === "integer" ? items.map(Number) : items;
    }
    case "object":
      return parseJson(field, one);
    case "any":
      // unions like permissions (int | string[]): try JSON, then number, then comma list
      if (/^[[{]/.test(one)) return parseJson(field, one);
      if (/^\d+$/.test(one)) return Number(one);
      return vals.flatMap((v) => v.split(",")).map((s) => s.trim()).filter(Boolean);
    default:
      return one;
  }
}

async function readAt(v: string): Promise<string> {
  if (!v.startsWith("@") || v.length < 2) return v;
  try {
    return await readFile(v.slice(1), "utf8");
  } catch {
    throw new ModrinthError("usage", `Cannot read ${v.slice(1)}`);
  }
}

function parseJson(f: Field, v: string) {
  try {
    return JSON.parse(v);
  } catch {
    return fail(f, v, "valid JSON");
  }
}

function fail(f: Field, v: string, want: string = f.type): never {
  throw new ModrinthError("usage", `--${keyToFlag(f.name)}: expected ${want}, got "${v}"`);
}

export interface Parsed {
  positionals: string[];
  flags: Map<string, string[]>;
}

/** Minimal argv parser: `--k v`, `--k=v`, `--flag` (boolean), `--no-flag`. */
export function parseArgv(argv: string[], booleanKeys: Set<string>): Parsed {
  const positionals: string[] = [];
  const flags = new Map<string, string[]>();
  const push = (k: string, v: string) => flags.set(k, [...(flags.get(k) ?? []), v]);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!;
    if (a === "--") {
      positionals.push(...argv.slice(i + 1));
      break;
    }
    if (!a.startsWith("--")) {
      positionals.push(a);
      continue;
    }
    const eq = a.indexOf("=");
    const name = flagToKey(a.slice(2, eq === -1 ? undefined : eq));
    if (eq !== -1) push(name, a.slice(eq + 1));
    else if (name.startsWith("no_") && booleanKeys.has(name.slice(3))) push(name.slice(3), "false");
    else if (booleanKeys.has(name) && (argv[i + 1] === undefined || argv[i + 1]!.startsWith("--") || !/^(true|false)$/.test(argv[i + 1]!))) push(name, "true");
    else if (argv[i + 1] === undefined) throw new ModrinthError("usage", `--${keyToFlag(name)} needs a value`);
    else push(name, argv[++i]!);
  }
  return { positionals, flags };
}
