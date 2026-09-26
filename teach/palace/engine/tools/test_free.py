"""Smoke-test free-walk mode: F, walk forward/jog, turn, F to return. Screenshots to .shots/free/."""
import os
import sys

from playwright.sync_api import sync_playwright

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.shots', 'free')
os.makedirs(OUT, exist_ok=True)
t = sys.argv[1] if len(sys.argv) > 1 else '480'
with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist'])
    pg = b.new_page(viewport={'width': 1600, 'height': 900})
    logs = []
    pg.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
    pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type == 'error' else None)
    pg.goto(f'http://127.0.0.1:8766/sellars-epm/index.html?mute=1&t={t}')
    pg.wait_for_function('window.__walk && window.__walk.ready', timeout=600000)
    pg.evaluate("document.getElementById('overlay')?.remove()")
    pg.wait_for_timeout(1500)
    pg.screenshot(path=f'{OUT}/0_trail.png')
    pg.keyboard.press('f')
    pg.keyboard.down('Shift'); pg.keyboard.down('w'); pg.wait_for_timeout(6000); pg.keyboard.up('w'); pg.keyboard.up('Shift')
    pg.wait_for_timeout(800)
    pg.screenshot(path=f'{OUT}/1_jogged.png')
    pg.mouse.move(800, 450); pg.mouse.move(500, 450)  # (no pointer lock headless: yaw unchanged)
    pg.keyboard.down('d'); pg.wait_for_timeout(3000); pg.keyboard.up('d')
    pg.screenshot(path=f'{OUT}/2_strafed.png')
    pg.keyboard.press('f'); pg.wait_for_timeout(3500)
    pg.screenshot(path=f'{OUT}/3_returned.png')
    print('\n'.join(logs) or 'no errors')
    b.close()
