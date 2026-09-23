/**
 * Map Pathfinder evidence → calculator-compatible inputs for timeline comparison.
 * Preserves diagnostic signals from the linear quiz calculator without quiz UX.
 */

/**
 * Inverse of protokol-style score bands used in app.js.
 * Timeline uses average of companySize, productComplexity, portfolio,
 * dataAvailability, dataSharing (each typically 6–24).
 */

const DEFAULT_HINTS = {
  companySize: 12,
  portfolio: 12,
  productComplexity: 12,
  dataAvailability: 12,
  dataSharing: 12,
  tiers: 14,
  contracts: 14,
  certification: 14,
  hazardous: 14,
  ownership: 14,
  commercialIntent: 12,
  trustLikert: 12
};

/**
 * Build answer-shaped object compatible with protokolTimeline / dimensions / dppGaps.
 * @param {object} state
 */
export function toCalculatorAnswers(state) {
  const hints = { ...DEFAULT_HINTS, ...(state.calculatorHints || {}) };
  const caps = state.capabilities || {};

  // Fill gaps from capability scores when hint missing
  const answers = {
    companySize: pack("companySize", hints.companySize, null),
    portfolio: pack("portfolio", hints.portfolio, null),
    productComplexity: pack("productComplexity", hints.productComplexity, null),
    dataAvailability: pack(
      "dataAvailability",
      hints.dataAvailability,
      scoreToDim(caps.dataStructure?.score)
    ),
    dataSharing: pack(
      "dataSharing",
      hints.dataSharing,
      scoreToDim(caps.supplierDataQuality?.score)
    ),
    tiers: pack(
      "tiers",
      hints.tiers,
      scoreToDim(caps.traceabilityDepth?.score)
    ),
    contracts: pack(
      "contracts",
      hints.contracts,
      scoreToDim(caps.supplierDataQuality?.score)
    ),
    certification: pack(
      "certification",
      hints.certification,
      scoreToDim(caps.verificationTrust?.score)
    ),
    hazardous: pack(
      "hazardous",
      hints.hazardous,
      scoreToDim(caps.regulatoryReadiness?.score)
    ),
    ownership: pack(
      "ownership",
      hints.ownership,
      scoreToDim(caps.ownership?.score)
    ),
    commercialIntent: pack(
      "commercialIntent",
      hints.commercialIntent,
      scoreToDim(caps.commercialUse?.score)
    ),
    trustLikert: pack(
      "trustLikert",
      hints.trustLikert,
      scoreToDim(caps.verificationTrust?.score)
    )
  };

  return answers;
}

function pack(id, score, dim) {
  const s = score ?? 12;
  // For timeline keys, lower score = faster/better readiness (app.js convention)
  const d =
    dim != null
      ? dim
      : Math.max(5, Math.min(95, Math.round(100 - Math.min(90, s * 3))));
  return { label: id, score: s, dim: d };
}

/** Map 0–100 capability score → quiz-style dim 0–100. */
function scoreToDim(score) {
  if (score == null || score === 0) return 40;
  return Math.max(5, Math.min(95, Math.round(score)));
}

/**
 * Mirror app.js protokolTimeline using calculator answers / hints.
 * @param {Record<string, number>} hints
 * @param {ReturnType<typeof toCalculatorAnswers>} [answers]
 */
export function timelineBandFromHints(hints, answers) {
  const a = answers || toCalculatorAnswers({ calculatorHints: hints, capabilities: {} });
  const keys = [
    "companySize",
    "productComplexity",
    "portfolio",
    "dataAvailability",
    "dataSharing"
  ];
  const scores = keys.map((k) => (a[k] && a[k].score) || 12);
  const averageScore = scores.reduce((x, y) => x + y, 0) / 5;
  let min = 6;
  let max = 6;
  if (averageScore <= 7) {
    min = 6;
    max = 6;
  } else if (averageScore <= 10) {
    min = 6;
    max = 12;
  } else if (averageScore <= 15) {
    min = 12;
    max = 18;
  } else if (averageScore <= 21) {
    min = 18;
    max = 24;
  } else {
    min = 24;
    max = 30;
  }
  const mid = Math.round((min + max) / 2);
  const display = min === max ? `${min} months` : `${min}–${max} months`;
  return { min, max, avg: mid, display, averageScore };
}

/**
 * Internal weighted maturity 0–100 from capabilities (not shown as a grade).
 * @param {Record<string, {score:number}>} capabilities
 */
export function maturityFromCapabilities(capabilities) {
  const weights = {
    traceabilityDepth: 1.2,
    informationRetrieval: 1.1,
    supplierDataQuality: 1.2,
    verificationTrust: 1.1,
    dataStructure: 1.1,
    dppAvailability: 1.0,
    ownership: 0.9,
    collaboration: 0.8,
    commercialUse: 0.8,
    salesEnablement: 0.7,
    operationalFriction: 0.9,
    lifecycleCapability: 0.8,
    regulatoryReadiness: 1.0
  };
  let wSum = 0;
  let sSum = 0;
  for (const [id, w] of Object.entries(weights)) {
    const score = capabilities[id]?.score ?? 0;
    // Only count dimensions that have been evidenced; unknowns weigh lightly
    const evidenced = (capabilities[id]?.evidence?.length || 0) > 0;
    const ww = evidenced ? w : w * 0.25;
    wSum += ww;
    sSum += score * ww;
  }
  if (!wSum) return 0;
  return Math.round(sSum / wSum);
}

/**
 * DPP field readiness derived from Pathfinder state (calculator-compatible gaps).
 * @param {object} state
 */
export function dppImplicationsFromState(state) {
  const answers = toCalculatorAnswers(state);
  const caps = state.capabilities;
  const fields = [
    {
      id: "composition",
      label: "Composition",
      ready:
        (caps.dataStructure?.score || 0) >= 50 &&
        (answers.productComplexity?.score || 24) <= 12
    },
    {
      id: "wood",
      label: "Wood sourcing",
      ready:
        (caps.verificationTrust?.score || 0) >= 60 &&
        (caps.traceabilityDepth?.score || 0) >= 50
    },
    {
      id: "hazard",
      label: "Hazardous substances",
      ready: (caps.regulatoryReadiness?.score || 0) >= 55
    },
    {
      id: "durability",
      label: "Durability & repair",
      ready:
        (caps.lifecycleCapability?.score || 0) >= 50 ||
        (caps.dataStructure?.score || 0) >= 70
    },
    {
      id: "carbon",
      label: "Carbon footprint",
      ready:
        (caps.supplierDataQuality?.score || 0) >= 60 &&
        (caps.traceabilityDepth?.score || 0) >= 50
    },
    {
      id: "eol",
      label: "End-of-life",
      ready:
        (caps.lifecycleCapability?.score || 0) >= 50 &&
        (caps.commercialUse?.score || 0) >= 40
    }
  ];

  const readyFields = fields.filter((f) => f.ready).map((f) => f.id);
  const exposedGaps = fields.filter((f) => !f.ready).map((f) => f.id);

  return {
    readyFields,
    exposedGaps,
    fields,
    caveat:
      "A readiness signal is not legal advice or certification. Prduct uses it to prioritize the next reliable layer."
  };
}
