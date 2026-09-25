import { z } from "zod";
import type { Op } from "./op.js";

export interface Field {
  name: string;
  type: "string" | "number" | "integer" | "boolean" | "array" | "object" | "any";
  itemType?: string;
  enum?: string[];
  required: boolean;
  description?: string;
  default?: unknown;
  nullable: boolean;
}

type JS = Record<string, any>;

function describe(s: JS): Omit<Field, "name" | "required"> {
  const nullable = Array.isArray(s.anyOf) && s.anyOf.some((x: JS) => x.type === "null");
  const inner: JS = (s.anyOf?.find((x: JS) => x.type !== "null") as JS) ?? s;
  const union = s.anyOf && s.anyOf.filter((x: JS) => x.type !== "null").length > 1;
  const type = union ? "any" : (inner.type as Field["type"]) ?? "any";
  return {
    type,
    itemType: inner.items?.type ?? (inner.items?.enum ? "string" : undefined),
    enum: inner.enum ?? inner.items?.enum,
    description: s.description ?? inner.description,
    default: s.default,
    nullable,
  };
}

export function jsonSchema(op: Op): JS {
  return z.toJSONSchema(op.input, { io: "input", unrepresentable: "any" }) as JS;
}

export function fields(op: Op): Field[] {
  const js = jsonSchema(op);
  const req = new Set<string>(js.required ?? []);
  return Object.entries((js.properties ?? {}) as Record<string, JS>).map(([name, s]) => ({
    name,
    required: req.has(name) && s.default === undefined,
    ...describe(s),
  }));
}
