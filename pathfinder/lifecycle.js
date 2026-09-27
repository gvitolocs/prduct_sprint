/**
 * Lifecycle journey — the cinematic assessment's scenario bank and router.
 *
 * The camera travels COMPANY → PRODUCT → … → NEXT LIFE; each lifecycle stage
 * hosts one situation (plus an occasional follow-up on the same shot). Scoring
 * is the Pathfinder capability model unchanged: every answer writes evidence to
 * the same 13 dimensions, spine nodes and calculator hints, and the result is
 * built by landscape.js. Branches (furniture / battery / textile) change the
 * wording and examples, never the scoring.
 * Pure functions; no DOM.
 */

import { createCapabilities, applyEvidence, deriveSignals } from "./dimensions.js";
import { clampStrength } from "./evidence.js";
import { SPINE_NODES, PERSONAS } from "./scenarios.js";
import { resolveSectorObject, deriveMotion, advanceObjectState } from "./sector-object.js";
import { buildLandscape } from "./landscape.js";

export const JOURNEY_VERSION = "lifecycle-journey-1.0";

export const LIFECYCLE_STAGES = Object.freeze([
  "company",
  "product",
  "material",
  "component",
  "supplier",
  "logistics",
  "factory",
  "data",
  "passport",
  "nextLife"
]);

export const STAGE_LABELS = Object.freeze({
  company: "Company",
  product: "Product",
  material: "Material",
  component: "Component",
  supplier: "Supplier",
  logistics: "Logistics",
  factory: "Factory",
  data: "Data",
  passport: "Passport",
  nextLife: "Next life"
});

/** Lifecycle stage → result-map spine node it strengthens (null = context only). */
export const STAGE_TO_SPINE = Object.freeze({
  company: null,
  product: "product",
  material: "material",
  component: "component",
  supplier: "supplier",
  logistics: "material",
  factory: "component",
  data: "product",
  passport: "customer",
  nextLife: "nextLife"
});

export const BRANCHES = Object.freeze({
  furniture: Object.freeze({
    id: "furniture",
    sector: "furniture",
    industry: "Furniture",
    object: "lounge chair",
    short: "chair",
    // Calculator-compatible defaults (same bands as the linear quiz timeline).
    hints: { productComplexity: 12, portfolio: 12, companySize: 12 }
  }),
  battery: Object.freeze({
    id: "battery",
    sector: "battery",
    industry: "Battery & e-mobility",
    object: "e-bike battery",
    short: "battery",
    hints: { productComplexity: 18, portfolio: 8, companySize: 12 }
  }),
  textile: Object.freeze({
    id: "textile",
    sector: "textile",
    industry: "Textiles & apparel",
    object: "rain jacket",
    short: "jacket",
    hints: { productComplexity: 8, portfolio: 18, companySize: 12 }
  })
});

/**
 * Option helper. `label` / `fact` / `sub` may be a string or a per-branch map.
 * `fact` is the short statement the landscape uses for "what exists".
 */
function o(id, strength, label, extra = {}) {
  return { id, strength, label, ...extra };
}

const PERSONA_OPTIONS = [
  o("leadership", 2, "Leadership", { sub: "Running the business", setsPersona: "leadership" }),
  o("product", 2, "Product, data or IT", { sub: "Specs, systems, PIM / PLM", setsPersona: "product" }),
  o("sustainability", 2, "Sustainability or compliance", { sub: "Claims, evidence, regulation", setsPersona: "sustainability" }),
  o("procurement", 2, "Sourcing & supply chain", { sub: "Suppliers, materials, contracts", setsPersona: "procurement" }),
  o("sales", 2, "Sales & customers", { sub: "The questions buyers ask", setsPersona: "sales" }),
  o("service", 2, "After-sales & repair", { sub: "Parts, service, returns", setsPersona: "service" })
];

