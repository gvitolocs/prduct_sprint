/**
 * Product Data Landscape — the payoff. The journey ends on the company's own answers, placed on the
 * lifecycle (supplier → material → component → product → customer → next life), and on where
 * information first gets lost. No score: every mark is an answer given along the way
 * (pathfinder/answer-map.js). The regulatory copy follows the review of 28 September 2026
 * (docs/qualification/): no furniture date, EUDR by role, the ESPR table with its markers. The scored
 * dashboard is kept for later: journey/dashboard-view.js, shown only with ?view=dashboard.
 */

import { firstMove } from "../pathfinder/landscape.js";
import { buildAnswerMap } from "../pathfinder/answer-map.js";
import { PASSPORT_LEVEL, deskTag } from "../pathfinder/lifecycle.js";
import { PLATE_LABELS } from "../pathfinder/dashboard.js";
import { DIMENSION_META } from "../pathfinder/dimensions.js";
import { esc } from "./panel.js";

/** The passport rules per branch (review of 28 September 2026; orientation, not legal advice). */
export const REGULATION = {
  furniture:
    "Furniture is a priority product group in the EU’s 2025–2030 ecodesign working plan. The Commission’s indicative plan is to adopt furniture requirements in 2028; with the minimum transition period in the ESPR, a furniture Digital Product Passport would apply from around 2030. The exact data fields are not yet law.",
  battery:
    "Under the EU Battery Regulation, every LMT battery (e-bikes, e-scooters), every industrial battery over 2 kWh and every EV battery placed on the EU market needs its own battery passport from 18 February 2027 — one per battery, opened through a QR code.",
  textile:
    "Textiles, apparel first, are a priority product group in the EU’s 2025–2030 ecodesign working plan. The Commission’s indicative plan is to adopt textile requirements in 2027, and the ESPR allows at least 18 months before they apply. The exact data fields are not yet law."
};

/** Wood (furniture): the EU Deforestation Regulation, by the answer to supplier.role. Never "or you cannot ship". */
export const EUDR_COPY = {
  intro:
    "Before that, from 30 December 2026, wooden furniture placed on the EU market must be covered by an EUDR due-diligence statement: filed by you if you import, kept on record from your suppliers if you buy within the EU. Micro and small makers of wooden seats have until 30 June 2027.",
  import:
    "You import, so the due diligence is yours: species, country of production, the harvest plot’s geolocation, legality evidence and a risk assessment, filed as a due-diligence statement before the wood is placed on the market.",
  "eu-covered":
    "Your EU suppliers file the statements. Yours is a record: who supplied you and whom you supplied, plus the statement reference number where your supplier is the operator — kept for five years, and registered in the EU information system if you are not an SME. The EUDR asks no bill of materials or evidence store of you.",
  mixed:
    "Both apply, line by line: the full due diligence for what you import, the record-keeping for what you buy within the EU. Worth mapping which lines are which.",
  "dont-know":
    "Worth asking purchasing first: the answer decides whether the EUDR is a filing duty for you (you import) or a filing-cabinet duty (you buy within the EU).",
  "little-wood":
    "With little or no wood in what you sell, the EUDR is marginal for you: it covers wooden seats and wooden furniture, and their parts."
};

/**
 * "What the ESPR framework can ask for, and where furniture is likely to land" (review item 9). Only the rows the
 * respondent's own answers speak to are shown; the administrative rows collapse into ESPR_ADMIN_LINE.
 * Markers: [C] confirmed in a primary text · [I] indicative · [?] unverified.
 */
