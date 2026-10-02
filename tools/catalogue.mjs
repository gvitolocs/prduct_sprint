#!/usr/bin/env node
/**
 * Journey catalogue: every asset and every question as its own entry, with a stable ID, so each one
 * can be reviewed and refined on its own.
 *
 *   node tools/catalogue.mjs      -> docs/journey/CATALOGUE.md + docs/journey/catalogue.html
 *
 * Built from the sources the site runs on — journey/manifest.json (media + framing),
 * journey/assets-metadata.json (how each asset was made), pathfinder/lifecycle.js (questions, options,
 * routing), pathfinder/answer-map.js (the end pane), journey/overlays.js + journey/landscape.js (copy) —
 * plus docs/journey/notes.json (review notes by ID). Never edit the outputs by hand.
 *
 * IDs:  FUR / BAT / TEX = furniture / battery / textile
 *       FUR-S04  still at stop 4 (component)     FUR-M04  move from stop 4 to stop 5
 *       Q:data.location   question    Q:data.location#spreadsheet   one of its options
 *       L:diagram  end-pane block     O:data   overlay     C:regulation-battery   copy block
 *       D:links    scored dashboard card (internal preview only, ?view=dashboard)
 */

import { readFileSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  LIFECYCLE_STAGES,
  STAGE_LABELS,
  BRANCHES,
  JOURNEY_SCENARIOS,
  JOURNEY_ORDER,
  FOLLOWUP_RULES,
  CONDITIONAL_RULES,
  CONTEXT_SCENARIO_IDS,
  MODULES,
  PASSPORT_LEVEL,
  strengthFor,
  rungFor,
  createJourney,
  getJourneySituation
} from "../pathfinder/lifecycle.js";
import { DOMAINS, PLATE_LABELS, DASHBOARD_VERSION } from "../pathfinder/dashboard.js";
import { LIFECYCLE_NODES, ANSWER_MAP_VERSION } from "../pathfinder/answer-map.js";
import { DIMENSION_META } from "../pathfinder/dimensions.js";
import { DATA_ROWS, PASSPORT_CARD } from "../journey/overlays.js";
import {
  REGULATION,
  OPPORTUNITY_COPY,
  EUDR_COPY,
  DEPENDS_MOVE,
  ESPR_ROWS,
  ESPR_TITLE,
  ESPR_SOURCE,
  ESPR_ADMIN_LINE
} from "../journey/landscape.js";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(SITE, "docs", "journey");
const manifest = JSON.parse(readFileSync(join(SITE, "journey", "manifest.json"), "utf8"));
const meta = JSON.parse(readFileSync(join(SITE, "journey", "assets-metadata.json"), "utf8"));
const notes = JSON.parse(readFileSync(join(OUT, "notes.json"), "utf8"));

const CODE = { furniture: "FUR", battery: "BAT", textile: "TEX" };
const BRANCH_IDS = Object.keys(BRANCHES);
const pad = (n) => String(n).padStart(2, "0");
const stillId = (b, i) => `${CODE[b]}-S${pad(i + 1)}`;
const moveId = (b, i) => `${CODE[b]}-M${pad(i + 1)}`;
const kb = (p) => {
  try {
    return `${Math.round(statSync(join(SITE, "journey", p)).size / 1024)} KB`;
  } catch {
    return "missing";
  }
};
const clip = (s, n = 600) => (s && s.length > n ? `${s.slice(0, n - 1)}…` : s || "");

/** Questions in travel order: base order with each follow-up right after the question that can trigger it. */
function questionOrder() {
  const after = { "supplier.proof": "supplier.depth", "logistics.change": "logistics.handoff", "data.retrieval": "data.location" };
  const out = [];
  for (const id of JOURNEY_ORDER) {
    out.push(id);
    for (const [f, trig] of Object.entries(after)) if (trig === id) out.push(f);
  }
  return out;
}

/** Wording of one scenario per branch (resolved exactly as the app resolves it). */
function wording(id) {
  const per = {};
  for (const b of BRANCH_IDS) {
    per[b] = getJourneySituation({ ...createJourney({ branch: b }), currentNode: id });
  }
  return per;
}

function sameAcross(values) {
  return values.every((v) => v === values[0]);
}

const RUNG_TEXT = { depends: "it depends", unsure: "not sure", "n/a": "doesn't apply" };

/** "3" when a strength is the same on every branch, else "3 · battery 2" (majority first); unscored rungs by name. */
function strengthText(o, branches) {
  const per = branches.map((b) => [b, rungFor(o, b) ? `— ${RUNG_TEXT[rungFor(o, b)]}` : strengthFor(o, b)]);
  const count = {};
  for (const [, v] of per) count[v] = (count[v] || 0) + 1;
  const top = Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
  const main = /^\d+$/.test(top) ? Number(top) : top;
  const odd = per.filter(([, v]) => v !== main);
  return { main, text: odd.length ? `${main} · ${odd.map(([b, v]) => `${b} ${v}`).join(" · ")}` : String(main) };
}

