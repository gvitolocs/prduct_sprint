# PRDUCT Data Pathfinder specification

**Phase:** information architecture and interaction design  
**Status:** design-ready; no production UI changes in this phase  
**Date:** 2026-09-23  
**Governing principle:** The user feels that they are exploring their company
while PRDUCT quietly constructs a model of it.

## 0. Baseline and design response

The current assessment is a linear 12-choice quiz. It already contains useful
signals: company size, portfolio and product complexity, data location,
supplier sharing, supply-chain tiers, contracts, certification, hazardous
substances, ownership, commercial intent, and trust. Its results currently
produce a timeline, maturity meters, DPP field gaps, and a named personality.

The Pathfinder keeps those diagnostic meanings, but changes the experience:

| Current surface | Pathfinder replacement |
|---|---|
| “Question 4 of 12” and percentage bar | Product-data spine that gains structure |
| Abstract 1–5 maturity claims | Concrete situations and evidence boundaries |
| Same wording for everyone | Persona-specific scenarios mapped to shared capabilities |
| All questions always asked | Evidence-driven branches and targeted follow-ups |
| Blurred score paywall | Transparent promise: build your Product Data Landscape |
| Timeline/personality as primary result | Structural landscape: foundation, fracture, next move, opportunity |

The implementation must preserve the current calculator-compatible inputs where
they are needed for timeline comparison. They become contextual signals rather
than the visible product language.

---

## 1. Canonical capability model

Every response writes evidence to one or more of these dimensions. A dimension
has a score, confidence, evidence list, dependency list, and status:

```js
{
  score: 0..100,
  confidence: "low" | "medium" | "high",
  evidence: [{ scenarioId, value, strength }],
  dependencies: ["supplier-data"],
  status: "unknown" | "fragmented" | "emerging" | "operational" | "trusted"
}
```

### Dimensions

| ID | Canonical dimension | What it measures | Existing evidence to preserve |
|---|---|---|---|
| `traceabilityDepth` | Traceability depth | How far a product can be followed backwards and forwards | Supplier tiers, wood sourcing, component/material chain |
| `informationRetrieval` | Information retrieval | Speed and reliability of finding a requested product fact | Data location, customer request, cross-department handoff |
| `supplierDataQuality` | Supplier data quality | Completeness, freshness, consistency, and enforceability of supplier data | Supplier sharing, contracts, tier visibility |
| `verificationTrust` | Verification / trust | Whether claims are supported, current, attributable evidence | Certifications, REACH picture, confidence in data |
| `dataStructure` | Data structure and system integration | Whether product data has a shared model and connected system home | ERP/PLM availability, spreadsheets, manual sources |
| `dppAvailability` | DPP data availability | Readiness of required fields for a product passport | Composition, wood, hazards, durability, carbon, end-of-life |
| `ownership` | Organisational ownership | Named accountable owner, mandate, budget, and decision rights | Current ownership question |
| `collaboration` | Cross-functional collaboration | Ability of departments to answer and maintain data together | Leadership, product, sustainability, procurement, service handoffs |
| `commercialUse` | Commercial use of product data | Whether trusted data creates customer value rather than only compliance | Current commercial-intent question |
| `salesEnablement` | Sales enablement | Whether sales can retrieve, explain, and use product proof | Buyer-origin scenario; transparency as differentiator |
| `operationalFriction` | Operational friction | Time, rework, escalation, and failure caused by fragmented data | “Tomorrow morning” retrieval scenario |
| `lifecycleCapability` | After-sales / lifecycle capability | Repair, spare parts, refurbishment, end-of-life, and long-term product identity | Durability, repair, and end-of-life DPP fields |
| `regulatoryReadiness` | Regulatory readiness | Evidence and governance for DPP, EUDR, REACH, and related obligations | Certification, hazardous substances, DPP fields |

### Evidence scale

Every situation maps to a normalized evidence strength:

| Strength | Meaning | Score effect |
|---|---|---:|
| `0` | Unknown, cannot answer, or no owner | 0–20 |
| `1` | Person-dependent, manual, or anecdotal | 21–40 |
| `2` | Partial process, inconsistent coverage | 41–60 |
| `3` | Repeatable process with a system or owner | 61–80 |
| `4` | Verified, connected, maintained, and reusable | 81–100 |

Do not average all dimensions into a single visible grade. Internally, a
weighted maturity score may continue to support comparison with the existing
6–30 month timeline calculator.

### Derived signals

