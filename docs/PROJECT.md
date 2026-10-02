# Furniture DPP assessment — project logic for an agent

2 Oct 2026. This is the document to load before changing the sprint build.
The page is a prototype, not a Prduct product. The code is on `main` of
https://github.com/gvitolocs/prduct_sprint. The live page is
https://demosprint.vercel.app.

Read this first. Then read the file named in the section you are changing.
Do not invent a second assessment, a visible score, or a furniture due date.

## What it is

A respondent picks a product (a lounge chair, an e-bike battery, or a rain
jacket). The camera travels the product's life — company, product, material,
component, supplier, logistics, factory, data, passport, next life — and at
each stop asks one situation. The answer chooses the next situation. At the
end they see a Product Data Landscape: a diagram, the facts they just stated,
and a table of what a furniture passport is likely to ask for. No score. No
"12–18 months".

The sprint question behind the routing: how do purchasing and sales get into
a Digital Product Passport, when compliance is the only department that
usually asks for one. The answer in the tool is that each desk is asked the
version of a stop it can actually answer.

## Technologies

There is no framework and no build step. The page is static files. The
browser loads ES modules.

| Layer | What it uses | Where |
| --- | --- | --- |
| Page | HTML, the Prduct 2026 theme CSS (loaded from prduct.com), local `styles.css` | `index.html`, `classic.html` |
| Journey UI | Web Animations API, one situation panel, a lifecycle rail | `journey/` |
| Questions, routing, evidence | Plain JS module, no UI | `pathfinder/lifecycle.js` |
| Result | Assembled from the journey state | `journey/landscape.js`, `journey/dashboard-view.js` |
| Camera | Stills (AVIF/WebP) and clips (AV1 with H.264 fallback), listed in `journey/manifest.json` | `journey/stage.js`, `journey/media.js`, `journey/media/` |
| Local server | Python 3, `ThreadingHTTPServer`, HTTP range requests so video can seek | `server.py` |
| Deployed API | Vercel serverless, same inbox contract | `api/inbox.js`, `api/session.js`, `api/_auth.js` |
| Tests | `node --test`, no test runner dependency | `pathfinder/tests/*.test.mjs` |
| Type | Montserrat, a Latin subset shipped in `fonts/`. No fallback font for missing glyphs. | `styles.css` |

Not in the running page, so do not add them to make a change:

- React, Vue, a bundler, Tailwind as a build.
- GSAP. `docs/gsap/` is a study note. The journey does not import it.
- A visible maturity score or a month band. Both were removed on purpose.
- The media-generation pipeline. It lives outside this repository, in
  `journey-media/`. This repo only has the delivered stills and clips.

## How a visit runs

1. `index.html` paints the Prduct header, a prototype bar, and the hero.
   The journey is the `#quiz` section and is one viewport tall.
2. `journey/app.js` is the controller. It does not decide which question
   comes next. It asks `pathfinder/lifecycle.js` and plays the camera.
3. The respondent picks a world (`furniture`, `battery`, `textile`). That
   calls `createJourney({ branch })`.
4. The controller calls `getJourneySituation(state)` and renders the prompt
   and the options. A click calls `answerJourney(state, optionId)`.
5. `answerJourney` appends one history entry, updates evidence, then calls
   `nextScenarioId`. That id becomes `state.currentNode`.
6. If the next question sits on a later lifecycle stop, the camera plays the
   clip between those stops and the panel shows the new question on arrival.
   If it sits on the same stop (a follow-up), the panel swaps in place.
7. When `nextScenarioId` returns `reveal.landscape`, the controller hides the
   panel and `journey/landscape.js` draws the result.
8. Back is not an undo of fields. `undoJourney` drops the last answer and
   `replayJourney` rebuilds the state from the remaining option ids, so the
   route is recomputed. A saved visit stores only the branch and the option
   ids (`localStorage` key `prduct.journey.v1`).

## The route is an exclusive choice

This is the part to preserve. It is not a bitwise XOR. It is the same idea:
at each step exactly one question is asked, and which one depends on the
answers so far. Two versions of the same stop are never both asked.

Three choices stack.

**1. The product world, before any question.** Furniture, battery, or textile.
Wording, stills, and which questions exist all key off `state.branch`.
Furniture is the sprint. Battery and textile keep an older, shorter path:
they have no sales module and no purchasing module. Textiles treat model
level as the top rung, like furniture. Batteries keep item level as the top
rung, because the battery passport is one record per battery.

