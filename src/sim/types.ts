export type StoneKind = "upright" | "lintel";
export type StoneRole = "A" | "B" | "lintel";
export type Zone = "quarry" | "path" | "staging" | "site";

export type FailureId =
  | "blank_fracture"
  | "stuck_slide_back"
  | "wrong_socket_profile"
  | "misses_ramp"
  | "past_plumb_fall"
  | "rope_snap"
  | "soft_lock"
  | "socket_blowout"
  | "crib_collapse"
  | "ramp_shear"
  | "lintel_slide"
  | "gap_over_target"
  | "labor_exhaustion";

export type MethodId =
  | "Q1" | "Q2" | "Q3" | "Q4" | "Q5"
  | "D1" | "D2"
  | "M1" | "M2" | "M3" | "M4" | "M5"
  | "R1" | "R2" | "R3" | "R4" | "R5"
  | "L1" | "L2" | "L3" | "L4"
  | "S1" | "S2";

export type MethodTier = "baseline" | "experimental" | "optional" | "speculative";
export type PresetId = "strict-neolithic" | "open-lab" | "precision-bam-lite";

export interface Vec3 { x: number; y: number; z: number; }

export interface StoneState {
  id: string;
  kind: StoneKind;
  role: StoneRole;
  massKg: number;
  length: number;
  width: number;
  thickness: number;
  comOffset: Vec3;
  position: Vec3;
  tiltDeg: number;
  yawDeg: number;
  zone: Zone;
  extracted: boolean;
  fractured: boolean;
  flatness: number;
  hasTenon: boolean;
  hasMortice: boolean;
  packed: boolean;
  seated: boolean;
  plumbDeg: number;
  fallen: boolean;
}

export interface SocketState {
  id: "A" | "B";
  position: Vec3;
  depth: number;
  hasVerticalFace: boolean;
  hasRamp: boolean;
  rampAngleDeg: number;
  packed: boolean;
  rubbleQuality: number;
}

export interface Budgets {
  laborTimePersonDays: number;
  laborRemaining: number;
  crewAssigned: number;
  crewAvailable: number;
  timber: number;
  timberSpent: number;
  ropeWear: number;
  ropeCapacityN: number;
  crewSafetyIncidents: number;
  anomaly: number;
}

export interface FailureEvent {
  id: FailureId;
  stage: string;
  message: string;
  atPersonDays: number;
}

export interface TimelineEvent { beat: string; detail: string; }

export interface MethodFlagDef {
  id: MethodId;
  name: string;
  stage: string;
  tier: MethodTier;
  enabled: boolean;
}

export interface WinCheck {
  uprightA: boolean;
  uprightB: boolean;
  lintel: boolean;
  joints: boolean;
  pass: boolean;
  notes: string[];
}

export interface RunReport {
  win: boolean;
  checks: WinCheck;
  flagsUsed: MethodId[];
  flagsEnabled: MethodId[];
  budgets: Budgets;
  failures: FailureEvent[];
  timeline: TimelineEvent[];
  preset: PresetId;
  summary: string;
}

export interface ActionResult {
  ok: boolean;
  failure?: FailureEvent;
  detail: string;
}
