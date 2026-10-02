# Workstream B: purchasing, the supplier side of the passport

Furniture path only. Prepared 28 September 2026. Confidence markers as in the shared brief: **[C]** confirmed, **[I]** indicative, **[?]** unverified. Regulatory facts about EUDR roles and dates are taken from Workstream A §3, which opened the primary texts today; nothing regulatory is re-derived here.

## 0. Frame

The respondent is a Head of Purchasing at a furniture company of 50 to 500 people, some own production, a large share made under contract in Poland, Lithuania or Asia, and 100 to 1,500 active suppliers. That person already has a scorecard, a framework agreement template, an onboarding pack, a mental list of the suppliers they could not replace in a quarter, and an inbox where certificates arrive. None of it appears in the current thirteen questions, which is why "Sourcing & supply chain" changes the examples and not the result.

The twelve scenarios follow the register of `logistics.change`, `supplier.proof` and `data.retrieval`: a situation, a detail line with furniture nouns, rungs that describe the path the respondent would take. Each has one rung marked *(it depends)* that states a legitimate business position rather than a gap. Strengths run 0 to 4. No `calculator` values, since Round 1 settled that the aggregation is to be replaced; `captures` names the dimension for a future additive table, and until then the module should not feed `maturityScore` (§3). Each option carries a suggested `fact` string, the echoed line Round 1 identified as earning the meeting.

## 1. The question set, module `sourcing.*`

### sourcing.topten, stage Supplier; captures supplierDataQuality, verificationTrust

Prompt: "Your ten biggest suppliers by spend. You ask each one for a material declaration on their last delivery, due in a week."
Detail: "What is in the article they sent you: materials, percentages, substances of concern. Not a certificate, not a test report. Count the ones you would actually get it from."

| s | key | option | echoed fact |
|---|---|---|---|
| 4 | `eight-plus` | Eight or more. For them it is a standard document. | Most of the top ten can declare what they ship, on request. |
| 3 | `five-seven` | Five to seven. The fabric mills and the fittings supplier, yes; the frame and foam suppliers would need longer. | About half the top ten can declare on request; the rest need time and chasing. |
| 2 | `two-four` | Two to four, the ones we already ask regularly. | A few of the top ten can declare; most cannot yet. |
| 1 | `none-week` | None within a week. A month with chasing for most, and some would send a certificate instead. | The top ten deliver product, not product data. Common in furniture today. |
| 1 | `never-asked` *(it depends)* | We have not asked for one in that form. Certificates and test reports, yes; declarations, no. | Supplier evidence arrives as certificates and reports, not declarations. Most furniture supply bases look like this. |

What it tells Prduct: the one number that sizes the job. `eight-plus` means the customer's own data needs structuring and collection is light. `two-four` and below means a supplier collection programme is the product, which is the Premium-versus-Enterprise scope decision Round 1 asked for. `never-asked` means there is no baseline, the customer does not yet know its own number, and the first month is discovery. The last two rungs are where most real respondents will land, and the echoed facts are written so that landing there reads as normal rather than as failure.

### sourcing.whoasks, stage Supplier; captures collaboration, ownership, operationalFriction

Prompt: "Compliance needs a substances declaration from your biggest frame supplier. How does the request reach them?"
Detail: "The path it would really take, not the org chart."

| s | key | option | echoed fact |
|---|---|---|---|
| 4 | `buyer-logged` | Through the buyer who owns the account, logged with a due date the supplier is later measured on. | Supplier data requests run through purchasing and are tracked. |
| 3 | `buyer-email` | Through the buyer, by email. They chase when they remember. | Requests go through the buyer, untracked. |
| 2 | `direct-cc` | Compliance writes to the supplier directly and copies the buyer. | Compliance asks suppliers directly; purchasing is informed. |
| 1 | `direct-alone` | Compliance writes directly. Purchasing hears about it if the supplier complains. | Supplier data requests bypass the relationship that could enforce them. |
| 1 | `none-yet` *(it depends)* | We have not had a request like that yet. | No supplier data request has been needed so far. |

What it tells Prduct: whether a data request carries the weight of the order behind it, which is the whole problem this workstream exists for. `none-yet` is the most useful low answer in the module: it says no obligation has bitten and no customer has asked, so the sale is about timing, not capability.