export const ESPR_ROWS = Object.freeze([
  { field: "Primary materials per component; upholstery fibre composition", level: "model / component", marker: "[I]", from: ["material.composition", "component.bom", "sourcing.topten", "sales.artefact"] },
  { field: "Substances of concern: name or CAS, location in the product, concentration", level: "component / batch, tiered access", marker: "[C] it will be asked; thresholds [I]", from: ["material.composition", "sourcing.topten", "sourcing.com"] },
  { field: "Durability; repairability; recyclability", level: "model", marker: "[I]", from: ["nextLife.continuity"] },
  { field: "Joining methods; disassembly and end-of-life information; recycling route", level: "model / component", marker: "[I]", from: ["component.bom"] },
  { field: "Care, assembly and repair instructions; spare-part availability; take-back information", level: "model", marker: "[I]", from: ["nextLife.continuity", "sales.orders"] },
  { field: "Adhesives, coatings, preservatives, flame retardants; VOC and formaldehyde class", level: "component / batch", marker: "[I]", from: ["sales.landing", "sourcing.topten", "sourcing.pdf", "sourcing.com"] },
  { field: "Wood species, country of production, DDS reference", level: "batch", marker: "[C] as EUDR data; [I] as passport field", from: ["supplier.depth", "supplier.trace"] },
  { field: "Harvest-plot geolocation, supplier identities", level: "batch", marker: "[I] restricted, likely not public", from: ["supplier.trace"] },
  { field: "Forestry certifications; eco-labels", level: "material / batch", marker: "[I]", from: ["sales.certificates", "sales.artefact", "sourcing.topten", "sourcing.pdf"] },
  { field: "Carbon footprint; environmental footprint or EPD", level: "model", marker: "[?]", from: ["sales.certificates"] },
  { field: "Expected lifetime; manufacturing date; repair and replacement history", level: "item", marker: "[?]", from: ["sales.reorder"] }
]);
export const ESPR_TITLE = "What the ESPR framework can ask for, and where furniture is likely to land";
export const ESPR_SOURCE = "Drawn from the Commission’s draft of 22 September 2026, which says its list should not yet be read as requirements.";
export const ESPR_ADMIN_LINE =
  "Plus identifiers, operator details, CN code and compliance documents, which any passport system supplies from master data.";

/** First move when some answers vary ("It depends on the supplier / the line …"). */
export const DEPENDS_MOVE =
  "Where you said “it depends”, name the product lines or suppliers where the answer is already yes — and start there.";

export const OPPORTUNITY_COPY = {
  "faster-buyer-proof": {
    title: "Faster answers",
    furniture: "Answer retailer, tender and specifier questions in minutes instead of weeks.",
    battery: "Answer OEM and importer data requests without chasing cell suppliers.",
    textile: "Answer buyer and retailer data requests in minutes."
  },
  "dpp-foundation": {
    title: "Passport preparation",
    all: "A passport built from data you already maintain — not a one-off compliance project."
  },
  "repair-lifecycle": {
    title: "Service & next life",
    furniture: "Spare parts, re-upholstery and resale that know each chair’s own history.",
    battery: "State-of-health-backed resale, refurbishment and second-life value.",
    textile: "Repair, resale and take-back that know how the garment was made."
  },
  "supplier-change-control": {
    title: "Supplier-change control",
    all: "See supplier material changes before your customers do."
  },
  governance: { title: "Ownership", all: "One owner, one version — improvements that stick." }
};

const LINK_DIMS = {
  "supplier>material": "supplierDataQuality",
  "material>component": "traceabilityDepth",
  "component>product": "verificationTrust",
  "product>customer": "informationRetrieval",
  "customer>nextLife": "lifecycleCapability"
};

const MARK_TEXT = { holds: "Holds", partly: "Partly", gap: "Gap", depends: "It depends", unsure: "Not sure", "n/a": "Doesn’t apply" };

/** Capability labels inside running text: sentence case, acronyms kept ("Sales enablement" -> "sales enablement"). */
export function inText(text) {
  let out = text;
  for (const { label } of Object.values(DIMENSION_META)) {
    const lower = label.replace(/^([A-Z])([a-z])/, (_, a, b) => a.toLowerCase() + b);
    out = out.replace(new RegExp(`(?<=\\S )${label.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}`, "g"), lower);
  }
  return out;
}

/** First moves (up to 3) and where it pays back (up to `opportunities`) — shared with the dashboard view. */
export function nextSteps(result, branch, { opportunities = 2, varies = false, skip = [] } = {}) {
  const j = result.journey;
  const gapDims = result.fragmentation.dimensions || [];
  const linkDims = j.weakLinks.map((l) => LINK_DIMS[`${l.from}>${l.to}`]).filter(Boolean);
  const moves = [
    ...new Set([
      ...(varies ? [DEPENDS_MOVE] : []),
      result.nextCapability.firstMove,
      ...gapDims.map(firstMove),
      ...linkDims.map(firstMove)
    ])
  ].slice(0, 3);
  const opps = (result.opportunities || []).filter((o) => !skip.includes(o.id)).slice(0, opportunities).map((o) => {
    const c = OPPORTUNITY_COPY[o.id] || { title: o.label || o.id, all: "" };
    return { title: c.title, text: c[branch] || c.all || "" };
  });
  return { why: inText(result.nextCapability.why), moves, opps };
}

