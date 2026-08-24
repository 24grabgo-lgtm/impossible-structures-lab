import { describe, expect, it } from "vitest";
import { runNamedFailure } from "../src/sim/demo.ts";
import { LabWorld } from "../src/sim/world.ts";

describe("fail: named failure modes from FAILURE_MATRIX", () => {
  it("rope snap when raising without A-frame", () => {
    const { world, report } = runNamedFailure("rope_snap");
    expect(world.failures.some((f) => f.id === "rope_snap")).toBe(true);
    expect(report.win).toBe(false);
    expect(report.failures.map((f) => f.id)).toContain("rope_snap");
  });

  it("past-plumb fall when pack is skipped", () => {
    const { world } = runNamedFailure("past_plumb_fall");
    expect(world.failures.some((f) => f.id === "past_plumb_fall")).toBe(true);
    expect(world.uprightA.fallen).toBe(true);
  });

  it("crib collapse on uneven lift", () => {
    const { world } = runNamedFailure("crib_collapse");
    expect(world.failures.some((f) => f.id === "crib_collapse")).toBe(true);
    expect(world.crib.collapsed).toBe(true);
  });

  it("ramp shear when fill angle is too steep", () => {
    const { world } = runNamedFailure("ramp_shear");
    expect(world.failures.some((f) => f.id === "ramp_shear")).toBe(true);
    expect(world.ramp.sheared).toBe(true);
  });

  it("lintel slide when contact is below threshold", () => {
    const { world } = runNamedFailure("lintel_slide");
    expect(world.failures.some((f) => f.id === "lintel_slide")).toBe(true);
    expect(world.lintel.seated).toBe(false);
  });

  it("socket blow-out without a vertical stop face", () => {
    const { world } = runNamedFailure("socket_blowout");
    expect(world.failures.some((f) => f.id === "socket_blowout")).toBe(true);
  });

  it("wrong socket profile on a shallow dig", () => {
    const { world } = runNamedFailure("wrong_socket_profile");
    expect(world.failures.some((f) => f.id === "wrong_socket_profile")).toBe(true);
  });

  it("stuck / slide back when haul has no rollers or lube", () => {
    const { world } = runNamedFailure("stuck_slide_back");
    expect(world.failures.some((f) => f.id === "stuck_slide_back")).toBe(true);
  });

  it("labor exhaustion is recorded when the pool is empty", () => {
    const world = new LabWorld("strict-neolithic");
    world.budgets.laborRemaining = 0.5;
    const r = world.extractAll("Q1");
    expect(r.ok).toBe(false);
    expect(world.failures.some((f) => f.id === "labor_exhaustion")).toBe(true);
  });
});
