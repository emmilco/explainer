"""Print camera pose vs. ground at given times: x y z ground pathY offset s."""
import sys
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--use-angle=metal"])
    pg = b.new_page(viewport={"width": 400, "height": 300})
    pg.goto("http://127.0.0.1:8765/index.html?q=low")
    pg.wait_for_function("window.__palace && window.__palace.ready", timeout=300000)
    for t in sys.argv[1].split(","):
        print(t, pg.evaluate(f"__palace.pose({t})"))
    b.close()
