#!/usr/bin/env python3
"""Local capture server for the furniture DPP assessment."""

from __future__ import annotations

import json
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
DATA = ROOT / "submissions.jsonl"
PORT = 8787


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def log_message(self, fmt, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/submissions":
            rows = []
            if DATA.exists():
                for line in DATA.read_text(encoding="utf-8").splitlines():
                    if line.strip():
                        rows.append(json.loads(line))
            return self._json({"ok": True, "count": len(rows), "submissions": rows})
        if path == "/api/health":
            return self._json({"ok": True})
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
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
    httpd = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Assessment running at http://127.0.0.1:{PORT}/")
    print(f"Inbox: http://127.0.0.1:{PORT}/inbox.html")
    httpd.serve_forever()