// ------------------------------------------------------------------ model
const questions = questionOrder().map((id) => {
  const s = JOURNEY_SCENARIOS[id];
  const w = wording(id);
  const on = BRANCH_IDS.filter((b) => !s.branches || s.branches.includes(b));
  const options = s.options.map((o) => {
    const ob = on.filter((b) => !o.branches || o.branches.includes(b));
    const labels = Object.fromEntries(ob.map((b) => [b, w[b].options.find((x) => x.id === o.id)?.label]));
    const st = strengthText(o, ob);
    const notes = [...new Set(ob.map((b) => (typeof o.note === "string" ? o.note : o.note?.[b])).filter(Boolean))];
    return { id: o.id, strength: typeof st.main === "number" ? st.main : "u", strengthText: s.context ? "—" : st.text,
             fact: [o.fact, ...notes].filter(Boolean).join(" — ") || null, flags: [...(o.flags || []), ...(o.varies ? ["varies"] : [])],
             branches: o.branches || null, labels, soft: !!o.soft, persona: o.setsPersona || null, opportunity: o.opportunity || null };
  });
  const node = LIFECYCLE_NODES.find((n) => n.scenarios.includes(id));
  return {
    id,
    qid: `Q:${id}`,
    stage: s.stage,
    kind: s.kind === "module" ? `module (${MODULES[s.module]?.label || s.module})` : s.kind,
    branches: on,
    interaction: s.interaction || "select",
    prompts: Object.fromEntries(on.map((b) => [b, w[b].prompt])),
    details: Object.fromEntries(on.map((b) => [b, w[b].detail])),
    why: s.why || null,
    rule: FOLLOWUP_RULES[id] || CONDITIONAL_RULES[id] || null,
    captures: (s.captures || []).map((d) => DIMENSION_META[d]?.label || d),
    later: (s.intendedCaptures || []).map((d) => DIMENSION_META[d]?.label || d),
    spine: s.spineTouch || [],
    calculator: s.calculatorKeys || [],
    node: node ? `L:answers-${node.id}` : CONTEXT_SCENARIO_IDS.includes(id) ? "context (shown, never scored)" : null,
    shownOn: on.map((b) => stillId(b, LIFECYCLE_STAGES.indexOf(s.stage))),
    options
  };
});

const branches = BRANCH_IDS.map((b) => {
  const br = manifest.branches[b];
  const stops = LIFECYCLE_STAGES.map((stage, i) => {
    const a = br.anchors[stage];
    const m = meta.anchors[`${b}/${stage}`] || {};
    return {
      id: stillId(b, i),
      stage,
      label: STAGE_LABELS[stage],
      alt: a.alt,
      web: `journey/${a.base}-960.webp`,
      files: a.widths.flatMap((wd) => ["avif", "webp"].map((x) => `journey/${a.base}-${wd}.${x}`)),
      size: kb(`${a.base}-1920.avif`),
      framing: { focus: a.focus, panel: a.panel, hotspot: a.hotspot || null, hotspotSide: a.hotspotSide || null },
      master: m.final || `journey-media/final/${b}/${stage}.png`,
      method: m.method || "",
      prompt: m.prompt || null,
      source: m.source || m.picked_candidate || null,
      questions: questions.filter((q) => q.stage === stage && q.branches.includes(b)).map((q) => q.qid)
    };
  });
  const moves = LIFECYCLE_STAGES.slice(0, -1).map((stage, i) => {
    const pair = `${stage}>${LIFECYCLE_STAGES[i + 1]}`;
    const t = br.transitions[pair];
    const m = meta.transitions[`${b}/${pair}`] || {};
    return {
      id: moveId(b, i),
      pair,
      from: stillId(b, i),
      to: stillId(b, i + 1),
      label: `${STAGE_LABELS[stage]} → ${STAGE_LABELS[LIFECYCLE_STAGES[i + 1]]}`,
      video: `journey/${t.base}-540-h264.mp4`,
      files: t.sizes.flatMap((sz) => t.codecs.map((c) => `journey/${t.base}-${sz}-${c}.mp4`)),
      size: kb(`${t.base}-1080-av1.mp4`),
      timing: `${t.frames} frames · ${t.fps} fps · ${t.duration} s · question cue at ${Math.round(t.cue * 100)}%`,
      master: m.final || `journey-media/final/${b}/${stage}-${LIFECYCLE_STAGES[i + 1]}.mp4`,
      type: m.type || "",
      move: m.move || (m.a_push ? `${m.a_push} + reversed ${m.b_push_reversed}` : null),
      scene: m.scene || null,
      prompt: m.prompt || null,
      seed: m.seed ?? null,
      take: m.take || null
    };
  });
  return { id: b, code: CODE[b], industry: br.industry, object: br.object, desktopFocus: br.desktopFocus || null, stops, moves };
});

