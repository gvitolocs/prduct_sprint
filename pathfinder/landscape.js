/**
 * Product Data Landscape derivation.
 * Structural result: foundation, fracture, next move, opportunity + persona interpretation.
 * Internal maturity OK for timeline comparison; landscape stays structural.
 */

import { rankDimensions, deriveSignals, DIMENSION_META } from "./dimensions.js";
import { PERSONAS } from "./scenarios.js";
import {
  toCalculatorAnswers,
  timelineBandFromHints,
  maturityFromCapabilities,
  dppImplicationsFromState,
  buildDppPlate
} from "./calculator-bridge.js";

/**
 * Build the landscape result object from completed (or near-complete) state.
 * @param {object} state
 */
export function buildLandscape(state) {
  const capabilities = state.capabilities;
  const rankedDesc = rankDimensions(capabilities, "desc");
  const rankedAsc = rankDimensions(capabilities, "asc");
  const signals = deriveSignals(capabilities);
  const withEvidence = rankedDesc.filter(
    (d) => (capabilities[d.id]?.evidence?.length || 0) > 0
  );

  const foundationDims = (withEvidence.length ? withEvidence : rankedDesc)
    .filter((d) => d.score >= 41)
    .slice(0, 2)
    .map((d) => d.id);
  if (foundationDims.length === 0) {
    foundationDims.push(rankedDesc[0].id);
    if (rankedDesc[1]) foundationDims.push(rankedDesc[1].id);
  }

  const gapDims = rankedAsc
    .filter((d) => (capabilities[d.id]?.evidence?.length || 0) > 0 || d.score < 41)
    .slice(0, 2)
    .map((d) => d.id);

  const boundary = inferBoundary(state, gapDims, signals);
  const nextCapability = pickNextCapability(state, gapDims, signals, rankedAsc);
  const opportunities = buildOpportunities(state, signals, capabilities);
  const personaInterpretation = interpretPersona(state, foundationDims, gapDims, nextCapability);
  const dppImplications = dppImplicationsFromState(state);
  const dppPlate = buildDppPlate(state);
  const answers = toCalculatorAnswers(state);
  const timeline = timelineBandFromHints(state.calculatorHints, answers);
  const maturityScore = maturityFromCapabilities(capabilities);

  const foundationEvidence = foundationDims.flatMap(
    (id) => capabilities[id]?.evidence || []
  );

  return {
    foundation: {
      dimensions: foundationDims,
      explanation: foundationExplanation(foundationDims),
      evidence: foundationEvidence
    },
    fragmentation: {
      dimensions: gapDims,
      boundary,
      explanation: fractureExplanation(gapDims, boundary),
      dependencies: collectDependencies(capabilities, gapDims)
    },
    nextCapability,
    opportunities,
    dppImplications,
    dppPlate,
    sectorObject: state.sectorObject || null,
    personaInterpretation,
    internal: {
      timelineBand: timeline.display,
      timeline,
      maturityScore,
      confidence: state.confidence,
      signals,
      calculatorAnswers: answers
    }
  };
}

function foundationExplanation(dims) {
  const labels = dims.map((id) => DIMENSION_META[id]?.label || id);
  if (labels.length === 0) {
    return "Evidence is still thin — the strongest signals will solidify as more situations are explored.";
  }
  return `Your strongest foundation sits in ${labels.join(" and ")}. These are the areas where evidence is most connected today.`;
}

function fractureExplanation(dims, boundary) {
  const labels = dims.map((id) => DIMENSION_META[id]?.label || id);
  const edge = boundary ? ` The first clear break is at ${boundary}.` : "";
  return `Information tends to get lost around ${labels.join(" and ")}.${edge}`;
}

