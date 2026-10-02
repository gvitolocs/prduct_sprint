/**
 * Scored readiness dashboard — kept for a later iteration, not shown in the demo.
 * Percentages and field counts from pathfinder/dashboard.js; they wait for a defensible weighting.
 * Internal preview only: add ?view=dashboard to the URL (journey/app.js).
 */

import { buildDashboard } from "../pathfinder/dashboard.js";
import { REGULATION, nextSteps, ctaHtml, wireCta } from "./landscape.js";
import { esc } from "./panel.js";

/** Small line icons for the monitoring cards (24px grid, stroke = currentColor). */
const ICONS = {
  suppliers: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="17.5" r="1.6"/><circle cx="17.5" cy="17.5" r="1.6"/>',
  materials: '<path d="M12 3 3 8l9 5 9-5-9-5z"/><path d="m3 13 9 5 9-5"/>',
  components: '<rect x="4" y="4" width="7" height="7" rx="1"/><rect x="13" y="4" width="7" height="7" rx="1"/><rect x="4" y="13" width="7" height="7" rx="1"/><rect x="13" y="13" width="7" height="7" rx="1"/>',
  records: '<ellipse cx="12" cy="6" rx="7" ry="2.6"/><path d="M5 6v12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6"/><path d="M5 12c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6"/>',
  passport: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>',
  nextLife: '<path d="M20 12a8 8 0 1 1-2.3-5.6"/><path d="M20 4v5h-5"/>'
};

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function bar(ok, partial, total, label) {
  const okPct = total ? (ok / total) * 100 : 0;
  const partPct = total ? (partial / total) * 100 : 0;
  return `<span class="jr-bar" role="img" aria-label="${esc(label)}">
    <i class="is-ok" style="width:${okPct.toFixed(1)}%"></i><i class="is-part" style="width:${partPct.toFixed(1)}%"></i></span>`;
}

function progressCard(p) {
  const meta = [p.completeLabel, p.partialLabel].filter(Boolean).join(" · ");
  return `<details class="jr-card" data-card="progress-${p.id}">
    <summary>
      <span class="jr-card-head"><span class="jr-card-title">${esc(p.title)}</span><span class="jr-chev" aria-hidden="true"></span></span>
      <span class="jr-card-big">${p.pct}%</span>
      ${bar(p.complete, p.partial, p.total, `${meta} of ${p.total}`)}
      <span class="jr-card-meta"><span>${esc(meta)}</span><span>${p.total} total</span></span>
    </summary>
    <ul class="jr-card-items">${p.items
      .map((i) => `<li data-status="${i.status}"><span>${esc(i.label)}</span><small>${esc(i.note)}</small></li>`)
      .join("")}</ul>
  </details>`;
}

function monitorCard(m) {
  return `<details class="jr-card is-mon" data-card="attention-${m.id}"${m.total ? "" : " data-empty"}>
    <summary>
      <span class="jr-card-head"><span class="jr-card-title"><i class="jr-ico" aria-hidden="true"><svg viewBox="0 0 24 24">${
        ICONS[m.id] || ""
      }</svg></i>${esc(m.title)}</span><span class="jr-chev" aria-hidden="true"></span></span>
      <span class="jr-card-label">Needs attention</span>
      <span class="jr-card-big">${m.needs}</span>
      ${bar(m.ok, 0, m.total, `${m.ok} of ${m.total} OK`)}
      <span class="jr-card-meta"><span>${m.ok} OK</span><span>${m.total} total</span></span>
    </summary>
    <ul class="jr-card-items">${
      m.items
        .map((i) => `<li data-status="${i.status}"><span>${esc(i.label)}</span><small>You answered: ${esc(i.answer)}</small></li>`)
        .join("") || `<li data-status="missing"><span>Not covered by your answers</span></li>`
    }</ul>
  </details>`;
}

/**
 * @param {HTMLElement} el     the .jr-land layer
 * @param {object} state        the finalized journey (finalizeJourney)
 * @param {{ industry: string, short: string, object?: string }} meta
 */
export function renderDashboardView(el, state, meta, handlers) {
  const result = state.result;
  const branch = state.branch;
  const dash = buildDashboard(state);
  const next = nextSteps(result, branch);
  const answered = dash.monitoring.reduce((a, m) => a + m.total, 0);

  el.innerHTML = `
    <div class="jr-land-inner jr-dash">
      <header class="jr-dash-head">
        <div>
          <p class="jr-dash-kicker">Product Data Landscape · ${esc(meta.industry)} · internal preview</p>
          <h2 class="jr-land-title" tabindex="-1">Your ${esc(meta.object || meta.short)} data today</h2>
        </div>
        <p class="jr-dash-updated">From your ${plural(answered, "answer", "answers")} · updated just now</p>
      </header>

      <section class="jr-dash-sec" aria-labelledby="jr-dash-progress">
        <h3 id="jr-dash-progress" class="jr-dash-h">Passport readiness</h3>
        <div class="jr-dash-grid">${dash.progress.map(progressCard).join("")}</div>
        <p class="jr-dash-note">${esc(REGULATION[branch] || "")} ${esc(result.dppPlate.caveat)}</p>
      </section>

      <section class="jr-dash-sec" aria-labelledby="jr-dash-mon">
        <h3 id="jr-dash-mon" class="jr-dash-h">Needs attention <span>${dash.needsAttention} of ${plural(
          answered,
          "answer",
          "answers"
        )} across the lifecycle</span></h3>
        <div class="jr-dash-grid">${dash.monitoring.map(monitorCard).join("")}</div>
      </section>

      <section class="jr-dash-sec" aria-labelledby="jr-dash-next">
        <h3 id="jr-dash-next" class="jr-dash-h">Make this reliable next</h3>
        <div class="jr-dash-grid">
          <div class="jr-card is-text">
            <span class="jr-card-title">First moves</span>
            <p>${esc(next.why)}</p>
            <ol class="jr-moves">${next.moves.map((m) => `<li>${esc(m)}</li>`).join("")}</ol>
          </div>
          ${next.opps
            .map(
              (o) => `<div class="jr-card is-text"><span class="jr-card-title">Where it pays back · ${esc(o.title)}</span><p>${esc(
                o.text
              )}</p></div>`
            )
            .join("")}
        </div>
      </section>
      ${ctaHtml()}
    </div>`;

  wireCta(el, handlers);
  return dash;
}
