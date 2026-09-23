/**
 * Adaptive branching / state machine.
 * Journey: perspective → reality → friction → proof → depth → value → horizon → reveal
 */

import {
  getScenario,
  scenarioMatchesPersona,
  valueScenarioIdFor
} from "./scenarios.js";
import { deriveSignals } from "./dimensions.js";
import {
  isAmbiguousScore,
  isStrongScore,
  isWeakScore
} from "./evidence.js";

const MIN_INTERACTIONS = 7;
const MAX_INTERACTIONS = 12;
const USUAL_MAX = 10;

/**
 * Default stage order (node ids), with optional inserts from flags.
 * @param {object} state
 * @returns {string}
 */
export function nextNodeId(state) {
  if (state.result) return "reveal.landscape";

  const persona = state.persona;
  const historyIds = new Set(state.history.map((h) => h.scenarioId));
  const caps = state.capabilities;
  const signals = deriveSignals(caps);
  const last = state.history[state.history.length - 1];
  const flags = collectFlags(state);
  const steps = state.history.length;

  // Adaptive stop
  if (shouldStop(state, signals, steps)) {
    return "reveal.landscape";
  }

  const plan = buildPlan(persona, flags, signals, caps, historyIds, last);

  for (const id of plan) {
    if (historyIds.has(id)) continue;
    const scenario = getScenario(id);
    if (!scenarioMatchesPersona(scenario, persona || "*")) continue;
    return id;
  }

  if (!historyIds.has("horizon.dpp")) return "horizon.dpp";
  if (!historyIds.has("horizon.unlock") && steps < MAX_INTERACTIONS) {
    return "horizon.unlock";
  }
  return "reveal.landscape";
}

/**
 * Ordered candidate nodes based on routing rules.
 */
function buildPlan(persona, flags, signals, caps, historyIds, last) {
  const plan = [];

  // 1. Perspective
  plan.push("perspective.select");

  // 2. Reality
  plan.push("reality.product-context");
  plan.push("reality.location");

  // 3. Friction — persona opening emphasis
  if (persona === "procurement") {
    plan.push("friction.supplier");
    plan.push("friction.retrieval");
  } else if (persona === "leadership" || persona === "cross") {
    plan.push("friction.retrieval");
    plan.push("friction.collaboration");
  } else if (persona === "sales") {
    plan.push("friction.retrieval");
  } else {
    plan.push("friction.retrieval");
    if (persona === "service" || persona === "product") {
      plan.push("friction.collaboration");
    }
  }

  // Rule 7: supplier dependency → supplier quality before more internal systems
  if (
    flags.has("supplier-dependency") &&
    !historyIds.has("friction.supplier")
  ) {
    insertAfter(plan, "friction.retrieval", "friction.supplier");
    if (!plan.includes("friction.supplier")) plan.push("friction.supplier");
  }

  // Rule 4: weak → source-of-friction follow-up (clarification or supplier)
  if (flags.has("source-of-friction") || weakPrimary(caps)) {
    if (!historyIds.has("friction.clarification")) {
      plan.push("friction.clarification");
    }
  }

  // Rule 5: ambiguous → one clarification
  if (
    flags.has("needs-clarification") &&
    !historyIds.has("friction.clarification")
  ) {
    plan.push("friction.clarification");
  }

  // 4. Proof
  if (persona === "sales") {
    plan.push("proof.sales-origin");
    plan.push("proof.request");
  } else if (persona === "sustainability") {
    plan.push("proof.request");
  } else {
    plan.push("proof.request");
    if (persona === "leadership" || persona === "cross") {
      plan.push("proof.sales-origin");
    }
  }

  // Rule 6: proof claimed but low confidence → verification follow-up
  if (flags.has("proof-claimed")) {
    const vt = caps.verificationTrust;
    if (
      vt &&
      (vt.confidence === "low" || isAmbiguousScore(vt.score) || isStrongScore(vt.score) && vt.confidence !== "high")
    ) {
      plan.push("proof.verification");
    }
  }

  // 5. Depth
  plan.push("depth.trace-back");
  if (
    persona === "service" ||
    persona === "leadership" ||
    persona === "cross" ||
    persona === "product" ||
    persona === "sustainability" ||
    flags.has("lifecycle-gap")
  ) {
    plan.push("depth.trace-forward");
  }

  // 6. Value (persona-specific)
  plan.push(valueScenarioIdFor(persona || "leadership"));

  // Rule 8: activation gap → already on value; ensure value node present
  // Rule 9: governance gap → collaboration if not asked
  if (
    (signals.governanceGap || flags.has("governance-gap")) &&
    !historyIds.has("friction.collaboration")
  ) {
    insertBefore(plan, valueScenarioIdFor(persona || "leadership"), "friction.collaboration");
  }

  // 7. Horizon (DPP only here)
  plan.push("horizon.dpp");
  plan.push("horizon.unlock");

  return plan;
}

