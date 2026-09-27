/**
 * Product Data Landscape — the payoff. The lifecycle rail resolves into the
 * six-node map (supplier → material → component → product → customer → next
 * life); every mark on it is an answer given during the journey.
 */

import { DIMENSION_META } from "../pathfinder/dimensions.js";
import { firstMove } from "../pathfinder/landscape.js";
import { esc } from "./panel.js";

/** Sentence-case a label list inside running text, keeping acronyms (DPP, ERP / PLM, BOM) intact. */
const inText = (label) =>
  label
    .split(" and ")
    .map((w) => (/^[A-Z][a-z]/.test(w) ? w[0].toLowerCase() + w.slice(1) : w))
    .join(" and ");

const NODES = [
  { id: "supplier", label: "Supplier", from: ["supplier.depth", "supplier.proof", "logistics.change"] },
  { id: "material", label: "Material", from: ["material.composition", "logistics.handoff"] },
  { id: "component", label: "Component", from: ["component.bom", "factory.evidence"] },
  { id: "product", label: "Product", from: ["product.identity", "data.location", "data.owner", "data.retrieval"] },
  { id: "customer", label: "Customer", from: ["passport.carrier"] },
  { id: "nextLife", label: "Next life", from: ["nextLife.continuity"] }
];

const PLATE_LABELS = {
  furniture: {
    composition: "Material composition",
    origin: "Wood origin & legality",
    hazards: "Substances in finishes & foam",
    durability: "Durability & spare parts",
    carbon: "Carbon footprint",
    endOfLife: "Disassembly & end of life"
  },
  battery: {
    composition: "Chemistry & critical raw materials",
    origin: "Supply-chain due diligence",
    hazards: "Hazardous substances",
    durability: "State of health & lifetime",
    carbon: "Carbon footprint",
    endOfLife: "Recycled content & end of life"
  },
  textile: {
    composition: "Fibre composition",
    origin: "Where each step was made",
    hazards: "Substances of concern (e.g. PFAS)",
    durability: "Durability & repairability",
    carbon: "Environmental footprint",
    endOfLife: "Recyclability & take-back"
  }
};

const REGULATION = {
  furniture:
    "Furniture is on the EU’s ESPR work plan; a Digital Product Passport is expected from around 2029. The rows below are what it is likely to ask for.",
  battery:
    "Under the EU Battery Regulation, e-bike (LMT) batteries need a digital battery passport from 18 February 2027. The rows below are what it asks for.",
  textile:
    "Textiles are an ESPR priority group; passport requirements are expected once the textile rules are adopted later this decade. The rows below are what it is likely to ask for."
};

