import type { Op } from "../op.js";
import extra from "./extra.js";
import gallery from "./gallery.js";
import meta from "./meta.js";
import org from "./org.js";
import project from "./project.js";
import social from "./social.js";
import team from "./team.js";
import version from "./version.js";

export const ops: Op[] = [...meta, ...project, ...gallery, ...version, ...team, ...org, ...social, ...extra] as Op[];

export function findOp(name: string): Op | undefined {
  return ops.find((o) => o.name === name);
}