function weakPrimary(caps) {
  const ir = caps.informationRetrieval?.score ?? 0;
  const sd = caps.supplierDataQuality?.score ?? 0;
  return isWeakScore(ir) || isWeakScore(sd);
}

function collectFlags(state) {
  const flags = new Set();
  for (const h of state.history) {
    for (const f of h.flags || []) flags.add(f);
  }
  return flags;
}

/**
 * Stop when high confidence in top 2 strengths + top 2 gaps + ≥1 opportunity,
 * after usual length, or always at MAX.
 */
export function shouldStop(state, signals, steps) {
  if (steps >= MAX_INTERACTIONS) return true;
  if (steps < MIN_INTERACTIONS) return false;

  const rankedDesc = rank(state.capabilities, "desc");
  const rankedAsc = rank(state.capabilities, "asc");
  const topStrengths = rankedDesc.slice(0, 2);
  const topGaps = rankedAsc.slice(0, 2);
  const strengthsOk = topStrengths.every(
    (d) => d.confidence !== "low" && d.score >= 41
  );
  const gapsOk = topGaps.every((d) => d.confidence !== "low");
  const opportunity =
    state.openQuestions?.some((q) => q.type === "opportunity") ||
    state.history.some((h) => h.opportunity) ||
    signals.activationGap ||
    signals.lifecycleGap ||
    signals.supplierDependency;

  const hitHorizon = state.history.some((h) => h.stage === "horizon");

  if (steps >= USUAL_MAX && hitHorizon) return true;
  if (strengthsOk && gapsOk && opportunity && hitHorizon) return true;
  return false;
}

function rank(capabilities, order) {
  return Object.entries(capabilities)
    .map(([id, c]) => ({
      id,
      score: c.score,
      confidence: c.confidence
    }))
    .sort((a, b) => (order === "asc" ? a.score - b.score : b.score - a.score));
}

function insertAfter(plan, afterId, newId) {
  const i = plan.indexOf(afterId);
  if (i === -1) return;
  if (plan.includes(newId)) return;
  plan.splice(i + 1, 0, newId);
}

function insertBefore(plan, beforeId, newId) {
  const i = plan.indexOf(beforeId);
  if (plan.includes(newId)) return;
  if (i === -1) {
    plan.push(newId);
    return;
  }
  plan.splice(i, 0, newId);
}

/**
 * Human-readable reason for the next branch (optional UI line).
 * @param {object} state
 * @param {string} nextId
 */
export function whyNext(state, nextId) {
  const flags = collectFlags(state);
  if (nextId === "friction.supplier" && flags.has("supplier-dependency")) {
    return "That points to the supplier boundary. Let’s follow it one step further.";
  }
  if (nextId === "friction.clarification") {
    return "That path looks uneven. One clarification about coverage helps.";
  }
  if (nextId === "proof.verification") {
    return "Proof was claimed — let’s check how it stays current.";
  }
  if (nextId === "friction.collaboration") {
    return "Ownership looks unclear. Let’s see how departments hand off.";
  }
  if (nextId?.startsWith("value.")) {
    return "Now the value of making this reliable from your seat.";
  }
  if (nextId === "horizon.dpp") {
    return "If every product needed a passport tomorrow, where would you start?";
  }
  if (nextId === "reveal.landscape") {
    return "This is the shape of your product data today.";
  }
  return null;
}

/**
 * Present the next scenario object for the UI/engine consumer.
 * @param {object} state
 */
export function resolveCurrent(state) {
  const id = state.currentNode;
  if (id === "reveal.landscape") {
    return {
      id: "reveal.landscape",
      stage: "reveal",
      prompt: "This is the shape of your product data today.",
      interaction: "landscape",
      options: []
    };
  }
  return getScenario(id);
}
