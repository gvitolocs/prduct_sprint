/**
 * Scenario library — situations (not Question N of M), persona variants.
 * Pure data + lookup helpers.
 */

/** @typedef {"leadership"|"sales"|"product"|"sustainability"|"procurement"|"service"|"cross"} PersonaId */

export const PERSONAS = Object.freeze({
  leadership: {
    id: "leadership",
    label: "Leadership / CEO",
    opening:
      "A customer request crosses several departments before someone can answer.",
    emphasis: [
      "ownership",
      "collaboration",
      "commercialUse",
      "operationalFriction"
    ]
  },
  sales: {
    id: "sales",
    label: "Sales",
    opening: "A buyer asks for proof of material origin before signing.",
    emphasis: [
      "salesEnablement",
      "informationRetrieval",
      "verificationTrust",
      "commercialUse"
    ]
  },
  product: {
    id: "product",
    label: "Product / Data / IT",
    opening:
      "A colleague needs a product attribute that is not in the primary system.",
    emphasis: [
      "dataStructure",
      "informationRetrieval",
      "dppAvailability",
      "ownership"
    ]
  },
  sustainability: {
    id: "sustainability",
    label: "Sustainability / Compliance",
    opening: "Someone asks you to prove the claim.",
    emphasis: [
      "verificationTrust",
      "regulatoryReadiness",
      "traceabilityDepth",
      "dppAvailability"
    ]
  },
  procurement: {
    id: "procurement",
    label: "Procurement / Supply Chain",
    opening: "A supplier changes a material.",
    emphasis: [
      "supplierDataQuality",
      "traceabilityDepth",
      "verificationTrust",
      "operationalFriction"
    ]
  },
  service: {
    id: "service",
    label: "Service / After-sales",
    opening: "The product leaves your warehouse.",
    emphasis: [
      "lifecycleCapability",
      "traceabilityDepth",
      "informationRetrieval",
      "collaboration"
    ]
  },
  cross: {
    id: "cross",
    label: "I work across several",
    opening:
      "A customer request crosses several departments before someone can answer.",
    emphasis: [
      "collaboration",
      "ownership",
      "operationalFriction",
      "commercialUse"
    ]
  }
});

export const STAGES = Object.freeze([
  "perspective",
  "reality",
  "friction",
  "proof",
  "depth",
  "value",
  "horizon",
  "reveal"
]);

export const SPINE_NODES = Object.freeze([
  "supplier",
  "material",
  "component",
  "product",
  "customer",
  "nextLife"
]);

/**
 * Build option helper.
 * @param {string} id
 * @param {string} label
 * @param {number} strength
 * @param {object} [extra]
 */
function opt(id, label, strength, extra = {}) {
  return { id, label, strength, ...extra };
}

