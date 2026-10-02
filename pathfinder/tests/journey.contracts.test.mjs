/**
 * Journey contracts: the scenario bank, the adaptive router, the end pane (answers on the lifecycle; the scored
 * dashboard kept for later), the media manifest,
 * the files behind it, the selector cards, the reproducibility sheet and the submission API all agree.
 *
 *   node --test pathfinder/tests/*.test.mjs
 *
 * Randomised walks use a fixed seed, so a failure reproduces exactly.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  LIFECYCLE_STAGES,
  BRANCHES,
  JOURNEY_SCENARIOS,
  createJourney,
  getJourneySituation,
  answerJourney,
  replayJourney,
  undoJourney,
  isJourneyComplete,
  finalizeJourney,
  currentStage,
  toJourneyPayload,
  toSubmissionPayload,
  JOURNEY_ORDER,
  FOLLOWUP_RULES,
  CONDITIONAL_RULES,
  CONTEXT_SCENARIO_IDS,
  MODULES,
  deskTag,
  DESKS,
  SLOTS,
  RESERVE,
  deskProfile,
  PASSPORT_LEVEL,
  appliesTo,
  strengthFor,
  rungFor,
  isScored
} from "../lifecycle.js";
import { DIMENSION_IDS } from "../dimensions.js";
import { SPINE_NODES } from "../scenarios.js";
import { DPP_PLATE_ROWS } from "../calculator-bridge.js";
import { buildDashboard, DOMAINS, PLATE_LABELS, answerStatus } from "../dashboard.js";
import { buildAnswerMap, LIFECYCLE_NODES, CONTEXT_SCENARIOS, STATE_LABELS, answerMark, PO_TERMS_ADVICE } from "../answer-map.js";

const SITE = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const WEB = join(SITE, "journey");
const manifest = JSON.parse(readFileSync(join(WEB, "manifest.json"), "utf8"));
const BRANCH_IDS = Object.keys(BRANCHES);
const FOLLOWUPS = ["supplier.proof", "logistics.change", "data.retrieval", "sourcing.irreplaceable", "sourcing.com"];
const PREFERENCES = ["product.perspective", "nextLife.unlock"];
const CONTEXT = [...CONTEXT_SCENARIO_IDS]; // preferences + role + demand: shown, never scored

// ------------------------------------------------------------------ helpers
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32);
}

/** Walk a journey choosing options with `choose(options, situation)`; returns [finalState, steps]. */
function walk(branch, choose) {
  let s = createJourney({ branch });
  const steps = [];
  for (let guard = 0; guard < 40 && !isJourneyComplete(s); guard++) {
    const sit = getJourneySituation(s);
    const opt = choose(sit.options, sit, branch);
    steps.push({ id: sit.id, stage: sit.stage, option: opt.id });
    s = answerJourney(s, opt.id);
  }
  return [s, steps];
}

const pick = (v, branch = "furniture") => (typeof v === "string" ? v : v[branch] ?? v.furniture);

/** The label an option shows on `branch` (what the respondent read and picked). */
function getJourneySituationFor(branch, scenarioId, optionId) {
  const label = JOURNEY_SCENARIOS[scenarioId].options.find((o) => o.id === optionId).label;
  return typeof label === "string" ? label : label[branch] ?? label.furniture;
}
const optOf = (scenarioId, optionId) => JOURNEY_SCENARIOS[scenarioId].options.find((o) => o.id === optionId);
/** The strength the journey stores (unscored rungs are stored at 2). */
const strengthOf = (scenarioId, optionId, branch) => (rungFor(optOf(scenarioId, optionId), branch) ? 2 : strengthFor(optOf(scenarioId, optionId), branch));
/** The strength that counts — null for an unscored rung. */
const rankOf = (scenarioId, optionId, branch) => (rungFor(optOf(scenarioId, optionId), branch) ? null : strengthFor(optOf(scenarioId, optionId), branch));
const extreme = (better) => (opts, sit, branch) => {
  const scored = opts.filter((o) => rankOf(sit.id, o.id, branch) != null);
  return (scored.length ? scored : opts).reduce((a, o) => (better(rankOf(sit.id, o.id, branch), rankOf(sit.id, a.id, branch)) ? o : a));
};
const strongest = extreme((x, y) => x > y);
const weakest = extreme((x, y) => x < y);

