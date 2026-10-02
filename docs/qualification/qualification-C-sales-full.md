# Workstream C: the sales seat

Written from the seat of a B2B sales lead in furniture and comparable manufactured goods: tenders, contract and project channels, retailer onboarding, public procurement. Read in order: shared brief, evidence base, Round 1 findings; the radar skimmed for the regulatory frame only. Workstream B was not opened.

## 1. What this set is for

Sales feels the absence of product data most often and reports it least, because each instance is an email, not a lost deal. None of the eleven questions below asks about maturity for its own sake; each asks the respondent to pick the path they took last time. Four do not score at all; they route and size the case in the respondent's own numbers. A showroom brand that never sees a tender is a different business, not a weaker one, and every ladder has a rung that says so without penalty.

Conventions, so the set pastes into the existing engine:

- Stage **Customer**: the node the result diagram already draws but no question feeds. IDs are `sales.*`.
- Strength 0–4 as in the existing set. **soft** means no score effect, flag `not-applicable`. If the engine cannot exclude a rung from scoring by Friday, give it strength 2 with the flag (CODE for exclusion, QUESTION for the fallback).
- Exposure questions (`sales.channel`, `sales.volume`, `sales.hours`, `sales.unbid`) carry strength 3 on every option, the `nextLife.unlock` precedent, so they cannot move the score.
- No regulatory dates in the module. Sales does not need them, and a wrong one costs more than a right one earns.
- The arrow after each option is the note for Prduct. Strip it before pasting.

## 2. The question set

### sales.channel: stage Customer, CORE (asked of everyone, directly after product.perspective); captures commercialUse; no score effect
Prompt: "Who actually buys this chair from you?"
Detail: "The channel decides who asks the awkward questions, and how often. Pick the one that pays most of the salaries."
- s3 `consumer` "Consumers, through our own stores or webshop" → End customers and marketplaces ask; tenders do not. The soft rungs below will be chosen, and that is correct. Not a weak lead, a different one: the near obligation for this company is EUDR on wooden lines [C, settled in Finding 2], not a sales case.
- s3 `wholesale` "Retailers and dealers who resell it" → Retailer product forms and supplier portals are the load; being listed by a chain is the eligibility event.
- s3 `contract` "Contract and project: architects, specifiers, dealers, facility managers" → Specifications, EPDs, labels, and re-orders years later. The channel where product identity is revenue. Strongest fit for this module.
- s3 `public` "Public tenders are a meaningful share" → Documentation is pass/fail. Certificates and EPDs decide whether a bid is admissible at all. Highest urgency, and the respondent knows it.
- s3 `mixed` "A genuine mix; none dominates" → Run the whole module and ask on the call which channel they answered for.

### sales.volume: module; captures commercialUse; no score effect
Prompt: "Last month, how many times did a customer ask what a product is made of, where it comes from, or what it is certified to?"
Detail: "Count all of it: a retailer's product form, a tender annex, an architect's spec, a portal questionnaire, an email from an end customer."
- s3 `none` "It does not really come up" → No sales case today; do not build one for them. Check on the call whether they would know: the questions may be landing in product or quality without sales ever seeing them.
- s3 `quarterly` "A handful a quarter" → A nuisance, not a cost centre. Cycle-time argument only, and a modest one.
- s3 `monthly` "A few a month" → Enough to recognise the pattern, not enough to fund a project. Read with `sales.hours`.
- s3 `weekly` "Every week" → The load is a job nobody has. The business case starts to show in the respondent's own diary.
- s3 `daily` "Most days; it is part of the job" → Thirty a month is a business case (Finding 4). Ask who is doing it and what they are not doing instead.
- soft `dont-know` "Honestly no idea; they do not come to me" → The question lands outside sales, which is exactly what `sales.landing` measures next.

