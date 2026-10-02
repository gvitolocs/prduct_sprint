/**
 * PRDUCT product-data journey — controller.
 *
 * select  : three product worlds (their images are the first anchors)
 * travel  : anchor → generated camera move → anchor, one situation per stop
 * landscape: the Product Data Landscape built from the answers
 *
 * Scoring, routing and the result come from pathfinder/lifecycle.js (the
 * Pathfinder capability model); this file only choreographs.
 */

import {
  LIFECYCLE_STAGES,
  STAGE_LABELS,
  BRANCHES,
  createJourney,
  getJourneySituation,
  answerJourney,
  undoJourney,
  replayJourney,
  isJourneyComplete,
  finalizeJourney,
  currentStage,
  toSubmissionPayload,
  CONTEXT_SCENARIO_IDS
} from "../pathfinder/lifecycle.js";
import { loadManifest, anchorUrl, transitionUrl, warmImage } from "./media.js";
import { Stage } from "./stage.js";
import { Rail } from "./rail.js";
import { Panel } from "./panel.js";
import { renderLandscape } from "./landscape.js";
import { renderDashboardView } from "./dashboard-view.js";
import { Overlays } from "./overlays.js";

const STORE = "prduct.journey.v1";
const root = document.getElementById("quiz");
const reducedMotion =
  matchMedia("(prefers-reduced-motion: reduce)").matches ||
  new URLSearchParams(location.search).get("motion") === "reduced";
const compact = () => matchMedia("(max-width: 860px)").matches;
const live = root.querySelector(".jr-live");

let manifest = null;
let stage, rail, panel, overlays;
let journey = null;
let memory = {};
let busy = false;
let stageIdx = 0;
let reached = 0;

// ------------------------------------------------------------------ helpers
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const frames = (n) => new Promise((r) => { const step = (k) => (k ? requestAnimationFrame(() => step(k - 1)) : r()); step(n); });
const branchMeta = () => manifest.branches[journey.branch];
const stageId = (i) => LIFECYCLE_STAGES[i];

function announce(text) {
  if (live) live.textContent = text;
}

function save(extra = {}) {
  try {
    if (!journey) return localStorage.removeItem(STORE);
    localStorage.setItem(
      STORE,
      JSON.stringify({
        v: 1,
        branch: journey.branch,
        answers: journey.history.map((h) => h.optionId),
        memory,
        phase: isJourneyComplete(journey) ? "landscape" : "travel",
        at: Date.now(),
        ...extra
      })
    );
  } catch {
    /* storage unavailable: the journey still works for this visit */
  }
}

function loadSaved() {
  try {
    const d = JSON.parse(localStorage.getItem(STORE) || "null");
    return d && d.v === 1 && BRANCHES[d.branch] ? d : null;
  } catch {
    return null;
  }
}

/** Rail marks: weakest answer per lifecycle stage (context questions excluded). */
function evidence() {
  const out = {};
  for (const h of journey?.history || []) {
    if (CONTEXT_SCENARIO_IDS.includes(h.scenarioId) || h.flags?.includes("not-applicable")) continue;
    const cur = out[h.stage];
    if (cur === undefined || h.strength < cur) out[h.stage] = h.strength;
  }
  const word = (s) => (s >= 3 ? "strong" : s === 2 ? "partial" : s === 1 ? "weak" : "broken");
  return Object.fromEntries(Object.entries(out).map(([k, s]) => [k, word(s)]));
}

function anchorOf(i) {
  return branchMeta().anchors[stageId(i)];
}

/** Framing for stop i. Desktop keeps one branch-wide focus so stills and video never shift between stops;
 * compact (portrait) screens follow each stop's own subject. */
function focusOf(i) {
  if (compact()) return anchorOf(i)?.focus;
  return branchMeta().desktopFocus || anchorOf(0)?.focus;
}

function setPanelSide(i) {
  root.dataset.panel = anchorOf(i)?.panel || "right";
}

function prefetchNext() {
  const next = stageIdx + 1;
  if (next >= LIFECYCLE_STAGES.length) return;
  const t = branchMeta().transitions[`${stageId(stageIdx)}>${stageId(next)}`];
  if (t) stage.preload(transitionUrl(t));
  anchorUrl(anchorOf(next)).then(warmImage);
}

function parseFocus(f) {
  const [x, y] = String(f || "50% 50%").split(" ").map((v) => parseFloat(v));
  return [isNaN(x) ? 50 : x, isNaN(y) ? 50 : y];
}

function showOverlay() {
  if (!journey || isJourneyComplete(journey)) return overlays.hide();
  overlays.show(stageId(stageIdx), journey, anchorOf(stageIdx), { compact: compact() });
}