The model derives, rather than asks directly for:

- **Retrieval reliability:** `informationRetrieval` + `dataStructure`.
- **Trustworthy passport base:** `traceabilityDepth` + `verificationTrust` +
  `dppAvailability`.
- **Activation gap:** high data dimensions + low `commercialUse` or
  `salesEnablement`.
- **Governance gap:** high data availability + low `ownership` or
  `collaboration`.
- **Supplier dependency:** low `supplierDataQuality` with low or unknown
  `traceabilityDepth`.
- **Lifecycle gap:** adequate product data but low `lifecycleCapability`.

---

## 2. Persona paths

The six paths share the same capability model and journey stages. A persona
changes the scene, vocabulary, and likely next branch; it never creates a
separate scoring system.

| Persona | Opening lens | Signature situations | Most likely emphasis |
|---|---|---|---|
| Leadership / CEO | “A customer request crosses several departments before someone can answer.” | Ownership of the capability; cost of delay; strategic value of proof | Ownership, collaboration, commercial use, operational friction |
| Sales | “A buyer asks for proof of material origin before signing.” | Speed of answer; proof quality; whether sales can reuse the answer | Sales enablement, retrieval, verification, commercial use |
| Product / Data / IT | “A colleague needs a product attribute that is not in the primary system.” | System of record; data model; integration; manual exceptions | Data structure, retrieval, DPP availability, ownership |
| Sustainability / Compliance | “Someone asks you to prove the claim.” | Evidence trail; certification; hazardous substances; regulation changes | Verification, regulatory readiness, traceability, DPP availability |
| Procurement / Supply Chain | “A supplier changes a material.” | Notification, tier visibility, contractual leverage, data freshness | Supplier quality, traceability, verification, operational friction |
| Service / After-sales | “The product leaves your warehouse.” | Identifying the exact product later; repair, parts, refurbishment, end-of-life | Lifecycle capability, traceability, retrieval, collaboration |

### Shared signal examples

| Capability | Sales | Product/Data/IT | Procurement | Leadership |
|---|---|---|---|---|
| Information retrieval | Buyer asks for origin proof | Attribute absent from primary system | Need latest supplier declaration | Request crosses three departments |
| Supplier quality | Sales waits for a supplier PDF | Inbound feed fails validation | Supplier changes specification | Dependency creates recurring delay |
| Ownership | No one can approve the answer | No accountable data steward | Contract owner and product owner disagree | “Who can make this a priority?” |
| Verification | Reuse a verified claim | Track source and timestamp | Compare supplier evidence | Confidence in public claim |
| Commercial use | Use proof to close a deal | Expose reusable product facts | Reduce rework and disputes | Make transparency a proposition |

### Persona selection

Opening copy:

> **You see the product from a particular place.**

Prompt:

> Choose the perspective closest to the decisions you make.

Options are Leadership, Sales, Product / Data / IT, Sustainability /
Compliance, Procurement / Supply Chain, and Service / After-sales. The choice
is a context signal, not a competence judgment. Allow “I work across several”
as a seventh option that uses the leadership/collaboration blend.

---

## 3. Adaptive state and branching model

### State shape

```js
const pathfinderState = {
  persona: null,
  stage: "perspective",
  currentNode: "perspective.select",
  history: [],
  capabilities: {
    traceabilityDepth: capability(),
    informationRetrieval: capability(),
    supplierDataQuality: capability(),
    verificationTrust: capability(),
    dataStructure: capability(),
    dppAvailability: capability(),
    ownership: capability(),
    collaboration: capability(),
    commercialUse: capability(),
    salesEnablement: capability(),
    operationalFriction: capability(),
    lifecycleCapability: capability(),
    regulatoryReadiness: capability()
  },
  spine: {
    supplier: spineNode(),
    material: spineNode(),
    component: spineNode(),
    product: spineNode(),
    customer: spineNode(),
    nextLife: spineNode()
  },
  openQuestions: [],
  skippedQuestions: [],
  confidence: 0,
  result: null
};
```

Each scenario is data, not a component-specific branch:

```js
{
  id: "sales.origin-proof",
  stage: "proof",
  personas: ["sales"],
  prompt: "A buyer asks for proof of material origin before signing.",
  interaction: "evidence-boundary",
  captures: ["informationRetrieval", "salesEnablement", "verificationTrust"],
  options: [
    { id: "instant-verified", strength: 4, next: "value.activation" },
    { id: "search-then-answer", strength: 2, next: "friction.retrieval" },
    { id: "ask-supplier", strength: 1, next: "friction.supplier" },
    { id: "cannot-provide", strength: 0, next: "friction.ownership" }
  ]
}
```

