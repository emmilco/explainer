# PROJECT_INDEX — explainer

A conversation-native tool for turning an agent-authored explanation into a
narrated slideshow: visuals render instantly in the browser, per-segment audio
plays in sync. The chat stays the primary, live surface; each rendered deck is a
durable artifact that lands in a personal library.

## Status

In production use. Fourteen decks rendered across philosophy, CS, math, ML, and
healthcare IT (see `decks/`), including a four-deck series covering chapters
4–7 of Raschka, *Build a Large Language Model (From Scratch)*
(`gpt-architecture`, `llm-pretraining`, `llm-classification-finetuning`,
`llm-instruction-finetuning`). The pipeline has two stages: macOS `say` for fast
CPU drafts, and a GPU backend for production audio — **Higgs Audio v3 / Irons**
is the production default (tracking the philosophy-tts standard), with **Fish
S2 Pro / Irons** retained as a documented fallback; select via `--tts
higgs|fish`. The catalog is a live lab-server app; the visual vocabulary and the
screenshot self-review harness are in everyday use. Per global CLAUDE.md §9.3,
all GPU rendering is submitted to the gpu-broker — see **Production rendering**
below.

## Structure

| Path | Purpose |
|------|---------|
| `render.py` | Parses a deck markdown file, synthesizes per-slide narration, emits a self-contained reveal.js slideshow. `--tts say` (default draft) · `--tts higgs` (production default) · `--tts fish` (fallback); GPU voice via `--gpu-voice irons\|fiennes` (default **irons**; `--fish-voice` kept as an alias). Audio cache is keyed by `tts:voice`, so backends never collide. Each render stamps `<meta name="explainer-tts">` into the HTML; re-rendering a production (higgs/fish) deck under a different backend/voice is **refused** unless `--switch-tts` is passed — upgrading from a `say` draft is always allowed. |
| `tts_higgs.py` | **Higgs Audio v3** narration worker (production default). Runs under philosophy-tts's `.venv-higgs`; reuses that project's `render_book_higgs` render path (sentence/clause split + `CachedHiggsRenderer` with prefix KV-cache reuse + fade/stitch). Voice names map to Higgs ref-modes (`irons`→`y2` default, `fiennes`, `rorty`). Invoked by `render.py`, not directly. |
| `tts_fish.py` | Fish S2 Pro narration worker (fallback). Runs under the philosophy-tts venv; reuses that project's production render path. Named voice refs (`irons` default, `fiennes`). Invoked by `render.py`, not directly. |
| `decks/` | Source decks in the authoring format (`<name>.md`). |
| `out/<name>/` | Rendered output: `index.html` + content-hashed `audio/seg_<hash>.mp3`. |
| `catalog/server.py` | FastAPI catalog app (lab-server `[apps.explainers]`, binds the Unix socket `~/.lab-sockets/explainers.sock`). Lists every rendered explainer by title, length, and creation date; mounts `out/` at `/view` so titles link to the live deck. Length is summed only over `index.html`'s referenced audio, so it reflects the current render and never double-counts cached say/fish audio. Reachable at `https://explainers.emmilco.com` via the lab auth gateway when `./lab` runs. |
| `tools/` | Self-review + render utilities. `shoot.py <deck> [slide...]` and `audit_overflow.py <deck>` run under a playwright-equipped python (e.g. `../ft-briefing/.venv-acquire/bin/python`): screenshots slides to `/tmp/shots/<deck>/` and reports per-slide horizontal/vertical overflow, so layout bugs are located by measurement, not eyeballing. `render_higgs.sh` / `render_fish.sh decks/<name>.md` are the gpu-broker-conformant render runners (Higgs default, Fish fallback; trap stop signals → exit 42; resumable via the audio cache) — see Production rendering. |
| `teach/` | Learning-loop node for "teach me about X": learner profile, topic graph, session atoms, and a DeepSeek-assisted move search. Design: `teach/DESIGN.md`; session contract: `teach/TEACH.md`. Seed corpus in `teach/seeding/` (local only). |
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
  a code block, a diagram, plus **telegraphic cues**. A terse label list
  ("sorted · halve · recurse") is good; a full sentence ("Too big? Discard the
  right half.") is the thing that clashes.
- **Cue coverage:** every beat the narration makes should have a corresponding
  terse cue on the slide (typically 4–5 cues/slide), so the listener always has
  a visual anchor for what's being said. Under-cueing (2 sparse bullets while
  the narration makes 5 points) loses the listener; the failure mode to avoid
  is prose duplication, not density of cues.

Supported visual elements: markdown label lists, `$inline$` / `$$display$$`
math (KaTeX), fenced ` ```python ` (etc.) code, fenced ` ```mermaid `
diagrams, and custom SVG using the shared **visual vocabulary** (below).

### Slide registers

A slide opts into a register by making its first line a reveal attribute
comment: `<!-- .slide: class="divider" -->`.

- **`divider`** — chapter break: full-bleed navy field, vertically centred,
  salmon serif `##` title; an `###` line above it renders as an uppercase
  kicker (e.g. `### Part III`). Use at each major section boundary of a long
  deck so the structure is visible.