// ------------------------------------------------------------ scenario bank
describe("scenario bank contract", () => {
  it("every scenario sits on a lifecycle stage; every stop has a common question; desk versions sit in slots", () => {
    for (const s of Object.values(JOURNEY_SCENARIOS)) {
      assert.ok(LIFECYCLE_STAGES.includes(s.stage), `${s.id}: unknown stage ${s.stage}`);
      assert.ok(["base", "desk", "followup", "reserve"].includes(s.kind), `${s.id}: kind ${s.kind}`);
      if (s.kind === "desk") assert.ok(s.desks?.length && s.desks.every((d) => DESKS[d]), `${s.id}: names the desks it is written for`);
      else assert.equal(s.desks, undefined, `${s.id}: only desk versions name desks`);
      if (s.module) assert.ok(MODULES[s.module]?.scenarios.includes(s.id), `${s.id}: module ${s.module}`);
    }
    for (const slot of SLOTS) {
      const stages = new Set(slot.ask.map((id) => JOURNEY_SCENARIOS[id].stage));
      assert.equal(stages.size, 1, `${slot.id}: every version of a slot sits on the same stop`);
      assert.ok(slot.ask.every((id) => ["base", "desk"].includes(JOURNEY_SCENARIOS[id].kind)), `${slot.id}: slots hold common and desk versions`);
    }
    const order = SLOTS.map((slot) => LIFECYCLE_STAGES.indexOf(JOURNEY_SCENARIOS[slot.ask[0]].stage));
    assert.deepEqual(order, [...order].sort((a, b) => a - b), "slots follow the lifecycle");
    for (const stage of LIFECYCLE_STAGES.filter((x) => x !== "company")) {
      assert.ok(Object.values(JOURNEY_SCENARIOS).some((s) => s.stage === stage && s.kind === "base"), `no common question on ${stage}`);
    }
    for (const id of FOLLOWUPS) assert.equal(JOURNEY_SCENARIOS[id]?.kind, "followup", id);
  });

  it("the slots, the reserve and the follow-up rules cover the bank exactly, and every condition is documented", () => {
    const inSlots = Object.values(JOURNEY_SCENARIOS).filter((s) => ["base", "desk"].includes(s.kind)).map((s) => s.id).sort();
    assert.deepEqual([...JOURNEY_ORDER].sort(), inSlots);
    assert.equal(new Set(SLOTS.flatMap((slot) => slot.ask)).size, SLOTS.flatMap((slot) => slot.ask).length, "a question sits in one slot");
    assert.deepEqual([...RESERVE].sort(), Object.values(JOURNEY_SCENARIOS).filter((s) => s.kind === "reserve").map((s) => s.id).sort());
    const conditional = Object.values(JOURNEY_SCENARIOS)
      .filter((s) => s.kind !== "followup" && (s.branches || s.desks || s.when || s.skipDesks || s.kind === "reserve"))
      .map((s) => s.id)
      .sort();
    assert.deepEqual(Object.keys(CONDITIONAL_RULES).sort(), conditional, "every question not asked of everyone documents why");
    const followups = Object.values(JOURNEY_SCENARIOS).filter((s) => s.kind === "followup").map((s) => s.id).sort();
    assert.deepEqual(Object.keys(FOLLOWUP_RULES).filter((k) => k !== "budget").sort(), followups);
  });

  it("wording resolves for every branch, options are well-formed", () => {
    for (const s of Object.values(JOURNEY_SCENARIOS)) {
      const ids = new Set();
      for (const o of s.options) {
        assert.ok(!ids.has(o.id), `${s.id}: duplicate option ${o.id}`);
        ids.add(o.id);
        for (const b of BRANCH_IDS) {
          const v = strengthFor(o, b);
          assert.ok(Number.isInteger(v) && v >= 0 && v <= 4, `${s.id}/${o.id} strength on ${b}`);
        }
        for (const b of o.branches || []) assert.ok(BRANCH_IDS.includes(b), `${s.id}/${o.id}: branch ${b}`);
      }
      for (const branch of BRANCH_IDS.filter((b) => !s.branches || s.branches.includes(b))) {
        const st = createJourney({ branch });
        const sit = getJourneySituation({ ...st, currentNode: s.id });
        assert.ok(typeof sit.prompt === "string" && sit.prompt.length > 8, `${branch}/${s.id}: prompt`);
        if (s.detail) assert.ok(typeof sit.detail === "string" && sit.detail.length > 8, `${branch}/${s.id}: detail`);
        assert.ok(sit.options.length >= 2, `${branch}/${s.id}: options`);
        for (const o of sit.options) assert.ok(typeof o.label === "string" && o.label.length > 1, `${branch}/${s.id}/${o.id}: label`);
      }
      for (const d of s.captures || []) assert.ok(DIMENSION_IDS.includes(d), `${s.id}: capture ${d}`);
      for (const n of s.spineTouch || []) assert.ok(SPINE_NODES.includes(n), `${s.id}: spine ${n}`);
      if (s.kind === "followup") assert.ok(s.why, `${s.id}: a follow-up says why it is asked`);
      if (s.context) assert.deepEqual(s.captures, [], `${s.id}: context is never scored`);
      for (const o of s.options) {
        for (const b of BRANCH_IDS) {
          const r = rungFor(o, b);
          assert.ok(r == null || ["depends", "unsure", "n/a"].includes(r), `${s.id}/${o.id}: rung ${r}`);
        }
        if (o.varies) assert.match(pick(o.label, "battery"), /^It depends/, `${s.id}/${o.id}: a varying answer reads "It depends …"`);
      }
    }
  });

  it("every answered scenario sits on exactly one lifecycle node of the end pane (context answers on none)", () => {
    const placed = LIFECYCLE_NODES.flatMap((n) => n.scenarios);
    assert.equal(new Set(placed).size, placed.length, "a scenario sits on two nodes");
    assert.deepEqual([...CONTEXT_SCENARIOS].sort(), [...CONTEXT].sort());
    for (const p of PREFERENCES) assert.ok(CONTEXT.includes(p), `${p} is context`);
    for (const id of Object.keys(JOURNEY_SCENARIOS)) {
      if (CONTEXT.includes(id)) assert.ok(!placed.includes(id), `${id} is context, not a lifecycle answer`);
      else assert.ok(placed.includes(id), `${id} is not shown on the end pane`);
    }
    assert.deepEqual(LIFECYCLE_NODES.map((n) => n.id), SPINE_NODES, "nodes follow the lifecycle spine");
  });

  it("every answered scenario is monitored by exactly one dashboard domain (preferences excluded)", () => {
    const monitored = DOMAINS.flatMap((d) => d.scenarios);
    assert.equal(new Set(monitored).size, monitored.length, "a scenario sits in two domains");
    for (const id of Object.keys(JOURNEY_SCENARIOS)) {
      if (CONTEXT.includes(id)) assert.ok(!monitored.includes(id), `${id} is context, not evidence`);
      else assert.ok(monitored.includes(id), `${id} is not shown on the dashboard`);
    }
  });

  it("passport field names exist for every branch and plate row", () => {
    for (const b of BRANCH_IDS) for (const r of DPP_PLATE_ROWS) assert.ok(PLATE_LABELS[b]?.[r], `${b}/${r}`);
  });
});