### Journey state machine

```text
perspective.select
  -> reality.location
  -> reality.product-context
  -> friction.trigger
  -> friction.follow-up (only when evidence is weak or ambiguous)
  -> proof.request
  -> proof.verification (only when proof is claimed)
  -> depth.trace-back
  -> depth.trace-forward (persona-dependent)
  -> value.persona-opportunity
  -> horizon.dpp
  -> reveal.landscape
```

The stage names are stable. Node copy, interaction, and branch order are
adaptive.

### Routing rules

1. Start each stage with one high-information scenario.
2. Write evidence to all relevant dimensions.
3. If confidence is high and no contradiction exists, skip the basic follow-up.
4. If score is below 41, open the source-of-friction node.
5. If score is 41–60, ask one clarification about coverage or repeatability.
6. If score is above 60 but confidence is low, ask for verification or an
   example rather than awarding “strong” status.
7. If a response names a supplier dependency, route to supplier quality before
   asking more about internal systems.
8. If availability is high but commercial use is low, route to activation,
   not more data-collection questions.
9. If data is strong but ownership is unclear, route to governance.
10. Never ask a dimension twice in the same wording; a second signal must use a
    different persona-relevant situation.
11. Stop when the model has high confidence in the top two strengths and top two
    gaps, plus at least one opportunity signal.
12. Permit an explicit “not sure” response. It lowers confidence but does not
    pretend the organisation is weak.

### Adaptive stopping

The assessment should usually take 7–10 interactions, not a fixed 12. It may
continue to 12 when the model is ambiguous or the respondent chooses broad
cross-functional context. A small “why this next” line can appear after a
branch:

> **That points to the supplier boundary. Let’s follow it one step further.**

This explains adaptation without exposing a scoring algorithm.

---

## 4. Scenario and interaction library

### Perspective

| Copy | Interaction | Captures |
|---|---|---|
| “You see the product from a particular place.” | Select a perspective | Persona context |
| “Choose the product journey you spend most time inside.” | Select one or multiple areas | Collaboration context |

### Reality

| Copy | Interaction | Captures |
|---|---|---|
| “Where does its information live?” | Arrange or select ERP/PLM, spreadsheet, PDF, email, supplier portal, human knowledge | Data structure, retrieval |
| “Show us the product you know best.” | Choose product complexity and portfolio range | Complexity baseline, timeline |
| “When you need the composition, where do you begin?” | Choose source; optionally drag sources into an order | Retrieval, system integration |

### Friction

| Copy | Interaction | Captures |
|---|---|---|
| “You need this information tomorrow morning.” | Choose immediate, search, ask supplier, cannot answer | Retrieval, friction, supplier quality |
| “A supplier changes a material.” | Choose automatic propagation, notified but manual, discovered later, unknown | Supplier quality, integration, verification |
| “The answer crosses three departments.” | Choose clear handoff, informal collaboration, escalation, no route | Collaboration, ownership, operational friction |

### Proof

| Copy | Interaction | Captures |
|---|---|---|
| “Someone asks you to prove it.” | Choose verified source, internal record, supplier assertion, cannot prove | Verification, regulatory readiness |
| “A buyer asks for proof of material origin before signing.” | Choose proof response path | Sales enablement, commercial use |
| “The claim is true today. How will you know next quarter?” | Choose maintained owner/system, periodic check, ask around, unknown | Verification, ownership |

### Depth

| Copy | Interaction | Captures |
|---|---|---|
| “Now follow the product backwards.” | Interactive chain Product → Component → Material → Supplier → Supplier’s supplier; stop at real boundary | Traceability depth |
| “Which layer becomes uncertain first?” | Tap a node in the chain | Traceability, supplier quality |
| “The product leaves your warehouse.” | Choose whether identity and data survive delivery, repair, resale, or return | Lifecycle capability, forward traceability |

### Value

| Persona | Copy | Captures |
|---|---|---|
| Sales | “Could this answer help close the deal?” | Sales enablement, commercial use |
| Service | “Could this product still be understood five years from now?” | Lifecycle capability, retrieval |
| Leadership | “What would improve first if this information were connected?” | Commercial use, operational friction |
| Sustainability | “Could you demonstrate the claim without rebuilding the evidence trail?” | Verification, regulatory readiness |
| Procurement | “Would a material change be visible before it becomes a customer problem?” | Supplier quality, operational friction |
| Product/Data/IT | “Would the answer be reusable outside your team?” | Data structure, collaboration |

