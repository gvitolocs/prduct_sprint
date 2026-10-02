/**
 * One situation at a time, entering from the right. Semantic controls:
 * a labelled region, a fieldset of buttons with aria-pressed for the answer
 * already given (answers are remembered when navigating back).
 */

const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export class Panel {
  constructor(el, { onAnswer, onBack, reducedMotion = false }) {
    this.el = el;
    this.onAnswer = onAnswer;
    this.onBack = onBack;
    this.reducedMotion = reducedMotion;
    this.q = null;
    this.locked = false;
  }

  /** Render + enter. `remembered` = option chosen before for this situation. */
  async show(sit, { remembered = null, canBack = true, kicker = "" } = {}) {
    const id = `jr-q-${sit.id.replace(/\W/g, "-")}`;
    const grid = sit.interaction === "select-persona";
    // Long questions (the sales module quotes a whole dealer email) get a compact layout so they fit a laptop screen.
    const long = sit.prompt.length > 100 || sit.options.reduce((a, o) => a + o.label.length, 0) > 300;
    const hard = sit.options.filter((o) => !o.soft);
    const soft = sit.options.filter((o) => o.soft);
    const opt = (o) => `
      <button type="button" class="jr-opt${o.soft ? " is-soft" : ""}" data-id="${esc(o.id)}"
        aria-pressed="${o.id === remembered ? "true" : "false"}">
        <span class="jr-opt-label">${esc(o.label)}</span>
        ${o.sub ? `<span class="jr-opt-sub">${esc(o.sub)}</span>` : ""}
      </button>`;
    const html = `
      <section class="jr-q${long ? " is-long" : ""}" aria-labelledby="${id}">
        <p class="jr-kicker jr-q-kicker">${esc(kicker)}</p>
        ${sit.why ? `<p class="jr-q-why">${esc(sit.why)}</p>` : ""}
        <h3 class="jr-q-prompt" id="${id}" tabindex="-1">${esc(sit.prompt)}</h3>
        ${sit.detail ? `<p class="jr-q-detail">${esc(sit.detail)}</p>` : ""}
        <fieldset class="jr-opts${grid ? " is-grid" : ""}">
          <legend>${esc(sit.prompt)}</legend>
          ${hard.map(opt).join("")}
        </fieldset>
        <div class="jr-q-foot">
          <button type="button" class="jr-link" data-act="back" ${canBack ? "" : "disabled"}>← Back</button>
          ${soft.length ? `<div class="jr-opts">${soft.map(opt).join("")}</div>` : ""}
        </div>
      </section>`;
    const hadFocus = this.el.contains(document.activeElement);
    this.el.innerHTML = html;
    this.q = this.el.firstElementChild;
    this.locked = false;
    this.q.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (!b || this.locked) return;
      if (b.dataset.act === "back") return this.onBack?.();
      if (b.dataset.id) this.choose(b);
    });
    // Arrow keys move between choices (Tab keeps working as usual).
    this.q.addEventListener("keydown", (e) => {
      if (!["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight"].includes(e.key)) return;
      const opts = [...this.q.querySelectorAll(".jr-opt")];
      const i = opts.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      const step = e.key === "ArrowDown" || e.key === "ArrowRight" ? 1 : -1;
      opts[(i + step + opts.length) % opts.length].focus();
    });
    const parts = [...this.q.children];
    if (!this.reducedMotion) {
      parts.forEach((p, i) =>
        p.animate(
          [
            { opacity: 0, transform: "translateX(56px)" },
            { opacity: 1, transform: "none" }
          ],
          { duration: 560, delay: i * 45, easing: EASE, fill: "backwards" }
        )
      );
    }
    // Keyboard users keep their place; pointer users are not scrolled around.
    const target = hadFocus
      ? this.q.querySelector('.jr-opt[aria-pressed="true"]') || this.q.querySelector(".jr-opt")
      : this.q.querySelector(".jr-q-prompt");
    target?.focus({ preventScroll: true });
    if (!this.reducedMotion) await wait(560 + parts.length * 45);
  }

  choose(button) {
    this.locked = true;
    for (const b of this.q.querySelectorAll(".jr-opt")) b.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-pressed", "true");
    button.classList.add("is-chosen");
    if (!this.reducedMotion) {
      button.animate([{ transform: "scale(0.985)" }, { transform: "none" }], { duration: 220, easing: EASE });
    }
    this.onAnswer?.(button.dataset.id);
  }

  async hide() {
    if (!this.q) return;
    const q = this.q;
    this.locked = true;
    if (!this.reducedMotion) {
      const anim = q.animate(
        [
          { opacity: 1, transform: "none" },
          { opacity: 0, transform: "translateX(-28px)" }
        ],
        { duration: 300, easing: "cubic-bezier(0.4, 0, 1, 1)", fill: "forwards" }
      );
      // Never block the journey on rendering (background tabs do not advance animations).
      await Promise.race([anim.finished.catch(() => {}), wait(420)]);
    }
    if (this.q === q) {
      this.el.innerHTML = "";
      this.q = null;
    }
  }

  clear() {
    this.el.innerHTML = "";
    this.q = null;
  }
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