// ----------------------------------------------------------------- questions
async function showQuestion() {
  const sit = getJourneySituation(journey);
  announce(`${sit.stageLabel}. ${sit.prompt}`);
  await panel.show(sit, {
    remembered: memory[sit.id] || null,
    canBack: true,
    kicker: `${sit.stageLabel} · ${branchMeta().object}`
  });
}

async function travelTo(next) {
  const from = stageIdx;
  const t = branchMeta().transitions[`${stageId(from)}>${stageId(next)}`];
  const toStill = await anchorUrl(anchorOf(next));
  const [fx0, fy0] = parseFocus(anchorOf(from)?.focus);
  const [fx1, fy1] = parseFocus(anchorOf(next)?.focus);
  setPanelSide(next);
  overlays.hide();
  let shown = null;
  announce(`Moving to ${STAGE_LABELS[stageId(next)]}.`);
  await stage.travel({
    url: t ? transitionUrl(t) : null,
    toStill,
    cue: t?.cue ?? 0.8,
    onProgress: (p) => {
      rail.follow(from, p);
      if (compact()) stage.setFocus(`${fx0 + (fx1 - fx0) * p}% ${fy0 + (fy1 - fy0) * p}%`);
    },
    onCue: () => {
      shown = isJourneyComplete(journey) ? null : showQuestion();
    },
    onWaiting: (w) => rail.setWaiting(w)
  });
  stageIdx = next;
  reached = Math.max(reached, next);
  rail.setPosition(next);
  rail.update(stageIdx, reached, evidence());
  prefetchNext();
  showOverlay();
  await shown;
}

async function goToStage(i, { fade = true } = {}) {
  overlays.hide();
  const url = await anchorUrl(anchorOf(i));
  setPanelSide(i);
  stage.setFocus(focusOf(i));
  await Promise.all([stage.showStill(url, { fade }), rail.animateTo(i)]);
  stageIdx = i;
  rail.update(stageIdx, reached, evidence());
  prefetchNext();
  showOverlay();
}

let pendingAnswer = null;
let pendingBack = false;

/** End a busy section; an answer or Back clicked meanwhile (the panel accepts input while its entrance
 *  settles) runs now instead of being dropped. Back wins over a queued answer. */
function release() {
  busy = false;
  if (pendingBack) {
    pendingBack = false;
    pendingAnswer = null;
    onBack();
  } else if (pendingAnswer) {
    const queued = pendingAnswer;
    pendingAnswer = null;
    onAnswer(queued);
  }
}

async function onAnswer(optionId) {
  // Options are clickable while the question is still entering (the app is busy until the entrance
  // settles): keep that answer and apply it the moment the app is free, instead of dropping it.
  if (busy) {
    pendingAnswer = optionId;
    return;
  }
  busy = true;
  try {
    const sit = getJourneySituation(journey);
    // A click from a panel that has already left (or a stale queued answer) belongs to another question.
    if (!sit.options.some((o) => o.id === optionId)) return;
    journey = answerJourney(journey, optionId);
    memory[sit.id] = optionId;
    save();
    rail.update(stageIdx, reached, evidence());
    await wait(reducedMotion ? 60 : 170); // let the choice register before anything moves
    if (isJourneyComplete(journey)) {
      await panel.hide();
      await revealLandscape();
      return;
    }
    const next = LIFECYCLE_STAGES.indexOf(currentStage(journey));
    if (next === stageIdx) {
      showOverlay();
      await panel.hide();
      await showQuestion();
    } else {
      const leaving = panel.hide();
      await travelTo(next);
      await leaving;
    }
  } finally {
    release();
  }
}

async function onBack() {
  if (busy) {
    pendingBack = true;
    return;
  }
  busy = true;
  try {
    if (!journey.history.length) {
      await toSelector();
      return;
    }
    journey = undoJourney(journey);
    save();
    const target = LIFECYCLE_STAGES.indexOf(currentStage(journey));
    await panel.hide();
    if (target !== stageIdx) await goToStage(target);
    await showQuestion();
  } finally {
    release();
  }
}

async function onJump(id) {
  if (busy || !journey) return;
  const target = LIFECYCLE_STAGES.indexOf(id);
  if (target < 1 || target >= stageIdx) return;
  busy = true;
  try {
    const cut = journey.history.findIndex((h) => h.stage === id);
    if (cut < 0) return;
    journey = replayJourney(journey.branch, journey.history.slice(0, cut).map((h) => h.optionId));
    save();
    await panel.hide();
    await goToStage(target);
    await showQuestion();
  } finally {
    release();
  }
}

