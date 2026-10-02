# Adaptive assessment — one short path per respondent

1 October 2026. Implemented in `pathfinder/lifecycle.js` (`SLOTS`, `DESKS`, `followupFor`), covered by
`pathfinder/tests/journey.contracts.test.mjs` (96 tests). The UX, the stops, the animations and the end page are
unchanged; only which question is asked at a stop changes.

**In one line:** the lifecycle stops stay the spine for everyone; the first answer names the respondent's desk, and
each stop asks that desk's version of its question. The full assessment is the bank, the short assessment is the
shape, and a sales director now answers 13 questions instead of about 23.

## 1. The full assessment against the short one

"Full assessment" here is everything written for this tool: the purchasing set (Workstream B, 12 questions), the
sales set (Workstream C, 11), the standards and wood review (A), the adviser's corrections (D), the DPP Sales-Value
Assessment (17 rated statements) and the classic 12-question quiz (`classic.html`). "Short" is the journey as it
stood on the morning of 1 October: 14 common questions, a 7-question sales module from the Sales seat, an
8-question purchasing module from the Sourcing seat (added by another agent that morning, Friday item 13), and
three follow-ups.

| Topic | Short (before) | Where the full set has it | Now |
|---|---|---|---|
| Identity: model / variant / item | `product.identity` | classic `portfolio` | everyone |
| Composition, substances | `material.composition` | B `topten`, classic `hazardous`, Sales-Value "suppliers provide complete data" | common; purchasing answers it as `sourcing.topten`, sales as `sales.artefact` |
| Components / BOM | `component.bom` | classic `productComplexity` | everyone except sales (`sales.landing`) |
| EUDR role, statement references | `supplier.role`, `supplier.depth`, `supplier.trace` | A, D finding 2, B `eudr` | routed by role, as before; sales skips it |
| Supplier data delivery | — (only in the appended module) | B `topten`, Sales-Value | purchasing |
| Supplier agreements and leverage | — (module) | B `contract`, classic `contracts` | purchasing |
| Change control on inputs | `logistics.change` (follow-up) | B `substitution` | one or the other, never both |
| Contract manufacturing visibility | — (module) | B `contractmade`, classic `tiers` | purchasing |
| Customer-supplied material | — (module) | B `com` | follow-up, contract or tender channel |
| Collaboration compliance ↔ purchasing | — (module) | B `whoasks`, Sales-Value "organizational collaboration" | compliance |
| Verification of supplier evidence | `supplier.proof` (follow-up) | B `pdf`, Sales-Value "process to verify data" | compliance (`sourcing.pdf`) |
| Production records | `factory.evidence` | — | everyone except purchasing, sales, after-sales |
| Where data lives, who owns it | `data.location`, `data.owner` | classic `dataAvailability`, `ownership`, Sales-Value "clear owner" | everyone (sales answers `sales.hours` instead of the owner) |
| Answer speed | `data.retrieval` (follow-up) | C `landing`, Sales-Value "retrieve quickly" | one or the other |
| What a customer can reach | `passport.carrier` | Sales-Value "information through the post-sales lifecycle" | everyone except sales (`sales.unbid`) |
| Sales: answers, documents, certificates, reorders, hours, pipeline | sales module | C | sales, one per stop |
| Order flow | — | Sales-Value "orders flow without delays" | **new** `sales.orders`: sales and after-sales |
| Regulation scope and timing | — (the hero tells them) | Sales-Value "which products are in scope, and by when" | **new** `regulation.scope`: leadership |
| After-sales continuity | `nextLife.continuity` | Sales-Value after-sale | everyone except purchasing |
| Priority / mindset | `nextLife.unlock` | Sales-Value "from comply to commercial", classic `commercialIntent` | everyone |

**Missing from the short assessment:**
- supplier data delivery
- supplier agreements
- input substitution
- contract manufacturing visibility
- customer-supplied material
- the compliance–purchasing hand-off
- what happens to certificate values
- order flow
- regulation scope

The first seven existed only as an appended module.

