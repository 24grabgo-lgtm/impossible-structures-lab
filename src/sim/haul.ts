import { CREW_PULL_N, G, MU, ROLLERS_TIMBER, STRIP } from "./constants.ts";
import { spendLabor, spendTimber, addRopeWear } from "./budgets.ts";
import { makeFailure } from "./failures.ts";
import { isEnabled } from "./flags.ts";
import type { ActionResult, Budgets, MethodFlagDef, StoneState, Zone } from "./types.ts";

const ZONE_X: Record<Zone, number> = {
  quarry: STRIP.quarryX,
  path: (STRIP.pathStartX + STRIP.pathEndX) / 2,
  staging: STRIP.stagingX,
  site: STRIP.siteX,
};

export function frictionMu(flags: MethodFlagDef[], onSoftPatch: boolean): number {
  if (isEnabled(flags, "S1")) return 0.04;
  let mu: number = MU.stoneGround;
  if (isEnabled(flags, "M2")) mu = Math.min(mu, MU.stoneRollers);
  if (isEnabled(flags, "M1")) mu = Math.min(mu, MU.sledTallow);
  if (isEnabled(flags, "M3")) mu = Math.min(mu, 0.12);
  if (isEnabled(flags, "M4")) mu = Math.min(mu, 0.18);
  if (onSoftPatch && !isEnabled(flags, "M3") && !isEnabled(flags, "M1")) {
    mu = Math.max(mu, STRIP.softPatchMu);
  }
  return mu;
}

/** F ≈ μmg on level; add mg sinθ on grade. */
export function haulForceN(massKg: number, mu: number, gradeDeg: number): number {
  const w = massKg * G;
  const theta = (gradeDeg * Math.PI) / 180;
  return mu * w * Math.cos(theta) + w * Math.sin(theta);
}

export function crewForceN(crew: number, efficiency: number): number {
  return crew * CREW_PULL_N * efficiency;
}

export function haulTo(
  stone: StoneState,
  dest: Zone,
  flags: MethodFlagDef[],
  budgets: Budgets,
  options?: { consumeRollerTimber?: boolean },
): ActionResult {
  if (!stone.extracted || stone.fractured || stone.fallen) {
    return { ok: false, detail: "Cannot haul this blank." };
  }
  const destX = ZONE_X[dest];
  const fromX = stone.position.x;
  const dist = Math.abs(destX - fromX);
  const onPath = dest !== "quarry";
  const grade =
    onPath && destX > STRIP.pathStartX && fromX < STRIP.pathEndX ? STRIP.pathGradeDeg : 0;
  const onSoft = fromX < STRIP.softPatchX && destX > STRIP.softPatchX;
  const mu = frictionMu(flags, onSoft);
  if (options?.consumeRollerTimber && isEnabled(flags, "M2")) {
    spendTimber(budgets, Math.min(ROLLERS_TIMBER, budgets.timber));
  }
  const need = haulForceN(stone.massKg, mu, grade);
  const efficiency = isEnabled(flags, "R2") ? 1 : 0.85;
  const have = crewForceN(budgets.crewAssigned, efficiency);
  const personDays = Math.max(1, (dist / 20) * (stone.massKg / 10_000) * (mu / 0.2));
  if (!spendLabor(budgets, personDays)) {
    const failure = makeFailure("labor_exhaustion", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  addRopeWear(budgets, 0.01 * (need / 80_000));
  if (have * 1.08 < need && !isEnabled(flags, "S1") && !isEnabled(flags, "R5")) {
    const failure = makeFailure("stuck_slide_back", budgets.laborTimePersonDays);
    return {
      ok: false,
      failure,
      detail: `${failure.message} Need ~${(need / 1000).toFixed(0)} kN, crew can pull ${(have / 1000).toFixed(0)} kN (μ=${mu.toFixed(2)}, grade ${grade}°).`,
    };
  }
  stone.position.x = destX;
  stone.zone = dest;
  stone.tiltDeg = 0;
  return {
    ok: true,
    detail: `Hauled ${stone.id} to ${dest} (${dist.toFixed(0)} m, μ=${mu.toFixed(2)}, ${(need / 1000).toFixed(0)} kN).`,
  };
}