### Horizon

| Copy | Interaction | Captures |
|---|---|---|
| “And if every product needed a passport tomorrow?” | Select the first consequence to address | DPP priority, regulatory readiness |
| “Which part would you want to make trustworthy first?” | Select one spine node or capability | Next-best action |
| “What should this information unlock?” | Choose faster answers, sales proof, compliance, repair, circularity | Opportunity interpretation |

---

## 5. Complete screen-by-screen experience

Each screen is a state, not necessarily a URL or full-page view.

| # | Stage / copy | Purpose and interaction | Captured / branches | Visual and spine state | Transition |
|---:|---|---|---|---|---|
| 1 | **“A product carries more than a name.”** | Quiet entry; begin interaction | Consent, persona not yet known | Faint six-node spine; disconnected source fragments | Sources drift into perspective prompt |
| 2 | **“You see the product from a particular place.”** | Select persona | Persona/context | Spine remains faint; one node receives a hairline highlight | Selected perspective becomes the camera origin |
| 3 | **“Show us the product you know best.”** | Choose product complexity and portfolio context | Complexity baseline, timeline signal | Product node appears; material/component layers remain ghosted | Product separates into layers |
| 4 | **“Where does its information live?”** | Select or arrange source objects | Data structure, retrieval | ERP, spreadsheet, PDF, email, portal, human-knowledge fragments | Selected sources connect to Product with different line qualities |
| 5 | **“You need this information tomorrow morning.”** | Choose the real retrieval path | Retrieval, operational friction, confidence | Customer or internal request travels toward Product; delay shown as distance, not a spinner | Weak path opens a focused friction scene |
| 6 | **“A supplier changes a material.”** | Choose how the change travels | Supplier quality, integration, verification | Supplier → Material line either propagates, breaks, or waits | Broken line opens supplier or systems follow-up |
| 7 | **“Someone asks you to prove it.”** | Choose evidence and freshness | Verification, regulatory readiness | Certificate/evidence layer attaches to Material; stale/unknown evidence stays translucent | Verified evidence strengthens node; unsupported claim branches |
| 8 | **“Now follow the product backwards.”** | Drag/tap through Product → Component → Material → Supplier | Traceability depth | The spine becomes interactive; respondent stops where visibility ends | Camera settles at boundary and records it without shame |
| 9 | **Persona value scene** | One tailored scenario from the value library | Commercial use, sales/lifecycle/operations | Customer or Next Life node appears depending on persona | Strong foundation skips generic activation; weak activation opens one follow-up |
| 10 | **“The product leaves your warehouse.”** | Explore forward identity and lifecycle | Lifecycle capability, collaboration | Product → Customer → Next Life completes or remains fractured | Missing lifecycle evidence routes to horizon |
| 11 | **“And if every product needed a passport tomorrow?”** | Choose first priority and opportunity | DPP availability, next action | Spine gains a subtle regulatory frame; all unresolved nodes remain visible | Zoom out from spine to landscape |
| 12 | **“This is the shape of your product data today.”** | Final Product Data Landscape reveal | Result object; optional lead capture after value is visible | Entire assembled structure; strengths become solid, gaps are precise breaks | Continue to path, export/share, or contact |

### Copy rules

- Never show “Question N of M” or a percentage.
- Use one sentence of context, one action, and one optional clarification.
- Replace “score” with “evidence”, “visibility”, “confidence”, “boundary”, or
  “next layer”.
- Never congratulate a respondent for a weak or strong answer.
- Let the interface acknowledge reality: **“That boundary is useful to see.”**

---

## 6. Persistent data-spine specification

### Spine

```text
SUPPLIER ───── MATERIAL ───── COMPONENT ───── PRODUCT ───── CUSTOMER ───── NEXT LIFE
```

The canonical order is intentionally both backward-traceable and forward-
lifecycle-aware. The spine is a progress system, navigation system, and result
metaphor—not a decorative timeline.

### Node states

| State | Rendering | Meaning |
|---|---|---|
| `latent` | 10% opacity, hairline | Not yet visited |
| `visited` | Visible outline | The journey has reached this layer |
| `evidenced` | Solid fill or material texture | Respondent supplied credible evidence |
| `connected` | Solid line to adjacent node | Relationship is understood and reusable |
| `uncertain` | Dashed line, soft amber accent | Partial or ambiguous evidence |
| `fractured` | Deliberate gap in line | Known dependency or break |
| `verified` | Double line or quiet seal mark | Evidence is attributable and maintained |

