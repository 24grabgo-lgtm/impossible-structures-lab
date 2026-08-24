# Impossible Structures Lab

**Pitch:** Source, work, move, and place “impossible” megaliths with every thinkable method on the table. Kerbal-style fail → revise. BAM precision questions + Hancock “how?” energy — **no forced historical verdict**.

**Repo:** https://github.com/24grabgo-lgtm/impossible-structures-lab

**Start here to build:** [`docs/HANDOFF_PACK.md`](docs/HANDOFF_PACK.md) · [`docs/MASTER_PLAN.md`](docs/MASTER_PLAN.md)

---

## Run the prototype

Install, test, and start the lab:

    npm install && npm test && npm run dev

- `npm test` — vitest (win / fail / report, no WebGL)
- `npm run typecheck` — tsc --noEmit
- `npm run build` — production bundle
- `npm run dev` — Vite at http://localhost:5173

Open the lab, pick a method preset (**Strict Neolithic** is the default), then either **Run demo** or play the strip: extract → haul → ramped socket → A-frame raise + pack → crib lintel → seat. The report lists which method flags were on and the labor / timber / rope / safety / anomaly budgets. Speculative flags are labeled and cost anomaly points; they are never required.

A 2-minute human attempt: Extract 3 blanks → Haul A to site → Dig ramped socket → Tip → A-frame raise + pack → repeat for B → Haul lintel → Build crib → Crib lintel up → Seat → Show report. Uncheck **R2 A-frame** after tipping to feel a rope snap.

---

## PoC lock

| Axis | Choice |
|------|--------|
| Structure | **One trilithon** (2 uprights + lintel) |
| Time | Late Neolithic baseline + optional method flags |
| Place | Quarry → path → site strip |
| Stretch | Baalbek-class single block |

---

## Doc index

| Doc | Role |
|-----|------|
| `MASTER_PLAN.md` | Phases & scope |
| `HANDOFF_PACK.md` | **Engine build order + blurb** |
| `PITCH.md` | Product pitch |
| `POC_TARGET.md` | Locked target |
| `SCENARIO_TRILITHON_V0.md` | Playable beats |
| `SCENARIO_BAALBEK_STRETCH.md` | v0.2 mass test |
| `METHOD_FLAGS.md` / `METHOD_CATALOG.md` | All methods |
| `EXPERIMENTAL_ARCHAEOLOGY_LIFTING.md` | Lift research |
| `QUARRY_AND_DRESSING.md` | Extract/dress |
| `LABOR_FRICTION_SHEET.md` | Sim numbers |
| `MATERIALS_AND_CONSTRAINTS.md` | Stone/timber/rope |
| `FAILURE_MATRIX.md` | Legible fails |
| `SUCCESS_METRICS.md` | Win + report |
| `UI_SPEC_V0.md` | Flags HUD report |
| `IMPLEMENTATION_PLAN_V0.md` | Tech build steps |

---

## Loop

Source → Work → Move → Place → Fail honestly → Revise → Retry → **Export method report**

---

*Design package: executed. v0 engine: playable trilithon loop in this repo (browser prototype).*
