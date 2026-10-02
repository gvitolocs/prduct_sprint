# Workstream A — Standards, conformance and the wood question

Furniture path only. Prepared 28 September 2026. Confidence: **[C]** confirmed against a primary text opened today · **[I]** indicative · **[?]** unverified.

## 0. Status check as of today

The radar's settled facts hold: Implementing Decision (EU) 2026/1736 (OJ 15 July 2026) cites exactly six standards, EN 18216 and EN 18219–18223 **[C]**; Implementing Regulation (EU) 2026/1778 (in force 6 August 2026) governs the registry, live since 20 July 2026 **[C]**.

The last two standards have not moved in any way I can confirm. No Tier 1–2 source shows a published EN 18239:2026 or EN 18246:2026: the Estonian catalogue still lists prEN 18239 as a draft (its prEN 18246 entry reads "no longer available" with no successor, which is ambiguous), and the Commission's furniture DPP study dated 22 September 2026 still cites both as FprEN. No OJEU citation exists on EUR-Lex; the Commission's DPP page lists "September 2026 – Implementing Decision on the remaining two DPP standards" as a plan, no link. Texts due 16 September **[?]**; harmonisation **not yet** **[C]**. The CEN topic URL in the radar is 404 and the CEN database blocks automated reading, so the 17 August ratification date is **[?]** from my side. Posture unchanged.

What the radar does not yet carry matters more: the **furniture preparatory study published its Phase I draft reports** on 22 September 2026, including *DPP content for furniture products under ESPR* (Fraunhofer IZM, Trinomics, Oeko-Institut, Ecoinnovazione for DG ENV), with a draft data-needs table. Feedback closes **3 November 2026** (substances of concern 25 November); first stakeholder meeting **6 October 2026**, Brussels **[C]**. That is the best signal of what the delegated act will ask for, and it is eight days old.

## 1. Conformance map

Territory per standard (scopes from the published texts as reproduced by EVS; 18239/18246 from final drafts): EN 18219 product, operator and facility identifiers at model, batch or item level · EN 18220 carrier symbology, print quality, durability, placement · EN 18221 archiving, persistence after the operator ceases, replication to a back-up operator · EN 18222 lifecycle APIs, searchability · EN 18223 semantic model, dictionaries, rules for product-group data models · EN 18216 exchange protocols · EN 18239 access rights, IT security, confidentiality, responsibility transfer · EN 18246 signed data constructs, integrity.

