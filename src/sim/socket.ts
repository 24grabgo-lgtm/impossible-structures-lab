import { SOCKET_DEPTH, SOCKET_SPACING, STRIP } from "./constants.ts";
import { spendLabor } from "./budgets.ts";
import { makeFailure } from "./failures.ts";
import { isEnabled } from "./flags.ts";
import type { ActionResult, Budgets, MethodFlagDef, SocketState } from "./types.ts";

export function createSockets(): { A: SocketState; B: SocketState } {
  const z = 0;
  const y = 0;
  return {
    A: {
      id: "A", position: { x: STRIP.siteX, y, z: z - SOCKET_SPACING / 2 },
      depth: 0, hasVerticalFace: false, hasRamp: false, rampAngleDeg: 0, packed: false, rubbleQuality: 0,
    },
    B: {
      id: "B", position: { x: STRIP.siteX, y, z: z + SOCKET_SPACING / 2 },
      depth: 0, hasVerticalFace: false, hasRamp: false, rampAngleDeg: 0, packed: false, rubbleQuality: 0,
    },
  };
}

export function digSocket(
  socket: SocketState, flags: MethodFlagDef[], budgets: Budgets,
  profile: "ramped" | "vertical-only" | "shallow",
): ActionResult {
  const days = profile === "shallow" ? 2 : 5;
  if (!spendLabor(budgets, days)) {
    const failure = makeFailure("labor_exhaustion", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  if (profile === "shallow") {
    socket.depth = SOCKET_DEPTH * 0.4;
    socket.hasVerticalFace = true;
    socket.hasRamp = false;
    socket.rampAngleDeg = 0;
    const failure = makeFailure("wrong_socket_profile", budgets.laborTimePersonDays);
    return { ok: false, failure, detail: failure.message };
  }
  socket.depth = SOCKET_DEPTH;
  socket.hasVerticalFace = true;
  if (profile === "ramped") {
    if (!isEnabled(flags, "R1")) return { ok: false, detail: "Ramped socket (R1) is not enabled." };
    socket.hasRamp = true;
    socket.rampAngleDeg = 35;
  } else {
    socket.hasRamp = false;
    socket.rampAngleDeg = 0;
  }
  return {
    ok: true,
    detail: `Dug socket ${socket.id}: depth ${socket.depth.toFixed(1)} m, vertical face, ${socket.hasRamp ? "ramp" : "no ramp"}.`,
  };
}

export function socketReadyForTip(socket: SocketState): boolean {
  return socket.depth >= SOCKET_DEPTH * 0.9 && socket.hasVerticalFace && socket.hasRamp;
}

export function packingStrength(socket: SocketState): number {
  if (!socket.packed) return 0;
  return socket.rubbleQuality * socket.depth;
}
