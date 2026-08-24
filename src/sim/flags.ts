import type { MethodFlagDef, MethodId, PresetId } from "./types.ts";

export const METHOD_CATALOG: Omit<MethodFlagDef, "enabled">[] = [
  { id: "Q1", name: "Channel + wedges", stage: "Extract", tier: "baseline" },
  { id: "Q2", name: "Pounders", stage: "Extract", tier: "baseline" },
  { id: "Q3", name: "Fire-setting", stage: "Extract", tier: "baseline" },
  { id: "Q4", name: "Joint exploit", stage: "Extract", tier: "baseline" },
  { id: "Q5", name: "Abrasive cut", stage: "Extract", tier: "experimental" },
  { id: "D1", name: "Peck-grind-polish", stage: "Dress", tier: "baseline" },
  { id: "D2", name: "Tenon/mortice cut", stage: "Dress", tier: "baseline" },
  { id: "M1", name: "Sled + lube", stage: "Move", tier: "baseline" },
  { id: "M2", name: "Rollers", stage: "Move", tier: "baseline" },
  { id: "M3", name: "Timber rails", stage: "Move", tier: "baseline" },
  { id: "M4", name: "Stone rowing", stage: "Move", tier: "experimental" },
  { id: "M5", name: "Barge segment", stage: "Move", tier: "optional" },
  { id: "R1", name: "Ramped socket tip", stage: "Raise", tier: "baseline" },
  { id: "R2", name: "A-frame / shear legs", stage: "Raise", tier: "baseline" },
  { id: "R3", name: "Lever-pack rock", stage: "Raise", tier: "baseline" },
  { id: "R4", name: "Counterweight socket", stage: "Raise", tier: "experimental" },
  { id: "R5", name: "Solo pivot leverage", stage: "Raise", tier: "speculative" },
  { id: "L1", name: "Timber crib", stage: "Lintel", tier: "baseline" },
  { id: "L2", name: "Earth/timber ramp", stage: "Lintel", tier: "baseline" },
  { id: "L3", name: "Scaffold partial", stage: "Lintel", tier: "experimental" },
  { id: "L4", name: "Dual lever beams", stage: "Lintel", tier: "experimental" },
  { id: "S1", name: "Reduced friction anomaly", stage: "Any", tier: "speculative" },
  { id: "S2", name: "Unknown assist lift", stage: "Raise/Lintel", tier: "speculative" },
];

const BASELINE_ON: MethodId[] = [
  "Q1", "Q2", "Q3", "Q4", "D1", "D2", "M1", "M2", "M3", "R1", "R2", "R3", "L1", "L2",
];

export function createFlags(preset: PresetId = "strict-neolithic"): MethodFlagDef[] {
  return METHOD_CATALOG.map((m) => {
    let enabled = false;
    if (preset === "strict-neolithic") enabled = BASELINE_ON.includes(m.id);
    else if (preset === "open-lab" || preset === "precision-bam-lite") enabled = true;
    return { ...m, enabled };
  });
}

export function isEnabled(flags: MethodFlagDef[], id: MethodId): boolean {
  return flags.find((f) => f.id === id)?.enabled === true;
}

export function setFlag(flags: MethodFlagDef[], id: MethodId, enabled: boolean): MethodFlagDef[] {
  return flags.map((f) => (f.id === id ? { ...f, enabled } : f));
}

export function enabledIds(flags: MethodFlagDef[]): MethodId[] {
  return flags.filter((f) => f.enabled).map((f) => f.id);
}

export function anomalyCost(flags: MethodFlagDef[]): number {
  return flags.filter((f) => f.enabled && f.tier === "speculative").length;
}
