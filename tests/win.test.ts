import { describe, expect, it } from "vitest";
import { PLUMB_TOLERANCE_DEG } from "../src/sim/constants.ts";
import { runScriptedDemo } from "../src/sim/demo.ts";
import { isStableUpright } from "../src/sim/stone.ts";

describe("win: packed uprights + seated lintel", () => {
  it("scripted demo seats a trilithon under sim gravity", () => {
    const { world, report } = runScriptedDemo();
    expect(isStableUpright(world.uprightA, PLUMB_TOLERANCE_DEG)).toBe(true);
    expect(isStableUpright(world.uprightB, PLUMB_TOLERANCE_DEG)).toBe(true);
    expect(world.uprightA.packed).toBe(true);
    expect(world.uprightB.packed).toBe(true);
    expect(world.lintel.seated).toBe(true);
    expect(world.lintel.fallen).toBe(false);
    expect(report.win).toBe(true);
    expect(report.checks.uprightA).toBe(true);
    expect(report.checks.uprightB).toBe(true);
    expect(report.checks.lintel).toBe(true);
    expect(report.flagsUsed).toEqual(expect.arrayContaining(["Q1", "R1", "R2", "L1"]));
  });

  it("test load does not slide a seated lintel", () => {
    const { world } = runScriptedDemo();
    const r = world.testLoad();
    expect(r.ok).toBe(true);
    expect(world.lintel.seated).toBe(true);
  });
});
