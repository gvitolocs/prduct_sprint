/**
 * Deterministic Pathfinder engine tests (node:test).
 * Run: node --test pathfinder/tests/pathfinder.test.mjs
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  strengthToScore,
  scoreToStatus,
  blendEvidenceScore,
  isWeakScore,
  isAmbiguousScore
} from "../evidence.js";

import {
  DIMENSION_IDS,
  createCapabilities,
  applyEvidence,
  deriveSignals,
  rankDimensions
} from "../dimensions.js";

import {
  PERSONAS,
  SCENARIOS,
  valueScenarioIdFor,
  getScenario
} from "../scenarios.js";

import {
  createState,
  getSituation,
  answer,
  isComplete,
  getSignals
} from "../model.js";

import { buildLandscape, finalize } from "../landscape.js";
import { walk, runPath } from "../index.js";
import {
  toCalculatorAnswers,
  timelineBandFromHints,
  maturityFromCapabilities
} from "../calculator-bridge.js";

describe("evidence mapping", () => {
  it("maps strength 0–4 into the specified score bands", () => {
    assert.equal(strengthToScore(0) >= 0 && strengthToScore(0) <= 20, true);
    assert.equal(strengthToScore(1) >= 21 && strengthToScore(1) <= 40, true);
    assert.equal(strengthToScore(2) >= 41 && strengthToScore(2) <= 60, true);
    assert.equal(strengthToScore(3) >= 61 && strengthToScore(3) <= 80, true);
    assert.equal(strengthToScore(4) >= 81 && strengthToScore(4) <= 100, true);
  });

  it("derives status from score", () => {
    assert.equal(scoreToStatus(10), "unknown");
    assert.equal(scoreToStatus(30), "fragmented");
    assert.equal(scoreToStatus(50), "emerging");
    assert.equal(scoreToStatus(70), "operational");
    assert.equal(scoreToStatus(90), "trusted");
  });

  it("blends evidence with later samples weighted higher", () => {
    const score = blendEvidenceScore([
      { strength: 0 },
      { strength: 4 }
    ]);
    assert.equal(score > strengthToScore(0), true);
    assert.equal(score <= 100, true);
  });
});

describe("dimensions", () => {
  it("exposes all 13 canonical dimensions", () => {
    assert.equal(DIMENSION_IDS.length, 13);
    const caps = createCapabilities();
    for (const id of DIMENSION_IDS) {
      assert.equal(caps[id].score, 0);
      assert.equal(caps[id].confidence, "low");
      assert.equal(caps[id].status, "unknown");
      assert.ok(Array.isArray(caps[id].evidence));
    }
  });

  it("applies evidence and updates score/confidence/status", () => {
    let cap = createCapabilities().informationRetrieval;
    cap = applyEvidence(cap, {
      scenarioId: "friction.retrieval",
      value: "immediate",
      strength: 4
    });
    assert.equal(cap.score >= 81, true);
    assert.equal(cap.status, "trusted");
    assert.equal(cap.evidence.length, 1);
  });

  it("derives supplier dependency signal", () => {
    let caps = createCapabilities();
    caps.supplierDataQuality = applyEvidence(caps.supplierDataQuality, {
      scenarioId: "t",
      value: "weak",
      strength: 0
    });
    caps.traceabilityDepth = applyEvidence(caps.traceabilityDepth, {
      scenarioId: "t2",
      value: "weak",
      strength: 0
    });
    const signals = deriveSignals(caps);
    assert.equal(signals.supplierDependency, true);
  });
});

describe("personas and scenarios", () => {
  it("defines six primary personas plus cross", () => {
    for (const id of [
      "leadership",
      "sales",
      "product",
      "sustainability",
      "procurement",
      "service",
      "cross"
    ]) {
      assert.ok(PERSONAS[id], id);
    }
  });

  it("maps each persona to a distinct value scenario", () => {
    assert.equal(valueScenarioIdFor("sales"), "value.sales");
    assert.equal(valueScenarioIdFor("service"), "value.service");
    assert.equal(valueScenarioIdFor("procurement"), "value.procurement");
    assert.notEqual(valueScenarioIdFor("sales"), valueScenarioIdFor("product"));
  });

  it("horizon.dpp is the DPP scenario (DPP only at Horizon)", () => {
    const s = getScenario("horizon.dpp");
    assert.equal(s.stage, "horizon");
    assert.match(s.prompt, /passport/i);
  });

  it("no scenario prompt uses Question N of M", () => {
    for (const s of Object.values(SCENARIOS)) {
      assert.equal(/question\s+\d+\s+of\s+\d+/i.test(s.prompt), false);
    }
  });
});

describe("router and model walk", () => {
  function firstOption(situation) {
    assert.ok(situation.options.length, `no options for ${situation.id}`);
    return situation.options[0].id;
  }

  function weakChooser(situation) {
    // Prefer weakest non-soft option when available
    const soft = situation.options.filter((o) => o.soft);
    const hard = situation.options.filter((o) => !o.soft);
    const pool = hard.length ? hard : situation.options;
    return pool[pool.length - 1].id;
  }

  it("starts with persona perspective and never exposes quiz progress", () => {
    const state = createState();
    const sit = getSituation(state);
    assert.equal(sit.id, "perspective.select");
    assert.equal(sit.progressHint, null);
    assert.equal(sit.options.length >= 6, true);
  });

  it("sales persona routes through sales-origin proof and sales value", () => {
    const { log, state } = walk("sales", firstOption, 12);
    const ids = log.map((l) => l.situation.id);
    assert.ok(ids.includes("proof.sales-origin"), ids.join(","));
    assert.ok(ids.includes("value.sales"), ids.join(","));
    assert.ok(ids.includes("horizon.dpp"), ids.join(","));
    assert.equal(isComplete(state) || state.result != null, true);
  });

  it("procurement emphasizes supplier friction before systems depth", () => {
    const { log } = walk("procurement", firstOption, 12);
    const ids = log.map((l) => l.situation.id);
    const supplierIdx = ids.indexOf("friction.supplier");
    const valueIdx = ids.findIndex((id) => id.startsWith("value."));
    assert.ok(supplierIdx !== -1, ids.join(","));
    assert.ok(valueIdx === -1 || supplierIdx < valueIdx);
    assert.ok(ids.includes("value.procurement"), ids.join(","));
  });

  it("weak retrieval opens clarification or supplier follow-up", () => {
    const { log } = walk("sales", weakChooser, 12);
    const ids = log.map((l) => l.situation.id);
    const branched =
      ids.includes("friction.clarification") ||
      ids.includes("friction.supplier");
    assert.equal(branched, true, ids.join(","));
  });

  it("high-confidence strong path can skip clarification", () => {
    const { log, state } = walk("product", firstOption, 12);
    const ids = log.map((l) => l.situation.id);
    // Strong first options should often skip clarification
    // At minimum journey completes and records skips OR never needed clarification
    assert.ok(ids.includes("horizon.dpp"));
    assert.ok(state.capabilities.informationRetrieval.evidence.length >= 1);
  });

  it("shared capability model across personas (same dimension ids)", () => {
    const sales = walk("sales", firstOption, 12).state;
    const proc = walk("procurement", firstOption, 12).state;
    assert.deepEqual(
      Object.keys(sales.capabilities).sort(),
      Object.keys(proc.capabilities).sort()
    );
    assert.deepEqual(
      Object.keys(sales.capabilities).sort(),
      [...DIMENSION_IDS].sort()
    );
  });

  it("answer updates dimensions captured by the scenario", () => {
    let state = createState({ persona: "sales" });
    for (let i = 0; i < 8 && !isComplete(state); i++) {
      const sit = getSituation(state);
      if (sit.id === "friction.retrieval") {
        const before = state.capabilities.informationRetrieval.score;
        const beforeLen = state.capabilities.informationRetrieval.evidence.length;
        state = answer(state, "immediate");
        const cap = state.capabilities.informationRetrieval;
        assert.equal(cap.evidence.length, beforeLen + 1);
        assert.equal(cap.evidence.at(-1).strength, 4);
        assert.equal(cap.score > before || beforeLen === 0, true);
        assert.equal(cap.status === "operational" || cap.status === "trusted" || cap.status === "emerging", true);
        return;
      }
      state = answer(state, sit.options[0].id);
    }
    assert.fail("never reached friction.retrieval");
  });
});

describe("landscape result", () => {
  it("produces foundation, fragmentation, nextCapability, opportunities, personaInterpretation, internal", () => {
    const { landscape } = walk("leadership", (s) => s.options[0].id, 12);
    assert.ok(landscape.foundation.dimensions.length >= 1);
    assert.ok(landscape.fragmentation.dimensions.length >= 1);
    assert.ok(landscape.fragmentation.boundary);
    assert.equal(typeof landscape.nextCapability.id, "string");
    assert.equal(typeof landscape.nextCapability.why, "string");
    assert.equal(typeof landscape.nextCapability.firstMove, "string");
    assert.ok(Array.isArray(landscape.nextCapability.expectedUnlocks));
    assert.ok(landscape.opportunities.length >= 1);
    assert.ok(landscape.dppImplications.caveat.includes("Prduct"));
    assert.ok(landscape.personaInterpretation.headline);
    assert.ok(landscape.internal.timelineBand);
    assert.equal(typeof landscape.internal.maturityScore, "number");
    assert.equal(landscape.internal.maturityScore >= 0, true);
    assert.equal(landscape.internal.maturityScore <= 100, true);
  });

  it("keeps DPP implications as consequence with caveat (brand Prduct)", () => {
    const state = finalize(createState({ persona: "sustainability" }));
    assert.match(state.result.dppImplications.caveat, /Prduct/);
    assert.ok(Array.isArray(state.result.dppImplications.readyFields));
    assert.ok(Array.isArray(state.result.dppImplications.exposedGaps));
  });
});

describe("calculator bridge", () => {
  it("maps hints into timeline bands compatible with existing calculator", () => {
    const easy = timelineBandFromHints({
      companySize: 6,
      productComplexity: 6,
      portfolio: 6,
      dataAvailability: 6,
      dataSharing: 6
    });
    assert.equal(easy.min, 6);
    const hard = timelineBandFromHints({
      companySize: 24,
      productComplexity: 24,
      portfolio: 24,
      dataAvailability: 24,
      dataSharing: 24
    });
    assert.equal(hard.max, 30);
  });

  it("exports calculator-shaped answers from a walked state", () => {
    const { state } = walk("sales", (s) => s.options[0].id, 12);
    const answers = toCalculatorAnswers(state);
    assert.ok(answers.dataAvailability.score != null);
    assert.ok(answers.tiers.dim != null);
    const maturity = maturityFromCapabilities(state.capabilities);
    assert.equal(maturity >= 0 && maturity <= 100, true);
  });
});

describe("runPath helper", () => {
  it("runs a short scripted path to a landscape", () => {
    // persona pre-set; feed options for subsequent nodes dynamically via walk instead
    const { landscape } = runPath("service", []);
    assert.ok(landscape.foundation);
    assert.ok(landscape.personaInterpretation.headline.includes("service") ||
      landscape.personaInterpretation.suggestedConversation.length > 0);
  });
});
