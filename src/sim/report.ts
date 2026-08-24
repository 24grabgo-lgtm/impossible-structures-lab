import { anomalyCost, enabledIds } from "./flags.ts";
import type {
  Budgets,
  FailureEvent,
  MethodFlagDef,
  MethodId,
  PresetId,
  RunReport,
  TimelineEvent,
  WinCheck,
} from "./types.ts";

export interface ReportInput {
  checks: WinCheck;
  flags: MethodFlagDef[];
  flagsUsed: MethodId[];
  budgets: Budgets;
  failures: FailureEvent[];
  timeline: TimelineEvent[];
  preset: PresetId;
}

export function buildReport(input: ReportInput): RunReport {
  const budgets: Budgets = { ...input.budgets, anomaly: anomalyCost(input.flags) };
  const win = input.checks.pass;
  const flagsUsed = [...input.flagsUsed];
  const flagsEnabled = enabledIds(input.flags);
  const failIds = input.failures.map((f) => f.id).join(", ") || "none";
  const summary = win
    ? [
        "WIN — trilithon seated under sim gravity.",
        `Flags: ${flagsUsed.join(", ") || "(none)"}`,
        `Labor: ${budgets.laborTimePersonDays.toFixed(1)} person-days`,
        `Timber spent: ${budgets.timberSpent}`,
        `Rope wear: ${budgets.ropeWear.toFixed(2)} (cap ${Math.round(budgets.ropeCapacityN)} N)`,
        `Crew safety incidents: ${budgets.crewSafetyIncidents}`,
        `Anomaly: ${budgets.anomaly}`,
        `Failures: ${input.failures.length} (${failIds})`,
      ].join("\n")
    : [
        `FAIL — ${failIds}. Revise the method mix.`,
        `Flags: ${flagsUsed.join(", ") || "(none)"}`,
        `Labor: ${budgets.laborTimePersonDays.toFixed(1)} person-days`,
        `Timber spent: ${budgets.timberSpent}`,
        `Rope wear: ${budgets.ropeWear.toFixed(2)}`,
        `Crew safety incidents: ${budgets.crewSafetyIncidents}`,
        `Anomaly: ${budgets.anomaly}`,
      ].join("\n");
  return {
    win,
    checks: input.checks,
    flagsUsed,
    flagsEnabled,
    budgets,
    failures: [...input.failures],
    timeline: [...input.timeline],
    preset: input.preset,
    summary,
  };
}

export function reportJson(input: ReportInput): string {
  return JSON.stringify(buildReport(input), null, 2);
}
