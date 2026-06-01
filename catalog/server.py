#!/usr/bin/env python3
"""Explainer catalog — a lab-server app listing every rendered explainer.

Scans ../out for rendered decks and presents them by title, length, and
creation date. Each entry links to the live explainer (the out/ dirs are
mounted as static), so the catalog doubles as a launcher, including from a
phone via lab-server.

Length is summed only over the audio files actually referenced by a deck's
index.html, so it reflects the current render and never double-counts the
cached say/fish audio that coexists in a deck's audio/ directory.

Run (lab-server registers this): uvicorn server:app --host 127.0.0.1 --port 7250
"""
from __future__ import annotations

import re
import subprocess
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "out"
DECKS_DIR = ROOT / "decks"

AUDIO_REF_RE = re.compile(r'data-audio="([^"]+)"')
TITLE_MD_RE = re.compile(r"(?m)^#\s+(.+?)\s*$")
TITLE_HTML_RE = re.compile(r"<title>(.*?)</title>", re.S)

app = FastAPI(title="Explainer Catalog")

# Cache total length per deck, keyed on index.html mtime so a re-render
# invalidates it. {stem: (index_mtime, total_seconds)}.
_length_cache: dict[str, tuple[float, float]] = {}


def _deck_title(stem: str, index_html: str) -> str:
    md = DECKS_DIR / f"{stem}.md"
    if md.exists():
        m = TITLE_MD_RE.search(md.read_text())
        if m:
            return m.group(1)
    m = TITLE_HTML_RE.search(index_html)
    if m and m.group(1).strip():
        return m.group(1).strip()
    return stem


def _audio_seconds(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "csv=p=0", str(path)],
        capture_output=True, text=True,
    ).stdout.strip()
    try:
        return float(out)
    except ValueError:
        return 0.0


def _total_length(stem: str, base: Path, index_html: str) -> float:
    index_path = base / "index.html"
    mtime = index_path.stat().st_mtime
    cached = _length_cache.get(stem)
    if cached and cached[0] == mtime:
        return cached[1]
    total = sum(_audio_seconds(base / rel) for rel in AUDIO_REF_RE.findall(index_html))
    _length_cache[stem] = (mtime, total)
    return total


def _created(base: Path) -> datetime:
    st = base.stat()
    ts = getattr(st, "st_birthtime", None) or st.st_mtime
    return datetime.fromtimestamp(ts)


def _scan() -> list[dict]:
    entries = []
    if not OUT_DIR.exists():
        return entries
    for base in sorted(OUT_DIR.iterdir()):
        index_path = base / "index.html"
        if not index_path.is_dir() and index_path.exists():
            html = index_path.read_text()
            n_slides = html.count("<section")
            entries.append({
                "stem": base.name,
                "title": _deck_title(base.name, html),
                "seconds": _total_length(base.name, base, html),
                "created": _created(base),
                "slides": n_slides,
            })
    entries.sort(key=lambda e: e["created"], reverse=True)
    return entries


def _fmt_len(seconds: float) -> str:
    if seconds <= 0:
        return "—"
    m, s = divmod(round(seconds), 60)
    return f"{m}:{s:02d}"


def _render_page(entries: list[dict]) -> str:
    rows = []
    for e in entries:
        rows.append(f"""
        <a class="row" href="/view/{e['stem']}/">
          <div class="t">{e['title']}</div>
          <div class="meta">
            <span class="len">{_fmt_len(e['seconds'])}</span>
            <span class="dot">·</span>
            <span class="sl">{e['slides']} slides</span>
            <span class="dot">·</span>
            <span class="date">{e['created'].strftime('%b %-d, %Y')}</span>
          </div>
        </a>""")
    body = "\n".join(rows) if rows else '<div class="empty">No explainers rendered yet.</div>'
    count = len(entries)
    return PAGE.replace("{{ROWS}}", body).replace("{{COUNT}}", str(count))


@app.get("/", response_class=HTMLResponse)
def index() -> str:
    return _render_page(_scan())


# Serve the rendered explainers themselves. html=True makes /view/<stem>/
# resolve to that deck's index.html, and relative audio/ paths work under it.
if OUT_DIR.exists():
    app.mount("/view", StaticFiles(directory=str(OUT_DIR), html=True), name="view")


PAGE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Explainers</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600&family=Source+Sans+3:wght@400;500;600&display=swap">
<style>
  :root{
    --paper:#FFF1E5; --paper-deep:#F6E5D2; --ink:#262A33; --muted:#7A736C;
    --rule:#E0CFB8; --rule-strong:#B9A78A; --info:#1A3F70; --accent:#9D3A24;
    --serif:'Source Serif 4',Georgia,serif; --sans:'Source Sans 3',system-ui,sans-serif;
  }
  *{box-sizing:border-box}
  html,body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans)}
  .wrap{max-width:760px;margin:0 auto;padding:48px 24px 80px}
  header{border-bottom:1px solid var(--ink);padding-bottom:16px;margin-bottom:8px}
  h1{font-family:var(--serif);font-weight:600;font-size:2.1rem;margin:0;letter-spacing:-0.01em}
  .sub{color:var(--muted);font-size:.92rem;margin-top:6px}
  .row{display:flex;flex-direction:column;gap:6px;padding:20px 8px;
    border-bottom:1px solid var(--rule);text-decoration:none;color:inherit;transition:background .12s}
  .row:hover{background:var(--paper-deep)}
  .t{font-family:var(--serif);font-size:1.32rem;font-weight:600;color:var(--ink);line-height:1.2}
  .row:hover .t{color:var(--accent)}
  .meta{font-size:.86rem;color:var(--muted);display:flex;gap:10px;align-items:center}
  .len{font-variant-numeric:tabular-nums;color:var(--info);font-weight:600}
  .dot{color:var(--rule-strong)}
  .empty{padding:40px 8px;color:var(--muted);font-style:italic}
  footer{margin-top:28px;color:var(--muted);font-size:.8rem;letter-spacing:.03em}
</style>
</head>
<body>
<div class="wrap">
  <header>
    <h1>Explainers</h1>
    <div class="sub">{{COUNT}} narrated decks · newest first</div>
  </header>
  {{ROWS}}
  <footer>served by lab-server · tap a title to play</footer>
</div>
</body>
</html>
"""
