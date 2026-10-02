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
import { buildDashboard } from "./dashboard.js";

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
 * The level a passport is kept at, per branch. Furniture: the Commission's furniture study (22 September 2026,
 * §7.4) reports stakeholders converging on model level as the pragmatic baseline, batch for justified
 * traceability, item level voluntary — so on the furniture ladders the model / batch answer is the top rung and
 * item level is an unscored "it depends" (it earns its cost in the contract channel: a revenue case, not a
 * compliance one). Textiles are treated the same until their act says otherwise. Batteries: one passport per
 * battery (EU Battery Regulation, Art. 77), so item level stays the top rung there.
 */
export const PASSPORT_LEVEL = Object.freeze({
  furniture: "model as the baseline, batch where origin varies — item level is voluntary (Commission draft, September 2026)",
  battery: "item — one passport per battery",
  textile: "model or batch — the ESPR textile rules will set it"
});

/** The model / batch answer: the top rung where model is the baseline; only partly there for batteries. */
const MODEL_TOP = { furniture: 4, textile: 4, battery: 2 };
/** Item level: an unscored "it depends" on furniture and textiles; scored (the top rung) on batteries. */
const ITEM_LEVEL = { furniture: "depends", textile: "depends" };
const ITEM_NOTE = "Earns its cost in the contract channel — a revenue case, not a compliance one.";

/**
 * Option helper. `label` / `fact` / `sub` / `note` may be a string or a per-branch map; so may `strength` and `rung`.
 * `fact` is the short statement the landscape uses; `note` explains an unscored answer.
 */
function o(id, strength, label, extra = {}) {
  return { id, strength, label, ...extra };
}

/**
 * An unscored rung — a business position, not a gap (review item 12). `rung`:
 *   "depends"  (it depends): a legitimate position, or an answer that varies (`varies: true`)
 *   "unsure"   not sure / would have to ask — shown as a quiet answer under the list
 *   "n/a"      this does not happen to us
 * Unscored answers write no capability evidence and do not move the lifecycle marks. They are stored at
 * strength 2 with the flag `not-applicable` (the review's fallback), so every consumer still sees a number.
 */
function unscored(id, rung, label, extra = {}) {
  return o(id, 2, label, { rung, ...(rung === "unsure" ? { soft: true } : {}), ...extra });
}

export const RUNG_FLAGS = Object.freeze({ depends: "it-depends", unsure: "not-sure", "n/a": "does-not-apply" });

/** Strength of an option on a branch. */
export function strengthFor(option, branch) {
  const s = option.strength;
  return typeof s === "number" ? s : s[branch] ?? s.furniture;
}

/** Unscored rung kind of an option on a branch ("depends" | "unsure" | "n/a"), or null when it is scored. */
export function rungFor(option, branch) {
  const r = option.rung;
  if (!r) return null;
  return typeof r === "string" ? r : r[branch] ?? null;
}

// What the respondent does with the product, not a job title: it names their desk (see DESKS), which decides the
// version of each stop's question they get. Ids and personas are unchanged, so saved journeys replay.
const PERSONA_OPTIONS = [
  o("leadership", 2, "Run the business", { sub: "Direction, budget, key customers", setsPersona: "leadership" }),
  o("product", 2, "Design, make or document it", { sub: "Development, production, specs, PIM / PLM", setsPersona: "product" }),
  o("sustainability", 2, "Check it meets the rules", { sub: "Compliance, sustainability, quality, advice", setsPersona: "sustainability" }),
  o("procurement", 2, "Buy what goes into it", { sub: "Suppliers, materials, contracts", setsPersona: "procurement" }),
  o("sales", 2, "Sell it", { sub: "The questions customers ask", setsPersona: "sales" }),
  o("service", 2, "Look after it once it is sold", { sub: "Parts, repairs, returns", setsPersona: "service" })
];

const EUDR_ROLE_WOOD = ["eu-covered", "mixed"]; // answers that route to the statement-reference question
const EUDR_ROLE_OPERATOR = ["import", "mixed"]; // answers that route to the operator's due-diligence question

/** Furniture: the wood is imported (or both), or it arrives without a reference because they import it themselves. */
function operatorPath(state) {
  return EUDR_ROLE_OPERATOR.includes(answerOf(state, "supplier.role")) || answerOf(state, "supplier.depth") === "we-import";
}

