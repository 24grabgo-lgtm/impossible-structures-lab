import {
  A_FRAME_HEIGHT,
  A_FRAME_SETBACK,
  A_FRAME_TIMBER,
  CREW_PULL_N,
  PLUMB_TOLERANCE_DEG,
} from "./constants.ts";
import { spendLabor, spendTimber, addRopeWear, recordIncident } from "./budgets.ts";
import { makeFailure } from "./failures.ts";
import { isEnabled } from "./flags.ts";
import { gravityMomentNm } from "./stone.ts";
import { packingStrength, socketReadyForTip } from "./socket.ts";
import type { ActionResult, Budgets, MethodFlagDef, SocketState, StoneState } from "./types.ts";

export function tipIntoSocket(
  stone: StoneState, socket: SocketState, flags: MethodFlagDef[], budgets: Budgets,
): ActionResult {
  if (stone.kind !== "upright" || !stone.extracted || stone.fractured) {
    return { ok: false, detail: "Need an extracted upright." };
  }
  if (!isEnabled(flags, "R1")) return { ok: false, detail: "Ramped socket tip (R1) is not enabled." };
  if (!spendLabor(budgets, 2)) {
    const failure = makeFailure("labor_exhaustion", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  if (!socket.hasRamp) {
    const failure = makeFailure("misses_ramp", budgets.laborTimePersonDays);
    stone.position.x = socket.position.x - 4;
    return { ok: false, failure, detail: failure.message };
  }
  if (!socketReadyForTip(socket)) {
    const failure = makeFailure("wrong_socket_profile", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  stone.position = { x: socket.position.x, y: 0, z: socket.position.z };
  stone.tiltDeg = 35;
  stone.zone = "site";
  return { ok: true, detail: `${stone.id} tipped into socket ${socket.id} onto the slope.` };
}

export function requiredTensionN(stone: StoneState, hasAframe: boolean): number {
  const moment = Math.abs(gravityMomentNm(stone));
  const tilt = (stone.tiltDeg * Math.PI) / 180;
  let arm: number;
  if (hasAframe) {
    const attach = stone.length * 0.7;
    const attachX = attach * Math.cos(tilt);
    const attachY = attach * Math.sin(tilt);
    const apexX = -A_FRAME_SETBACK;
    const apexY = A_FRAME_HEIGHT;
    const dx = attachX - apexX;
    const dy = attachY - apexY;
    const len = Math.hypot(dx, dy) || 1;
    const dirX = dx / len;
    const dirY = dy / len;
    arm = Math.abs(attachX * dirY - attachY * dirX) + 1.2;
  } else {
    arm = Math.max(0.35, stone.length * 0.15 * Math.sin(tilt));
  }
  const purchase = hasAframe ? 2.4 : 1;
  return moment / (arm * purchase);
}

export function raiseUpright(
  stone: StoneState, socket: SocketState, flags: MethodFlagDef[], budgets: Budgets,
  opts?: { skipPack?: boolean; forcePastPlumb?: boolean; reuseAframe?: boolean },
): ActionResult {
  if (stone.zone !== "site" || stone.tiltDeg < 20) {
    return { ok: false, detail: "Stone is not in the socket to raise." };
  }
  if (stone.fallen || stone.fractured) return { ok: false, detail: "Stone is not raisable." };
  const hasAframe = isEnabled(flags, "R2");
  const hasLeverPack = isEnabled(flags, "R3");
  const speculativeLift = isEnabled(flags, "S2") || isEnabled(flags, "R5");
  if (hasAframe && !opts?.reuseAframe) {
    if (!spendTimber(budgets, A_FRAME_TIMBER)) return { ok: false, detail: "Not enough timber for A-frame." };
  }
  const days = speculativeLift ? 1 : hasLeverPack ? 8 : 5;
  if (!spendLabor(budgets, days)) {
    const failure = makeFailure("labor_exhaustion", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  if (!socket.hasVerticalFace) {
    stone.fallen = true; stone.tiltDeg = 10; recordIncident(budgets, 2);
    const failure = makeFailure("socket_blowout", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  const peak = requiredTensionN(stone, hasAframe) * (speculativeLift ? 0.25 : 1);
  addRopeWear(budgets, hasAframe ? 0.02 : 0.08);
  const crewCap = budgets.crewAssigned * CREW_PULL_N * (hasAframe ? 2.2 : 0.6);
  const ropeCap = budgets.ropeCapacityN;
  if (!speculativeLift && !hasAframe) {
    stone.fallen = true; stone.tiltDeg = 25; recordIncident(budgets, 3);
    const failure = makeFailure("rope_snap", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: `${failure.message} Direct pull from ${stone.tiltDeg.toFixed(0)}° peaks; A-frame would redirect the angle.` };
  }
  if (!speculativeLift && peak > ropeCap) {
    stone.fallen = true; stone.tiltDeg = 20; recordIncident(budgets, 3);
    const failure = makeFailure("rope_snap", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: `${failure.message} Peak ${(peak / 1000).toFixed(0)} kN > rope ${(ropeCap / 1000).toFixed(0)} kN.` };
  }
  if (!speculativeLift && peak > crewCap) {
    const failure = makeFailure("labor_exhaustion", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: `${failure.message} Need ${(peak / 1000).toFixed(0)} kN, crew delivers ${(crewCap / 1000).toFixed(0)} kN.` };
  }
  const packNow = hasLeverPack && !opts?.skipPack;
  const target = opts?.forcePastPlumb ? 98 : 90;
  if (target > 92 && !packNow) {
    stone.fallen = true; stone.tiltDeg = 110; stone.packed = false; recordIncident(budgets, 2);
    const failure = makeFailure("past_plumb_fall", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  stone.tiltDeg = 90; stone.plumbDeg = 90;
  stone.position.y = 0; stone.position.x = socket.position.x; stone.position.z = socket.position.z;
  if (packNow) {
    socket.packed = true; socket.rubbleQuality = 0.85; stone.packed = true;
  } else {
    socket.packed = false; socket.rubbleQuality = 0.2; stone.packed = false;
    if (packingStrength(socket) < 0.5) {
      stone.tiltDeg = 84; stone.plumbDeg = 84;
      const failure = makeFailure("soft_lock", budgets.laborTimePersonDays);
      return { ok: false, failure, detail: failure.message };
    }
  }
  if (Math.abs(90 - stone.tiltDeg) > PLUMB_TOLERANCE_DEG && !stone.packed) {
    stone.fallen = true;
    const failure = makeFailure("past_plumb_fall", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  return {
    ok: true,
    detail: `Raised ${stone.id} to plumb with ${hasAframe ? "A-frame" : "direct pull"}${packNow ? " and packed" : ""}. Peak ${(peak / 1000).toFixed(0)} kN.`,
  };
}

export function packSocket(
  stone: StoneState, socket: SocketState, flags: MethodFlagDef[], budgets: Budgets,
): ActionResult {
  if (!isEnabled(flags, "R3") && !isEnabled(flags, "R1")) {
    return { ok: false, detail: "No packing method enabled." };
  }
  if (!spendLabor(budgets, 2)) {
    const failure = makeFailure("labor_exhaustion", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  if (stone.fallen) return { ok: false, detail: "Cannot pack a fallen stone." };
  if (Math.abs(90 - stone.tiltDeg) > 8) return { ok: false, detail: "Bring the stone nearer plumb before packing." };
  socket.packed = true; socket.rubbleQuality = 0.9;
  stone.packed = true; stone.tiltDeg = 90; stone.plumbDeg = 90;
  return { ok: true, detail: `Packed socket ${socket.id}; ${stone.id} locked.` };
}
