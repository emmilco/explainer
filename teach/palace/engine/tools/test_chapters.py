"""Smoke-test chapter navigation: open the list, click a chapter, step with ] and [; report times."""
import os

from playwright.sync_api import sync_playwright

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '.shots', 'chapters')
os.makedirs(OUT, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'])
    pg = b.new_page(viewport={'width': 1600, 'height': 900})
    logs = []
    pg.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
    pg.goto('http://127.0.0.1:8766/sellars-epm/index.html?mute=1')
    pg.wait_for_function('window.__walk && window.__walk.ready', timeout=600000)
    clock = lambda: pg.inner_text('#hud')
    pg.click('#overlay button')          # start real (muted) playback, as a user would
    pg.wait_for_timeout(4000)
    print('playing from start:', clock())
    pg.keyboard.press('c'); pg.wait_for_timeout(500)
    pg.screenshot(path=f'{OUT}/0_list.png')
    pg.click('#chapters div:nth-child(8)'); pg.wait_for_timeout(4000)
    print('after clicking chapter 8:', clock())
    pg.screenshot(path=f'{OUT}/1_chapter8.png')
    pg.keyboard.press(']'); pg.wait_for_timeout(4000); print('after ]:', clock())
    pg.keyboard.press('['); pg.wait_for_timeout(4000); print('after [:', clock())
    pg.keyboard.press('['); pg.wait_for_timeout(4000); print('after [ again:', clock())
    pg.wait_for_timeout(6000); print('6 s later (should have advanced ~6 s, not reset):', clock())
    pg.keyboard.press('ArrowRight'); pg.wait_for_timeout(3000); print('after → 15 s:', clock())
    print('\n'.join(logs) or 'no errors')
    b.close()