// ------------------------------------------------------------------ router
describe("adaptive router edge cases", () => {
  const rand = rng(20260928);
  const walks = [];
  for (const branch of BRANCH_IDS) {
    walks.push([branch, "strongest", walk(branch, strongest)]);
    walks.push([branch, "weakest", walk(branch, weakest)]);
    for (let i = 0; i < 150; i++) walks.push([branch, `random#${i}`, walk(branch, (opts) => opts[Math.floor(rand() * opts.length)])]);
  }

  it("every walk ends on the landscape: one question per slot, the desk's own version, short, forward only", () => {
    const TOPICS = [["logistics.change", "sourcing.substitution"], ["data.retrieval", "sales.landing"]];
    for (const [branch, label, [state, steps]] of walks) {
      const tag = `${branch} ${label}`;
      assert.ok(isJourneyComplete(state), `${tag}: did not finish`);
      const ids = steps.map((s) => s.id);
      assert.equal(new Set(ids).size, ids.length, `${tag}: a question repeated`);
      assert.ok(ids.filter((id) => JOURNEY_SCENARIOS[id].kind === "followup").length <= 2, `${tag}: too many follow-ups`);
      for (const slot of SLOTS) assert.ok(slot.ask.filter((id) => ids.includes(id)).length <= 1, `${tag}: slot ${slot.id} asked twice`);
      const { desk } = deskProfile(state);
      for (const id of ids) {
        const sc = JOURNEY_SCENARIOS[id];
        assert.notEqual(sc.kind, "reserve", `${tag}: ${id} is in reserve`);
        if (sc.desks) assert.ok(sc.desks.includes(desk), `${tag}: ${id} is not the ${desk} desk's question`);
      }
      for (const [a, b] of TOPICS) assert.ok(!(ids.includes(a) && ids.includes(b)), `${tag}: ${a} and ${b} cover one topic`);
      // Wherever the desk has a version that fits at that point, it is asked instead of the common one.
      const optionIds = steps.map((s) => s.option);
      steps.forEach((step, i) => {
        const slot = SLOTS.find((sl) => sl.ask.includes(step.id));
        if (!slot || JOURNEY_SCENARIOS[step.id].desks) return;
        const before = replayJourney(branch, optionIds.slice(0, i));
        const prof = deskProfile(before);
        const ownVersion = slot.ask.find((id) => {
          const sc = JOURNEY_SCENARIOS[id];
          return sc.desks?.includes(prof.desk) && appliesTo(sc, before) && !sc.desks.some((d) => prof.defers.has(d));
        });
        assert.equal(ownVersion, undefined, `${tag}: asked ${step.id} although the ${prof.desk} desk has ${ownVersion}`);
      });
      // "I would have to ask purchasing" closes purchasing's questions for the rest of the path.
      const deferAt = steps.findIndex((s) => JOURNEY_SCENARIOS[s.id].options.find((o) => o.id === s.option)?.defersTo === "buy");
      if (deferAt >= 0) {
        for (const s of steps.slice(deferAt + 1)) assert.ok(!JOURNEY_SCENARIOS[s.id].desks?.includes("buy"), `${tag}: ${s.id} after deferring to purchasing`);
      }
      const furniture = branch === "furniture";
      assert.ok(ids.length >= (furniture ? 12 : 11) && ids.length <= 18, `${tag}: ${ids.length} questions`);
      assert.equal(ids.includes("supplier.role"), furniture && desk !== "sell", `${tag}: the EUDR role (sales answers certificates instead)`);
      const order = steps.map((s) => LIFECYCLE_STAGES.indexOf(s.stage));
      assert.deepEqual(order, [...order].sort((a, b) => a - b), `${tag}: travelled backwards`);
    }
  });

  it("follow-ups fire exactly when their rule says so (rules restated here, independently of the router)", () => {
    for (const [branch, label, [state, steps]] of walks) {
      const tag = `${branch} ${label}`;
      const optionIds = steps.map((s) => s.option);
      let used = 0;
      steps.forEach((step, i) => {
        const next = steps[i + 1];
        const prefix = replayJourney(branch, optionIds.slice(0, i + 1));
        const last = prefix.history[prefix.history.length - 1];
        const asked = new Set(prefix.history.map((h) => h.scenarioId));
        const flags = new Set(prefix.history.flatMap((h) => h.flags || []));
        const desk = deskProfile(prefix).desk;
        const channel = prefix.history.find((h) => h.scenarioId === "sales.channel")?.optionId;
        let expected = null;
        if (used < 2) {
          if (last.scenarioId === "supplier.trace" && isScored(last) && last.strength >= 3) expected = "supplier.proof";
          else if (last.scenarioId === "logistics.handoff" && flags.has("supplier-dependency")) expected = "logistics.change";
          else if (last.scenarioId === "data.location" && last.strength <= 2 && !asked.has("sales.landing")) expected = "data.retrieval";
          else if (last.scenarioId === "sourcing.topten" && last.strength <= 2) expected = "sourcing.irreplaceable";
          else if (last.scenarioId === "component.bom" && ["contract", "public"].includes(channel) && ["make", "buy", "assure"].includes(desk)) expected = "sourcing.com";
        }
        if (expected) assert.equal(next?.id, expected, `${tag}: ${expected} after ${last.scenarioId}`);
        else if (next) assert.notEqual(JOURNEY_SCENARIOS[next.id].kind, "followup", `${tag}: ${next.id} without cause`);
        if (JOURNEY_SCENARIOS[step.id].kind === "followup") used += 1;
      });
      assert.ok(state.history.length === steps.length);
    }
  });

  it("replay reproduces the result, undo equals the replayed prefix", () => {
    for (const [branch, label, [state]] of walks.slice(0, 60)) {
      const ids = state.history.map((h) => h.optionId);
      const again = finalizeJourney(replayJourney(branch, ids));
      assert.deepEqual(toJourneyPayload(again).answers, toJourneyPayload(finalizeJourney(state)).answers, `${branch} ${label}`);
      const back = undoJourney(state);
      assert.deepEqual(back.history.map((h) => h.optionId), ids.slice(0, -1), `${branch} ${label}: undo`);
      assert.equal(currentStage(back), JOURNEY_SCENARIOS[back.currentNode].stage);
    }
  });

  it("stale or foreign saved answers stop the replay cleanly", () => {
    const [state] = walk("battery", strongest);
    const ids = state.history.map((h) => h.optionId);
    const broken = replayJourney("battery", [...ids.slice(0, 4), "no-such-option", ...ids.slice(4)]);
    assert.equal(broken.history.length, 4);
    assert.ok(!isJourneyComplete(broken));
    assert.equal(replayJourney("textile", ["made-to-order"]).history.length, 0, "a furniture-only answer must not replay on textile");
    assert.throws(() => createJourney({ branch: "toaster" }));
  });
});

// --------------------------------------------------------------- dashboard
describe("readiness dashboard contract", () => {
  const rand = rng(7);
  const finals = [];
  for (const branch of BRANCH_IDS) {
    finals.push([branch, "strongest", finalizeJourney(walk(branch, strongest)[0])]);
    finals.push([branch, "weakest", finalizeJourney(walk(branch, weakest)[0])]);
    for (let i = 0; i < 80; i++) finals.push([branch, `random#${i}`, finalizeJourney(walk(branch, (o) => o[Math.floor(rand() * o.length)])[0])]);
  }

  it("counts are internally consistent for every journey", () => {
    for (const [branch, label, state] of finals) {
      const d = buildDashboard(state, { now: new Date(0) });
      const tag = `${branch} ${label}`;
      assert.deepEqual(d.progress.map((p) => [p.id, p.total]), [["passport", 6], ["links", 5], ["capabilities", 13]], tag);
      for (const p of d.progress) {
        assert.equal(p.items.length, p.total, `${tag} ${p.id}`);
        assert.ok(p.complete >= 0 && p.partial >= 0 && p.complete + p.partial <= p.total, `${tag} ${p.id} counts`);
        assert.equal(p.pct, Math.round((p.complete / p.total) * 100), `${tag} ${p.id} pct`);
        assert.match(p.completeLabel, new RegExp(`^${p.complete} `), `${tag} ${p.id} label`);
        const words = { passport: ["field ready", "fields ready"], links: ["link holds", "links hold"], capabilities: ["solid", "solid"] }[p.id];
        assert.equal(p.completeLabel, `${p.complete} ${p.complete === 1 ? words[0] : words[1]}`, `${tag} ${p.id} plural`);
        assert.equal(p.partialLabel === "", p.partial === 0, `${tag} ${p.id} partial label`);
      }
      assert.deepEqual(d.monitoring.map((m) => m.id), DOMAINS.map((x) => x.id), tag);
      const monitored = d.monitoring.flatMap((m) => m.items.map((i) => i.id)).sort();
      const answered = state.history.filter((h) => !CONTEXT.includes(h.scenarioId) && isScored(h)).map((h) => h.scenarioId).sort();
      assert.deepEqual(monitored, answered, `${tag}: every scored answer shown once`);
      for (const m of d.monitoring) {
        assert.equal(m.ok + m.needs, m.total, `${tag} ${m.id}`);
        for (const i of m.items) assert.equal(i.status, answerStatus(i.strength), `${tag} ${i.id}`);
      }
      assert.equal(d.needsAttention, d.monitoring.reduce((a, m) => a + m.needs, 0));
      assert.equal(d.updatedAt, "1970-01-01T00:00:00.000Z");
    }
  });

  it("the extremes read as extremes", () => {
    for (const branch of BRANCH_IDS) {
      const top = buildDashboard(finals.find(([b, l]) => b === branch && l === "strongest")[2]);
      const low = buildDashboard(finals.find(([b, l]) => b === branch && l === "weakest")[2]);
      assert.equal(top.needsAttention, 0, `${branch}: strongest answers need no attention`);
      assert.equal(top.progress.find((p) => p.id === "links").pct, 100, `${branch}: strongest links`);
      assert.equal(top.progress.find((p) => p.id === "capabilities").pct, 100, `${branch}: strongest capabilities`);
      assert.equal(low.needsAttention, low.monitoring.reduce((a, m) => a + m.total, 0), `${branch}: weakest`);
      assert.equal(low.progress.find((p) => p.id === "capabilities").pct, 0, `${branch}: weakest capabilities`);
      assert.equal(low.progress.find((p) => p.id === "passport").complete, 0, `${branch}: weakest passport`);
    }
  });

  it("refuses an unfinished journey", () => {
    assert.throws(() => buildDashboard(createJourney({ branch: "furniture" })), /finalized/);
  });
});

