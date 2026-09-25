"""Print each vignette's kind and pass time (prototype served on :8765)."""
import json
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch(headless=True, args=["--use-angle=metal"])
    pg = b.new_page(viewport={"width": 400, "height": 300})
    pg.goto("http://127.0.0.1:8765/index.html?q=low")
    pg.wait_for_function("window.__palace && window.__palace.ready", timeout=300000)
    print(json.dumps(pg.evaluate("__palace.vigs")))
    b.close()
