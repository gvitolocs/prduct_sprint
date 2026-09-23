/**
 * PRDUCT Data Pathfinder — public API
 * Pure JS engine. No quiz UX; no production UI swap.
 * MODEL_VERSION capability-model-1.1: sector object, motion verbs, dpp plate.
 */

export {
  STRENGTH_BANDS,
  strengthToScore,
  clampStrength,
  scoreToStatus,
  evidenceConfidence,
  blendEvidenceScore,
  isWeakScore,
  isAmbiguousScore,
  isStrongScore
} from "./evidence.js";

export {
  DIMENSION_IDS,
  DIMENSION_META,
  createCapability,
  createCapabilities,
  applyEvidence,
  deriveSignals,
  rankDimensions
} from "./dimensions.js";

export {
  PERSONAS,
  STAGES,
  SPINE_NODES,
  SCENARIOS,
  getScenario,
  getOption,
  valueScenarioIdFor,
  scenarioMatchesPersona
} from "./scenarios.js";

export { nextNodeId, shouldStop, whyNext, resolveCurrent } from "./router.js";

export {
  ASSESSMENT_VERSION,
  MODEL_VERSION,
  createState,
  getSituation,
  answer,
  undo,
  getSignals,
  isComplete,
  toPayload
} from "./model.js";

export { buildLandscape, finalize } from "./landscape.js";

export {
  toCalculatorAnswers,
  timelineBandFromHints,
  maturityFromCapabilities,
  dppImplicationsFromState,
  buildDppPlate,
  DPP_PLATE_ROWS
} from "./calculator-bridge.js";

export {
  SECTOR_OBJECTS,
  OBJECT_STATES,
  MOTION_VERBS,
  advanceObjectState,
  resolveSectorId,
  resolveSectorObject,
  deriveMotion,
  motionHintForScenario,
  normalizeMotion
} from "./sector-object.js";

import { createState, getSituation, answer, isComplete, toPayload } from "./model.js";
import { buildLandscape, finalize } from "./landscape.js";

/**
 * Convenience runner: start → step through answers → landscape.
 * @param {string} persona
 * @param {string[]} optionIds sequential option ids after persona is set
 *   (if persona is provided, perspective is pre-answered)
 */
export function runPath(persona, optionIds = []) {
  let state = createState({ persona });
  const situations = [];
  for (const optionId of optionIds) {
    if (isComplete(state)) break;
    situations.push(getSituation(state));
    state = answer(state, optionId);
  }
  if (!state.result && isComplete(state)) {
    state = finalize(state);
  } else if (!state.result) {
    // Force landscape if caller stopped early but wants a result snapshot
    state = finalize(state);
  }
  return {
    state,
    landscape: state.result,
    situations,
    payload: toPayload(state, state.result)
  };
}

/**
 * Drive until reveal using a chooser function (deterministic if chooser is).
 * @param {string} persona
 * @param {(situation: object, state: object) => string} chooseOptionId
 * @param {number} [maxSteps]
 */
export function walk(persona, chooseOptionId, maxSteps = 12) {
  let state = createState({ persona });
  const log = [];
  for (let i = 0; i < maxSteps; i++) {
    if (isComplete(state)) break;
    const situation = getSituation(state);
    const optionId = chooseOptionId(situation, state);
    log.push({ situation, optionId });
    state = answer(state, optionId);
  }
  if (!state.result) state = finalize(state);
  return { state, landscape: state.result, log };
}