### sourcing.scorecard, stage Supplier; captures supplierDataQuality, collaboration

Prompt: "Annual review with a strategic supplier. What is on the scorecard?"
Detail: "The lines that decide whether they keep the volume next year."

| s | key | option | echoed fact |
|---|---|---|---|
| 0 | `price-delivery` | Price and delivery. Quality comes up when there is a claim. | Suppliers are measured on price and delivery. |
| 1 | `pdq` | Price, delivery and quality, scored and discussed once a year. | Suppliers are scored on price, lead time and quality. |
| 2 | `plus-coc` | Those three, plus a sustainability or code-of-conduct line that seldom changes the outcome. | Documentation sits on the scorecard as a soft line. |
| 4 | `data-scored` | Those three, plus documentation delivery, scored the same way as a late delivery. | Data delivery is a scored supplier KPI. |
| 1 | `informal` *(it depends)* | No formal scorecard. Each buyer knows their suppliers and the review is a conversation. | Supplier performance is managed by the buyer, not a scorecard. |

What it tells Prduct: whether a fourth axis has a home. A `data-scored` company can absorb a new requirement into an existing routine. An `informal` company cannot, so the requirement has to live in the agreement or the purchase-order terms instead, which the next question tests.

### sourcing.contract, stage Supplier; captures regulatoryReadiness, supplierDataQuality

Prompt: "A supplier misses a documentation request for the third time. What does the agreement let you do?"
Detail: "Framework agreement, supply agreement or purchase-order terms, whichever actually governs them."

| s | key | option | echoed fact |
|---|---|---|---|
| 0 | `nothing-written` | Nothing. Documentation is not in the agreement, so it is a favour. | Supplier data is not a contractual obligation. |
| 1 | `on-request` | It says they provide certificates on request. Nothing happens if they do not. | The agreement asks for documents but has no teeth. |
| 2 | `listed-docs` | It lists what they must supply, per delivery or per year. Enforcement is a conversation. | Required documents are named; enforcement is informal. |
| 4 | `enforceable` | It names the data, the format and the deadline, and ties it to payment, order release or the next review. | Data delivery is enforceable under the supplier agreement. |
| 1 | `varies` *(it depends)* | It varies. The big ones have a signed agreement; the rest run on purchase-order terms. | Large suppliers have agreements; the long tail runs on PO terms. |

What it tells Prduct: leverage. `varies` is also a lead in itself: a data line in the standard PO terms reaches the whole long tail in one edit, and that is a purchasing action, not a software purchase. The result screen should say so; advice the respondent can act on for free is what makes the diagnostic trustworthy.

### sourcing.onboarding, stage Supplier; captures dataStructure, supplierDataQuality

Prompt: "A new fabric mill is approved next month. What must they hand over before the first order, and where does it land?"
Detail: "Company and bank details are the minimum everywhere. Count what comes after that."

| s | key | option | echoed fact |
|---|---|---|---|
| 0 | `commercial-only` | Company details, bank details, an insurance certificate. Into the ERP supplier master. | Onboarding collects commercial data only. |
| 1 | `coc-certs-folder` | Plus a signed code of conduct and their certificates, filed in a folder per supplier. | Onboarding collects certificates as files. |
| 3 | `article-declaration` | Plus a material and substances declaration per article, checked before the article is released for ordering. | New articles are not orderable until declared. |
| 4 | `structured-intake` | The same, submitted through a portal or structured form, so it is a record rather than an attachment. | Supplier onboarding produces records, not attachments. |
| 2 | `by-category` *(it depends)* | It depends on the category. Wood and fabric get a longer list than fittings and packaging. | Onboarding is risk-based by category. |

What it tells Prduct: whether supplier data arrives once, at the door, or is chased per request for the life of the relationship. `by-category` is good practice, and it is the natural place for a wood flag before December.

### sourcing.contractmade, stage Factory; captures traceabilityDepth, supplierDataQuality

Prompt: "Of what sells under your name, how much is made by someone else, and do you know who they buy from?"
Detail: "The upholsterer in Poland, the frame plant in Lithuania, the case-goods factory in Vietnam. Their suppliers, not just them."