**Redundant or overlapping pairs.** They are now alternatives, never both in one path:
- `logistics.change` / `sourcing.substitution` (one supplier change, seen from two desks)
- `data.retrieval` / `sales.landing` (answer speed)
- `material.composition` / `sales.artefact` / `sourcing.topten` (what the chair is made of, from three desks)
- `passport.carrier` / `sales.unbid` (the customer side)
- `supplier.depth` / B `eudr` (the same reference, before and after 30 December; B `eudr` stays out)

**Only for specific desks:**
- every `sourcing.*` and `sales.*` question except `sales.channel`
- `regulation.scope`

**Useful for everyone:**
- the seat, channel, identity
- where data lives
- the priority close
- the EUDR role (except for sales, who answer certificates instead)

**Answers that infer responsibility:**
- the seat itself
- "I would have to ask purchasing" (on `supplier.role` or `supplier.depth`): closes purchasing's questions for the rest of the path
- the channel: contract or public tenders add the customer-supplied-material follow-up for the desks that handle materials
- the EUDR role and "we import it ourselves": decide which wood questions apply

**Branch points:**
- seat
- channel
- `supplier.role`
- `supplier.depth` (`we-import`)
- the strength of `supplier.trace`, `data.location` and `sourcing.topten`
- a supplier-dependency flag before `logistics.handoff`
- `component.bom` with a contract channel

**Never together:**
- the pairs above
- `supplier.depth` after "ask purchasing" (it would ask the same unknown twice)
- purchasing versions after "ask purchasing"

## 2. The role and context model

One question names the desk: "What do you mostly do with this chair?" It asks what the respondent does with the
product, not their job title. The option ids are unchanged, so saved journeys replay.

| Answer | Desk | Answers best |
|---|---|---|
| Run the business | `lead` | the overview: identity, ownership, priorities, which rules apply |
| Design, make or document it | `make` | composition, components, production, product data |
| Check it meets the rules | `assure` | evidence, verification, the request path to suppliers |
| Buy what goes into it | `buy` | supplier data, agreements, substitutions, contract makers |
| Sell it | `sell` | what customers ask, what is sent, certificates, orders, pipeline |
| Look after it once it is sold | `service` | identification, reorders, order delays, repair continuity |

Context comes from answers asked of everyone anyway:
- `sales.channel` (consumer, retail, contract, tenders)
- `supplier.role` (operator, downstream operator, mixed, unknown, little wood)

Refinement signals:
- `defersTo: "buy"` on "I would have to ask purchasing"
- topic coverage (`covers`), so two desks' views of one topic never both appear

No scores, no AI. The profile is recomputed from the answers, so back navigation and restore stay exact.

## 3. The adaptive logic

- **Slots, in lifecycle order.** Each slot is one question position at one stop. It asks the respondent's desk
  version if one applies, else the common version, else nothing.
- **Forward only.** The router never returns to a slot before the last one answered. The camera only travels
  forward, and every stop keeps at least one question on every path (a test).
- **Follow-ups (at most two)** slot in right after the answer that calls for them:
  - `supplier.proof` after a strong `supplier.trace`
  - `logistics.change` after `logistics.handoff` when a supplier dependency was flagged
  - `data.retrieval` after a weak `data.location` (not for sales: the dealer email already tested it)
  - `sourcing.irreplaceable` after a weak `sourcing.topten`
  - `sourcing.com` after `component.bom` in the contract or tender channel, for design, purchasing and compliance
- **Skip logic:**
  - wood questions by EUDR role
  - purchasing versions after "ask purchasing"
  - next-life continuity for purchasing, who do not see the chair after it is sold
  - topics already covered

## 4. The question map

