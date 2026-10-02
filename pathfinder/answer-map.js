/**
 * Answer map — the journey's end pane without a score.
 *
 * The company's own answers, placed where they sit on the lifecycle
 * (supplier → material → component → product → customer → next life), plus where information
 * first gets lost. Qualitative only: every item is an answer the respondent chose, in their words;
 * the node and link marks use the same strength ladder as the options, from scored answers only —
 * unscored rungs ("it depends", "not sure", "doesn't apply") are shown but never pull a mark up or down.
 * No percentages, scores, field counts or timelines: those wait for a declared weight table
 * (see pathfinder/dashboard.js). Pure functions over the finalized journey state; no DOM.
 */

import { getJourneyScenario, answersState, isScored, CONTEXT_SCENARIO_IDS } from "./lifecycle.js";

export const ANSWER_MAP_VERSION = "answer-map-1.2";

/** Lifecycle nodes, in travel order; each lists the scenarios whose answers it shows. */
export const LIFECYCLE_NODES = Object.freeze([
  {
    id: "supplier",
    label: "Supplier",
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
  { id: "material", label: "Material", scenarios: ["material.composition", "logistics.handoff", "sourcing.com"] },
  { id: "component", label: "Component", scenarios: ["component.bom", "factory.evidence"] },
  { id: "product", label: "Product", scenarios: ["product.identity", "data.location", "data.owner", "data.retrieval", "sourcing.pdf"] },
  {
    id: "customer",
    label: "Customer",
    scenarios: ["passport.carrier", "sales.landing", "sales.artefact", "sales.certificates", "sales.orders", "sales.reorder"]
  },
  { id: "nextLife", label: "Next life", scenarios: ["nextLife.continuity"] }
]);

/**
 * Free advice under `sourcing.contract` when the answer is `varies` or below (review item 16): a documentation
 * line in the standard purchase-order terms reaches every supplier at the next order, with no system.
 */
export const PO_TERMS_ADVICE =
  "A documentation line in your standard purchase-order terms reaches every supplier at the next order. No system needed.";

/** Context answers (seat, channel, EUDR role, sales volume and hours, sourcing.topten, priority): shown, never on the lifecycle. */
export const CONTEXT_SCENARIOS = CONTEXT_SCENARIO_IDS;

export const STATE_LABELS = Object.freeze({
  verified: "Holds",
  connected: "Holds",
  partial: "Partly",
  weak: "Weak",
  broken: "Broken",
  open: "Open",
  unknown: "Not covered"
});

/** One answer's mark: holds (3–4), partly (2), gap (0–1) when scored; else its rung (depends / unsure / n/a). */
export function answerMark(entry) {
  if (!isScored(entry)) return entry.rung || "depends";
  return entry.strength >= 3 ? "holds" : entry.strength === 2 ? "partly" : "gap";
}

function wording(value, branch) {
  if (value == null || typeof value === "string") return value ?? "";
  return value[branch] ?? value.furniture ?? Object.values(value)[0];
}

/**
 * @param {object} state finalized journey (has .result.journey and .history)
 */
export function buildAnswerMap(state) {
  const j = state.result?.journey;
  if (!j) throw new Error("buildAnswerMap needs a finalized journey (finalizeJourney)");
  const branch = state.branch;
  const byId = new Map(state.history.map((h) => [h.scenarioId, h]));
  const labelOf = Object.fromEntries(LIFECYCLE_NODES.map((n) => [n.id, n.label]));
  const value = (id) => byId.get(id)?.value ?? null;
  const fact = (id) => byId.get(id)?.fact ?? null;
  const scoredFact = (id) => (isScored(byId.get(id) || {}) ? fact(id) : null);
  // Free advice under `sourcing.contract` when the answer is `varies` or below (review item 16).
  const contract = byId.get("sourcing.contract");
  const contractAdvice =
    !!contract && (contract.rung === "depends" || (isScored(contract) && contract.strength <= 2));

  const nodes = LIFECYCLE_NODES.map((n) => {
    const entries = n.scenarios.map((id) => byId.get(id)).filter(Boolean);
    const st = answersState(entries);
    return {
      id: n.id,
      label: n.label,
      state: st,
      stateLabel: STATE_LABELS[st],
      items: entries.map((e) => {
        const sc = getJourneyScenario(e.scenarioId);
        const opt = sc.options.find((x) => x.id === e.optionId) || {};
        return {
          scenarioId: e.scenarioId,
          question: wording(sc.prompt, branch),
          answer: e.value,
          mark: answerMark(e),
          varies: !!opt.varies,
          // The free advice sits under the contract answer that earns it (item 16).
          note: e.scenarioId === "sourcing.contract" && contractAdvice ? (e.note || PO_TERMS_ADVICE) : e.note || null,
          module: sc.module || null
        };
      })
    };
  });

  const links = j.links.map((l) => ({
    from: l.from,
    to: l.to,
    state: l.state,
    stateLabel: STATE_LABELS[l.state] || l.state
  }));
  const first = links.find((l) => l.state === "weak" || l.state === "broken") || null;
  const role = byId.get("supplier.role");
  const sales = byId.has("sales.landing") || byId.has("sales.artefact");
  const purch = byId.has("sourcing.contract") || byId.has("sourcing.irreplaceable");

  return {
    version: ANSWER_MAP_VERSION,
    branch,
    persona: j.personaLabel || null,
    channel: fact("sales.channel"),
    priority: value("nextLife.unlock"),
    eudrRole: role ? role.optionId : null,
    eudrAnswer: role ? role.value : null,
    contractAdvice,
    // The sales module, in the respondent's own words (echoed, never priced; sales.unbid stays for the call).
    sales: sales
      ? {
          landing: scoredFact("sales.landing"),
          artefact: scoredFact("sales.artefact"),
          volume: value("sales.volume"),
          hours: value("sales.hours")
        }
      : null,
    // The purchasing module likewise: what the supply base can deliver today, in the respondent's words.
    purchasing: purch
      ? {
          topten: value("sourcing.topten"),
          whoasks: scoredFact("sourcing.whoasks"),
          irreplaceable: scoredFact("sourcing.irreplaceable")
        }
      : null,
    home: j.home ? j.home.label : null,
    nodes,
    links,
    firstBreak: first ? { from: first.from, to: first.to, fromLabel: labelOf[first.from], toLabel: labelOf[first.to] } : null
  };
}