**2. The seat, which is question 1.** "What do you mostly do with this chair?"
The option sets `state.persona`, and `deskProfile` maps that to a desk:

| Option id | Words on the page | Desk id |
| --- | --- | --- |
| `leadership` | Run the business | `lead` |
| `product` | Design, make or document it | `make` |
| `sustainability` | Check it meets the rules | `assure` |
| `procurement` | Buy what goes into it | `buy` |
| `sales` | Sell it | `sell` |
| `service` | Look after it once it is sold | `service` |

**3. Every later stop asks one question, chosen from a slot.** `SLOTS` in
`pathfinder/lifecycle.js` is the ordered list of positions. Each slot has an
`ask` array: the desk versions first, the common question last. `slotChoice`
keeps the ones that still apply, then takes the one whose `desks` includes
this respondent, otherwise the one with no `desks`. One slot, one question.

So the first answer changes the second contentful question, and the first
two change the third. Worked furniture example, material stop, which is the
fourth question:

| Seat answer (Q1) | Channel (Q2) does not change this stop | Question at the material stop |
| --- | --- | --- |
| Sell it | any | `sales.artefact` — what do you actually send a specifier |
| Buy what goes into it | any | `sourcing.topten` — how many of the top ten suppliers could send what they already owe, within a week |
| Any other desk | any | `material.composition` — how well do you know the recipe |

The channel answer does change a later question. After `component.bom`, if
the channel was `contract` or `public` and the desk is design, purchasing,
or compliance, the next question is `sourcing.com` (the customer's own
fabric). A sales respondent never sees `component.bom`; they see
`sales.landing` instead, so that follow-up does not fire for them.

The router never goes back to an earlier slot. `nextScenarioId` starts from
the slot after the last one already answered. The camera only travels
forward. A test locks that.

### What else an answer can change

`followupFor` may insert one extra question immediately after the answer
that called for it, and at most two follow-ups in the whole journey. They
do not replace the stop's own question.

| Just answered | And | Insert |
| --- | --- | --- |
| `supplier.trace` at strength 3 or more | | `supplier.proof` |
| `logistics.handoff` | some earlier answer flagged `supplier-dependency` | `logistics.change` |
| `data.location` at strength 2 or less | not the sales desk | `data.retrieval` |
| `sourcing.topten` at strength 2 or less | purchasing desk | `sourcing.irreplaceable` |
| `component.bom` | channel is contract or public tender, desk is design, purchasing, or compliance | `sourcing.com` |

`askable` then refuses a question when:

- its `when(state)` is false (the EUDR rules below),
- its `branches` does not include this product,
- a topic in its `covers` was already covered (so the two desks' views of
  one fact never both appear),
- its `desks` is a desk the respondent has deferred to,
- its `skipDesks` includes this desk.

Deferral: the option "I would have to ask purchasing" carries
`defersTo: "buy"`. From there, purchasing's versions are not asked. The
person has already said they are not that desk.

### Wood, which is the clearest chain

`supplier.role` is asked before any wood question, except on the sales desk
(sales answers `sales.certificates` at that stop).

| Role answer | Next wood question |
| --- | --- |
| `eu-covered` — it comes from EU suppliers | `supplier.depth` — does the delivery carry a due-diligence statement reference |
| `import` — we or our makers import it | `supplier.trace` — the operator's ladder, up to harvest plot, geolocation, legality |
| `mixed` | both, reference then trace |
| `dont-know` — I would have to ask purchasing | neither, and purchasing's later versions close |
| `little-wood` | neither |
| `we-import` on the reference question | routes into the operator ladder. It is a role, not a gap, so it is unscored |

`we-import` is unscored on purpose. Do not make it the bottom rung.

### Questions that are never asked together

These pairs share a `covers` topic, or they sit in one slot as alternatives.
One respondent gets one of them.

- `material.composition` / `sales.artefact` / `sourcing.topten`
- `component.bom` / `sales.landing`
- `supplier.role` / `sales.certificates`
- `logistics.handoff` / `sourcing.substitution` / `sales.orders`
- `logistics.change` / `sourcing.substitution` (also the honesty check below)
- `factory.evidence` / `sourcing.contractmade` / `sales.reorder`
- `data.owner` / `sourcing.pdf` / `sales.hours`
- `data.retrieval` / `sales.landing`
- `passport.carrier` / `sales.unbid`