| Stop | Slot | Leadership | Design / product | Compliance | Purchasing | Sales | After-sales |
|---|---|---|---|---|---|---|---|
| Product | seat | `product.perspective` | ← | ← | ← | ← | ← |
| Product | channel | `sales.channel` | ← | ← | ← | ← | ← |
| Product | identity | `product.identity` | ← | ← | ← | ← | ← |
| Material | material | `material.composition` | ← | ← | **`sourcing.topten`** (+`irreplaceable` if weak) | **`sales.artefact`** | `material.composition` |
| Component | component | `component.bom` | ← (+`sourcing.com`*) | ← (+`sourcing.com`*) | ← (+`sourcing.com`*) | **`sales.landing`** | `component.bom` |
| Supplier | supplier | `supplier.role` | ← | ← | ← | **`sales.certificates`** | `supplier.role` |
| Supplier | reference / trace | by EUDR role | ← | ← | ← | — | by EUDR role |
| Supplier | request | — | — | **`sourcing.whoasks`**† | **`sourcing.contract`** | — | — |
| Logistics | logistics | `logistics.handoff` (+`change`) | ← | ← | **`sourcing.substitution`** | **`sales.orders`** | **`sales.orders`** |
| Factory | factory | `factory.evidence` | ← | ← | **`sourcing.contractmade`** | **`sales.reorder`** | **`sales.reorder`** |
| Data | data | `data.location` (+`retrieval`) | ← | ← | ← | `data.location` | ← |
| Data | care | `data.owner` | ← | **`sourcing.pdf`** | `data.owner` | **`sales.hours`** | `data.owner` |
| Passport | passport | `passport.carrier` | ← | ← | ← | **`sales.unbid`** | `passport.carrier` |
| Passport | scope | **`regulation.scope`** | — | — | — | — | — |
| Next life | next life | `nextLife.continuity` | ← | ← | — | ← | ← |
| Next life | close | `nextLife.unlock` | ← | ← | ← | ← | ← |

Notes on the map:
- **Bold** marks a desk version; ← means the same as the column on its left.
- \* `sourcing.com` (customer-supplied material) is asked only in the contract or public-tender channel.
- † `sourcing.whoasks` is asked when the operator's trace question is not on the path.

## 5. The exact paths

These use typical answers: retail channel, wood bought within the EU, strong answers, so no follow-ups fire. ★ marks
a desk version.

#### Leadership — seat “Run the business” (15 questions)

| # | Stop | Question | Prompt |
|---|---|---|---|
| 1 | Product | `product.perspective` | What do you mostly do with this chair? |
| 2 | Product | `sales.channel` | Who actually buys this chair from you? |
| 3 | Product | `product.identity` | Today, this chair’s identity lives… |
| 4 | Material | `material.composition` | Up close, a chair is a recipe. How well do you know yours? |
| 5 | Component | `component.bom` | Under the cushion: webbing, foam, frame, fittings. Can you tie each material to its component? |
| 6 | Supplier | `supplier.role` | Does the wood in your products arrive from outside the EU? |
| 7 | Supplier | `supplier.depth` | When wooden furniture, panels or timber reaches you, does it arrive with a due-diligence statement reference number? |
| 8 | Logistics | `logistics.handoff` | Timber changes hands several times before it becomes a chair. Does its information travel with it? |
| 9 | Factory | `factory.evidence` | On the production floor, what is recorded about how each chair was made? |
| 10 | Data | `data.location` | So where does all of this actually live today? |
| 11 | Data | `data.owner` | When this information changes, who makes sure it is updated? |
| 12 | Passport | `passport.carrier` | Someone points a phone at the chair. What can they reach today? |
| 13 | Passport | `regulation.scope` ★ | A board member asks which of your products the EU rules touch first, and when. What can you say? |
| 14 | Next life | `nextLife.continuity` | Years later the chair comes back for new upholstery. What still knows it? |
| 15 | Next life | `nextLife.unlock` | If this information were connected tomorrow, what should it unlock first? |

#### Design, production and product data — seat “Design, make or document it” (14 questions)

| # | Stop | Question | Prompt |
|---|---|---|---|
| 1 | Product | `product.perspective` | What do you mostly do with this chair? |
| 2 | Product | `sales.channel` | Who actually buys this chair from you? |
| 3 | Product | `product.identity` | Today, this chair’s identity lives… |
| 4 | Material | `material.composition` | Up close, a chair is a recipe. How well do you know yours? |
| 5 | Component | `component.bom` | Under the cushion: webbing, foam, frame, fittings. Can you tie each material to its component? |
| 6 | Supplier | `supplier.role` | Does the wood in your products arrive from outside the EU? |
| 7 | Supplier | `supplier.depth` | When wooden furniture, panels or timber reaches you, does it arrive with a due-diligence statement reference number? |
| 8 | Logistics | `logistics.handoff` | Timber changes hands several times before it becomes a chair. Does its information travel with it? |
| 9 | Factory | `factory.evidence` | On the production floor, what is recorded about how each chair was made? |
| 10 | Data | `data.location` | So where does all of this actually live today? |
| 11 | Data | `data.owner` | When this information changes, who makes sure it is updated? |
| 12 | Passport | `passport.carrier` | Someone points a phone at the chair. What can they reach today? |
| 13 | Next life | `nextLife.continuity` | Years later the chair comes back for new upholstery. What still knows it? |
| 14 | Next life | `nextLife.unlock` | If this information were connected tomorrow, what should it unlock first? |

