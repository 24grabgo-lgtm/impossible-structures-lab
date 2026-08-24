/** Tunable starting numbers from docs/LABOR_FRICTION_SHEET.md and related specs. Not historical proof. */

export const G = 9.81;
export const SARSEN_DENSITY = 2500;

export const UPRIGHT = { length: 6.0, width: 2.1, thickness: 1.2 } as const;
export const LINTEL = { length: 4.5, width: 1.1, thickness: 0.8 } as const;

export const SOCKET_DEPTH = 1.5;
export const SOCKET_WIDTH = 2.4;
export const SOCKET_THICKNESS = 1.5;
export const SOCKET_SPACING = 3.2;

export const PLUMB_TOLERANCE_DEG = 2.0;
export const SPACING_TOLERANCE_M = 0.15;
export const CONTACT_THRESHOLD = 0.7;
export const LINTEL_TEST_LOAD_N = 8_000;

export const CREW_PULL_N = 400;
export const STARTING_CREW = 140;
export const STARTING_PERSON_DAYS = 420;
export const STARTING_TIMBER = 80;
export const STARTING_ROPE_CAPACITY_N = 90_000;
export const STARTING_ROPE_WEAR = 0;

export const MU = { stoneGround: 0.65, stoneRollers: 0.2, sledClay: 0.15, sledTallow: 0.1 } as const;

export const STRIP = {
  quarryX: 8, pathStartX: 20, pathEndX: 78, stagingX: 88, siteX: 112,
  pathGradeDeg: 3, softPatchX: 48, softPatchMu: 0.85,
} as const;

export const A_FRAME_HEIGHT = 6.0;
export const A_FRAME_SETBACK = 4.0;
export const A_FRAME_TIMBER = 8;
export const ROLLERS_TIMBER = 10;
export const RAILS_TIMBER = 12;

export const CRIB_INCREMENT_M = 0.3;
export const CRIB_TIMBER_PER_LAYER = 4;
export const RAMP_MAX_STABLE_DEG = 25;
export const RAMP_TIMBER_FACE = 16;

export const FRACTURE_RISK = { Q1: 0.02, Q2: 0.06, Q3: 0.35, Q4: 0.12, Q5: 0.03 } as const;
export const EXTRACT_PERSON_DAYS = { Q1: 18, Q2: 22, Q3: 8, Q4: 6, Q5: 28 } as const;
export const DRESS_PERSON_DAYS_PER_FACE = 4;
export const TENON_PERSON_DAYS = 3;