function inferBoundary(state, gapDims, signals) {
  const lastBoundary = [...state.history].reverse().find((h) => h.boundary);
  if (lastBoundary?.boundary) {
    const map = {
      warehouse: "product -> supplier",
      "tier-1": "supplier -> material",
      "tier-2": "material -> supplier-of-supplier",
      "supplier-of-supplier": "supplier -> supplier-of-supplier"
    };
    return map[lastBoundary.boundary] || lastBoundary.boundary;
  }
  if (signals.supplierDependency) return "supplier -> material";
  if (gapDims.includes("lifecycleCapability")) return "customer -> nextLife";
  if (gapDims.includes("dataStructure") || gapDims.includes("informationRetrieval")) {
    return "source -> product";
  }
  if (gapDims.includes("collaboration") || gapDims.includes("ownership")) {
    return "department -> department";
  }
  return "supplier -> material";
}

function pickNextCapability(state, gapDims, signals, rankedAsc) {
  const priority = state.openQuestions?.find((q) => q.type === "priority");
  let id =
    priority?.id ||
    (signals.supplierDependency
      ? "supplierDataQuality"
      : signals.governanceGap
        ? "ownership"
        : signals.activationGap
          ? "commercialUse"
          : signals.lifecycleGap
            ? "lifecycleCapability"
            : gapDims[0] || rankedAsc[0]?.id || "informationRetrieval");

  const unlocks = expectedUnlocks(id);
  return {
    id,
    why: nextWhy(id, signals),
    firstMove: firstMove(id),
    expectedUnlocks: unlocks
  };
}

function nextWhy(id, signals) {
  if (signals.supplierDependency && id === "supplierDataQuality") {
    return "Supplier dependency is limiting traceability and proof — make supplier data reliable before collecting more internal fields.";
  }
  if (signals.governanceGap && (id === "ownership" || id === "collaboration")) {
    return "Data availability outpaces ownership — without a mandate, improvements will not stick.";
  }
  if (signals.activationGap && (id === "commercialUse" || id === "salesEnablement")) {
    return "Evidence exists but is not yet used commercially — activation unlocks value without more collection.";
  }
  if (signals.lifecycleGap && id === "lifecycleCapability") {
    return "Product data stops at the warehouse door — lifecycle continuity is the missing forward path.";
  }
  const label = DIMENSION_META[id]?.label || id;
  return `Making ${label} reliable next closes the most visible fracture in the landscape.`;
}

function firstMove(id) {
  const moves = {
    supplierDataQuality:
      "Require one enforceable supplier data field for your top material family.",
    informationRetrieval:
      "Name the system of record for composition and practice retrieving it on a live order.",
    ownership:
      "Assign a single accountable owner with mandate for product-data decisions.",
    collaboration:
      "Define the handoff path for a cross-department product-data request.",
    commercialUse:
      "Pick one buyer-facing claim you can reuse from maintained evidence.",
    salesEnablement:
      "Package one verified origin proof sales can retrieve without escalation.",
    lifecycleCapability:
      "Link product identity to spare parts or repair instructions for one SKU family.",
    verificationTrust:
      "Attach source and timestamp to one claim you already publish.",
    dataStructure:
      "Move one critical attribute from spreadsheet or inbox into the shared model.",
    traceabilityDepth:
      "Map one product one tier deeper than your current visibility boundary.",
    dppAvailability:
      "Fill the first missing passport field for the product you know best.",
    operationalFriction:
      "Time one real retrieval request and remove one handoff from the path.",
    regulatoryReadiness:
      "Document REACH or wood-cert evidence against specific SKUs, not folders."
  };
  return moves[id] || "Stabilize the weakest evidenced capability with one concrete owner and source.";
}

function expectedUnlocks(id) {
  const map = {
    supplierDataQuality: ["traceabilityDepth", "verificationTrust"],
    informationRetrieval: ["salesEnablement", "operationalFriction"],
    ownership: ["collaboration", "dppAvailability"],
    collaboration: ["operationalFriction", "ownership"],
    commercialUse: ["salesEnablement"],
    salesEnablement: ["commercialUse"],
    lifecycleCapability: ["traceabilityDepth", "dppAvailability"],
    verificationTrust: ["regulatoryReadiness", "salesEnablement"],
    dataStructure: ["informationRetrieval", "dppAvailability"],
    traceabilityDepth: ["supplierDataQuality", "dppAvailability"],
    dppAvailability: ["regulatoryReadiness"],
    operationalFriction: ["informationRetrieval"],
    regulatoryReadiness: ["dppAvailability", "verificationTrust"]
  };
  return map[id] || ["dppAvailability"];
}

