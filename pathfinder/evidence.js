/**
 * Evidence strength (0–4) → score (0–100) mapping.
 * Pure functions; no DOM.
 */

/** @typedef {0|1|2|3|4} Strength */

export const STRENGTH_BANDS = Object.freeze({
  0: Object.freeze({ min: 0, max: 20, mid: 10, label: "unknown" }),
  1: Object.freeze({ min: 21, max: 40, mid: 30, label: "person-dependent" }),
  2: Object.freeze({ min: 41, max: 60, mid: 50, label: "partial" }),
  3: Object.freeze({ min: 61, max: 80, mid: 70, label: "repeatable" }),
  4: Object.freeze({ min: 81, max: 100, mid: 90, label: "verified" })
});

/**
 * Map discrete evidence strength to a score in 0–100.
 * @param {number} strength
 * @param {{ bias?: number }} [opts] bias in [-1,1] nudges within the band
 */
export function strengthToScore(strength, opts = {}) {
  const s = clampStrength(strength);
  const band = STRENGTH_BANDS[s];
  const bias = Math.max(-1, Math.min(1, opts.bias ?? 0));
  const span = band.max - band.min;
  const score = Math.round(band.mid + bias * (span / 2));
  return Math.max(band.min, Math.min(band.max, score));
}

/** @param {number} strength */
export function clampStrength(strength) {
  const n = Number.isFinite(strength) ? Math.round(strength) : 0;
  return Math.max(0, Math.min(4, n));
}

/**
 * Derive status from score.
 * @param {number} score
 * @returns {"unknown"|"fragmented"|"emerging"|"operational"|"trusted"}
 */
export function scoreToStatus(score) {
  if (score == null || score < 21) return "unknown";
  if (score < 41) return "fragmented";
  if (score < 61) return "emerging";
  if (score < 81) return "operational";
  return "trusted";
}

/**
 * Confidence from evidence count and mean strength.
 * @param {{ strength: number }[]} evidence
 * @returns {"low"|"medium"|"high"}
 */
export function evidenceConfidence(evidence) {
  if (!evidence || evidence.length === 0) return "low";
  const mean =
    evidence.reduce((a, e) => a + clampStrength(e.strength), 0) / evidence.length;
  if (evidence.length >= 2 && mean >= 3) return "high";
  if (evidence.length >= 2 || mean >= 2.5) return "medium";
  if (evidence.length === 1 && mean >= 3) return "medium";
  return "low";
}

/**
 * Blend multiple strength samples into one score (latest-weighted mean of mids).
 * @param {{ strength: number }[]} evidence
 */
export function blendEvidenceScore(evidence) {
  if (!evidence || evidence.length === 0) return 0;
  let weightSum = 0;
  let scoreSum = 0;
  evidence.forEach((e, i) => {
    const w = i + 1; // later evidence weighs more
    weightSum += w;
    scoreSum += strengthToScore(e.strength) * w;
  });
  return Math.round(scoreSum / weightSum);
}

export function isWeakScore(score) {
  return score < 41;
}

export function isAmbiguousScore(score) {
  return score >= 41 && score <= 60;
}

export function isStrongScore(score) {
  return score > 60;
}