describe("end pane contract: the company's own answers on the lifecycle, no score", () => {
  const rand = rng(11);
  const finals = [];
  for (const branch of BRANCH_IDS) {
    finals.push([branch, "strongest", finalizeJourney(walk(branch, strongest)[0])]);
    finals.push([branch, "weakest", finalizeJourney(walk(branch, weakest)[0])]);
    for (let i = 0; i < 80; i++) finals.push([branch, `random#${i}`, finalizeJourney(walk(branch, (o) => o[Math.floor(rand() * o.length)])[0])]);
  }
  const numbersIn = (v, path = "map") =>
    typeof v === "number" ? [path] : v && typeof v === "object" ? Object.entries(v).flatMap(([k, x]) => numbersIn(x, `${path}.${k}`)) : [];

  it("shows every answer once, verbatim, under its question and on its node", () => {
    for (const [branch, label, state] of finals) {
      const tag = `${branch} ${label}`;
      const map = buildAnswerMap(state);
      assert.deepEqual(map.nodes.map((n) => n.id), LIFECYCLE_NODES.map((n) => n.id), tag);
      const shown = map.nodes.flatMap((n) => n.items.map((i) => i.scenarioId)).sort();
      const answered = state.history.map((h) => h.scenarioId).filter((id) => !CONTEXT.includes(id)).sort();
      assert.deepEqual(shown, answered, `${tag}: every answer shown once`);
      for (const n of map.nodes) {
        assert.equal(n.stateLabel, STATE_LABELS[n.state], `${tag} ${n.id}`);
        for (const i of n.items) {
          const h = state.history.find((x) => x.scenarioId === i.scenarioId);
          const opt = getJourneySituationFor(state.branch, i.scenarioId, h.optionId);
          assert.equal(i.answer, opt, `${tag} ${i.scenarioId}: the answer is the option they chose, in its words`);
          assert.ok(i.question && typeof i.question === "string", `${tag} ${i.scenarioId}: question`);
          assert.ok(LIFECYCLE_NODES.find((x) => x.id === n.id).scenarios.includes(i.scenarioId), `${tag} ${i.scenarioId} node`);
          assert.equal(i.mark, answerMark(h), `${tag} ${i.scenarioId} mark`);
        }
      }
      assert.equal(map.persona, state.result.journey.personaLabel, `${tag} persona`);
      assert.equal(map.priority, state.history.find((h) => h.scenarioId === "nextLife.unlock")?.value ?? null, `${tag} priority`);
    }
  });

  it("marks where information first gets lost, on the same links as the journey", () => {
    for (const [branch, label, state] of finals) {
      const map = buildAnswerMap(state);
      assert.deepEqual(map.links.map((l) => `${l.from}>${l.to}`), ["supplier>material", "material>component", "component>product", "product>customer", "customer>nextLife"]);
      assert.deepEqual(map.links.map((l) => l.state), state.result.journey.links.map((l) => l.state), `${branch} ${label}`);
      const first = state.result.journey.links.find((l) => l.state === "weak" || l.state === "broken");
      assert.equal(map.firstBreak?.from ?? null, first?.from ?? null, `${branch} ${label} first break`);
    }
    for (const branch of BRANCH_IDS) {
      assert.equal(buildAnswerMap(finals.find(([b, l]) => b === branch && l === "strongest")[2]).firstBreak, null, `${branch}: strongest holds end to end`);
      assert.equal(buildAnswerMap(finals.find(([b, l]) => b === branch && l === "weakest")[2]).firstBreak?.from, "supplier", `${branch}: weakest breaks at once`);
    }
  });

  it("carries no number at all: no score, percentage, count or timeline", () => {
    for (const [branch, label, state] of finals) {
      assert.deepEqual(numbersIn(buildAnswerMap(state)), [], `${branch} ${label}`);
    }
  });

  it("refuses an unfinished journey", () => {
    assert.throws(() => buildAnswerMap(createJourney({ branch: "textile" })), /finalized/);
  });
});