const OPPORTUNITY_COPY = {
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

const STATUS_TEXT = { verified: "On file and verifiable", hairline: "Claimed, not yet proven", absent: "Missing today" };

function level(strengths) {
  if (!strengths.length) return "unknown";
  const min = Math.min(...strengths);
  const avg = strengths.reduce((a, b) => a + b, 0) / strengths.length;
  if (min === 0) return "broken";
  if (min <= 1 || avg < 2) return "weak";
  if (avg >= 3.5) return "verified";
  if (avg >= 2.5) return "connected";
  return "partial";
}

const S_OF = (s) => (s >= 3 ? "strong" : s === 2 ? "partial" : s === 1 ? "weak" : "broken");

export function renderLandscape(el, result, meta, { onRestart, onRevisit, onSend }) {
  const j = result.journey;
  const branch = j.branch;
  const byScenario = new Map();
  for (const f of [...j.exists, ...j.fragmented]) byScenario.set(f.scenarioId, f);
  const nodes = NODES.map((n) => {
    const facts = n.from.map((id) => byScenario.get(id)).filter(Boolean);
    return { ...n, facts, state: level(facts.map((f) => f.strength)) };
  });
  const firstBreak = j.links.findIndex((l) => l.state === "broken" || l.state === "weak");
  const plateLabels = PLATE_LABELS[branch] || PLATE_LABELS.furniture;

  const gapDims = result.fragmentation.dimensions || [];
  const LINK_DIMS = {
    "supplier>material": "supplierDataQuality",
    "material>component": "traceabilityDepth",
    "component>product": "verificationTrust",
    "product>customer": "informationRetrieval",
    "customer>nextLife": "lifecycleCapability"
  };
  const linkDims = j.weakLinks.map((l) => LINK_DIMS[`${l.from}>${l.to}`]).filter(Boolean);
  const moves = [
    ...new Set([result.nextCapability.firstMove, ...gapDims.map(firstMove), ...linkDims.map(firstMove)])
  ].slice(0, 3);
  const opps = (result.opportunities || []).slice(0, 3).map((o) => {
    const c = OPPORTUNITY_COPY[o.id] || { title: o.label || o.id, all: "" };
    return { title: c.title, text: c[branch] || c.all || "" };
  });
  const foundation = (result.foundation.dimensions || []).map((d) => DIMENSION_META[d]?.label || d);
  const exists = j.exists.filter((f) => f.strength >= 2);
  const weak = j.fragmented;
  const missing = result.dppPlate.rows.filter((r) => r.status !== "verified");
  const linksOk = j.links.filter((l) => l.state === "connected" || l.state === "verified").length;

  el.innerHTML = `
    <div class="jr-land-inner">
      <header>
        <p class="jr-kicker">Product Data Landscape · ${esc(meta.industry)}</p>
        <h2 class="jr-land-title" tabindex="-1">This is the shape of your ${esc(meta.short)} data today.</h2>
        <p class="jr-land-lede">Built from what you told us along the way — ${linksOk} of ${j.links.length} lifecycle links hold,
          ${j.weakLinks.length} ${j.weakLinks.length === 1 ? "is" : "are"} weak or broken.
          ${foundation.length ? `Your strongest foundation: ${esc(inText(foundation.join(" and ")))}.` : ""}</p>
      </header>

      <figure class="jr-map" aria-label="Lifecycle map from supplier to next life">
        <div class="jr-map-links" aria-hidden="true">
          ${j.links
            .map(
              (l, i) => `<span class="jr-seg" data-state="${l.state}" style="--i:${i}">
                ${i === firstBreak ? `<em title="Where information gets lost"></em>` : ""}</span>`
            )
            .join("")}
        </div>
        <ol class="jr-map-nodes">
          ${nodes
            .map(
              (n, i) => `<li data-state="${n.state}" style="--i:${i}">
                <span class="jr-node" aria-hidden="true"></span>
                <b>${esc(n.label)}</b>
                ${n.id === "product" && j.home ? `<span class="jr-home">Lives in: ${esc(j.home.label)}</span>` : ""}
                <ul>${n.facts
                  .slice(0, 3)
                  .map((f) => `<li data-s="${S_OF(f.strength)}">${esc(f.text)}</li>`)
                  .join("") || `<li data-s="none">Not covered yet</li>`}</ul>
              </li>`
            )
            .join("")}
        </ol>
        <figcaption>
          <ul class="jr-legend">
            <li><i class="k-verified"></i>Verified</li>
            <li><i class="k-connected"></i>Connected</li>
            <li><i class="k-weak"></i>Weak</li>
            <li><i class="k-broken"></i>Broken</li>
          </ul>
        </figcaption>
      </figure>

      <div class="jr-cols">
        <section class="jr-col">
          <h3>What already exists</h3>
          <ul class="jr-list">${
            exists.map((f) => `<li data-s="${S_OF(f.strength)}">${esc(f.text)}</li>`).join("") ||
            `<li data-s="weak">Very little is structured yet — which makes the first steps cheap.</li>`
          }</ul>
          ${j.home ? `<p>It mostly lives in <strong>${esc(inText(j.home.label))}</strong>.</p>` : ""}
        </section>
        <section class="jr-col">
          <h3>Where it breaks</h3>
          ${firstBreak >= 0 ? `<p class="jr-break">Information first gets lost between <strong>${esc(
            NODES.find((n) => n.id === j.links[firstBreak].from).label.toLowerCase()
          )}</strong> and <strong>${esc(NODES.find((n) => n.id === j.links[firstBreak].to).label.toLowerCase())}</strong>.</p>` : ""}
          ${(() => {
            // Pathfinder names a "first clear break" in its own supply-depth sense; on this map the
            // first break is the lifecycle link above, so its boundary reads as upstream visibility.
            const text = result.fragmentation.explanation.replace(/ -> /g, " → ");
            const m = text.match(/\s*The first clear break is at ([^.]+)\./);
            const main = (m ? text.replace(m[0], "") : text).replace(/around (.+?)\./, (_, g) => `around ${inText(g)}.`);
            return `<p>${esc(main)}</p>${m ? `<p>Upstream, visibility stops at <strong>${esc(m[1])}</strong>.</p>` : ""}`;
          })()}
          <ul class="jr-list">${weak.map((f) => `<li data-s="${S_OF(f.strength)}">${esc(f.text)}</li>`).join("")}</ul>
        </section>
        <section class="jr-col">
          <h3>Make this reliable next</h3>
          <p>${esc(result.nextCapability.why)}</p>
          <ol class="jr-moves">${moves.map((m) => `<li>${esc(m)}</li>`).join("")}</ol>
        </section>
      </div>

      <div class="jr-cols">
        ${opps
          .map(
            (o) => `<section class="jr-col"><h3>Where it pays back · ${esc(o.title)}</h3><p>${esc(o.text)}</p></section>`
          )
          .join("")}
      </div>

      <section class="jr-plate" aria-label="Passport readiness">
        <div>
          <h3 class="jr-kicker">Before the passport</h3>
          <p class="jr-land-lede">${esc(REGULATION[branch] || "")}</p>
          <p class="jr-caveat">Companies answering like this typically need ${esc(result.internal.timelineBand)} to get
            passport-ready. ${esc(result.dppPlate.caveat)}</p>
        </div>
        <ul class="jr-plate-rows">${result.dppPlate.rows
          .map(
            (r) => `<li data-status="${r.status}">${esc(plateLabels[r.id] || r.label)}<small>${
              STATUS_TEXT[r.status]
            }</small></li>`
          )
          .join("")}</ul>
      </section>

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
      </form>
    </div>`;

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
  if (missing.length === 0) el.querySelector(".jr-plate").dataset.complete = "true";
}