const nodeLabel = (id) => LIFECYCLE_NODES.find((n) => n.id === id)?.label || id;
const endPane = [
  { id: "L:context", title: "Header · who answered", what: "“Answered from” the seat (Q:product.perspective) and the “First priority” (Q:nextLife.unlock) — context, never scored. No counts, no percentages." },
  { id: "L:diagram", title: "Lifecycle diagram", what: "Six nodes (supplier → material → component → product → customer → next life) and the five links between them. Each mark comes from the scored answers placed there, on the options' own ladder: Holds / Partly / Weak / Broken; Open when only unscored rungs (“it depends”, “not sure”, “doesn't apply”) speak to it. The caption names where information first gets lost (the first weak or broken link). Clicking a node scrolls to its answers." },
  ...LIFECYCLE_NODES.map((n) => ({
    id: `L:answers-${n.id}`,
    title: `What you told us · ${n.label}`,
    what: `The answers to ${n.scenarios.map((x) => `Q:${x}`).join(", ")} (only those asked), each under its question in the respondent's own words, marked holds (3–4) / partly (2) / gap (0–1), or by their unscored rung: it depends / not sure / doesn't apply (with the option's note, e.g. why item level is not scored).${
      n.id === "supplier" ? " From the Sourcing seat (furniture), the purchasing module's seven ladders appear here tagged “Sourcing desk”; under Q:sourcing.contract, a varies-or-weaker answer earns the free PO-terms advice." : ""
    }${
      n.id === "customer" ? " From the Sales seat (furniture), the sales module's four ladders appear here tagged “Sales desk”." : ""
    }`
  })),
  { id: "L:next", title: "Make this reliable next", what: `Up to three first moves from the capability model and the weakest links, plus “Where it pays back” notes (C:opportunity-…). When an answer varies (“It depends on the supplier / the line …”), the first move is C:depends-move. From the Sales seat, “Where it pays back · Faster answers” echoes Q:sales.landing and Q:sales.artefact in the respondent's words, with Q:sales.volume and Q:sales.hours as answered — never priced; Q:sales.unbid stays for the call. From the Sourcing seat, “What your suppliers can deliver today” echoes Q:sourcing.whoasks and Q:sourcing.irreplaceable, with the Q:sourcing.topten count as answered. No timeline.` },
  { id: "L:passport", title: `Furniture: ${ESPR_TITLE}`, what: `C:regulation-furniture, then the rows below that the respondent's answers speak to (a row shows when one of its questions was asked), captioned “${ESPR_SOURCE}” and followed by “${ESPR_ADMIN_LINE}”. Then the EUDR block: C:eudr-intro plus the copy for the answer to Q:supplier.role. Batteries and textiles keep “Before the passport”: C:regulation-…, C:passport-level-… and the field names below (no status).`, espr: ESPR_ROWS, labels: PLATE_LABELS }
];

const dashboard = [
  { id: "D:passport", title: "Passport data", what: "The six passport fields (composition, origin, hazards, durability, carbon, end of life), named per branch. Ready = verified from the answers; claimed = asserted but not proven (lighter bar); missing otherwise.", labels: PLATE_LABELS },
  { id: "D:links", title: "Lifecycle links", what: "The five links supplier → material → component → product → customer → next life. A link holds when the answers that carry it are connected or verified; partial counts as 'partly'; weak, broken or unanswered do not." },
  { id: "D:capabilities", title: "Data capabilities", what: "The 13 capability dimensions of the Pathfinder model. Solid = score 61+ (repeatable), partial = 41–60, otherwise person-dependent or not assessed." },
  ...DOMAINS.map((d) => ({
    id: `D:attention-${d.id}`,
    title: `Needs attention · ${d.title}`,
    what: `The answers given to ${d.scenarios.map((x) => `Q:${x}`).join(", ")} (follow-ups only when asked). OK = strength 3 or 4; everything else needs attention.`
  }))
];

const overlays = [
  { id: "O:data", title: "This code connects to (data stop)", what: DATA_ROWS.map((r) => `${r.label} ← ${r.from.map((x) => `Q:${x}`).join(" or ")}`).join("; ") + ". Each row shows linked / partial / missing from that answer's strength, or open for an unscored rung." },
  ...Object.entries(PASSPORT_CARD).map(([b, c]) => ({
    id: `O:passport-${b}`,
    title: `Passport card (passport stop) · ${b}`,
    what: `“${c.kicker}”: ${c.rows.map(([k, v]) => `${k} (${v})`).join("; ")}. Footnote: “${c.foot}”. No status per field.`
  }))
];

const copy = [
  ...Object.entries(REGULATION).map(([b, text]) => ({ id: `C:regulation-${b}`, title: `Regulation note · ${b}`, text })),
  ...Object.entries(PASSPORT_LEVEL).map(([b, text]) => ({ id: `C:passport-level-${b}`, title: `Passport kept per · ${b}`, text })),
  ...Object.entries(EUDR_COPY).map(([id, text]) => ({ id: `C:eudr-${id}`, title: id === "intro" ? "EUDR · intro (furniture)" : `EUDR · role: ${id}`, text })),
  { id: "C:depends-move", title: "First move after “It depends”", text: DEPENDS_MOVE },
  ...Object.entries(OPPORTUNITY_COPY).map(([id, c]) => ({
    id: `C:opportunity-${id}`,
    title: `Where it pays back · ${c.title}`,
    text: c.all || BRANCH_IDS.map((b) => `${b}: ${c[b]}`).join(" | ")
  }))
];