#### Compliance — seat “Check it meets the rules” (15 questions)

| # | Stop | Question | Prompt |
|---|---|---|---|
| 1 | Product | `product.perspective` | What do you mostly do with this chair? |
| 2 | Product | `sales.channel` | Who actually buys this chair from you? |
| 3 | Product | `product.identity` | Today, this chair’s identity lives… |
| 4 | Material | `material.composition` | Up close, a chair is a recipe. How well do you know yours? |
| 5 | Component | `component.bom` | Under the cushion: webbing, foam, frame, fittings. Can you tie each material to its component? |
| 6 | Supplier | `supplier.role` | Does the wood in your products arrive from outside the EU? |
| 7 | Supplier | `supplier.depth` | When wooden furniture, panels or timber reaches you, does it arrive with a due-diligence statement reference number? |
| 8 | Supplier | `sourcing.whoasks` ★ | Compliance needs a substances statement from your biggest frame supplier. How does the request reach them? |
| 9 | Logistics | `logistics.handoff` | Timber changes hands several times before it becomes a chair. Does its information travel with it? |
| 10 | Factory | `factory.evidence` | On the production floor, what is recorded about how each chair was made? |
| 11 | Data | `data.location` | So where does all of this actually live today? |
| 12 | Data | `sourcing.pdf` ★ | A supplier’s certificate and test report arrive. What happens to the numbers inside them? |
| 13 | Passport | `passport.carrier` | Someone points a phone at the chair. What can they reach today? |
| 14 | Next life | `nextLife.continuity` | Years later the chair comes back for new upholstery. What still knows it? |
| 15 | Next life | `nextLife.unlock` | If this information were connected tomorrow, what should it unlock first? |

#### Purchasing — seat “Buy what goes into it” (14 questions)

| # | Stop | Question | Prompt |
|---|---|---|---|
| 1 | Product | `product.perspective` | What do you mostly do with this chair? |
| 2 | Product | `sales.channel` | Who actually buys this chair from you? |
| 3 | Product | `product.identity` | Today, this chair’s identity lives… |
| 4 | Material | `sourcing.topten` ★ | Your ten biggest suppliers by spend. You ask each one for what they already owe or routinely hold on their last delivery, due in a week. |
| 5 | Component | `component.bom` | Under the cushion: webbing, foam, frame, fittings. Can you tie each material to its component? |
| 6 | Supplier | `supplier.role` | Does the wood in your products arrive from outside the EU? |
| 7 | Supplier | `supplier.depth` | When wooden furniture, panels or timber reaches you, does it arrive with a due-diligence statement reference number? |
| 8 | Supplier | `sourcing.contract` ★ | A supplier misses a documentation request for the third time. What does the agreement let you do? |
| 9 | Logistics | `sourcing.substitution` ★ | Your contract manufacturer swaps the foam supplier to hold the price. Who at your end finds out, and what gets updated? |
| 10 | Factory | `sourcing.contractmade` ★ | Of what sells under your name, how much is made by someone else, and do you know who they buy from? |
| 11 | Data | `data.location` | So where does all of this actually live today? |
| 12 | Data | `data.owner` | When this information changes, who makes sure it is updated? |
| 13 | Passport | `passport.carrier` | Someone points a phone at the chair. What can they reach today? |
| 14 | Next life | `nextLife.unlock` | If this information were connected tomorrow, what should it unlock first? |

#### Sales — seat “Sell it” (13 questions)

