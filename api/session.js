import { COOKIE, SESSION_SECONDS, newSession, passwordOk } from "./_auth.js";

// Inbox login and logout for a plain <form method="post">: a real form submission is what Safari / iCloud
// Keychain and other password managers recognise, so they offer to save the password and fill it next time.
// Always answers with a redirect back to the inbox page; the session lives in an HttpOnly cookie for /api.

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function parse(raw, type) {
  if (String(type || "").includes("application/json")) {
    try {
      return JSON.parse(raw) || {};
    } catch {
      return {};
    }
  }
  return Object.fromEntries(new URLSearchParams(raw));
}

function redirect(res, to, cookie) {
  res.statusCode = 303;
  if (cookie) res.setHeader("Set-Cookie", cookie);
  res.setHeader("Location", to);
  res.setHeader("Cache-Control", "no-store");
  res.end();
}

const cookie = (value, maxAge) => `${COOKIE}=${value}; Path=/api; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "POST");
    return res.end();
  }
  const form = parse(await readBody(req).catch(() => ""), req.headers?.["content-type"]);
  if (form.action === "logout") return redirect(res, "/inbox.html", cookie("", 0));
  if (!passwordOk(form.password)) return redirect(res, "/inbox.html?error=1");
  return redirect(res, "/inbox.html", cookie(newSession(), SESSION_SECONDS));
}