### sales.landing: module; captures salesEnablement, operationalFriction, ownership
Prompt: "A dealer writes: 'Is the foam free of flame retardants, is the oak FSC, and can I have it in writing by four? It is for a tender.' Who ends up answering?"
Detail: "Follow the email to the person who actually writes the reply. Choose the path you would really take."
- s4 `sales-record` "Sales, from a product record they can open and trust" → A maintained record exists and sales has it. Ask what it runs on; this company buys integration, not collection.
- s3 `sales-folder` "Sales, after digging through datasheets and certificates in a shared folder" → The folder is the PIM. Data exists, retrieval is manual, proof is undated. Classic mid-market fit.
- s2 `forward-internal` "Product, quality or compliance, once sales forwards it; a day or two" → The person being interrupted is the buyer of a sales case, not the salesperson. Same signal as `data.retrieval` = search, seen from the other end.
- s1 `forward-supplier` "Someone who first has to ask the supplier; a week if the supplier is quick" → Supplier dependency; expect `supplier.depth` = tier1. Under EUDR, a forwarded certificate is supporting information for due diligence, not a substitute for it [C]; who must file the statement depends on position in the chain, which is purchasing's question, not sales' [I].
- s0 `whoever` "Whoever is in that day; sometimes four o'clock passes first" → Governance gap. Expect `data.owner` = whoever-notices on the same run; if not, one of the two answers is polished.
- soft `rare` "We are rarely asked in that form" → Not a failure. Confirm against `sales.channel`; a consumer brand answering this is telling the truth.

### sales.artefact: module; captures dppAvailability, verificationTrust, salesEnablement
Prompt: "A specifier wants the chair's composition and certificates in writing. What do you actually send?"
Detail: "Not what you would like to send. What went out last time."
- s4 `maintained` "A datasheet we maintain, with dated certificates attached and a version number on it" → The company for whom the datasheet already is the sale. A passport is a format change, not a data project. Probably does not need a collection layer; may need a publishing layer, later, on a date still indicative [I].
- s3 `own-then-chase` "Our own datasheet, then the certificates once someone finds them" → The data is theirs; the proof is loose. Certificate tracking is the gap, and it is cheap to close.
- s2 `supplier-pdf` "The supplier's PDF, forwarded as it came" → A pass-through: what it sends is not its own claim. Fine for a trader today; not fine once a buyer asks the company to stand behind it.
- s1 `memory` "An email from memory, or a phone call to someone in product" → Matches `data.location` = human. Nothing here can become a passport yet; the first move is a record, not a platform.
- s0 `varies` "It differs every time; whatever we can find that week" → No artefact. The fact string to echo on the result screen: "What a customer gets depends on who they ask."
- soft `not-in-writing` "We are not asked in writing" → Consumer or showroom brand. Not a gap.

### sales.portals: module, optional for Friday (see §4); captures operationalFriction, commercialUse
Prompt: "A retailer's supplier portal, an EcoVadis request, a public procurement platform. How did the last one go?"
Detail: "They all ask the same questions in a different order, and they all have a deadline."
- s4 `one-source` "We answer from one maintained set of product and company answers; a portal is an afternoon" → Rare in mid-market. Has either a system or a very good person; find out which, because the person leaves.
- s3 `reuse` "We reuse last year's answers and update what changed" → The typical honest answer. Works until a product changes and last year's answer ships again (`logistics.change` = discovered-later, seen from sales).
- s2 `scratch` "Each one is done from scratch by whoever gets asked" → The tax is real and invisible. Multiply by `sales.volume`.
- s1 `late` "We have submitted late or incomplete, and heard about it" → A retailer has already noticed. Ask which one.
- s0 `declined` "We have skipped one, or been delisted over one" → Revenue already lost, and the respondent knows the number.
- soft `none` "Our customers do not run portals or questionnaires" → Common in consumer and small-dealer channels. Not a gap.

