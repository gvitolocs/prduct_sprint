# DPP Assessment — Qualification Results and Friday Plan

Sep 28, 2026 · From Stefan, for the sprint team

This is the second pass on the furniture assessment, after the findings document. Four specialist reviews ran against the DPP Radar and the primary sources: standards conformance, a purchasing-side question set, a sales-side question set, and an independent adviser with no interest in Prduct checking all three for where they would serve the vendor at the respondent's expense.

**The headline: the writing survives, the sizing does not.** Two things in the tool are sized for the wrong company. EUDR is sized for an importer and applied to everyone. The passport is sized for an item-level company and set as the top rung of four ladders. The Commission's own furniture study, published one week ago, now says model level is the baseline. Both fixes are question changes, not rebuilds, and both are above the Friday line.

What this run adds that the findings document did not: two new modules that give purchasing and sales a reason to be in the room, a defensible replacement for the six-row table, and a correction to one sentence I gave you last time.

Everything below is tagged COPY, QUESTION, CODE or AFTER-FRIDAY. The line is drawn where I think Thursday evening lands. Move it if you know better — you do.

## The Friday line

In priority order by value per hour of your time. The items from the findings document — pilot label, `/inbox.html`, the interface defects — are assumed done and not repeated.

| # | Change | Tag | Time |
| --- | --- | --- | --- |
| 1 | Cut "A timeline you can act on" from the hero and the "typically need 12–18 months" band from the result. A duration implies a due date, and no furniture date exists. Nothing replaces it yet. | COPY | 10 min |
| 2 | Replace the hero's regulatory sentence with the role-aware version in the next section. | COPY | 10 min |
| 3 | Add the EUDR role question before anything about wood: "Do you import wooden furniture, parts or timber from outside the EU, or buy timber directly from forest owners?" Yes routes to the full due-diligence questions; no routes to record-keeping. | QUESTION | 1 h |
| 4 | Re-top four ladders so model or batch is the top rung and item-level becomes an unscored "(it depends)": `product.identity`, `logistics.handoff`, `nextLife.continuity`, `passport.carrier`. Details below. | QUESTION | 2 h |
| 5 | `material.composition` top rung: "Specified per material, with substances of concern declared by the supplier." Third-party testing becomes "(it depends)". | QUESTION | 20 min |
| 6 | Add an "(it depends)" or "Not sure" rung to every core question, stated as a business position rather than a gap. The purchasing module below shows the pattern. | QUESTION | 2 h |
| 7 | Add `sales.channel` to the core, directly after `product.perspective`. It routes and sizes everything after it. | QUESTION | 30 min |
| 8 | Append the seven-question sales module when persona = Sales & customers. Text is below, ready to paste. | QUESTION + small CODE | 3–4 h |
| 9 | Rename the result table "What the ESPR framework can ask for, and where furniture is likely to land" and replace its rows with the set below, each carrying its marker. | COPY | 1 h |
| 10 | Persona copy: "It changes the examples. Pick Sales & customers or Sourcing & supply chain and we add a short second act." And "Three minutes" becomes "About five minutes". | COPY | 5 min |
| 11 | Reframe `supplier.depth` as the reference question: "When wooden furniture or timber reaches you, does it arrive with a due-diligence statement reference number?" | QUESTION | 30 min |
| 12 | Route follow-ups on the persona value; exclude "soft" rungs from the score with a `not-applicable` flag. If that does not fit, soft rungs at strength 2 with the flag. | CODE | 2–3 h |

**—— the Friday line ——**

| # | Change | Tag |
| --- | --- | --- |
| 13 | Append the eight-question purchasing module when persona = Sourcing & supply chain. Text below. Do this if Thursday has room; it is the strategically bigger of the two modules and the less urgent for the sprint's stated challenge. | QUESTION + small CODE |
| 14 | Cap `data.location` and `passport.carrier` as score levers; lift `logistics.handoff` and `component.bom`. Only if the score stays visible at all. | CODE |
| 15 | Cross-check `logistics.change` against the purchasing module's substitution question and raise `needs-clarification` on contradiction. Cheapest honesty check in the set. | CODE |
| 16 | Result copy under the contract question: "A documentation line in your standard purchase-order terms reaches every supplier at the next order. No system needed." Only once the module exists. | COPY |
| 17 | Everything under After Friday. | AFTER-FRIDAY |

One thing to decide before you start on item 1: whether the score stays on the result screen at all. The adviser's read is that it should not, and that the diagram plus the echoed facts are what a respondent should act on. If you keep it, item 14 matters. If you drop it, items 4–5 still matter because the ladders are what the diagram is built from.

## The correction: EUDR is sized for importers

In the findings document I gave you a replacement for the hero sentence that said EUDR due diligence on timber applies from 30 December 2026. That is true, and it is also the wrong sentence, because it tells every furniture brand it has a due-diligence job this December. Most Danish brands do not.