export function ctaHtml() {
  return `
      <div class="jr-cta">
        <a class="jr-btn" href="https://prduct.com/contact">Talk through this landscape</a>
        <button type="button" class="jr-btn is-ghost" data-act="send">Email me this landscape</button>
        <button type="button" class="jr-btn is-ghost" data-act="restart">Explore another product</button>
        <button type="button" class="jr-link" data-act="revisit">← Revisit my answers</button>
      </div>
      <form class="jr-send" hidden novalidate>
        <div class="jr-send-row">
          <input name="firstName" autocomplete="given-name" placeholder="First name" aria-label="First name">
          <input name="lastName" autocomplete="family-name" placeholder="Last name" aria-label="Last name">
        </div>
        <div class="jr-send-row">
          <input name="email" type="email" autocomplete="email" placeholder="Work email" aria-label="Work email" required>
          <input name="company" autocomplete="organization" placeholder="Company" aria-label="Company" required>
        </div>
        <div class="jr-cta"><button class="jr-btn" type="submit">Send</button><p class="jr-send-msg" role="status"></p></div>
      </form>`;
}

export function wireCta(el, { onRestart, onRevisit, onSend }) {
  el.querySelector('[data-act="restart"]').addEventListener("click", onRestart);
  el.querySelector('[data-act="revisit"]').addEventListener("click", onRevisit);
  const form = el.querySelector(".jr-send");
  el.querySelector('[data-act="send"]').addEventListener("click", () => {
    form.hidden = false;
    form.querySelector('[name="firstName"]').focus();
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = form.querySelector(".jr-send-msg");
    const lead = Object.fromEntries(new FormData(form).entries());
    if (!String(lead.email).includes("@") || !String(lead.company).trim()) {
      msg.textContent = "Add a work email and company.";
      return;
    }
    msg.textContent = "Sending…";
    msg.textContent = (await onSend(lead)) ? "Sent. We will be in touch." : "Saved in this browser — the inbox will catch up.";
  });
}

function diagram(map) {
  const breakAt = map.firstBreak ? map.links.findIndex((l) => l.from === map.firstBreak.from) : -1;
  return `<figure class="jr-life" aria-label="Your answers on the lifecycle, from supplier to next life">
    <div class="jr-life-links" aria-hidden="true">${map.links
      .map(
        (l, i) => `<span class="jr-life-seg" data-state="${l.state}" style="--i:${i}">${
          i === breakAt ? `<em title="Where information first gets lost"></em>` : ""
        }</span>`
      )
      .join("")}</div>
    <ol class="jr-life-nodes">${map.nodes
      .map(
        (n, i) => `<li data-state="${n.state}" data-link="${map.links[i]?.state || ""}" style="--i:${i}">
        <a href="#jr-ans-${n.id}"><span class="jr-life-dot" aria-hidden="true"></span><b>${esc(n.label)}</b><small>${esc(
          n.stateLabel
        )}</small></a>
      </li>`
      )
      .join("")}</ol>
    <figcaption>
      <p class="jr-life-break">${
        map.firstBreak
          ? `Information first gets lost between <strong>${esc(map.firstBreak.fromLabel.toLowerCase())}</strong> and <strong>${esc(
              map.firstBreak.toLabel.toLowerCase()
            )}</strong>.`
          : "Information holds from supplier to next life."
      }</p>
      <ul class="jr-legend">
        <li><i class="k-connected"></i>Holds</li>
        <li><i class="k-partial"></i>Partly</li>
        <li><i class="k-weak"></i>Weak</li>
        <li><i class="k-broken"></i>Broken</li>
        <li><i class="k-open"></i>Open — it depends</li>
      </ul>
    </figcaption>
  </figure>`;
}