`sales.volume` and `sourcing.onboarding` are in `RESERVE`. They stay in the
bank and on no path. Do not put them back on a path without a reason.

### The six desks, furniture, with no follow-ups

Typical answers: retail channel, wood bought in the EU, strong answers.
A star is that desk's own version. Counts move when follow-ups fire.
Sales is always 13. The longest path is leadership with mixed wood and two
follow-ups: 18. The bank holds 36 questions. One respondent sees 12 to 18.

| Desk | Length | Where it leaves the common path |
| --- | --- | --- |
| Leadership | 15 | `regulation.scope` after the passport |
| Design / product | 14 | the common questions |
| Compliance | 15 | `sourcing.whoasks`, then `sourcing.pdf` instead of `data.owner` |
| Purchasing | 14 | `sourcing.topten`, `sourcing.contract`, `sourcing.substitution`, `sourcing.contractmade`; skips next-life continuity |
| Sales | 13 | `sales.artefact`, `sales.landing`, `sales.certificates`, `sales.orders`, `sales.reorder`, `sales.hours`, `sales.unbid` |
| After-sales | 14 | `sales.orders` and `sales.reorder` |

The full prompt text for each of those paths is in
`docs/journey/ADAPTIVE-ASSESSMENT.md`. That file is the narrative spec.
`pathfinder/lifecycle.js` is the code. If they disagree, the code and
`pathfinder/tests/journey.contracts.test.mjs` win.

## How an answer is stored

Each history entry has `scenarioId`, `optionId`, `value` (the label they
saw), `fact` (the short line the result may echo), `strength` 0–4, `flags`,
and `stage`.

An "(it depends)" or "Not sure" rung is `soft`. It is stored at strength 2
with `not-applicable`. It does not write capability evidence and it does not
move the rail, the diagram, or a dashboard mark. The strength 2 is only a
fallback so old maths does not see `undefined`.

Context questions are unscored even when the option has a strength:
`product.perspective`, `sales.channel`, `supplier.role`, the sourcing count,
sales hours, pipeline, regulation scope, and the closing priority. They
route and size. They are listed by `context: true` on the scenario.

Desk-module questions (`kind: "desk"`) do not feed the capability score.
The dimensions they would feed are on `intendedCaptures`, waiting for a
declared weight table that does not exist yet. Do not wire them into
`captures` to "make the score work". There is no score on the result.

`needs-clarification` is set when `logistics.change` is "automatic" and
`sourcing.substitution` is "their call", in either order. One respondent
no longer meets both, because they are alternatives. The flag remains for
the day two people from one company are read together. The test covers that.
Do not delete it.

## What the result is allowed to say

`journey/landscape.js` builds the page the respondent sees.

- The diagram and the facts in their words. Sales landing and artefact are
  echoed under "Where it pays back". Hours are not turned into a price.
  `sales.unbid` is kept for the call, not written up as pipeline value.
- The regulatory sentence is role-aware. EUDR due diligence from
  30 December 2026 is the importer's job. A brand buying inside the EU keeps
  supplier statement references. Do not add "or you cannot ship".
- The table title is "What the ESPR framework can ask for, and where
  furniture is likely to land". Only rows the answers can speak to. Recycled
  content has no question, so it never shows. No status column: a column of
  "Claimed" is what the review said every respondent would see.
- No duration and no month band. No furniture application date exists.
  Indicative adoption is 2028, plus the ESPR minimum transition, so a
  passport is around 2030, and the fields are not law.
- Under a weak `sourcing.contract` answer, one line: a documentation clause
  in the standard purchase-order terms reaches every supplier at the next
  order.

The internal capability object still exists, because the landscape is built
from it. It is not rendered as a score.

## Where to edit

| Change | Edit | Then |
| --- | --- | --- |
| Wording of a prompt or an option | the scenario in `JOURNEY_SCENARIOS` inside `pathfinder/lifecycle.js` | the contract tests, if they quote the string |
| Which desk hears which question | `desks` on the scenario, and the slot's `ask` array in `SLOTS` | `journey.contracts.test.mjs` |
| A new follow-up | a scenario with `kind: "followup"`, a rule in `followupFor`, a line in `FOLLOWUP_RULES` | the same tests. Keep the cap at two. |
| A new product world | `BRANCHES`, stills and clips, `journey/manifest.json` | do not do this for Friday |
| The result sentence or table | `journey/landscape.js` | do not put the month band back |
| The camera | `journey/stage.js`, `journey/media.js` | not the router |
| Who may read responses | `api/_auth.js` | the list is not public |

