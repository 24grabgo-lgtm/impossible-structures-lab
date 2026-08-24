import { describe, expect, it } from "vitest";
import { runNamedFailure, runScriptedDemo } from "../src/sim/demo.ts";
import { buildReport } from "../src/sim/report.ts";

describe("report: flags + budgets serialize", () => {
  it("demo report lists method flags and budgets", () => {
    const { report } = runScriptedDemo();
    expect(report.flagsUsed.length).toBeGreaterThan(0);
    expect(report.flagsUsed).toEqual(expect.arrayContaining(["Q1", "M1", "M2", "R1", "R2", "R3", "L1", "D1"]));
    expect(report.budgets.laborTimePersonDays).toBeGreaterThan(0);
    expect(report.budgets.timberSpent).toBeGreaterThan(0);
    expect(report.budgets.anomaly).toBe(0);
    expect(typeof report.budgets.ropeWear).toBe("number");
    expect(typeof report.budgets.crewSafetyIncidents).toBe("number");
    const json = JSON.stringify(report);
    const parsed = JSON.parse(json) as typeof report;
    expect(parsed.win).toBe(true);
    expect(parsed.flagsUsed).toEqual(report.flagsUsed);
    expect(parsed.budgets.laborTimePersonDays).toBe(report.budgets.laborTimePersonDays);
    expect(report.summary).toMatch(/WIN/);
    expect(report.summary).toMatch(/Labor:/);
    expect(report.summary).toMatch(/Anomaly: 0/);
  });

  it("failure report still serializes flags and the named fail", () => {
    const { report } = runNamedFailure("rope_snap");
    const parsed = JSON.parse(JSON.stringify(report));
    expect(parsed.win).toBe(false);
    expect(parsed.failures[0].id).toBe("rope_snap");
    expect(parsed.budgets).toHaveProperty("timber");
    expect(parsed.budgets).toHaveProperty("anomaly");
    expect(report.summary).toMatch(/FAIL/);
  });

  it("buildReport is a plain-data snapshot", () => {
    const { world } = runScriptedDemo();
    const snap = buildReport({
      checks: world.checks(),
      flags: world.flags,
      flagsUsed: world.flagsUsed,
      budgets: world.budgets,
      failures: world.failures,
      timeline: world.timeline,
      preset: world.preset,
    });
    expect(snap.preset).toBe("strict-neolithic");
    expect(snap.timeline.length).toBeGreaterThan(5);
  });
});