// ------------------------------------------ review rules (docs/qualification, Friday items 1–12)
describe("review rules (Stefan's Friday line)", async () => {
  const L = await import("../../journey/landscape.js");
  const { PASSPORT_CARD } = await import("../../journey/overlays.js");
  /** Walk a journey choosing `pickFor(sit)` where given, else the first scored option. */
  const answerAll = (branch, pickFor = () => null) => {
    let s = createJourney({ branch });
    for (let guard = 0; guard < 60 && !isJourneyComplete(s); guard++) {
      const sit = getJourneySituation(s);
      const first = sit.options.find((x) => rankOf(sit.id, x.id, branch) != null) || sit.options[0];
      s = answerJourney(s, pickFor(sit) ?? first.id);
    }
    return finalizeJourney(s);
  };
  const asked = (state) => state.history.map((h) => h.scenarioId);
  const EVIDENCE = Object.values(JOURNEY_SCENARIOS).filter((sc) => !sc.context);
  const read = (f) => readFileSync(join(SITE, f), "utf8");

  it("item 4: model or batch is the top rung, item level an unscored “it depends” — batteries keep item level", () => {
    for (const b of BRANCH_IDS) assert.ok(PASSPORT_LEVEL[b], `${b}: passport level documented`);
    const top = { "product.identity": "variant-records", "logistics.handoff": "by-batch", "nextLife.continuity": "repair-parts", "passport.carrier": "model-data" };
    const item = { "product.identity": "item-level", "logistics.handoff": "by-item", "nextLife.continuity": "full", "passport.carrier": "item-data" };
    for (const b of ["furniture", "textile"]) {
      for (const [id, opt] of Object.entries(top)) {
        assert.equal(rankOf(id, opt, b), 4, `${b} ${id}#${opt} is the top rung`);
        assert.equal(rungFor(optOf(id, item[id]), b), "depends", `${b} ${id}#${item[id]} is an unscored "it depends"`);
        assert.ok(optOf(id, item[id]).note, `${id}#${item[id]} explains itself`);
      }
    }
    assert.equal(rungFor(optOf("product.identity", "made-to-order"), "furniture"), "depends", "made-to-order is a business model");
    for (const id of ["product.identity", "passport.carrier"]) {
      assert.ok(rankOf(id, item[id], "battery") > rankOf(id, top[id], "battery"), `battery ${id}: item level required`);
    }
  });

  it("item 5: composition tops out at supplier-declared substances; third-party testing is “it depends”", () => {
    const opts = JOURNEY_SCENARIOS["material.composition"].options;
    const best = opts.filter((o) => !o.rung).reduce((a, o) => (o.strength > a.strength ? o : a));
    assert.equal(best.label, "Specified per material, with substances of concern declared by the supplier");
    assert.equal(opts.find((o) => o.id === "tested").rung, "depends");
    assert.ok(!opts.some((o) => /verified/i.test(o.label)), "no “verified” top rung");
  });

  it("items 6 and 12: every evidence question offers an unscored rung, and unscored answers never feed the score", () => {
    for (const b of BRANCH_IDS) {
      for (const sc of EVIDENCE.filter((x) => !x.branches || x.branches.includes(b))) {
        const offers = sc.options.filter((o) => (!o.branches || o.branches.includes(b)) && rungFor(o, b));
        assert.ok(offers.length >= 1, `${b} ${sc.id}: no "(it depends)" / "not sure" / "doesn't apply" rung`);
      }
      const unscoredAll = answerAll(b, (sit) => sit.options.find((x) => rankOf(sit.id, x.id, b) == null)?.id ?? null);
      const soft = unscoredAll.history.filter((h) => !isScored(h));
      assert.ok(soft.length >= 8, `${b}: ${soft.length} unscored answers`);
      for (const h of soft) {
        for (const cap of Object.values(unscoredAll.capabilities)) {
          assert.ok(!cap.evidence.some((e) => e.scenarioId === h.scenarioId), `${b} ${h.scenarioId}: unscored answer wrote evidence`);
        }
      }
      const map = buildAnswerMap(unscoredAll);
      for (const n of map.nodes) {
        for (const i of n.items) if (!isScored(unscoredAll.history.find((h) => h.scenarioId === i.scenarioId))) assert.notEqual(i.mark, "gap", `${b} ${i.scenarioId}`);
      }
    }
  });

  it("item 3: the EUDR role question routes the wood questions (furniture only, never scored)", () => {
    const role = JOURNEY_SCENARIOS["supplier.role"];
    assert.equal(role.prompt, "Does the wood in your products arrive from outside the EU?");
    assert.deepEqual(role.options.map((o) => o.id), ["import", "eu-covered", "mixed", "dont-know", "little-wood"]);
    assert.deepEqual(role.branches, ["furniture"]);
    assert.deepEqual(role.captures, []);
    const JOURNEY = JOURNEY_ORDER.indexOf("supplier.role");
    assert.ok(JOURNEY < JOURNEY_ORDER.indexOf("supplier.depth") && JOURNEY < JOURNEY_ORDER.indexOf("supplier.trace"));
    // "I would have to ask purchasing" is answered once: no reference question after it (adaptive path).
    const route = { import: [false, true], "eu-covered": [true, false], mixed: [true, true], "dont-know": [false, false], "little-wood": [false, false] };
    for (const [r, [depth, trace]] of Object.entries(route)) {
      const st = answerAll("furniture", (sit) => (sit.id === "supplier.role" ? r : null));
      assert.equal(asked(st).includes("supplier.depth"), depth, `${r}: reference question`);
      assert.equal(asked(st).includes("supplier.trace"), trace, `${r}: operator's due-diligence question`);
      assert.ok(L.EUDR_COPY[r], `${r}: EUDR copy`);
      assert.equal(buildAnswerMap(st).eudrRole, r);
    }
    const compliance = answerAll("furniture", (sit) => ({ "product.perspective": "sustainability", "supplier.role": "dont-know" })[sit.id] ?? null);
    assert.ok(asked(compliance).includes("sourcing.whoasks"), "compliance, not knowing the role, is asked how its request reaches a supplier");
    const viaDepth = answerAll("furniture", (sit) => ({ "supplier.role": "eu-covered", "supplier.depth": "we-import" })[sit.id] ?? null);
    assert.ok(asked(viaDepth).includes("supplier.trace"), "“we import it ourselves” routes to the operator path");
    const caps = (r) => JSON.stringify(answerAll("furniture", (sit) => (sit.id === "supplier.role" ? r : sit.id === "supplier.depth" || sit.id === "supplier.trace" ? null : null)).capabilities.dataStructure);
    assert.equal(caps("import"), caps("eu-covered"), "the role itself never moves a score");
    for (const b of ["battery", "textile"]) {
      assert.ok(!asked(answerAll(b)).includes("supplier.role"), b);
      assert.ok(asked(answerAll(b)).includes("supplier.trace"), `${b}: follows its supply chain upstream`);
    }
  });

  it("item 11: supplier.depth is the statement-reference question", () => {
    const d = JOURNEY_SCENARIOS["supplier.depth"];
    assert.match(d.prompt, /due-diligence statement reference number/);
    assert.deepEqual(d.options.map((o) => o.id), ["every-delivery", "most", "some", "none-yet", "we-import", "dont-know"]);
    assert.deepEqual(d.options.map((o) => (o.rung ? null : o.strength)), [4, 3, 2, 1, null, null]);
  });

  it("items 7 and 8, adaptive: sales.channel for every furniture journey; the sales desk's versions only from the Sales seat", () => {
    for (const seat of ["sales", "product", "procurement"]) {
      const st = answerAll("furniture", (sit) => (sit.id === "product.perspective" ? seat : null));
      const ids = asked(st);
      assert.equal(ids[1], "sales.channel", `${seat}: the channel comes right after the seat`);
      const versions = ids.filter((id) => JOURNEY_SCENARIOS[id].desks?.includes("sell"));
      if (seat === "sales") {
        assert.deepEqual(
          versions,
          ["sales.artefact", "sales.landing", "sales.certificates", "sales.orders", "sales.reorder", "sales.hours", "sales.unbid"],
          "one per stop, in travel order, sales.unbid last"
        );
        assert.ok(ids.length <= 14, `the sales path is as short as the others (${ids.length})`);
        const map = buildAnswerMap(st);
        const cust = map.nodes.find((n) => n.id === "customer");
        assert.deepEqual(cust.items.filter((i) => i.module).map((i) => i.scenarioId), ["sales.landing", "sales.artefact", "sales.certificates", "sales.orders", "sales.reorder"]);
        assert.ok(map.sales?.landing && map.sales?.artefact && map.sales?.hours, "echoed in their words");
        assert.ok(!JSON.stringify(map.sales).includes("bid"), "sales.unbid stays a conversation item");
      } else assert.deepEqual(versions, [], `${seat}: no sales versions`);
    }
    for (const id of MODULES.sales.scenarios) assert.deepEqual(JOURNEY_SCENARIOS[id].captures, [], `${id}: desk sets do not feed the score`);
    for (const b of ["battery", "textile"]) {
      const ids = asked(answerAll(b, (sit) => (sit.id === "product.perspective" ? "sales" : null)));
      assert.ok(!ids.some((id) => id.startsWith("sales.")), `${b}: the sales versions and the channel are furniture questions`);
    }
  });

  it("items 1, 2, 10: the hero carries the corrected sentence, no timeline, about five minutes", () => {
    for (const f of ["index.html", "classic.html"]) {
      const t = read(f);
      for (const must of ["would apply from around 2030", "The exact data fields are not yet law", "filed by you if you import", "Micro and small makers of wooden seats have until 30 June 2027", "About five minutes"]) {
        assert.ok(t.includes(must), `${f}: missing “${must}”`);
      }
      assert.ok(!/timeline you can act on|Three minutes|from (around )?2029|expected from 2029/i.test(t), `${f}: old claim still there`);
    }
    // Item 10's "short second act" is superseded by the adaptive path: no act is appended, the desk changes the versions.
    assert.match(JOURNEY_SCENARIOS["product.perspective"].detail.furniture, /your desk can answer/);
    assert.match(JOURNEY_SCENARIOS["product.perspective"].detail.furniture, /same length/);
    for (const c of Object.values(L.EUDR_COPY)) assert.ok(!/cannot ship/i.test(c), "never “or you cannot ship”");
    assert.match(L.REGULATION.battery, /18 February 2027/);
    for (const b of ["furniture", "textile"]) assert.match(L.REGULATION[b], /not yet law/, b);
  });

  it("item 9: the ESPR table, its markers, only the rows the answers speak to", () => {
    assert.equal(L.ESPR_TITLE, "What the ESPR framework can ask for, and where furniture is likely to land");
    assert.match(L.ESPR_SOURCE, /22 September 2026.*should not yet be read as requirements/);
    for (const r of L.ESPR_ROWS) {
      assert.match(r.marker, /^\[(C|I|\?)\]/, r.field);
      for (const id of r.from) assert.ok(JOURNEY_SCENARIOS[id], `${r.field}: ${id}`);
    }
    const shown = (st) => L.ESPR_ROWS.filter((r) => r.from.some((id) => asked(st).includes(id))).map((r) => r.field);
    const little = shown(answerAll("furniture", (sit) => (sit.id === "supplier.role" ? "little-wood" : null)));
    assert.ok(!little.some((f) => /Wood species/.test(f)), "no wood row without wood");
    const op = shown(answerAll("furniture", (sit) => (sit.id === "supplier.role" ? "import" : null)));
    assert.ok(op.some((f) => /geolocation/.test(f)), "the operator sees the geolocation row");
    const eu = shown(answerAll("furniture", (sit) => (sit.id === "supplier.role" ? "eu-covered" : null)));
    assert.ok(!eu.some((f) => /geolocation/.test(f)), "a downstream operator does not");
    for (const b of BRANCH_IDS) assert.ok(PASSPORT_CARD[b].rows.length && !JSON.stringify(PASSPORT_CARD[b]).match(/claimed|verified|missing/i), `${b}: passport card has no status column`);
  });

  it("the “it depends” move appears only for answers that vary", () => {
    const st = answerAll("furniture", (sit) => (sit.id === "component.bom" ? "depends" : null));
    const map = buildAnswerMap(st);
    assert.ok(map.nodes.some((n) => n.items.some((i) => i.varies)));
    assert.equal(L.nextSteps(st.result, "furniture", { varies: true }).moves[0], L.DEPENDS_MOVE);
    const item = answerAll("furniture", (sit) => (sit.id === "passport.carrier" ? "item-data" : null));
    assert.ok(!buildAnswerMap(item).nodes.some((n) => n.items.some((i) => i.varies)), "item level is a position, not a variation");
  });
});