| # | Stop | Question | Prompt |
|---|---|---|---|
| 1 | Product | `product.perspective` | What do you mostly do with this chair? |
| 2 | Product | `sales.channel` | Who actually buys this chair from you? |
| 3 | Product | `product.identity` | Today, this chair’s identity lives… |
| 4 | Material | `sales.artefact` ★ | A specifier wants the chair’s composition and certificates in writing. What do you actually send? |
| 5 | Component | `sales.landing` ★ | A dealer writes: “Is the foam free of flame retardants, is the oak FSC, and can I have it in writing by four? It is for a tender.” Who ends up answering? |
| 6 | Supplier | `sales.certificates` ★ | A tender asks for FSC or PEFC chain of custody, an EPD, or a label such as Möbelfakta, the Nordic Swan, the EU Ecolabel or Indoor Air Comfort. Which of yours are current, today? |
| 7 | Logistics | `sales.orders` ★ | An order is packed, but the customer still needs a fabric code, a care text or a certificate before it can go. How often does a missing or wrong product detail hold an order up? |
| 8 | Factory | `sales.reorder` ★ | A facility manager calls. One chair from the 2,000 you installed in 2018 needs replacing: same fabric, same finish. |
| 9 | Data | `data.location` | So where does all of this actually live today? |
| 10 | Data | `sales.hours` ★ | Last month, roughly how many working hours went into answering customers’ questions about materials, origin or certificates, and whose were they? |
| 11 | Passport | `sales.unbid` ★ | If any question about material, origin or certification could be answered within a day, what would you bid on that you do not bid on today? |
| 12 | Next life | `nextLife.continuity` | Years later the chair comes back for new upholstery. What still knows it? |
| 13 | Next life | `nextLife.unlock` | If this information were connected tomorrow, what should it unlock first? |

#### After-sales — seat “Look after it once it is sold” (14 questions)

| # | Stop | Question | Prompt |
|---|---|---|---|
| 1 | Product | `product.perspective` | What do you mostly do with this chair? |
| 2 | Product | `sales.channel` | Who actually buys this chair from you? |
| 3 | Product | `product.identity` | Today, this chair’s identity lives… |
| 4 | Material | `material.composition` | Up close, a chair is a recipe. How well do you know yours? |
| 5 | Component | `component.bom` | Under the cushion: webbing, foam, frame, fittings. Can you tie each material to its component? |
| 6 | Supplier | `supplier.role` | Does the wood in your products arrive from outside the EU? |
| 7 | Supplier | `supplier.depth` | When wooden furniture, panels or timber reaches you, does it arrive with a due-diligence statement reference number? |
| 8 | Logistics | `sales.orders` ★ | An order is packed, but the customer still needs a fabric code, a care text or a certificate before it can go. How often does a missing or wrong product detail hold an order up? |
| 9 | Factory | `sales.reorder` ★ | A facility manager calls. One chair from the 2,000 you installed in 2018 needs replacing: same fabric, same finish. |
| 10 | Data | `data.location` | So where does all of this actually live today? |
| 11 | Data | `data.owner` | When this information changes, who makes sure it is updated? |
| 12 | Passport | `passport.carrier` | Someone points a phone at the chair. What can they reach today? |
| 13 | Next life | `nextLife.continuity` | Years later the chair comes back for new upholstery. What still knows it? |
| 14 | Next life | `nextLife.unlock` | If this information were connected tomorrow, what should it unlock first? |

Variants:
- **Imported wood** replaces `supplier.depth` with `supplier.trace`, plus `supplier.proof` if the trace is deep.
- **Mixed** asks both.
- **"Ask purchasing"** asks neither. Compliance gets `sourcing.whoasks` instead.
- **Weak spots** add up to two follow-ups.

## 6. Existing questions: reused, changed, combined, removed

