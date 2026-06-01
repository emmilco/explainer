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
math (KaTeX), fenced ` ```python ` (etc.) code, and fenced ` ```mermaid `
diagrams.

## Conventions

- Deck files: kebab-case, e.g. `binary-search.md`.
- Build: `python3 render.py decks/<name>.md [--tts fish]` then open
  `out/<name>/index.html`. `--tts fish` needs exclusive GPU access.