/** @type {Record<string, object>} */
export const SCENARIOS = {
  "perspective.select": {
    id: "perspective.select",
    stage: "perspective",
    personas: ["*"],
    prompt: "You see the product from a particular place.",
    detail: "Choose the perspective closest to the decisions you make.",
    interaction: "select-persona",
    captures: [],
    options: Object.values(PERSONAS).map((p) =>
      opt(p.id, p.label, 2, { setsPersona: p.id, motion: "settle" })
    )
  },

  "reality.product-context": {
    id: "reality.product-context",
    stage: "reality",
    personas: ["*"],
    prompt: "Show us the product you know best.",
    detail: "Choose product complexity and portfolio range.",
    interaction: "select",
    captures: ["dppAvailability"],
    spineTouch: ["product"],
    calculatorKeys: ["productComplexity", "portfolio"],
    options: [
      opt("simple-small", "Few materials, small catalogue", 3, {
        calculator: { productComplexity: 6, portfolio: 6 },
        setsSector: "furniture",
        motion: "separate"
      }),
      opt("made-to-order", "Made-to-order / workshop pieces", 3, {
        calculator: { productComplexity: 6, portfolio: 6 },
        calculatorHints: { madeToOrder: true },
        setsSector: "furniture",
        flags: ["made-to-order"],
        motion: "separate"
      }),
      opt("moderate", "Moderate BOM, mid-size catalogue", 2, {
        calculator: { productComplexity: 12, portfolio: 12 },
        motion: "separate"
      }),
      opt("complex-large", "Complex BOM, large catalogue", 1, {
        calculator: { productComplexity: 18, portfolio: 18 },
        setsSector: "machinery",
        motion: "separate"
      }),
      opt("enterprise", "100+ components, 500+ products", 0, {
        calculator: { productComplexity: 24, portfolio: 24 },
        setsSector: "machinery",
        motion: "separate"
      })
    ]
  },

  "reality.location": {
    id: "reality.location",
    stage: "reality",
    personas: ["*"],
    prompt: "Where does its information live?",
    detail: "Select the primary home for product and supplier data.",
    interaction: "select",
    captures: ["dataStructure", "informationRetrieval"],
    spineTouch: ["product"],
    calculatorKeys: ["dataAvailability"],
    options: [
      opt("human", "Mostly in someone’s head or inboxes", 0, {
        calculator: { dataAvailability: 24 },
        dependencies: ["human-knowledge"],
        motion: "separate"
      }),
      opt("pdf-email", "Supplier PDFs and email chains", 1, {
        calculator: { dataAvailability: 18 },
        dependencies: ["supplier-pdf"],
        motion: "connect"
      }),
      opt("spreadsheet", "Spreadsheets we maintain ourselves", 2, {
        calculator: { dataAvailability: 12 },
        motion: "join"
      }),
      opt("partial-erp", "Some of it in ERP / PLM", 3, {
        calculator: { dataAvailability: 12 },
        motion: "join"
      }),
      opt("full-erp", "All product data in ERP / PLM", 4, {
        calculator: { dataAvailability: 6 },
        motion: "settle"
      })
    ]
  },

  "friction.retrieval": {
    id: "friction.retrieval",
    stage: "friction",
    personas: ["*"],
    prompt: "You need this information tomorrow morning.",
    detail: "Choose the real retrieval path.",
    interaction: "evidence-boundary",
    captures: [
      "informationRetrieval",
      "operationalFriction",
      "supplierDataQuality"
    ],
    spineTouch: ["product", "customer"],
    options: [
      opt("immediate", "I can pull a verified answer immediately", 4, {
        motion: "settle"
      }),
      opt("search", "I search across systems and people", 2, {
        flags: ["needs-clarification"],
        motion: "connect"
      }),
      opt("ask-supplier", "I ask a supplier or partner", 1, {
        flags: ["supplier-dependency"],
        motion: "connect"
      }),
      opt("cannot", "I cannot provide a reliable answer", 0, {
        flags: ["source-of-friction"],
        motion: "separate"
      }),
      opt("not-sure", "Not sure", 1, {
        flags: ["not-sure"],
        soft: true,
        motion: "settle"
      })
    ]
  },

  "friction.supplier": {
    id: "friction.supplier",
    stage: "friction",
    personas: ["*"],
    prompt: "A supplier changes a material.",
    detail: "How does the change travel into your product data?",
    interaction: "evidence-boundary",
    captures: [
      "supplierDataQuality",
      "dataStructure",
      "verificationTrust",
      "operationalFriction"
    ],
    spineTouch: ["supplier", "material"],
    calculatorKeys: ["dataSharing", "contracts"],
    options: [
      opt("automatic", "It propagates automatically into our systems", 4, {
        calculator: { dataSharing: 6, contracts: 8 }
      }),
      opt("notified-manual", "We are notified, then update manually", 2, {
        calculator: { dataSharing: 12, contracts: 14 },
        flags: ["needs-clarification"]
      }),
      opt("discovered-later", "We discover it later, often from a customer", 1, {
        calculator: { dataSharing: 24, contracts: 20 },
        flags: ["source-of-friction", "supplier-dependency"]
      }),
      opt("unknown", "We would not know", 0, {
        calculator: { dataSharing: 24, contracts: 20 },
        flags: ["source-of-friction", "supplier-dependency"]
      })
    ]
  },

  "friction.collaboration": {
    id: "friction.collaboration",
    stage: "friction",
    personas: ["leadership", "cross", "product", "service"],
    prompt: "The answer crosses three departments.",
    detail: "How does a cross-functional data request actually travel?",
    interaction: "evidence-boundary",
    captures: ["collaboration", "ownership", "operationalFriction"],
    spineTouch: ["product"],
    calculatorKeys: ["ownership"],
    options: [
      opt("clear-handoff", "Clear handoff with a named owner", 4, {
        calculator: { ownership: 6 }
      }),
      opt("informal", "Informal collaboration, no mandate", 2, {
        calculator: { ownership: 14 },
        flags: ["needs-clarification"]
      }),
      opt("escalation", "It escalates until someone volunteers", 1, {
        calculator: { ownership: 20 },
        flags: ["governance-gap"]
      }),
      opt("no-route", "There is no reliable route", 0, {
        calculator: { ownership: 20 },
        flags: ["governance-gap", "source-of-friction"]
      })
    ]
  },

  "friction.clarification": {
    id: "friction.clarification",
    stage: "friction",
    personas: ["*"],
    prompt: "How consistent is that path across the catalogue?",
    detail: "One clarification about coverage or repeatability.",
    interaction: "clarification",
    captures: ["informationRetrieval", "operationalFriction"],
    options: [
      opt("most-skus", "Works for most SKUs we sell", 3),
      opt("some-lines", "Only for some product lines", 2),
      opt("ad-hoc", "Only when the right person is available", 1),
      opt("rare", "Rarely repeatable", 0)
    ]
  },

  "proof.request": {
    id: "proof.request",
    stage: "proof",
    personas: ["*"],
    prompt: "Someone asks you to prove it.",
    detail: "Choose the evidence you would actually use.",
    interaction: "evidence-boundary",
    captures: ["verificationTrust", "regulatoryReadiness"],
    spineTouch: ["material"],
    calculatorKeys: ["certification", "hazardous"],
    options: [
      opt("verified-source", "Verified, attributable, current source", 4, {
        calculator: { certification: 6, hazardous: 8 },
        flags: ["proof-claimed"],
        motion: "settle"
      }),
      opt("internal-record", "Internal record we maintain", 3, {
        calculator: { certification: 10, hazardous: 14 },
        flags: ["proof-claimed"],
        motion: "join"
      }),
      opt("supplier-assertion", "Supplier assertion or certificate on file", 2, {
        calculator: { certification: 14, hazardous: 14 },
        flags: ["needs-clarification", "proof-claimed"],
        motion: "connect"
      }),
      opt("cannot-prove", "We cannot prove it reliably", 0, {
        calculator: { certification: 22, hazardous: 22 },
        flags: ["source-of-friction"],
        motion: "separate"
      })
    ]
  },

  "proof.sales-origin": {
    id: "proof.sales-origin",
    stage: "proof",
    personas: ["sales", "leadership", "cross"],
    prompt: "A buyer asks for proof of material origin before signing.",
    detail: "Choose the response path sales would take.",
    interaction: "evidence-boundary",
    captures: [
      "salesEnablement",
      "informationRetrieval",
      "verificationTrust",
      "commercialUse"
    ],
    spineTouch: ["customer", "material"],
    options: [
      opt("instant-verified", "Share verified proof in the moment", 4),
      opt("search-then-answer", "Search, then answer within days", 2, {
        flags: ["needs-clarification"]
      }),
      opt("ask-supplier", "Ask the supplier and hope they respond", 1, {
        flags: ["supplier-dependency"]
      }),
      opt("cannot-provide", "We usually cannot provide it", 0, {
        flags: ["source-of-friction"]
      })
    ]
  },

  "proof.verification": {
    id: "proof.verification",
    stage: "proof",
    personas: ["*"],
    prompt: "The claim is true today. How will you know next quarter?",
    detail: "Freshness and maintenance of proof.",
    interaction: "evidence-boundary",
    captures: ["verificationTrust", "ownership"],
    options: [
      opt("maintained", "Named owner and system keep it current", 4),
      opt("periodic", "Periodic check, mostly manual", 2),
      opt("ask-around", "We ask around when needed", 1),
      opt("unknown-freshness", "We would not know if it went stale", 0)
    ]
  },

  "depth.trace-back": {
    id: "depth.trace-back",
    stage: "depth",
    personas: ["*"],
    prompt: "Now follow the product backwards.",
    detail:
      "Where does visibility stop: Product → Component → Material → Supplier → Supplier’s supplier?",
    interaction: "trace-boundary",
    captures: ["traceabilityDepth", "supplierDataQuality"],
    spineTouch: ["product", "component", "material", "supplier"],
    calculatorKeys: ["tiers"],
    options: [
      opt("tier3", "Named suppliers three or more tiers back", 4, {
        calculator: { tiers: 8 },
        boundary: "supplier-of-supplier",
        motion: "connect"
      }),
      opt("tier2", "Tier 1 and some tier 2", 3, {
        calculator: { tiers: 14 },
        boundary: "tier-2",
        motion: "separate"
      }),
      opt("tier1", "Direct suppliers only (tier 1)", 1, {
        calculator: { tiers: 20 },
        boundary: "tier-1",
        flags: ["supplier-dependency"],
        motion: "separate"
      }),
      opt("warehouse", "Visibility stops at our warehouse door", 0, {
        calculator: { tiers: 20 },
        boundary: "warehouse",
        flags: ["source-of-friction", "supplier-dependency"],
        motion: "separate"
      })
    ]
  },

  "depth.trace-forward": {
    id: "depth.trace-forward",
    stage: "depth",
    personas: ["service", "leadership", "cross", "product", "sustainability"],
    prompt: "The product leaves your warehouse.",
    detail:
      "Does identity and data survive delivery, repair, resale, or return?",
    interaction: "evidence-boundary",
    captures: ["lifecycleCapability", "traceabilityDepth", "collaboration"],
    spineTouch: ["customer", "nextLife"],
    options: [
      opt("full-lifecycle", "Identity and data survive repair and next life", 4),
      opt("repair-parts", "Repair and spare parts are trackable", 3),
      opt("delivery-only", "We track to delivery, then lose the thread", 1, {
        flags: ["lifecycle-gap"]
      }),
      opt("no-forward", "Forward identity is not maintained", 0, {
        flags: ["lifecycle-gap", "source-of-friction"]
      })
    ]
  },

  "value.sales": {
    id: "value.sales",
    stage: "value",
    personas: ["sales"],
    prompt: "Could this answer help close the deal?",
    detail: "Commercial activation of product proof.",
    interaction: "select",
    captures: ["salesEnablement", "commercialUse"],
    spineTouch: ["customer"],
    calculatorKeys: ["commercialIntent", "trustLikert"],
    options: [
      opt("closes-deals", "Yes — we already win on transparency", 4, {
        calculator: { commercialIntent: 8, trustLikert: 8 }
      }),
      opt("sometimes", "Sometimes, when we can assemble the proof", 2, {
        calculator: { commercialIntent: 12, trustLikert: 12 }
      }),
      opt("not-yet", "Not yet — data stays internal", 1, {
        calculator: { commercialIntent: 16, trustLikert: 14 },
        flags: ["activation-gap"]
      }),
      opt("compliance-only", "It is treated as compliance only", 0, {
        calculator: { commercialIntent: 16, trustLikert: 16 },
        flags: ["activation-gap"]
      })
    ]
  },

  "value.leadership": {
    id: "value.leadership",
    stage: "value",
    personas: ["leadership", "cross"],
    prompt: "What would improve first if this information were connected?",
    detail: "Strategic value of connected product data.",
    interaction: "select",
    captures: ["commercialUse", "operationalFriction", "ownership"],
    calculatorKeys: ["commercialIntent", "ownership"],
    options: [
      opt("speed-trust", "Faster answers and customer trust", 4, {
        calculator: { commercialIntent: 8, ownership: 8 }
      }),
      opt("cost-of-delay", "We would cut the cost of delay and rework", 3, {
        calculator: { commercialIntent: 12, ownership: 14 }
      }),
      opt("unclear-owner", "Improvement is unclear without an owner", 1, {
        calculator: { commercialIntent: 16, ownership: 20 },
        flags: ["governance-gap"]
      }),
      opt("not-priority", "It is not yet a leadership priority", 0, {
        calculator: { commercialIntent: 16, ownership: 20 },
        flags: ["governance-gap", "activation-gap"]
      })
    ]
  },

  "value.product": {
    id: "value.product",
    stage: "value",
    personas: ["product"],
    prompt: "Would the answer be reusable outside your team?",
    detail: "Shared model vs tribal knowledge.",
    interaction: "select",
    captures: ["dataStructure", "collaboration"],
    options: [
      opt("shared-model", "Yes — shared model and APIs", 4),
      opt("exportable", "Exportable, but not live-connected", 2),
      opt("team-only", "Only inside our team’s tools", 1, {
        flags: ["activation-gap"]
      }),
      opt("tribal", "It lives as tribal knowledge", 0, {
        flags: ["source-of-friction"]
      })
    ]
  },

  "value.sustainability": {
    id: "value.sustainability",
    stage: "value",
    personas: ["sustainability"],
    prompt:
      "Could you demonstrate the claim without rebuilding the evidence trail?",
    detail: "Reusable verification for regulation and customers.",
    interaction: "select",
    captures: ["verificationTrust", "regulatoryReadiness", "dppAvailability"],
    options: [
      opt("reuse-trail", "Yes — maintained evidence trail", 4),
      opt("rebuild-partial", "Partially — we rebuild some sections", 2),
      opt("rebuild-each", "We rebuild the trail each time", 1),
      opt("cannot-demo", "We could not demonstrate it on demand", 0)
    ]
  },

  "value.procurement": {
    id: "value.procurement",
    stage: "value",
    personas: ["procurement"],
    prompt:
      "Would a material change be visible before it becomes a customer problem?",
    detail: "Supplier-change control as operational value.",
    interaction: "select",
    captures: ["supplierDataQuality", "operationalFriction"],
    options: [
      opt("early-visibility", "Yes — early visibility and control", 4),
      opt("sometimes-late", "Sometimes, often late", 2),
      opt("customer-first", "Customers often notice first", 1, {
        flags: ["supplier-dependency"]
      }),
      opt("blind", "We are usually blind to upstream changes", 0, {
        flags: ["supplier-dependency", "source-of-friction"]
      })
    ]
  },

  "value.service": {
    id: "value.service",
    stage: "value",
    personas: ["service"],
    prompt: "Could this product still be understood five years from now?",
    detail: "Long-term identity for repair and circularity.",
    interaction: "select",
    captures: ["lifecycleCapability", "informationRetrieval"],
    options: [
      opt("five-years", "Yes — identity and parts data endure", 4),
      opt("partial-years", "Partially — some generations only", 2),
      opt("hard-later", "Hard after a few years", 1, { flags: ["lifecycle-gap"] }),
      opt("lost", "We would struggle to identify it later", 0, {
        flags: ["lifecycle-gap"]
      })
    ]
  },

  "horizon.dpp": {
    id: "horizon.dpp",
    stage: "horizon",
    personas: ["*"],
    prompt: "And if every product needed a passport tomorrow?",
    detail: "Select the first consequence to address. DPP only at Horizon.",
    interaction: "select",
    captures: ["dppAvailability", "regulatoryReadiness"],
    spineTouch: ["product", "material", "supplier", "nextLife"],
    options: [
      opt("supplier-gap", "Supplier and material evidence gaps", 1, {
        opportunity: "supplier-change-control",
        priorityDim: "supplierDataQuality",
        motion: "separate"
      }),
      opt("retrieval-gap", "Finding and assembling answers fast enough", 1, {
        opportunity: "faster-buyer-proof",
        priorityDim: "informationRetrieval",
        motion: "join"
      }),
      opt("governance-gap", "Ownership and cross-team maintenance", 1, {
        opportunity: "governance",
        priorityDim: "ownership",
        motion: "connect"
      }),
      opt("lifecycle-gap", "Repair, identity, and end-of-life continuity", 1, {
        opportunity: "repair-lifecycle",
        priorityDim: "lifecycleCapability",
        motion: "separate"
      }),
      opt("field-gaps", "Missing passport fields themselves", 2, {
        opportunity: "dpp-foundation",
        priorityDim: "dppAvailability",
        motion: "settle"
      })
    ]
  },

  "horizon.unlock": {
    id: "horizon.unlock",
    stage: "horizon",
    personas: ["*"],
    prompt: "What should this information unlock?",
    detail: "Choose the outcome that matters most from your seat.",
    interaction: "select",
    captures: ["commercialUse"],
    options: [
      opt("faster-answers", "Faster internal and customer answers", 3, {
        opportunity: "faster-buyer-proof"
      }),
      opt("sales-proof", "Sales proof that closes deals", 3, {
        opportunity: "faster-buyer-proof"
      }),
      opt("compliance", "Compliance and regulatory readiness", 3, {
        opportunity: "dpp-foundation"
      }),
      opt("repair", "Repair and spare-parts continuity", 3, {
        opportunity: "repair-lifecycle"
      }),
      opt("circularity", "Circularity and next-life identity", 3, {
        opportunity: "repair-lifecycle"
      })
    ]
  }
};

/**
 * Persona-specific value scenario id.
 * @param {PersonaId|string} persona
 */
export function valueScenarioIdFor(persona) {
  const map = {
    sales: "value.sales",
    leadership: "value.leadership",
    cross: "value.leadership",
    product: "value.product",
    sustainability: "value.sustainability",
    procurement: "value.procurement",
    service: "value.service"
  };
  return map[persona] || "value.leadership";
}

/**
 * @param {string} id
 */
export function getScenario(id) {
  const s = SCENARIOS[id];
  if (!s) throw new Error(`Unknown scenario: ${id}`);
  return s;
}

/**
 * Whether a scenario is available for a persona.
 * @param {object} scenario
 * @param {string|null} persona
 */
export function scenarioMatchesPersona(scenario, persona) {
  if (!scenario.personas || scenario.personas.includes("*")) return true;
  if (!persona) return false;
  return scenario.personas.includes(persona);
}

/**
 * Resolve option on a scenario.
 * @param {object} scenario
 * @param {string} optionId
 */
export function getOption(scenario, optionId) {
  const optn = scenario.options.find((o) => o.id === optionId);
  if (!optn) throw new Error(`Unknown option ${optionId} on ${scenario.id}`);
  return optn;
}
