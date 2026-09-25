"""Screenshot a walk page at chosen narration times.

Usage: shoot_walk.py <walk-dir-name> <t1,t2,...> [outdir-name]
Expects the server at http://127.0.0.1:8766/ rooted at teach/palace/. Output: engine/.shots/<outdir>/.
"""
import os
import sys
import time

from playwright.sync_api import sync_playwright

walk, times = sys.argv[1], [float(v) for v in sys.argv[2].split(',')]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.shots', sys.argv[3] if len(sys.argv) > 3 else 'walk')
os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))
with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1600, 'height': 900})
    logs = []
    pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}'))
    pg.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
    t0 = time.time()
    pg.goto(f'http://127.0.0.1:8766/{walk}/index.html?mute=1&t={times[0]}')
    try:
        pg.wait_for_function('window.__walk && window.__walk.ready', timeout=600000)
    except Exception as e:
        print('not ready', e)
        print('\n'.join(logs[-40:]))
        sys.exit(1)
    print(f'ready in {time.time() - t0:.1f}s')
    pg.evaluate("document.getElementById('overlay')?.remove()")
    for i, t in enumerate(times):
        pg.evaluate(f'__walk.seek({t})')
        pg.wait_for_timeout(2500)
        pg.screenshot(path=f'{OUT}/shot_{i:02d}_t{int(t)}.png')
    fps = pg.evaluate("""() => new Promise(r => { let n = 0; const s = performance.now(); const f = () => { n++; if (performance.now() - s < 3000) requestAnimationFrame(f); else r(n / 3); }; requestAnimationFrame(f); })""")
    print(f'fps ~{fps:.1f}')
    print('\n'.join(l for l in logs if 'tree ' not in l and 'cloneUniforms' not in l)[-3000:])
    b.close()
