import { CONTACT_THRESHOLD, PLUMB_TOLERANCE_DEG } from "./constants.ts";
import { isStableUpright } from "./stone.ts";
import { applyTestLoad, contactFraction, spacingOk } from "./lintel.ts";
import type { StoneState, WinCheck } from "./types.ts";

export function evaluateWin(
  a: StoneState,
  b: StoneState,
  lintel: StoneState,
  opts?: { precisionGapMm?: number },
): WinCheck {
  const notes: string[] = [];
  const uprightA = isStableUpright(a, PLUMB_TOLERANCE_DEG);
  const uprightB = isStableUpright(b, PLUMB_TOLERANCE_DEG);
  if (!uprightA) notes.push("Upright A is not packed/plumb/stable.");
  if (!uprightB) notes.push("Upright B is not packed/plumb/stable.");

  const contact = contactFraction(a, b, lintel);
  const spaced = spacingOk(a, b, lintel);
  const test = lintel.seated ? applyTestLoad(lintel, a, b) : { ok: false, detail: "not seated" };
  const lintelOk =
    lintel.seated && !lintel.fallen && contact >= CONTACT_THRESHOLD && spaced && test.ok;
  if (!lintelOk) notes.push("Lintel not seated with contact/test-load.");

  let joints = true;
  if (opts?.precisionGapMm !== undefined) {
    const gapMm = (1 - contact) * 12;
    joints = gapMm <= opts.precisionGapMm;
    if (!joints) notes.push(`Gap ${gapMm.toFixed(1)} mm exceeds ${opts.precisionGapMm} mm.`);
  }

  const pass = uprightA && uprightB && lintelOk && joints;
  if (pass) notes.push("Trilithon stands under sim gravity.");
  return { uprightA, uprightB, lintel: lintelOk, joints, pass, notes };
}
