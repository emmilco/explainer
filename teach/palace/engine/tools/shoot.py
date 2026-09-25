"""Screenshot an engine page at chosen positions. Usage: shoot.py <page+query> <x1,x2,...> [yaw]
Serves nothing itself: expects a server at http://127.0.0.1:8766/ rooted at teach/palace/.
Output: engine/.shots/ (gitignored)."""
import os, sys, time
from playwright.sync_api import sync_playwright
page, xs = sys.argv[1], [float(v) for v in sys.argv[2].split(',')]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.shots', sys.argv[3] if len(sys.argv) > 3 else '')
os.makedirs(OUT, exist_ok=True)
for f in os.listdir(OUT): os.remove(os.path.join(OUT, f))
with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 1600, 'height': 900})
    logs = []
    pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}'))
    pg.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
    t0 = time.time()
    pg.goto(f'http://127.0.0.1:8766/{page}')
    try:
        pg.wait_for_function('window.__eng && window.__eng.ready', timeout=300000)
    except Exception as e:
        print('not ready', e); print('\n'.join(logs[-30:])); sys.exit(1)
    print(f'ready in {time.time()-t0:.1f}s')
    for i, x in enumerate(xs):
        pg.evaluate(f'__eng.go({x})'); pg.wait_for_timeout(1500)
        pg.screenshot(path=f'{OUT}/shot_{i:02d}_x{int(x)}.png')
    fps = pg.evaluate("""() => new Promise(r => { let n = 0; const s = performance.now(); const f = () => { n++; if (performance.now() - s < 3000) requestAnimationFrame(f); else r(n / 3); }; requestAnimationFrame(f); })""")
    print(f'fps ~{fps:.1f}', pg.evaluate('JSON.stringify(__eng.stats())'))
    print('\n'.join(l for l in logs if 'tree ' not in l)[-3000:])
    b.close()
