/**
 * Company / respondent state update API.
 * Pure functions; no DOM.
 */

import { createCapabilities, applyEvidence, deriveSignals } from "./dimensions.js";
import { SPINE_NODES, getScenario, getOption, PERSONAS } from "./scenarios.js";
import { nextNodeId, whyNext, resolveCurrent } from "./router.js";
import { clampStrength } from "./evidence.js";
import {
  resolveSectorObject,
  deriveMotion,
  motionHintForScenario,
  advanceObjectState
} from "./sector-object.js";

export const ASSESSMENT_VERSION = "pathfinder-0.1";
export const MODEL_VERSION = "capability-model-1.1"; // sector object, motion verbs, dpp plate

function spineNode(state = "latent") {
  return { state, evidence: [] };
}

function createSpine() {
  /** @type {Record<string, {state:string, evidence:string[]}>} */
  const spine = {};
  for (const id of SPINE_NODES) spine[id] = spineNode("latent");
  return spine;
}

/**
 * Fresh Pathfinder state. Persona may be null until perspective.select.
 * @param {{ persona?: string|null }} [opts]
 */
export function createState(opts = {}) {
  const persona = opts.persona ?? null;
  const sector = opts.sector ?? null;
  const calculatorHints = {
    ...(opts.calculatorHints || {}),
    ...(sector ? { sector } : {})
  };
  const state = {
    assessmentVersion: ASSESSMENT_VERSION,
    modelVersion: MODEL_VERSION,
    persona,
    sector: sector || null,
    stage: "perspective",
    currentNode: "perspective.select",
    history: [],
    capabilities: createCapabilities(),
    spine: createSpine(),
    openQuestions: [],
    skippedQuestions: [],
    confidence: 0,
    calculatorHints,
    flags: [],
    whyThisNext: null,
    result: null,
    lastMotion: null,
    motions: [],
    sectorObject: null,
    objectState: "assembled"
  };
  state.sectorObject = resolveSectorObject(state);
  if (persona) {
    // Skip perspective if persona pre-selected
    state.currentNode = nextNodeId({
      ...state,
      history: [
        {
          scenarioId: "perspective.select",
          optionId: persona,
          stage: "perspective",
          flags: []
        }
      ]
    });
    state.history = [
      {
        scenarioId: "perspective.select",
        optionId: persona,
        stage: "perspective",
        value: PERSONAS[persona]?.label || persona,
        strength: 2,
        flags: [],
        at: 0
      }
    ];
    // Pre-selected persona settles perspective without a UI answer call
    state.lastMotion = {
      verb: "settle",
      at: "perspective.select",
      optionId: persona
    };
    state.motions = [state.lastMotion];
    state.objectState = advanceObjectState(state.objectState, "settle");
    state.stage = getScenario(state.currentNode).stage;
  }
  return state;
}

/**
 * Current situation for the respondent (never "Question N of M").
 * @param {object} state
 */
export function getSituation(state) {
  const scenario = resolveCurrent(state);
  const motionHint = motionHintForScenario(scenario);
  return {
    id: scenario.id,
    stage: scenario.stage,
    prompt: scenario.prompt,
    detail: scenario.detail || null,
    interaction: scenario.interaction,
    options: (scenario.options || []).map((o) => ({
      id: o.id,
      label: o.label,
      soft: !!o.soft,
      motion: motionHint[o.id]
    })),
    motionHint,
    sectorObject: state.sectorObject,
    objectState: state.objectState,
    whyThisNext: state.whyThisNext,
    persona: state.persona,
    progressHint: null // intentionally no Question N of M
  };
}

/**
 * Apply an answer and advance the router.
 * @param {object} state
 * @param {string} optionId
 */
