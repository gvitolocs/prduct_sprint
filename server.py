#!/usr/bin/env python3
"""Local capture server for the furniture DPP assessment."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import re
import time
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "submissions.jsonl"
# Same lock as api/inbox.js: reading the inbox needs this password (env INBOX_PASSWORD, else this file).
PASSWORD_FILE = Path.home() / ".config" / "prduct-site" / "inbox-password"
PORT = 8787


COOKIE = "prduct_inbox"
SESSION_SECONDS = 12 * 3600


def inbox_password() -> str:
    pw = os.environ.get("INBOX_PASSWORD", "")
    if not pw and PASSWORD_FILE.exists():
        pw = PASSWORD_FILE.read_text(encoding="utf-8").strip()
    return pw


def _sign(exp: int, pw: str) -> str:
    key = hashlib.sha256(f"prduct-inbox-session:{pw}".encode("utf-8")).digest()
    mac = hmac.new(key, str(exp).encode("utf-8"), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(mac).rstrip(b"=").decode("ascii")


def new_session(pw: str) -> str:
    exp = int(time.time()) + SESSION_SECONDS
    return f"{exp}.{_sign(exp, pw)}"


def session_ok(token: str, pw: str) -> bool:
    """Same stateless session as api/_auth.js: an expiry signed with a key derived from the password."""
    exp, _, mac = (token or "").partition(".")
    if not pw or not exp.isdigit() or not mac or int(exp) < time.time():
        return False
    return hmac.compare_digest(mac.encode("ascii", "replace"), _sign(int(exp), pw).encode("ascii"))


class Handler(SimpleHTTPRequestHandler):
    extensions_map = {
        **SimpleHTTPRequestHandler.extensions_map,
        ".avif": "image/avif",
        ".webp": "image/webp",
        ".mp4": "video/mp4",
        ".js": "text/javascript",
        ".json": "application/json",
    }
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))

    def end_headers(self):
        # Journey media is content-addressed by build: cache hard. Everything else stays live.
        if urlparse(self.path).path.startswith("/journey/media/"):
            self.send_header("Cache-Control", "public, max-age=31536000, immutable")
        else:
            self.send_header("Cache-Control", "no-store")
        self.send_header("Accept-Ranges", "bytes")
        super().end_headers()

    def send_head(self):
        """Serve byte ranges so browsers can stream and seek video (plain http.server cannot)."""
        rng = self.headers.get("Range")
        path = self.translate_path(self.path)
        if not rng or not os.path.isfile(path):
            return super().send_head()
        m = re.match(r"bytes=(\d*)-(\d*)$", rng.strip())
        size = os.path.getsize(path)
        if not m or (not m.group(1) and not m.group(2)):
            self.send_error(416)
            return None
        if m.group(1):
            start = int(m.group(1))
            end = int(m.group(2)) if m.group(2) else size - 1
        else:
            start, end = max(0, size - int(m.group(2))), size - 1
        end = min(end, size - 1)
        if start > end:
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.end_headers()
            return None
        f = open(path, "rb")
        f.seek(start)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        self._range_left = end - start + 1
        return f

    def copyfile(self, source, outputfile):
        left = getattr(self, "_range_left", None)
        if left is None:
            return super().copyfile(source, outputfile)
        self._range_left = None
        while left > 0:
            chunk = source.read(min(65536, left))
            if not chunk:
                break
            outputfile.write(chunk)
            left -= len(chunk)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/submissions":
            if not self._authorized():
                return self._json({"ok": False, "error": "password required"}, 401)
            rows = []
            if DATA.exists():
                for line in DATA.read_text(encoding="utf-8").splitlines():
                    if line.strip():
                        rows.append(json.loads(line))
            return self._json({"ok": True, "count": len(rows), "submissions": rows})
        if path == "/api/health":
            return self._json({"ok": True})
        return super().do_GET()

    def _cookie(self, name: str) -> str:
        for part in (self.headers.get("Cookie") or "").split(";"):
            key, _, value = part.strip().partition("=")
            if key == name:
                return value
        return ""

    def _authorized(self) -> bool:
        secret = inbox_password()
        given = re.sub(r"^Bearer\s+", "", self.headers.get("Authorization") or "", flags=re.I)
        bearer_ok = bool(secret) and given != "" and hmac.compare_digest(given.encode("utf-8"), secret.encode("utf-8"))
        return bearer_ok or session_ok(self._cookie(COOKIE), secret)

    def _session(self):
        """Inbox login / logout for the inbox page's plain form (see api/session.js)."""
        length = int(self.headers.get("Content-Length") or 0)
        raw = self.rfile.read(min(length, 4096)).decode("utf-8", "replace")
        form = {k: v[0] for k, v in parse_qs(raw).items()}
        secure = "; Secure" if self.headers.get("X-Forwarded-Proto") == "https" else ""
        cookie = None
        target = "/inbox.html"
        if form.get("action") == "logout":
            cookie = f"{COOKIE}=; Path=/api; HttpOnly; SameSite=Strict; Max-Age=0{secure}"
        else:
            secret = inbox_password()
            given = form.get("password", "")
            if secret and hmac.compare_digest(given.encode("utf-8"), secret.encode("utf-8")):
                cookie = f"{COOKIE}={new_session(secret)}; Path=/api; HttpOnly; SameSite=Strict; Max-Age={SESSION_SECONDS}{secure}"
            else:
                target = "/inbox.html?error=1"
        self.send_response(303)
        if cookie:
            self.send_header("Set-Cookie", cookie)
        self.send_header("Location", target)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_POST(self):
        path = urlparse(self.path).path
        if path == "/api/session":
            return self._session()
        if path != "/api/submit":
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length") or 0)
        if length > 200_000:
            self.send_error(413)
            return
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw.decode("utf-8"))
        except Exception:
            self.send_error(400, "invalid json")
            return
        if not isinstance(payload, dict):
            self.send_error(400, "expected object")
            return
        lead = payload.get("lead") or {}
        email = str(lead.get("email") or "").strip()
        company = str(lead.get("company") or "").strip()
        if "@" not in email or not company:
            return self._json({"ok": False, "error": "email and company required"}, 400)
        record = {
            "id": datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ"),
            "receivedAt": datetime.now(timezone.utc).isoformat(),
            "lead": {
                "firstName": str(lead.get("firstName") or "").strip()[:80],
                "lastName": str(lead.get("lastName") or "").strip()[:80],
                "email": email[:120],
                "company": company[:120],
                "role": str(lead.get("role") or "").strip()[:80],
            },
            "answers": payload.get("answers") or {},
            "scores": payload.get("scores") or {},
            "personality": payload.get("personality") or {},
            "source": "spin-in-furniture-dpp",
        }
        DATA.parent.mkdir(parents=True, exist_ok=True)
        with DATA.open("a", encoding="utf-8") as f:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")
        return self._json({"ok": True, "id": record["id"]})

    def _json(self, obj, status=200):
        body = json.dumps(obj, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", PORT))
    # The journey page opens many parallel requests (modules, fonts, stills, videos); socketserver's default
    # listen backlog of 5 drops the overflow as empty responses, and a dropped module stops the app booting.
    ThreadingHTTPServer.request_queue_size = 128
    ThreadingHTTPServer.daemon_threads = True
    httpd = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print(f"Assessment running at http://127.0.0.1:{port}/")
    print(f"Inbox: http://127.0.0.1:{port}/inbox.html")
    httpd.serve_forever()