### sales.certificates: module; captures verificationTrust, regulatoryReadiness
Prompt: "A tender asks for FSC or PEFC chain of custody, an EPD, or a label such as Möbelfakta, the Nordic Swan, the EU Ecolabel or Indoor Air Comfort. Which of yours are current, today?"
Detail: "Certificates lapse quietly. Tender deadlines do not."
- s4 `tracked` "We know per product, with expiry dates tracked and one person responsible for renewals" → Certificate management is solved. The remaining gap, if any, is the per-batch product claim: an FSC claim lives on the invoice for that lot, not on the company certificate.
- s3 `company-level` "We know at company level and check per product when a tender lands" → The most common honest answer, and the exact distance between a company certificate and a product claim. Where a passport would bite [I].
- s2 `would-check` "We think so; we would check with the certifier or the supplier first" → The check takes days; tenders give weeks. Manageable, until two land at once.
- s1 `lapsed-once` "We have found out mid-tender that one had lapsed" → The story sales will tell on the call. It is also the renewal-date list A2 asked for (Finding 4, omission 4): every scheme named here carries a recurring date and, usually, a consultant.
- s0 `buyer-tells-us` "We would not know until a buyer told us" → No register. First move is a one-page list with dates; no software required.
- soft `not-required` "Our customers do not ask for these" → True for much of consumer retail. Not a gap. EUDR on wooden lines applies whether or not anyone asks [C, Finding 2].

### sales.lost: module, optional for Friday; captures commercialUse, salesEnablement
Prompt: "In the last twelve months, did a question about materials, origin or certificates cost you a deal?"
Detail: "Lost, delayed past the buyer's deadline, or quietly not bid on because the answer was not there."
- s4 `no-tracked` "No, and we would know if it had" → Loss reasons are recorded. Rare, and it makes every other answer on this run more credible.
- s3 `delayed` "Delayed one or two; never lost one" → The cycle-time case at its honest size: days, not deals.
- s2 `lost-one` "Lost or withdrew from at least one" → Ask for the deal. One named tender is worth more than the score.
- s1 `avoid` "More than one, and we now avoid tenders that ask" → The market has already been shrunk to fit the data. `sales.unbid` measures by how much.
- s0 `unknown` "We would not know; nobody records why we lose" → No loss review. The case cannot be built from their side; use `sales.hours` instead.
- soft `n-a` "We are not in deals where this comes up" → Consistent with `sales.channel` = consumer. Not a gap.

### sales.competitor: module, optional for Friday; captures commercialUse
Prompt: "When a project goes to a competitor, do you know whether they simply answered faster?"
Detail: "Speed of proof is a selling point nobody prints in the brochure."
- s4 `we-are-faster` "We track it, and we are usually the faster one" → Does not need help with speed. Might need help keeping it up when the person who makes it fast leaves.
- s3 `known-mixed` "We know who is faster; sometimes us, sometimes not" → A named competitor and a real comparison. The most useful answer on a call.
- s2 `told-after` "A dealer or buyer has told us so, after the fact" → Anecdote, but a specific one. Ask who.
- s1 `suspect` "We suspect it; nobody has checked" → Plausible and unmeasured. Weak evidence either way.
- s0 `no-review` "We do not review lost deals" → This question is mostly a proxy for whether loss reviews exist. Here they do not.
- soft `no-head-to-head` "We rarely compete on the same specification" → Design-led or exclusive-dealer brands. Not a gap.

### sales.reorder: module; captures lifecycleCapability, traceabilityDepth, commercialUse
Prompt: "A facility manager calls. One chair from the 2,000 you installed in 2018 needs replacing: same fabric, same finish."
Detail: "Can you tell which chair it was, and can you still make it?"
- s4 `project-record` "Yes: project, variant and fabric lot are on record, and we can quote today" → Identity survives the sale. The one place item- or batch-level identity earns its cost in furniture (Finding 4), and it is a revenue event, not a compliance one.
- s3 `variant-yes` "Model and variant, yes; the fabric we would match from a sample" → Batch identity without the lot. Good enough for most re-orders. ESPR is expected to provide for passports at model, batch or item level; which applies to furniture is for the delegated act [I].
- s2 `old-order` "We would dig out the 2018 order confirmation, if we can find it" → Identity lives in the ERP order, not with the product. Works for eight years, not for fifteen.
- s1 `photo` "We would ask for a photo and a label and work from there" → The customer becomes the record. Usually ends in a near match and a mixed installation.
- s0 `current-range` "We could not identify it; we would offer the current range" → The replacement goes to a competitor, or the whole installation is replaced early. The clearest revenue loss in the set.
- soft `no-projects` "We do not sell into projects; customers buy the current model" → Consumer or stock brand. Not a gap.

