import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  BRANCHES,
  LIFECYCLE_STAGES,
  JOURNEY_SCENARIOS,
  createJourney,
  getJourneySituation,
  answerJourney,
  undoJourney,
  replayJourney,
  isJourneyComplete,
  finalizeJourney,
  currentStage,
  toJourneyPayload
} from "../lifecycle.js";
import { DIMENSION_IDS } from "../dimensions.js";

/** Walk a whole journey choosing option index `pick(situation)`. */
function walk(branch, pick) {
  let state = createJourney({ branch });
  const seen = [];
  for (let i = 0; i < 20 && !isJourneyComplete(state); i++) {
    const sit = getJourneySituation(state);
    seen.push(sit);
    state = answerJourney(state, sit.options[pick(sit)].id);
  }
  return { state, seen };
}

const strongest = (sit) => {
  const ids = sit.options.filter((o) => !o.soft).map((o) => o.id);
  const byStrength = ids.map((id) => [id, JOURNEY_SCENARIOS[sit.id].options.find((o) => o.id === id).strength]);
  byStrength.sort((a, b) => b[1] - a[1]);
  return sit.options.findIndex((o) => o.id === byStrength[0][0]);
};
const weakest = (sit) => {
  const opts = JOURNEY_SCENARIOS[sit.id].options.filter((o) => sit.options.some((s) => s.id === o.id) && !o.soft);
  const min = opts.reduce((a, b) => (b.strength < a.strength ? b : a));
  return sit.options.findIndex((o) => o.id === min.id);
};

describe("lifecycle journey", () => {
  it("covers the ten lifecycle stages in order", () => {
    assert.deepEqual(LIFECYCLE_STAGES, [
      "company", "product", "material", "component", "supplier",
      "logistics", "factory", "data", "passport", "nextLife"
    ]);
  });

  for (const branch of Object.keys(BRANCHES)) {
    it(`${branch}: every situation has branch wording and 2+ options`, () => {
      const { seen } = walk(branch, () => 0);
      for (const sit of seen) {
        assert.ok(sit.prompt && sit.prompt.length > 10, sit.id);
        assert.ok(sit.options.length >= 2, sit.id);
        for (const opt of sit.options) assert.ok(opt.label, `${sit.id}/${opt.id}`);
      }
    });

    it(`${branch}: strong path reaches the landscape with a verified follow-up`, () => {
      const { state, seen } = walk(branch, strongest);
      assert.ok(isJourneyComplete(state));
      assert.ok(seen.some((s) => s.id === "supplier.proof"), "deep traceability triggers proof check");
      assert.ok(!seen.some((s) => s.id === "data.retrieval"), "connected data skips retrieval test");
      const done = finalizeJourney(state);
      assert.ok(done.result.foundation.dimensions.length >= 1);
      assert.equal(done.result.journey.branch, branch);
      assert.equal(done.result.journey.links.length, 5);
    });

    it(`${branch}: weak path opens supplier and retrieval follow-ups, capped at two`, () => {
      const { state, seen } = walk(branch, weakest);
      const followups = seen.filter((s) => s.kind === "followup").map((s) => s.id);
      assert.ok(followups.includes("logistics.change"));
      assert.ok(followups.includes("data.retrieval"));
      assert.ok(followups.length <= 2);
      const done = finalizeJourney(state);
      assert.ok(done.result.journey.weakLinks.length >= 3);
      assert.ok(done.result.fragmentation.explanation.length > 0);
    });
  }

  it("persona and sector come from answers, scoring stays on the shared 13 dimensions", () => {
    const { state } = walk("battery", (sit) => (sit.id === "product.perspective" ? 3 : 1));
    assert.equal(state.persona, "procurement");
    assert.equal(state.sectorObject.id, "battery");
    assert.deepEqual(Object.keys(state.capabilities).sort(), [...DIMENSION_IDS].sort());
  });

  it("undo rebuilds the exact previous state (back navigation keeps answers)", () => {
    let state = createJourney({ branch: "textile" });
    const ids = [];
    for (let i = 0; i < 6; i++) {
      const sit = getJourneySituation(state);
      ids.push(sit.options[1].id);
      state = answerJourney(state, sit.options[1].id);
    }
    const back = undoJourney(state);
    const replay = replayJourney("textile", ids.slice(0, -1));
    assert.deepEqual(back.history, replay.history);
    assert.equal(back.currentNode, replay.currentNode);
    assert.equal(currentStage(back), getJourneySituation(back).stage);
  });

  it("made-to-order is a furniture-only answer that flags the identity caveat", () => {
    let f = createJourney({ branch: "furniture" });
    f = answerJourney(f, "leadership");
    assert.ok(getJourneySituation(f).options.some((o) => o.id === "made-to-order"));
    f = answerJourney(f, "made-to-order");
    assert.ok(f.flags.includes("made-to-order"));
    let b = answerJourney(createJourney({ branch: "battery" }), "leadership");
    assert.ok(!getJourneySituation(b).options.some((o) => o.id === "made-to-order"));
    assert.throws(() => answerJourney(b, "made-to-order"));
  });

  it("payload carries answers, capabilities and the result", () => {
    const { state } = walk("furniture", () => 1);
    const payload = toJourneyPayload(finalizeJourney(state));
    assert.equal(payload.branch, "furniture");
    assert.ok(payload.answers.length >= 12);
    assert.ok(payload.result.dppPlate.rows.length === 6);
    assert.ok(payload.result.internal.timelineBand);
  });
});
