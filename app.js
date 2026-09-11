const QUESTIONS = [
  {
    id: "companySize",
    title: "How large is the company placing furniture on the EU market?",
    hint: "Same size bands a readiness calculator uses — they move the implementation timeline.",
    options: [
      { label: "Micro", sub: "Under €1M revenue", score: 6 },
      { label: "Small", sub: "€1–10M revenue", score: 8 },
      { label: "Medium", sub: "€10–100M revenue", score: 12 },
      { label: "Large", sub: "€100M–1B revenue", score: 18 },
      { label: "Enterprise", sub: "Over €1B revenue", score: 24 }
    ]
  },
  {
    id: "portfolio",
    title: "How many finished products sit in the catalogue that would need a passport?",
    hint: "Portfolio complexity. More SKUs means more passports to fill and keep current.",
    options: [
      { label: "1–20 products", score: 6 },
      { label: "20–50 products", score: 8 },
      { label: "50–200 products", score: 12 },
      { label: "200–500 products", score: 18 },
      { label: "500+ products", score: 24 }
    ]
  },
  {
    id: "productComplexity",
    title: "How complex is a typical piece — materials and components?",
    hint: "Furniture DPP needs wood species, panels, upholstery fibres, metals, recycled content.",
    options: [
      { label: "1–5 materials / components", score: 6 },
      { label: "5–20 components", score: 8 },
      { label: "20–50 components", score: 12 },
      { label: "50–100 components", score: 18 },
      { label: "100+ components", score: 24 }
    ]
  },
  {
    id: "dataAvailability",
    title: "Where does product and supplier data actually live today?",
    hint: "Data availability — digital form, a folder of supplier PDFs, or someone’s head.",
    dim: "dataAvailability",
    options: [
      { label: "Mostly in someone’s head", sub: "Or scattered inboxes", score: 24, dim: 15 },
      { label: "Supplier PDFs and email chains", score: 18, dim: 35 },
      { label: "Spreadsheets we maintain ourselves", score: 12, dim: 60 },
      { label: "Some of it in ERP / PLM", score: 12, dim: 75 },
      { label: "All product data in ERP / PLM", score: 6, dim: 95 }
    ]
  },
  {
    id: "dataSharing",
    title: "How do you collect material and component data from suppliers?",
    hint: "Same axis as a DPP calculator: comprehensive, minimal, or not at all.",
    dim: "systems",
    options: [
      { label: "We do not collect it", score: 24, dim: 20 },
      { label: "Minimal data, mostly on request", score: 12, dim: 50 },
      { label: "Comprehensive data from suppliers", score: 6, dim: 90 }
    ]
  },
  {
    id: "tiers",
    title: "How many supplier tiers can you name for your top materials — especially wood?",
    hint: "Supply chain reach. Visibility that stops at the warehouse door will not satisfy EUDR or DPP.",
    dim: "supplyChainReach",
    options: [
      { label: "Direct suppliers only (tier 1)", dim: 25, score: 20 },
      { label: "Tier 1 and some tier 2", dim: 55, score: 14 },
      { label: "Named suppliers three or more tiers back", dim: 90, score: 8 }
    ]
  },
  {
    id: "contracts",
    title: "Do contracts require suppliers to share sustainability and material data?",
    hint: "Leverage. If they do not have to send it, they usually will not.",
    dim: "supplyChainReach",
    options: [
      { label: "No contractual requirement", dim: 20, score: 20 },
      { label: "Asked in onboarding, not enforced", dim: 50, score: 14 },
      { label: "Yes — written into supplier agreements", dim: 90, score: 8 }
    ]
  },
  {
    id: "certification",
    title: "What share of key wood already carries FSC, PEFC or similar chain-of-custody?",
    hint: "Certifications are a shortcut into EUDR geolocation and legal harvest evidence.",
    dim: "regulatoryAwareness",
    options: [
      { label: "None / we do not know", dim: 15, score: 22 },
      { label: "Some, not mapped to SKUs", dim: 45, score: 14 },
      { label: "Most of the volume", dim: 75, score: 10 },
      { label: "All key wood, tied to products", dim: 95, score: 6 }
    ]
  },
  {
    id: "hazardous",
    title: "Do you know hazardous substances in finishes, adhesives and flame retardants?",
    hint: "Furniture DPP will want REACH-ready declarations — not a guess.",
    dim: "regulatoryAwareness",
    options: [
      { label: "We would have to ask around", dim: 20, score: 22 },
      { label: "Partial — some materials only", dim: 55, score: 14 },
      { label: "Documented REACH picture", dim: 90, score: 8 }
    ]
  },
  {
    id: "ownership",
    title: "Who owns DPP and product-data governance internally?",
    hint: "Leadership, collaboration, capacity — or a gap between sustainability, compliance and product.",
    dim: "ownership",
    options: [
      { label: "It falls between departments", dim: 20, score: 20 },
      { label: "Someone is interested, no mandate", dim: 45, score: 14 },
      { label: "Named owner, leadership is engaged", dim: 85, score: 8 },
      { label: "Owner plus budget and a working group", dim: 95, score: 6 }
    ]
  },
  {
    id: "commercialIntent",
    title: "Is DPP a compliance cost — or a reason customers pick you?",
    hint: "The gap Prduct is trying to close: better data for you, boost sales for them.",
    dim: "commercialIntent",
    options: [
      { label: "Pure compliance burden", dim: 20, score: 16 },
      { label: "Mostly compliance, a bit of marketing", dim: 50, score: 12 },
      { label: "We already sell on transparency", dim: 85, score: 8 }
    ]
  },
  {
    id: "trustLikert",
    title: "Do you agree: complete, reliable product data makes a supplier more credible — and customers more likely to buy?",
    hint: "Scale from the Spin-in board. 1 = strongly disagree, 5 = totally agree.",
    dim: "trustToShare",
    options: [
      { label: "1 — strongly disagree", dim: 10, score: 16 },
      { label: "2", dim: 30, score: 14 },
      { label: "3", dim: 50, score: 12 },
      { label: "4", dim: 75, score: 10 },
      { label: "5 — totally agree", dim: 95, score: 8 }
    ]
  }
];