| Question | Standard territory | Probes it correctly? | What the answer actually tells you |
|---|---|---|---|
| `product.perspective` | None | n/a | Persona only. Fine. |
| `product.identity` | **EN 18219** (model / batch / item) | Partly. It treats item-level as the top rung. EN 18219 and ESPR Art. 9(2)(d) treat model, batch and item as *choices the delegated act makes*. Stakeholders in the Commission study converge on model as baseline, batch for origin-varying data, item voluntary **[I]** | Whether the company can name the thing a UPI would attach to. `variant-records` is the real threshold: one record per configuration is what a model-level UPI needs. `made-to-order` is orthogonal, as Round 1 said. |
| `material.composition` | ESPR Art. 7(5) SoC, Annex I(f); EN 18223 as container | Half. "Substances of concern" is right, but the ESPR minimum is name/CAS, *location in the product*, and concentration per component (Art. 7(5)(a)–(c)) **[C]**. One composite answer across oak, foam, fabric and finish cannot show that. | Whether supplier declarations exist at all. Cannot distinguish "we hold an SDS for the lacquer" from "we know the panel's formaldehyde class". |
| `component.bom` | EN 18223 (data linked to components); Art. 7(5)(b) "location within the product" | Yes. The one question that maps cleanly. The draft furniture needs put materials, SoC, adhesives/coatings and joining methods at *model/component* granularity **[I]**. | The best predictor of passport readiness in the set. Every downstream field hangs on a versioned BOM. |
| `supplier.depth` | **Not DPP territory.** EUDR Art. 9; DPP Annex III(h)/(i) operator and facility identifiers only | No. "All the way to the forest" describes an EUDR *operator's* geolocation duty, not a passport field. The Commission study says plot geolocation and supplier identities "should generally remain restricted" in a DPP **[I]**. | EUDR exposure and role (operator vs downstream operator), not DPP readiness. Reframe, see §3. |
| `supplier.proof` | EN 18246 in spirit; EUDR Art. 9(g)–(h) in law | Good behavioural anchor. "A verified, current source" is what a signed credential under EN 18246 would be. | Whether evidence is document-managed with provenance. Keep. |
| `logistics.handoff` | EN 18219 batch identifiers; EUDR Art. 4(7)/5(3) DDS reference numbers travelling with goods | Yes, and it is the EUDR question in disguise. Batch continuity from delivery to product is the join key both regimes need. | Whether a batch ID survives from inbound lot to finished product. Under-weighted at +4. |
| `logistics.change` | EN 18221/18222 versioning; Art. 9(2)(h) update arrangements; EFIC's proposed trigger: data valid until a material change **[I]** | Yes. Best-written question in the set. | Whether the company can version a passport when an input changes. |
| `factory.evidence` | Annex III(i) facility identifier; batch = "specific plant, specific moment" (Recital 33) | Partly. Per-unit timestamped records are automotive; batch is the ESPR notion. | Whether a batch can be defined at all. Ask about the *supplier's* plant. |
| `data.location` | EN 18221 (storage by operator or provider, Art. 11(c)); EN 18222 (system of record must expose an API) | Indirectly. A connected PLM is what a provider integrates with; spreadsheets can still feed a model-level passport. | Integration cost, not readiness. Keep, do not score as a lever. |
| `data.retrieval` | EN 18222 searchability, in spirit | Good behavioural anchor. | Whether a structured query is possible today. Keep. |
| `data.owner` | Art. 9(1) "accurate, complete and up to date"; Impl. Reg. 2026/1778 Art. 19 (verified operator stays liable even when a third party registers) **[C]** | Yes. Ownership is a legal obligation. | Whether anyone can sign. Registry verification needs a qualified electronic seal for legal persons (Art. 4) **[C]**; a named owner with a mandate is the prerequisite. |
| `passport.carrier` | **EN 18220**, nominally | No. EN 18220 governs symbology, print quality, durability and placement of a carrier resolving to a *UPI*. "A QR that reaches item data today" is a marketing-page question; a compliant carrier can resolve to a model-level passport with no consumer page. No furniture carrier rule exists (Art. 9(2)(b)–(c)) **[C]**. | What the company already spent on web. Nothing about conformance. Most mis-weighted item at +15. |
| `nextLife.continuity` | EN 18221 persistence for expected lifetime (Art. 9(2)(i)); Art. 11(d) linking new passport to original | Yes, though item-level lifecycle data is *voluntary* in the draft furniture needs **[I]**. | Whether identity survives resale. Real for contract channel; optional for retail. |
| `nextLife.unlock` | None | n/a | Segmentation. Correctly unscored. |

**Untouched territory:** EN 18216, EN 18222, EN 18221's mandatory back-up via a service provider (Art. 10(4)) **[C]**, EN 18239 access design, EN 18246 signing, and the registry itself (eIDAS seal, EORI, commodity code, proof of registration; Impl. Reg. Arts. 4, 8–9) **[C]**.

Does it matter for a brand? Mostly no: exchange, APIs, persistence and signing are what a service provider sells, and assessing a brand on them pushes it to buy infrastructure early. Three gaps matter because they are the brand's own decisions: **which identifier scheme** (GS1 estate or self-issued, EN 18219); **which fields are public and which restricted** (formulations, supplier identities, EUDR geolocation; EN 18239 only implements what the brand decides); and **CN code plus EORI**, on which the registry, customs (Art. 15) and the EUDR statement all key. None is asked.

## 2. The six rows

**The furniture delegated act does not exist.** The Commission's DPP page gives "2028 – Sector-specific DPP requirements for furniture" as adoption **[I]**, with at least 18 months' transition, so application around 2030 **[I]**. No field is law. A table headed "what the passport will ask for" cannot be defended to Dansk Standard.

What can be defended is a three-tier table headed **"What the ESPR framework can ask for, and where furniture is likely to land"**: the framework fixes tier A for any product, and the Commission's draft data-needs table (Table 9-2, 22 September 2026) gives tiers B and C. The study says its list "should not yet be interpreted as final DPP requirements", so everything from it is **[I]** at best.