/** @type {Record<string, object>} */
export const JOURNEY_SCENARIOS = {
  "product.perspective": {
    id: "product.perspective",
    stage: "product",
    kind: "base",
    interaction: "select-persona",
    prompt: {
      furniture: "You know this chair from a particular seat.",
      battery: "You know this battery from a particular seat.",
      textile: "You know this jacket from a particular seat."
    },
    detail: "Pick the one closest to the decisions you make. It changes the examples, not the result.",
    captures: [],
    options: PERSONA_OPTIONS
  },

  "product.identity": {
    id: "product.identity",
    stage: "product",
    kind: "base",
    prompt: {
      furniture: "Today, this chair’s identity lives…",
      battery: "Today, this battery’s identity lives…",
      textile: "Today, this jacket’s identity lives…"
    },
    detail: {
      furniture: "Fabrics, oak finishes and sizes multiply one design into many products.",
      battery: "Capacities, cell suppliers and firmware multiply one pack into many products.",
      textile: "Colours and sizes multiply one style into dozens of products."
    },
    captures: ["dataStructure", "traceabilityDepth"],
    spineTouch: ["product"],
    options: [
      o("model-only", 1, {
        furniture: "In a model name — fabric and finish are sorted out per order",
        battery: "In a model name — capacity and firmware versions blur together",
        textile: "In a style name — colours and sizes are handled as they come"
      }, { fact: "A model name, variants handled informally", flags: ["variant-blind"] }),
      o("variant-list", 2, {
        furniture: "In a model with variants we can list",
        battery: "In a model with variants we can list",
        textile: "In a style with colours and sizes we can list"
      }, { fact: "A model with listed variants" }),
      o("variant-records", 3, {
        furniture: "Every fabric and finish variant has its own record",
        battery: "Every variant has its own part number and spec",
        textile: "Every colour–size variant has its own SKU record"
      }, { fact: "A record per variant" }),
      o("item-level", 4, {
        furniture: "Every single chair carries its own serial identity",
        battery: "Every pack has a serial number linked to its build",
        textile: "Every garment can be identified individually"
      }, { fact: "Item-level identity" }),
      o("made-to-order", 2, { furniture: "Each piece is made to order — no two are quite alike" }, {
        branches: ["furniture"],
        fact: "Made-to-order pieces without a stable model record",
        flags: ["made-to-order"],
        calculatorHints: { madeToOrder: true }
      })
    ]
  },

  "material.composition": {
    id: "material.composition",
    stage: "material",
    kind: "base",
    prompt: {
      furniture: "Up close, a chair is a recipe. How well do you know yours?",
      battery: "Up close, a battery is chemistry. How well do you know yours?",
      textile: "Up close, a jacket is fibres and coatings. How well do you know yours?"
    },
    detail: {
      furniture: "Wool blend, oak, foam, glue, lacquer — down to the substances in them.",
      battery: "Cell chemistry, aluminium housing, seals, thermal pads — and the critical raw materials inside.",
      textile: "Polyester base, PU coating, water-repellent finish — and what is in them."
    },
    captures: ["dppAvailability", "verificationTrust", "regulatoryReadiness"],
    spineTouch: ["material"],
    calculatorKeys: ["hazardous"],
    options: [
      o("broad", 1, "We know the main materials, not the exact mix", {
        fact: "Main materials known, exact mix unknown", calculator: { hazardous: 22 }
      }),
      o("declared", 2, "Supplier declarations cover most of it", {
        fact: "Supplier material declarations", calculator: { hazardous: 14 }, flags: ["needs-clarification"]
      }),
      o("specified", 3, "Specified per material, with grades and percentages", {
        fact: "Material specifications with grades", calculator: { hazardous: 10 }
      }),
      o("verified", 4, "Verified composition, including substances of concern", {
        fact: "Verified composition incl. substances of concern", calculator: { hazardous: 8 },
        flags: ["proof-claimed"]
      }),
      o("not-sure", 1, "Not sure", { soft: true, flags: ["not-sure"], fact: "Composition knowledge unclear" })
    ]
  },

  "component.bom": {
    id: "component.bom",
    stage: "component",
    kind: "base",
    prompt: {
      furniture: "Under the cushion: webbing, foam, frame, fittings. Can you tie each material to its component?",
      battery: "Inside: cells, BMS, wiring, housing. Can you tie each material to its component?",
      textile: "Zip, seam tape, press studs, lining. Can you tie each material to its component?"
    },
    detail: "This is what repair, recycling and a passport all need to know.",
    captures: ["dataStructure", "traceabilityDepth", "dppAvailability"],
    spineTouch: ["component"],
    options: [
      o("product-wide", 0, "No — materials are tracked for the product as a whole", {
        fact: "Materials known only product-wide", flags: ["source-of-friction"]
      }),
      o("main-parts", 2, "For the main components only", { fact: "Component materials for main parts" }),
      o("bom", 3, "Yes, through a maintained bill of materials", { fact: "A maintained bill of materials" }),
      o("bom-versioned", 4, "Yes, and the BOM is versioned against each build", {
        fact: "A versioned, build-specific bill of materials"
      })
    ]
  },

  "supplier.depth": {
    id: "supplier.depth",
    stage: "supplier",
    kind: "base",
    interaction: "trace-boundary",
    prompt: {
      furniture: "Follow the oak upstream. Where does your visibility stop?",
      battery: "Follow the cells upstream. Where does your visibility stop?",
      textile: "Follow the fabric upstream. Where does your visibility stop?"
    },
    detail: {
      furniture: "Sawmill, forest, and the certificate that proves it.",
      battery: "Pack assembler, cell maker, cathode producer, refinery, mine.",
      textile: "Garment maker, fabric mill, yarn spinner, polymer."
    },
    captures: ["traceabilityDepth", "supplierDataQuality"],
    spineTouch: ["supplier", "material"],
    calculatorKeys: ["tiers"],
    options: [
      o("warehouse", 0, "At our own warehouse door", {
        fact: "Visibility ends at the warehouse", calculator: { tiers: 20 }, boundary: "warehouse",
        flags: ["source-of-friction", "supplier-dependency"]
      }),
      o("tier1", 1, "At our direct supplier", {
        fact: "Direct suppliers known (tier 1)", calculator: { tiers: 20 }, boundary: "tier-1",
        flags: ["supplier-dependency"]
      }),
      o("tier2", 3, "One or two tiers beyond them", {
        fact: "Suppliers named two tiers deep", calculator: { tiers: 14 }, boundary: "tier-2",
        flags: ["proof-claimed"]
      }),
      o("tier3", 4, {
        furniture: "All the way to the forest, with chain-of-custody evidence",
        battery: "To the refinery or mine, with due-diligence evidence",
        textile: "To the fibre source, with traceability evidence"
      }, {
        fact: "Traceable to the raw-material source", calculator: { tiers: 8 },
        boundary: "supplier-of-supplier", flags: ["proof-claimed"]
      })
    ]
  },

  "supplier.proof": {
    id: "supplier.proof",
    stage: "supplier",
    kind: "followup",
    why: "That is deep visibility. One check on what stands behind it.",
    prompt: "Someone asks you to prove it — tomorrow.",
    detail: {
      furniture: "A retailer wants the oak’s origin and harvest legality on file.",
      battery: "An importer wants cobalt and lithium due-diligence evidence.",
      textile: "A buyer wants proof of the recycled-content claim."
    },
    captures: ["verificationTrust", "regulatoryReadiness"],
    spineTouch: ["material"],
    calculatorKeys: ["certification"],
    options: [
      o("verified-source", 4, "We attach a verified, current source", {
        fact: "Verified, attributable sourcing evidence", calculator: { certification: 6 }
      }),
      o("internal-record", 3, "We show an internal record we maintain", {
        fact: "Internal sourcing records", calculator: { certification: 10 }
      }),
      o("supplier-assertion", 2, "We forward a supplier certificate", {
        fact: "Supplier certificates on file", calculator: { certification: 14 },
        flags: ["needs-clarification"]
      }),
      o("cannot-prove", 0, "We could not prove it reliably", {
        fact: "Sourcing claims without proof", calculator: { certification: 22 },
        flags: ["source-of-friction"]
      })
    ]
  },

  "logistics.handoff": {
    id: "logistics.handoff",
    stage: "logistics",
    kind: "base",
    prompt: {
      furniture: "Timber changes hands several times before it becomes a chair. Does its information travel with it?",
      battery: "Cells cross borders as dangerous goods before they become a pack. Does their information travel with them?",
      textile: "Fabric rolls change hands before they become a jacket. Does their information travel with them?"
    },
    detail: "Batch numbers, certificates, test reports — at every hand-off.",
    captures: ["traceabilityDepth", "supplierDataQuality", "dataStructure"],
    spineTouch: ["material", "component"],
    calculatorKeys: ["dataSharing"],
    options: [
      o("pooled", 0, "No — stock is pooled and the paperwork stays behind", {
        fact: "Hand-offs lose the batch link", calculator: { dataSharing: 24 },
        flags: ["supplier-dependency", "source-of-friction"]
      }),
      o("by-date", 1, "Roughly — we can match by delivery date and documents", {
        fact: "Batches matched by date and paperwork", calculator: { dataSharing: 18 },
        flags: ["supplier-dependency"]
      }),
      o("by-batch", 3, "Yes — each batch keeps its number from delivery to product", {
        fact: "Batch numbers kept through hand-offs", calculator: { dataSharing: 12 }
      }),
      o("by-item", 4, "Yes — down to the individual item", {
        fact: "Item-level continuity through logistics", calculator: { dataSharing: 6 }
      })
    ]
  },

  "logistics.change": {
    id: "logistics.change",
    stage: "logistics",
    kind: "followup",
    why: "That points to the supplier boundary. Let’s follow it one step further.",
    prompt: "A supplier quietly changes a material.",
    detail: {
      furniture: "A new foam, a different glue, oak from another region.",
      battery: "A new cell batch from a second plant.",
      textile: "A different coating chemistry from the mill."
    },
    captures: ["supplierDataQuality", "dataStructure", "verificationTrust", "operationalFriction"],
    spineTouch: ["supplier", "material"],
    calculatorKeys: ["dataSharing", "contracts"],
    options: [
      o("automatic", 4, "It flows into our product data automatically", {
        fact: "Supplier changes propagate automatically", calculator: { dataSharing: 6, contracts: 8 }
      }),
      o("notified-manual", 2, "We are told, then someone updates it by hand", {
        fact: "Supplier changes updated by hand", calculator: { dataSharing: 12, contracts: 14 },
        flags: ["needs-clarification"]
      }),
      o("discovered-later", 1, "We find out later — sometimes from a customer", {
        fact: "Supplier changes discovered late", calculator: { dataSharing: 24, contracts: 20 },
        flags: ["source-of-friction", "supplier-dependency"]
      }),
      o("unknown", 0, "We probably would not know", {
        fact: "Supplier changes go unnoticed", calculator: { dataSharing: 24, contracts: 20 },
        flags: ["source-of-friction", "supplier-dependency"]
      })
    ]
  },

  "factory.evidence": {
    id: "factory.evidence",
    stage: "factory",
    kind: "base",
    prompt: {
      furniture: "On the production floor, what is recorded about how each chair was made?",
      battery: "On the line, what is recorded about how each pack was built?",
      textile: "On the sewing floor, what is recorded about how each jacket was made?"
    },
    detail: {
      furniture: "Work orders, fabric lots, glue batches, quality checks.",
      battery: "Cell lots, weld checks, end-of-line tests, firmware version.",
      textile: "Cut lots, seam-sealing checks, inspection results."
    },
    captures: ["verificationTrust", "traceabilityDepth", "dataStructure"],
    spineTouch: ["component", "product"],
    options: [
      o("not-reliably", 0, "Not reliably — it lives in people’s heads", {
        fact: "Production history undocumented", flags: ["source-of-friction"]
      }),
      o("site-week", 1, "Site and production week", { fact: "Production site and week" }),
      o("work-order", 3, "Work order, line and quality checks", { fact: "Work-order and quality records" }),
      o("per-unit", 4, "Per unit — timestamped, with test results", { fact: "Per-unit production records" })
    ]
  },

  "data.location": {
    id: "data.location",
    stage: "data",
    kind: "base",
    prompt: "So where does all of this actually live today?",
    detail: "The main home for product and supplier information.",
    captures: ["dataStructure", "informationRetrieval"],
    spineTouch: ["product"],
    calculatorKeys: ["dataAvailability"],
    options: [
      o("human", 0, "In people’s heads and inboxes", {
        fact: "People and inboxes", home: "people", calculator: { dataAvailability: 24 },
        dependencies: ["human-knowledge"]
      }),
      o("pdf-email", 1, "In supplier PDFs and email threads", {
        fact: "Supplier PDFs and email", home: "documents", calculator: { dataAvailability: 18 },
        dependencies: ["supplier-pdf"]
      }),
      o("spreadsheet", 2, "In spreadsheets we maintain ourselves", {
        fact: "Self-maintained spreadsheets", home: "spreadsheets", calculator: { dataAvailability: 12 }
      }),
      o("partial-erp", 3, "Partly in ERP / PLM, partly elsewhere", {
        fact: "ERP / PLM plus side files", home: "systems-partial", calculator: { dataAvailability: 12 }
      }),
      o("full-erp", 4, "In ERP / PLM / PIM — connected", {
        fact: "Connected ERP / PLM / PIM", home: "systems", calculator: { dataAvailability: 6 }
      })
    ]
  },

  "data.retrieval": {
    id: "data.retrieval",
    stage: "data",
    kind: "followup",
    why: "Then a practical test of that path.",
    prompt: {
      furniture: "A retailer needs the chair’s full material breakdown by tomorrow morning.",
      battery: "An importer needs the pack’s chemistry and carbon data by tomorrow morning.",
      textile: "A buyer needs the jacket’s fibre and chemical data by tomorrow morning."
    },
    detail: "Choose the path you would really take.",
    captures: ["informationRetrieval", "operationalFriction", "supplierDataQuality"],
    spineTouch: ["product", "customer"],
    options: [
      o("immediate", 4, "I can pull a verified answer immediately", { fact: "Answers retrieved on demand" }),
      o("search", 2, "I would search across systems and colleagues", {
        fact: "Answers assembled by searching", flags: ["needs-clarification"]
      }),
      o("ask-supplier", 1, "I would have to ask a supplier", {
        fact: "Answers depend on suppliers", flags: ["supplier-dependency"]
      }),
      o("cannot", 0, "I could not give a reliable answer", {
        fact: "No reliable answer path", flags: ["source-of-friction"]
      })
    ]
  },

  "data.owner": {
    id: "data.owner",
    stage: "data",
    kind: "base",
    prompt: "When this information changes, who makes sure it is updated?",
    detail: "Ownership decides whether any of this stays true.",
    captures: ["ownership", "collaboration", "operationalFriction"],
    spineTouch: [],
    calculatorKeys: ["ownership"],
    options: [
      o("named-owner", 4, "A named owner with a mandate", { fact: "A named data owner", calculator: { ownership: 6 } }),
      o("per-department", 2, "Each department keeps its own version", {
        fact: "Parallel versions per department", calculator: { ownership: 14 }, flags: ["needs-clarification"]
      }),
      o("whoever-notices", 1, "Whoever notices first", {
        fact: "Updates depend on whoever notices", calculator: { ownership: 20 }, flags: ["governance-gap"]
      }),
      o("nobody", 0, "Honestly, nobody in particular", {
        fact: "No owner for product data", calculator: { ownership: 20 },
        flags: ["governance-gap", "source-of-friction"]
      })
    ]
  },

  "passport.carrier": {
    id: "passport.carrier",
    stage: "passport",
    kind: "base",
    prompt: {
      furniture: "Someone points a phone at the chair. What can they reach today?",
      battery: "A mechanic scans the battery. What can they reach today?",
      textile: "A customer scans the jacket’s label. What can they reach today?"
    },
    detail: "The physical data carrier is where a passport starts.",
    captures: ["dppAvailability", "salesEnablement", "lifecycleCapability", "commercialUse"],
    spineTouch: ["customer", "product"],
    options: [
      o("no-carrier", 0, "Nothing — there is no identifier to scan", {
        fact: "No data carrier on the product", flags: ["source-of-friction"]
      }),
      o("generic-page", 1, "A generic product page or manual", { fact: "A generic product page" }),
      o("model-data", 3, "Model data: materials, care, documents", { fact: "Model-level data behind a code" }),
      o("item-data", 4, {
        furniture: "This exact chair — its origin, parts and repairs",
        battery: "This exact pack — chemistry, state of health, history",
        textile: "This exact jacket — origin, care and repairs"
      }, { fact: "Item-level data behind a code" })
    ]
  },

  "nextLife.continuity": {
    id: "nextLife.continuity",
    stage: "nextLife",
    kind: "base",
    prompt: {
      furniture: "Years later the chair comes back for new upholstery. What still knows it?",
      battery: "Three years on, the battery is weaker. Does anyone know its history?",
      textile: "Two winters later, the zip breaks. Does anyone know how this jacket was made?"
    },
    detail: "Repair, resale, refurbishment and recycling all start from identity.",
    captures: ["lifecycleCapability", "traceabilityDepth", "collaboration"],
    spineTouch: ["customer", "nextLife"],
    options: [
      o("full", 4, "Its identity and data carry into repair, resale and recycling", {
        fact: "Identity survives into next life"
      }),
      o("repair-parts", 3, "Repair and spare parts are traceable", { fact: "Traceable repair and spare parts" }),
      o("delivery-only", 1, "We track it to delivery, then lose the thread", {
        fact: "Identity lost after delivery", flags: ["lifecycle-gap"]
      }),
      o("none", 0, "Once it is sold, it is gone", {
        fact: "No life after sale in the data", flags: ["lifecycle-gap", "source-of-friction"]
      })
    ]
  },

  "nextLife.unlock": {
    id: "nextLife.unlock",
    stage: "nextLife",
    kind: "base",
    prompt: "If this information were connected tomorrow, what should it unlock first?",
    detail: "Pick the one that matters most from your seat.",
    // A preference, not evidence: it sets the priority and opportunity, never a capability score.
    captures: [],
    spineTouch: [],
    options: [
      o("faster-answers", 3, "Faster answers for customers and colleagues", {
        opportunity: "faster-buyer-proof", priorityDim: "informationRetrieval"
      }),
      o("sales-proof", 3, "Proof that wins deals", {
        opportunity: "faster-buyer-proof", priorityDim: "salesEnablement"
      }),
      o("passport-ready", 3, "Being ready for the Digital Product Passport", {
        opportunity: "dpp-foundation", priorityDim: "dppAvailability"
      }),
      o("second-life", 3, {
        furniture: "Repair, spare parts and re-upholstery services",
        battery: "Second life, refurbishment and recycling value",
        textile: "Repair, resale and take-back"
      }, { opportunity: "repair-lifecycle", priorityDim: "lifecycleCapability" })
    ]
  }
};