const DPP_FIELDS = [
  { id: "composition", label: "Composition", need: "Wood species, panels, fibres, metals, recycled content" },
  { id: "wood", label: "Wood sourcing", need: "FSC/PEFC, country of harvest, EUDR legality" },
  { id: "hazard", label: "Hazardous substances", need: "Flame retardants, treatments, adhesives, REACH" },
  { id: "durability", label: "Durability & repair", need: "Test results, spare parts, repair instructions" },
  { id: "carbon", label: "Carbon footprint", need: "Lifecycle emissions, materials through transport" },
  { id: "eol", label: "End-of-life", need: "Disassembly, recycling, take-back schemes" }
];

const TYPES = [
  { id: "ready", name: "Passport-ready", when: (d) => avg(d) >= 78, blurb: "The operating model is close. Fill remaining DPP fields and keep them current after sale." },
  { id: "operator", name: "Circular operator", when: (d) => d.commercialIntent >= 70 && d.dataAvailability >= 60, blurb: "You already treat product data as a sales asset. The work is connecting suppliers into one model." },
  { id: "warehouse", name: "Warehouse-door watcher", when: (d) => d.supplyChainReach < 40, blurb: "Visibility stops at your own door. EUDR geolocation and furniture DPP supply-chain data will stall at tier 1." },
  { id: "spreadsheet", name: "Spreadsheet survivalist", when: (d) => d.dataAvailability < 50, blurb: "The data exists in people and files, not in a system that can issue a passport." },
  { id: "firefighter", name: "Compliance firefighter", when: (d) => d.commercialIntent < 45, blurb: "DPP is still a cost centre. The commercial gap — trust and sales from better data — is unused." },
  { id: "builder", name: "Passport builder", when: () => true, blurb: "You are in the middle of the pack: enough awareness to start, not enough data model to issue passports yet." }
];