Under Regulation (EU) 2025/2650, which amended EUDR in December 2025 **\[C\]**, the roles are:

- **Operator**: the first company to place the wood, panel or finished wooden furniture on the EU market. An importer of Vietnamese chairs, or of timber. Owes the full Article 9 record — species, country, plot geolocation, legality evidence, risk assessment — and files a due-diligence statement.
- **Downstream operator**: a company making products from inputs that are *all* already covered by a supplier's statement. A Danish brand buying oak from an EU sawmill, or panels that already carry a DDS. Files nothing. Keeps its suppliers' and customers' identities and the DDS reference numbers, for five years, and registers in the information system if it is not an SME.
- **Trader**: buys and sells without transforming. Record-keeping only.

The practical difference: an importer has a real, dated, enforced job in 93 days. A brand buying within the EU has a filing-cabinet job. The assessment currently asks neither which one it is talking to, and the scoring treats chain-of-custody to the forest as the goal for everyone. That is the operator's duty applied to the downstream operator.

**The corrected hero sentence:**

> Furniture is a priority product group in the EU's 2025–2030 ecodesign working plan. The Commission's indicative plan is to adopt furniture requirements in 2028; with the minimum transition period in the ESPR, a furniture Digital Product Passport would apply from around 2030. The exact data fields are not yet law. Before that, from 30 December 2026, wooden furniture placed on the EU market must be covered by an EUDR due-diligence statement: filed by you if you import, kept on record from your suppliers if you buy within the EU. Micro and small makers of wooden seats have until 30 June 2027. This assessment measures whether your product data can carry either.

Two details worth knowing. The micro/small deferral to June 2027 applies to wooden seats (9401) but not to wooden furniture under 9403, because those lines were already in the old Timber Regulation's annex **\[C\]** — a small maker of wooden tables gets no extra time; a small maker of wooden chairs does. And authorities must check a floor share of operators each year: 3% for standard-risk origin, 9% for high-risk, 1% for low-risk **\[C\]**.

This is also why the role question is item 3 on the Friday list and not item 11. It decides what the rest of the wood questions mean.

## Core changes

### The role question (Friday item 3)

New, asked before `supplier.depth`. Stage Supplier. Unscored; it routes.

Prompt: "Does the wood in your products arrive from outside the EU?" Detail: "Finished wooden furniture, parts, panels or timber that you or your contract manufacturer bring in from outside the EU — or timber bought directly from a forest owner anywhere."

- `import` "Yes — we or our contract makers import it" → operator; full due-diligence path
- `eu-covered` "No — it comes from EU suppliers who file their own statements" → downstream operator; record-keeping path
- `mixed` "Both, depending on the line" → both paths, ask which on the call
- `dont-know` "I would have to ask purchasing" → the honest answer for most compliance respondents, and the reason purchasing needs to be in the room
- `little-wood` "Little or no wood in what we sell" → EUDR marginal; skip the wood questions

### Re-topping the four ladders (Friday item 4)

The Commission's furniture study (22 September 2026, §7.4) reports that stakeholders "converge on model-level granularity as the pragmatic baseline", with batch for "specific, justified traceability use cases" and item level "voluntary given the disproportionate cost implications for a sector with limited digital maturity" **\[I\]**. Round 1 argued this from experience; the Commission's own draft now says it.

| Question | Current top rung (s4) | New top rung (s4) | Old s4 becomes |
| --- | --- | --- | --- |
| `product.identity` | Every single chair carries its own serial identity | Every fabric and finish variant has its own record | "(it depends)" — unscored, note: earns its cost in the contract channel |
| `logistics.handoff` | Yes — down to the individual item | Yes — each batch keeps its number from delivery to product | "(it depends)" — unscored |
| `nextLife.continuity` | Its identity and data carry into repair, resale and recycling | Repair and spare parts are traceable | "(it depends)" — unscored |
| `passport.carrier` | This exact chair — its origin, parts and repairs | Model data: materials, care, documents | "(it depends)" — unscored |

The `made-to-order` option on `product.identity` also moves to "(it depends)", unscored, because it is a business model rather than a maturity level — a configure-to-order company with a resolved BOM per order has better item data than a stock brand with a static PIM.

### Composition (Friday item 5)

`material.composition` s4 currently reads "Verified composition, including substances of concern" above s3 "Specified per material, with grades and percentages". ESPR Article 7(5) asks for substance name or CAS number, location in the product, and concentration **\[C\]**. Nothing asks for third-party verification. "Verified" reads as a testing programme; the compliant answer is s3 plus a supplier's substances declaration.

New s4: "Specified per material, with substances of concern declared by the supplier." Add "Third-party tested" as an "(it depends)" rung for companies that hold a label.

### `supplier.depth` (Friday item 11)