/** @type {Record<string, object>} */
export const JOURNEY_SCENARIOS = {
  "product.perspective": {
    id: "product.perspective",
    stage: "product",
    kind: "base",
    interaction: "select-persona",
    context: true,
    prompt: {
      furniture: "What do you mostly do with this chair?",
      battery: "What do you mostly do with this battery?",
      textile: "What do you mostly do with this jacket?"
    },
    detail: {
      furniture: "Pick the closest. The questions that follow are the ones your desk can answer; the journey stays the same length.",
      battery: "Pick the one closest to the decisions you make. It changes the examples, not the result.",
      textile: "Pick the one closest to the decisions you make. It changes the examples, not the result."
    },
    captures: [],
    options: PERSONA_OPTIONS
  },

  "sales.channel": {
    id: "sales.channel",
    stage: "product",
    kind: "base",
    branches: ["furniture"],
    // Core for everyone (review item 7): it routes and sizes the rest; no score effect.
    context: true,
    prompt: "Who actually buys this chair from you?",
    detail: "The channel decides who asks the awkward questions, and how often. Pick the one that pays most of the salaries.",
    captures: [],
    spineTouch: [],
    options: [
      o("consumer", 3, "Consumers, through our own stores or webshop", { fact: "Consumers, through own stores or webshop" }),
      o("wholesale", 3, "Retailers and dealers who resell it", { fact: "Retailers and dealers" }),
      o("contract", 3, "Contract and project: architects, specifiers, dealers, facility managers", { fact: "Contract and project" }),
      o("public", 3, "Public tenders are a meaningful share", { fact: "Public tenders" }),
      o("mixed", 3, "A genuine mix; none dominates", { fact: "A genuine mix of channels" })
    ]
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
      furniture: "Fabrics, oak finishes and sizes multiply one design into many products. A record per variant is what a model-level passport needs.",
      battery: "Capacities, cell suppliers and firmware multiply one pack into many products — and the battery passport is per individual battery.",
      textile: "Colours and sizes multiply one style into dozens of products. A record per variant is what a model-level passport needs."
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
      o("variant-records", MODEL_TOP, {
        furniture: "Every fabric and finish variant has its own record",
        battery: "Every variant has its own part number and spec",
        textile: "Every colour–size variant has its own SKU record"
      }, { fact: "A record per variant" }),
      o("item-level", 4, {
        furniture: "Every single chair carries its own serial identity",
        battery: "Every pack has a serial number linked to its build",
        textile: "Every garment can be identified individually"
      }, { fact: "Item-level identity", rung: ITEM_LEVEL, note: { furniture: ITEM_NOTE, textile: ITEM_NOTE } }),
      unscored("made-to-order", "depends", { furniture: "Each piece is made to order — no two are quite alike" }, {
        branches: ["furniture"],
        fact: "Made to order",
        note: "A business model, not a maturity level.",
        flags: ["made-to-order"],
        calculatorHints: { madeToOrder: true }
      }),
      unscored("depends", "depends", "It depends on the product line", {
        branches: ["battery"], fact: "Varies by product line", varies: true
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
      o("specified-soc", 4, "Specified per material, with substances of concern declared by the supplier", {
        fact: "Specified per material, substances of concern declared", calculator: { hazardous: 8 }
      }),
      unscored("tested", "depends", "Third-party tested, for the products that carry a label", {
        fact: "Third-party tested where a label requires it",
        note: "The ESPR asks for name or CAS, location and concentration — not third-party testing."
      }),
      unscored("not-sure", "unsure", "Not sure", { fact: "Composition knowledge unclear" })
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
      }),
      unscored("depends", "depends", "It depends on the line: full BOMs for our own designs, less for bought-in pieces", {
        fact: "BOM depth varies by product line", varies: true
      })
    ]
  },

  "supplier.role": {
    id: "supplier.role",
    stage: "supplier",
    kind: "base",
    branches: ["furniture"],
    // Review item 3: a role, not evidence. It routes the wood questions and the EUDR copy; it is never scored.
    context: true,
    prompt: "Does the wood in your products arrive from outside the EU?",
    detail: "Finished wooden furniture, parts, panels or timber that you or your contract manufacturer bring in from outside the EU — or timber bought directly from a forest owner anywhere.",
    captures: [],
    spineTouch: [],
    options: [
      o("import", 3, "Yes — we or our contract makers import it", { fact: "Imports the wood: EUDR operator" }),
      o("eu-covered", 3, "No — it comes from EU suppliers who file their own statements", {
        fact: "Buys within the EU: EUDR downstream operator"
      }),
      o("mixed", 3, "Both, depending on the line", { fact: "Operator for some lines, downstream for others" }),
      o("dont-know", 3, "I would have to ask purchasing", { fact: "EUDR role not known yet", defersTo: "buy" }),
      o("little-wood", 3, "Little or no wood in what we sell", { fact: "Little or no wood: EUDR marginal" })
    ]
  },

  "supplier.depth": {
    id: "supplier.depth",
    stage: "supplier",
    kind: "base",
    branches: ["furniture"],
    // Review item 11: the record-keeping question (downstream operators), reframed from "follow the oak upstream".
    when: (state) => EUDR_ROLE_WOOD.includes(answerOf(state, "supplier.role")),
    prompt: "When wooden furniture, panels or timber reaches you, does it arrive with a due-diligence statement reference number?",
    detail: "The operator who first placed it on the EU market files the statement; its reference number is what travels with the goods.",
    captures: ["traceabilityDepth", "supplierDataQuality"],
    spineTouch: ["supplier", "material"],
    calculatorKeys: ["tiers"],
    options: [
      o("every-delivery", 4, "Every delivery, and we keep the reference against the batch", {
        fact: "Statement reference kept against every batch", calculator: { tiers: 8 }
      }),
      o("most", 3, "Most deliveries; we chase the rest", { fact: "Statement references for most deliveries", calculator: { tiers: 14 } }),
      o("some", 2, "Some suppliers send one; we have not asked the others", {
        fact: "Statement references from some suppliers", calculator: { tiers: 20 }, flags: ["supplier-dependency"]
      }),
      o("none-yet", 1, "Not yet — we have not asked", {
        fact: "No statement references collected yet", calculator: { tiers: 20 }, flags: ["supplier-dependency"]
      }),
      unscored("we-import", "n/a", "It does not arrive with one because we import it ourselves", {
        fact: "Imports its own wood: the operator's due diligence applies"
      }),
      unscored("dont-know", "unsure", "I would have to ask purchasing", { fact: "Statement references: would have to ask purchasing", defersTo: "buy" })
    ]
  },

  "supplier.trace": {
    id: "supplier.trace",
    stage: "supplier",
    kind: "base",
    interaction: "trace-boundary",
    // Furniture: the operator's due-diligence path only (imports, or "we import it ourselves"). Batteries, textiles: always.
    when: (state) => state.branch !== "furniture" || operatorPath(state),
    prompt: {
      furniture: "You bring the wood in, so the due diligence is yours. Follow the oak upstream: where does your visibility stop?",
      battery: "Follow the cells upstream. Where does your visibility stop?",
      textile: "Follow the fabric upstream. Where does your visibility stop?"
    },
    detail: {
      furniture: "Species, country, the harvest plot’s geolocation and the legality evidence — what a due-diligence statement is built from.",
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
        furniture: "To the harvest plot — geolocation and legality evidence on file",
        battery: "To the refinery or mine, with due-diligence evidence",
        textile: "To the fibre source, with traceability evidence"
      }, {
        fact: "Traceable to the raw-material source", calculator: { tiers: 8 },
        boundary: "supplier-of-supplier", flags: ["proof-claimed"]
      }),
      unscored("depends", "depends", {
        furniture: "It depends on the supplier or the species",
        battery: "It depends on the material",
        textile: "It depends on the material"
      }, { fact: "Visibility varies by supplier or material", varies: true, flags: ["supplier-dependency"] })
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
      }),
      unscored("depends", "depends", "It depends on the supplier", { fact: "Proof varies by supplier", varies: true })
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
      o("by-batch", 4, "Yes — each batch keeps its number from delivery to product", {
        fact: "Batch numbers kept through hand-offs", calculator: { dataSharing: 12 }
      }),
      o("by-item", 4, "Yes — down to the individual item", {
        fact: "Item-level continuity through logistics", calculator: { dataSharing: 6 },
        rung: ITEM_LEVEL, note: { furniture: ITEM_NOTE, textile: ITEM_NOTE }
      }),
      unscored("depends", "depends", "It depends on the supplier", {
        branches: ["battery"], fact: "Varies by supplier", varies: true, flags: ["supplier-dependency"]
      })
    ]
  },

  "logistics.change": {
    id: "logistics.change",
    stage: "logistics",
    kind: "followup",
    covers: ["change"],
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
      }),
      unscored("depends", "depends", "It depends on the supplier", { fact: "Varies by supplier", varies: true })
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
      o("per-unit", { furniture: 3, textile: 3, battery: 4 }, "Per unit — timestamped, with test results", {
        fact: "Per-unit production records"
      }),
      unscored("depends", "depends", "It depends on the site or line", { fact: "Varies by site or line", varies: true })
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
      }),
      unscored("not-sure", "unsure", "Not sure", { fact: "Where the data lives is unclear" })
    ]
  },

  "data.retrieval": {
    id: "data.retrieval",
    stage: "data",
    kind: "followup",
    covers: ["answer-speed"],
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
      }),
      unscored("depends", "depends", "It depends on what exactly they ask for", {
        fact: "Varies by the data asked for", varies: true
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
      }),
      unscored("depends", "depends", "It depends on the data — some has an owner, some does not", {
        fact: "Ownership varies by data", varies: true
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
    detail: {
      furniture: "The code on the product is where a passport starts — and model level is the likely baseline for furniture.",
      battery: "The code on the battery is where its passport starts — and it has to open this battery’s own record.",
      textile: "The code on the label is where a passport starts — the textile rules will set the level."
    },
    captures: ["dppAvailability", "salesEnablement", "lifecycleCapability", "commercialUse"],
    spineTouch: ["customer", "product"],
    options: [
      o("no-carrier", 0, "Nothing — there is no identifier to scan", {
        fact: "No data carrier on the product", flags: ["source-of-friction"]
      }),
      o("generic-page", 1, "A generic product page or manual", { fact: "A generic product page" }),
      o("model-data", MODEL_TOP, "Model data: materials, care, documents", { fact: "Model-level data behind a code" }),
      o("item-data", 4, {
        furniture: "This exact chair — its origin, parts and repairs",
        battery: "This exact pack — chemistry, state of health, history",
        textile: "This exact jacket — origin, care and repairs"
      }, { fact: "Item-level data behind a code", rung: ITEM_LEVEL, note: { furniture: ITEM_NOTE, textile: ITEM_NOTE } }),
      unscored("depends", "depends", "It depends on the product — some carry a code, some do not", {
        branches: ["battery"], fact: "A code on some products, not others", varies: true
      })
    ]
  },

  // ---------------------------- sales module (review item 8): furniture, from the Sales & customers seat
  // Stage Customer on the diagram (the passport stop). No module answer writes capability evidence ("do not let
  // either module feed the score"); the four ladders still mark the Customer node. `intendedCaptures` records the
  // dimensions for when a declared weight table exists.
  "sales.volume": {
    id: "sales.volume",
    stage: "passport",
    kind: "reserve",
    module: "sales",
    branches: ["furniture"],
    context: true,
    prompt: "Last month, how many times did a customer ask what a product is made of, where it comes from, or what it is certified to?",
    detail: "Count all of it: a retailer’s product form, a tender annex, an architect’s spec, a portal questionnaire, an email from an end customer.",
    captures: [],
    intendedCaptures: ["commercialUse"],
    spineTouch: [],
    options: [
      o("none", 3, "It does not really come up", { fact: "It does not really come up" }),
      o("quarterly", 3, "A handful a quarter", { fact: "A handful a quarter" }),
      o("monthly", 3, "A few a month", { fact: "A few a month" }),
      o("weekly", 3, "Every week", { fact: "Every week" }),
      o("daily", 3, "Most days; it is part of the job", { fact: "Most days" }),
      o("dont-know", 3, "Honestly no idea; they do not come to me", { soft: true, fact: "No idea; they do not come to sales" })
    ]
  },

  "sales.landing": {
    id: "sales.landing",
    stage: "component",
    kind: "desk",
    desks: ["sell"],
    covers: ["answer-speed"],
    why: "Buyers ask about the parts: the foam, the oak, the finish.",
    module: "sales",
    branches: ["furniture"],
    prompt: "A dealer writes: “Is the foam free of flame retardants, is the oak FSC, and can I have it in writing by four? It is for a tender.” Who ends up answering?",
    detail: "Follow the email to the person who actually writes the reply. Choose the path you would really take.",
    captures: [],
    intendedCaptures: ["salesEnablement", "operationalFriction", "ownership"],
    spineTouch: [],
    options: [
      o("sales-record", 4, "Sales, from a product record they can open and trust", {
        fact: "Today a dealer’s question is answered by sales, from a product record they trust."
      }),
      o("sales-folder", 3, "Sales, after digging through datasheets and certificates in a shared folder", {
        fact: "Today a dealer’s question is answered by sales, after digging through a shared folder."
      }),
      o("forward-internal", 2, "Product, quality or compliance, once sales forwards it; a day or two", {
        fact: "Today a dealer’s question goes to product, quality or compliance and comes back in a day or two."
      }),
      o("forward-supplier", 1, "Someone who first has to ask the supplier; a week if the supplier is quick", {
        fact: "Today a dealer’s question waits on a supplier — a week if the supplier is quick.", flags: ["supplier-dependency"]
      }),
      o("whoever", 0, "Whoever is in that day; sometimes four o’clock passes first", {
        fact: "Today a dealer’s question is answered by whoever is in that day.", flags: ["governance-gap"]
      }),
      unscored("rare", "n/a", "We are rarely asked in that form", { fact: "Dealers rarely ask in that form." })
    ]
  },

  "sales.artefact": {
    id: "sales.artefact",
    stage: "material",
    kind: "desk",
    desks: ["sell"],
    why: "What it is made of, as it reaches your customers.",
    module: "sales",
    branches: ["furniture"],
    prompt: "A specifier wants the chair’s composition and certificates in writing. What do you actually send?",
    detail: "Not what you would like to send. What went out last time.",
    captures: [],
    intendedCaptures: ["dppAvailability", "verificationTrust", "salesEnablement"],
    spineTouch: [],
    options: [
      o("maintained", 4, "A datasheet we maintain, with dated certificates attached and a version number on it", {
        fact: "What goes out is a datasheet you maintain, with dated certificates and a version number."
      }),
      o("own-then-chase", 3, "Our own datasheet, then the certificates once someone finds them", {
        fact: "What goes out is your own datasheet, then the certificates once someone finds them."
      }),
      o("supplier-pdf", 2, "The supplier’s PDF, forwarded as it came", {
        fact: "What goes out is the supplier’s PDF, forwarded as it came."
      }),
      o("memory", 1, "An email from memory, or a phone call to someone in product", {
        fact: "What goes out is an email from memory, or a call to someone in product."
      }),
      o("varies", 0, "It differs every time; whatever we can find that week", {
        fact: "What a customer gets depends on who they ask."
      }),
      unscored("not-in-writing", "n/a", "We are not asked in writing", { fact: "Customers do not ask in writing." })
    ]
  },

  "sales.certificates": {
    id: "sales.certificates",
    stage: "supplier",
    kind: "desk",
    desks: ["sell"],
    why: "Certificates start with your suppliers, and buyers check them.",
    module: "sales",
    branches: ["furniture"],
    prompt: "A tender asks for FSC or PEFC chain of custody, an EPD, or a label such as Möbelfakta, the Nordic Swan, the EU Ecolabel or Indoor Air Comfort. Which of yours are current, today?",
    detail: "Certificates lapse quietly. Tender deadlines do not.",
    captures: [],
    intendedCaptures: ["verificationTrust", "regulatoryReadiness"],
    spineTouch: [],
    options: [
      o("tracked", 4, "We know per product, with expiry dates tracked and one person responsible for renewals", {
        fact: "Certificates known per product, expiry dates tracked"
      }),
      o("company-level", 3, "We know at company level and check per product when a tender lands", {
        fact: "Certificates known at company level, checked per tender"
      }),
      o("would-check", 2, "We think so; we would check with the certifier or the supplier first", {
        fact: "Certificates checked with the certifier or supplier first"
      }),
      o("lapsed-once", 1, "We have found out mid-tender that one had lapsed", { fact: "A certificate has lapsed mid-tender" }),
      o("buyer-tells-us", 0, "We would not know until a buyer told us", { fact: "No certificate register" }),
      unscored("not-required", "n/a", "Our customers do not ask for these", { fact: "Customers do not ask for certificates" })
    ]
  },

  "sales.reorder": {
    id: "sales.reorder",
    stage: "factory",
    kind: "desk",
    desks: ["sell", "service"],
    why: "What the factory recorded decides what you can still make.",
    module: "sales",
    branches: ["furniture"],
    prompt: "A facility manager calls. One chair from the 2,000 you installed in 2018 needs replacing: same fabric, same finish.",
    detail: "Can you tell which chair it was, and can you still make it?",
    captures: [],
    intendedCaptures: ["lifecycleCapability", "traceabilityDepth", "commercialUse"],
    spineTouch: [],
    options: [
      o("project-record", 4, "Yes: project, variant and fabric lot are on record, and we can quote today", {
        fact: "Project, variant and fabric lot on record"
      }),
      o("variant-yes", 3, "Model and variant, yes; the fabric we would match from a sample", {
        fact: "Model and variant on record; fabric matched from a sample"
      }),
      o("old-order", 2, "We would dig out the 2018 order confirmation, if we can find it", {
        fact: "Identity lives in the old order confirmation"
      }),
      o("photo", 1, "We would ask for a photo and a label and work from there", { fact: "The customer becomes the record" }),
      o("current-range", 0, "We could not identify it; we would offer the current range", {
        fact: "Installed chairs cannot be identified later"
      }),
      unscored("no-projects", "n/a", "We do not sell into projects; customers buy the current model", {
        fact: "No project sales"
      })
    ]
  },

  "sales.hours": {
    id: "sales.hours",
    stage: "data",
    kind: "desk",
    desks: ["sell"],
    why: "Every answer costs somebody time.",
    module: "sales",
    branches: ["furniture"],
    context: true,
    prompt: "Last month, roughly how many working hours went into answering customers’ questions about materials, origin or certificates, and whose were they?",
    detail: "Count everyone: sales, product, quality, compliance, and the supplier you chased. Your number, not ours.",
    captures: [],
    intendedCaptures: ["operationalFriction"],
    spineTouch: [],
    options: [
      o("none", 3, "Practically none", { fact: "Practically none" }),
      o("day-sales", 3, "About a day, mostly in sales", { fact: "About a day, mostly in sales" }),
      o("days-mixed", 3, "A few days, split between sales and product or quality", {
        fact: "A few days, split between sales and product or quality"
      }),
      o("week-plus", 3, "A week or more, and it pulled people out of product, quality or compliance", {
        fact: "A week or more, pulling people out of product, quality or compliance"
      }),
      o("everyone", 3, "More than that, or we cannot tell because it is everyone’s side job", {
        fact: "More than that — everyone’s side job"
      }),
      o("want-to-know", 3, "No idea, and I would like to", { soft: true, fact: "No idea yet" })
    ]
  },

  "sales.unbid": {
    id: "sales.unbid",
    stage: "passport",
    kind: "desk",
    desks: ["sell"],
    why: "A passport puts these answers within any buyer’s reach.",
    module: "sales",
    branches: ["furniture"],
    // Last in the module. A conversation item for the call: never priced, not echoed on the result screen.
    context: true,
    prompt: "If any question about material, origin or certification could be answered within a day, what would you bid on that you do not bid on today?",
    detail: "Answer as pipeline, not as principle. If you can name the customer, name it.",
    captures: [],
    intendedCaptures: ["commercialUse"],
    spineTouch: [],
    options: [
      o("nothing", 3, "Nothing; we already bid on everything we want to", { fact: "Nothing new to bid on" }),
      o("public", 3, "Public tenders we skip because of the documentation load", { fact: "Public tenders skipped today" }),
      o("projects", 3, "Larger contract or project specifications with sustainability annexes", {
        fact: "Larger project specifications with sustainability annexes"
      }),
      o("chains-export", 3, "Retail chains or export markets whose onboarding we never attempted", {
        fact: "Retail chains or export markets not attempted"
      }),
      o("frameworks", 3, "Framework agreements or preferred-supplier lists with customers we already have", {
        fact: "Framework agreements with existing customers"
      }),
      o("never-asked", 3, "Hard to say; nobody has put it like that", { soft: true, fact: "Hard to say yet" })
    ]
  },

  // ------------------------ purchasing module (review item 13): furniture, from the Sourcing & supply chain seat
  // Same rules as the sales module: no module answer writes capability evidence ("do not let either module feed
  // the score"); `intendedCaptures` records the dimensions for when a declared weight table exists. Every
  // question carries an "(it depends)" rung that states a business position rather than a gap — the adviser's
  // "best design idea in the run", copied into the core (review item 6). The prompts are the adviser-corrected
  // wording from docs/qualification/…Friday-Plan.md, not the originals in qualification-B.
  "sourcing.topten": {
    id: "sourcing.topten",
    stage: "material",
    kind: "desk",
    desks: ["buy"],
    why: "A material is only as known as the paperwork that comes with it.",
    module: "purchasing",
    branches: ["furniture"],
    context: true,
    prompt: "Your ten biggest suppliers by spend. You ask each one for what they already owe or routinely hold on their last delivery, due in a week.",
    detail: "A substances statement, the fibre composition, the panel’s formaldehyde class, the FSC or PEFC claim on the invoice. Not a full material declaration — furniture suppliers do not owe one. Count the ones you would actually get it from.",
    captures: [],
    intendedCaptures: ["supplierDataQuality", "verificationTrust"],
    spineTouch: [],
    options: [
      o("eight-plus", 4, "Eight or more. For them it is routine.", { fact: "Eight or more of the ten, as routine" }),
      o("five-seven", 3, "Five to seven. The fabric mills and the fittings supplier, yes; the frame and foam suppliers would need longer.", { fact: "Five to seven of the ten" }),
      o("two-four", 2, "Two to four, the ones we already ask regularly.", { fact: "Two to four of the ten" }),
      o("none-week", 1, "None within a week. A month with chasing for most.", { fact: "None within a week" }),
      o("never-asked", 1, "We have not asked in that form. Certificates and test reports when needed, yes.", {
        soft: true, fact: "Never asked in that form"
      })
    ]
  },

  "sourcing.whoasks": {
    id: "sourcing.whoasks",
    stage: "supplier",
    kind: "desk",
    desks: ["assure"],
    module: "compliance",
    branches: ["furniture"],
    // Compliance's own supplier question: how its request reaches a supplier. Asked when the operator's trace
    // question is not on the path (EU-bought wood, "ask purchasing", little wood), so it never doubles it.
    when: (state) => !operatorPath(state),
    prompt: "Compliance needs a substances statement from your biggest frame supplier. How does the request reach them?",
    detail: "The path it would really take, not the org chart.",
    captures: [],
    intendedCaptures: ["collaboration", "ownership", "operationalFriction"],
    spineTouch: [],
    options: [
      o("buyer-logged", 4, "Through the buyer who owns the account, logged with a due date the supplier is later measured on.", {
        fact: "Requests reach suppliers through the buyer, logged with a due date"
      }),
      o("buyer-email", 3, "Through the buyer, by email. They chase when they remember.", {
        fact: "Requests go through the buyer, chased when remembered"
      }),
      o("direct-cc", 2, "Compliance writes to the supplier directly and copies the buyer.", {
        fact: "Compliance writes to suppliers directly, buyer copied", flags: ["needs-clarification"]
      }),
      o("direct-alone", 1, "Compliance writes directly. Purchasing hears about it if the supplier complains.", {
        fact: "Compliance writes to suppliers alone; purchasing hears later", flags: ["governance-gap"]
      }),
      unscored("none-yet", "depends", "We have not had a request like that yet.", { fact: "No request like that yet" })
    ]
  },

  "sourcing.contract": {
    id: "sourcing.contract",
    stage: "supplier",
    kind: "desk",
    desks: ["buy"],
    module: "purchasing",
    branches: ["furniture"],
    prompt: "A supplier misses a documentation request for the third time. What does the agreement let you do?",
    detail: "Framework agreement, supply agreement or purchase-order terms, whichever actually governs them.",
    captures: [],
    intendedCaptures: ["regulatoryReadiness", "supplierDataQuality"],
    spineTouch: [],
    options: [
      o("nothing-written", 0, "Nothing. Documentation is not in the agreement, so it is a favour.", {
        fact: "Documentation is not in the agreement: it is a favour", flags: ["governance-gap", "source-of-friction"]
      }),
      o("on-request", 1, "It says they provide certificates on request. Nothing happens if they do not.", {
        fact: "Certificates on request, with nothing behind it", flags: ["governance-gap"]
      }),
      o("listed-docs", 2, "It lists what they must supply, per delivery or per year. Enforcement is a conversation.", {
        fact: "The agreement lists the documents; enforcement is a conversation", flags: ["needs-clarification"]
      }),
      o("enforceable", 4, "It names the data, the format and the deadline, and ties it to payment, order release or the next review.", {
        fact: "Documentation is enforceable: data, format, deadline, remedy"
      }),
      unscored("varies", "depends", "It varies. The big ones have a signed agreement; the rest run on purchase-order terms.", {
        fact: "Enforcement varies: agreements for the big ones, PO terms for the rest"
      })
    ]
  },

  "sourcing.onboarding": {
    id: "sourcing.onboarding",
    stage: "supplier",
    kind: "reserve",
    module: "purchasing",
    branches: ["furniture"],
    prompt: "A new fabric mill is approved next month. What must they hand over before the first order, and where does it land?",
    detail: "Company and bank details are the minimum everywhere. Count what comes after that.",
    captures: [],
    intendedCaptures: ["dataStructure", "supplierDataQuality"],
    spineTouch: [],
    options: [
      o("commercial-only", 0, "Company details, bank details, an insurance certificate. Into the ERP supplier master.", {
        fact: "Onboarding collects company and bank details only", flags: ["source-of-friction"]
      }),
      o("coc-certs-folder", 1, "Plus a signed code of conduct and their certificates, filed in a folder per supplier.", {
        fact: "Onboarding adds a code of conduct and certificates, filed per supplier"
      }),
      o("article-declaration", 3, "Plus a material and substances declaration per article, checked before the article is released for ordering.", {
        fact: "A material and substances declaration per article before the first order"
      }),
      o("structured-intake", 4, "The same, submitted through a structured form or template, so it is a record rather than an attachment.", {
        fact: "A structured intake: declarations as records, not attachments"
      }),
      unscored("by-category", "depends", "It depends on the category. Wood and fabric get a longer list than fittings and packaging.", {
        fact: "Onboarding depends on the category"
      })
    ]
  },

  "sourcing.contractmade": {
    id: "sourcing.contractmade",
    stage: "factory",
    kind: "desk",
    desks: ["buy"],
    why: "Not every chair is made in your own factory.",
    module: "purchasing",
    branches: ["furniture"],
    // Two rungs share strength 4 on purpose: the key carries the business model, the strength only visibility
    // into the tier below. A contract-heavy brand with nominated inputs is not docked for its model.
    prompt: "Of what sells under your name, how much is made by someone else, and do you know who they buy from?",
    detail: "The upholsterer in Poland, the frame plant in Lithuania, the case-goods factory in Vietnam. Their suppliers, not just them.",
    captures: [],
    intendedCaptures: ["traceabilityDepth", "supplierDataQuality"],
    spineTouch: [],
    options: [
      o("own-mostly", 4, "Mostly our own production. What is contract-made runs on our specification and our nominated inputs.", {
        fact: "Mostly own production; contract-made on nominated inputs"
      }),
      o("nominated", 4, "Most of it is contract-made, but we nominate the wood, foam and fabric suppliers, so the tier below is on our own supplier list.", {
        fact: "Contract-made, with the tier below on our own supplier list"
      }),
      o("list-on-request", 2, "A large share is contract-made. They source their own inputs and would give us the list if we asked.", {
        fact: "Contract-made on their own inputs; the list on request", flags: ["supplier-dependency"]
      }),
      o("their-business", 1, "A large share is contract-made and their sourcing is their business, as long as the spec is met.", {
        fact: "Contract-made; their sourcing is their business", flags: ["supplier-dependency"]
      }),
      unscored("by-line", "depends", "It differs by product line. Upholstery one way, case goods another.", {
        fact: "Contract sourcing differs by product line"
      })
    ]
  },

  "sourcing.irreplaceable": {
    id: "sourcing.irreplaceable",
    stage: "material",
    kind: "followup",
    why: "Few of them can send it within a week. So which ones would hurt to lose?",
    module: "purchasing",
    branches: ["furniture"],
    // A key customer, not "a rule lands": no rule exists for foam and fabric, and a purchasing head would ask
    // which one. This is the one thing compliance cannot own — supply risk is purchasing's.
    prompt: "A key customer makes a declaration from every wood, foam and fabric supplier a condition of the next order, with a date. Which suppliers keep you awake?",
    detail: "The ones holding your tooling, your fabric designs, or a twelve-week lead time to replace.",
    captures: [],
    intendedCaptures: ["regulatoryReadiness", "operationalFriction"],
    spineTouch: [],
    options: [
      o("mapped-asked", 4, "We have a list of single-source and hard-to-switch suppliers, and we have already asked them where they stand on documentation.", {
        fact: "Hard-to-switch suppliers mapped, and asked about documentation"
      }),
      o("known-not-asked", 3, "We know who they are. We have not raised documentation with them.", {
        fact: "Hard-to-switch suppliers known, documentation not raised"
      }),
      o("afternoon", 2, "We could work it out from spend and lead-time data in an afternoon.", {
        fact: "The hard-to-switch list could be worked out in an afternoon"
      }),
      o("when-it-happens", 1, "We have not mapped it. We would find out when it happened.", {
        fact: "Single-source suppliers unmapped", flags: ["supplier-dependency", "source-of-friction"]
      }),
      unscored("few-critical", "depends", "Few of our suppliers are hard to replace. It would be a price question, not a supply question.", {
        fact: "Few suppliers are hard to replace"
      })
    ]
  },

  "sourcing.substitution": {
    id: "sourcing.substitution",
    stage: "logistics",
    kind: "desk",
    desks: ["buy"],
    covers: ["change"],
    module: "purchasing",
    branches: ["furniture"],
    // logistics.change seen from the desk that could stop it. Reading the two together is the cheapest honesty
    // check in the set (review item 15): "automatic" beside "their call" is flagged needs-clarification.
    prompt: "Your contract manufacturer swaps the foam supplier to hold the price. Who at your end finds out, and what gets updated?",
    detail: "Same density on paper, different chemistry, different declaration. It happens a few times a year.",
    captures: [],
    intendedCaptures: ["verificationTrust", "dataStructure", "operationalFriction"],
    spineTouch: [],
    options: [
      o("change-approval", 4, "It needs our written approval first. BOM, declaration and product data are updated as part of the approval.", {
        fact: "Substitutions need written approval; the data is updated with it"
      }),
      o("told-updated", 3, "They tell the buyer. The buyer updates the BOM and passes it to whoever owns product data.", {
        fact: "Substitutions told to the buyer; BOM and product data updated"
      }),
      o("told-only", 2, "They tell the buyer. The BOM gets updated if someone remembers; the product data usually does not.", {
        fact: "Substitutions told to the buyer; the BOM maybe, the product data usually not", flags: ["needs-clarification"]
      }),
      o("discovered", 1, "We find out at a claim, an audit, or when a test report no longer matches.", {
        fact: "Substitutions discovered at claims, audits or mismatched tests", flags: ["source-of-friction"]
      }),
      unscored("their-call", "depends", "If it meets the spec, it is their call. We would not expect to hear.", {
        fact: "Substitutions within spec are the maker’s call"
      })
    ]
  },

  "sourcing.com": {
    id: "sourcing.com",
    stage: "component",
    kind: "followup",
    why: "In contract work, some of the material on the chair is not yours.",
    module: "purchasing",
    branches: ["furniture"],
    // Nobody else asks this: material in the product that none of the company's own suppliers will ever declare.
    prompt: "A contract customer sends their own fabric for a 400-chair order. What do you know about it when the chairs ship under your name?",
    detail: "Customer’s own material: you never bought it, and your label is on the chair.",
    captures: [],
    intendedCaptures: ["verificationTrust", "regulatoryReadiness"],
    spineTouch: [],
    options: [
      o("required-filed", 4, "We require composition, flame-retardant treatment and test reports before we accept it, filed against the order.", {
        fact: "Customer’s own material: composition and tests required, filed against the order"
      }),
      o("fr-checked", 3, "We check flammability for the market it ships to and note the fabric on the order. Composition is whatever the customer says.", {
        fact: "Customer’s own material: flammability checked, composition taken on trust"
      }),
      o("name-only", 2, "We record the fabric name and supplier on the order. Nothing more.", {
        fact: "Customer’s own material: name and supplier on the order, nothing more"
      }),
      o("incoming-goods", 1, "We treat it like any incoming goods. It goes on the chair.", {
        fact: "Customer’s own material goes on like any incoming goods", flags: ["needs-clarification"]
      }),
      unscored("no-com", "n/a", "We do not take customer’s own material, or rarely enough to handle it case by case.", {
        fact: "No customer’s own material"
      })
    ]
  },

  // ------------------ desk versions added with the adaptive path (docs/journey/ADAPTIVE-ASSESSMENT.md)
  "sourcing.pdf": {
    id: "sourcing.pdf",
    stage: "data",
    kind: "desk",
    desks: ["assure"],
    module: "compliance",
    branches: ["furniture"],
    // qualification-B's working-file question, given to compliance: whether supplier evidence becomes data or
    // stays a document. The top rung is a structured form, not "a portal" (Workstream D, finding 9).
    why: "Supplier evidence arrives as documents; the data sits inside them.",
    prompt: "A supplier’s certificate and test report arrive. What happens to the numbers inside them?",
    detail: "Certificate number and expiry, formaldehyde class, flammability result, fibre composition. The values, not the file.",
    captures: [],
    intendedCaptures: ["dataStructure", "verificationTrust", "operationalFriction"],
    spineTouch: [],
    options: [
      o("filed", 0, "The PDF is filed or forwarded. The values stay inside it.", {
        fact: "Supplier evidence is stored as documents; the values stay inside", flags: ["source-of-friction"]
      }),
      o("checked-filed", 1, "Someone checks it against the spec, then files it.", { fact: "Supplier evidence is checked once, then filed as documents" }),
      o("keyed-by-hand", 2, "Key values are typed into a spreadsheet or the ERP by hand.", { fact: "Supplier evidence is re-keyed by hand" }),
      o("structured", 4, "The supplier submits the values in a structured form or template; the PDF sits behind the record as evidence.", {
        fact: "Supplier evidence arrives as data, with the document attached"
      }),
      unscored("depends-desk", "depends", "It depends who receives it. Purchasing files, quality reads, compliance keys in some of it.", {
        fact: "Supplier evidence is handled differently by each desk", varies: true
      })
    ]
  },

  "sales.orders": {
    id: "sales.orders",
    stage: "logistics",
    kind: "desk",
    desks: ["sell", "service"],
    module: "sales",
    branches: ["furniture"],
    // The Sales-Value assessment's "orders flow without delays or errors caused by missing product data":
    // product data seen from the order desk, the one place sales and after-sales both feel it.
    why: "Product details travel with every order, too.",
    prompt: "An order is packed, but the customer still needs a fabric code, a care text or a certificate before it can go. How often does a missing or wrong product detail hold an order up?",
    detail: "Delays, documents sent twice, a return because the label did not match. Count the ones caused by product data, not by stock.",
    captures: [],
    intendedCaptures: ["operationalFriction", "salesEnablement", "dataStructure"],
    spineTouch: [],
    options: [
      o("never", 4, "Practically never: orders and their product details come from the same record", {
        fact: "Orders ship with their product details; data does not hold them up"
      }),
      o("rarely", 3, "Now and then, and it is sorted the same day", { fact: "A missing product detail now and then, sorted the same day" }),
      o("monthly", 2, "Every month or so, and it costs a few days", {
        fact: "Missing product details cost a few days every month or so", flags: ["source-of-friction"]
      }),
      o("often", 1, "Often: a missing detail or a wrong code is a regular reason for delays or returns", {
        fact: "Missing or wrong product details regularly delay or return orders", flags: ["source-of-friction"]
      }),
      unscored("not-seen", "unsure", "I would not see it; the order desk handles that", { fact: "Order delays from product data: not seen from this desk" })
    ]
  },

  "regulation.scope": {
    id: "regulation.scope",
    stage: "passport",
    kind: "desk",
    desks: ["lead"],
    branches: ["furniture"],
    // The Sales-Value assessment's "we know which of our products are in scope, and by when", for the desk that
    // decides. Awareness, not evidence: context, never scored. No furniture date exists, so it asks for a
    // mapping, not a date (Workstream D, finding 1); the detail carries Stefan's corrected EUDR wording.
    context: true,
    prompt: "A board member asks which of your products the EU rules touch first, and when. What can you say?",
    detail: "EUDR covers wooden furniture from 30 December 2026 (micro and small makers of wooden seats: June 2027). A furniture passport comes later, on a date not yet set.",
    captures: [],
    intendedCaptures: ["regulatoryReadiness", "ownership"],
    spineTouch: [],
    options: [
      o("mapped", 3, "We have it mapped: which lines carry wood, and what the ecodesign plan says about furniture", { fact: "The rules are mapped to the product lines" }),
      o("eudr-known", 3, "We know which lines EUDR touches; the passport we follow as it develops", { fact: "EUDR is mapped; the passport is followed as it develops" }),
      o("aware", 3, "We know rules are coming; we have not mapped them to our products", { fact: "Aware of the rules, not mapped to products" }),
      o("not-looked", 3, "We have not looked into it yet", { fact: "Not looked into yet" }),
      o("customer-led", 3, "We act when our customers ask for it", { fact: "Acts when customers ask" })
    ]
  },

  "nextLife.continuity": {
    id: "nextLife.continuity",
    stage: "nextLife",
    kind: "base",
    skipDesks: ["buy"], // purchasing does not see the chair after it is sold; the close question still comes
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
        fact: "Identity survives into next life",
        rung: ITEM_LEVEL, note: { furniture: "Real for the contract channel, optional for retail.", textile: "Optional unless the textile rules ask for it." }
      }),
      o("repair-parts", { furniture: 4, textile: 4, battery: 3 }, "Repair and spare parts are traceable", {
        fact: "Traceable repair and spare parts"
      }),
      o("delivery-only", 1, "We track it to delivery, then lose the thread", {
        fact: "Identity lost after delivery", flags: ["lifecycle-gap"]
      }),
      o("none", 0, "Once it is sold, it is gone", {
        fact: "No life after sale in the data", flags: ["lifecycle-gap", "source-of-friction"]
      }),
      unscored("depends", "depends", "It depends on the channel or customer", {
        branches: ["battery"], fact: "Varies by channel or customer", varies: true
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
    context: true,
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

/** Base order (with the conditional questions in place); follow-ups are inserted by `nextScenarioId`. */
// ---------------------------------------------------------------- adaptive path
/**
 * One short path per respondent (docs/journey/ADAPTIVE-ASSESSMENT.md). The stops are the same for everyone; what
 * changes is which version of a stop's question is asked. The seat answer names the respondent's desk, and each
 * slot asks that desk's version when it has one, else the common version. Later answers refine the path: they
 * decide which wood questions apply, "I would have to ask purchasing" closes purchasing's questions, two desks'
 * versions of the same topic never both appear, and follow-ups slot in after the answer that calls for them.
 * The other desks' versions stay in the bank: large coverage, small path.
 */
export const DESKS = Object.freeze({
  lead: Object.freeze({ persona: "leadership", label: "Leadership" }),
  make: Object.freeze({ persona: "product", label: "Design, production and product data" }),
  assure: Object.freeze({ persona: "sustainability", label: "Compliance" }),
  buy: Object.freeze({ persona: "procurement", label: "Purchasing" }),
  sell: Object.freeze({ persona: "sales", label: "Sales" }),
  service: Object.freeze({ persona: "service", label: "After-sales" })
});
const DESK_OF_PERSONA = Object.fromEntries(Object.entries(DESKS).map(([desk, d]) => [d.persona, desk]));

/** Question positions in travel order; each asks its first fitting candidate (`slotChoice`), or is skipped. */
export const SLOTS = Object.freeze(
  [
    { id: "seat", ask: ["product.perspective"] },
    { id: "channel", ask: ["sales.channel"] },
    { id: "identity", ask: ["product.identity"] },
    { id: "material", ask: ["sourcing.topten", "sales.artefact", "material.composition"] },
    { id: "component", ask: ["sales.landing", "component.bom"] },
    { id: "supplier", ask: ["sales.certificates", "supplier.role"] },
    { id: "supplier.reference", ask: ["supplier.depth"] },
    { id: "supplier.trace", ask: ["supplier.trace"] },
    { id: "supplier.request", ask: ["sourcing.whoasks", "sourcing.contract"] },
    { id: "logistics", ask: ["sourcing.substitution", "sales.orders", "logistics.handoff"] },
    { id: "factory", ask: ["sourcing.contractmade", "sales.reorder", "factory.evidence"] },
    { id: "data", ask: ["data.location"] },
    { id: "data.care", ask: ["sourcing.pdf", "sales.hours", "data.owner"] },
    { id: "passport", ask: ["sales.unbid", "passport.carrier"] },
    { id: "passport.scope", ask: ["regulation.scope"] },
    { id: "nextLife", ask: ["nextLife.continuity"] },
    { id: "close", ask: ["nextLife.unlock"] }
  ].map((slot) => Object.freeze({ ...slot, ask: Object.freeze(slot.ask) }))
);

/** In the bank, on no path yet: kept for the call sheet and later variants (kind "reserve"). */
export const RESERVE = Object.freeze(["sales.volume", "sourcing.onboarding"]);

const MAX_FOLLOWUPS = 2;

/** Every question a slot can ask, in travel order (follow-ups slot in after the answer that calls for them). */
export const JOURNEY_ORDER = Object.freeze([...new Set(SLOTS.flatMap((slot) => slot.ask))]);

/** Question sets written for one desk (docs/qualification): where a version comes from, and its end-pane tag. */
export const MODULES = Object.freeze({
  sales: Object.freeze({
    label: "Sales",
    desk: "Sales desk",
    branches: ["furniture"],
    scenarios: Object.freeze(
      Object.values(JOURNEY_SCENARIOS).filter((sc) => sc.module === "sales").map((sc) => sc.id)
    )
  }),
  purchasing: Object.freeze({
    label: "Sourcing",
    desk: "Sourcing desk",
    branches: ["furniture"],
    scenarios: Object.freeze(
      Object.values(JOURNEY_SCENARIOS).filter((sc) => sc.module === "purchasing").map((sc) => sc.id)
    )
  }),
  // Two of Workstream B's questions, asked of compliance (how its request reaches a supplier; what becomes of
  // the numbers in a certificate): tagged for the desk that answers them, not the set they were written in.
  compliance: Object.freeze({
    label: "Compliance",
    desk: "Compliance desk",
    branches: ["furniture"],
    scenarios: Object.freeze(
      Object.values(JOURNEY_SCENARIOS).filter((sc) => sc.module === "compliance").map((sc) => sc.id)
    )
  })
});

/** The tag an end-pane item shows for a desk set's answers ("Sales desk", "Sourcing desk"); null when common. */
export function deskTag(moduleId) {
  const m = moduleId && MODULES[moduleId];
  return m ? m.desk : null;
}

/** Why each question that is not asked of everyone is asked — documentation for `when` and the slots. */
export const CONDITIONAL_RULES = Object.freeze({
  "sales.channel": "Furniture: everyone, right after the seat. It routes and sizes the rest; never scored.",
  "supplier.role": "Furniture, every desk except sales, before any wood question: it decides whether EUDR is a filing duty (import) or record-keeping (EU suppliers).",
  "supplier.depth": "Furniture, when the wood comes from EU suppliers or both ways. Not after “I would have to ask purchasing”: that is answered once.",
  "supplier.trace": "Batteries and textiles always. Furniture only on the operator path: the wood is imported (or both), or it arrives without a reference because they import it themselves.",
  "sourcing.whoasks": "Furniture, the compliance desk, when the operator's trace question is not on the path.",
  "regulation.scope": "Furniture, the leadership desk, after the passport question: which products the rules touch, and when.",
  "nextLife.continuity": "Every desk except purchasing, which does not see the chair after it is sold.",
  ...Object.fromEntries(
    Object.values(JOURNEY_SCENARIOS)
      .filter((sc) => sc.kind === "desk" && !["sourcing.whoasks", "regulation.scope"].includes(sc.id))
      .map((sc) => [
        sc.id,
        `Furniture: the ${sc.desks.map((d) => DESKS[d].label.toLowerCase()).join(" and ")} desk's version of the ${sc.stage} stop.`
      ])
  ),
  ...Object.fromEntries(RESERVE.map((id) => [id, "In the bank, on no path yet."]))
});

/** Context answers (seat, channel, EUDR role, the sourcing count, sales hours and pipeline, scope, priority): shown, never scored. */
export const CONTEXT_SCENARIO_IDS = Object.freeze(
  Object.values(JOURNEY_SCENARIOS).filter((sc) => sc.context).map((sc) => sc.id)
);

/** The option id answered for a scenario so far, or null. */
function answerOf(state, id) {
  return state.history.find((h) => h.scenarioId === id)?.optionId ?? null;
}

/** Can a scenario be asked on this journey (branch, earlier answers)? The desk is the slots' business. */
export function appliesTo(scenario, state) {
  if (scenario.kind === "reserve") return false;
  if (scenario.branches && !scenario.branches.includes(state.branch)) return false;
  if (scenario.when && !scenario.when(state)) return false;
  return true;
}

/** Is a history entry scored (not an unscored rung)? */
export function isScored(entry) {
  return !entry.flags?.includes("not-applicable");
}

/** The respondent's desk (from the seat answer) and the desks their answers defer to. Recomputed from answers. */
export function deskProfile(state) {
  const defers = new Set();
  for (const h of state.history) {
    const opt = JOURNEY_SCENARIOS[h.scenarioId]?.options.find((x) => x.id === h.optionId);
    if (opt?.defersTo) defers.add(opt.defersTo);
  }
  return { desk: DESK_OF_PERSONA[state.persona] || null, defers };
}

function coveredTopics(state) {
  return new Set(state.history.flatMap((h) => JOURNEY_SCENARIOS[h.scenarioId]?.covers || []));
}

/** May this scenario still be asked: it applies, its topic is not covered, its desk is not one they defer to. */
function askable(sc, state, profile, covered) {
  return (
    appliesTo(sc, state) &&
    !(sc.covers || []).some((t) => covered.has(t)) &&
    !(sc.desks || []).some((d) => profile.defers.has(d)) &&
    !(sc.skipDesks || []).includes(profile.desk)
  );
}

/** The question a slot asks now: the respondent's desk version, else the common version, else none. */
function slotChoice(slot, state, profile, covered) {
  const fits = slot.ask.map((id) => JOURNEY_SCENARIOS[id]).filter((sc) => askable(sc, state, profile, covered));
  return fits.find((sc) => sc.desks?.includes(profile.desk)) || fits.find((sc) => !sc.desks) || null;
}

/** When each follow-up is asked — documentation for the rules in `followupFor` (kept next to them). */
export const FOLLOWUP_RULES = Object.freeze({
  "supplier.proof": "Right after supplier.trace, when that answer claims deep traceability (strength 3 or more).",
  "logistics.change": "Right after logistics.handoff, when any answer so far flagged a supplier dependency (never beside the purchasing desk's substitution question).",
  "data.retrieval": "Right after data.location, when that answer is weak or partial (strength 2 or less); not for sales, whose dealer-email question already tests it.",
  "sourcing.irreplaceable": "Purchasing desk, right after sourcing.topten, when four or fewer of the top ten could send it within a week.",
  "sourcing.com": "Contract or public-tender channel, right after the component question, for the desks that handle materials (design and production, purchasing, compliance).",
  budget: `At most ${MAX_FOLLOWUPS} follow-ups per journey; they never replace a stop's question.`
});

/** The follow-up the last answer calls for, or null. */
function followupFor(state, done, profile, covered) {
  const used = state.history.filter((h) => JOURNEY_SCENARIOS[h.scenarioId].kind === "followup").length;
  const last = state.history[state.history.length - 1];
  if (!last || used >= MAX_FOLLOWUPS) return null;
  const open = (id) => !done.has(id) && askable(JOURNEY_SCENARIOS[id], state, profile, covered);
  const flags = flagsOf(state);
  // Rule 6: deep traceability claimed → verify before moving on (same shot).
  if (last.scenarioId === "supplier.trace" && isScored(last) && last.strength >= 3 && open("supplier.proof")) return "supplier.proof";
  // Rule 7: a supplier dependency → follow it before the next internal question.
  if (last.scenarioId === "logistics.handoff" && flags.has("supplier-dependency") && open("logistics.change")) return "logistics.change";
  // Rule 4: weak or fragmented home for data → one practical retrieval test.
  if (last.scenarioId === "data.location" && last.strength <= 2 && open("data.retrieval")) return "data.retrieval";
  // Purchasing: few suppliers can send what they owe → which of them would hurt to lose?
  if (last.scenarioId === "sourcing.topten" && last.strength <= 2 && open("sourcing.irreplaceable")) return "sourcing.irreplaceable";
  // Contract work, from a desk that handles materials: material on the chair the company never bought.
  if (
    last.scenarioId === "component.bom" &&
    ["contract", "public"].includes(answerOf(state, "sales.channel")) &&
    ["make", "buy", "assure"].includes(profile.desk) &&
    open("sourcing.com")
  ) {
    return "sourcing.com";
  }
  return null;
}

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

/** Options on a branch: strength, unscored rung (flags `not-applicable` + its kind, strength 2) and note resolved. */
function optionsFor(scenario, branch) {
  return scenario.options
    .filter((opt) => !opt.branches || opt.branches.includes(branch))
    .map((opt) => {
      const rung = rungFor(opt, branch);
      const out = { ...opt, strength: rung ? 2 : strengthFor(opt, branch), rung, note: pick(opt.note, branch) };
      if (rung) out.flags = [...new Set([...(opt.flags || []), "not-applicable", RUNG_FLAGS[rung]])];
      return out;
    });
}

function historyEntry(state, id) {
  return state.history.find((h) => h.scenarioId === id) || null;
}

/**
 * Review item 15: the cheapest honesty check in the set. `logistics.change` (compliance's view: a supplier
 * change propagates automatically) beside `sourcing.substitution` (purchasing's view: within spec it is the
 * maker's call, we would not expect to hear) contradict each other. Whichever is answered second carries the
 * `needs-clarification` flag, so the contradiction surfaces for the call instead of passing silently.
 */
function derivedFlags(scenario, option, state) {
  const flags = [];
  const change = answerOf(state, "logistics.change");
  const sub = answerOf(state, "sourcing.substitution");
  if (scenario.id === "logistics.change" && option.id === "automatic" && sub === "their-call") flags.push("needs-clarification");
  if (scenario.id === "sourcing.substitution" && option.id === "their-call" && change === "automatic") flags.push("needs-clarification");
  return flags;
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
    currentNode: SLOTS[0].ask[0],
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
    why: s.kind === "followup" ? s.why || state.whyThisNext : s.why || null,
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

/** Adaptive router: the follow-up the last answer calls for, else the next slot's question, forward only. */
export function nextScenarioId(state) {
  const done = new Set(state.history.map((h) => h.scenarioId));
  const profile = deskProfile(state);
  const covered = coveredTopics(state);
  const followup = followupFor(state, done, profile, covered);
  if (followup) return followup;
  let from = 0; // never back to a slot before the last one answered: the journey only travels forward
  SLOTS.forEach((slot, i) => {
    if (slot.ask.some((id) => done.has(id))) from = i + 1;
  });
  for (const slot of SLOTS.slice(from)) {
    const sc = slotChoice(slot, state, profile, covered);
    if (sc) return sc.id;
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
      flags: [...new Set([...(option.flags || []), ...derivedFlags(scenario, option, state)])],
      opportunity: option.opportunity || null,
      boundary: option.boundary || null,
      rung: option.rung || null,
      note: option.note || null,
      at: state.history.length
    }
  ];

  if (option.setsPersona) next.persona = option.setsPersona;
  const scored = !option.rung;
  if (option.calculator && scored) next.calculatorHints = { ...next.calculatorHints, ...option.calculator };
  if (option.calculatorHints) next.calculatorHints = { ...next.calculatorHints, ...option.calculatorHints };

  const verb = deriveMotion(scenario, option);
  next.lastMotion = { verb, at: scenario.id, optionId: option.id };
  next.motions = [...(state.motions || []), next.lastMotion];
  next.objectState = advanceObjectState(state.objectState, verb);

  next.capabilities = { ...state.capabilities };
  for (const dimId of scored ? scenario.captures || [] : []) {
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

  next.spine = updateSpine(state.spine, scored ? scenario : { ...scenario, spineTouch: [] }, strength);
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
  { from: "supplier", to: "material", scenarios: ["supplier.depth", "supplier.trace", "supplier.proof", "logistics.change"] },
  { from: "material", to: "component", scenarios: ["logistics.handoff", "component.bom"] },
  { from: "component", to: "product", scenarios: ["factory.evidence", "component.bom"] },
  { from: "product", to: "customer", scenarios: ["passport.carrier", "data.retrieval", "sales.landing", "sales.artefact", "sales.certificates"] },
  { from: "customer", to: "nextLife", scenarios: ["nextLife.continuity", "sales.reorder"] }
];

/** State of a set of answers: from the scored ones; "open" when only unscored rungs speak to it. */
export function answersState(entries) {
  const scored = entries.filter(isScored);
  if (!scored.length) return entries.length ? "open" : "unknown";
  return linkState(scored.map((e) => e.strength));
}

export function linkState(strengths) {
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
    return {
      ...link,
      state: answersState(answers),
      facts: answers.filter(isScored).map((a) => ({ text: a.fact, strength: a.strength }))
    };
  });

  const facts = state.history
    .filter((h) => !CONTEXT_SCENARIO_IDS.includes(h.scenarioId) && isScored(h))
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
    answers: state.history.map((h) => ({
      scenarioId: h.scenarioId, optionId: h.optionId, value: h.value, strength: h.strength,
      ...(isScored(h) ? {} : { unscored: h.rung })
    })),
    capabilities: Object.fromEntries(
      Object.entries(state.capabilities).map(([id, c]) => [id, { score: c.score, confidence: c.confidence, status: c.status }])
    ),
    spine: state.spine,
    calculatorHints: state.calculatorHints,
    result: state.result
  };
}

