import { describe, expect, it } from "vitest";
import { runScriptedDemo } from "../src/sim/demo.ts";
import { anomalyCost, createFlags } from "../src/sim/flags.ts";
import { LabWorld } from "../src/sim/world.ts";

describe("flags: presets, speculative anomaly, baseline win", () => {
  it("Strict Neolithic baseline can win at 0 anomaly", () => {
    const { report } = runScriptedDemo();
    expect(report.win).toBe(true);
    expect(report.budgets.anomaly).toBe(0);
    expect(report.preset).toBe("strict-neolithic");
    expect(report.flagsUsed.some((id) => ["R5", "S1", "S2"].includes(id))).toBe(false);
  });

  it("speculative methods cost anomaly points", () => {
    expect(anomalyCost(createFlags("strict-neolithic"))).toBe(0);
    const world = new LabWorld("strict-neolithic");
    world.toggleFlag("S1", true);
    world.toggleFlag("S2", true);
    world.toggleFlag("R5", true);
    expect(world.budgets.anomaly).toBe(3);
    expect(anomalyCost(world.flags)).toBe(3);
  });

  it("Open lab and Precision presets exist; Open lab enables speculative", () => {
    const open = createFlags("open-lab");
    const precision = createFlags("precision-bam-lite");
    expect(open.find((f) => f.id === "S1")?.enabled).toBe(true);
    expect(anomalyCost(open)).toBeGreaterThan(0);
    expect(precision.find((f) => f.id === "Q1")?.enabled).toBe(true);
    const world = new LabWorld("precision-bam-lite");
    expect(world.preset).toBe("precision-bam-lite");
    expect(world.precisionGapMm).toBe(3);
  });
});