| s | key | option | echoed fact |
|---|---|---|---|
| 4 | `own-mostly` | Mostly our own production. What is contract-made runs on our specification and our nominated inputs. | Production and inputs are under the company's own control. |
| 4 | `nominated` | Most of it is contract-made, but we nominate the wood, foam and fabric suppliers, so the tier below is on our own supplier list. | Contract manufacturers build on nominated inputs; tier two is known. |
| 2 | `list-on-request` | A large share is contract-made. They source their own inputs and would give us the list if we asked. | Sub-suppliers are known to the contract manufacturer, not to the company. |
| 1 | `their-business` | A large share is contract-made and their sourcing is their business, as long as the spec is met. | Contract manufacturers source freely; tier two is not visible. |
| 2 | `by-line` *(it depends)* | It differs by product line. Upholstery one way, case goods another. | Contract share and visibility vary by product line. |

What it tells Prduct: Round 1's first costly omission. Two rungs share strength 4 on purpose: the key carries the business model (own versus contract), which sets scope and price, while the strength carries only visibility into the tier below. A contract-heavy brand with nominated inputs is not docked for its model, which is the made-to-order mistake avoided. `their-business` at strength 1 is the EUDR problem in disguise: for a brand importing finished wooden furniture, the contract manufacturer's timber sourcing becomes the brand's own due-diligence record **[C]**, Workstream A §3.

### sourcing.irreplaceable, stage Supplier; captures regulatoryReadiness, operationalFriction; flag supplier-dependency

Prompt: "A rule lands: every wood, foam and fabric supplier must deliver a declaration by a date, or their material cannot be used. Which suppliers keep you awake?"
Detail: "The ones holding your tooling, your fabric designs, or a twelve-week lead time to replace."

| s | key | option | echoed fact |
|---|---|---|---|
| 4 | `mapped-asked` | We have a list of single-source and hard-to-switch suppliers, and we have already asked them where they stand on documentation. | Supply risk and documentation risk are mapped together. |
| 3 | `known-not-asked` | We know who they are. We have not raised documentation with them. | Critical suppliers are known; their data capability is not. |
| 2 | `afternoon` | We could work it out from spend and lead-time data in an afternoon. | Critical suppliers could be identified quickly; nobody has. |
| 1 | `when-it-happens` | We have not mapped it. We would find out when it happened. | Supply risk from a data requirement is unmapped. |
| 3 | `few-critical` *(it depends)* | Few of our suppliers are hard to replace. It would be a price question, not a supply question. | A commodity supply base: data demands are cheap to enforce. |

What it tells Prduct: the one thing compliance cannot own. The first workshop with this customer is the intersection of this list with the `sourcing.topten` answer. `few-critical` scores 3 deliberately: high switching leverage makes a data clause enforceable tomorrow, and the respondent should see that reflected back.

### sourcing.substitution, stage Logistics; captures verificationTrust, dataStructure, operationalFriction

Prompt: "Your contract manufacturer swaps the foam supplier to hold the price. Who at your end finds out, and what gets updated?"
Detail: "Same density on paper, different chemistry, different declaration. It happens a few times a year."

| s | key | option | echoed fact |
|---|---|---|---|
| 4 | `change-approval` | It needs our written approval first. BOM, declaration and product data are updated as part of the approval. | Input changes go through change control. |
| 3 | `told-updated` | They tell the buyer. The buyer updates the BOM and passes it to whoever owns product data. | Input changes are notified and passed on by hand. |
| 2 | `told-only` | They tell the buyer. The BOM gets updated if someone remembers; the product data usually does not. | Input changes are known to purchasing and stop there. |
| 1 | `discovered` | We find out at a claim, an audit, or when a test report no longer matches. | Input changes surface as problems. |
| 1 | `their-call` *(it depends)* | If it meets the spec, it is their call. We would not expect to hear. | Spec-based buying: substitutions are not reported. |

What it tells Prduct: the same event as `logistics.change`, seen from the desk that could stop it. Reading the two together is the cheapest social-desirability check available: `logistics.change = automatic` next to `sourcing.substitution = their-call` is a contradiction and should raise `needs-clarification`. `their-call` is a policy, not a failure, until a wood or substances field has to stay true after the swap.

### sourcing.pdf, stage Data; captures dataStructure, operationalFriction