const allIds = [
  ...branches.flatMap((b) => [...b.stops.map((s) => s.id), ...b.moves.map((m) => m.id)]),
  ...questions.map((q) => q.qid),
  ...endPane.map((d) => d.id),
  ...dashboard.map((d) => d.id),
  ...overlays.map((o) => o.id),
  ...copy.map((c) => c.id)
];
const orphanNotes = Object.keys(notes).filter((k) => !k.startsWith("_") && !allIds.includes(k));
if (orphanNotes.length) console.warn("notes.json has IDs that are not in the catalogue:", orphanNotes.join(", "));
const noteOf = (id) => notes[id] || null;
const openNotes = Object.entries(notes).filter(([k, n]) => !k.startsWith("_") && n.status !== "ok");

// ------------------------------------------------------------------ markdown
function md() {
  const L = [];
  const note = (id) => {
    const n = noteOf(id);
    return n ? `> **${n.status.toUpperCase()}** — ${n.note}` : null;
  };
  L.push("# Journey catalogue", "");
  L.push(`Every asset and question of the cinematic assessment, one entry each. Generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC by \`node tools/catalogue.mjs\` from the files the site runs on — do not edit by hand. Review notes live in \`docs/journey/notes.json\` (keyed by ID).`, "");
  L.push("**IDs** — `FUR`/`BAT`/`TEX` = furniture / battery / textile · `S04` = still at stop 4 · `M04` = move from stop 4 to 5 · `Q:<id>` = question (`#<option>` = one answer) · `L:` end-pane block · `O:` overlay · `C:` copy block · `D:` scored dashboard card (internal preview only).", "");
  L.push(`**Open review notes (${openNotes.length})** — ${openNotes.map(([k, n]) => `\`${k}\` (${n.status})`).join(", ") || "none"}`, "");
  L.push("## Contents", "", ...branches.map((b) => `- [${b.industry} · ${b.object}](#${b.id})`), "- [Questions](#questions)", "- [End pane](#end-pane)", "- [Overlays and copy](#overlays-and-copy)", "- [Internal preview: scored dashboard](#dashboard)", "");

  for (const b of branches) {
    L.push(`<a id="${b.id}"></a>`, `## ${b.industry} · ${b.object} (${b.code})`, "");
    if (b.desktopFocus) L.push(`Desktop framing for the whole branch: \`${b.desktopFocus}\` (phones use each stop's own focus).`, "");
    L.push("| Stop | Still | Questions here | Move to next |", "|---|---|---|---|");
    b.stops.forEach((s, i) => {
      L.push(`| ${pad(i + 1)} ${s.label} | \`${s.id}\` | ${s.questions.map((q) => `\`${q}\``).join(" ") || "—"} | ${b.moves[i] ? `\`${b.moves[i].id}\`` : "—"} |`);
    });
    L.push("");
    b.stops.forEach((s, i) => {
      L.push(`### ${s.id} · ${s.label}`, "", `![${s.alt}](../../${s.web})`, "");
      L.push(`- **Alt text:** ${s.alt}`);
      L.push(`- **Framing:** focus \`${s.framing.focus}\`, question panel ${s.framing.panel}${s.framing.hotspot ? `, overlay at ${s.framing.hotspot.join("% / ")}% (${s.framing.hotspotSide || "auto"})` : ""}`);
      L.push(`- **Made:** ${clip(s.method, 400)}`);
      if (s.prompt) L.push(`- **Prompt:** ${clip(s.prompt, 700)}`);
      if (s.source) L.push(`- **Source:** \`${typeof s.source === "string" ? s.source : JSON.stringify(s.source)}\``);
      L.push(`- **Files:** master \`${s.master}\`; web ${s.files.length} files (\`${s.files[0]}\` …), 1920 AVIF ${s.size}`);
      L.push(`- **Questions:** ${s.questions.map((q) => `\`${q}\``).join(", ") || "none (selector card)"}`);
      const n = note(s.id);
      if (n) L.push("", n);
      L.push("");
      const m = b.moves[i];
      if (!m) return;
      L.push(`### ${m.id} · ${m.label}`, "", `[▶ ${m.video}](../../${m.video}) — \`${m.from}\` → \`${m.to}\``, "");
      L.push(`- **Timing:** ${m.timing}`);
      L.push(`- **Made:** ${clip(m.type, 400)}`);
      if (m.move) L.push(`- **Move:** \`${m.move}\`${m.scene ? ` · scene \`${m.scene}\`` : ""}${m.seed != null ? ` · seed ${m.seed}` : ""}${m.take ? ` · take \`${m.take}\`` : ""}`);
      if (m.prompt) L.push(`- **Prompt:** ${clip(m.prompt, 700)}`);
      L.push(`- **Files:** master \`${m.master}\`; web ${m.files.length} files, 1080 AV1 ${m.size}`);
      const mn = note(m.id);
      if (mn) L.push("", mn);
      L.push("");
    });
  }

  L.push('<a id="questions"></a>', "## Questions", "", `In travel order; follow-ups sit after the question that can trigger them. ${FOLLOWUP_RULES.budget}`, "");
  for (const q of questions) {
    L.push(`### ${q.qid} · ${STAGE_LABELS[q.stage]} · ${q.kind}${q.interaction !== "select" ? ` (${q.interaction})` : ""}`, "");
    const only = q.branches.length < BRANCH_IDS.length ? ` (${q.branches.join(", ")} only)` : "";
    const prompts = q.branches.map((b) => q.prompts[b]);
    if (sameAcross(prompts)) L.push(`**Prompt${only}:** ${prompts[0]}`);
    else for (const b of q.branches) L.push(`- **Prompt · ${b}:** ${q.prompts[b]}`);
    const details = q.branches.map((b) => q.details[b]);
    if (details.some(Boolean)) {
      if (sameAcross(details)) L.push("", `**Detail:** ${details[0]}`);
      else for (const b of q.branches) L.push(`- **Detail · ${b}:** ${q.details[b] || "—"}`);
    }
    if (q.rule) L.push("", `**Asked when:** ${q.rule}${q.why ? ` **Why line:** “${q.why}”` : ""}`);
    L.push("", `**Shown on:** ${q.shownOn.map((x) => `\`${x}\``).join(" · ")} · **End pane:** ${q.node ? `\`${q.node}\`` : "—"}`);
    L.push(`**Scores:** ${q.captures.join(", ") || "—"}${q.later.length ? ` (after the weight table: ${q.later.join(", ")})` : ""}${q.spine.length ? ` · spine: ${q.spine.join(", ")}` : ""}${q.calculator.length ? ` · calculator: ${q.calculator.join(", ")}` : ""}`, "");
    L.push("| Option | Answer | Strength | Records | Flags |", "|---|---|---|---|---|");
    for (const o of q.options) {
      const labels = Object.values(o.labels);
      const label = sameAcross(labels) ? labels[0] : Object.entries(o.labels).map(([b, l]) => `*${b}:* ${l}`).join("<br>");
      L.push(`| \`${q.qid}#${o.id}\`${o.branches ? ` (${o.branches.join(", ")} only)` : ""} | ${label} | ${o.strengthText} | ${o.fact || (o.persona ? `persona: ${o.persona}` : o.opportunity ? `priority: ${o.opportunity}` : "—")} | ${o.flags.join(", ") || "—"} |`);
    }
    const n = note(q.qid);
    if (n) L.push("", n);
    L.push("");
  }

  L.push('<a id="end-pane"></a>', `## End pane (${ANSWER_MAP_VERSION})`, "", "Built by `pathfinder/answer-map.js` from the finalized journey and rendered by `journey/landscape.js`: the company's own answers on the lifecycle. No score, percentage, count or timeline (a contract test checks that the model carries no number at all).", "");
  for (const d of endPane) {
    L.push(`### ${d.id} · ${d.title}`, "", d.what, "");
    if (d.espr) {
      L.push("| Field | Likely level | Basis | Shown when asked |", "|---|---|---|---|");
      for (const r of d.espr) L.push(`| ${r.field} | ${r.level} | ${r.marker} | ${r.from.map((x) => `\`Q:${x}\``).join(" ")} |`);
      L.push("");
    }
    if (d.labels) {
      L.push("| Field | furniture | battery | textile |", "|---|---|---|---|");
      for (const f of Object.keys(d.labels.furniture)) L.push(`| ${f} | ${d.labels.furniture[f]} | ${d.labels.battery[f]} | ${d.labels.textile[f]} |`);
      L.push("");
    }
    const n = note(d.id);
    if (n) L.push(n, "");
  }
  L.push('<a id="overlays-and-copy"></a>', "## Overlays and copy", "");
  for (const o of overlays) L.push(`### ${o.id} · ${o.title}`, "", o.what, "");
  for (const c of copy) L.push(`### ${c.id} · ${c.title}`, "", c.text, "");
  L.push('<a id="dashboard"></a>', `## Internal preview: scored dashboard (${DASHBOARD_VERSION})`, "", "Not shown in the demo — kept for when the scoring has a defensible weighting. Open it with `?view=dashboard`. Built by `pathfinder/dashboard.js`; every number is a count of the respondent's own answers.", "");
  for (const d of dashboard) {
    L.push(`### ${d.id} · ${d.title}`, "", d.what, "");
    if (d.labels) {
      L.push("| Field | furniture | battery | textile |", "|---|---|---|---|");
      for (const f of Object.keys(d.labels.furniture)) L.push(`| ${f} | ${d.labels.furniture[f]} | ${d.labels.battery[f]} | ${d.labels.textile[f]} |`);
      L.push("");
    }
    const n = note(d.id);
    if (n) L.push(n, "");
  }
  return L.join("\n") + "\n";
}

