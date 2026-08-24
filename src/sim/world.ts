import { STRIP } from "./constants.ts";
import { createBudgets } from "./budgets.ts";
import { createFlags, isEnabled, setFlag } from "./flags.ts";
import { createStone } from "./stone.ts";
import { createSockets, digSocket } from "./socket.ts";
import { extractBlank, dressFace, cutJoint, type ExtractMethod } from "./quarry.ts";
import { haulTo } from "./haul.ts";
import { tipIntoSocket, raiseUpright, packSocket } from "./raise.ts";
import {
  applyTestLoad, buildCrib, buildEarthRamp, createCrib, createRamp,
  haulLintelRamp, liftLintelOnCrib, seatLintel, type CribState, type RampState,
} from "./lintel.ts";
import { evaluateWin } from "./win.ts";
import { buildReport } from "./report.ts";
import type {
  ActionResult, Budgets, FailureEvent, MethodFlagDef, MethodId, PresetId,
  RunReport, SocketState, StoneState, TimelineEvent, WinCheck, Zone,
} from "./types.ts";

export class LabWorld {
  preset: PresetId;
  flags: MethodFlagDef[];
  budgets: Budgets;
  uprightA: StoneState;
  uprightB: StoneState;
  lintel: StoneState;
  sockets: { A: SocketState; B: SocketState };
  crib: CribState;
  ramp: RampState;
  failures: FailureEvent[] = [];
  timeline: TimelineEvent[] = [];
  flagsUsed: MethodId[] = [];
  precisionGapMm?: number;
  message = "Strip map ready. Extract blanks at the quarry face.";

  constructor(preset: PresetId = "strict-neolithic") {
    this.preset = preset;
    this.flags = createFlags(preset);
    this.budgets = createBudgets();
    this.uprightA = createStone("A", { x: STRIP.quarryX, y: 0.6, z: -2 });
    this.uprightB = createStone("B", { x: STRIP.quarryX, y: 0.6, z: 2 });
    this.lintel = createStone("lintel", { x: STRIP.quarryX + 4, y: 0.4, z: 0 });
    this.sockets = createSockets();
    this.crib = createCrib();
    this.ramp = createRamp();
    if (preset === "precision-bam-lite") this.precisionGapMm = 3;
    this.budgets.anomaly = this.flags.filter((f) => f.enabled && f.tier === "speculative").length;
  }

  setPreset(preset: PresetId): void {
    this.preset = preset;
    this.flags = createFlags(preset);
    this.precisionGapMm = preset === "precision-bam-lite" ? 3 : undefined;
    this.budgets.anomaly = this.flags.filter((f) => f.enabled && f.tier === "speculative").length;
  }

  toggleFlag(id: MethodId, enabled: boolean): void {
    this.flags = setFlag(this.flags, id, enabled);
    this.budgets.anomaly = this.flags.filter((f) => f.enabled && f.tier === "speculative").length;
  }

  stone(role: "A" | "B" | "lintel"): StoneState {
    return role === "A" ? this.uprightA : role === "B" ? this.uprightB : this.lintel;
  }

  private note(beat: string, detail: string): void {
    this.timeline.push({ beat, detail });
    this.message = detail;
  }
  private use(id: MethodId): void {
    if (!this.flagsUsed.includes(id) && isEnabled(this.flags, id)) this.flagsUsed.push(id);
  }
  private apply(result: ActionResult): ActionResult {
    if (result.failure) this.failures.push(result.failure);
    this.message = result.detail;
    return result;
  }

  extract(role: "A" | "B" | "lintel", method: ExtractMethod = "Q1", seed?: number): ActionResult {
    const r = extractBlank(this.stone(role), method, this.flags, this.budgets, seed ?? role.charCodeAt(0));
    if (r.ok) { this.use(method); this.note("extract", r.detail); }
    return this.apply(r);
  }

  extractAll(method: ExtractMethod = "Q1"): ActionResult {
    for (const role of ["A", "B", "lintel"] as const) {
      const r = this.extract(role, method, 90 + role.charCodeAt(0));
      if (!r.ok) return r;
    }
    return { ok: true, detail: "Three blanks on the quarry floor." };
  }

  receiveBlanks(): ActionResult {
    for (const role of ["A", "B", "lintel"] as const) {
      const s = this.stone(role);
      s.extracted = true; s.fractured = false;
      s.flatness = Math.max(s.flatness, 0.55); s.zone = "quarry";
    }
    this.note("extract", "Received quarry blanks. Extract skipped.");
    return { ok: true, detail: "Three blanks on the quarry pad." };
  }