// ------------------------------------------------------------------ selector
async function growIntoViewport(card, stillUrl, focus) {
  const stageEl = root.querySelector(".jr-stage");
  const img = card.querySelector("img");
  const cards = [...root.querySelectorAll(".jr-world")];
  card.classList.add("is-chosen");
  cards.filter((c) => c !== card).forEach((c) => c.classList.add("is-receding"));
  root.querySelector(".jr-select-head").classList.add("is-receding");
  root.querySelector(".jr-resume")?.setAttribute("hidden", "");
  await stage.showStill(stillUrl); // under the flyer, invisible until travel mode
  if (reducedMotion || compact()) {
    root.dataset.mode = "travel";
    return;
  }
  const r = img.getBoundingClientRect();
  const s = stageEl.getBoundingClientRect();
  const flyer = new Image();
  flyer.className = "jr-flyer";
  flyer.alt = "";
  flyer.src = stillUrl; // full-resolution anchor, already decoded: no sharpness pop when it lands
  Object.assign(flyer.style, {
    left: `${r.left - s.left}px`,
    top: `${r.top - s.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
    objectPosition: getComputedStyle(img).objectPosition,
    filter: getComputedStyle(img).filter
  });
  stageEl.appendChild(flyer);
  // a short fade-in, so the card's label and shade dissolve instead of blinking out under the flyer
  flyer.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: "ease-out" });
  const grow = flyer.animate(
    [
      {},
      { left: "0px", top: "0px", width: `${s.width}px`, height: `${s.height}px`, borderRadius: "0px", objectPosition: focus || "50% 50%", filter: "none" }
    ],
    { duration: 900, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" }
  );
  await Promise.race([grow.finished.catch(() => {}), wait(1000)]);
  // Hand over while the flyer still covers the screen: selector out and stage in at once (no fades), so
  // removing the flyer reveals the identical frame. With the 0.3 s fades the chosen card flashed back
  // over a half-faded stage.
  root.classList.add("is-handover");
  root.dataset.mode = "travel";
  await frames(2);
  flyer.remove();
  root.classList.remove("is-handover");
}

async function selectBranch(branch, card) {
  if (busy) return;
  busy = true;
  try {
    const saved = loadSaved();
    journey = createJourney({ branch });
    memory = saved && saved.branch === branch ? saved.memory || {} : {};
    stageIdx = 0;
    reached = 0;
    save();
    const b = branchMeta();
    const first = b.transitions["company>product"];
    if (first) stage.preload(transitionUrl(first)); // the chosen world's first move only
    const s0 = await anchorUrl(b.anchors.company);
    anchorUrl(b.anchors.product).then(warmImage);
    stage.setFocus(focusOf(0));
    setPanelSide(0);
    rail.setPosition(0);
    rail.update(0, 0, {});
    await growIntoViewport(card, s0, focusOf(0));
    await travelTo(1);
  } finally {
    release();
  }
}

async function toSelector() {
  panel.clear();
  overlays.hide();
  root.querySelector(".jr-rail").getAnimations().forEach((a) => a.cancel());
  root.querySelector(".jr-land").hidden = true;
  root.querySelector(".jr-land").classList.remove("is-on");
  root.dataset.mode = "select";
  stage.hideStills();
  root.querySelectorAll(".jr-world").forEach((c) => c.classList.remove("is-receding", "is-chosen"));
  root.querySelector(".jr-select-head").classList.remove("is-receding");
  rail.setPosition(0);
  rail.update(-1, -1, {});
  journey = null;
  save();
  root.querySelector(".jr-world")?.focus({ preventScroll: true });
}

// ----------------------------------------------------------------- landscape
async function revealLandscape() {
  overlays.hide();
  journey = finalizeJourney(journey);
  save();
  const land = root.querySelector(".jr-land");
  const b = branchMeta();
  // The demo ends on the answers-on-the-lifecycle view; the scored dashboard waits for a defensible
  // weighting and is only an internal preview (?view=dashboard).
  const render = new URLSearchParams(location.search).get("view") === "dashboard" ? renderDashboardView : renderLandscape;
  render(land, journey, { industry: b.industry, short: BRANCHES[journey.branch].short, object: BRANCHES[journey.branch].object }, {
    onRestart: () => toSelector(),
    onRevisit: async () => {
      land.classList.remove("is-on");
      await wait(300);
      land.hidden = true;
      root.querySelector(".jr-rail").getAnimations().forEach((a) => a.cancel());
      root.dataset.mode = "travel";
      journey = undoJourney(journey);
      save();
      await goToStage(LIFECYCLE_STAGES.indexOf(currentStage(journey)), { fade: true });
      await showQuestion();
    },
    onSend: sendLandscape
  });
  // The rail rises into the map line: the journey's spine becomes the landscape.
  const railEl = root.querySelector(".jr-rail");
  const from = railEl.getBoundingClientRect();
  land.hidden = false;
  land.scrollTop = 0;
  const line = land.querySelector(".jr-life-links, .jr-dash-grid")?.getBoundingClientRect();
  root.dataset.mode = "landscape";
  if (!reducedMotion && line && !compact()) {
    railEl.getAnimations().forEach((a) => a.cancel());
    railEl.animate(
      [
        { transform: "none", opacity: 1 },
        { transform: `translateY(${line.top - (from.top + 22)}px)`, opacity: 0.9, offset: 0.75 },
        { transform: `translateY(${line.top - (from.top + 22)}px)`, opacity: 0 }
      ],
      { duration: 1300, easing: "cubic-bezier(0.65, 0, 0.35, 1)", fill: "forwards" }
    );
    await wait(380);
  }
  land.classList.add("is-on");
  announce("Your product data landscape is ready.");
  land.querySelector(".jr-land-title")?.focus({ preventScroll: true });
}

async function sendLandscape(lead) {
  const payload = toSubmissionPayload(journey, lead);
  try {
    const list = JSON.parse(localStorage.getItem("prduct-dpp-submissions") || "[]");
    list.push({ id: new Date().toISOString(), receivedAt: new Date().toISOString(), ...payload });
    localStorage.setItem("prduct-dpp-submissions", JSON.stringify(list));
  } catch {}
  try {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return (await res.json()).ok === true;
  } catch {
    return false;
  }
}

// --------------------------------------------------------------------- boot
async function resume(saved) {
  busy = true;
  try {
    journey = replayJourney(saved.branch, saved.answers || []);
    memory = saved.memory || {};
    const i = LIFECYCLE_STAGES.indexOf(currentStage(journey));
    stageIdx = Math.max(1, i);
    reached = stageIdx;
    root.querySelectorAll(".jr-world").forEach((c) => c.classList.add("is-receding"));
    root.querySelector(".jr-select-head").classList.add("is-receding");
    root.querySelector(".jr-resume")?.setAttribute("hidden", "");
    const url = await anchorUrl(anchorOf(stageIdx));
    setPanelSide(stageIdx);
    stage.setFocus(focusOf(stageIdx));
    await stage.showStill(url);
    root.dataset.mode = "travel";
    rail.setPosition(stageIdx);
    rail.update(stageIdx, reached, evidence());
    prefetchNext();
    showOverlay();
    if (saved.phase === "landscape" && isJourneyComplete(journey)) await revealLandscape();
    else await showQuestion();
  } finally {
    release();
  }
}

function focusOnOpen() {
  // Existing behaviour kept: the page opens on the PRDUCT hero, then glides to the assessment.
  if (location.hash === "#quiz") history.replaceState(null, "", location.pathname + location.search);
  const go = () => {
    const top = Math.max(0, root.getBoundingClientRect().top + window.scrollY);
    window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
  };
  const run = () => setTimeout(go, reducedMotion ? 0 : 450);
  if (document.readyState === "complete") run();
  else window.addEventListener("load", run, { once: true });
}

async function boot() {
  manifest = await loadManifest();
  stage = new Stage(root.querySelector(".jr-media"), { reducedMotion });
  rail = new Rail(root.querySelector(".jr-rail"), LIFECYCLE_STAGES, STAGE_LABELS, { onJump });
  panel = new Panel(root.querySelector(".jr-panel"), { onAnswer, onBack, reducedMotion });
  overlays = new Overlays(root.querySelector(".jr-overlay"));
  addEventListener("resize", () => overlays.current && showOverlay());
  rail.setPosition(0);
  rail.update(-1, -1, {});
  root.dataset.mode = "select";
  if (reducedMotion) root.dataset.motion = "reduced";

  for (const card of root.querySelectorAll(".jr-world")) {
    card.addEventListener("click", () => selectBranch(card.dataset.branch, card));
  }
  const saved = loadSaved();
  const resumeBtn = root.querySelector(".jr-resume");
  if (saved && saved.answers?.length && resumeBtn) {
    const b = manifest.branches[saved.branch];
    const where = STAGE_LABELS[currentStage(replayJourney(saved.branch, saved.answers))];
    resumeBtn.querySelector("span").textContent = `${b.object} · ${saved.phase === "landscape" ? "Landscape" : where}`;
    resumeBtn.hidden = false;
    resumeBtn.addEventListener("click", () => resume(saved));
  }
  focusOnOpen();
}

boot().catch((err) => {
  console.error("journey failed to start", err);
  root.dataset.mode = "error";
});
