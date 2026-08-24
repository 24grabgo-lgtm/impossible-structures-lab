import { LabWorld } from "./world.ts";
import type { ActionResult, FailureId, RunReport } from "./types.ts";

function must(r: ActionResult, step: string): void {
  if (!r.ok) throw new Error(`${step} failed: ${r.detail}`);
}

export function runScriptedDemo(): { world: LabWorld; report: RunReport } {
  const world = new LabWorld("strict-neolithic");
  must(world.extractAll("Q1"), "extract");
  for (const role of ["A", "B", "lintel"] as const) {
    must(world.haul(role, "staging"), `haul ${role} staging`);
    must(world.dress(role), `dress ${role}`);
  }
  must(world.cutJoints(), "joints");
  for (const which of ["A", "B"] as const) {
    must(world.haul(which, "site"), `haul ${which} site`);
    must(world.dig(which, "ramped"), `dig ${which}`);
    must(world.tip(which), `tip ${which}`);
    must(world.raise(which), `raise ${which}`);
    if (!world.stone(which).packed) must(world.pack(which), `pack ${which}`);
  }
  must(world.haul("lintel", "site"), "haul lintel");
  must(world.makeCrib(), "crib");
  must(world.cribLintel(), "lift lintel");
  must(world.seat(), "seat");
  must(world.testLoad(), "test load");
  return { world, report: world.report() };
}

export function runNamedFailure(id: FailureId): { world: LabWorld; report: RunReport } {
  if (id === "rope_snap") return failRopeSnap();
  if (id === "past_plumb_fall") return failPastPlumb();
  if (id === "crib_collapse") return failCribCollapse();
  if (id === "ramp_shear") return failRampShear();
  if (id === "blank_fracture") return failFracture();
  if (id === "lintel_slide") return failLintelSlide();
  if (id === "socket_blowout") return failSocketBlowout();
  if (id === "wrong_socket_profile") return failWrongProfile();
  if (id === "stuck_slide_back") return failStuck();
  return failRopeSnap();
}

function failRopeSnap() {
  const world = new LabWorld("strict-neolithic");
  world.extractAll("Q1"); world.haul("A", "site"); world.dig("A", "ramped"); world.tip("A");
  world.toggleFlag("R2", false); world.raise("A");
  return { world, report: world.report() };
}
function failPastPlumb() {
  const world = new LabWorld("strict-neolithic");
  world.extractAll("Q1"); world.haul("A", "site"); world.dig("A", "ramped"); world.tip("A");
  world.raise("A", { skipPack: true, forcePastPlumb: true });
  return { world, report: world.report() };
}
function failCribCollapse() {
  const world = new LabWorld("strict-neolithic");
  world.extractAll("Q1");
  for (const which of ["A", "B"] as const) {
    world.haul(which, "site"); world.dig(which, "ramped"); world.tip(which); world.raise(which);
    if (!world.stone(which).packed) world.pack(which);
  }
  world.haul("lintel", "site"); world.makeCrib(); world.cribLintel({ uneven: true });
  return { world, report: world.report() };
}
function failRampShear() {
  const world = new LabWorld("strict-neolithic");
  world.extractAll("Q1"); world.makeRamp(32);
  return { world, report: world.report() };
}
function failFracture() {
  const world = new LabWorld("strict-neolithic");
  world.extract("A", "Q3", 0.01);
  if (!world.failures.some((f) => f.id === "blank_fracture")) {
    world.uprightA.fractured = true; world.extract("A", "Q3", 1);
  }
  return { world, report: world.report() };
}
function failLintelSlide() {
  const world = new LabWorld("strict-neolithic");
  world.extractAll("Q1");
  for (const which of ["A", "B"] as const) {
    world.haul(which, "site"); world.dig(which, "ramped"); world.tip(which); world.raise(which);
    if (!world.stone(which).packed) world.pack(which);
  }
  world.uprightA.flatness = 0.2; world.uprightB.flatness = 0.2; world.lintel.flatness = 0.2;
  world.haul("lintel", "site"); world.makeCrib(); world.cribLintel(); world.seat();
  return { world, report: world.report() };
}
function failSocketBlowout() {
  const world = new LabWorld("strict-neolithic");
  world.extractAll("Q1"); world.haul("A", "site"); world.dig("A", "ramped"); world.tip("A");
  world.sockets.A.hasVerticalFace = false; world.raise("A");
  return { world, report: world.report() };
}
function failWrongProfile() {
  const world = new LabWorld("strict-neolithic");
  world.dig("A", "shallow");
  return { world, report: world.report() };
}
function failStuck() {
  const world = new LabWorld("strict-neolithic");
  world.toggleFlag("M1", false); world.toggleFlag("M2", false); world.toggleFlag("M3", false);
  world.extractAll("Q1"); world.haul("A", "site");
  return { world, report: world.report() };
}