/** Base order; follow-ups are inserted by `nextScenarioId`. */
const BASE_ORDER = [
  "product.perspective",
  "product.identity",
  "material.composition",
  "component.bom",
  "supplier.depth",
  "logistics.handoff",
  "factory.evidence",
  "data.location",
  "data.owner",
  "passport.carrier",
  "nextLife.continuity",
  "nextLife.unlock"
];

const MAX_FOLLOWUPS = 2;

// ------------------------------------------------------------------- helpers

function pick(value, branch) {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return value[branch] ?? value.furniture ?? Object.values(value)[0];
}

export function getJourneyScenario(id) {
  const s = JOURNEY_SCENARIOS[id];
  if (!s) throw new Error(`Unknown journey scenario: ${id}`);
  return s;
}

function optionsFor(scenario, branch) {
  return scenario.options.filter((opt) => !opt.branches || opt.branches.includes(branch));
}

function historyEntry(state, id) {
  return state.history.find((h) => h.scenarioId === id) || null;
}

function flagsOf(state) {
  const set = new Set();
  for (const h of state.history) for (const f of h.flags || []) set.add(f);
  return set;
}

// --------------------------------------------------------------------- state

/**
 * @param {{ branch: keyof typeof BRANCHES }} opts
 */
export function createJourney({ branch }) {
  const b = BRANCHES[branch];
  if (!b) throw new Error(`Unknown branch: ${branch}`);
  const spine = {};
  for (const id of SPINE_NODES) spine[id] = { state: "latent", evidence: [] };
  const state = {
    journeyVersion: JOURNEY_VERSION,
    branch,
    sector: b.sector,
    persona: null,
    history: [],
    capabilities: createCapabilities(),
    spine,
    openQuestions: [],
    skippedQuestions: [],
    confidence: 0,
    calculatorHints: { ...b.hints, sector: b.sector },
    flags: [],
    currentNode: BASE_ORDER[0],
    whyThisNext: null,
    lastMotion: null,
    motions: [],
    objectState: "assembled",
    sectorObject: null,
    result: null
  };
  state.sectorObject = resolveSectorObject(state);
  return state;
}

