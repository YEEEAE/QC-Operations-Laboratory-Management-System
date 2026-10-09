#!/usr/bin/env python3
"""Minimal Stitch MCP client (direct HTTP JSON-RPC with X-Goog-Api-Key).

Usage:
  python3 scripts/sop/stitch_call.py tools/list '{}'
  python3 scripts/sop/stitch_call.py tools/call '{"name":"list_screens","arguments":{"projectId":"..."}}'

Reads STITCH_API_KEY from the repository .env (not printed).
"""
from __future__ import annotations

import json
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ENV = ROOT / ".env"
URL = "https://stitch.googleapis.com/mcp"


def api_key() -> str:
    for line in ENV.read_text(encoding="utf-8", errors="ignore").splitlines():
        line = line.strip()
        if line.startswith("STITCH_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit("STITCH_API_KEY not found in .env")


def main() -> None:
    method = sys.argv[1]
    params = json.loads(sys.argv[2]) if len(sys.argv) > 2 else {}
    payload = {"jsonrpc": "2.0", "id": 1, "method": method, "params": params}
    req = urllib.request.Request(
        URL,
        data=json.dumps(payload).encode(),
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
            "X-Goog-Api-Key": api_key(),
        },
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=900) as resp:
        raw = resp.read().decode("utf-8", "replace")
    if "data:" in raw:
        raw = raw.split("data:")[-1].strip()
    print(raw)


if __name__ == "__main__":
    main()