Prompt: "A supplier's certificate and test report arrive. What happens to the numbers inside them?"
Detail: "Certificate number and expiry, formaldehyde class, flammability result, fibre composition. The values, not the file."

| s | key | option | echoed fact |
|---|---|---|---|
| 0 | `filed` | The PDF is filed or forwarded. The values stay inside it. | Supplier evidence is stored as documents. |
| 1 | `checked-filed` | Someone checks it against the spec, then files it. | Supplier evidence is checked once, then stored as documents. |
| 2 | `keyed-by-hand` | Key values are typed into a spreadsheet or the ERP by hand. | Supplier evidence is re-keyed by hand. |
| 4 | `structured` | The supplier submits values in a structured form; the PDF sits behind the record as evidence. | Supplier evidence arrives as data with the document attached. |
| 1 | `depends-desk` *(it depends)* | Depends who receives it. Purchasing files, QA reads, compliance keys in some of it. | Supplier evidence is handled differently by each desk. |

What it tells Prduct: the extraction load, which is the manual work a structured intake replaces. `depends-desk` says purchasing is currently a document router between suppliers and QA, a job it would be glad to lose.

### sourcing.com, stage Material; captures verificationTrust, regulatoryReadiness

Prompt: "A contract customer sends their own fabric for a 400-chair order. What do you know about it when the chairs ship under your name?"
Detail: "Customer's own material: you never bought it, and your label is on the chair."

| s | key | option | echoed fact |
|---|---|---|---|
| 4 | `required-filed` | We require composition, flame-retardant treatment and test reports before we accept it, filed against the order. | Customer-supplied material is declared before it is accepted. |
| 3 | `fr-checked` | We check flammability for the market it ships to and note the fabric on the order. Composition is whatever the customer says. | Customer-supplied material is safety-checked, not declared. |
| 2 | `name-only` | We record the fabric name and supplier on the order. Nothing more. | Customer-supplied material is identified, not documented. |
| 1 | `incoming-goods` | We treat it like any incoming goods. It goes on the chair. | Customer-supplied material is undocumented. |
| n/s | `no-com` *(it depends)* | We do not take customer's own material, or rarely enough to handle it case by case. | Customer-supplied material is not part of the business. |

What it tells Prduct: the contract channel, and material in the product that none of the company's own suppliers will ever declare. Nobody else asks this. `no-com` should not be scored; if the engine requires a number, give it 3 with a `not-applicable` flag so it is not read as strength.

### sourcing.certificates, stage Supplier; captures verificationTrust, regulatoryReadiness

Prompt: "Your panel supplier's chain-of-custody certificate expired last month. When would you know?"
Detail: "An FSC or PEFC claim on an invoice is only as good as the certificate behind it, and somebody has to watch the date."

| s | key | option | echoed fact |
|---|---|---|---|
| 4 | `tracked-alerted` | Before it expired. Expiry dates are tracked per supplier and someone gets an alert. | Supplier certificates are tracked to expiry. |
| 3 | `audit-prep` | When we prepare for our own annual audit and re-check every supplier's certificate. | Supplier certificates are checked once a year. |
| 2 | `when-asked` | When an invoice claim looks wrong, or the auditor asks. | Supplier certificates are checked on demand. |
| 1 | `if-told` | We would not, unless the supplier told us. | Supplier certificate validity is not tracked. |
| 1 | `no-own-coc` *(it depends)* | We do not hold a chain-of-custody certificate ourselves. We buy certified where we can and rely on the supplier's claim. | Certified inputs are bought on trust; no own chain of custody. |

What it tells Prduct: certificate maintenance as a purchasing routine with a hard annual date, and whether the company's own claim is exposed to a supplier's lapse. Expiry tracking is a small feature; the annual audit is a recurring reason to call. Scheme rules on certificate validity and surveillance are private-scheme facts, not law; the exact period is **[?]** and the question text deliberately does not state one.

### sourcing.eudr, stage Supplier; captures regulatoryReadiness; flag supplier-dependency

Prompt: "From 30 December 2026 the wood in your products needs a due-diligence statement behind it, and the reference has to reach you. Have you asked your wood and panel suppliers what they will send?"
Detail: "Solid wood, panels, veneer, frames, and finished wooden furniture bought from outside the EU."

