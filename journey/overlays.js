/**
 * Data overlays on the photography — real HTML, live from the assessment state.
 * DATA: what the physical identifier connects to. PASSPORT: the passport a scan
 * would open today. Thin geometry, positioned on the anchor's hotspot (image %
 * coordinates) through the same object-fit: cover mapping the viewport uses.
 */

import { buildDppPlate } from "../pathfinder/calculator-bridge.js";
import { esc } from "./panel.js";

const PLATE_LABELS = {
  furniture: { composition: "Material composition", origin: "Wood origin & legality", hazards: "Substances in finishes & foam", durability: "Durability & spare parts", carbon: "Carbon footprint", endOfLife: "Disassembly & end of life" },
  battery: { composition: "Chemistry & raw materials", origin: "Supply-chain due diligence", hazards: "Hazardous substances", durability: "State of health", carbon: "Carbon footprint", endOfLife: "Recycled content & end of life" },
  textile: { composition: "Fibre composition", origin: "Where each step was made", hazards: "Substances of concern", durability: "Durability & repair", carbon: "Environmental footprint", endOfLife: "Recyclability & take-back" }
};
const STATUS = { verified: "verified", hairline: "claimed", absent: "missing" };

function answer(state, id) {
  return state.history.find((h) => h.scenarioId === id) || null;
}
const level = (h) => (!h ? "unknown" : h.strength >= 3 ? "linked" : h.strength === 2 ? "partial" : "missing");

/** Map an image-space hotspot (0-100 %) to viewport pixels for object-fit: cover. */
function place(el, hotspot, focus) {
  const box = el.getBoundingClientRect();
  const s = Math.max(box.width / 1920, box.height / 1080);
  const w = 1920 * s;
  const h = 1080 * s;
  const [fx, fy] = String(focus || "50% 50%").split(" ").map((v) => parseFloat(v) / 100);
  const x = (box.width - w) * (isNaN(fx) ? 0.5 : fx) + (hotspot[0] / 100) * w;
  const y = (box.height - h) * (isNaN(fy) ? 0.5 : fy) + (hotspot[1] / 100) * h;
  return [x, y, box.width, box.height];
}

export class Overlays {
  constructor(root) {
    this.root = root; // .jr-overlay layer inside the stage
    this.current = null;
  }

  hide() {
    if (!this.root.firstElementChild) return;
    const el = this.root.firstElementChild;
    el.classList.remove("is-on");
    setTimeout(() => {
      if (el.parentNode === this.root && !el.classList.contains("is-on")) el.remove();
    }, 450);
    this.current = null;
  }

  show(stage, state, anchor, { compact = false } = {}) {
    this.hide();
    if (compact || !anchor?.hotspot) return;
    const branch = state.branch;
    // Map through the framing the stage is actually using (desktop keeps one focus for the whole
    // journey so video and stills never shift), not the anchor's own preferred focus.
    const media = this.root.parentElement?.querySelector(".jr-media");
    const focus = media?.style.getPropertyValue("--jr-focus").trim() || anchor.focus;
    const [x, y, W] = place(this.root, anchor.hotspot, focus);
    let html = "";
    if (stage === "data") {
      const rows = [
        ["Batch", level(answer(state, "logistics.handoff"))],
        ["Work order", level(answer(state, "factory.evidence"))],
        ["Source evidence", level(answer(state, "supplier.proof") || answer(state, "supplier.depth"))],
        ["Bill of materials", level(answer(state, "component.bom"))]
      ];
      const right = x < W * 0.62;
      html = `<div class="jr-ov jr-ov-trace${right ? "" : " is-left"}" style="left:${x}px;top:${y}px" aria-hidden="true">
        <span class="jr-ov-reticle"></span>
        <div class="jr-ov-card">
          <p class="jr-ov-kicker">This code connects to</p>
          <ul>${rows
            .map(([k, v]) => `<li data-v="${v}"><span>${esc(k)}</span><em>${v === "unknown" ? "—" : v}</em></li>`)
            .join("")}</ul>
        </div>
      </div>`;
    } else if (stage === "passport") {
      const plate = buildDppPlate(state);
      const labels = PLATE_LABELS[branch] || PLATE_LABELS.furniture;
      const right = x < W * 0.55;
      html = `<div class="jr-ov jr-ov-passport${right ? "" : " is-left"}" style="left:${x}px;top:${y}px" aria-hidden="true">
        <span class="jr-ov-reticle"></span>
        <div class="jr-ov-card">
          <p class="jr-ov-kicker">Prduct passport · today</p>
          <p class="jr-ov-title">${esc(state.branch === "furniture" ? "Lounge chair" : state.branch === "battery" ? "E-bike battery" : "Rain jacket")}</p>
          <ul>${plate.rows
            .map((r) => `<li data-v="${r.status}"><span>${esc(labels[r.id] || r.label)}</span><em>${STATUS[r.status]}</em></li>`)
            .join("")}</ul>
        </div>
      </div>`;
    }
    if (!html) return;
    this.root.insertAdjacentHTML("beforeend", html);
    const el = this.root.lastElementChild;
    requestAnimationFrame(() => el.classList.add("is-on"));
    setTimeout(() => el.classList.add("is-on"), 60); // background tabs: no frames needed
    this.current = stage;
  }
}
