#!/usr/bin/env python3
"""Screenshot rendered deck slides with a headless browser, for self-review.

Run under a python that has playwright (e.g. ft-briefing's .venv-acquire):
    <pw-python> tools/shoot.py <deck-name> [slide-index ...]

With no indices, shoots every slide. Output: /tmp/shots/<deck>/NN.png
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
deck = sys.argv[1]
want = [int(x) for x in sys.argv[2:]]
html = (ROOT / "out" / deck / "index.html").resolve()
outdir = Path(f"/tmp/shots/{deck}"); outdir.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1280, "height": 720}, device_scale_factor=1)
    pg.goto(f"file://{html}")
    pg.add_style_tag(content="#start{display:none!important}")
    pg.wait_for_timeout(2000)                     # mermaid + katex render
    n = pg.evaluate("document.querySelectorAll('.reveal .slides > section').length")
    idxs = want or list(range(n))
    for i in idxs:
        pg.evaluate(f"location.hash = '#/{i}'")
        pg.wait_for_timeout(750)                  # transition + a beat of animation
        pg.screenshot(path=str(outdir / f"{i:02d}.png"))
    b.close()
    print(f"{len(idxs)} of {n} slides -> {outdir}")
