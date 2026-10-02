# Friday line — status (2026-09-29, updated 2026-10-01)

Against Stefan's "DPP Assessment — Qualification Results and Friday Plan" (28 Sep 2026, in `docs/qualification/`).
Agreed scope: regulatory wording, EUDR role split, model/batch vs item level, "it depends" answers, the sales module;
no score on the result screen. Purchasing and the scoring / field-count work wait until after Friday.
IDs refer to `docs/journey/catalogue.html`.

| # | Stefan's item | Status | IDs |
|---|---|---|---|
| 1 | Cut "A timeline you can act on" and the month band | Done. No duration anywhere on the result screen; the internal dashboard preview dropped it too. | `L:next` |
| 2 | Role-aware hero sentence | Done, verbatim, plus "About five minutes. Real answers." Also in the classic page. | `index.html` |
| 3 | EUDR role question before the wood questions | Done, with the detailed wording (import / EU-covered / both / ask purchasing / little wood). It routes: import → the operator's due-diligence question; EU suppliers or "ask purchasing" → the reference question; both → both; little wood → neither. Never scored. | `Q:supplier.role`, `C:eudr-*` |
| 4 | Re-top four ladders; item level an unscored "(it depends)" | Done: variant records, batch continuity, traceable repair and spare parts, model data are the top rungs; the item rungs and made-to-order are unscored, each with the note ("earns its cost in the contract channel …"). | `Q:product.identity`, `Q:logistics.handoff`, `Q:nextLife.continuity`, `Q:passport.carrier` |
| 5 | Composition top rung: substances declared by the supplier | Done; "Third-party tested" is an unscored "(it depends)". | `Q:material.composition` |
| 6 | "(it depends)" or "Not sure" on every core question | Done — every evidence question has at least one unscored rung on every branch (a contract test checks it). | `Q:*#depends`, `Q:*#not-sure` |
| 7 | `sales.channel` in the core, after the seat | Done, furniture. Shown in the result header ("Sells to"). | `Q:sales.channel` |
| 8 | Seven-question sales module for Sales & customers | Done, text as written; `sales.unbid` last. Landing and artefact are echoed under "Where it pays back · Faster answers" in the respondent's words, with volume and hours as answered — never priced; `sales.unbid` stays for the call. | `Q:sales.*`, `L:next` |
| 9 | Renamed table with its rows and markers | Done: "What the ESPR framework can ask for, and where furniture is likely to land", only the rows the answers speak to, the draft sentence as caption, admin rows as one line, no status column. | `L:passport` |
| 10 | Persona copy + "About five minutes" | "About five minutes" done. The "second act" copy is superseded by the adaptive path (1 Oct): the seat now asks "What do you mostly do with this chair?" and promises the same length, because no act is appended any more. | `Q:product.perspective` |
| 11 | `supplier.depth` as the reference question | Done, with its six rungs. | `Q:supplier.depth` |
| 12 | Route on persona; soft rungs excluded with `not-applicable` | Done: the seat names the desk, which picks each stop's version (adaptive path, 1 Oct); unscored rungs carry `not-applicable` and are stored at strength 2 (the fallback). They write no capability evidence and never move a diagram, rail or dashboard mark. | code |
| 13 | Purchasing module (below the line) | Done 1 Oct by another agent: the eight questions with the adviser-corrected wording, unscored, each with its "(it depends)" rung, the "What your suppliers can deliver today" card and "Sourcing desk" tags. Then reworked into the adaptive path: no longer an appended block of eight at the supplier stop (24 questions for that seat), but the purchasing desk's version of the material, supplier, logistics and factory stops, plus two follow-ups. 12–17 questions. | `Q:sourcing.*`, `docs/journey/ADAPTIVE-ASSESSMENT.md` |
| 14 | Cap `data.location` / `passport.carrier` as score levers | Not needed: no score is shown. | — |
| 15 | `logistics.change` against `sourcing.substitution` | Done by the other agent (`needs-clarification` on "automatic" beside "their call"). In the adaptive path the two are alternatives, so one respondent never meets both; the check stays for when two respondents from one company are read together (tested). | code |
| 16 | PO-terms advice under the contract answer | Done by the other agent: under `sourcing.contract` when the answer is "varies" or weaker. | `L:answers` |

Choices to confirm with Stefan:

- **`we-import` on the reference question** is unscored (doesn't apply) rather than s0: it routes to the operator's question, so it is a role, not a gap.
- **The operator's "full due-diligence path"** is the old trace ladder, reworded for importers (top rung: harvest plot with geolocation and legality evidence), plus the proof follow-up. The plan names the path but not its questions.
- **Modules do not feed the score**, per "What not to do". The dimensions C suggested are recorded as `intendedCaptures`, for when the weight table exists.
- **`sales.channel` is asked at the product stop.** The camera travels stop by stop, so it cannot jump to the customer stop and back.
- **Batteries and textiles were not in the review.** Textiles follow furniture (model as the baseline); batteries keep item level as the top rung (one passport per battery by law). Neither gets the channel question or the sales module.
- **The passport card at the passport stop** now lists draft fields with their likely level, and no verified / claimed / missing status (the status column Stefan says every respondent sees as "claimed").
- **The ESPR rows' mapping to questions**: materials, substances, durability, disassembly and care/spare parts come from the core questions. Wood species / DDS reference and plot geolocation come from the wood questions, the latter only on the operator path. Adhesives, certifications, carbon/EPD and item history come from the sales module. Recycled content has no question behind it, so it never shows.

Since then (1 October):
- **Pilot label** on the logo, a "Sprint prototype" bar at the top, the app login switched off.
- **`/inbox.html` is password-locked** (form login, session cookie, Keychain-friendly, a QR to open it on the phone).
- **The adaptive path** (the brief of 1 Oct): one flow, each stop asks the respondent's desk version of its question. Sales 13 questions instead of ~23, purchasing 12–17 instead of ~24. See `docs/journey/ADAPTIVE-ASSESSMENT.md`.

Not done / open:
- Item 17 and "After Friday", as agreed.