/**
 * The lead submission POSTed to /api/submit (contract shared by api/inbox.js and server.py: an object with
 * lead.email + lead.company, under 200 KB). Carries the answers plus the internal scores and dashboard counts
 * (not shown to the respondent for now — the end pane shows their answers on the lifecycle), so the scoring
 * can be revisited against real submissions once it has a defensible weighting.
 * @param {object} state finalized journey
 * @param {{ firstName?: string, lastName?: string, email: string, company: string, role?: string }} lead
 */
export function toSubmissionPayload(state, lead) {
  const p = toJourneyPayload(state);
  const dash = buildDashboard(state);
  return {
    lead,
    answers: p.answers,
    scores: {
      branch: state.branch,
      persona: state.persona,
      capabilities: p.capabilities,
      timeline: state.result.internal.timeline,
      landscape: {
        foundation: state.result.foundation,
        fragmentation: state.result.fragmentation,
        nextCapability: state.result.nextCapability,
        opportunities: state.result.opportunities,
        dppPlate: state.result.dppPlate,
        links: state.result.journey.links
      },
      dashboard: {
        version: dash.version,
        progress: dash.progress.map(({ id, complete, partial, total, pct }) => ({ id, complete, partial, total, pct })),
        monitoring: dash.monitoring.map(({ id, ok, needs, total }) => ({ id, ok, needs, total }))
      }
    },
    personality: { name: state.result.personaInterpretation?.headline || "" }
  };
}