Overlap note: `nextLife.continuity` asks about the chair coming back for service; this asks about the sale. Keep both. The diagram's Customer and Next life nodes get one feed each.

### sales.hours: module; captures operationalFriction; no score effect
Prompt: "Last month, roughly how many working hours went into answering those questions, and whose were they?"
Detail: "Count everyone: sales, product, quality, compliance, and the supplier you chased. Your number, not ours."
- s3 `none` "Practically none" → No cost case. Say so.
- s3 `day-sales` "About a day, mostly in sales" → Nuisance level. The case is eligibility (`sales.unbid`) or nothing.
- s3 `days-mixed` "A few days, split between sales and product or quality" → The hours that matter are product's and quality's: they do not scale, and each customer question steals them from the next product.
- s3 `week-plus` "A week or more, and it pulled people out of product, quality or compliance" → A month of that is a part-time role. Write the number down and let the respondent price it. Do not price it for them.
- s3 `everyone` "More than that, or we cannot tell because it is everyone's side job" → Real and unmeasured. The first deliverable is a count, not a platform.
- soft `want-to-know` "No idea, and I would like to" → The most honest answer, and a good opening for the call.

### sales.unbid: module, LAST; captures commercialUse; no score effect; opportunity routing
Prompt: "If any question about material, origin or certification could be answered within a day, what would you bid on that you do not bid on today?"
Detail: "Answer as pipeline, not as principle. If you can name the customer, name it."
- s3 `nothing` "Nothing; we already bid on everything we want to" → No eligibility case. The argument for this company is cycle time and hours only, and it should be made at that size.
- s3 `public` "Public tenders we skip because of the documentation load" → The eligibility case. Ask for the last one skipped and its value; that number goes on page one of the offer.
- s3 `projects` "Larger contract or project specifications with sustainability annexes" → The specifier channel; EPDs and labels are the gate, so cross-read with `sales.certificates`.
- s3 `chains-export` "Retail chains or export markets whose onboarding we never attempted" → Portal onboarding as eligibility. New-logo pipeline the respondent has already priced in their head.
- s3 `frameworks` "Framework agreements or preferred-supplier lists with customers we already have" → The cheapest pipeline there is: existing relationships, missing paperwork.
- soft `never-asked` "Hard to say; nobody has put it like that" → The question did its job. Open the meeting with it.

## 3. The commercial argument

Tender eligibility is the number that can be large, and the CRM never shows it. A tender you cannot document is not lost; it is never entered. Where buyers make chain of custody, an EPD or an ecolabel an admissibility criterion (frequency in Nordic furniture tenders unverified [?]), retrievable proof changes the size of the market a company can bid into. `sales.unbid` makes the respondent name that market themselves.

Cycle time is a modest, near-certain gain. A contract deal runs months and documentation is a small share of it; what product data removes is the stall, the tender waiting two weeks while product chases a foam supplier. Expect days off the deals that stall, nothing off the rest.

Win rate: do not promise it. Nothing here shows that answering faster wins more, except where the competitor could not answer. The honest claim is fewer avoidable losses and fewer product and compliance hours spent on sales' work.

Prduct's line, that physical goods are sold as data before they are made and delivered, is true in contract and project: the chair is specified from a datasheet months before it exists, then made to order. Half true in wholesale, where the product form precedes the pallet; untrue in a showroom. Use it with the channel qualifier. The second half, that a passport is the regulated version of what sales already sends, is right on content, wrong on form: a passport is a maintained record with access rules, not a PDF [C, radar §2]. It makes the document sales already sends have to be true, current and reachable. An adviser would insist on this: most of this module is fixed by a maintained product record alone. Sell the record; the passport is what will later make keeping it non-optional, on a date still indicative [I].

## 4. How it folds into the tool

Recommendation: **a short module appended when the respondent picks "Sales & customers", with one question, `sales.channel`, promoted to the core for everyone.** Tags: QUESTION for copy and options; CODE for two small things, routing followups on the persona value rather than on an earlier strength, and excluding soft rungs from the score. Both fit in two days if `kind: followup` works as the evidence base describes. If routing on persona is not supported, append the module unconditionally after `nextLife.unlock` behind one line, "one more minute, for sales" (QUESTION only).

