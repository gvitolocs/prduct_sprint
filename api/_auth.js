import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// The inbox lock shared by the API routes (the leading underscore keeps this file from becoming a route).
// Reading the inbox needs the password in INBOX_PASSWORD, or the session cookie /api/session sets after a
// correct password. Without INBOX_PASSWORD everything stays locked. Sessions are stateless: an expiry time
// signed with a key derived from the password, so changing the password ends every session.

export const COOKIE = "prduct_inbox";
export const SESSION_SECONDS = 12 * 3600;

const digest = (v) => createHash("sha256").update(String(v)).digest();
const secret = () => process.env.INBOX_PASSWORD || "";

export function passwordOk(given) {
  const s = secret();
  return Boolean(s) && timingSafeEqual(digest(given ?? ""), digest(s));
}

function sign(exp) {
  return createHmac("sha256", digest(`prduct-inbox-session:${secret()}`)).update(String(exp)).digest("base64url");
}

export function newSession(now = Date.now()) {
  const exp = Math.floor(now / 1000) + SESSION_SECONDS;
  return `${exp}.${sign(exp)}`;
}

export function sessionOk(token, now = Date.now()) {
  if (!secret() || !token) return false;
  const [exp, mac] = String(token).split(".");
  if (!/^\d+$/.test(exp || "") || !mac) return false;
  if (Number(exp) * 1000 < now) return false;
  return timingSafeEqual(digest(mac), digest(sign(exp)));
}

export function cookieValue(req, name = COOKIE) {
  for (const part of String(req.headers?.cookie || "").split(";")) {
    const [key, ...rest] = part.trim().split("=");
    if (key === name) return decodeURIComponent(rest.join("="));
  }
  return "";
}

/** May this request read the inbox? The session cookie (the inbox page) or the password as a bearer token (scripts). */
export function authorized(req) {
  const bearer = String(req.headers?.authorization || "").replace(/^Bearer\s+/i, "");
  return sessionOk(cookieValue(req)) || (bearer !== "" && passwordOk(bearer));
}
