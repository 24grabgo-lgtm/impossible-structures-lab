import type { FailureEvent, FailureId } from "./types.ts";

export const FAILURE_COPY: Record<FailureId, { stage: string; message: string }> = {
  blank_fracture: { stage: "Extract", message: "Blank fractures — wedges/fire too aggressive." },
  stuck_slide_back: { stage: "Haul", message: "Stuck / slide back — friction, grade, or rollers lost." },
  wrong_socket_profile: { stage: "Socket dig", message: "Wrong profile — stone will not seat / kicks out." },
  misses_ramp: { stage: "Tip-in", message: "Misses ramp — restart position." },
  past_plumb_fall: { stage: "Raise", message: "Past-plumb fall — no brake / pack late." },
  rope_snap: { stage: "Raise", message: "Rope snap — peak load, no A-frame." },
  soft_lock: { stage: "Pack", message: "Soft lock — upright leans over time." },
  socket_blowout: { stage: "Raise", message: "Socket blow-out — packing failed under lateral load." },
  crib_collapse: { stage: "Crib", message: "Crib stack rack/collapse — uneven lift or bad timber." },
  ramp_shear: { stage: "Ramp", message: "Ramp shear / sink — fill quality, angle too steep." },
  lintel_slide: { stage: "Lintel seat", message: "Lintel slide off — spacing, flatness, or tenon fail." },
  gap_over_target: { stage: "Precision mode", message: "Gap over target — dress more or accept anomaly." },
  labor_exhaustion: { stage: "Labor", message: "Labor exhaustion mid-raise — crew-days gone." },
};

export function makeFailure(id: FailureId, atPersonDays: number): FailureEvent {
  const copy = FAILURE_COPY[id];
  return { id, stage: copy.stage, message: copy.message, atPersonDays };
}