| s | key | option | echoed fact |
|---|---|---|---|
| 4 | `confirmed` | Yes. We know which suppliers issue their own statement, which pass one on, and where we would have to file ourselves. | EUDR roles are settled per wood supplier. |
| 3 | `asked-waiting` | We have written to them. Answers are coming in. | Wood suppliers have been asked; answers are pending. |
| 2 | `on-the-list` | It is on the list. We know the date. | EUDR is known; supplier outreach has not started. |
| 1 | `not-started` | Not yet. We assumed compliance would handle it. | EUDR supplier outreach has not started. |
| n/s | `little-wood` *(it depends)* | Little or no wood in what we sell. | EUDR is marginal for this product range. |

Regulatory note. Date and scope **[C]** per Reg. (EU) 2025/2650, Workstream A §3: 30 December 2026 for large and medium operators and for non-SME downstream operators; 30 June 2027 for micro and small, except the 9403 wooden-furniture lines already covered by EUTR. "The reference has to reach you" is the downstream-operator duty to keep suppliers' due-diligence statement reference numbers **[C]**, which is the position of a non-SME brand buying from EU suppliers; a brand importing finished wooden furniture or timber is an operator with the full Art. 9 record **[C]**. Do not add "or you cannot ship" to the prompt: true for operators, an overstatement for the rest.

What it tells Prduct: whether the nearest real obligation has reached purchasing at all. It overlaps with Workstream A's reframed `supplier.depth` (does the delivery arrive with a reference?). A's is the right question after 30 December; this one is the right question before it. Run both until then, then retire this one.

## 2. What a purchasing director gets

Honestly, less than the compliance pitch implies. A supplier's data capability changes nothing at negotiation while nobody at the company's end can refuse a delivery over a missing declaration, and suppliers know it. Until a document is a condition of the order, a data line on the scorecard is a soft line, like the code-of-conduct line most companies already carry.

It changes when a supplier's document becomes a condition of shipping. For wood, that is 30 December 2026 **[C]**. A non-SME brand needs the due-diligence statement reference from every wood and panel supplier and keeps it for five years; a brand importing finished wooden furniture owes the full record itself. Authorities must check a floor share of operators yearly **[C]**. Ninety-three days out, a wood supplier who cannot say what they will send is a supply risk alongside the single-source foam plant, and supply risk is purchasing's.

Meanwhile the module gives purchasing four things it does not have. A supplier list ranked by hard-to-replace against cannot-document. A reason to put a data line into the framework agreement at renewal, when it is free, rather than mid-term, when it costs concessions; one edit to the standard PO terms reaches the long tail. An onboarding pack that asks once, at the door. And the end of purchasing's role as a PDF router between suppliers and QA.

For foam, fabric, fittings and finishes the condition arrives later, with a customer's tender or with the furniture delegated act, indicatively adopted 2028 **[I]**, applying around 2030 **[I]**. For ten wood suppliers and a hundred others, a spreadsheet of expiry dates and a clause in the PO terms covers December. The case for tooling begins where declarations must stay true across substitutions and be re-sent to customers, and that is the passport, not EUDR.

## 3. How it folds into the tool

Recommendation: a module appended when the respondent picks "Sourcing & supply chain", plus one question promoted into the main path for everyone. **QUESTION** for the twelve scenarios if the existing `followup` routing (which already routes `supplier.proof` and `data.retrieval` in or out) can key on the `product.perspective` answer; **CODE** if it cannot. **CODE** for the result-screen line. **AFTER-FRIDAY** for a scored fourth axis.

Against the alternatives: a separate purchasing path duplicates the front end, splits a funnel Finding 6 shows cannot carry one audience, and contradicts the premise that purchasing's work sits inside the same passport. A persona branch that swaps questions makes the score non-comparable across personas and starves the lifecycle diagram, the tool's best asset, of its inputs. A module adds without touching the core. It should stay out of `maturityScore` the way `nextLife.unlock` does, because twelve more indicators in `supplierDataQuality` would make the fan-out artifact worse. Its output is one new result-screen section, "WHAT YOUR SUPPLIERS CAN DELIVER TODAY", echoing the `sourcing.topten` count and the `sourcing.irreplaceable` answer in the respondent's words. In the live-discovery use Round 1 recommended, this is the part the salesperson runs when the purchasing head joins the call, and length stops mattering.