| Field | Tier | Basis | Granularity (draft) | Marker |
|---|---|---|---|---|
| Unique product identifier + data carrier | A | ESPR Art. 10(1)(a)–(b), Annex III(b) | model/batch/item, act decides | **[C]** framework |
| Model ID, batch ID | A | Annex III(b); GPSR Art. 9(5) | model; batch "mandatory" in draft | **[C]**/**[I]** |
| CN commodity code (9401/9403) | A | Annex III(d); registry Art. 13(1) | model | **[C]** |
| Manufacturer name/address + unique operator ID; importer EORI; EU responsible person | A | Annex III(g), (j), (k) | model | **[C]** |
| Facility identifier / production site | A | Annex III(i) | batch | **[C]** framework, **[I]** whether required |
| Substances of concern: name/CAS, location, concentration, safe-use, EoL handling | A | Art. 7(2)(a), 7(5) "at least" | component/batch, tiered access | **[C]** it will be asked; thresholds **[I]** |
| Compliance documentation (DoC, test reports, certificates) | A | Annex III(e); toys and detergents precedent | model | **[C]** framework |
| Reference to back-up DPP service provider | A | Annex III(l); Art. 10(4) | model | **[C]** |
| Primary materials per component; upholstery fibres (TLR) | B | Draft "proposed mandatory" | model/component | **[I]** |
| Durability; repairability; recyclability | B | Art. 7(2)(b)(i), Annex I(a),(b),(d); draft "proposed mandatory" | model | **[I]** |
| Joining methods; disassembly/EoL information; recycling route | B | Art. 7(2)(b)(iii); draft | model/component | **[I]** |
| Recycled content (%) | B | Annex I(h); draft "proposed mandatory" | model/batch | **[I]** |
| Care, assembly, repair instructions; spare-part availability and identifiers; take-back info | B | Art. 7(2)(b)(ii); draft "mandatory" | model | **[I]** |
| Adhesives/coatings; preservatives (BPR); flame retardants; VOC/formaldehyde class | C | REACH Annex XVII entry 77 (from 6 Aug 2026, per Commission study Table 6-1), BPR Art. 58; draft "conditional" | component/batch | **[I]** |
| Wood species, country of production, DDS reference | C | EUDR Art. 9; draft "yes, conditional", "resolvable reference" | batch | **[I]** as DPP field; **[C]** as EUDR data |
| Harvest-plot geolocation, supplier identities | C | EUDR Art. 9(d)–(e); draft "restricted" | batch | **[I]** restricted, likely *not* public |
| Forestry certifications; eco-labels | C | Draft "voluntary" | material/batch | **[I]** |
| Carbon footprint; environmental footprint/EPD | C | Annex I(m)–(n); draft "Tbd / methodology required" | model | **[?]** |
| Expected lifetime; manufacturing date; condition, repair and replacement history | C | Draft "voluntary", item level | item | **[?]** |

Forecastable: tier A and substances of concern. Likely: materials per component, durability/repairability, disassembly, recycled content, instructions and spare parts. Guesses: carbon footprint, expected lifetime, item-level history. Of the original six, "Carbon footprint" is the weakest row (the study's label is "methodology required") and "Wood origin & legality" is real data in the wrong regime: EUDR now, DPP maybe, restricted if so. The sectoral precedent supports the skeleton: batteries (Annex XIII), toys (Annex VI) and detergents (Annex VI) all start from identifier, responsible operator, responsibility statement, compliance references, substances list, service-provider reference; toys and detergents are model-level and replace the DoC; batteries add tiered access **[C]**.

## 3. The wood question

**Scope and dates.** EUDR Annex I covers "ex 9401 Seats … of wood" and "9403 30, 40, 50, 60 and 91 Wooden furniture, and parts thereof" **[C]**. Regulation (EU) 2025/2650 (19 December 2025) applies Arts. 3–13 from **30 December 2026**, and 30 June 2027 only for micro and small operators established by 31 December 2024, *except* products already in the EUTR annex **[C]**. The EUTR annex covered 9403 wooden furniture, not 9401 seats **[C]**. A small operator making wooden tables gets no deferral; one making wooden chairs does. Check floors: 3 % of operators per year for standard-risk origin, 9 % high-risk, 1 % low-risk **[C]**.

**Roles, where most furniture companies misjudge themselves.** After 2025/2650 an "operator" is the first placer. A **"downstream operator"** places on the market products made from relevant products *all* already covered by a due diligence statement or simplified declaration, and submits no statement of its own; it keeps, for five years, every supplier's and customer's identity and the **DDS reference numbers** for what it was supplied, and registers in the information system if non-SME (Art. 5) **[C]**. A Danish brand buying EU-milled oak or panels that carry a DDS is a downstream operator. The same brand importing finished chairs from Vietnam, or timber itself, is an operator and owes the full Art. 9 record including geolocation.

| Data | EUDR (Art. 9(1), Annex II, Art. 33) | DPP (Annex III + draft furniture needs) | Serves |
|---|---|---|---|
| Product description, trade name, HS/CN code | (a), Annex II.2; HS code sets quantity units | Annex III(d) CN code; registry and customs key | **Both.** One code, one master record |
| Operator identity, EORI | Annex II.1 | Annex III(g), (j); registry verification | **Both** |
| Wood species, common + scientific | (a) | Draft: "suitable DPP field", public | **Both** |
| Country of production | (c) | Draft: country of origin, model/batch | **Both** |
| Quantity in kg net mass | (b) | Weight (Annex I(j)) at model level | EUDR mainly; different unit logic |
| Supplier name, address, email | (e); Art. 5(3)(a) | Annex III(h) operator identifiers; draft: restricted | **Both**, public in neither |
| Customer name, address, email | (f); Art. 5(3)(b) | Not a passport field | EUDR only |
| Plot geolocation (≥6 decimals; polygons over 4 ha) + production date range | (d), Annex II.3 | Draft: "should generally remain restricted" | **EUDR only** in substance; a DPP holds a pointer at most |
| Deforestation-free and legality evidence, land-use rights | (g), (h) | Draft: "evidence or credential reference" | EUDR; DPP holds the reference |
| Risk assessment, mitigation | Arts. 10–11 | No | EUDR only |
| DDS reference number (plus the verification number the information system issues with it **[?]**) | Art. 33(2)(b); Art. 4(7) passes it downstream | Draft: "resolvable reference"; toys/batteries precedent for compliance references | **Both.** The join key |
| Batch / consignment identity | DDS per placing; refs per product supplied | EN 18219 batch UPI; draft batch ID "mandatory" | **Both.** The other join key |
| FSC/PEFC CoC claim, certificate number | Evidence under (g)–(h), not proof | Draft: voluntary field | Both as evidence, neither as compliance |
| Substances, durability, repair, disassembly, recycled content, carrier, registry, persistence | No | Yes | DPP only |

**What to build first, in order, because each feeds the next and all four are needed for EUDR in 93 days:**

1. **A component-level BOM with a "relevant commodity" flag** and species (common and scientific) on every wooden component, plus the CN code per product. Serves Art. 9(a) today, the DPP materials-per-component field later. The versioned BOM is `component.bom`; the flag and species are what the tool never asks.
2. **A supplier master with legal identity and EUDR role**: name, address, email, EORI where relevant, operator / downstream / trader, SME status, whether the supplier issues its own DDS. Serves Art. 5(3) and 9(e); pre-builds Annex III(h).
3. **A batch record carrying the DDS reference from inbound lot to production batch to product batch ID.** This is the join. Without it EUDR is a filing cabinet and the passport a separate project. Serves Art. 4(7)/5(3) now, batch-level UPI (EN 18219) later.
4. **An evidence store with provenance**: certificate numbers, DDS references, test reports, SDS, keyed to supplier, batch and model, with a public/restricted flag on every field from day one. Serves Art. 9(g)–(h) and pre-decides the EN 18239 access model.

Build later or buy when the act exists: carrier, registry registration and seal, exchange/API conformance, carbon footprint. Do not build now: plot geolocation if you are a downstream operator; item-level serialisation outside the contract channel.

## 4. Suggestions

- **COPY** Rename the result table "What the ESPR framework can ask for, and where furniture is likely to land"; add "The furniture delegated act is expected in 2028; the fields are not yet law."
- **COPY** Replace the six row labels with the tier A rows above (all tiers if space allows), each with its marker.
- **COPY** Under "Wood origin": "Timber origin is an EUDR obligation from 30 December 2026, not a passport field; a passport will most likely carry species, country and the due-diligence statement reference."
- **QUESTION** Reframe `supplier.depth` as an EUDR role question: "When wooden furniture or timber reaches you, does it arrive with a due-diligence statement reference number?" Options: every delivery / some / we import it ourselves / we do not know.
- **QUESTION** Follow-up to `component.bom`: "Can you name the wood species (common and scientific) per component?"
- **QUESTION** "Do you know the CN code your products ship under (9401 or 9403 lines)?" Cheap, and it is the registry, customs and EUDR key.
- **CODE** Cut `passport.carrier` to ≤5; lift `logistics.handoff` and `component.bom`. Round 1 has the mechanism; this adds the reason: the carrier is EN 18220 territory the brand does not control, batch continuity is the shared join key.
- **AFTER-FRIDAY** Rebuild the six rows as per-field statuses driven by real questions (BOM → materials; SoC declaration → substances; DDS reference → wood; instructions → durability/spare parts). New items and a data model.
- **AFTER-FRIDAY** Add the furniture study to radar §7; diarise 6 October and 3 November. Consider a written response with furniture customers.

## Sources

Opened and used today:

- Implementing Decision (EU) 2026/1736: https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202601736
- Implementing Regulation (EU) 2026/1778: https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=OJ:L_202601778
- ESPR (EU) 2024/1781, OJ text via Publications Office: http://publications.europa.eu/resource/celex/32024R1781
- EUDR (EU) 2023/1115: http://publications.europa.eu/resource/celex/32023R1115
- Regulation (EU) 2025/2650: http://publications.europa.eu/resource/celex/32025R2650 and https://eur-lex.europa.eu/eli/reg/2025/2650/oj/eng
- EUTR (EU) 995/2010 annex: http://publications.europa.eu/resource/celex/32010R0995
- Batteries (EU) 2023/1542, Art. 77, Annex XIII: http://publications.europa.eu/resource/celex/32023R1542
- Detergents (EU) 2026/405, Annex VI: http://publications.europa.eu/resource/celex/32026R0405
- Toy Safety (EU) 2025/2509, Art. 19, Annex VI: http://publications.europa.eu/resource/celex/32025R2509
- Commission DPP page: https://single-market-economy.ec.europa.eu/single-market/digital-product-passport_en
- EC Green Forum ESPR hub: https://green-forum.ec.europa.eu/implementing-ecodesign-sustainable-products-regulation_en
- Furniture preparatory study: https://espr-euecolabel-furniture.eu/ · DPP content report: https://espr-euecolabel-furniture.eu/sites/ecodesignfurniture/files/downloads/espr_sr12_furniture_dpp_content_08182026_22092026_clean.pdf
- CEN-CENELEC "EN in the spotlight", 15 July 2026: https://www.cencenelec.eu/news-events/news/2026/en-in-the-spotlight/2026-07-15-dpp/
- EVS scopes: https://www.evs.ee/en/evs-en-18216-2026, …/evs-en-18219-2026, …/evs-en-18220-2026, …/evs-en-18221-2026, …/evs-en-18222-2026, …/evs-en-18223-2026, …/pren-18239, …/pren-18246
- CIRPASS-2 results: https://cirpass2.eu/project-results/ · CIRPASS-1 D3.2: https://cirpassproject.eu/wp-content/uploads/2024/06/D3.2v1.9.pdf · D2.1: https://cirpassproject.eu/wp-content/uploads/2024/06/D2.1_Mapping-of-legal-and-voluntary-requirements-and-Screening-of-emerging-DPP-related-pilots-17-07-2023_new.pdf
- DIN press release, DIN DKE SPEC 99100: https://www.din.de/en/din-and-our-partners/press/press-releases/path-cleared-for-the-battery-passport-1197480
- UKFT note on the May 2026 furniture consultation: https://ukft.org/espr-furniture-may26/
- Secondary, read but not relied on: Regen Studio field guide (updated 16 July 2026), eudigitalproductpassport.org, norruva.org, dpp-tool.com.

## Where I limited myself

- **EN 18239/18246 status.** The CEN-CENELEC DPP topic page (radar Tier 1) is 404; the CEN standards database and iTeh refuse automated reading; the Dansk Standard webshop renders only in a browser. I confirmed "not published, not harmonised" from EVS and the Commission study but could not read CEN's own project record. A person with a browser can settle it in five minutes at standards.cencenelec.eu or webshop.ds.dk.
- **CIRPASS-2 D4.1.** Zenodo rate-limited and then blocked all requests, so I used CIRPASS-1 D3.2 (architecture) and D2.1 (cross-sector attributes) instead. The D4.1 recommendations summary sheet should be read before any conformance position is published.
- **The furniture DPP report.** I read chapters 2, 4, 6.1, 6.3, 7.1, 7.4–7.5, 8, 9 and annex 11.2 in full and skimmed the rest. The MEErP Tasks 1–4 report and the two feedback templates were not opened; Task 1 holds the 9401/9403 scope boundary cases.
- **Registry mechanics.** Impl. Reg. 2026/1778 only; user guidelines and testing environment not opened. Whether a Danish MitID Erhverv certificate satisfies Art. 4's qualified-seal requirement is a question for a trust-service provider.
- **EN standard content.** Scopes come from catalogue reproductions, not the paid texts. Clause-level claims (identifier schemes, carrier symbologies) rest on the Regen Studio guide and the Commission study's table; consistent, but a purchased copy of EN 18219 and EN 18220 would make the conformance table citable clause by clause.
- **REACH entry 77 and PPWR dates** are taken from the Commission study's Table 6-1, not the amending regulations.
- **The DDS "verification number"** is known from the information system's design, not from the regulation text, hence **[?]**.
- **Scope of the table.** Fifteen scenarios rather than the thirteen asked per run, so the conditional follow-ups are covered.