- **Reused unchanged:** the twelve common evidence questions, `sales.channel`, `supplier.role`, the three original
  follow-ups, and the sales set (the other agent's sourcing set too). The adviser-corrected wording is kept.
- **Changed:**
  - the seat question (what you do with the product, six desks; ids unchanged)
  - `supplier.depth` is no longer asked after "ask purchasing"
  - `sales.hours` no longer refers back to `sales.volume` ("those questions")
  - the sales and sourcing questions moved from one appended block to their own stops, each with a one-line bridge
    ("Certificates start with your suppliers, and buyers check them.")
  - `sourcing.whoasks` and `sourcing.pdf` are tagged "Compliance desk" on the end page
- **Combined:** the overlapping pairs in §1 are now alternatives in one slot.
- **Removed from every path, kept in the bank (`RESERVE`):**
  - `sales.volume`: the hours count carries the case
  - `sourcing.onboarding`: `sourcing.topten` already measures what suppliers send
- **Superseded:**
  - Friday item 10's "short second act" copy: no act is appended any more
  - item 15's honesty check can no longer fire within one respondent, since the two views are alternatives. It stays
    in code for when two respondents from one company are read together (tested).

## 7. Full-assessment questions now included

From the purchasing set:
- `sourcing.topten`, `contract`, `substitution`, `contractmade` (purchasing)
- `irreplaceable`, `com` (follow-ups)
- `whoasks`, `pdf` (compliance; `pdf` was a working-file question)

From the Sales-Value Assessment:
- `sales.orders` (order flow)
- `regulation.scope` (which products, and when; it asks for a mapping, not a date, since no furniture date exists)

The whole sales set, as versions.

Not included:
- B `scorecard`, `certificates`, `eudr`, and C `portals`, `lost`, `competitor`: Stefan marked these live-discovery
  or overlapping; they are for the call sheet
- the classic quiz's sizing questions (company size, catalogue size, complexity): useful on a call, not a readiness
  signal

## 8. Questions per respondent

From 20,000 random journeys per desk:

| Branch | Leadership | Design / product | Compliance | Purchasing | Sales | After-sales |
|---|---|---|---|---|---|---|
| Furniture: min / typical / max | 14 / 16 / 18 | 13 / 16 / 17 | 14 / 16 / 17 | 12 / 15 / 17 | 13 / 13 / 13 | 13 / 15 / 17 |
| Battery, textile | 13 / 14 / 14 | 13 / 14 / 14 | 13 / 14 / 14 | 12 / 13 / 13 | 13 / 14 / 14 | 13 / 14 / 14 |

Before this change (same method, the engine as it stood that morning):
- the other four furniture desks: 13 / 16 / 17
- Sales: 20 / 23 / 24
- Sourcing: 21 / 24 / 25

The bank holds 36 questions; any one respondent sees 12 to 18.

## 9. Where the logic can fail

- **One seat, several desks.** A small-company owner who buys and sells sees one desk's versions. Mitigations:
  - "Run the business" gives the generalist path
  - every question keeps an "it depends" or "not sure" answer, so a wrong guess costs one soft answer, not a dead end
  - the end page shows "Answered from", so the call can cover the rest

  Inferring a second desk from a single later answer was tried and rejected: it swapped too many questions on thin
  evidence.
- **The wrong seat.** A respondent who picks "Sell it" but works in product never sees the BOM question. Same
  mitigation as above. The seat comes first, so going back is cheap.
- **A junior buyer answers "ask purchasing".** By design they drop to the common versions.
- **External advisers** pick "Check it meets the rules". The compliance versions assume an in-house desk; they read
  fine for an adviser, but `sourcing.whoasks` ("how does the request reach them") is answered for the client.
- **Purchasing's end page shows "Next life: not covered".** That is true: they skip continuity.
- **The longest path** is leadership with a mixed EUDR role and two weak spots: 18 questions.
- **Battery and textile** have no desk versions yet: same paths as before, slightly shorter for purchasing.
- **Saved journeys from before** resume at the first answer the new path no longer asks (the stale-answer rule).
- **Desk sets are unscored for capabilities** (Stefan: "do not let either module feed the score"). The dashboard
  preview counts them as answers, not as capability evidence.

## 10. Recommended architecture

Keep it as built:
- one adaptive flow on the lifecycle spine (Stefan's "append modules; do not fork" holds: there is no second path)
- desk versions per slot, a handful of follow-ups
- every rule a data field on the question: `desks`, `covers`, `skipDesks`, `defersTo`, `when`
- the tests as the specification
- no weights, no inference engine

Next, in order:
1. Validate one purchasing head and one sales director on their paths (Stefan's after-Friday item 4).
2. Desk versions for battery and textile.
3. Several respondents per company, merged on one end page. Desks become complementary and item 15's check comes
   back to life.
4. The declared weight table, once the desk sets are allowed to score.
