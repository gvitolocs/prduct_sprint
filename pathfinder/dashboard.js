/**
 * Readiness dashboard — the journey's end pane as a compliance-style overview.
 *
 * Every number is a count of something the respondent answered; nothing is estimated:
 *   progress   three cards (passport data, lifecycle links, data capabilities): complete / partial / total
 *   monitoring one card per lifecycle domain: the answers given there, OK (strength >= 3) vs needs attention
 * Pure functions over the finalized journey state (lifecycle.finalizeJourney); no DOM.
 */

import { DIMENSION_IDS, DIMENSION_META } from "./dimensions.js";

export const DASHBOARD_VERSION = "dashboard-1.0";

/** Passport field names per branch (shared with the passport overlay). */
export const PLATE_LABELS = Object.freeze({
  furniture: {
    composition: "Material composition",
    origin: "Wood origin",
    hazards: "Substances in finishes & foam",
    durability: "Durability & spare parts",
    carbon: "Carbon footprint",
    endOfLife: "Disassembly & end of life"
  },
  battery: {
    composition: "Chemistry & raw materials",
    origin: "Supply-chain due diligence",
    hazards: "Hazardous substances",
    durability: "State of health",
    carbon: "Carbon footprint",
    endOfLife: "Recycled content & end of life"
  },
  textile: {
    composition: "Fibre composition",
    origin: "Where each step was made",
    hazards: "Substances of concern",
    durability: "Durability & repair",
    carbon: "Environmental footprint",
    endOfLife: "Recyclability & take-back"
  }
});

/** Lifecycle domains, in travel order; each lists the scenarios whose answers it monitors. */
export const DOMAINS = Object.freeze([
  {
    id: "suppliers",
    title: "Suppliers",
    scenarios: [
      "supplier.depth",
      "supplier.trace",
      "supplier.proof",
      "logistics.change",
      "sourcing.whoasks",
      "sourcing.contract",
      "sourcing.onboarding",
      "sourcing.contractmade",
      "sourcing.irreplaceable",
      "sourcing.substitution"
    ]
  },
  { id: "materials", title: "Materials", scenarios: ["material.composition", "logistics.handoff", "sourcing.com"] },
  { id: "components", title: "Components", scenarios: ["component.bom", "factory.evidence"] },
  { id: "records", title: "Product records", scenarios: ["product.identity", "data.location", "data.owner", "data.retrieval", "sourcing.pdf"] },
  { id: "passport", title: "Passport & customers", scenarios: ["passport.carrier", "sales.landing", "sales.artefact", "sales.certificates", "sales.orders", "sales.reorder"] },
  { id: "nextLife", title: "Next life", scenarios: ["nextLife.continuity"] }
]);

const NODE_LABELS = {
  supplier: "Supplier",
  material: "Material",
  component: "Component",
  product: "Product",
  customer: "Customer",
  nextLife: "Next life"
};

const PLATE_STATUS = { verified: "ok", hairline: "partial", absent: "missing" };
const PLATE_NOTE = { ok: "On file and verifiable", partial: "Claimed, not yet proven", missing: "Missing today" };
const LINK_STATUS = { verified: "ok", connected: "ok", partial: "partial", weak: "missing", broken: "missing", unknown: "missing" };
const LINK_NOTE = {
  verified: "Verified end to end",
  connected: "Connected",
  partial: "Partly connected",
  weak: "Weak — depends on people and paperwork",
  broken: "Broken — information is lost here",
  unknown: "Not covered by your answers"
};
const CAP_OK = 61; // "repeatable" or better (evidence.js bands)
const CAP_PARTIAL = 41;

/** Strength 0–4 → ok / partial / gap (answers the dashboard monitors). */
export function answerStatus(strength) {
  return strength >= 3 ? "ok" : strength === 2 ? "partial" : "gap";
}

function counted(items) {
  const complete = items.filter((i) => i.status === "ok").length;
  const partial = items.filter((i) => i.status === "partial").length;
  const total = items.length;
  return { complete, partial, total, pct: total ? Math.round((complete / total) * 100) : 0 };
}

/**
 * @param {object} state finalized journey (has .result, .capabilities, .history)
 * @param {{ now?: Date }} [opts]
 */
export function buildDashboard(state, opts = {}) {
  const result = state.result;
  if (!result?.journey) throw new Error("buildDashboard needs a finalized journey (finalizeJourney)");
  const branch = state.branch;
  const labels = PLATE_LABELS[branch] || PLATE_LABELS.furniture;

  const passportItems = result.dppPlate.rows.map((r) => {
    const status = PLATE_STATUS[r.status] || "missing";
    return { id: r.id, label: labels[r.id] || r.label, status, note: PLATE_NOTE[status] };
  });
  const linkItems = result.journey.links.map((l) => ({
    id: `${l.from}>${l.to}`,
    label: `${NODE_LABELS[l.from]} → ${NODE_LABELS[l.to]}`,
    status: LINK_STATUS[l.state] || "missing",
    note: LINK_NOTE[l.state] || l.state
  }));
  const capItems = DIMENSION_IDS.map((id) => {
    const cap = state.capabilities?.[id] || {};
    const assessed = (cap.evidence?.length || 0) > 0;
    const score = assessed ? cap.score || 0 : null;
    const status = !assessed ? "missing" : score >= CAP_OK ? "ok" : score >= CAP_PARTIAL ? "partial" : "missing";
    return {
      id,
      label: DIMENSION_META[id]?.label || id,
      status,
      score,
      note: !assessed ? "Not assessed" : status === "ok" ? "Repeatable" : status === "partial" ? "Partial" : "Person-dependent"
    };
  });

  const progress = [
    { id: "passport", title: "Passport data", units: ["field ready", "fields ready"], partialUnit: "claimed", items: passportItems },
    { id: "links", title: "Lifecycle links", units: ["link holds", "links hold"], partialUnit: "partly", items: linkItems },
    { id: "capabilities", title: "Data capabilities", units: ["solid", "solid"], partialUnit: "partial", items: capItems }
  ].map(({ units, partialUnit, ...card }) => {
    const c = counted(card.items);
    return {
      ...card,
      ...c,
      completeLabel: `${c.complete} ${c.complete === 1 ? units[0] : units[1]}`,
      partialLabel: c.partial ? `${c.partial} ${partialUnit}` : ""
    };
  });

  // Context answers sit in no domain; unscored rungs ("it depends", "not sure", "doesn't apply") are not monitored.
  const answers = state.history.filter((h) => !h.flags?.includes("not-applicable"));
  const monitoring = DOMAINS.map((d) => {
    const items = d.scenarios
      .map((id) => answers.find((h) => h.scenarioId === id))
      .filter(Boolean)
      .map((h) => ({ id: h.scenarioId, label: h.fact, answer: h.value, strength: h.strength, status: answerStatus(h.strength) }));
    const ok = items.filter((i) => i.status === "ok").length;
    return { id: d.id, title: d.title, items, ok, needs: items.length - ok, total: items.length,
             pct: items.length ? Math.round((ok / items.length) * 100) : 0 };
  });

  return {
    version: DASHBOARD_VERSION,
    branch,
    answerCount: state.history.length,
    updatedAt: (opts.now || new Date()).toISOString(),
    progress,
    monitoring,
    needsAttention: monitoring.reduce((a, m) => a + m.needs, 0)
  };
}