// --------------------------------- purchasing module & desks (docs/qualification, Friday items 13, 15, 16)
describe("purchasing module & desks", () => {
  /** Walk a journey from `seat`, choosing `pickFor(sit)` where given, else the first scored option. */
  const answerAll = (branch, seat, pickFor = () => null) => {
    let s = createJourney({ branch });
    for (let guard = 0; guard < 60 && !isJourneyComplete(s); guard++) {
      const sit = getJourneySituation(s);
      const first = sit.options.find((x) => rankOf(sit.id, x.id, branch) != null) || sit.options[0];
      const chosen = sit.id === "product.perspective" ? seat : pickFor(sit);
      s = answerJourney(s, chosen ?? first.id);
    }
    return finalizeJourney(s);
  };
  const asked = (state) => state.history.map((h) => h.scenarioId);
  const PURCH = MODULES.purchasing.scenarios;
  const ON_NODES = PURCH.filter((id) => !CONTEXT.includes(id));

  it("item 13, adaptive: the purchasing set is the sourcing desk's version of its stops, not an appended block", () => {
    for (const id of PURCH) {
      const sc = JOURNEY_SCENARIOS[id];
      assert.equal(sc.module, "purchasing");
      assert.deepEqual(sc.branches, ["furniture"], `${id}: furniture only`);
      assert.deepEqual(sc.captures, [], `${id}: desk sets do not feed the score`);
      assert.ok(sc.intendedCaptures?.length, `${id}: records its dimensions for the weight table`);
      assert.ok(sc.options.every((o) => typeof o.fact === "string" && o.fact.length > 4), `${id}: every answer has a fact to echo`);
    }
    const st = answerAll("furniture", "procurement", (sit) => (sit.id === "sourcing.topten" ? "two-four" : null));
    const ids = asked(st);
    assert.deepEqual(
      ids.filter((id) => JOURNEY_SCENARIOS[id].module === "purchasing").map((id) => `${id}@${JOURNEY_SCENARIOS[id].stage}`),
      ["sourcing.topten@material", "sourcing.irreplaceable@material", "sourcing.contract@supplier", "sourcing.substitution@logistics", "sourcing.contractmade@factory"],
      "the desk's versions, each at its own stop"
    );
    assert.ok(ids.length <= 16, `as short as the other paths (${ids.length})`);
    const map = buildAnswerMap(st);
    assert.ok(map.purchasing?.topten && map.purchasing?.irreplaceable, "echoed in their words");
    assert.ok(!map.nodes.find((n) => n.id === "supplier").items.some((i) => i.scenarioId === "sourcing.topten"), "the topten count is context");
    for (const seat of ["sales", "leadership", "product"]) {
      const other = asked(answerAll("furniture", seat));
      assert.ok(!other.some((id) => JOURNEY_SCENARIOS[id].module === "purchasing"), `${seat}: no sourcing desk questions`);
      assert.equal(buildAnswerMap(answerAll("furniture", seat)).purchasing, null, `${seat}: no purchasing echo`);
    }
    for (const b of ["battery", "textile"]) {
      const other = asked(answerAll(b, "procurement"));
      assert.ok(!other.some((id) => id.startsWith("sourcing.")), `${b}: the sourcing desk is a furniture question`);
    }
  });

  it("every desk's stop keeps at least one question: no path fades through a stage", () => {
    const seats = JOURNEY_SCENARIOS["product.perspective"].options.map((o) => o.setsPersona);
    assert.ok(seats.length >= 6 && !seats.includes(undefined), "the journey offers its desks");
    for (const branch of BRANCH_IDS) {
      for (const seat of seats) {
        const st = answerAll(branch, seat);
        const stops = new Set(st.history.map((h) => h.stage));
        for (const stage of LIFECYCLE_STAGES.filter((x) => x !== "company")) {
          assert.ok(stops.has(stage), `${branch}/${seat}: no question at the ${stage} stop`);
        }
      }
    }
  });

  it("desks: each module carries its desk tag; core answers carry none", () => {
    assert.equal(MODULES.sales.desk, "Sales desk");
    assert.equal(MODULES.purchasing.desk, "Sourcing desk");
    assert.equal(deskTag("sales"), "Sales desk");
    assert.equal(deskTag("purchasing"), "Sourcing desk");
    assert.equal(deskTag(null), null);
    assert.equal(deskTag("no-such-module"), null);
    for (const id of Object.keys(JOURNEY_SCENARIOS)) {
      assert.equal(deskTag(JOURNEY_SCENARIOS[id].module || null) === null, !JOURNEY_SCENARIOS[id].module, id);
    }
  });

  it("item 16: the PO-terms advice sits under sourcing.contract when the answer is varies or below", () => {
    const strong = answerAll("furniture", "procurement", (sit) => (sit.id === "sourcing.contract" ? "enforceable" : null));
    const map = buildAnswerMap(strong);
    assert.equal(map.contractAdvice, false, "enforceable terms need no advice");
    assert.ok(!JSON.stringify(map.nodes).includes(PO_TERMS_ADVICE));
    for (const option of ["listed-docs", "on-request", "nothing-written", "varies"]) {
      const st = answerAll("furniture", "procurement", (sit) => (sit.id === "sourcing.contract" ? option : null));
      const m = buildAnswerMap(st);
      assert.equal(m.contractAdvice, true, `${option}: the answer earns the advice`);
      const item = m.nodes.find((n) => n.id === "supplier").items.find((i) => i.scenarioId === "sourcing.contract");
      assert.equal(item.note, PO_TERMS_ADVICE, `${option}: the advice sits under the contract answer`);
    }
    const noModule = buildAnswerMap(answerAll("furniture", "product"));
    assert.equal(noModule.contractAdvice, false, "no contract answer, no advice");
  });

  it("item 15, adaptive: one respondent never meets both views of a supplier change; the check stays for when two do", () => {
    const seats = JOURNEY_SCENARIOS["product.perspective"].options.map((o) => o.setsPersona);
    const dependency = (sit) => (sit.id === "logistics.handoff" ? "by-date" : sit.id === "supplier.role" ? "eu-covered" : sit.id === "supplier.depth" ? "some" : null);
    for (const seat of seats) {
      const ids = asked(answerAll("furniture", seat, dependency));
      assert.ok(!(ids.includes("logistics.change") && ids.includes("sourcing.substitution")), `${seat}: both views in one path`);
    }
    // A combined record (two respondents of one company read together) still flags the contradiction.
    const buyer = answerAll("furniture", "procurement", (sit) => (sit.id === "sourcing.substitution" ? "their-call" : null));
    const upTo = buyer.history.findIndex((h) => h.scenarioId === "sourcing.substitution") + 1;
    const partial = replayJourney("furniture", buyer.history.slice(0, upTo).map((h) => h.optionId));
    const combined = answerJourney({ ...partial, currentNode: "logistics.change" }, "automatic");
    const entry = combined.history.find((h) => h.scenarioId === "logistics.change");
    assert.ok(entry.flags.includes("needs-clarification"), "“automatic” beside “their call” is flagged");
    const calm = answerJourney({ ...partial, currentNode: "logistics.change" }, "discovered-later"); // consistent with "their call"
    assert.ok(!calm.history.find((h) => h.scenarioId === "logistics.change").flags.includes("needs-clarification"), "a consistent pair is not");
  });
});