/** Situation for the UI (branch wording resolved; never "Question N of M"). */
export function getJourneySituation(state) {
  if (state.currentNode === "reveal.landscape") {
    return { id: "reveal.landscape", stage: "nextLife", kind: "reveal", options: [] };
  }
  const s = getJourneyScenario(state.currentNode);
  const branch = state.branch;
  return {
    id: s.id,
    stage: s.stage,
    stageLabel: STAGE_LABELS[s.stage],
    kind: s.kind,
    interaction: s.interaction || "select",
    prompt: pick(s.prompt, branch),
    detail: pick(s.detail, branch),
    why: s.kind === "followup" ? s.why || state.whyThisNext : null,
    options: optionsFor(s, branch).map((opt) => ({
      id: opt.id,
      label: pick(opt.label, branch),
      sub: pick(opt.sub, branch),
      soft: !!opt.soft
    })),
    selected: historyEntry(state, s.id)?.optionId || null
  };
}

export function isJourneyComplete(state) {
  return state.currentNode === "reveal.landscape";
}

/** Adaptive router: base order plus at most two evidence-driven follow-ups. */
export function nextScenarioId(state) {
  const done = new Set(state.history.map((h) => h.scenarioId));
  const followups = state.history.filter((h) => getJourneyScenario(h.scenarioId).kind === "followup").length;
  const last = state.history[state.history.length - 1];
  const flags = flagsOf(state);

  if (last && followups < MAX_FOLLOWUPS) {
    // Rule 6: deep traceability claimed → verify before moving on (same shot).
    if (last.scenarioId === "supplier.depth" && last.strength >= 3 && !done.has("supplier.proof")) {
      return "supplier.proof";
    }
    // Rule 7: a supplier dependency → follow it before the next internal question.
    if (last.scenarioId === "logistics.handoff" && flags.has("supplier-dependency") &&
        !done.has("logistics.change")) {
      return "logistics.change";
    }
    // Rule 4: weak or fragmented home for data → one practical retrieval test.
    if (last.scenarioId === "data.location" && last.strength <= 2 && !done.has("data.retrieval")) {
      return "data.retrieval";
    }
  }
  for (const id of BASE_ORDER) {
    if (!done.has(id)) return id;
  }
  return "reveal.landscape";
}