Current prompt "Follow the oak upstream. Where does your visibility stop?" with "all the way to the forest" as the top rung describes an operator's geolocation duty, not a passport field, and the Commission study says plot geolocation and supplier identities "should generally remain restricted" in a DPP **\[I\]**. Reframe:

Prompt: "When wooden furniture, panels or timber reaches you, does it arrive with a due-diligence statement reference number?"

- s4 `every-delivery` "Every delivery, and we keep the reference against the batch"
- s3 `most` "Most deliveries; we chase the rest"
- s2 `some` "Some suppliers send one; we have not asked the others"
- s1 `none-yet` "Not yet — we have not asked"
- s0 `we-import` "It does not arrive with one because we import it ourselves" → this is the operator answer; route to the full path
- soft `dont-know` "I would have to ask purchasing"

This is the right question after 30 December. Before it, the purchasing module's `sourcing.eudr` (below) is the right one. Run both until the date, then retire `sourcing.eudr`.

## The sales module

One question into the core for everyone, then seven appended when persona = Sales & customers. Stage **Customer** — the node the result diagram already draws but no question feeds. No regulatory dates anywhere in it; sales does not need them and a wrong one costs more than a right one earns. Every ladder has a **soft** rung for "this doesn't happen to us", unscored: a showroom brand that never sees a tender is a different business, not a weaker one.

Four questions carry strength 3 on every option so they cannot move the score — the `nextLife.unlock` precedent. They route and size the case in the respondent's own numbers.

The adviser's verdict on this set: the cleanest of the three. "`sales.landing` and `sales.artefact` are the two questions I would keep if only two survived."

### sales.channel — CORE, directly after product.perspective; no score effect

Prompt: "Who actually buys this chair from you?" Detail: "The channel decides who asks the awkward questions, and how often. Pick the one that pays most of the salaries."

- s3 `consumer` "Consumers, through our own stores or webshop"
- s3 `wholesale` "Retailers and dealers who resell it"
- s3 `contract` "Contract and project: architects, specifiers, dealers, facility managers"
- s3 `public` "Public tenders are a meaningful share"
- s3 `mixed` "A genuine mix; none dominates"

### sales.volume — no score effect

Prompt: "Last month, how many times did a customer ask what a product is made of, where it comes from, or what it is certified to?" Detail: "Count all of it: a retailer's product form, a tender annex, an architect's spec, a portal questionnaire, an email from an end customer."

- s3 `none` "It does not really come up"
- s3 `quarterly` "A handful a quarter"
- s3 `monthly` "A few a month"
- s3 `weekly` "Every week"
- s3 `daily` "Most days; it is part of the job"
- soft `dont-know` "Honestly no idea; they do not come to me"

### sales.landing — captures salesEnablement, operationalFriction, ownership

Prompt: "A dealer writes: 'Is the foam free of flame retardants, is the oak FSC, and can I have it in writing by four? It is for a tender.' Who ends up answering?" Detail: "Follow the email to the person who actually writes the reply. Choose the path you would really take."

- s4 `sales-record` "Sales, from a product record they can open and trust"
- s3 `sales-folder` "Sales, after digging through datasheets and certificates in a shared folder"
- s2 `forward-internal` "Product, quality or compliance, once sales forwards it; a day or two"
- s1 `forward-supplier` "Someone who first has to ask the supplier; a week if the supplier is quick"
- s0 `whoever` "Whoever is in that day; sometimes four o'clock passes first"
- soft `rare` "We are rarely asked in that form"

### sales.artefact — captures dppAvailability, verificationTrust, salesEnablement

Prompt: "A specifier wants the chair's composition and certificates in writing. What do you actually send?" Detail: "Not what you would like to send. What went out last time."

- s4 `maintained` "A datasheet we maintain, with dated certificates attached and a version number on it"
- s3 `own-then-chase` "Our own datasheet, then the certificates once someone finds them"
- s2 `supplier-pdf` "The supplier's PDF, forwarded as it came"
- s1 `memory` "An email from memory, or a phone call to someone in product"
- s0 `varies` "It differs every time; whatever we can find that week"
- soft `not-in-writing` "We are not asked in writing"

### sales.certificates — captures verificationTrust, regulatoryReadiness

Prompt: "A tender asks for FSC or PEFC chain of custody, an EPD, or a label such as Möbelfakta, the Nordic Swan, the EU Ecolabel or Indoor Air Comfort. Which of yours are current, today?" Detail: "Certificates lapse quietly. Tender deadlines do not."

- s4 `tracked` "We know per product, with expiry dates tracked and one person responsible for renewals"
- s3 `company-level` "We know at company level and check per product when a tender lands"
- s2 `would-check` "We think so; we would check with the certifier or the supplier first"
- s1 `lapsed-once` "We have found out mid-tender that one had lapsed"
- s0 `buyer-tells-us` "We would not know until a buyer told us"
- soft `not-required` "Our customers do not ask for these"