function buildOpportunities(state, signals, capabilities) {
  const fromHistory = state.openQuestions
    .filter((q) => q.type === "opportunity")
    .map((q) => q.id);
  const ids = new Set(fromHistory);

  if (signals.activationGap || (capabilities.salesEnablement?.score || 0) < 50) {
    ids.add("faster-buyer-proof");
  }
  if ((capabilities.dppAvailability?.score || 0) < 70 || (capabilities.regulatoryReadiness?.score || 0) < 60) {
    ids.add("dpp-foundation");
  }
  if (signals.lifecycleGap || (capabilities.lifecycleCapability?.score || 0) < 45) {
    ids.add("repair-lifecycle");
  }
  if (signals.supplierDependency) {
    ids.add("supplier-change-control");
  }
  if (ids.size === 0) ids.add("dpp-foundation");

  const catalog = {
    "faster-buyer-proof": {
      id: "faster-buyer-proof",
      type: "commercial",
      label: "Faster buyer answers",
      evidence: capabilities.salesEnablement?.evidence || []
    },
    "dpp-foundation": {
      id: "dpp-foundation",
      type: "regulatory",
      label: "DPP preparation",
      evidence: capabilities.dppAvailability?.evidence || []
    },
    "repair-lifecycle": {
      id: "repair-lifecycle",
      type: "lifecycle",
      label: "Repair / lifecycle continuity",
      evidence: capabilities.lifecycleCapability?.evidence || []
    },
    "supplier-change-control": {
      id: "supplier-change-control",
      type: "operational",
      label: "Supplier-change control",
      evidence: capabilities.supplierDataQuality?.evidence || []
    },
    governance: {
      id: "governance",
      type: "governance",
      label: "Ownership and maintenance",
      evidence: capabilities.ownership?.evidence || []
    }
  };

  return [...ids].map((id) => catalog[id] || { id, type: "general", evidence: [] });
}

function interpretPersona(state, foundationDims, gapDims, nextCapability) {
  const persona = state.persona || "leadership";
  const meta = PERSONAS[persona] || PERSONAS.leadership;
  const nextLabel = DIMENSION_META[nextCapability.id]?.label || nextCapability.id;
  const foundations = foundationDims
    .map((id) => DIMENSION_META[id]?.label || id)
    .join(" and ");

  const headlines = {
    leadership: `Leadership lens: foundation in ${foundations || "emerging signals"}; the fracture to close next is ${nextLabel}.`,
    sales: `From sales: proof speed and reuse decide deals — next, make ${nextLabel} reliable.`,
    product: `From product/data: the shared model is the lever — prioritize ${nextLabel}.`,
    sustainability: `From sustainability: claims need a maintained trail — ${nextLabel} is the next layer.`,
    procurement: `From procurement: supplier boundaries shape everything — focus on ${nextLabel}.`,
    service: `From service: identity after shipment is the test — strengthen ${nextLabel}.`,
    cross: `Across functions: collaboration and ownership decide whether ${nextLabel} sticks.`
  };

  return {
    headline: headlines[persona] || headlines.leadership,
    relevantLens: meta.opening,
    suggestedConversation: `Talk through how ${nextLabel} would change the day-to-day path from ${meta.label}.`
  };
}

function collectDependencies(capabilities, gapDims) {
  const deps = new Set();
  for (const id of gapDims) {
    for (const d of capabilities[id]?.dependencies || []) deps.add(d);
  }
  return [...deps];
}

/**
 * Attach landscape onto state (immutable).
 * @param {object} state
 */
export function finalize(state) {
  const result = buildLandscape(state);
  return {
    ...state,
    stage: "reveal",
    currentNode: "reveal.landscape",
    result
  };
}
