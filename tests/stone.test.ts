import { describe, expect, it } from "vitest";
import { G, LINTEL, UPRIGHT } from "../src/sim/constants.ts";
import {
  createStone,
  gravityMomentNm,
  lintelMassKg,
  uprightMassKg,
  weightN,
  worldCom,
} from "../src/sim/stone.ts";
import { haulForceN } from "../src/sim/haul.ts";

describe("stone body: mass, CoM, friction, tip", () => {
  it("upright is ~40 t class", () => {
    const kg = uprightMassKg();
    expect(kg).toBeCloseTo(UPRIGHT.length * UPRIGHT.width * UPRIGHT.thickness * 2500, 0);
    expect(kg / 1000).toBeGreaterThan(35);
    expect(kg / 1000).toBeLessThan(42);
  });

  it("lintel is ~10 t class", () => {
    const kg = lintelMassKg();
    expect(kg / 1000).toBeGreaterThan(8);
    expect(kg / 1000).toBeLessThan(12);
    expect(LINTEL.length).toBeGreaterThan(4);
  });

  it("CoM sits at mid-length when offset is zero", () => {
    const s = createStone("A", { x: 0, y: 0, z: 0 });
    s.tiltDeg = 0;
    const com = worldCom(s);
    expect(com.x).toBeCloseTo(s.length / 2, 5);
    expect(com.y).toBeCloseTo(0, 5);
  });

  it("gravity moment shrinks toward plumb", () => {
    const s = createStone("A", { x: 0, y: 0, z: 0 });
    s.tiltDeg = 30;
    const m30 = gravityMomentNm(s);
    s.tiltDeg = 80;
    const m80 = gravityMomentNm(s);
    s.tiltDeg = 90;
    const m90 = gravityMomentNm(s);
    expect(m30).toBeGreaterThan(m80);
    expect(Math.abs(m90)).toBeLessThan(1);
    expect(weightN(s)).toBeCloseTo(s.massKg * G, 5);
  });

  it("haul force matches μmg + mg sinθ", () => {
    const mass = uprightMassKg();
    const mu = 0.2;
    const level = haulForceN(mass, mu, 0);
    expect(level).toBeCloseTo(mu * mass * G, 0);
    const grade = haulForceN(mass, mu, 3);
    expect(grade).toBeGreaterThan(level);
  });
});
