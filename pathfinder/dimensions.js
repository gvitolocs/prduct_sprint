/**
 * Canonical capability model — 13 dimensions.
 */

import {
  blendEvidenceScore,
  evidenceConfidence,
  scoreToStatus
} from "./evidence.js";

export const DIMENSION_IDS = Object.freeze([
  "traceabilityDepth",
  "informationRetrieval",
  "supplierDataQuality",
  "verificationTrust",
  "dataStructure",
  "dppAvailability",
  "ownership",
  "collaboration",
  "commercialUse",
  "salesEnablement",
  "operationalFriction",
  "lifecycleCapability",
  "regulatoryReadiness"
]);

export const DIMENSION_META = Object.freeze({
  traceabilityDepth: {
    label: "Traceability depth",
    defaultDeps: ["supplier-data"]
  },
  informationRetrieval: {
    label: "Information retrieval",
    defaultDeps: ["data-structure"]
  },
  supplierDataQuality: {
    label: "Supplier data quality",
    defaultDeps: ["supplier-data"]
  },
  verificationTrust: {
    label: "Verification / trust",
    defaultDeps: []
  },
  dataStructure: {
    label: "Data structure and system integration",
    defaultDeps: []
  },
  dppAvailability: {
    label: "DPP data availability",
    defaultDeps: ["traceability", "verification"]
  },
  ownership: {
    label: "Organisational ownership",
    defaultDeps: []
  },
  collaboration: {
    label: "Cross-functional collaboration",
    defaultDeps: ["ownership"]
  },
  commercialUse: {
    label: "Commercial use of product data",
    defaultDeps: []
  },
  salesEnablement: {
    label: "Sales enablement",
    defaultDeps: ["information-retrieval", "verification"]
  },
  operationalFriction: {
    label: "Operational friction",
    defaultDeps: ["information-retrieval"]
  },
  lifecycleCapability: {
    label: "After-sales / lifecycle capability",
    defaultDeps: ["traceability"]
  },
  regulatoryReadiness: {
    label: "Regulatory readiness",
    defaultDeps: ["verification", "dpp"]
  }
});

/**
 * @returns {{
 *   score: number,
 *   confidence: "low"|"medium"|"high",
 *   evidence: Array<{scenarioId:string,value:string,strength:number}>,
 *   dependencies: string[],
 *   status: string
 * }}
 */
export function createCapability(overrides = {}) {
  const id = overrides.id;
  const meta = id && DIMENSION_META[id] ? DIMENSION_META[id] : null;
  return {
    score: 0,
    confidence: "low",
    evidence: [],
    dependencies: meta ? [...meta.defaultDeps] : [],
    status: "unknown",
    ...overrides,
    evidence: overrides.evidence ? [...overrides.evidence] : [],
    dependencies: overrides.dependencies
      ? [...overrides.dependencies]
      : meta
        ? [...meta.defaultDeps]
        : []
  };
}

/** Fresh map of all 13 capabilities. */
export function createCapabilities() {
  /** @type {Record<string, ReturnType<typeof createCapability>>} */
  const caps = {};
  for (const id of DIMENSION_IDS) {
    caps[id] = createCapability({ id });
  }
  return caps;
}

/**
 * Append evidence and recompute score / confidence / status.
 * @param {ReturnType<typeof createCapability>} capability
 * @param {{ scenarioId: string, value: string, strength: number, dependencies?: string[] }} entry
 */
export function applyEvidence(capability, entry) {
  const next = {
    ...capability,
    evidence: [
      ...capability.evidence,
      {
        scenarioId: entry.scenarioId,
        value: entry.value,
        strength: entry.strength
      }
    ],
    dependencies: entry.dependencies
      ? unique([...capability.dependencies, ...entry.dependencies])
      : [...capability.dependencies]
  };
  next.score = blendEvidenceScore(next.evidence);
  next.confidence = evidenceConfidence(next.evidence);
  next.status = scoreToStatus(next.score);
  return next;
}

/**
 * Derived signals from the capability map (spec §1).
 * @param {Record<string, ReturnType<typeof createCapability>>} capabilities
 */
export function deriveSignals(capabilities) {
  const g = (id) => capabilities[id]?.score ?? 0;
  const c = (id) => capabilities[id]?.confidence ?? "low";

  const retrievalReliability = average([g("informationRetrieval"), g("dataStructure")]);
  const trustworthyPassportBase = average([
    g("traceabilityDepth"),
    g("verificationTrust"),
    g("dppAvailability")
  ]);

  const dataHigh =
    average([
      g("dataStructure"),
      g("informationRetrieval"),
      g("traceabilityDepth"),
      g("verificationTrust")
    ]) >= 61;
  const commercialLow =
    average([g("commercialUse"), g("salesEnablement")]) < 41;
  const ownershipLow = average([g("ownership"), g("collaboration")]) < 41;
  const supplierWeak =
    g("supplierDataQuality") < 41 &&
    (g("traceabilityDepth") < 41 || c("traceabilityDepth") === "low");
  const lifecycleGap =
    average([g("dataStructure"), g("informationRetrieval")]) >= 50 &&
    g("lifecycleCapability") < 41;

  return {
    retrievalReliability,
    trustworthyPassportBase,
    activationGap: dataHigh && commercialLow,
    governanceGap: dataHigh && ownershipLow,
    supplierDependency: supplierWeak,
    lifecycleGap
  };
}

function average(nums) {
  if (!nums.length) return 0;
  return Math.round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

function unique(arr) {
  return [...new Set(arr)];
}

/**
 * Rank dimensions by score descending / ascending.
 * @param {Record<string, ReturnType<typeof createCapability>>} capabilities
 * @param {"asc"|"desc"} order
 */
export function rankDimensions(capabilities, order = "desc") {
  const rows = DIMENSION_IDS.map((id) => ({
    id,
    score: capabilities[id]?.score ?? 0,
    confidence: capabilities[id]?.confidence ?? "low",
    status: capabilities[id]?.status ?? "unknown"
  }));
  rows.sort((a, b) =>
    order === "asc" ? a.score - b.score : b.score - a.score
  );
  return rows;
}
