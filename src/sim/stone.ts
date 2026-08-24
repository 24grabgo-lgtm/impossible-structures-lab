import { G, LINTEL, SARSEN_DENSITY, UPRIGHT } from "./constants.ts";
import type { StoneKind, StoneRole, StoneState, Vec3 } from "./types.ts";

export function cuboidMassKg(length: number, width: number, thickness: number, density = SARSEN_DENSITY): number {
  return length * width * thickness * density;
}

export function uprightMassKg(): number {
  return cuboidMassKg(UPRIGHT.length, UPRIGHT.width, UPRIGHT.thickness);
}

export function lintelMassKg(): number {
  return cuboidMassKg(LINTEL.length, LINTEL.width, LINTEL.thickness);
}

export function createStone(role: StoneRole, position: Vec3): StoneState {
  const kind: StoneKind = role === "lintel" ? "lintel" : "upright";
  const dim = kind === "lintel" ? LINTEL : UPRIGHT;
  return {
    id: role === "lintel" ? "lintel" : `upright-${role}`,
    kind, role,
    massKg: cuboidMassKg(dim.length, dim.width, dim.thickness),
    length: dim.length, width: dim.width, thickness: dim.thickness,
    comOffset: { x: 0, y: 0, z: 0 },
    position: { ...position },
    tiltDeg: 0, yawDeg: 0, zone: "quarry",
    extracted: false, fractured: false, flatness: 0.45,
    hasTenon: false, hasMortice: false, packed: false, seated: false,
    plumbDeg: 90, fallen: false,
  };
}

export function weightN(stone: StoneState): number {
  return stone.massKg * G;
}

export function worldCom(stone: StoneState): Vec3 {
  const tilt = (stone.tiltDeg * Math.PI) / 180;
  const half = stone.length / 2;
  return {
    x: stone.position.x + half * Math.cos(tilt) + stone.comOffset.x,
    y: stone.position.y + half * Math.sin(tilt) + stone.comOffset.y,
    z: stone.position.z + stone.comOffset.z,
  };
}

export function supportHalfWidth(stone: StoneState): number {
  if (stone.tiltDeg >= 80) return stone.thickness / 2;
  return stone.length / 2;
}

export function isTipping(stone: StoneState): boolean {
  if (stone.fallen) return true;
  if (stone.packed && stone.tiltDeg >= 88 && stone.tiltDeg <= 92) return false;
  const com = worldCom(stone);
  const half = supportHalfWidth(stone);
  if (stone.tiltDeg < 45) {
    return Math.abs(com.x - (stone.position.x + stone.length / 2)) > half + 0.05;
  }
  const offset = com.x - stone.position.x;
  return offset < -0.02 || (stone.tiltDeg > 92 && offset > stone.thickness / 2);
}

export function gravityMomentNm(stone: StoneState): number {
  const tilt = (stone.tiltDeg * Math.PI) / 180;
  const comAlong = stone.length / 2 + stone.comOffset.x;
  return weightN(stone) * comAlong * Math.cos(tilt);
}

export function plumbErrorDeg(stone: StoneState): number {
  return Math.abs(90 - stone.tiltDeg);
}

export function isStableUpright(stone: StoneState, plumbTolDeg: number): boolean {
  if (!stone.extracted || stone.fractured || stone.fallen) return false;
  if (!stone.packed) return false;
  if (stone.kind !== "upright") return false;
  return plumbErrorDeg(stone) <= plumbTolDeg && stone.tiltDeg >= 88;
}
