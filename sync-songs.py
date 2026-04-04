#!/usr/bin/env python3
"""POST to production /api/sync-songs (same as curl). Run from repo root."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

SYNC_URL = "https://my-choir-app.vercel.app/api/sync-songs"


def _load_dotenv(path: Path) -> None:
    if not path.is_file():
        return
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, val = line.partition("=")
        key, val = key.strip(), val.strip().strip('"').strip("'")
        if key and key not in os.environ:
            os.environ[key] = val


def main() -> int:
    repo_root = Path(__file__).resolve().parent
    _load_dotenv(repo_root / ".env.local")
    _load_dotenv(repo_root / ".env")

    cron_secret = os.environ.get("CRON_SECRET", "").strip()
    req = urllib.request.Request(SYNC_URL, method="POST", data=b"")
    if cron_secret:
        req.add_header("Authorization", f"Bearer {cron_secret}")

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            print(body)
            if resp.status != 200:
                return 1
            try:
                data = json.loads(body)
            except json.JSONDecodeError:
                return 0
            if not data.get("ok", True):
                return 1
            return 0
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        print(f"HTTP {e.code}: {err_body}", file=sys.stderr)
        return 1
    except urllib.error.URLError as e:
        print(str(e.reason), file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