### Behaviour

1. Begin as six faint points on one architectural line.
2. On each meaningful answer, update only affected nodes and edges.
3. Never reset the spine between screens.
4. Keep the current layer in view with a restrained camera/scroll movement.
5. Let the spine become the interaction in the traceability scene.
6. Use a small legend only after the first state change; do not explain it all
   upfront.
7. On the result screen, keep the exact accumulated structure; do not replace
   it with a generic chart.
8. On small screens, use a vertical spine or horizontally scrollable rail with
   the current node pinned; preserve the same semantic order.

### Source fragments

Early source fragments are:

`ERP · spreadsheet · PDF · email · certificate · supplier portal · human knowledge`

Fragments should assemble into nodes and edges. A fragment that remains
unconnected is itself a result signal.

---

## 7. Motion principles

### Motion grammar

1. **One meaningful motion per decision.** The movement must show a data
   relationship, a change of confidence, or a change of layer.
2. **Join, do not bounce.** Elements slot together like precise joinery.
3. **Separate to reveal.** Product layers part to expose composition and
   uncertainty.
4. **Follow the data.** Lines carry attention from source to product to use.
5. **Settle with confidence.** Use a longer, quiet settle after a decision;
   avoid celebratory overshoot.
6. **Preserve continuity.** A node that was visited remains in the same visual
   place when the camera moves.
7. **Respect interruption.** Every transition can be paused, reversed, or
   completed immediately without losing state.
8. **Reduced motion keeps meaning.** Replace travel with opacity, border, and
   state changes; never remove the information hierarchy.

### Suggested GSAP implementation vocabulary

- `gsap.context()` for mount/unmount cleanup.
- `gsap.matchMedia()` for desktop rail vs mobile spine.
- Timelines with labels for stage transitions, not chained delays.
- `quickTo()` for pointer/drag-following interactions.
- `ScrollTrigger` only where scroll is the information relationship, not as a
  blanket page effect.
- `Flip` for layer-to-landscape transitions when layout changes.
- `MotionPathPlugin` only for a source fragment travelling along a meaningful
  data path.

### Motion budget

- One entrance transition per state.
- One response transition after selection.
- No ambient particle system.
- No looping motion except a barely perceptible idle signal for the current
  node, and disable it under reduced motion.
- Keep interaction feedback under 250ms; structural transitions 450–850ms;
  result reveal 900–1400ms.

---

## 8. Visual-direction specification

### World

**Nordic product intelligence:** calm, architectural, tactile, and exact.
Furniture construction is a vocabulary of joins, layers, edges, grain, and
fit—not an illustration theme.

### Palette

| Token | Direction | Role |
|---|---|---|
| `paper` | Warm white / soft paper | Main surface |
| `graphite` | Near-black charcoal | Primary type and structural lines |
| `ash` | Pale cool wood grey | Secondary surfaces and inactive spine |
| `oak` | Muted warm timber | Material/evidence accent |
| `moss` | Desaturated natural green | Verified/connected state |
| `oxidized` | Restrained rust/bronze | Uncertainty or dependency |
| `ink-blue` | Deep muted blue | Occasional information emphasis |

Avoid default violet gradients, saturated dashboard colors, neon data maps,
glass blur, and decorative glow. Color should encode confidence and material,
not mood swings.

### Typography and layout

- Use one highly legible grotesk with a strong editorial display scale.
- Large sentence-led prompts, short line lengths, and generous negative space.
- Architectural alignment: a visible baseline, consistent left edge, fine
  rules, and deliberate asymmetry.
- Use cards only when they represent a physical layer or evidence object.
- Preserve accessible focus states and visible controls; premium does not mean
  hidden interaction.

### Content tone

Quiet, direct, non-judgmental:

- “Where does the answer stop?”
- “That boundary is useful to see.”
- “The source exists, but it is not yet connected.”
- “This is the next layer worth making reliable.”

Avoid:

- “Great job!”
- “You are a data hero.”
- “Unlock your score.”
- “Only 3 questions left.”

---

## 9. Product Data Landscape result model

