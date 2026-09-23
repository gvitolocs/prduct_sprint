/**
 * Sector object registry — one interaction object per run.
 * Industry swaps the material metaphor; grammar is the locked object-state
 * sequence: assembled → exploded → boundary → reunited.
 * UIMaster owns craft; this module exposes data contracts only.
 */

/** @typedef {"assembled"|"exploded"|"boundary"|"reunited"} ObjectState */
/** @typedef {"furniture"|"machinery"|"generic"} SectorId */

/** Locked object-state grammar (shared across sectors). */
export const OBJECT_STATES = Object.freeze([
  "assembled",
  "exploded",
  "boundary",
  "reunited"
]);

/**
 * @type {Readonly<Record<SectorId, {
 *   id: SectorId,
 *   metaphor: string,
 *   layers: ReadonlyArray<{ id: string, label: string }>,
 *   grammar: ReadonlyArray<ObjectState>
 * }>>}
 */
export const SECTOR_OBJECTS = Object.freeze({
  furniture: Object.freeze({
    id: "furniture",
    metaphor: "chair-joinery",
    layers: Object.freeze([
      Object.freeze({ id: "seat", label: "Seat / shell" }),
      Object.freeze({ id: "frame", label: "Frame / joinery" }),
      Object.freeze({ id: "fastener", label: "Fastener / edge" }),
      Object.freeze({ id: "finish", label: "Finish / grain" }),
      Object.freeze({ id: "material", label: "Material origin" })
    ]),
    grammar: OBJECT_STATES
  }),
  machinery: Object.freeze({
    id: "machinery",
    metaphor: "battery-layers",
    layers: Object.freeze([
      Object.freeze({ id: "casing", label: "Casing" }),
      Object.freeze({ id: "module", label: "Module / pack" }),
      Object.freeze({ id: "cell", label: "Cell layer" }),
      Object.freeze({ id: "chemistry", label: "Chemistry / material" }),
      Object.freeze({ id: "supplier", label: "Supplier chain" })
    ]),
    grammar: OBJECT_STATES
  }),
  generic: Object.freeze({
    id: "generic",
    metaphor: "product-assembly",
    layers: Object.freeze([
      Object.freeze({ id: "product", label: "Product" }),
      Object.freeze({ id: "component", label: "Component" }),
      Object.freeze({ id: "material", label: "Material" }),
      Object.freeze({ id: "supplier", label: "Supplier" }),
      Object.freeze({ id: "nextLife", label: "Next life" })
    ]),
    grammar: OBJECT_STATES
  })
});

/**
 * Resolve sector id from state hints / captured answers.
 * Prefers explicit sector on state, then calculatorHints.sector,
 * then history entries with setsSector / sector, else generic.
 * @param {object} state
 * @returns {SectorId}
 */
export function resolveSectorId(state) {
  const direct = normalizeSectorId(state?.sector);
  if (direct) return direct;

  const hint = normalizeSectorId(state?.calculatorHints?.sector);
  if (hint) return hint;

  const history = state?.history || [];
  for (let i = history.length - 1; i >= 0; i--) {
    const h = history[i];
    const fromEntry =
      normalizeSectorId(h?.setsSector) || normalizeSectorId(h?.sector);
    if (fromEntry) return fromEntry;
  }

  return "generic";
}

/**
 * @param {unknown} value
 * @returns {SectorId|null}
 */
function normalizeSectorId(value) {
  if (value === "furniture" || value === "machinery" || value === "generic") {
    return value;
  }
  return null;
}

/**
 * Frozen sector-object snapshot for the current run.
 * @param {object} state
 */
export function resolveSectorObject(state) {
  const id = resolveSectorId(state);
  const base = SECTOR_OBJECTS[id] || SECTOR_OBJECTS.generic;
  return Object.freeze({
    id: base.id,
    metaphor: base.metaphor,
    layers: base.layers,
    grammar: base.grammar
  });
}

/**
 * Locked motion verbs (UIMaster contract).
 * @typedef {"join"|"separate"|"connect"|"settle"} MotionVerb
 */
export const MOTION_VERBS = Object.freeze([
  "join",
  "separate",
  "connect",
  "settle"
]);

/**
 * Derive a motion verb when the option does not declare one.
 * @param {object} scenario
 * @param {object} [option]
 * @returns {MotionVerb}
 */
export function deriveMotion(scenario, option) {
  const explicit = normalizeMotion(option?.motion);
  if (explicit) return explicit;

  if (option?.boundary) return "separate";
  if (option?.soft || option?.flags?.includes?.("not-sure")) return "settle";

  const interaction = scenario?.interaction;
  switch (interaction) {
    case "select-persona":
      return "settle";
    case "trace-boundary":
      return "separate";
    case "evidence-boundary":
      return "connect";
    case "clarification":
      return "settle";
    case "select":
    default: {
      const strength = option?.strength;
      if (strength === 0) return "separate";
      if (strength != null && strength >= 3) return "join";
      return "connect";
    }
  }
}

/**
 * @param {unknown} value
 * @returns {MotionVerb|null}
 */
export function normalizeMotion(value) {
  if (
    value === "join" ||
    value === "separate" ||
    value === "connect" ||
    value === "settle"
  ) {
    return value;
  }
  return null;
}

/**
 * Map optionId → motion verb for the current situation.
 * @param {object} scenario
 * @returns {Record<string, MotionVerb>}
 */
export function motionHintForScenario(scenario) {
  /** @type {Record<string, MotionVerb>} */
  const hint = {};
  for (const option of scenario?.options || []) {
    hint[option.id] = deriveMotion(scenario, option);
  }
  return hint;
}

/**
 * Advance locked object-state grammar from a motion verb.
 * Sequence: assembled → exploded → boundary → reunited.
 * @param {ObjectState|null|undefined} current
 * @param {MotionVerb} verb
 * @returns {ObjectState}
 */
export function advanceObjectState(current, verb) {
  const cur =
    current === "assembled" ||
    current === "exploded" ||
    current === "boundary" ||
    current === "reunited"
      ? current
      : "assembled";

  switch (verb) {
    case "separate":
      return cur === "assembled" ? "exploded" : cur === "reunited" ? "exploded" : cur;
    case "connect":
      return cur === "exploded" || cur === "assembled" ? "boundary" : cur;
    case "join":
      return cur === "boundary" || cur === "exploded" ? "reunited" : cur === "assembled" ? "assembled" : "reunited";
    case "settle":
    default:
      return cur;
  }
}

