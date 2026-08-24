import { EXTRACT_PERSON_DAYS, FRACTURE_RISK } from "./constants.ts";
import { spendLabor } from "./budgets.ts";
import { makeFailure } from "./failures.ts";
import { isEnabled } from "./flags.ts";
import type { ActionResult, Budgets, MethodFlagDef, MethodId, StoneState } from "./types.ts";

export type ExtractMethod = "Q1" | "Q2" | "Q3" | "Q4" | "Q5";

function rng01(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

export function extractBlank(
  stone: StoneState, method: ExtractMethod, flags: MethodFlagDef[], budgets: Budgets, seed = 1,
): ActionResult {
  if (stone.extracted) return { ok: true, detail: `${stone.id} already extracted.` };
  if (!isEnabled(flags, method)) return { ok: false, detail: `Method ${method} is not enabled.` };
  const days = EXTRACT_PERSON_DAYS[method];
  if (!spendLabor(budgets, days)) {
    const failure = makeFailure("labor_exhaustion", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  let risk = FRACTURE_RISK[method];
  if (method === "Q3") risk += 0.1;
  if (isEnabled(flags, "S1")) risk *= 0.3;
  const roll = rng01(seed + stone.id.length * 17);
  if (roll < risk) {
    stone.fractured = true;
    stone.extracted = true;
    const failure = makeFailure("blank_fracture", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  stone.extracted = true;
  stone.fractured = false;
  stone.zone = "quarry";
  stone.flatness = method === "Q5" ? 0.72 : method === "Q1" ? 0.55 : method === "Q4" ? 0.4 : 0.48;
  return { ok: true, detail: `${stone.id} detached with ${method} (${days} person-days).` };
}

export function dressFace(stone: StoneState, flags: MethodFlagDef[], budgets: Budgets, personDays = 4): ActionResult {
  if (!stone.extracted || stone.fractured) return { ok: false, detail: "No usable blank to dress." };
  if (!isEnabled(flags, "D1")) return { ok: false, detail: "Peck-grind-polish (D1) is not enabled." };
  if (!spendLabor(budgets, personDays)) {
    const failure = makeFailure("labor_exhaustion", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  stone.flatness = Math.min(0.98, stone.flatness + 0.12 * (personDays / 4));
  stone.zone = stone.zone === "quarry" ? "staging" : stone.zone;
  return { ok: true, detail: `Dressed ${stone.id}; flatness ${(stone.flatness * 100).toFixed(0)}%.` };
}

export function cutJoint(stone: StoneState, flags: MethodFlagDef[], budgets: Budgets): ActionResult {
  if (!isEnabled(flags, "D2")) return { ok: false, detail: "Tenon/mortice (D2) is not enabled." };
  if (!spendLabor(budgets, 3)) {
    const failure = makeFailure("labor_exhaustion", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  if (stone.kind === "upright") stone.hasTenon = true;
  else stone.hasMortice = true;
  return { ok: true, detail: `Cut ${stone.kind === "upright" ? "tenon" : "mortice"} on ${stone.id}.` };
}

export function parseExtractMethod(id: MethodId): ExtractMethod | null {
  if (id === "Q1" || id === "Q2" || id === "Q3" || id === "Q4" || id === "Q5") return id;
  return null;
}
