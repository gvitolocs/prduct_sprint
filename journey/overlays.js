/**
 * Data overlays on the photography — real HTML, live from the assessment state.
 * DATA: what the physical identifier connects to. PASSPORT: the passport a scan
 * would open today. Thin geometry, positioned on the anchor's hotspot (image %
 * coordinates) through the same object-fit: cover mapping the viewport uses.
 */

import { PLATE_LABELS } from "../pathfinder/dashboard.js";
import { esc } from "./panel.js";

/**
 * The passport card at the passport stop: what a passport can carry and at which level — no status per field.
 * Furniture rows from the Commission's draft data-needs table (22 September 2026, not yet requirements).
 */
export const PASSPORT_CARD = Object.freeze({
  furniture: {
    kicker: "Furniture passport · draft fields",
    rows: [
      ["Materials per component", "model"],
      ["Substances of concern", "component / batch"],
      ["Care, repair & spare parts", "model"],
      ["Disassembly & end of life", "model"],
      ["Wood species, country, DDS reference", "batch"]
    ],
    foot: "Commission draft, 22 Sept 2026 — not yet requirements"
  },
  battery: {
    kicker: "Battery passport · from 18 Feb 2027",
    rows: Object.values(PLATE_LABELS.battery).map((l) => [l, "per battery"]),
    foot: "EU Battery Regulation, Annex XIII"
  },
  textile: {
    kicker: "Textile passport · fields to be set",
    rows: Object.values(PLATE_LABELS.textile).map((l) => [l, "act decides"]),
    foot: "ESPR textile rules planned for 2027 — not yet law"
  }
});

/** "This code connects to" rows on the data stop: each row reads the first answered scenario of `from`. */
export const DATA_ROWS = Object.freeze([
  { label: "Batch", from: ["logistics.handoff"] },
  { label: "Work order", from: ["factory.evidence"] },
  { label: "Source evidence", from: ["supplier.proof", "supplier.depth"] },
  { label: "Bill of materials", from: ["component.bom"] }
]);

function answer(state, id) {
  return state.history.find((h) => h.scenarioId === id) || null;
}
const level = (h) =>
  !h ? "unknown" : h.flags?.includes("not-applicable") ? "open" : h.strength >= 3 ? "linked" : h.strength === 2 ? "partial" : "missing";

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
      const rows = DATA_ROWS.map((r) => [r.label, level(r.from.map((id) => answer(state, id)).find(Boolean))]);
      const right = anchor.hotspotSide ? anchor.hotspotSide === "right" : x < W * 0.62;
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
      const card = PASSPORT_CARD[branch] || PASSPORT_CARD.furniture;
      const right = anchor.hotspotSide ? anchor.hotspotSide === "right" : x < W * 0.55;
      html = `<div class="jr-ov jr-ov-passport${right ? "" : " is-left"}" style="left:${x}px;top:${y}px" aria-hidden="true">
        <span class="jr-ov-reticle"></span>
        <div class="jr-ov-card">
          <p class="jr-ov-kicker">${esc(card.kicker)}</p>
          <p class="jr-ov-title">${esc(state.branch === "furniture" ? "Lounge chair" : state.branch === "battery" ? "E-bike battery" : "Rain jacket")}</p>
          <ul>${card.rows.map(([k, v]) => `<li data-v="level"><span>${esc(k)}</span><em>${esc(v)}</em></li>`).join("")}</ul>
          <p class="jr-ov-foot">${esc(card.foot)}</p>
        </div>
      </div>`;
    }
    if (!html) return;
    this.root.insertAdjacentHTML("beforeend", html);
    const el = this.root.lastElementChild;
    // keep the card inside the stage: nudge it back in when the hotspot sits near an edge
    const card = el.querySelector(".jr-ov-card");
    const r = card?.getBoundingClientRect();
    const box = this.root.getBoundingClientRect();
    if (r) {
      const over = r.right - (box.right - 16);
      const under = box.left + 16 - r.left;
      if (over > 0) card.style.marginLeft = `${-over}px`;
      else if (under > 0) card.style.marginLeft = `${under}px`;
    }
    requestAnimationFrame(() => el.classList.add("is-on"));
    setTimeout(() => el.classList.add("is-on"), 60); // background tabs: no frames needed
    this.current = stage;
  }
}