The promoted question is `sourcing.topten`, after `supplier.proof` for every persona. A compliance respondent who lands on `never-asked` has just told Prduct, and themselves, why purchasing needs to be in the room.

## 4. Suggestions

- **QUESTION** Add the `sourcing.*` module, routed on `product.perspective = sourcing`, unscored, with the twelve scenarios as written above. Becomes **CODE** if routing cannot key on the persona answer.
- **QUESTION** Promote `sourcing.topten` into the main path after `supplier.proof` for all personas, unscored for now.
- **COPY** On `product.perspective`, replace "It changes the examples, not the result." with "It changes the examples. If you pick Sourcing & supply chain, we add the supplier side." Only once the module is live.
- **COPY** Under `sourcing.contract` on the result screen, when the answer is `varies` or below: "A documentation line in your standard purchase-order terms reaches every supplier at the next order. No system needed."
- **CODE** Result-screen section "WHAT YOUR SUPPLIERS CAN DELIVER TODAY" built from the `fact` strings of `sourcing.topten` and `sourcing.irreplaceable`.
- **CODE** Cross-check `logistics.change` against `sourcing.substitution` and raise `needs-clarification` on contradiction. A cheap check on the upward drift Round 1 estimated at one rung on a third to a half of items.
- **QUESTION** Reconcile `sourcing.eudr` with Workstream A's reframed `supplier.depth`: both until 30 December 2026, A's alone after.
- **AFTER-FRIDAY** A scored fourth axis, "supplier data capability", shown beside the maturity score as a count out of ten, once the additive weight table exists. Do not attempt it inside the current aggregation.
- **AFTER-FRIDAY** Split `sourcing.topten` and `sourcing.pdf` per commodity (wood, foam, fabric, fittings, finishes), which is where the honest answer actually lives; the single-count version is the Friday compromise.
- **AFTER-FRIDAY** Put the twelve ladders in front of one real purchasing head at HOUE, HolmrisB8 or Bolia before they ship anywhere public. Consent per the sprint ledger; Bolia cleared with Sven first.

## Where I limited myself

- **One count, not five.** `sourcing.topten` asks one number across the top ten. A fabric mill and a Vietnamese case-goods plant answer differently, and the per-commodity version is what would let Prduct price the collection job. Not built, because five ladders in place of one takes the module past what a self-serve respondent will finish. Half a day as a five-row follow-up.
- **No clause text.** A purchasing head told their agreement has no teeth on data will ask for the clause next. A page of model wording for a data-delivery term (scope, format, deadline, remedy) is the natural companion deliverable and needs a lawyer's pass. Not drafted.
- **No segmentation template.** Spend × switching cost × data capability as a workshop spreadsheet is the natural product of `sourcing.irreplaceable` and `sourcing.topten` together. Two to three hours if wanted.
- **No supplier-count question.** Neither the tool nor this module asks how many suppliers or buyers. An unscored "how many active suppliers, roughly" belongs at the top of the module; left out to hold twelve. **QUESTION** if wanted.
- **Routing unverified.** Whether `kind: followup` can key on `product.perspective` decides QUESTION versus CODE for the whole module. Not checked against `lifecycle.js`; ten minutes for a developer.
- **Certificate scheme rules.** FSC and PEFC validity periods and surveillance cycles are marked **[?]** and kept out of the question text. A scheme-rule check settles it.
- **EUDR edge cases.** SME deferral, the 9401/9403 split under the old EUTR annex and the operator-versus-downstream line are taken from Workstream A, not re-examined. The question text is true for a non-SME brand buying from EU suppliers; a small chair maker or an importer of finished furniture reads it differently, and the result screen should say so.
- **No funnel cost.** Twelve extra questions for one persona will cost self-serve completions. Not modelled, because the recommendation rests on the live-discovery use where it does not apply.
- **Not validated.** Every ladder comes from experience, not from a respondent at a furniture company this week. The last AFTER-FRIDAY item is the fix; it needs a human and a signed consent form.
- **Sales-side territory left alone.** Tenders, retailer questionnaires and public procurement are where purchasing's data requirements will come from for everything except wood. That is the sales workstream's ground and appears here only as "with a customer's tender".
