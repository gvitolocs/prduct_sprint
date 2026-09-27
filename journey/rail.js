/**
 * Lifecycle spine: ten stops on one hairline, a small glass bead that travels
 * with the camera, and a quiet mark per stop once the journey has evidence
 * there. It is navigation (visited stops are buttons) and, at the end, the
 * seed of the landscape map.
 */

export class Rail {
  constructor(el, stages, labels, { onJump } = {}) {
    this.el = el;
    this.stages = stages;
    this.pos = 0;
    this.el.innerHTML = `
      <div class="jr-rail-track"></div>
      <div class="jr-rail-fill"></div>
      <ol>${stages
        .map(
          (id, i) => `<li class="jr-stop" style="--i:${i}" data-stage="${id}" data-state="future">
            <button type="button" class="jr-stop-btn" tabindex="-1" aria-disabled="true">
              <span class="jr-stop-name">${labels[id]}</span>
              <span class="jr-stop-mark" aria-hidden="true"></span>
            </button>
          </li>`
        )
        .join("")}</ol>
      <span class="jr-bead" aria-hidden="true"></span>
      <p class="jr-rail-now" aria-hidden="true"></p>`;
    this.bead = this.el.querySelector(".jr-bead");
    this.now = this.el.querySelector(".jr-rail-now");
    this.stops = [...this.el.querySelectorAll(".jr-stop")];
    this.labels = labels;
    this.el.addEventListener("click", (e) => {
      const stop = e.target.closest(".jr-stop");
      if (stop && stop.dataset.state === "done") onJump?.(stop.dataset.stage);
    });
  }

  /** p: continuous stage index (0 … stages.length-1). */
  setPosition(p) {
    this.pos = p;
    this.el.style.setProperty("--jr-p", String(p / (this.stages.length - 1)));
    const i = Math.min(this.stages.length - 1, Math.round(p));
    this.now.innerHTML = `${String(i + 1).padStart(2, "0")} / ${this.stages.length} · <b>${this.labels[this.stages[i]]}</b>`;
  }

  /** Smoothly move the bead (back navigation, jumps). */
  animateTo(target, ms = 650) {
    const from = this.pos;
    const t0 = performance.now();
    const run = new Promise((resolve) => {
      const step = (now) => {
        const k = Math.min(1, (now - t0) / ms);
        this.setPosition(from + (target - from) * smooth(k));
        if (k < 1) requestAnimationFrame(step);
        else resolve();
      };
      requestAnimationFrame(step);
    });
    // Bounded: without frames (background tab) jump to the target instead of waiting.
    return Promise.race([run, new Promise((r) => setTimeout(r, ms + 150))]).then(() => this.setPosition(target));
  }

  /** Follow a transition: progress 0..1 between stop `i` and `i+1`. */
  follow(i, progress) {
    this.setPosition(i + smooth(progress));
  }

  setWaiting(on) {
    this.bead.classList.toggle("is-waiting", !!on);
  }

  /**
   * @param {number} current index of the stage on screen
   * @param {number} reached furthest stage index reached
   * @param {Record<string, string>} evidence stage → strong|partial|weak|broken
   */
  update(current, reached, evidence = {}) {
    this.stops.forEach((stop, i) => {
      const state = i === current ? "current" : i <= reached ? "done" : "future";
      stop.dataset.state = state;
      const ev = evidence[stop.dataset.stage];
      if (ev) stop.dataset.evidence = ev;
      else delete stop.dataset.evidence;
      const btn = stop.querySelector("button");
      const enabled = state === "done";
      btn.tabIndex = enabled ? 0 : -1;
      btn.setAttribute("aria-disabled", enabled ? "false" : "true");
      btn.setAttribute(
        "aria-label",
        `${this.labels[stop.dataset.stage]}${state === "current" ? " (current)" : enabled ? " — revisit" : ""}`
      );
      if (state === "current") btn.setAttribute("aria-current", "step");
      else btn.removeAttribute("aria-current");
    });
  }
}

function smooth(t) {
  return t * t * (3 - 2 * t);
}