function updateSpine(spine, scenario, strength) {
  const next = {};
  for (const id of SPINE_NODES) next[id] = { state: spine[id].state, evidence: [...spine[id].evidence] };
  for (const id of scenario.spineTouch || []) {
    if (!next[id]) continue;
    const s = clampStrength(strength);
    next[id].state = s >= 4 ? "verified" : s >= 3 ? "connected" : s >= 2 ? "evidenced" : s === 1 ? "uncertain" : "fractured";
    next[id].evidence.push(scenario.id);
  }
  if (scenario.stage !== "product" && next.product.state === "latent") next.product.state = "visited";
  return next;
}

function overallConfidence(capabilities) {
  const withEvidence = Object.values(capabilities).filter((c) => c.evidence.length > 0);
  if (!withEvidence.length) return 0;
  const score = withEvidence.reduce((a, c) => a + (c.confidence === "high" ? 1 : c.confidence === "medium" ? 0.6 : 0.3), 0);
  return Math.round((score / withEvidence.length) * 100) / 100;
}

/**
 * Apply an answer. Re-answering is done by rewinding first (see `rewindTo`).
 * @param {object} state
 * @param {string} optionId
 */
export function answerJourney(state, optionId) {
  if (isJourneyComplete(state)) return state;
  const scenario = getJourneyScenario(state.currentNode);
  const option = optionsFor(scenario, state.branch).find((opt) => opt.id === optionId);
  if (!option) throw new Error(`Unknown option ${optionId} on ${scenario.id}`);
  const strength = clampStrength(option.strength);
  const branch = state.branch;

  const next = { ...state };
  next.history = [
    ...state.history,
    {
      scenarioId: scenario.id,
      stage: scenario.stage,
      optionId: option.id,
      value: pick(option.label, branch),
      fact: option.fact || pick(option.label, branch),
      home: option.home || null,
      strength,
      flags: option.flags ? [...option.flags] : [],
      opportunity: option.opportunity || null,
      boundary: option.boundary || null,
      at: state.history.length
    }
  ];

  if (option.setsPersona) next.persona = option.setsPersona;
  if (option.calculator) next.calculatorHints = { ...next.calculatorHints, ...option.calculator };
  if (option.calculatorHints) next.calculatorHints = { ...next.calculatorHints, ...option.calculatorHints };

  const verb = deriveMotion(scenario, option);
  next.lastMotion = { verb, at: scenario.id, optionId: option.id };
  next.motions = [...(state.motions || []), next.lastMotion];
  next.objectState = advanceObjectState(state.objectState, verb);

  next.capabilities = { ...state.capabilities };
  for (const dimId of scenario.captures || []) {
    if (!next.capabilities[dimId]) continue;
    next.capabilities[dimId] = applyEvidence(next.capabilities[dimId], {
      scenarioId: scenario.id,
      value: pick(option.label, branch),
      strength,
      dependencies: option.dependencies
    });
  }
  if (option.flags?.includes("not-sure")) {
    for (const dimId of scenario.captures || []) {
      const cap = next.capabilities[dimId];
      if (cap?.confidence === "high") next.capabilities[dimId] = { ...cap, confidence: "medium" };
    }
  }

  next.spine = updateSpine(state.spine, scenario, strength);
  if (option.opportunity) {
    next.openQuestions = [...state.openQuestions, { type: "opportunity", id: option.opportunity, from: scenario.id }];
  }
  if (option.priorityDim) {
    next.openQuestions = [...next.openQuestions, { type: "priority", id: option.priorityDim, from: scenario.id }];
  }
  next.confidence = overallConfidence(next.capabilities);
  next.flags = [...flagsOf(next)];
  next.sectorObject = resolveSectorObject(next);

  const nextId = nextScenarioId(next);
  next.currentNode = nextId;
  next.whyThisNext = nextId !== "reveal.landscape" ? JOURNEY_SCENARIOS[nextId].why || null : null;
  return next;
}