  haul(role: "A" | "B" | "lintel", dest: Zone): ActionResult {
    const r = haulTo(this.stone(role), dest, this.flags, this.budgets, {
      consumeRollerTimber: dest === "site" && !this.flagsUsed.includes("M2"),
    });
    if (r.ok) {
      if (isEnabled(this.flags, "M1")) this.use("M1");
      if (isEnabled(this.flags, "M2")) this.use("M2");
      if (isEnabled(this.flags, "M3")) this.use("M3");
      this.note("haul", r.detail);
    }
    return this.apply(r);
  }

  dress(role: "A" | "B" | "lintel"): ActionResult {
    const r = dressFace(this.stone(role), this.flags, this.budgets);
    if (r.ok) { this.use("D1"); this.note("dress", r.detail); }
    return this.apply(r);
  }

  cutJoints(): ActionResult {
    for (const role of ["A", "B", "lintel"] as const) {
      const r = cutJoint(this.stone(role), this.flags, this.budgets);
      if (!r.ok) return this.apply(r);
    }
    this.use("D2");
    this.note("dress", "Tenons on uprights, mortices on lintel.");
    return { ok: true, detail: "Joints cut." };
  }

  dig(which: "A" | "B", profile: "ramped" | "vertical-only" | "shallow" = "ramped"): ActionResult {
    const r = digSocket(this.sockets[which], this.flags, this.budgets, profile);
    if (r.ok) { this.use("R1"); this.note("socket", r.detail); }
    return this.apply(r);
  }

  tip(which: "A" | "B"): ActionResult {
    const r = tipIntoSocket(this.stone(which), this.sockets[which], this.flags, this.budgets);
    if (r.ok) { this.use("R1"); this.note("raise", r.detail); }
    return this.apply(r);
  }

  raise(which: "A" | "B", opts?: { skipPack?: boolean; forcePastPlumb?: boolean }): ActionResult {
    const r = raiseUpright(this.stone(which), this.sockets[which], this.flags, this.budgets, {
      ...opts, reuseAframe: this.flagsUsed.includes("R2"),
    });
    if (r.ok) {
      if (isEnabled(this.flags, "R2")) this.use("R2");
      if (isEnabled(this.flags, "R3")) this.use("R3");
      if (isEnabled(this.flags, "S2")) this.use("S2");
      this.note("raise", r.detail);
    }
    return this.apply(r);
  }

  pack(which: "A" | "B"): ActionResult {
    const r = packSocket(this.stone(which), this.sockets[which], this.flags, this.budgets);
    if (r.ok) { this.use("R3"); this.note("pack", r.detail); }
    return this.apply(r);
  }

  makeCrib(): ActionResult {
    const r = buildCrib(this.crib, this.flags, this.budgets);
    if (r.ok) { this.use("L1"); this.note("lintel", r.detail); }
    return this.apply(r);
  }

  cribLintel(opts?: { uneven?: boolean }): ActionResult {
    const r = liftLintelOnCrib(this.lintel, this.crib, this.flags, this.budgets, opts);
    if (r.ok) { this.use("L1"); this.note("lintel", r.detail); }
    return this.apply(r);
  }

  makeRamp(angleDeg = 18): ActionResult {
    const r = buildEarthRamp(this.ramp, this.flags, this.budgets, angleDeg);
    if (r.ok) { this.use("L2"); this.note("lintel", r.detail); }
    return this.apply(r);
  }

  rampLintel(): ActionResult {
    const r = haulLintelRamp(this.lintel, this.ramp, this.flags, this.budgets);
    if (r.ok) { this.use("L2"); this.note("lintel", r.detail); }
    return this.apply(r);
  }

  seat(): ActionResult {
    const r = seatLintel(this.lintel, this.uprightA, this.uprightB, this.flags, this.budgets, this.precisionGapMm);
    if (r.ok) this.note("seat", r.detail);
    return this.apply(r);
  }

  testLoad(): ActionResult {
    const r = applyTestLoad(this.lintel, this.uprightA, this.uprightB);
    if (r.ok) this.note("test", r.detail);
    return this.apply(r);
  }

  checks(): WinCheck {
    return evaluateWin(this.uprightA, this.uprightB, this.lintel, { precisionGapMm: this.precisionGapMm });
  }

  report(): RunReport {
    return buildReport({
      checks: this.checks(), flags: this.flags, flagsUsed: this.flagsUsed,
      budgets: this.budgets, failures: this.failures, timeline: this.timeline, preset: this.preset,
    });
  }
}