export function answer(state, optionId) {
  if (state.result) return state;

  if (state.currentNode === "reveal.landscape") {
    return state;
  }

  const scenario = getScenario(state.currentNode);
  const option = getOption(scenario, optionId);

  let next = { ...state };
  next.history = [
    ...state.history,
    {
      scenarioId: scenario.id,
      optionId: option.id,
      stage: scenario.stage,
      value: option.label,
      strength: clampStrength(option.strength),
      flags: option.flags ? [...option.flags] : [],
      opportunity: option.opportunity || null,
      boundary: option.boundary || null,
      at: state.history.length
    }
  ];

  // Persona selection
  if (option.setsPersona) {
    next.persona = option.setsPersona;
  }

  // Sector selection (furniture / machinery / generic)
  if (option.setsSector || option.sector) {
    next.sector = option.setsSector || option.sector;
    next.calculatorHints = {
      ...state.calculatorHints,
      sector: next.sector
    };
  }

  // Calculator-compatible hints
  if (option.calculator) {
    next.calculatorHints = {
      ...next.calculatorHints,
      ...option.calculator
    };
  }
  if (option.calculatorHints) {
    next.calculatorHints = {
      ...next.calculatorHints,
      ...option.calculatorHints
    };
  }

  // One motion verb per answer (join | separate | connect | settle)
  const verb = deriveMotion(scenario, option);
  const motionEntry = {
    verb,
    at: scenario.id,
    optionId: option.id
  };
  next.lastMotion = motionEntry;
  next.motions = [...(state.motions || []), motionEntry];
  next.objectState = advanceObjectState(state.objectState, verb);

  // Freeze sector object snapshot for the run
  next.sectorObject = resolveSectorObject(next);

  // Also record setsSector on history for replay/resolve
  if (option.setsSector || option.sector) {
    next.history = next.history.map((h, i) =>
      i === next.history.length - 1
        ? { ...h, setsSector: option.setsSector || option.sector }
        : h
    );
  }

  // Write evidence to captured dimensions
  next.capabilities = { ...state.capabilities };
  const captures = scenario.captures || [];
  for (const dimId of captures) {
    if (!next.capabilities[dimId]) continue;
    next.capabilities[dimId] = applyEvidence(next.capabilities[dimId], {
      scenarioId: scenario.id,
      value: option.label,
      strength: clampStrength(option.strength),
      dependencies: option.dependencies
    });
  }

  // Soft "not sure" lowers confidence without pretending weakness beyond strength
  if (option.flags?.includes("not-sure")) {
    for (const dimId of captures) {
      const cap = next.capabilities[dimId];
      if (cap && cap.confidence === "high") {
        next.capabilities[dimId] = { ...cap, confidence: "medium" };
      }
    }
  }

  // Spine updates
  next.spine = updateSpine(state.spine, scenario, option);

  // Opportunity open questions
  if (option.opportunity) {
    next.openQuestions = [
      ...state.openQuestions,
      { type: "opportunity", id: option.opportunity, from: scenario.id }
    ];
  }
  if (option.priorityDim) {
    next.openQuestions = [
      ...next.openQuestions,
      { type: "priority", id: option.priorityDim, from: scenario.id }
    ];
  }

  next.confidence = overallConfidence(next.capabilities);
  next.flags = uniqueFlags(next.history);

  // Advance
  const advanceState = { ...next, result: null };
  const nextId = nextNodeId(advanceState);
  next.whyThisNext = whyNext(advanceState, nextId);
  next.currentNode = nextId;

  if (nextId === "reveal.landscape") {
    next.stage = "reveal";
  } else {
    next.stage = getScenario(nextId).stage;
  }

  // Mark skipped planned basics when high confidence
  next = recordSkips(next);

  return next;
}

/**
 * Peek derived signals without mutating.
 * @param {object} state
 */
export function getSignals(state) {
  return deriveSignals(state.capabilities);
}

/**
 * Whether the journey has reached the landscape reveal.
 * @param {object} state
 */
export function isComplete(state) {
  return state.currentNode === "reveal.landscape" || state.result != null;
}

function updateSpine(spine, scenario, option) {
  const next = {};
  for (const id of SPINE_NODES) {
    next[id] = {
      state: spine[id].state,
      evidence: [...spine[id].evidence]
    };
  }
  const touch = scenario.spineTouch || [];
  for (const id of touch) {
    if (!next[id]) continue;
    const strength = clampStrength(option.strength);
    if (strength >= 4) next[id].state = "verified";
    else if (strength >= 3) next[id].state = "connected";
    else if (strength >= 2) next[id].state = "evidenced";
    else if (strength === 1) next[id].state = "uncertain";
    else next[id].state = "fractured";
    next[id].evidence.push(scenario.id);
  }
  // Always mark product visited once reality starts
  if (scenario.stage !== "perspective" && next.product.state === "latent") {
    next.product.state = "visited";
  }
  return next;
}

function overallConfidence(capabilities) {
  const vals = Object.values(capabilities);
  const withEvidence = vals.filter((c) => c.evidence.length > 0);
  if (!withEvidence.length) return 0;
  const score =
    withEvidence.reduce((a, c) => {
      const w = c.confidence === "high" ? 1 : c.confidence === "medium" ? 0.6 : 0.3;
      return a + w;
    }, 0) / withEvidence.length;
  return Math.round(score * 100) / 100;
}

function uniqueFlags(history) {
  const s = new Set();
  for (const h of history) for (const f of h.flags || []) s.add(f);
  return [...s];
}

function recordSkips(state) {
  // High-confidence retrieval skips clarification if never needed
  const ir = state.capabilities.informationRetrieval;
  const skipped = [...state.skippedQuestions];
  if (
    ir?.confidence === "high" &&
    ir.score > 60 &&
    !state.history.some((h) => h.scenarioId === "friction.clarification") &&
    !skipped.includes("friction.clarification")
  ) {
    // Only record skip once we've moved past friction
    if (["proof", "depth", "value", "horizon", "reveal"].includes(state.stage)) {
      skipped.push("friction.clarification");
    }
  }
  return { ...state, skippedQuestions: skipped };
}

/**
 * Safe back: drop the last history entry and rebuild state by replaying
 * remaining answers. Does not mutate evidence in place.
 * @param {object} state
 */
export function undo(state) {
  if (!state?.history?.length) return state;
  const remaining = state.history.slice(0, -1);
  let next = createState();
  for (const entry of remaining) {
    if (isComplete(next)) break;
    next = answer(next, entry.optionId);
  }
  return next;
}

/**
 * Versioned payload for persistence / submission.
 * @param {object} state
 * @param {object|null} result
 * @param {object} [lead]
 */
export function toPayload(state, result = null, lead = {}) {
  return {
    assessmentVersion: state.assessmentVersion,
    modelVersion: state.modelVersion,
    persona: state.persona,
    sector: state.sector,
    sectorObject: state.sectorObject,
    history: state.history,
    capabilities: state.capabilities,
    spine: state.spine,
    motions: state.motions,
    lastMotion: state.lastMotion,
    objectState: state.objectState,
    result: result || state.result,
    lead,
    calculatorHints: state.calculatorHints
  };
}