const state = { i: -1, answers: {}, lead: {} };

function avg(d) {
  const v = Object.values(d);
  return v.reduce((a, b) => a + b, 0) / v.length;
}

function protokolTimeline(answers) {
  const keys = ["companySize", "productComplexity", "portfolio", "dataAvailability", "dataSharing"];
  const scores = keys.map((k) => (answers[k] && answers[k].score) || 0);
  const averageScore = scores.reduce((a, b) => a + b, 0) / 5;
  let min = 6, max = 6;
  if (averageScore <= 7) { min = 6; max = 6; }
  else if (averageScore <= 10) { min = 6; max = 12; }
  else if (averageScore <= 15) { min = 12; max = 18; }
  else if (averageScore <= 21) { min = 18; max = 24; }
  else { min = 24; max = 30; }
  const mid = Math.round((min + max) / 2);
  const display = min === max ? `${min} months` : `${min}–${max} months`;
  const stages = [
    ["Exploration", 0.05],
    ["Understanding", 0.15],
    ["Preparation", 0.15],
    ["Pilot", 0.25],
    ["Implementation", 0.40]
  ].map(([name, p]) => ({ name, months: Math.max(1, Math.round(mid * p)) }));
  return { min, max, avg: mid, display, averageScore, stages };
}

function dimensions(answers) {
  const d = {
    dataAvailability: 40,
    supplyChainReach: 40,
    systems: 40,
    regulatoryAwareness: 40,
    ownership: 40,
    commercialIntent: 40,
    trustToShare: 40
  };
  QUESTIONS.forEach((q) => {
    const a = answers[q.id];
    if (!a || a.dim == null) return;
    const key = q.dim;
    if (!key) return;
    if (d[key] === 40) d[key] = a.dim;
    else d[key] = Math.round((d[key] + a.dim) / 2);
  });
  if (answers.dataAvailability) d.systems = Math.round((d.systems + (100 - Math.min(90, answers.dataAvailability.score * 3))) / 2);
  return d;
}

function personality(d) {
  return TYPES.find((t) => t.when(d)) || TYPES[3];
}

function dppGaps(answers) {
  return DPP_FIELDS.map((f) => {
    let ok = false;
    if (f.id === "composition") ok = (answers.productComplexity && answers.productComplexity.score <= 12) && (answers.dataAvailability && answers.dataAvailability.score <= 12);
    if (f.id === "wood") ok = answers.certification && answers.certification.dim >= 75 && answers.tiers && answers.tiers.dim >= 55;
    if (f.id === "hazard") ok = answers.hazardous && answers.hazardous.dim >= 55;
    if (f.id === "durability") ok = answers.dataAvailability && answers.dataAvailability.score <= 12;
    if (f.id === "carbon") ok = answers.dataSharing && answers.dataSharing.score <= 12 && answers.tiers && answers.tiers.dim >= 55;
    if (f.id === "eol") ok = answers.commercialIntent && answers.commercialIntent.dim >= 50 && answers.dataAvailability && answers.dataAvailability.score <= 12;
    return { ...f, ok };
  });
}

function el(html) {
  const d = document.createElement("div");
  d.innerHTML = html.trim();
  return d.firstElementChild;
}