- **`statement`** — a single claim gets the whole screen: one `p`, centred,
  large serif. No heading.
- **`compact`** — density escape hatch when a slide measures too tall
  (`audit_overflow.py`): shrinks text to 26px, tightens list/math spacing, and
  caps diagram height. Prefer trimming cues; use `compact` when the density is
  genuinely needed.

The start overlay doubles as the deck's cover: eyebrow, serif title, slide
count, Start button (click, Enter, or Space). The keyboard-help badge fades to
near-invisible a few seconds after audio first plays; hover restores it.

**Register gotcha:** reveal finds `<!-- .slide: ... -->` by regex on the raw
markdown, so that literal string *anywhere* in a slide's content — even inside
backticks or a code fence — is parsed as slide attributes. When a slide talks
*about* registers, write `.slide:` without the comment markers.

**Math gotcha:** the markdown pass (marked.js) strips the backslash from any
backslash-then-punctuation — so `\%`, `\&`, `\_`, `\#` **and the LaTeX spacing
commands `\,` `\;` `\:` `\!`** inside `$…$` reach KaTeX as bare `%`/`&`/`,`/`;`/…
and break or mis-render (a bare `%` starts a KaTeX comment; `\,` shows as a
literal comma). Use word-spacing commands (`\quad`, `\qquad` — backslash+letter,
which survive) instead of `\,`/`\;`, and avoid escapable punctuation entirely.
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
  `.olbl` hangs a label *beside* a node too small to hold its text. All three
  take the role modifiers `accent`/`good`/`warn`/`danger`/`plum` for semantic
  text color — never write raw hex in a deck.
- **regions** — `.region` (+ role) is a translucent set/area (Venn circles,
  highlighted zones); overlaps blend.
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

## Authoring workflow (run this loop for every deck)

1. **Write** the deck in the format above. Copy visual patterns from
   `decks/visual-vocabulary.md` — it demonstrates every class and register
   live; do not invent new styling or write raw hex.
2. **Draft render** (CPU): `python3 render.py decks/<name>.md`.
3. **Measure**: `<pw-python> tools/audit_overflow.py <name>` must report
   `0 / N slides overflow` before a deck ships. Fix overflow by trimming cues
   first; reach for the `compact` register only when the density is genuinely
   needed.
4. **Look**: `<pw-python> tools/shoot.py <name>` and read the screenshots.
   Measurement catches overflow; only eyes catch a cramped diagram, a label
   escaping its node, or a slide that reads badly.
5. **Production audio**: submit through the gpu-broker (see Production
   rendering). Never launch GPU TTS from a shell.

(`<pw-python>` = any python with playwright, e.g.
`../ft-briefing/.venv-acquire/bin/python`.)

## Conventions

- Deck files: kebab-case, e.g. `binary-search.md`.
- Draft build (CPU, `say`): `python3 render.py decks/<name>.md`, then open
  `out/<name>/index.html`. Iterate freely — the per-slide audio cache makes
  re-renders near-instant, and `say` is genuinely good for math-heavy narration
  (spelled-out symbols articulate cleanly), so a deck can ship in `say`.
- **Frozen decks — never re-render:** `attention-mechanisms`, `binary-search`,
  `linear-algebra-invertibility`, `mesh-networks`,
  `mesh-networks-scale-and-security`, `wittgenstein-pi`. Their renders are kept
  deliberately as evidence of earlier versions of the app; re-rendering
  destroys that record. Style and pipeline changes apply only to the decks
  after them. Enforced mechanically: their renders predate the tts stamp, and
  `render.py` refuses to overwrite an un-stamped render without `--switch-tts`.

## Production rendering (Higgs / Irons — via gpu-broker)

The GPU backends are GPU-intensive, so per global CLAUDE.md §9.3 they are
**never** launched directly (no `python3 render.py … --tts higgs` from a shell).
A render is submitted to the gpu-broker (`../gpu-broker`, a lab-server app
binding `~/.lab-sockets/gpu-broker.sock` — no TCP port) through a conformant runner — `tools/render_higgs.sh` (production default)
or `tools/render_fish.sh` (fallback):

```bash
cd ~/Documents/GitHub/gpu-broker
.venv/bin/python -m gpu_broker.cli submit \
  --name <deck>-higgs-irons --priority high --pausable --max-runtime-s 10800 \
  --tag explainer --cmd "bash tools/render_higgs.sh decks/<deck>.md" \
  --cwd ~/Documents/GitHub/explainer
```

Each runner traps `SIGUSR1`/`SIGTERM` → exit 42 (yield); resumability comes from
render.py's per-slide audio cache (completed segments are skipped on re-run)
with atomic mp3 writes, so a preempted job resumes cleanly. The cache key
includes the backend, so switching a deck between Fish and Higgs re-synthesizes
rather than reusing stale audio. Inspect/cancel with `gpu_broker.cli queue` /
`cancel <id>`, or the dashboard at `gpu-broker.emmilco.com`. On completion the
deck's `index.html` flips to the Irons audio and the catalog length updates on
next load. Confirm the daemon is up before submitting; the say draft needs none
of this.
