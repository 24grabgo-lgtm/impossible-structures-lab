import { METHOD_CATALOG } from "../sim/flags.ts";
import { runNamedFailure, runScriptedDemo } from "../sim/demo.ts";
import { LabWorld } from "../sim/world.ts";
import type { ExtractMethod } from "../sim/quarry.ts";
import type { MethodId, PresetId, StoneRole } from "../sim/types.ts";
import { createLabView, type LabView } from "../view/scene.ts";

export async function mountApp(root: HTMLElement): Promise<void> {
  let world = new LabWorld("strict-neolithic");
  let selected: StoneRole = "A";
  let view: LabView | null = null;

  root.innerHTML = `
    <header>
      <div>
        <h1>Impossible Structures Lab — Trilithon v0</h1>
        <p>Source → work → move → place. Fail honestly. Export how you did it. No verdict. Default operator: Eira (unnamed / balanced).</p>
      </div>
      <p>Field notebook</p>
    </header>
    <div class="layout">
      <aside>
        <h2>Method flags</h2>
        <div class="presets" id="presets"></div>
        <div id="flags"></div>
      </aside>
      <div class="viewport" id="viewport">
        <div class="legend">Quarry → path (3°) → staging → sockets. Red dots = CoM.</div>
        <div class="report" id="report"></div>
      </div>
      <aside class="hud">
        <h2>Budgets</h2>
        <div id="meters"></div>
        <h2>Selected stone</h2>
        <div class="select-row" id="select"></div>
        <h2>Log</h2>
        <div class="log" id="log"></div>
      </aside>
      <div class="actions-bar" id="actions"></div>
    </div>
  `;

  const flagsEl = $("#flags");
  const presetsEl = $("#presets");
  const metersEl = $("#meters");
  const selectEl = $("#select");
  const logEl = $("#log");
  const actionsEl = $("#actions");
  const reportEl = $("#report");
  const viewport = $("#viewport");

  const paint = () => {
    flagsEl.innerHTML = METHOD_CATALOG.map((m) => {
      const on = world.flags.find((f) => f.id === m.id)?.enabled ? "checked" : "";
      const spec = m.tier === "speculative" ? "speculative" : "";
      return `<label class="flag ${spec}"><input type="checkbox" data-flag="${m.id}" ${on}/> <span>${m.id} ${m.name} <span class="tier">${m.tier}</span></span></label>`;
    }).join("");
    flagsEl.querySelectorAll<HTMLInputElement>("input[data-flag]").forEach((el) => {
      el.onchange = () => {
        world.toggleFlag(el.dataset.flag as MethodId, el.checked);
        paint();
      };
    });

    presetsEl.innerHTML = "";
    for (const [id, label] of [
      ["strict-neolithic", "Strict Neolithic"],
      ["open-lab", "Open lab"],
      ["precision-bam-lite", "Precision BAM-lite"],
    ] as const) {
      const b = btn(label, () => {
        world.setPreset(id as PresetId);
        paint();
      });
      if (world.preset === id) b.classList.add("primary");
      presetsEl.appendChild(b);
    }

    const b = world.budgets;
    const laborPct = Math.max(0, Math.min(100, (b.laborRemaining / 420) * 100));
    const timberPct = Math.max(0, Math.min(100, (b.timber / 80) * 100));
    const ropePct = Math.max(0, Math.min(100, (1 - b.ropeWear) * 100));
    metersEl.innerHTML = `
      <div class="meter">Labor remaining ${b.laborRemaining.toFixed(1)} pd (${b.laborTimePersonDays.toFixed(1)} spent)<div class="bar"><i style="width:${laborPct}%"></i></div></div>
      <div class="meter">Timber ${b.timber} (spent ${b.timberSpent})<div class="bar"><i style="width:${timberPct}%"></i></div></div>
      <div class="meter">Rope ${(ropePct).toFixed(0)}% · ${(b.ropeCapacityN / 1000).toFixed(0)} kN<div class="bar"><i style="width:${ropePct}%"></i></div></div>
      <div class="meter">Crew ${b.crewAssigned} · safety incidents ${b.crewSafetyIncidents} · anomaly ${b.anomaly}</div>
      <div class="meter">Plumb A ${world.uprightA.tiltDeg.toFixed(0)}° · B ${world.uprightB.tiltDeg.toFixed(0)}° · packed ${world.uprightA.packed && world.uprightB.packed ? "yes" : "no"}</div>
    `;

    selectEl.innerHTML = "";
    for (const role of ["A", "B", "lintel"] as const) {
      const s = world.stone(role);
      const b2 = btn(`${role} (${s.zone})`, () => {
        selected = role;
        paint();
      });
      if (selected === role) b2.classList.add("primary");
      selectEl.appendChild(b2);
    }

    const fail = world.failures.at(-1);
    logEl.className = "log " + (fail && !world.checks().pass ? "bad" : "ok");
    logEl.textContent = world.message + (fail ? `\nLast fail: ${fail.id} — ${fail.message}` : "");

    view?.sync(world);
  };

  const act = (fn: () => void) => {
    fn();
    paint();
  };

  actionsEl.append(
    btn("Run demo", () =>
      act(() => {
        const d = runScriptedDemo();
        world = d.world;
        showReport(true);
      }), "primary"),
    btn("Extract 3 blanks (Q1)", () => act(() => world.extractAll(extractMethod()))),
    btn("Receive blanks", () => act(() => world.receiveBlanks())),
    btn("Haul selected → staging", () => act(() => world.haul(selected, "staging"))),
    btn("Haul selected → site", () => act(() => world.haul(selected, "site"))),
    btn("Dress selected", () => act(() => world.dress(selected))),
    btn("Cut tenon/mortice", () => act(() => world.cutJoints())),
    btn("Dig ramped socket", () => act(() => world.dig(socketOf(selected), "ramped"))),
    btn("Tip into socket", () => act(() => world.tip(socketOf(selected)))),
    btn("A-frame raise + pack", () =>
      act(() => {
        const w = socketOf(selected);
        world.raise(w);
        if (!world.stone(w).packed && !world.stone(w).fallen) world.pack(w);
      })),
    btn("Build crib", () => act(() => world.makeCrib())),
    btn("Crib lintel up", () => act(() => world.cribLintel())),
    btn("Earth ramp (18°)", () => act(() => world.makeRamp(18))),
    btn("Haul lintel up ramp", () => act(() => world.rampLintel())),
    btn("Seat lintel", () => act(() => world.seat())),
    btn("Test load", () => act(() => world.testLoad())),
    btn("Show report", () => showReport(true)),
    btn("Export JSON", () => downloadReport()),
    btn("Demo: rope snap", () =>
      act(() => {
        world = runNamedFailure("rope_snap").world;
        showReport(true);
      }), "danger"),
    btn("Reset", () =>
      act(() => {
        world = new LabWorld(world.preset);
        reportEl.classList.remove("open");
      })),
  );

  function downloadReport() {
    const r = world.report();
    const blob = new Blob([JSON.stringify(r, null, 2)], { type: "application/json" });
    const ael = document.createElement("a");
    ael.href = URL.createObjectURL(blob);
    ael.download = "isl-trilithon-report.json";
    ael.click();
  }

  function extractMethod(): ExtractMethod {
    const order: ExtractMethod[] = ["Q1", "Q2", "Q3", "Q4", "Q5"];
    return order.find((id) => world.flags.find((f) => f.id === id)?.enabled) ?? "Q1";
  }

  function socketOf(role: StoneRole): "A" | "B" {
    return role === "B" ? "B" : "A";
  }

  function showReport(open: boolean) {
    const r = world.report();
    reportEl.classList.toggle("open", open);
    const checks = [
      r.checks.uprightA ? "Upright A stable, packed, in plumb" : "Upright A not standing",
      r.checks.uprightB ? "Upright B stable, packed, in plumb" : "Upright B not standing",
      r.checks.lintel ? "Lintel seated, contact + test load" : "Lintel not seated",
    ];
    reportEl.innerHTML = `
      <h2>Run report</h2>
      <p>${r.win ? "WIN — someone figured out a method mix." : "FAIL — revise the method mix."}</p>
      <ul>${checks.map((c) => `<li>${c}</li>`).join("")}</ul>
      <p><strong>Flags used:</strong> ${r.flagsUsed.join(", ") || "—"}</p>
      <pre>${r.summary}</pre>
      <button type="button" id="copy">Copy summary</button>
      <button type="button" id="close">Close</button>
    `;
    $("#copy").onclick = async () => {
      await navigator.clipboard.writeText(r.summary);
    };
    $("#close").onclick = () => reportEl.classList.remove("open");
  }

  paint();
  try {
    view = await createLabView(viewport);
    view.sync(world);
  } catch (err) {
    const p = document.createElement("p");
    p.className = "log bad";
    p.textContent = `3D view failed to init (${String(err)}). Sim still runs from the action bar.`;
    viewport.appendChild(p);
  }
}

function $(sel: string): HTMLElement {
  const el = document.querySelector(sel);
  if (!el) throw new Error(`missing ${sel}`);
  return el as HTMLElement;
}

function btn(label: string, onClick: () => void, cls?: string): HTMLButtonElement {
  const b = document.createElement("button");
  b.type = "button";
  b.textContent = label;
  if (cls) b.className = cls;
  b.onclick = onClick;
  return b;
}
