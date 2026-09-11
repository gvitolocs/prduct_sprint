const store = globalThis.__prductSubmissions || (globalThis.__prductSubmissions = []);

export default async function handler(req, res) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: "method not allowed" }));
    return;
  }
  res.statusCode = 200;
  res.end(JSON.stringify({ ok: true, count: store.length, submissions: store }));
}