function render() {
  const root = document.getElementById("app");
  if (state.i < 0) {
    root.innerHTML = "";
    root.appendChild(el(`
      <div class="quiz-card max-w-3xl">
        <p class="text-xs font-bold uppercase tracking-wide text-violet-600">3-minute assessment · 12 questions</p>
        <h2 class="mt-2 text-xl font-bold text-slate-900 lg:text-2xl">Tell us how the data actually works today</h2>
        <p class="mt-3 text-sm text-slate-700 lg:text-base">Not a personality quiz pretending to be compliance. We ask the same operational facts used to estimate DPP timelines — then we lock the result behind name, email and company, so Prduct gets a real picture of the account.</p>
        <button class="btn-primary mt-6 px-6 py-2.5 text-sm" type="button" id="go">Begin</button>
      </div>`));
    root.querySelector("#go").onclick = () => { state.i = 0; render(); };
    return;
  }

  if (state.i >= QUESTIONS.length) {
    renderLead(root);
    return;
  }

  const q = QUESTIONS[state.i];
  const pct = Math.round((state.i / QUESTIONS.length) * 100);
  root.innerHTML = "";
  root.appendChild(el(`
    <div class="max-w-3xl">
      <div class="mb-4 flex items-center justify-between text-xs font-semibold text-slate-600">
        <span>Question ${state.i + 1} of ${QUESTIONS.length}</span>
        <span>${pct}%</span>
      </div>
      <div class="progress-track mb-6"><span style="width:${pct}%"></span></div>
      <div class="quiz-card">
        <h2 class="text-lg font-bold text-slate-900 lg:text-2xl">${q.title}</h2>
        <p class="mt-2 mb-5 text-sm text-slate-600">${q.hint}</p>
        <div class="grid gap-3" id="opts"></div>
        <div class="mt-6 flex items-center justify-between">
          <button class="btn-secondary px-5 py-2 text-xs" type="button" id="back">${state.i === 0 ? "Back" : "Previous"}</button>
        </div>
      </div>
    </div>`));
  const opts = root.querySelector("#opts");
  q.options.forEach((opt) => {
    const b = el(`<button class="choice" type="button"><span class="k">${opt.label}</span>${opt.sub ? `<span class="s">${opt.sub}</span>` : ""}</button>`);
    if (state.answers[q.id] && state.answers[q.id].label === opt.label) b.classList.add("is-on");
    b.onclick = () => {
      state.answers[q.id] = opt;
      state.i += 1;
      render();
      document.getElementById("quiz").scrollIntoView({ behavior: "smooth", block: "start" });
    };
    opts.appendChild(b);
  });
  root.querySelector("#back").onclick = () => {
    state.i = Math.max(-1, state.i - 1);
    render();
  };
}

function renderLead(root) {
  root.innerHTML = "";
  root.appendChild(el(`
    <div class="max-w-xl quiz-card">
      <p class="text-xs font-bold uppercase tracking-wide text-violet-600">Last step · so we can send your timeline</p>
      <h2 class="mt-2 text-xl font-bold text-slate-900">See your furniture DPP timeline</h2>
      <p class="mt-2 mb-5 text-sm text-slate-600">Same gate as a serious readiness tool: we need a real person and company before we show the estimate. No result without this.</p>
      <form class="grid gap-4" id="lead">
        <div class="grid gap-4 sm:grid-cols-2">
          <div><label class="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">First name</label><input class="pr-input" name="firstName" required /></div>
          <div><label class="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Last name</label><input class="pr-input" name="lastName" required /></div>
        </div>
        <div><label class="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Work email</label><input class="pr-input" name="email" type="email" required /></div>
        <div><label class="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Company</label><input class="pr-input" name="company" required /></div>
        <div><label class="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Role</label>
          <select class="pr-input" name="role" required>
            <option value="">Select</option>
            <option>Sustainability / ESG</option>
            <option>Compliance / legal</option>
            <option>Product / PIM</option>
            <option>Purchasing</option>
            <option>IT</option>
            <option>Leadership</option>
          </select>
        </div>
        <p class="err" id="err"></p>
        <button class="btn-primary px-6 py-2.5 text-sm" type="submit">Show my results</button>
      </form>
    </div>`));
  root.querySelector("#lead").onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    state.lead = Object.fromEntries(fd.entries());
    const scores = buildScores();
    const payload = {
      lead: state.lead,
      answers: Object.fromEntries(Object.entries(state.answers).map(([k, v]) => [k, { label: v.label, score: v.score, dim: v.dim }])),
      scores,
      personality: scores.personality
    };
    const record = {
      id: new Date().toISOString(),
      receivedAt: new Date().toISOString(),
      ...payload
    };
    try {
      const existing = JSON.parse(localStorage.getItem("prduct-dpp-submissions") || "[]");
      existing.push(record);
      localStorage.setItem("prduct-dpp-submissions", JSON.stringify(existing));
    } catch (_) { /* ignore quota */ }
    try {
      const res = await fetch("/api/submit", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const out = await res.json();
      if (!out.ok) throw new Error(out.error || "Could not save");
      state.savedId = out.id;
    } catch (err) {
      document.getElementById("err").textContent = "Saved in this browser. Server inbox may still catch up.";
    }
    state.done = true;
    renderResult(root, scores);
  };
}