### sales.reorder — captures lifecycleCapability, traceabilityDepth, commercialUse

Prompt: "A facility manager calls. One chair from the 2,000 you installed in 2018 needs replacing: same fabric, same finish." Detail: "Can you tell which chair it was, and can you still make it?"

- s4 `project-record` "Yes: project, variant and fabric lot are on record, and we can quote today"
- s3 `variant-yes` "Model and variant, yes; the fabric we would match from a sample"
- s2 `old-order` "We would dig out the 2018 order confirmation, if we can find it"
- s1 `photo` "We would ask for a photo and a label and work from there"
- s0 `current-range` "We could not identify it; we would offer the current range"
- soft `no-projects` "We do not sell into projects; customers buy the current model"

### sales.hours — no score effect

Prompt: "Last month, roughly how many working hours went into answering those questions, and whose were they?" Detail: "Count everyone: sales, product, quality, compliance, and the supplier you chased. Your number, not ours."

- s3 `none` "Practically none"
- s3 `day-sales` "About a day, mostly in sales"
- s3 `days-mixed` "A few days, split between sales and product or quality"
- s3 `week-plus` "A week or more, and it pulled people out of product, quality or compliance"
- s3 `everyone` "More than that, or we cannot tell because it is everyone's side job"
- soft `want-to-know` "No idea, and I would like to"

### sales.unbid — LAST; no score effect; opportunity routing

Prompt: "If any question about material, origin or certification could be answered within a day, what would you bid on that you do not bid on today?" Detail: "Answer as pipeline, not as principle. If you can name the customer, name it."

- s3 `nothing` "Nothing; we already bid on everything we want to"
- s3 `public` "Public tenders we skip because of the documentation load"
- s3 `projects` "Larger contract or project specifications with sustainability annexes"
- s3 `chains-export` "Retail chains or export markets whose onboarding we never attempted"
- s3 `frameworks` "Framework agreements or preferred-supplier lists with customers we already have"
- soft `never-asked` "Hard to say; nobody has put it like that"

**Result screen.** Under WHERE IT PAYS BACK · FASTER ANSWERS, echo the `sales.landing` and `sales.artefact` facts in the respondent's own words — "Today a dealer's question goes to product and comes back in a week." Do not price `sales.hours` for them. Let the number sit there.

Three further questions — portals, lost deals, competitor speed — are written and in the working files, marked for the live-discovery use rather than the form. Strong on a call, marginal on a page.

## The purchasing module

Eight questions appended when persona = Sourcing & supply chain. Below the Friday line, because the sales module serves the sprint's stated challenge more directly — but this is the strategically bigger of the two, and it is where the missing furniture questions from the findings document actually live. Unscored for now; twelve more indicators in `supplierDataQuality` would make the weighting artifact worse, not better.

Every question has an **(it depends)** rung that states a legitimate business position rather than a gap. The adviser called this "the best design idea in the run" and said it should be copied into the core set. Three of the original twelve were corrected on the adviser's read — one invented a rule that does not exist, one measured suppliers against a document they do not owe, one penalised a legitimate choice — and one was dropped as duplicate. The corrections are folded in below.

### sourcing.topten — captures supplierDataQuality, verificationTrust

Prompt: "Your ten biggest suppliers by spend. You ask each one for what they already owe or routinely hold on their last delivery, due in a week." Detail: "A substances statement, the fibre composition, the panel's formaldehyde class, the FSC or PEFC claim on the invoice. Not a full material declaration — furniture suppliers do not owe one. Count the ones you would actually get it from."

- s4 `eight-plus` "Eight or more. For them it is routine."
- s3 `five-seven` "Five to seven. The fabric mills and the fittings supplier, yes; the frame and foam suppliers would need longer."
- s2 `two-four` "Two to four, the ones we already ask regularly."
- s1 `none-week` "None within a week. A month with chasing for most."
- s1 `never-asked` (it depends) "We have not asked in that form. Certificates and test reports when needed, yes."

### sourcing.whoasks — captures collaboration, ownership, operationalFriction

Prompt: "Compliance needs a substances statement from your biggest frame supplier. How does the request reach them?" Detail: "The path it would really take, not the org chart."

- s4 `buyer-logged` "Through the buyer who owns the account, logged with a due date the supplier is later measured on."
- s3 `buyer-email` "Through the buyer, by email. They chase when they remember."
- s2 `direct-cc` "Compliance writes to the supplier directly and copies the buyer."
- s1 `direct-alone` "Compliance writes directly. Purchasing hears about it if the supplier complains."
- s1 `none-yet` (it depends) "We have not had a request like that yet."

### sourcing.contract — captures regulatoryReadiness, supplierDataQuality