// ---------------------------------------------------------- submission API
describe("submission contract", async () => {
  const { default: handler } = await import("../../api/inbox.js");
  const call = (method, body, headers = {}) =>
    new Promise((resolve) => {
      const chunks = body === undefined ? [] : [Buffer.from(typeof body === "string" ? body : JSON.stringify(body))];
      const req = {
        method,
        headers,
        on(ev, cb) {
          if (ev === "data") chunks.forEach((c) => cb(c));
          if (ev === "end") setImmediate(cb);
          return req;
        }
      };
      const res = { statusCode: 0, headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(txt) { resolve({ status: this.statusCode, body: JSON.parse(txt) }); } };
      handler(req, res);
    });
  const TMP = "/tmp/prduct-submissions.json";
  const before = existsSync(TMP) ? readFileSync(TMP, "utf8") : null;

  it("the payload the app sends is accepted and fits the local server's 200 KB limit", async () => {
    globalThis.__prductSubmissions = [];
    for (const branch of BRANCH_IDS) {
      const state = finalizeJourney(walk(branch, weakest)[0]);
      const payload = toSubmissionPayload(state, { firstName: "Ada", email: "ada@example.com", company: "Example Oy" });
      const size = Buffer.byteLength(JSON.stringify(payload));
      assert.ok(size < 200_000, `${branch}: ${size} bytes`);
      assert.equal(payload.scores.dashboard.progress.length, 3);
      const r = await call("POST", payload);
      assert.equal(r.status, 200, JSON.stringify(r.body));
      assert.ok(r.body.ok && r.body.id);
    }
  });

  it("rejects what it must reject, and trims what it stores", async () => {
    assert.equal((await call("PUT", {})).status, 405);
    assert.equal((await call("POST", "{not json")).status, 400);
    assert.equal((await call("POST", { lead: { email: "no-at-sign", company: "X" } })).status, 400);
    assert.equal((await call("POST", { lead: { email: "a@b.co", company: "  " } })).status, 400);
    const r = await call("POST", { lead: { email: "a@b.co", company: "C".repeat(500), firstName: "F".repeat(500) } });
    assert.equal(r.status, 200);
    const prev = process.env.INBOX_PASSWORD;
    try {
      process.env.INBOX_PASSWORD = "test-inbox-pw";
      const list = await call("GET", undefined, { authorization: "Bearer test-inbox-pw" });
      assert.equal(list.status, 200);
      const rec = list.body.submissions.at(-1);
      assert.equal(rec.lead.company.length, 120);
      assert.equal(rec.lead.firstName.length, 80);
    } finally {
      if (prev === undefined) delete process.env.INBOX_PASSWORD;
      else process.env.INBOX_PASSWORD = prev;
    }
  });

  it("never lists the leads without the inbox password", async () => {
    const prev = process.env.INBOX_PASSWORD;
    try {
      delete process.env.INBOX_PASSWORD;
      const locked = await call("GET", undefined, { authorization: "Bearer " });
      assert.equal(locked.status, 401, "no password configured: the list stays locked");
      assert.equal(locked.body.submissions, undefined);
      process.env.INBOX_PASSWORD = "test-inbox-pw";
      assert.equal((await call("GET")).status, 401, "no password sent");
      assert.equal((await call("GET", undefined, { authorization: "Bearer wrong" })).status, 401, "wrong password");
      assert.equal((await call("GET", undefined, { authorization: "test-inbox-pw" })).status, 200, "bare password accepted too");
    } finally {
      if (prev === undefined) delete process.env.INBOX_PASSWORD;
      else process.env.INBOX_PASSWORD = prev;
    }
  });

  it("logs in with a form post, and the session cookie opens the list", async () => {
    const { default: session } = await import("../../api/session.js");
    const auth = await import("../../api/_auth.js");
    const post = (body) =>
      new Promise((resolve) => {
        const req = {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          on(ev, cb) {
            if (ev === "data") cb(Buffer.from(body));
            if (ev === "end") setImmediate(cb);
            return req;
          }
        };
        const res = { statusCode: 0, headers: {}, setHeader(k, v) { this.headers[k.toLowerCase()] = v; }, end() { resolve(this); } };
        session(req, res);
      });
    const prev = process.env.INBOX_PASSWORD;
    try {
      process.env.INBOX_PASSWORD = "test-inbox-pw";
      const bad = await post("username=prduct-inbox&password=nope");
      assert.equal(bad.statusCode, 303);
      assert.equal(bad.headers.location, "/inbox.html?error=1");
      assert.equal(bad.headers["set-cookie"], undefined, "no session for a wrong password");
      const good = await post("username=prduct-inbox&password=test-inbox-pw");
      assert.equal(good.statusCode, 303);
      assert.equal(good.headers.location, "/inbox.html");
      const set = good.headers["set-cookie"];
      assert.match(set, /^prduct_inbox=\d+\.[\w-]+; Path=\/api; HttpOnly; Secure; SameSite=Strict; Max-Age=43200$/);
      const cookie = set.split(";")[0];
      assert.equal((await call("GET", undefined, { cookie })).status, 200, "the session opens the list");
      assert.equal((await call("GET", undefined, { cookie: cookie.replace(/.$/, (c) => (c === "A" ? "B" : "A")) })).status, 401, "a forged session does not");
      const old = auth.newSession(Date.now() - 13 * 3600 * 1000);
      assert.equal((await call("GET", undefined, { cookie: `prduct_inbox=${old}` })).status, 401, "an expired session does not");
      process.env.INBOX_PASSWORD = "a-new-password";
      assert.equal((await call("GET", undefined, { cookie })).status, 401, "changing the password ends every session");
      const out = await post("action=logout");
      assert.match(out.headers["set-cookie"], /Max-Age=0/);
    } finally {
      if (prev === undefined) delete process.env.INBOX_PASSWORD;
      else process.env.INBOX_PASSWORD = prev;
    }
  });

  it("leaves the shared temp store as it was", async () => {
    const { writeFileSync, rmSync } = await import("node:fs");
    if (before === null) rmSync(TMP, { force: true });
    else writeFileSync(TMP, before);
    delete globalThis.__prductSubmissions;
  });
});