function answerCard(n) {
  return `<section class="jr-card jr-ans" id="jr-ans-${n.id}" data-node="${n.id}" tabindex="-1">
    <header class="jr-card-head"><span class="jr-card-title">${esc(n.label)}</span><span class="jr-pill" data-state="${
      n.state
    }">${esc(n.stateLabel)}</span></header>
    <ul class="jr-ans-items">${
      n.items
        .map(
          (i) => `<li data-mark="${i.mark}"${i.module ? ` data-module="${i.module}"` : ""}><small>${
            i.module ? `<b class="jr-tag">${esc(deskTag(i.module) || "Desk module")}</b> ` : ""
          }${esc(i.question)}</small><span>${esc(i.answer)}</span><em>${MARK_TEXT[i.mark]}</em>${
            i.note ? `<p class="jr-ans-note">${esc(i.note)}</p>` : ""
          }</li>`
        )
        .join("") || `<li data-mark="n/a"><span>Not asked on this path</span></li>`
    }</ul>
  </section>`;
}

/** The sales module echoed in the respondent's own words — never priced (review item 8). */
function salesEcho(sales) {
  const lines = [sales.landing, sales.artefact].filter(Boolean);
  const said = [
    sales.volume && `Asked about materials, origin or certificates last month: <strong>${esc(sales.volume)}</strong>`,
    sales.hours && `Hours that went into answering: <strong>${esc(sales.hours)}</strong>`
  ].filter(Boolean);
  return `<div class="jr-card is-text jr-echo"><span class="jr-card-title">Where it pays back · Faster answers</span>
    ${lines.map((l) => `<p class="jr-echo-line">${esc(l)}</p>`).join("")}
    ${said.length ? `<ul class="jr-echo-said">${said.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}
  </div>`;
}

/** The purchasing module likewise (review item 13): what the supply base can deliver today, never scored. */
function sourcingEcho(purch) {
  const lines = [purch.whoasks, purch.irreplaceable].filter(Boolean);
  const said = [
    purch.topten && `Asked for what they already owe on the last delivery, your ten biggest suppliers: <strong>${esc(purch.topten)}</strong>`
  ].filter(Boolean);
  return `<div class="jr-card is-text jr-echo"><span class="jr-card-title">What your suppliers can deliver today</span>
    ${lines.map((l) => `<p class="jr-echo-line">${esc(l)}</p>`).join("")}
    ${said.length ? `<ul class="jr-echo-said">${said.map((x) => `<li>${x}</li>`).join("")}</ul>` : ""}
  </div>`;
}

function esprTable(state) {
  const asked = new Set(state.history.map((h) => h.scenarioId)); // a row shows when a question behind it was asked
  const rows = ESPR_ROWS.filter((r) => r.from.some((id) => asked.has(id)));
  return `<table class="jr-espr">
      <caption>${esc(ESPR_SOURCE)}</caption>
      <thead><tr><th scope="col">Field</th><th scope="col">Likely level</th><th scope="col">Basis</th></tr></thead>
      <tbody>${rows
        .map((r) => `<tr><td>${esc(r.field)}</td><td>${esc(r.level)}</td><td><span class="jr-marker">${esc(r.marker)}</span></td></tr>`)
        .join("")}</tbody>
    </table>
    <p class="jr-reg-level">${esc(ESPR_ADMIN_LINE)}</p>
    <p class="jr-dash-note">[C] confirmed in a primary text · [I] indicative · [?] unverified.</p>`;
}

function passportSection(state, map, branch) {
  if (branch === "furniture") {
    return `<section class="jr-dash-sec jr-card is-text jr-reg" aria-labelledby="jr-dash-reg">
        <h3 id="jr-dash-reg" class="jr-card-title">${esc(ESPR_TITLE)}</h3>
        <p>${esc(REGULATION.furniture)}</p>
        ${esprTable(state)}
        <div class="jr-eudr">
          <h4 class="jr-card-title">Wood · EU Deforestation Regulation</h4>
          <p>${esc(EUDR_COPY.intro)}</p>
          ${
            map.eudrRole && EUDR_COPY[map.eudrRole]
              ? `<p class="jr-eudr-role"><small>You answered: ${esc(map.eudrAnswer)}</small>${esc(EUDR_COPY[map.eudrRole])}</p>`
              : ""
          }
        </div>
        <p class="jr-dash-note">Orientation, not legal advice or certification.</p>
      </section>`;
  }
  const fields = Object.values(PLATE_LABELS[branch] || PLATE_LABELS.furniture);
  return `<section class="jr-dash-sec jr-card is-text jr-reg" aria-labelledby="jr-dash-reg">
        <h3 id="jr-dash-reg" class="jr-card-title">Before the passport</h3>
        <p>${esc(REGULATION[branch] || "")}</p>
        <p class="jr-reg-level">Kept per: <strong>${esc(PASSPORT_LEVEL[branch] || "")}</strong></p>
        <p class="jr-reg-sub">${branch === "battery" ? "What the battery passport asks about" : "What a passport is likely to ask about"}</p>
        <ul class="jr-fields">${fields.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>
        <p class="jr-dash-note">Orientation, not legal advice or certification.</p>
      </section>`;
}

/**
 * @param {HTMLElement} el     the .jr-land layer
 * @param {object} state        the finalized journey (finalizeJourney)
 * @param {{ industry: string, short: string, object?: string }} meta
 */
export function renderLandscape(el, state, meta, handlers) {
  const result = state.result;
  const branch = state.branch;
  const map = buildAnswerMap(state);
  const varies = map.nodes.some((n) => n.items.some((i) => i.varies));
  const next = nextSteps(result, branch, { varies, skip: map.sales ? ["faster-buyer-proof"] : [], opportunities: map.sales ? 1 : 2 });
  const context = [
    map.persona && `Answered from: <strong>${esc(map.persona)}</strong>`,
    map.channel && `Sells to: <strong>${esc(map.channel)}</strong>`,
    map.priority && `First priority: <strong>${esc(map.priority)}</strong>`
  ].filter(Boolean);

  el.innerHTML = `
    <div class="jr-land-inner jr-dash jr-map-view">
      <header class="jr-dash-head">
        <div>
          <p class="jr-dash-kicker">Product Data Landscape · ${esc(meta.industry)}</p>
          <h2 class="jr-land-title" tabindex="-1">Your ${esc(meta.object || meta.short)} data today</h2>
          <p class="jr-dash-lede">Your own answers, placed where they sit in the ${esc(meta.short)}’s lifecycle. Nothing here is estimated.</p>
        </div>
        ${context.length ? `<p class="jr-dash-updated">${context.join(" · ")}</p>` : ""}
      </header>

      <section class="jr-card jr-life-card">${diagram(map)}</section>

      <section class="jr-dash-sec" aria-labelledby="jr-dash-answers">
        <h3 id="jr-dash-answers" class="jr-dash-h">What you told us, stage by stage</h3>
        <div class="jr-ans-grid">${map.nodes.map(answerCard).join("")}</div>
      </section>

      <section class="jr-dash-sec" aria-labelledby="jr-dash-next">
        <h3 id="jr-dash-next" class="jr-dash-h">Make this reliable next</h3>
        <div class="jr-dash-grid">
          <div class="jr-card is-text">
            <span class="jr-card-title">First moves</span>
            <p>${esc(next.why)}</p>
            <ol class="jr-moves">${next.moves.map((m) => `<li>${esc(m)}</li>`).join("")}</ol>
          </div>
          ${map.sales ? salesEcho(map.sales) : ""}
          ${map.purchasing ? sourcingEcho(map.purchasing) : ""}
          ${next.opps
            .map(
              (o) => `<div class="jr-card is-text"><span class="jr-card-title">Where it pays back · ${esc(o.title)}</span><p>${esc(
                o.text
              )}</p></div>`
            )
            .join("")}
        </div>
      </section>

      ${passportSection(state, map, branch)}
      ${ctaHtml()}
    </div>`;

  wireCta(el, handlers);
  // node → its answers card, without touching location.hash (the page's own anchors use it)
  el.querySelectorAll(".jr-life-nodes a").forEach((a) =>
    a.addEventListener("click", (e) => {
      e.preventDefault();
      const card = el.querySelector(a.getAttribute("href"));
      if (!card) return;
      card.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      card.focus({ preventScroll: true });
    })
  );
  return map;
}