// ------------------------------------------------------------------ html
const h = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function html() {
  const noteHtml = (id) => {
    const n = noteOf(id);
    return n ? `<p class="note" data-status="${h(n.status)}"><b>${h(n.status)}</b> ${h(n.note)}</p>` : "";
  };
  const idTag = (id) => `<button class="id" type="button" data-copy="${h(id)}" title="Copy ID">${h(id)}</button>`;
  const branchHtml = (b) => `
    <section id="${b.id}" class="branch">
      <h2>${h(b.industry)} · ${h(b.object)} <span>${b.code}</span></h2>
      ${b.desktopFocus ? `<p class="muted">Desktop framing for the whole branch: <code>${h(b.desktopFocus)}</code>; phones use each stop's own focus.</p>` : ""}
      <div class="stops">
      ${b.stops
        .map((s, i) => {
          const m = b.moves[i];
          return `
        <article class="card" id="${s.id}">
          <header>${idTag(s.id)}<h3>${pad(i + 1)} · ${h(s.label)}</h3></header>
          <img src="../../${h(s.web)}" alt="${h(s.alt)}" loading="lazy">
          <dl>
            <dt>Alt</dt><dd>${h(s.alt)}</dd>
            <dt>Framing</dt><dd>focus <code>${h(s.framing.focus)}</code>, panel ${h(s.framing.panel)}${s.framing.hotspot ? `, overlay ${s.framing.hotspot.join("% / ")}%` : ""}</dd>
            <dt>Made</dt><dd>${h(clip(s.method, 320))}</dd>
            ${s.prompt ? `<dt>Prompt</dt><dd class="small">${h(clip(s.prompt, 500))}</dd>` : ""}
            <dt>Files</dt><dd class="small"><code>${h(s.master)}</code> · 1920 AVIF ${h(s.size)}</dd>
            <dt>Questions</dt><dd>${s.questions.map((q) => `<a href="#${h(q)}">${h(q)}</a>`).join(" ") || "—"}</dd>
          </dl>
          ${noteHtml(s.id)}
        </article>
        ${m ? `
        <article class="card move" id="${m.id}">
          <header>${idTag(m.id)}<h3>${h(m.label)}</h3></header>
          <video src="../../${h(m.video)}" poster="../../${h(s.web)}" controls muted playsinline preload="none"></video>
          <dl>
            <dt>Timing</dt><dd>${h(m.timing)}</dd>
            <dt>Made</dt><dd>${h(clip(m.type, 320))}</dd>
            ${m.move ? `<dt>Move</dt><dd class="small"><code>${h(m.move)}</code>${m.seed != null ? ` · seed ${h(m.seed)}` : ""}${m.take ? ` · <code>${h(m.take)}</code>` : ""}</dd>` : ""}
            ${m.prompt ? `<dt>Prompt</dt><dd class="small">${h(clip(m.prompt, 500))}</dd>` : ""}
            <dt>Files</dt><dd class="small"><code>${h(m.master)}</code> · 1080 AV1 ${h(m.size)}</dd>
          </dl>
          ${noteHtml(m.id)}
        </article>` : ""}`;
        })
        .join("")}
      </div>
    </section>`;

  const qHtml = (q) => {
    const prompts = q.branches.map((b) => q.prompts[b]);
    const details = q.branches.map((b) => q.details[b]);
    const per = (vals, label) =>
      sameAcross(vals)
        ? `<p><b>${label}</b>${q.branches.length < BRANCH_IDS.length ? ` <small>(${h(q.branches.join(", "))} only)</small>` : ""} ${h(vals[0])}</p>`
        : `<ul class="per">${q.branches.map((b, i) => `<li><b>${b}</b> ${h(vals[i] || "—")}</li>`).join("")}</ul>`;
    return `
    <article class="card q" id="${h(q.qid)}">
      <header>${idTag(q.qid)}<h3>${h(STAGE_LABELS[q.stage])} · ${h(q.kind)}${q.interaction !== "select" ? ` · ${h(q.interaction)}` : ""}</h3></header>
      ${per(prompts, "Prompt")}
      ${details.some(Boolean) ? per(details, "Detail") : ""}
      ${q.rule ? `<p class="rule"><b>Asked when</b> ${h(q.rule)}${q.why ? ` <i>“${h(q.why)}”</i>` : ""}</p>` : ""}
      <p class="muted">Shown on ${q.shownOn.map((x) => `<a href="#${x}">${x}</a>`).join(" · ")} · end pane ${q.node ? (q.node.startsWith("L:") ? `<a href="#${h(q.node)}">${h(q.node)}</a>` : h(q.node)) : "—"} · scores ${h(q.captures.join(", ") || "—")}${q.later.length ? ` (after the weight table: ${h(q.later.join(", "))})` : ""}</p>
      <table>
        <thead><tr><th>Option</th><th>Answer</th><th>S</th><th>Records</th><th>Flags</th></tr></thead>
        <tbody>${q.options
          .map((o) => {
            const labels = Object.values(o.labels);
            const label = sameAcross(labels) ? h(labels[0]) : Object.entries(o.labels).map(([b, l]) => `<i>${b}</i> ${h(l)}`).join("<br>");
            return `<tr><td>${idTag(`${q.qid}#${o.id}`)}${o.branches ? `<small> ${h(o.branches.join(", "))} only</small>` : ""}</td><td>${label}</td><td class="s s${o.strength}">${h(o.strengthText)}</td><td>${h(o.fact || (o.persona ? `persona: ${o.persona}` : o.opportunity ? `priority: ${o.opportunity}` : "—"))}</td><td class="small">${h(o.flags.join(", ") || "—")}</td></tr>`;
          })
          .join("")}</tbody>
      </table>
      ${noteHtml(q.qid)}
    </article>`;
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Journey catalogue</title>
<style>
  :root { --bg: #f6f6f7; --card: #fff; --ink: #17171b; --ink-2: #55555e; --ink-3: #85858e; --line: #e4e4e9; --violet: #6d4cff; --ok: #3f9a62; --check: #c7892f; --refine: #d1553f; }
  @media (prefers-color-scheme: dark) { :root { --bg: #121214; --card: #1c1c20; --ink: #eeeef2; --ink-2: #b4b4bd; --ink-3: #8b8b95; --line: #2d2d34; --violet: #a28dff; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--ink); font: 14px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
  nav { position: sticky; top: 0; z-index: 5; display: flex; flex-wrap: wrap; gap: 6px 16px; align-items: center; padding: 10px 16px; background: color-mix(in srgb, var(--bg) 92%, transparent); backdrop-filter: blur(8px); border-bottom: 1px solid var(--line); }
  nav b { margin-right: 8px; }
  nav a { color: var(--ink-2); text-decoration: none; }
  nav a:hover { color: var(--violet); }
  main { max-width: 1320px; margin: 0 auto; padding: 16px; }
  h1 { font-size: 26px; margin: 18px 0 4px; }
  h2 { font-size: 21px; margin: 34px 0 10px; }
  h2 span { font-size: 12px; color: var(--ink-3); letter-spacing: .12em; }
  h3 { font-size: 15px; margin: 0; }
  .muted { color: var(--ink-3); }
  .small { font-size: 12.5px; color: var(--ink-2); }
  code { font-size: 12px; background: color-mix(in srgb, var(--ink) 7%, transparent); padding: 1px 5px; border-radius: 4px; word-break: break-all; }
  .open { display: flex; flex-wrap: wrap; gap: 8px; margin: 10px 0 0; padding: 0; list-style: none; }
  .open li { background: var(--card); border: 1px solid var(--line); border-radius: 999px; padding: 3px 10px; font-size: 12.5px; }
  .open a { color: inherit; text-decoration: none; }
  .stops { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 340px), 1fr)); gap: 14px; }
  .card { background: var(--card); border: 1px solid var(--line); border-radius: 10px; padding: 14px 16px; display: grid; gap: 10px; align-content: start; scroll-margin-top: 60px; }
  .card:target { outline: 2px solid var(--violet); }
  .card header { display: flex; align-items: center; gap: 10px; }
  .card img, .card video { width: 100%; aspect-ratio: 16 / 9; object-fit: cover; border-radius: 6px; background: #000; }
  .card.move { border-style: dashed; }
  dl { display: grid; grid-template-columns: 78px minmax(0, 1fr); gap: 4px 10px; margin: 0; }
  dt { color: var(--ink-3); font-size: 12px; }
  dd { margin: 0; }
  .id { font: 600 12px/1 ui-monospace, monospace; color: var(--violet); background: color-mix(in srgb, var(--violet) 12%, transparent); border: 0; border-radius: 5px; padding: 4px 7px; cursor: copy; white-space: nowrap; }
  .id.copied { color: var(--ok); }
  .note { margin: 0; padding: 8px 10px; border-radius: 6px; background: color-mix(in srgb, var(--ink) 5%, transparent); font-size: 13px; }
  .note b { text-transform: uppercase; font-size: 11px; letter-spacing: .08em; margin-right: 6px; }
  .note[data-status="ok"] b { color: var(--ok); } .note[data-status="check"] b { color: var(--check); }
  .note[data-status="refine"] b, .note[data-status="next"] b { color: var(--refine); }
  .qs { display: grid; gap: 14px; }
  .q p { margin: 0; }
  .per { margin: 0; padding-left: 18px; }
  .rule { color: var(--ink-2); }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; vertical-align: top; padding: 6px 8px; border-top: 1px solid var(--line); }
  th { color: var(--ink-3); font-weight: 500; font-size: 12px; }
  td.s { font-weight: 700; text-align: center; }
  .s0 { color: var(--refine); } .s1 { color: #d9803f; } .s2 { color: var(--check); } .s3 { color: #6aa56a; } .s4 { color: var(--ok); }
  .defs { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 380px), 1fr)); gap: 14px; }
</style>
</head>
<body>
<nav><b>Journey catalogue</b>${branches.map((b) => `<a href="#${b.id}">${h(b.object)}</a>`).join("")}<a href="#questions">Questions</a><a href="#end-pane">End pane</a><a href="#copy">Overlays & copy</a><a href="#dashboard">Internal: scored dashboard</a></nav>
<main>
  <h1>Journey catalogue</h1>
  <p class="muted">Every asset and question, one entry each — generated ${new Date().toISOString().slice(0, 16).replace("T", " ")} UTC by <code>node tools/catalogue.mjs</code>. Click an ID to copy it; notes come from <code>docs/journey/notes.json</code>.</p>
  <ul class="open">${openNotes.map(([k, n]) => `<li><a href="#${h(k)}">${h(k)}</a> · ${h(n.status)}</li>`).join("")}</ul>
  ${branches.map(branchHtml).join("")}
  <section id="questions"><h2>Questions <span>${questions.length}</span></h2><p class="muted">In travel order; follow-ups sit after the question that can trigger them. ${h(FOLLOWUP_RULES.budget)}</p><div class="qs">${questions.map(qHtml).join("")}</div></section>
  <section id="end-pane"><h2>End pane <span>${h(ANSWER_MAP_VERSION)}</span></h2><p class="muted">The company's own answers on the lifecycle — no score, percentage, count or timeline.</p><div class="defs">${endPane
    .map((d) => `<article class="card" id="${h(d.id)}"><header>${idTag(d.id)}<h3>${h(d.title)}</h3></header><p>${h(d.what)}</p>${
      d.espr
        ? `<table><thead><tr><th>Field</th><th>Likely level</th><th>Basis</th><th>Shown when asked</th></tr></thead><tbody>${d.espr
            .map((r) => `<tr><td>${h(r.field)}</td><td>${h(r.level)}</td><td>${h(r.marker)}</td><td class="small">${r.from.map((x) => h(`Q:${x}`)).join(" ")}</td></tr>`)
            .join("")}</tbody></table>`
        : ""
    }${
      d.labels
        ? `<table><thead><tr><th>Field</th>${BRANCH_IDS.map((b) => `<th>${b}</th>`).join("")}</tr></thead><tbody>${Object.keys(d.labels.furniture)
            .map((f) => `<tr><td>${f}</td>${BRANCH_IDS.map((b) => `<td>${h(d.labels[b][f])}</td>`).join("")}</tr>`)
            .join("")}</tbody></table>`
        : ""
    }${noteHtml(d.id)}</article>`)
    .join("")}</div></section>
  <section id="copy"><h2>Overlays and copy</h2><div class="defs">${[...overlays.map((o) => ({ ...o, text: o.what })), ...copy]
    .map((c) => `<article class="card" id="${h(c.id)}"><header>${idTag(c.id)}<h3>${h(c.title)}</h3></header><p>${h(c.text)}</p>${noteHtml(c.id)}</article>`)
    .join("")}</div></section>
  <section id="dashboard"><h2>Internal preview: scored dashboard <span>${h(DASHBOARD_VERSION)}</span></h2><p class="muted">Not shown in the demo; open with <code>?view=dashboard</code>. Kept for when the scoring has a defensible weighting.</p><div class="defs">${dashboard
    .map((d) => `<article class="card" id="${h(d.id)}"><header>${idTag(d.id)}<h3>${h(d.title)}</h3></header><p>${h(d.what)}</p>${
      d.labels
        ? `<table><thead><tr><th>Field</th>${BRANCH_IDS.map((b) => `<th>${b}</th>`).join("")}</tr></thead><tbody>${Object.keys(d.labels.furniture)
            .map((f) => `<tr><td>${f}</td>${BRANCH_IDS.map((b) => `<td>${h(d.labels[b][f])}</td>`).join("")}</tr>`)
            .join("")}</tbody></table>`
        : ""
    }${noteHtml(d.id)}</article>`)
    .join("")}</div></section>
</main>
<script>
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".id");
    if (!b) return;
    navigator.clipboard?.writeText(b.dataset.copy).then(() => { b.classList.add("copied"); setTimeout(() => b.classList.remove("copied"), 900); }).catch(() => {});
  });
</script>
</body>
</html>
`;
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "CATALOGUE.md"), md());
writeFileSync(join(OUT, "catalogue.html"), html());
console.log(`catalogue: ${branches.length * 19} assets, ${questions.length} questions (${questions.reduce((a, q) => a + q.options.length, 0)} options), ${endPane.length} end-pane blocks (+${dashboard.length} internal dashboard cards), ${overlays.length + copy.length} overlays/copy; ${openNotes.length} open notes`);