Prompt: "A supplier misses a documentation request for the third time. What does the agreement let you do?" Detail: "Framework agreement, supply agreement or purchase-order terms, whichever actually governs them."

- s0 `nothing-written` "Nothing. Documentation is not in the agreement, so it is a favour."
- s1 `on-request` "It says they provide certificates on request. Nothing happens if they do not."
- s2 `listed-docs` "It lists what they must supply, per delivery or per year. Enforcement is a conversation."
- s4 `enforceable` "It names the data, the format and the deadline, and ties it to payment, order release or the next review."
- s1 `varies` (it depends) "It varies. The big ones have a signed agreement; the rest run on purchase-order terms."

### sourcing.onboarding — captures dataStructure, supplierDataQuality

Prompt: "A new fabric mill is approved next month. What must they hand over before the first order, and where does it land?" Detail: "Company and bank details are the minimum everywhere. Count what comes after that."

- s0 `commercial-only` "Company details, bank details, an insurance certificate. Into the ERP supplier master."
- s1 `coc-certs-folder` "Plus a signed code of conduct and their certificates, filed in a folder per supplier."
- s3 `article-declaration` "Plus a material and substances declaration per article, checked before the article is released for ordering."
- s4 `structured-intake` "The same, submitted through a structured form or template, so it is a record rather than an attachment."
- s2 `by-category` (it depends) "It depends on the category. Wood and fabric get a longer list than fittings and packaging."

### sourcing.contractmade — captures traceabilityDepth, supplierDataQuality

Prompt: "Of what sells under your name, how much is made by someone else, and do you know who they buy from?" Detail: "The upholsterer in Poland, the frame plant in Lithuania, the case-goods factory in Vietnam. Their suppliers, not just them."

- s4 `own-mostly` "Mostly our own production. What is contract-made runs on our specification and our nominated inputs."
- s4 `nominated` "Most of it is contract-made, but we nominate the wood, foam and fabric suppliers, so the tier below is on our own supplier list."
- s2 `list-on-request` "A large share is contract-made. They source their own inputs and would give us the list if we asked."
- s1 `their-business` "A large share is contract-made and their sourcing is their business, as long as the spec is met."
- s2 `by-line` (it depends) "It differs by product line. Upholstery one way, case goods another."

Two rungs share strength 4 on purpose: the key carries the business model, which sets scope and price; the strength carries only visibility into the tier below. A contract-heavy brand with nominated inputs is not docked for its model.

### sourcing.irreplaceable — captures regulatoryReadiness, operationalFriction

Prompt: "A key customer makes a declaration from every wood, foam and fabric supplier a condition of the next order, with a date. Which suppliers keep you awake?" Detail: "The ones holding your tooling, your fabric designs, or a twelve-week lead time to replace."

- s4 `mapped-asked` "We have a list of single-source and hard-to-switch suppliers, and we have already asked them where they stand on documentation."
- s3 `known-not-asked` "We know who they are. We have not raised documentation with them."
- s2 `afternoon` "We could work it out from spend and lead-time data in an afternoon."
- s1 `when-it-happens` "We have not mapped it. We would find out when it happened."
- s3 `few-critical` (it depends) "Few of our suppliers are hard to replace. It would be a price question, not a supply question."

This is the one thing compliance cannot own. Supply risk is purchasing's. The prompt was changed from "a rule lands" to "a key customer" because no such rule exists for foam and fabric, and a purchasing head would ask which one.

### sourcing.substitution — captures verificationTrust, dataStructure, operationalFriction

Prompt: "Your contract manufacturer swaps the foam supplier to hold the price. Who at your end finds out, and what gets updated?" Detail: "Same density on paper, different chemistry, different declaration. It happens a few times a year."

- s4 `change-approval` "It needs our written approval first. BOM, declaration and product data are updated as part of the approval."
- s3 `told-updated` "They tell the buyer. The buyer updates the BOM and passes it to whoever owns product data."
- s2 `told-only` "They tell the buyer. The BOM gets updated if someone remembers; the product data usually does not."
- s1 `discovered` "We find out at a claim, an audit, or when a test report no longer matches."
- s1 `their-call` (it depends) "If it meets the spec, it is their call. We would not expect to hear."

This is `logistics.change` seen from the desk that could stop it. Reading the two together is the cheapest honesty check available: `logistics.change` = automatic beside `sourcing.substitution` = their-call is a contradiction.

### sourcing.com — captures verificationTrust, regulatoryReadiness

Prompt: "A contract customer sends their own fabric for a 400-chair order. What do you know about it when the chairs ship under your name?" Detail: "Customer's own material: you never bought it, and your label is on the chair."

- s4 `required-filed` "We require composition, flame-retardant treatment and test reports before we accept it, filed against the order."
- s3 `fr-checked` "We check flammability for the market it ships to and note the fabric on the order. Composition is whatever the customer says."
- s2 `name-only` "We record the fabric name and supplier on the order. Nothing more."
- s1 `incoming-goods` "We treat it like any incoming goods. It goes on the chair."
- soft `no-com` "We do not take customer's own material, or rarely enough to handle it case by case."