// ------------------------------------------------------- media manifest
describe("media manifest contract", () => {
  const FOCUS = /^\d+(\.\d+)?% \d+(\.\d+)?%$/;

  it("covers every branch, stop and move — and nothing else", () => {
    assert.deepEqual(manifest.stages, [...LIFECYCLE_STAGES]);
    assert.deepEqual(Object.keys(manifest.branches).sort(), [...BRANCH_IDS].sort());
    const pairs = LIFECYCLE_STAGES.slice(0, -1).map((s, i) => `${s}>${LIFECYCLE_STAGES[i + 1]}`);
    for (const [id, b] of Object.entries(manifest.branches)) {
      assert.deepEqual(Object.keys(b.anchors).sort(), [...LIFECYCLE_STAGES].sort(), `${id} anchors`);
      assert.deepEqual(Object.keys(b.transitions).sort(), [...pairs].sort(), `${id} transitions`);
      assert.ok(b.industry && b.object, `${id}: industry/object`);
      if (b.desktopFocus) assert.match(b.desktopFocus, FOCUS, `${id}: desktopFocus`);
    }
  });

  it("every anchor is described, framed and present in every width and format", () => {
    for (const [id, b] of Object.entries(manifest.branches)) {
      for (const [stage, a] of Object.entries(b.anchors)) {
        const tag = `${id}/${stage}`;
        assert.match(a.rev, /^[0-9a-f]{10}$/, `${tag} rev`);
        assert.match(a.focus, FOCUS, `${tag} focus`);
        assert.ok(["left", "right"].includes(a.panel), `${tag} panel`);
        assert.ok(a.alt && a.alt.length >= 12, `${tag} alt text`);
        assert.ok(a.widths.includes(960) && a.widths.includes(1920), `${tag} widths`);
        for (const w of a.widths) for (const ext of ["avif", "webp"]) {
          assert.ok(existsSync(join(WEB, `${a.base}-${w}.${ext}`)), `${tag}: missing ${a.base}-${w}.${ext}`);
        }
        if (a.hotspot) {
          assert.ok(["data", "passport"].includes(stage), `${tag}: overlays only on data/passport`);
          assert.equal(a.hotspot.length, 2);
          for (const v of a.hotspot) assert.ok(v >= 0 && v <= 100, `${tag} hotspot ${v}`);
        } else {
          assert.ok(!["data", "passport"].includes(stage), `${tag}: data/passport need a hotspot`);
        }
        if (a.hotspotSide) assert.ok(["left", "right"].includes(a.hotspotSide), `${tag} hotspotSide`);
      }
    }
  });

  it("every move is present in every size and codec, with consistent timing", () => {
    for (const [id, b] of Object.entries(manifest.branches)) {
      for (const [pair, t] of Object.entries(b.transitions)) {
        const tag = `${id}/${pair}`;
        assert.match(t.rev, /^[0-9a-f]{10}$/, `${tag} rev`);
        assert.equal(t.fps, 24, tag);
        assert.ok(Math.abs(t.duration - t.frames / t.fps) < 0.01, `${tag} duration`);
        assert.ok(t.cue > 0 && t.cue < 1, `${tag} cue`);
        assert.equal(t.poster, b.anchors[pair.split(">")[0]].base, `${tag} poster`);
        assert.ok(t.sizes.includes("540") && t.sizes.includes("1080"), `${tag} sizes`);
        for (const size of t.sizes) for (const codec of t.codecs) {
          assert.ok(existsSync(join(WEB, `${t.base}-${size}-${codec}.mp4`)), `${tag}: missing ${size}-${codec}`);
        }
      }
    }
  });

  it("the selector cards load the current company still", () => {
    const html = readFileSync(join(SITE, "index.html"), "utf8");
    for (const [id, b] of Object.entries(manifest.branches)) {
      const rev = b.anchors.company.rev;
      for (const ext of ["avif", "webp"]) {
        assert.ok(html.includes(`journey/media/${id}/company-960.${ext}?v=${rev}`), `${id}: selector ${ext} is stale`);
      }
      assert.ok(html.includes(`data-branch="${id}"`), `${id}: selector card`);
    }
  });

  it("the reproducibility sheet documents every asset", () => {
    const meta = JSON.parse(readFileSync(join(WEB, "assets-metadata.json"), "utf8"));
    for (const [id, b] of Object.entries(manifest.branches)) {
      for (const stage of Object.keys(b.anchors)) assert.ok(meta.anchors[`${id}/${stage}`]?.method, `${id}/${stage}: no provenance`);
      for (const pair of Object.keys(b.transitions)) assert.ok(meta.transitions[`${id}/${pair}`]?.type, `${id}/${pair}: no provenance`);
    }
  });
});

// ---------------------------------------------------- media files (ffprobe)
const hasProbe = spawnSync("ffprobe", ["-version"]).status === 0;
describe("media file contract", { skip: !hasProbe && "ffprobe not installed" }, () => {
  const probe = (file, entries) => {
    const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-count_packets", "-show_entries",
      `stream=${entries}`, "-of", "json", file], { encoding: "utf8" });
    return JSON.parse(r.stdout).streams[0];
  };
  const SIZE = { "540": [960, 540], "1080": [1920, 1080], "1440": [2560, 1440] };

  it("stills are 16:9 at their declared width", () => {
    for (const [id, b] of Object.entries(manifest.branches)) {
      for (const [stage, a] of Object.entries(b.anchors)) {
        for (const w of a.widths) {
          const s = probe(join(WEB, `${a.base}-${w}.webp`), "width,height");
          assert.deepEqual([s.width, s.height], [w, Math.round((w * 9) / 16)], `${id}/${stage}@${w}`);
        }
      }
    }
  });

  it("clips have the declared frame count, size and codec", () => {
    for (const [id, b] of Object.entries(manifest.branches)) {
      for (const [pair, t] of Object.entries(b.transitions)) {
        for (const size of t.sizes) for (const codec of t.codecs) {
          const s = probe(join(WEB, `${t.base}-${size}-${codec}.mp4`), "codec_name,width,height,nb_read_packets");
          assert.deepEqual([s.width, s.height], SIZE[size], `${id}/${pair} ${size}-${codec}`);
          assert.equal(Number(s.nb_read_packets), t.frames, `${id}/${pair} ${size}-${codec} frames`);
          assert.equal(s.codec_name, codec === "h264" ? "h264" : "av1", `${id}/${pair} ${size}-${codec} codec`);
        }
      }
    }
  });

  it("the revision in each URL changes with the file", () => {
    // revisions hash the master + encode version (build_web.py); here: distinct media, distinct revisions
    const revs = Object.values(manifest.branches).flatMap((b) => [...Object.values(b.anchors), ...Object.values(b.transitions)].map((x) => x.rev));
    assert.equal(new Set(revs).size, revs.length, "two assets share a revision");
    assert.ok(createHash("sha1"));
  });
});
