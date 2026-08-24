import {
  STARTING_CREW, STARTING_PERSON_DAYS, STARTING_ROPE_CAPACITY_N,
  STARTING_ROPE_WEAR, STARTING_TIMBER,
} from "./constants.ts";
import type { Budgets } from "./types.ts";

export function createBudgets(crew = STARTING_CREW): Budgets {
  return {
    laborTimePersonDays: 0, laborRemaining: STARTING_PERSON_DAYS,
    crewAssigned: crew, crewAvailable: crew,
    timber: STARTING_TIMBER, timberSpent: 0,
    ropeWear: STARTING_ROPE_WEAR, ropeCapacityN: STARTING_ROPE_CAPACITY_N,
    crewSafetyIncidents: 0, anomaly: 0,
  };
}

export function spendLabor(b: Budgets, personDays: number): boolean {
  if (personDays > b.laborRemaining) return false;
  b.laborRemaining -= personDays;
  b.laborTimePersonDays += personDays;
  return true;
}

export function spendTimber(b: Budgets, units: number): boolean {
  if (units > b.timber) return false;
  b.timber -= units;
  b.timberSpent += units;
  return true;
}

export function addRopeWear(b: Budgets, wear: number): void {
  b.ropeWear += wear;
  b.ropeCapacityN = Math.max(20_000, STARTING_ROPE_CAPACITY_N * (1 - b.ropeWear));
}

export function recordIncident(b: Budgets, n = 1): void {
  b.crewSafetyIncidents += n;
}