Nobody else asks this. Material in the product that none of the company's own suppliers will ever declare.

**Result screen.** One new section, WHAT YOUR SUPPLIERS CAN DELIVER TODAY, from the `sourcing.topten` count and the `sourcing.irreplaceable` answer in the respondent's words. And under `sourcing.contract`, when the answer is `varies` or below: "A documentation line in your standard purchase-order terms reaches every supplier at the next order. No system needed." Advice a respondent can act on for free is what makes the diagnostic trustworthy.

Four further questions — scorecard, PDF handling, certificate expiry, and an EUDR outreach question that overlaps the reframed `supplier.depth` — are in the working files.

## The replacement table

The furniture delegated act does not exist. The Commission's DPP page gives "2028 — sector-specific DPP requirements for furniture" under the heading "indicative timeline" **\[I\]**, and ESPR Article 4(4) sets application no earlier than 18 months after the act **\[C\]**, so around 2030 **\[I\]**. No field is law. A table headed "what the passport will ask for" cannot be defended.

What can be defended: a table headed **"What the ESPR framework can ask for, and where furniture is likely to land"**, with two sources. The framework itself fixes what any passport must carry. The Commission's furniture preparatory study, published 22 September 2026, gives a draft data-needs table (Table 9-2) for furniture specifically — and says its list "should not yet be interpreted as final DPP requirements", so everything from it is **\[I\]**.

On the result screen, show only the rows the respondent's answers can speak to. The administrative rows — identifiers, operator details, CN code, compliance documents — become one line: "plus identifiers, operator details, CN code and compliance documents, which any passport system supplies from master data." The full set is below for reference.

| Field | Basis | Draft granularity | Marker |
| --- | --- | --- | --- |
| Primary materials per component; upholstery fibre composition | Draft "proposed mandatory" | model / component | **\[I\]** |
| Substances of concern: name or CAS, location in product, concentration | ESPR Art. 7(5) "at least" | component / batch, tiered access | **\[C\]** it will be asked; thresholds **\[I\]** |
| Durability; repairability; recyclability | ESPR Annex I; draft "proposed mandatory" | model | **\[I\]** |
| Joining methods; disassembly and end-of-life information; recycling route | Draft | model / component | **\[I\]** |
| Recycled content (%) | ESPR Annex I; draft "proposed mandatory" | model / batch | **\[I\]** |
| Care, assembly and repair instructions; spare-part availability; take-back information | Draft "mandatory" | model | **\[I\]** |
| Adhesives, coatings, preservatives, flame retardants; VOC and formaldehyde class | REACH Annex XVII entry 77 from 6 Aug 2026; draft "conditional" | component / batch | **\[I\]** |
| Wood species, country of production, DDS reference | EUDR Art. 9; draft "resolvable reference" | batch | **\[C\]** as EUDR data; **\[I\]** as passport field |
| Harvest-plot geolocation, supplier identities | EUDR; draft "should generally remain restricted" | batch | **\[I\]** restricted, likely not public |
| Forestry certifications; eco-labels | Draft "voluntary" | material / batch | **\[I\]** |
| Carbon footprint; environmental footprint or EPD | ESPR Annex I; draft "methodology required" | model | **\[?\]** |
| Expected lifetime; manufacturing date; repair and replacement history | Draft "voluntary", item level | item | **\[?\]** |

Every row on the result screen carries the sentence: "Drawn from the Commission's draft of 22 September 2026, which says its list should not yet be read as requirements."

Of the original six rows, "Carbon footprint" is the weakest — the study's label is "methodology required" — and "Wood origin & legality" is real data in the wrong regime: EUDR now, passport maybe, restricted if so.

**What replaces the status column.** Today every row reads "Claimed, not yet proven" for every respondent. Until questions exist that distinguish one row from another, the honest status is none. The after-Friday version is a count: "From your answers, you could fill N of these fields today from records you keep, M from documents you would have to find, K not at all." That needs a data model tying answers to rows, and it is the right replacement for the month band.

## How purchasing and sales get into DPP

The passport is the data that arrives from your suppliers and leaves to your customers. Purchasing already decides what a supplier has to hand over before the order is released — put the data in the purchase-order terms and it arrives. Sales already answers the questions that data exists to answer — count the hours and the tenders you skip, and the case writes itself in your own numbers. Compliance holds the passport because it was called an obligation, and obligations go to whoever owns obligations. It belongs to the two departments whose existing work it sits between, and neither of them needs a regulation to want it.

That is the sentence. Three things the run established underneath it, which the modules above are built on.