/** Replay answers on a fresh journey (used for back navigation and restore). */
export function replayJourney(branch, optionIds, persona = null) {
  let state = createJourney({ branch });
  for (const id of optionIds) {
    if (isJourneyComplete(state)) break;
    try {
      state = answerJourney(state, id);
    } catch {
      break; // stale saved answer (bank changed): stop at the last valid step
    }
  }
  if (persona && !state.persona) state.persona = persona;
  return state;
}

/** Step back one answer without corrupting evidence (rebuild by replay). */
export function undoJourney(state) {
  if (!state.history.length) return state;
  return replayJourney(state.branch, state.history.slice(0, -1).map((h) => h.optionId));
}

/**
 * Journey stage of the scenario the respondent is looking at.
 * @param {object} state
 */
export function currentStage(state) {
  if (isJourneyComplete(state)) return "nextLife";
  return getJourneyScenario(state.currentNode).stage;
}

// ------------------------------------------------------------------ landscape

const HOME_LABELS = {
  people: "People and inboxes",
  documents: "Supplier PDFs and email",
  spreadsheets: "Spreadsheets",
  "systems-partial": "ERP / PLM and side files",
  systems: "Connected ERP / PLM / PIM"
};

/** Map links: which answers carry each relationship on the result map. */
const LINKS = [
  { from: "supplier", to: "material", scenarios: ["supplier.depth", "supplier.proof", "logistics.change"] },
  { from: "material", to: "component", scenarios: ["logistics.handoff", "component.bom"] },
  { from: "component", to: "product", scenarios: ["factory.evidence", "component.bom"] },
  { from: "product", to: "customer", scenarios: ["passport.carrier", "data.retrieval"] },
  { from: "customer", to: "nextLife", scenarios: ["nextLife.continuity"] }
];