A new desk version of an existing stop means: write the scenario with
`kind: "desk"`, `desks: ["sell"]` (or whichever), `covers` set to the topic
the common question also covers, and put its id first in that slot's `ask`
array. Do not add a second journey and do not append a block of eight
questions at the end. That shape was built and then removed, because it
made a sales respondent answer about 23 questions and a purchasing
respondent about 24.

Option ids are stable. Saved journeys replay them. Renaming an id breaks
resume; the replay stops at the first id it no longer knows.

## Files

| Path | Role |
| --- | --- |
| `index.html` | The prototype page |
| `classic.html` | The old linear quiz, kept, not the journey |
| `journey/app.js` | Choreography only |
| `journey/panel.js` | The question UI |
| `journey/stage.js` | Still, then clip, then still |
| `journey/rail.js` | The lifecycle rail |
| `journey/landscape.js` | The result |
| `journey/manifest.json` | Branch, stop, still, clip. Generated. Do not hand-edit unless you know the pipeline. |
| `pathfinder/lifecycle.js` | Scenarios, slots, router, evidence |
| `pathfinder/tests/journey.contracts.test.mjs` | The route, the desks, the unscored rungs |
| `pathfinder/tests/lifecycle.test.mjs` | Journey mechanics |
| `docs/journey/ADAPTIVE-ASSESSMENT.md` | The desk map in prose, with every typical path written out |
| `docs/journey/FRIDAY-REVIEW.md` | Status against Stefan's list of 28 Sep |
| `docs/journey/catalogue.html` | Every question and option, with ids |
| `docs/qualification/` | Stefan's four passes and the Friday plan, as received |
| `docs/pathfinder-spec.md` | The earlier capability model. The 13 dimensions live here. The visible product no longer shows them as meters. |
| `docs/github/journey.mp4` | A full walkthrough of the page, questions included |
| `server.py` | Local server and the same inbox lock |
| `api/` | The deployed inbox |

`node --test pathfinder/tests/*.test.mjs` is the check. `?motion=reduced`
on the page forces stills and no video, for the case where a clip fails.

## Inbox

`/inbox.html` can list what the form receives. That list is not public.
Posting an answer stays open. The same rule is in `server.py` and `api/_auth.js`.
The deployed list is not durable.

A privacy note and a consent checkbox are deliberately not in the form yet.
They were deferred until after Friday. Do not collect a real respondent
before they exist.

## What not to do

From the Friday plan, and still in force:

- Do not put a score, a month band, or a win-rate claim on the result.
- Do not price `sales.hours` or `sales.unbid`.
- Do not write "or you cannot ship" on any EUDR line.
- Do not fork a separate sales path or purchasing path.
- Do not let the sales or purchasing questions feed the capability score
  before a declared weight table exists.
- Do not present the administrative passport rows (identifiers, operator
  details, CN code) as the thing the law asks this company to type in.
- Do not remove the prototype bar, and do not point the login control at
  the real Prduct app.

## After Friday, not this delivery

In the order the plan gave them: a declared weight table, a count of fields
the respondent could fill today, per-commodity follow-ups (wood, fabric,
foam, finishes, metal), one real purchasing head and one sales director
with a consent form, a fourth axis for supplier-data capability, the
live-discovery questions as a call sheet, a sales panel for an offer, free
text on the unbid question, a lawyer's pass on a data-delivery clause, a
consumer-retail variant, a Danish pass, and a radar update for the
22 September 2026 furniture study.

The study is the Commission's furniture preparatory work (Fraunhofer IZM
and others for DG ENV). It says model level is the baseline and item level
is voluntary. That is why item-level serialisation is an unscored
"(it depends)" and not the top rung. Batteries are the exception.

## If you change the route

1. Change `SLOTS`, `desks`, `covers`, `when`, or `followupFor` in
   `pathfinder/lifecycle.js`.
2. Update `CONDITIONAL_RULES` or `FOLLOWUP_RULES` in the same file so the
   reason sits next to the rule.
3. Run `node --test pathfinder/tests/*.test.mjs`.
4. If the change is a new path, add the path to
   `docs/journey/ADAPTIVE-ASSESSMENT.md` or the contract test will be the
   only place that knows.
5. Do not retune strengths to chase a score. The result does not show one.