function buildScores() {
  const timeline = protokolTimeline(state.answers);
  const dims = dimensions(state.answers);
  const person = personality(dims);
  const gaps = dppGaps(state.answers);
  return { timeline, dimensions: dims, personality: person, gaps };
}

function renderResult(root, scores) {
  const t = scores.timeline;
  const p = scores.personality;
  const meters = Object.entries(scores.dimensions).map(([k, v]) => {
    const label = k.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
    return `<div><div class="mb-1 flex justify-between text-xs font-semibold text-slate-600"><span>${label}</span><span>${v}</span></div><div class="meter-bar"><i style="width:${v}%"></i></div></div>`;
  }).join("");
  const chips = scores.gaps.map((g) => `<div class="dpp-chip ${g.ok ? "ok" : "gap"}"><strong>${g.label}</strong><br><span class="text-slate-600">${g.ok ? "Likely have a path" : "Likely a gap"} — ${g.need}</span></div>`).join("");
  const stages = t.stages.map((s) => `<li><strong>${s.name}</strong> · ~${s.months} month${s.months === 1 ? "" : "s"}</li>`).join("");
  root.innerHTML = "";
  root.appendChild(el(`
    <div class="max-w-4xl">
      <div class="quiz-card mb-6">
        <p class="text-xs font-bold uppercase tracking-wide text-violet-600">Your result</p>
        <h2 class="mt-2 text-2xl font-bold text-slate-900 lg:text-3xl">${p.name}</h2>
        <p class="mt-3 text-slate-700">${p.blurb}</p>
        <div class="mt-6 rounded-2xl bg-slate-900 p-5 text-white">
          <p class="text-xs uppercase tracking-wide text-teal-200">Estimated implementation timeline</p>
          <p class="mt-1 text-2xl font-bold">${t.display}</p>
          <p class="mt-2 text-sm text-slate-300">Built like a DPP calculator: company size, catalogue, bill of materials, where data lives, and how you collect it from suppliers. Average score ${t.averageScore.toFixed(1)} / 24.</p>
        </div>
      </div>
      <div class="grid gap-6 lg:grid-cols-2">
        <div class="quiz-card">
          <h3 class="mb-4 text-lg font-bold">Maturity dimensions</h3>
          <div class="space-y-3">${meters}</div>
        </div>
        <div class="quiz-card">
          <h3 class="mb-4 text-lg font-bold">Furniture DPP data the EU will ask for</h3>
          <div class="grid gap-2">${chips}</div>
        </div>
      </div>
      <div class="quiz-card mt-6">
        <h3 class="mb-2 text-lg font-bold">Suggested stages</h3>
        <ul class="list-disc pl-5 text-sm text-slate-700 space-y-1">${stages}</ul>
        <p class="mt-4 text-sm text-slate-600">Exploration 5% · Understanding 15% · Preparation 15% · Pilot 25% · Implementation 40% of the midpoint.</p>
        <div class="mt-6 flex flex-wrap gap-3">
          <a class="btn-primary px-6 py-2.5 text-sm" href="https://prduct.com/contact">Talk to Prduct</a>
          <a class="btn-secondary px-6 py-2.5 text-sm" href="/inbox.html">View captured response</a>
        </div>
      </div>
    </div>`));
}

render();