function linkState(strengths) {
  if (!strengths.length) return "unknown";
  const min = Math.min(...strengths);
  const avg = strengths.reduce((a, b) => a + b, 0) / strengths.length;
  if (min === 0) return "broken";
  if (min <= 1 || avg < 2) return "weak";
  if (avg >= 3.5) return "verified";
  if (avg >= 2.5) return "connected";
  return "partial";
}

/**
 * The Product Data Landscape for the cinematic journey: Pathfinder's structural
 * result plus the lifecycle facts the journey collected, per spine link.
 * @param {object} state
 */
export function finalizeJourney(state) {
  const base = buildLandscape(state);
  const byScenario = Object.fromEntries(state.history.map((h) => [h.scenarioId, h]));
  const signals = deriveSignals(state.capabilities);

  const links = LINKS.map((link) => {
    const answers = link.scenarios.map((id) => byScenario[id]).filter(Boolean);
    const strengths = answers.map((a) => a.strength);
    return { ...link, state: linkState(strengths), facts: answers.map((a) => ({ text: a.fact, strength: a.strength })) };
  });

  const facts = state.history
    .filter((h) => h.scenarioId !== "product.perspective" && h.scenarioId !== "nextLife.unlock")
    .map((h) => ({ stage: h.stage, scenarioId: h.scenarioId, text: h.fact, strength: h.strength }));

  const home = byScenario["data.location"]?.home || null;
  const result = {
    ...base,
    journey: {
      version: JOURNEY_VERSION,
      branch: state.branch,
      persona: state.persona,
      personaLabel: state.persona ? PERSONAS[state.persona]?.label || state.persona : null,
      links,
      exists: facts.filter((f) => f.strength >= 2),
      structured: facts.filter((f) => f.strength >= 3),
      fragmented: facts.filter((f) => f.strength <= 1),
      home: home ? { id: home, label: HOME_LABELS[home] } : null,
      weakLinks: links.filter((l) => l.state === "weak" || l.state === "broken"),
      signals
    }
  };
  return { ...state, currentNode: "reveal.landscape", result };
}

/** Versioned payload for storage / submission (answers + derived result). */
export function toJourneyPayload(state) {
  return {
    journeyVersion: JOURNEY_VERSION,
    branch: state.branch,
    persona: state.persona,
    answers: state.history.map((h) => ({ scenarioId: h.scenarioId, optionId: h.optionId, value: h.value, strength: h.strength })),
    capabilities: Object.fromEntries(
      Object.entries(state.capabilities).map(([id, c]) => [id, { score: c.score, confidence: c.confidence, status: c.status }])
    ),
    spine: state.spine,
    calculatorHints: state.calculatorHints,
    result: state.result
  };
}