**Purchasing gets less than the compliance pitch implies, until a supplier's document becomes a condition of shipping.** For wood, that is 30 December — for importers. For everything else it waits for a customer's tender or the furniture act. What purchasing gets today is a supplier list ranked hard-to-replace against cannot-document, a reason to put a data line into the framework agreement at renewal when it is free rather than mid-term when it costs concessions, an onboarding pack that asks once, and the end of purchasing's role as a PDF router between suppliers and QA. A spreadsheet of certificate expiry dates and a clause in the PO terms covers December. The case for tooling starts where declarations must stay true across substitutions and be re-sent to customers — which is the passport, not EUDR.

**Sales gets tender eligibility, which can be large and never shows in the CRM.** A tender you cannot document is not lost; it is never entered. Cycle time is a modest, near-certain gain — days off the deals that stall, nothing off the rest. Win rate should not be promised; nothing shows that answering faster wins more, except where the competitor could not answer at all. The honest claim is fewer avoidable losses and fewer product and compliance hours spent doing sales' work.

**Prduct's line — physical goods are sold as data before they are made — is true in contract and project, half true in wholesale, untrue in a showroom.** Use it with the channel qualifier. And the second half, that a passport is the regulated version of what sales already sends, is right on content and wrong on form: a passport is a maintained record with access rules, not a PDF. It makes the document sales already sends have to be true, current and reachable. The adviser's read: most of the sales module is fixed by a maintained product record alone. Sell the record; the passport is what will later make keeping it non-optional.

## What not to do

The discipline that keeps the list credible.

- **Do not put the full replacement table on the result screen.** The tier of administrative rows — EORI, back-up service-provider reference, registry, CN code — is real under the framework, but on a Prduct-branded screen labelled readiness it reads as the service catalogue presented as law. Keep it in the working files.
- **Do not add "or you cannot ship" to any EUDR wording.** True for importers, an overstatement for everyone else.
- **Do not build a separate purchasing or sales path.** It doubles the surface carrying dated claims, splits a funnel that cannot carry one audience, and loses the lifecycle diagram for exactly the respondent most likely to be shown it in a meeting. Append modules; do not fork.
- **Do not let either module feed the score.** Twelve more indicators in `supplierDataQuality` makes the weighting artifact worse under the current mechanism. Unscored until the additive weight table exists.
- **Do not price `sales.hours` or `sales.unbid` for the respondent.** Let the number sit there. If it goes on page one of an offer, it is the hours count and one named delayed or lost deal — not the hypothetical pipeline.
- **Do not promise win rate.** Fewer avoidable losses, fewer hours. That is the claim.
- **Do not touch the aggregation before Friday.** Round 1 established the mechanism; changing strengths within it moves things, but the fan-out artifact only goes away with a declared weight table.

## New since the radar

The DPP Radar was last updated 9 September. Two things have moved.

**The furniture preparatory study published its Phase I drafts on 22 September 2026** — including *DPP content for furniture products under ESPR* (Fraunhofer IZM, Trinomics, Oeko-Institut and Ecoinnovazione for DG ENV), with the draft data-needs table this document's replacement table is built from. First stakeholder meeting in Brussels on Oct 6, 2026. Feedback closes Nov 3, 2026; substances of concern Nov 25, 2026 **\[C\]**. This is the best signal of what the delegated act will contain, it is one week old, and Prduct's furniture customers have a direct interest in what goes into it. Worth a written response — and HOUE's Head of Compliance sits on the Alexandra Institute's EU DPP steering group.

**EN 18239 and EN 18246 have not appeared.** The radar said texts due 16 September. No published text, no OJEU citation, and the Commission's own furniture study of 22 September still cites both as final drafts. "Texts due 16 September" is now **\[?\]**; harmonisation is **not yet** **\[C\]**. The posture is unchanged: build to the six with legal certainty, build to the final two ahead of their harmonisation.

## After Friday

The backlog, roughly in order of value. Real work, not a dumping ground.