Not a separate path: it doubles the surface carrying dated claims in Prduct's voice on top of a 40–60 hour annual maintenance tax (Finding 6), and it loses the diagram, the tool's best asset, for the respondent most likely to be shown it in a meeting.

Not a persona branch that swaps questions: the persona copy promises it "changes the examples, not the result". Swapping makes runs incomparable, and a sales respondent would stop feeding the supply-chain questions that build the landscape. Appending keeps the core intact and adds a second act.

Friday scope: core plus seven (`sales.volume`, `sales.landing`, `sales.artefact`, `sales.certificates`, `sales.reorder`, `sales.hours`, `sales.unbid`). About two extra minutes, for sales respondents only, on questions about their own week. `sales.portals`, `sales.lost` and `sales.competitor` are for the live-discovery use and a later version: strong on a call, marginal on a form.

In live discovery, Prduct's rep chooses the persona, so the module becomes the second half of the call and its last two answers become page one of the offer. That is where these questions pay back whatever happens to inbound.

## 5. Suggestions, tagged

| # | Suggestion | Tag |
|---|---|---|
| 1 | Persona copy: replace "It changes the examples, not the result." with "It changes the examples. Pick Sales & customers and we add a short second act about your customers." | COPY |
| 2 | Add `sales.channel` to the core, directly after `product.perspective`. | QUESTION |
| 3 | Append the seven-question sales module for persona = Sales & customers. | QUESTION |
| 4 | Route followups on persona value; exclude soft rungs from the score with flag `not-applicable`. Fallback: soft rungs at strength 2 with the flag. | CODE (fallback QUESTION) |
| 5 | Result screen "WHERE IT PAYS BACK · FASTER ANSWERS": echo the `sales.landing` and `sales.artefact` facts in the respondent's words, e.g. "Today a dealer's question goes to product and comes back in a week." | COPY |
| 6 | Keep the module free of regulatory dates. | COPY |
| 7 | Feed `sales.landing` and `sales.artefact` into `salesEnablement` and `commercialUse`, one indicator each today (Finding 3). Do not touch the aggregation before Friday; more indicators per dimension dilute each question under the current mechanism. | QUESTION; weight table AFTER-FRIDAY |
| 8 | Second result panel, "What this means for sales", from `sales.hours` and `sales.unbid`, formatted as page one of an offer. | AFTER-FRIDAY |
| 9 | Free-text on `sales.unbid` ("Which customer?") and a numeric hours field, only once `/inbox.html` is protected (Finding 7). | AFTER-FRIDAY (CODE) |
| 10 | The three optional questions as a printed discovery-call sheet for Prduct's reps. | AFTER-FRIDAY |
| 11 | A consumer-retail variant of the module (marketplace attribute requirements, retailer product forms) for brands that pick `consumer`. | AFTER-FRIDAY |
| 12 | Run the module past one sales director at a customer before it ships anywhere. | AFTER-FRIDAY |

## Where I limited myself

- **No validation with a real sales director.** Needs a human and the consent gate. HOUE or HolmrisB8 first; one hour of their time.
- **No quantified cycle-time or win-rate effect.** Nothing in this run supports a number, and an invented one is what makes sales directors stop listening. It would take loss-reason fields from customers' CRMs, or ten structured interviews.
- **Tender-criteria frequency is [?].** Which schemes public buyers require, and how often as pass/fail, is asserted from experience. Twenty recent furniture tenders from udbud.dk and TED, counted, would settle it in a day.
- **Strengths only, no calculator values.** Two scoring systems exist (Finding 3); the calculator side needs someone who has decided what the dimensions mean.
- **Workstream B unread, by instruction.** Overlap is likely on `sales.certificates` (purchasing maintains the certificate, sales presents it) and on portals. The lead should reconcile.
- **A twelfth question cut.** Where specifiers write the product in from (BIM objects, product databases, the PDF) tests the "datasheet is the sale" line directly. Drafted, not included, available.
- **English only.** Running it live with Danish respondents needs a Danish pass; roughly two hours.
- **The consumer channel is served by soft rungs, not questions of its own.** Suggestion 11 covers it.
- **The NTT DATA partner use was not considered.**