```js
{
  foundation: {
    dimensions: ["traceabilityDepth", "verificationTrust"],
    explanation: "...",
    evidence: [...]
  },
  fragmentation: {
    dimensions: ["supplierDataQuality", "dataStructure"],
    boundary: "supplier -> material",
    explanation: "...",
    dependencies: [...]
  },
  nextCapability: {
    id: "informationRetrieval",
    why: "...",
    firstMove: "...",
    expectedUnlocks: ["salesEnablement", "dppAvailability"]
  },
  opportunities: [
    { id: "faster-buyer-proof", type: "commercial", evidence: [...] },
    { id: "dpp-foundation", type: "regulatory", evidence: [...] }
  ],
  dppImplications: {
    readyFields: [...],
    exposedGaps: [...],
    caveat: "A readiness signal is not legal advice or certification."
  },
  personaInterpretation: {
    headline: "...",
    relevantLens: "...",
    suggestedConversation: "..."
  },
  internal: {
    timelineBand: "12–18 months",
    maturityScore: 0..100,
    confidence: 0..1
  }
}
```

### Reveal sequence

1. The camera zooms out from the final active node.
2. The accumulated spine and source fragments become one landscape.
3. The strongest connected region is labelled **Your strongest foundation**.
4. The first fractured edge is labelled **Where information gets lost**.
5. One evidence-backed next capability is labelled **Make this reliable next**.
6. Opportunity cards appear only after the structural explanation:
   faster buyer answers, DPP preparation, repair/lifecycle continuity, or
   supplier-change control.
7. DPP is shown as a consequence of the data model, not the opening hook.

The primary action is **Explore your path**. A secondary action can share or
download the landscape. A conversation CTA appears after value is delivered:
**Talk through this landscape**.

---

## 10. Implementation architecture

### Modules

```text
assessment/
  pathfinder/
    model.js             // dimensions, capability state, score normalization
    personas.js          // persona copy and emphasis
    scenarios.js         // scenario nodes, options, evidence mappings
    router.js            // branch rules and stopping logic
    spine.js             // node/edge state derived from evidence
    result.js             // Product Data Landscape derivation
    accessibility.js      // reduced motion, keyboard, announcements
  app.js                  // render shell and event wiring
  styles.css              // visual tokens and layout
```

### Separation of concerns

- **Model:** pure functions only; no DOM or network access.
- **Router:** takes state and returns the next scenario; deterministic and
  testable.
- **Spine:** derives visual state from evidence; never becomes the source of
  truth.
- **Renderer:** renders one state at a time and preserves focus.
- **Persistence:** stores a versioned response object; never stores a score
  without its evidence and model version.
- **Submission:** sends the respondent’s answers and derived result only after
  the respondent has seen meaningful value; avoid the current “blurred result,
  mandatory lead” as the primary experience.

### Versioned payload

```js
{
  assessmentVersion: "pathfinder-0.1",
  modelVersion: "capability-model-1",
  persona: "sales",
  history: [...],
  capabilities: {...},
  spine: {...},
  result: {...},
  lead: {...}
}
```

### Accessibility and resilience requirements

- Every situation is operable with keyboard and touch.
- Dragging the traceability chain has a tap/select alternative.
- Use semantic buttons and fieldsets; do not make a canvas-only assessment.
- Announce stage changes and result updates with a polite live region.
- Honour `prefers-reduced-motion`; keep transitions understandable without
  travel.
- Preserve back navigation without corrupting evidence history.
- Never make color the only indicator of verified, uncertain, or fractured.
- If a save request fails, show an explicit status and retain the local draft.

### Implementation order

1. Extract the model, scenarios, router, and result derivation as pure JS.
2. Add deterministic tests for branch rules and dimension mapping.
3. Build the accessible text-first renderer with the spine as semantic markup.
4. Add GSAP transitions behind the same state events.
5. Add persona copy and verify each path reaches the same result schema.
6. Replace the old paywall/result presentation only after the landscape is
   usable without animation.
7. Validate mobile, reduced motion, keyboard, interruptions, and repeated
   mounts before visual polish.

## Acceptance criteria for the next UI phase

- No visible question number or percentage progress bar.
- A respondent can identify their perspective in one interaction.
- At least two personas produce different scenes for the same capability.
- Strong evidence skips a redundant follow-up.
- Weak evidence opens a targeted source-of-friction follow-up.
- The spine remains persistent and accumulates state across screens.
- The final landscape visibly reuses the exact spine state created during the
  journey.
- Existing DPP fields and timeline signals remain represented in the payload.
- A complete run works with keyboard and reduced motion.
- No production UI is changed until the model and routing tests pass.

