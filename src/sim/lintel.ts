import {
  CONTACT_THRESHOLD, CRIB_INCREMENT_M, CRIB_TIMBER_PER_LAYER, LINTEL_TEST_LOAD_N,
  RAMP_MAX_STABLE_DEG, RAMP_TIMBER_FACE, SOCKET_DEPTH, SOCKET_SPACING, UPRIGHT,
} from "./constants.ts";
import { spendLabor, spendTimber, recordIncident } from "./budgets.ts";
import { makeFailure } from "./failures.ts";
import { isEnabled } from "./flags.ts";
import type { ActionResult, Budgets, MethodFlagDef, StoneState } from "./types.ts";

const LINTEL_HEIGHT = UPRIGHT.length - SOCKET_DEPTH;

export interface CribState { built: boolean; height: number; layers: number; rack: number; collapsed: boolean; }
export interface RampState { built: boolean; angleDeg: number; sheared: boolean; }

export function createCrib(): CribState {
  return { built: false, height: 0, layers: 0, rack: 0, collapsed: false };
}
export function createRamp(): RampState {
  return { built: false, angleDeg: 18, sheared: false };
}

export function buildCrib(crib: CribState, flags: MethodFlagDef[], budgets: Budgets): ActionResult {
  if (!isEnabled(flags, "L1")) return { ok: false, detail: "Timber crib (L1) is not enabled." };
  const layers = Math.ceil(LINTEL_HEIGHT / CRIB_INCREMENT_M);
  const timber = layers * CRIB_TIMBER_PER_LAYER;
  if (!spendTimber(budgets, timber)) {
    crib.collapsed = true;
    const failure = makeFailure("crib_collapse", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: `${failure.message} Need ${timber} timber, have ${budgets.timber + timber}.` };
  }
  if (!spendLabor(budgets, layers * 0.8)) {
    const failure = makeFailure("labor_exhaustion", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  crib.built = true; crib.layers = layers; crib.height = LINTEL_HEIGHT; crib.rack = 0; crib.collapsed = false;
  return { ok: true, detail: `Crib stacked ${layers} layers to ${LINTEL_HEIGHT.toFixed(1)} m (${timber} timber).` };
}

export function liftLintelOnCrib(
  lintel: StoneState, crib: CribState, flags: MethodFlagDef[], budgets: Budgets, opts?: { uneven?: boolean },
): ActionResult {
  if (!isEnabled(flags, "L1")) return { ok: false, detail: "Timber crib (L1) is not enabled." };
  if (!crib.built || crib.collapsed) {
    const failure = makeFailure("crib_collapse", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  if (!spendLabor(budgets, 6)) {
    const failure = makeFailure("labor_exhaustion", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  if (opts?.uneven) crib.rack += 0.4;
  if (crib.rack > 0.35) {
    crib.collapsed = true; lintel.fallen = true; recordIncident(budgets, 2);
    const failure = makeFailure("crib_collapse", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  lintel.position.y = crib.height; lintel.zone = "site"; lintel.tiltDeg = 0;
  return { ok: true, detail: `Lintel cribbed to ${crib.height.toFixed(1)} m.` };
}

export function buildEarthRamp(ramp: RampState, flags: MethodFlagDef[], budgets: Budgets, angleDeg = 18): ActionResult {
  if (!isEnabled(flags, "L2")) return { ok: false, detail: "Earth/timber ramp (L2) is not enabled." };
  ramp.angleDeg = angleDeg;
  if (angleDeg > RAMP_MAX_STABLE_DEG && !isEnabled(flags, "S2")) {
    ramp.sheared = true;
    const failure = makeFailure("ramp_shear", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: `${failure.message} ${angleDeg}° > ${RAMP_MAX_STABLE_DEG}° stable fill.` };
  }
  if (!spendTimber(budgets, RAMP_TIMBER_FACE)) {
    ramp.sheared = true;
    const failure = makeFailure("ramp_shear", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  const fillDays = 12 + angleDeg * 0.3;
  if (!spendLabor(budgets, fillDays)) {
    const failure = makeFailure("labor_exhaustion", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  ramp.built = true; ramp.sheared = false;
  return { ok: true, detail: `Earth ramp at ${angleDeg}° with timber facing.` };
}

export function haulLintelRamp(lintel: StoneState, ramp: RampState, flags: MethodFlagDef[], budgets: Budgets): ActionResult {
  void flags;
  if (!ramp.built || ramp.sheared) {
    const failure = makeFailure("ramp_shear", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  if (!spendLabor(budgets, 5)) {
    const failure = makeFailure("labor_exhaustion", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  lintel.position.y = LINTEL_HEIGHT; lintel.zone = "site"; lintel.tiltDeg = 0;
  return { ok: true, detail: "Lintel hauled up the ramp to seating height." };
}

export function contactFraction(a: StoneState, b: StoneState, lintel: StoneState): number {
  const base = Math.min(a.flatness, b.flatness, lintel.flatness);
  const tenonBonus = a.hasTenon && b.hasTenon && lintel.hasMortice ? 0.12 : 0;
  return Math.min(1, base + tenonBonus);
}

export function spacingOk(a: StoneState, b: StoneState, lintel: StoneState): boolean {
  const span = Math.abs(a.position.z - b.position.z);
  const bearing = (lintel.length - span) / 2;
  return bearing >= 0.4 && Math.abs(span - SOCKET_SPACING) <= 0.15;
}

export function seatLintel(
  lintel: StoneState, a: StoneState, b: StoneState, flags: MethodFlagDef[], budgets: Budgets, precisionGapMm?: number,
): ActionResult {
  if (lintel.position.y < LINTEL_HEIGHT - 0.2) return { ok: false, detail: "Lintel is not at seating height." };
  if (!a.packed || !b.packed || a.fallen || b.fallen) {
    return { ok: false, detail: "Both uprights must be packed and standing." };
  }
  if (!spendLabor(budgets, 2)) {
    const failure = makeFailure("labor_exhaustion", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  const contact = contactFraction(a, b, lintel);
  if (!spacingOk(a, b, lintel) || contact < CONTACT_THRESHOLD) {
    lintel.seated = false; lintel.fallen = true; recordIncident(budgets, 1);
    const failure = makeFailure("lintel_slide", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: `${failure.message} Contact ${(contact * 100).toFixed(0)}% (need ${CONTACT_THRESHOLD * 100}%).` };
  }
  if (precisionGapMm !== undefined) {
    const gapMm = (1 - contact) * 12;
    if (gapMm > precisionGapMm && !isEnabled(flags, "S1")) {
      const failure = makeFailure("gap_over_target", budgets.laborTimePersonDays);
      return { ok: false, failure, detail: `${failure.message} ${gapMm.toFixed(1)} mm > ${precisionGapMm} mm.` };
    }
  }
  lintel.seated = true; lintel.fallen = false;
  lintel.position.x = (a.position.x + b.position.x) / 2;
  lintel.position.z = (a.position.z + b.position.z) / 2;
  lintel.position.y = LINTEL_HEIGHT; lintel.zone = "site";
  return { ok: true, detail: `Lintel seated. Contact ${(contact * 100).toFixed(0)}%.` };
}

export function applyTestLoad(lintel: StoneState, a: StoneState, b: StoneState, loadN = LINTEL_TEST_LOAD_N): ActionResult {
  if (!lintel.seated) return { ok: false, detail: "Nothing seated to test." };
  const contact = contactFraction(a, b, lintel);
  const tenon = a.hasTenon && b.hasTenon && lintel.hasMortice;
  const resist = contact * 25_000 + (tenon ? 20_000 : 0);
  if (loadN > resist) {
    lintel.seated = false; lintel.fallen = true;
    const failure = makeFailure("lintel_slide", 0);
    return { ok: false, failure, detail: failure.message };
  }
  return { ok: true, detail: `Held under ${loadN} N test load (resist ${resist.toFixed(0)} N).` };
}
