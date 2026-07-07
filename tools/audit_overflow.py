#!/usr/bin/env python3
"""Measure per-slide layout overflow in a rendered deck, headless.

For each slide, reports horizontal overflow (content wider than the slide box)
and vertical overflow (content taller than the 720px canvas, i.e. bottom clip),
plus which child element is the worst offender. Use to locate layout bugs
precisely instead of eyeballing screenshots.

    <pw-python> tools/audit_overflow.py <deck-name>
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
deck = sys.argv[1]
html = (ROOT / "out" / deck / "index.html").resolve()

PROBE = r"""
() => {
  const sec = document.querySelector('.reveal .slides > section.present');
  if (!sec) return null;
  const sb = sec.getBoundingClientRect();
  let hOver = 0, vOver = 0, hEl = '', vEl = '';
  // section's own overflow vs the 1280x720 canvas
  for (const el of sec.querySelectorAll('*')) {
    // KaTeX internals produce phantom widths (hidden a11y MathML; glyph SVGs that
    // measure in raw path units). The .katex-display container is overflow-x:auto,
    // so measuring the container itself is sufficient — skip all its descendants.
    if (el.matches('.katex *, .katex')) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    const ro = r.right - sb.right;        // px past right edge of slide box
    const bo = r.bottom - 720;            // px past bottom of canvas
    const tag = el.tagName.toLowerCase() + (el.className && typeof el.className==='string' ? '.'+el.className.trim().split(/\s+/).join('.') : '');
    if (ro > hOver + 0.5) { hOver = ro; hEl = tag; }
    if (bo > vOver + 0.5) { vOver = bo; vEl = tag; }
  }
  return { hOver: Math.round(hOver), vOver: Math.round(vOver), hEl, vEl,
           secBottom: Math.round(sb.bottom) };
}
"""

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 1280, "height": 720}, device_scale_factor=1)
    pg.goto(f"file://{html}")
    pg.add_style_tag(content="#start{display:none!important}")
    pg.wait_for_timeout(2000)
    n = pg.evaluate("document.querySelectorAll('.reveal .slides > section').length")
    flagged = []
    for i in range(n):
        pg.evaluate(f"location.hash = '#/{i}'")
        pg.wait_for_timeout(450)
        r = pg.evaluate(PROBE)
        if not r:
            continue
        if r["hOver"] > 4 or r["vOver"] > 4:
            flagged.append((i, r))
            print(f"slide {i:2d}  H+{r['hOver']:>4} ({r['hEl'][:46]})  "
                  f"V+{r['vOver']:>4} ({r['vEl'][:46]})")
    b.close()
    print(f"\n{len(flagged)} / {n} slides overflow (>4px).")
