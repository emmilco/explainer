# PROJECT_INDEX — explainer (working name)

A conversation-native tool for turning an agent-authored explanation into a
narrated slideshow: visuals render instantly in the browser, per-segment audio
plays in sync. The chat stays the primary, live surface; each rendered deck is a
durable artifact that lands in a personal library.

## Status

Prototype. Stage A (synced-slideshow loop, macOS `say` voice) proven. Stage B
(production Fish S2 Pro voice via `../philosophy-tts`) is wired and import-
verified but not yet run or latency-measured — needs exclusive GPU access.

## Structure

| Path | Purpose |
|------|---------|
| `render.py` | Parses a deck markdown file, synthesizes per-slide narration, emits a self-contained reveal.js slideshow. `--tts say` (default) or `--tts fish`; Fish voice via `--fish-voice irons\|fiennes` (default **irons**). Audio cache is keyed by voice. |
| `tts_fish.py` | Fish S2 Pro narration worker. Runs under the philosophy-tts venv; reuses that project's production render path. Named voice refs (`irons` default, `fiennes`). Invoked by `render.py`, not directly. |
| `decks/` | Source decks in the authoring format (`<name>.md`). |
| `out/<name>/` | Rendered output: `index.html` + content-hashed `audio/seg_<hash>.mp3`. |
| `catalog/server.py` | FastAPI catalog app (lab-server `[apps.explainers]`, port 7250). Lists every rendered explainer by title, length, and creation date; mounts `out/` at `/view` so titles link to the live deck. Length is summed only over `index.html`'s referenced audio, so it reflects the current render and never double-counts cached say/fish audio. Reachable at `https://explainers.emmilco.com` when `./lab` runs. |
| `tools/` | Headless self-review utilities (run under a playwright-equipped python, e.g. `../ft-briefing/.venv-acquire/bin/python`). `shoot.py <deck> [slide...]` screenshots slides to `/tmp/shots/<deck>/`; `audit_overflow.py <deck>` reports per-slide horizontal/vertical overflow so layout bugs are located by measurement, not eyeballing. |
| `.claude/` | Project harness config. `hooks/bash-guard.sh` is a `PreToolUse` Bash guard (wired in `settings.local.json`) that flags `rm` commands for manual approval and auto-approves other bash. |

## Deck authoring format

- First `# Title` line sets the document title.
- Slides are separated by a line containing only `---`.
- Within a slide, `::: narration ... :::` is the spoken track; everything else
  is the shown visual.

### Division of labour (load-bearing)

Narration and slide must NOT say the same thing — spoken prose and on-screen
prose compete for the same channel and clash (the redundancy effect). So:

- **Narration** carries the exposition: the sentences, the reasoning, the
  story. It stands alone — a listener with the screen off gets the full
  argument, and it never says "as you can see".
- **The slide** carries only what you *look at*, not *read as prose*: a formula,
  a code block, a diagram, a short list of concept **labels**, the one number
  that matters. It is a visual skeleton, never a summary of the narration.
  A terse label list ("sorted · halve · recurse") is good; a full sentence
  ("Too big? Discard the right half.") is the thing that clashes.

Supported visual elements: markdown label lists, `$inline$` / `$$display$$`
math (KaTeX), fenced ` ```python ` (etc.) code, fenced ` ```mermaid `
diagrams, and custom SVG using the shared **visual vocabulary** (below).

**Math gotcha:** the markdown pass (marked.js) strips the backslash from
markdown-escapable punctuation — so `\%`, `\&`, `\_`, `\#` etc. inside `$…$`
reach KaTeX as bare `%`/`&`/… and break it (a bare `%` starts a KaTeX comment).
Avoid those chars in math; write prose as prose, not `\text{}`-stuffed display
math. Prefer a `.viz` chart over prose-in-math anyway.

### Visual vocabulary (the diagram + motion design system)

Custom diagrams are authored as plain SVG wrapped in `<div class="viz">` and
draw on a shared class system defined once in `render.py`'s template — no
per-slide `<style>` blocks. `decks/visual-vocabulary.md` is the live reference
deck; copy its patterns. The system:

- **container** — `.viz` (centres, contains; `.wide` / `.narrow` to size).
- **nodes** — `.node` + role `accent`/`good`/`warn`/`danger`/`plum`/`muted`.
- **edges** — `.edge` + `accent`/`good`/`strong`/`warn`/`plum`/`danger`/`ghost`;
  arrowheads via a per-SVG `<marker>` (unique id per slide to avoid collisions).
- **labels** — `.lbl` (+ `on-fill`/`mono`/`sm`/`left`), `.cap` (+ `left`), `.tag`;
  `.olbl` hangs a label *beside* a node too small to hold its text.
- **code** — `.code` is left-aligned monospace for a snippet / JSON / annotation
  inside a diagram. (Per-element text overrides must use inline `style=`, not the
  SVG presentation attribute — a class's CSS beats the attribute.)
- **datastore** — `.store` (+ role) draws a database / log cylinder: a body
  `<path>` + a top `<ellipse>`, both `class="store"`.
- **bars** — `.track` + `.bar` (role) + `.axis`.
- **grid/matrix** — `.cell` + `on`/`off`/`hot`/`sel`.
- **token** — `.token` (role) flowed along a path with eased `animateMotion`
  (`calcMode="spline"` + `keySplines`), not linear.
- **failure** — `.x-mark` (two crossed strokes over a node) paired with `m-dim`
  is the "a node dies" gesture.
- **motion primitives** — `m-in` / `m-rise` (staggerable via `style="--i:N"`),
  `m-pulse`, `m-dim` (`--d` delay), `m-draw` (`--len` path length), `m-beat`.
  All share two eased curves (`--ease-out`, `--ease-io`); honours
  `prefers-reduced-motion`.

Layout is a 16:9 (1280×720) canvas, top-aligned (`center:false`), scaled to the
window; tables/code/math/`.viz` are hard-capped to the slide width so nothing
overflows the right edge.

## Conventions

- Deck files: kebab-case, e.g. `binary-search.md`.
- Build: `python3 render.py decks/<name>.md [--tts fish]` then open
  `out/<name>/index.html`. `--tts fish` needs exclusive GPU access.
