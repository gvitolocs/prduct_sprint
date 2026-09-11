const store = globalThis.__prductSubmissions || (globalThis.__prductSubmissions = []);

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return json(res, 405, { ok: false, error: "method not allowed" });
  }
  let payload;
  try {
    payload = await readBody(req);
  } catch {
    return json(res, 400, { ok: false, error: "invalid json" });
  }
  const lead = payload.lead || {};
  const email = String(lead.email || "").trim();
  const company = String(lead.company || "").trim();
  if (!email.includes("@") || !company) {
    return json(res, 400, { ok: false, error: "email and company required" });
  }
  const record = {
    id: new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 18) + "Z",
    receivedAt: new Date().toISOString(),
    lead: {
      firstName: String(lead.firstName || "").trim().slice(0, 80),
      lastName: String(lead.lastName || "").trim().slice(0, 80),
      email: email.slice(0, 120),
      company: company.slice(0, 120),
      role: String(lead.role || "").trim().slice(0, 80),
    },
    answers: payload.answers || {},
    scores: payload.scores || {},
    personality: payload.personality || {},
    source: "spin-in-furniture-dpp",
  };
  store.push(record);
  if (store.length > 500) store.splice(0, store.length - 500);
  return json(res, 200, { ok: true, id: record.id });
}