1. **A declared additive weight table** summing to 100, set by regulatory consequence, so score = Σ(strength/4 × weight). Additive, decomposable, reviewable by the customer being scored. Retires the dual `strength` / `calculator` system. A few hundred lines; this is the fix Round 1 said constants cannot deliver.
2. **The fillable-field count** that replaces the month band: a data model tying each answer to rows in the replacement table, so the result says "you could fill N today". Same work as rebuilding the six rows from real questions.
3. **Per-commodity split** of `material.composition`, `supplier.depth` and `sourcing.topten` — wood, fabric, foam and FR, finishes and adhesives, metal and fittings. Where the honest answer actually lives. Half a day each as five-row follow-ups.
4. **Validation with a real person.** One purchasing head and one sales director at HOUE, HolmrisB8 or Bolia, one hour each, before either module ships anywhere public. Needs the consent form; Bolia cleared with Sven first.
5. **A scored fourth axis**, "supplier data capability", shown beside the maturity score as a count out of ten — only once item 1 exists.
6. **The three live-discovery sales questions** — portals, lost deals, competitor speed — as a printed call sheet for Prduct's reps.
7. **A second result panel**, "What this means for sales", from `sales.hours` and one named deal, formatted as page one of an offer.
8. **Free-text on `sales.unbid`** ("Which customer?") and a numeric hours field — only once `/inbox.html` is protected.
9. **Model wording for a supplier data-delivery clause** — scope, format, deadline, remedy — as a companion to the purchasing module. Needs a lawyer's pass.
10. **A consumer-retail variant** of the sales module for brands that pick `consumer`: marketplace attribute requirements, retailer product forms.
11. **A Danish pass** on both modules before running them live with Danish respondents. Roughly two hours.
12. **Radar update**: the 22 September study into §7; 6 October, 3 November and 25 November diarised; EN 18239/18246 status corrected to **\[?\]**.

## Where this run limited itself

Kept throughout. Each entry is a place the run scoped down, why, and what more is available.

**Scope: furniture only.** Battery and textile journeys were never opened. Batteries is the only DPP with a fixed date (18 February 2027) and a published data-attribute specification (DIN DKE SPEC 99100). The furniture question set could be calibrated against that precedent far more rigorously than against a furniture act that does not exist. Not done by instruction, and because the group's Friday is furniture. Half a day.

**Four workstreams, not six.** A finance or CFO lens — what it takes to sign off a DPP data project, payback, capex versus opex, the cost of the alternative — was cut for time. A customer-side validation pass was cut because it needs a human and a consent form, not an agent. Both would materially strengthen the output; the second is item 4 above and is the single most valuable thing not done.

**Standards conformance is a map, not an audit.** The EN standards are paywalled; the map rests on catalogue scopes, the Commission study's tables and the Regen Studio field guide. Consistent, but a purchased copy of EN 18219 and EN 18220 would make the conformance table citable clause by clause. CEN's own project database blocks automated reading; the 17 August ratification date for EN 18239/18246 is **\[?\]** from here, and a person with a browser can settle it in five minutes.

**Primary sources partly unreachable.** EUR-Lex HTML returned empty; the Publications Office served the texts instead, so the EUDR, ESPR and amending-regulation claims marked **\[C\]** rest on the OJ text via that route. CIRPASS-2 D4.1 was rate-limited on Zenodo; CIRPASS-1 D3.2 and D2.1 stood in. The Dansk Standard DPP guide (Hæfte 67) was reached only at its landing page, not the PDF — a free download and fifteen minutes of a person's time. REACH entry 77 and PPWR dates are taken from the Commission study's Table 6-1, not the amending regulations.

**One count, not five.** `sourcing.topten` asks one number across the top ten. A fabric mill and a Vietnamese case-goods plant answer differently, and the per-commodity version is what would let Prduct price the collection job. Item 3 above.

**No clause text.** A purchasing head told their agreement has no teeth will ask for the clause next. Item 9.

**No quantified cycle-time or win-rate effect.** Nothing in the run supports a number, and an invented one is what makes sales directors stop listening. It would take loss-reason fields from customers' CRMs, or ten structured interviews.

**Tender-criteria frequency is \[?\].** Which schemes Nordic public buyers require as pass/fail, and how often, is asserted from experience. Twenty recent furniture tenders from udbud.dk and TED, counted, would settle it in a day.

**Routing unverified.** Whether `kind: followup` can key on the persona answer decides QUESTION versus CODE for both modules. Not checked against `lifecycle.js`; ten minutes for a developer.

**Omnibus I thresholds not re-verified.** The premise that most mid-market furniture brands sit outside direct CSRD and CSDDD scope is taken as given **\[I\]**; nothing in the tool or the modules invokes either directive, so nothing turned on it.

**CN-code edge cases.** Whether a metal-framed chair with wooden armrests falls under "ex 9401 seats of wood" is a customs question not pursued. Task 1 of the Commission's MEErP report holds the boundary cases.

**English only.** Item 11.

**The NTT DATA partner use was not considered** in either module's design. The live-discovery framing assumes Prduct's own reps; a partner consultant running it is a different context and may want different routing.

**A twelfth sales question was drafted and cut**: where specifiers write the product in from — BIM objects, product databases, the PDF. It tests the "datasheet is the sale" line directly. Available in the working files.

**The purchasing set was written without reading the sales set, and vice versa**, by instruction, so the two were reconciled by the adviser rather than by their authors. Overlap on certificates (purchasing maintains, sales presents) and portals was resolved by keeping both; a joint pass by one person would tighten it.

**No live browser verification of the deployment during this run.** The evidence base from Round 1 stands; nothing was re-captured. If the group has changed the tool since Sunday, some of the question IDs and rung text above may already differ.
