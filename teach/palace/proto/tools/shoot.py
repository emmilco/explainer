"""Screenshot the palace prototype at chosen walk times.

Usage (needs a python with playwright, and the prototype served on :8765):
  <pw-python> tools/shoot.py [query] [t1,t2,...]
With no times, shoots the approach to / hold at each stop. Output: .shots/ (gitignored).
"""
import json
import os
import sys
import time

from playwright.sync_api import sync_playwright

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".shots")
QS = sys.argv[1] if len(sys.argv) > 1 else ""
times = [float(x) for x in sys.argv[2].split(",")] if len(sys.argv) > 2 else None
os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))

with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--use-angle=metal", "--enable-gpu", "--ignore-gpu-blocklist"])
    pg = b.new_page(viewport={"width": 1600, "height": 900})
    logs = []
    pg.on("console", lambda m: logs.append(f"{m.type}: {m.text}"))
    pg.on("pageerror", lambda e: logs.append(f"PAGEERROR: {e}"))
    t0 = time.time()
    pg.goto(f"http://127.0.0.1:8765/index.html{QS}")
    try:
        pg.wait_for_function("window.__palace && window.__palace.ready", timeout=300000)
    except Exception as e:
        print("not ready:", e)
        print("\n".join(logs))
        sys.exit(1)
    print(f"ready in {time.time() - t0:.1f}s")
    info = pg.evaluate("({d: __palace.duration, stops: __palace.stops})")
    print(json.dumps(info))
    pg.evaluate("document.getElementById('overlay').remove()")
    if not times:
        st = info["stops"]
        times = [5] + [x for s in st for x in (s - 14, s + 3)]
    for i, t in enumerate(times):
        pg.evaluate(f"__palace.seek({t})")
        pg.wait_for_timeout(500)
        pg.screenshot(path=f"{OUT}/shot_{i:02d}_{int(t)}s.png")
    fps = pg.evaluate("""() => new Promise(r => { let n = 0; const s = performance.now();
        const f = () => { __palace.seek(60 + n * 0.02); n++; if (performance.now() - s < 3000) requestAnimationFrame(f); else r(n / 3); };
        requestAnimationFrame(f); })""")
    print(f"headless fps ~{fps:.1f}")
    print("\n".join(logs[-25:]))
    b.close()
