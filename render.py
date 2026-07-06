#!/usr/bin/env python3
"""Build a narrated slideshow from a deck markdown file.

Deck format (the agent-facing authoring contract):

    # Deck Title

    ---
    ## Slide heading
    Visual markdown: bullets, $inline$ / $$display$$ math, ```fenced code```.

    ::: narration
    Self-contained spoken text for this slide. Must make sense with eyes shut;
    must not refer to "this slide" or "as you can see".
    :::

    ---
    ## Next slide
    ...

Slides are separated by a line containing only `---`. Within a slide, the
`::: narration ... :::` block is spoken; everything else is shown. The visual
and the narration are each meant to stand alone.

Usage: python3 render.py decks/<name>.md [--voice <name>]
Output: out/<name>/index.html  (+ out/<name>/audio/)
"""
import hashlib
import json
import re
import sys
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent

NARRATION_RE = re.compile(r"(?ms)^:::\s*narration\s*$(.*?)^:::\s*$")
SLIDE_SEP_RE = re.compile(r"(?m)^---\s*$")
MERMAID_RE = re.compile(r"(?ms)^```mermaid[ \t]*\n(.*?)\n```[ \t]*$")


def _mermaid_divs(md):
    """Turn ```mermaid fences into raw <div class="mermaid"> blocks.

    Emitting the diagram as a raw HTML block keeps it out of the markdown
    code-highlighter path, which otherwise entity-escapes the arrows and
    breaks mermaid parsing. The block must contain no blank lines so the
    markdown pass treats it as a single verbatim HTML block.
    """
    return MERMAID_RE.sub(
        lambda m: '<div class="mermaid">\n' + m.group(1) + "\n</div>", md
    )


def parse_deck(text):
    lines = text.splitlines()
    title = None
    if lines and lines[0].startswith("# "):
        title = lines[0][2:].strip()
        lines = lines[1:]
    chunks = SLIDE_SEP_RE.split("\n".join(lines))
    slides = []
    for chunk in chunks:
        visual, narration = _split_narration(chunk)
        if not visual.strip() and not narration.strip():
            continue
        slides.append({"visual": visual.strip("\n"), "narration": narration.strip()})
    return title, slides


def _split_narration(chunk):
    m = NARRATION_RE.search(chunk)
    if not m:
        return chunk, ""
    narration = m.group(1).strip()
    visual = chunk[: m.start()] + chunk[m.end():]
    return visual, narration


def synth(text, mp3_path, voice=None):
    aiff = mp3_path.with_suffix(".aiff")
    cmd = ["say"]
    if voice:
        cmd += ["-v", voice]
    cmd += ["-o", str(aiff), text]
    subprocess.run(cmd, check=True)
    subprocess.run(
        ["ffmpeg", "-y", "-loglevel", "error", "-i", str(aiff), str(mp3_path)],
        check=True,
    )
    aiff.unlink(missing_ok=True)


# GPU TTS backends borrowed from philosophy-tts, each under its own venv. Higgs
# Audio v3 is philosophy-tts's production default; Fish is the documented
# fallback. A deck picks one via --tts; both workers share the same job protocol
# (a [{"text","out"}, ...] file + a voice name) and atomic-write caching.
FISH_PYTHON = "/Users/elliotmilco/Documents/GitHub/philosophy-tts/.venv/bin/python"
HIGGS_PYTHON = "/Users/elliotmilco/Documents/GitHub/philosophy-tts/.venv-higgs/bin/python"

GPU_TTS = {
    "fish": {"python": FISH_PYTHON, "worker": "tts_fish.py"},
    "higgs": {"python": HIGGS_PYTHON, "worker": "tts_higgs.py"},
}


def run_gpu_tts(tts, jobs, out_dir, voice):
    """Synthesize narration via a GPU TTS worker (fish/higgs) under its venv."""
    backend = GPU_TTS[tts]
    job_file = out_dir / "_tts_jobs.json"
    job_file.write_text(json.dumps(jobs))
    print(f"  {tts} ({voice}): synthesizing {len(jobs)} segment(s) — loading model...", flush=True)
    subprocess.run(
        [backend["python"], str(ROOT / backend["worker"]), str(job_file), voice], check=True
    )
    job_file.unlink(missing_ok=True)


def _template_safe(md):
    return md.replace("</script>", "<\\/script>")


def _section(visual, narration, audio_rel):
    visual = _mermaid_divs(visual)
    body = visual
    if narration:
        body += "\n\nNote:\n" + narration
    audio_attr = f' data-audio="{audio_rel}"' if audio_rel else ""
    return (
        f'<section{audio_attr} data-markdown><script type="text/template">\n'
        f"{_template_safe(body)}\n</script></section>"
    )


def build(deck_path, voice=None, tts="say", gpu_voice="irons"):
    deck_path = Path(deck_path)
    name = deck_path.stem
    out_dir = ROOT / "out" / name
    audio_dir = out_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)

    title, slides = parse_deck(deck_path.read_text())
    sections = []
    gpu_jobs = []
    voice_id = gpu_voice if tts in GPU_TTS else (voice or "default")
    for i, s in enumerate(slides):
        audio_rel = ""
        if s["narration"]:
            key = f"{tts}:{voice_id}\n{s['narration']}"
            digest = hashlib.sha1(key.encode("utf-8")).hexdigest()[:12]
            mp3 = audio_dir / f"seg_{digest}.mp3"
            audio_rel = f"audio/seg_{digest}.mp3"
            if mp3.exists() and mp3.stat().st_size > 0:
                print(f"  cache slide {i}", flush=True)
            elif tts in GPU_TTS:
                gpu_jobs.append({"text": s["narration"], "out": str(mp3)})
            else:
                print(f"  synth slide {i} ({len(s['narration'])} chars)...", flush=True)
                synth(s["narration"], mp3, voice)
        sections.append(_section(s["visual"], s["narration"], audio_rel))

    if gpu_jobs:
        run_gpu_tts(tts, gpu_jobs, out_dir, gpu_voice)

    html = HTML.replace("{{TITLE}}", title or name).replace(
        "{{SECTIONS}}", "\n".join(sections)
    )
    out_html = out_dir / "index.html"
    out_html.write_text(html)
    print(out_html)
    return out_html


HTML = r"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{{TITLE}}</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/styles/github.min.css">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&family=Source+Sans+3:wght@400;500;600;700&family=Source+Code+Pro:wght@400;500&display=swap">
<style>
  :root{
    /* palette — FT salmon */
    --paper:#FFF1E5; --paper-deep:#F6E5D2; --paper-edge:#ECDDC5;
    --ink:#262A33; --ink-soft:#4D4944; --muted:#7A736C; --muted-soft:#9C948A;
    --rule:#E0CFB8; --rule-strong:#B9A78A;
    --pos:#0F5D5D; --neg:#9D3A24; --warn:#A87B12; --info:#1A3F70; --plum:#6B2C5E;
    --info-soft:#B5C5DC; --pos-soft:#B7CFCA; --warn-soft:#DDC58A; --neg-soft:#E2BFAC; --plum-soft:#C9B7E0;
    /* type */
    --serif:'Source Serif 4', Georgia, serif;
    --sans:'Source Sans 3', system-ui, -apple-system, sans-serif;
    --mono:'Source Code Pro', ui-monospace, Menlo, monospace;
    /* spacing scale */
    --sp-1:.25em; --sp-2:.5em; --sp-3:.75em; --sp-4:1em; --sp-6:1.5em;
    /* diagram tokens */
    --node-fill:#F6E5D2; --node-stroke:#1A3F70; --edge:#B9A78A; --edge-strong:#7A736C;
    --stroke-hair:1.25px; --stroke-reg:1.75px; --stroke-bold:2.75px;
    /* motion */
    --ease-out:cubic-bezier(.22,1,.36,1); --ease-io:cubic-bezier(.65,0,.35,1);
  }

  /* ——— canvas & base ——— */
  html, body, .reveal, .reveal-viewport { background: var(--paper); }
  .reveal { font-family: var(--sans); color: var(--ink); font-size: 30px; line-height: 1.5;
    -webkit-font-smoothing: antialiased; }
  .reveal .slides { text-align: left; }
  .reveal .slides section { text-align: left; padding: 3.4% 5.4% 2.4%;
    box-sizing: border-box; }   /* padding inside the 1280px canvas, not added to it */
  .reveal .slides section > * { max-width: 100%; }            /* hard overflow guard */

  /* ——— slide registers (opt-in: <!-- .slide: class="divider" --> as the slide's first line) ——— */
  .reveal .slides section.divider, .reveal .slides section.statement { height: 100%; }
  /* !important: reveal asserts display on the visible slide, so an equal-specificity
     flex declaration loses; scope to .present so hidden slides stay hidden */
  .reveal .slides section.present.divider, .reveal .slides section.present.statement {
    display: flex !important; flex-direction: column; justify-content: center; }
  .reveal .slides section.divider h2 { border: none; color: var(--paper);
    font-size: 2.5em; margin: 0; }
  .reveal .slides section.divider h3 { font-family: var(--sans); color: var(--info-soft);
    font-size: .68em; font-weight: 600; text-transform: uppercase; letter-spacing: .16em;
    margin: 0 0 var(--sp-4); }
  .reveal .slides section.divider p, .reveal .slides section.divider li { color: var(--paper-deep); }
  .reveal .slides section.divider strong { color: var(--warn-soft); }
  html:has(.reveal .slides section.present.divider),
  html:has(.reveal .slides section.present.divider) body,
  html:has(.reveal .slides section.present.divider) .reveal,
  html:has(.reveal .slides section.present.divider) .reveal-viewport { background: var(--info); }
  html:has(.reveal .slides section.present.divider) .reveal .slide-number,
  html:has(.reveal .slides section.present.divider) .badge { color: var(--info-soft); }
  html:has(.reveal .slides section.present.divider) .reveal .controls { color: var(--paper); }
  html, body, .reveal-viewport { transition: background-color .4s; }
  .reveal .slides section.statement { align-items: center; text-align: center; }
  .reveal .slides section.statement p { font-family: var(--serif); font-size: 1.55em;
    line-height: 1.35; max-width: 26ch; margin: 0; }
  .reveal .slides section.statement h2 { border: none; }
  /* compact — density escape hatch for a slide that measures too tall; shrinks
     text (viz/mermaid labels are fixed-px and unaffected) and caps diagram height */
  .reveal .slides section.compact { font-size: 26px; }
  .reveal .slides section.compact .viz svg { max-height: 34vh; }
  .reveal .slides section.compact .mermaid svg { max-height: 36vh; }
  .reveal .slides section.compact li { margin: .35em 0; }
  .reveal .slides section.compact .katex-display { font-size: 1em; margin: var(--sp-2) 0; }

  /* ——— headings ——— */
  .reveal h1, .reveal h2, .reveal h3 {
    font-family: var(--serif); color: var(--ink); font-weight: 600;
    text-transform: none; letter-spacing: -.006em; line-height: 1.12; margin: 0 0 var(--sp-3); }
  .reveal h1 { font-size: 2.2em; }
  .reveal h2 { font-size: 1.55em; padding-bottom: .24em; margin-bottom: var(--sp-4);
    border-bottom: 1px solid var(--rule); }
  .reveal h3 { font-size: 1.18em; color: var(--ink-soft); }

  /* ——— prose & lists ——— */
  .reveal p { line-height: 1.5; margin: 0 0 var(--sp-3); }
  .reveal ul, .reveal ol { list-style: none; margin: 0; padding: 0; }
  .reveal li { margin: var(--sp-2) 0; padding-left: 1.15em; position: relative; line-height: 1.45; }
  .reveal ul > li::before { content: ''; position: absolute; left: 0; top: .56em;
    width: .38em; height: .38em; border-radius: 1px; background: var(--rule-strong); }
  .reveal ol { counter-reset: li; }
  .reveal ol > li::before { counter-increment: li; content: counter(li);
    position: absolute; left: 0; top: .1em; font: 600 .62em var(--mono); color: var(--info); }
  .reveal strong { color: var(--info); font-weight: 600; }
  .reveal em { font-style: italic; color: var(--ink-soft); }
  .reveal a { color: var(--info); text-decoration: none; border-bottom: 1px solid var(--info-soft); }

  /* ——— code (contained, never overflows the slide) ——— */
  .reveal code { font-family: var(--mono); font-size: .92em;
    background: var(--paper-deep); padding: .05em .3em; border-radius: 4px; }
  .reveal pre { width: fit-content; max-width: 100%; box-shadow: none;
    margin: var(--sp-3) 0; font-size: .55em; }   /* short snippets sit compact, not banner-wide */
  .reveal pre code, .reveal pre code.hljs {
    font-family: var(--mono); background: var(--paper-deep); color: var(--ink);
    border: 1px solid var(--rule); border-radius: 8px; padding: .9em 1.1em;
    line-height: 1.5; max-height: 48vh; overflow: auto; }

  /* ——— math ——— */
  .reveal .katex { color: var(--ink); }
  .reveal .katex-display { text-align: center; margin: var(--sp-4) 0; font-size: 1.08em;
    max-width: 100%; overflow-x: auto; overflow-y: hidden; padding-bottom: 2px; }

  /* ——— tables (fit the slide) ——— */
  .reveal table { border-collapse: collapse; margin: var(--sp-3) 0; font-size: .58em; width: 100%; }
  .reveal table th, .reveal table td { padding: .42em .7em; text-align: left;
    border-bottom: 1px solid var(--rule); vertical-align: top; }
  .reveal table th { font-family: var(--sans); font-weight: 600; color: var(--muted);
    text-transform: uppercase; letter-spacing: .04em; font-size: .82em;
    border-bottom: 1.5px solid var(--rule-strong); }
  .reveal table tr:last-child td { border-bottom: none; }

  /* ——— blockquote ——— */
  .reveal blockquote { border-left: 3px solid var(--rule-strong);
    padding: .1em .9em; margin: var(--sp-3) 0; box-shadow: none; background: none;
    color: var(--muted); font-style: italic; font-family: var(--serif); }

  /* ——— mermaid ——— */
  .reveal .mermaid { display: flex; justify-content: center; margin: var(--sp-2) 0; }
  .reveal .mermaid svg { max-width: 100%; max-height: 44vh; height: auto; margin: 0 auto; }
  /* pin label typography so reveal's base font can't inflate boxes mermaid sized smaller */
  .reveal .mermaid .nodeLabel, .reveal .mermaid .edgeLabel,
  .reveal .mermaid foreignObject div, .reveal .mermaid foreignObject p, .reveal .mermaid span {
    font-size: 15px !important; line-height: 1.3 !important;
    font-family: var(--sans) !important; color: var(--ink) !important; white-space: normal !important; }

  /* ═══════════ DIAGRAM VOCABULARY ═══════════ */
  /* container — keeps every diagram centred and inside the slide */
  .reveal .viz { display: flex; justify-content: center; align-items: center;
    margin: var(--sp-2) auto var(--sp-1); width: 100%; }
  .reveal .viz svg { width: 100%; max-width: 800px; max-height: 42vh; height: auto;
    overflow: visible; font-family: var(--sans); }
  .reveal .viz.wide svg   { max-width: 1080px; }
  .reveal .viz.narrow svg { max-width: 460px; }
  /* nodes — semantic roles */
  .viz .node { fill: var(--node-fill); stroke: var(--node-stroke); stroke-width: var(--stroke-reg); }
  .viz .node.accent { fill: var(--info);      stroke: var(--info); }
  .viz .node.good   { fill: var(--pos-soft);  stroke: var(--pos); }
  .viz .node.warn   { fill: var(--warn-soft); stroke: var(--warn); }
  .viz .node.danger { fill: var(--neg-soft);  stroke: var(--neg); }
  .viz .node.plum   { fill: var(--plum-soft); stroke: var(--plum); }
  .viz .node.muted  { fill: var(--paper-edge); stroke: var(--rule-strong); }
  /* edges */
  .viz .edge { fill: none; stroke: var(--edge); stroke-width: var(--stroke-reg); stroke-linecap: round; }
  .viz .edge.strong { stroke: var(--edge-strong); }
  .viz .edge.accent { stroke: var(--info); }
  .viz .edge.good   { stroke: var(--pos); stroke-width: var(--stroke-bold); }
  .viz .edge.danger { stroke: var(--neg); }
  .viz .edge.warn   { stroke: var(--warn); }
  .viz .edge.plum   { stroke: var(--plum); }
  .viz .edge.ghost  { stroke-dasharray: 5 6; opacity: .75; }
  /* failure mark — two crossed strokes over a node; pair with m-dim for "node dies" */
  .viz .x-mark { stroke: var(--neg); stroke-width: var(--stroke-bold); stroke-linecap: round; }
  /* labels */
  .viz .lbl { fill: var(--ink); font-size: 15px; text-anchor: middle; dominant-baseline: middle; }
  .viz .lbl.on-fill { fill: #fff; }
  .viz .lbl.mono { font-family: var(--mono); font-size: 13px; }
  .viz .lbl.sm  { font-size: 12.5px; }                       /* fits a small (~r18) node */
  .viz .lbl.left, .viz .cap.left { text-anchor: start; }     /* left-align (CSS beats the attr) */
  /* external label — hangs beside a node too small to hold its text */
  .viz .olbl { fill: var(--muted); font-size: 12.5px; text-anchor: middle; dominant-baseline: middle; }
  /* code / structured text in a diagram — left-aligned monospace */
  .viz .code { font-family: var(--mono); font-size: 13px; fill: var(--ink); text-anchor: start; }
  .viz .cap { fill: var(--muted); font-size: 12.5px; text-anchor: middle; letter-spacing: .03em; }
  .viz .tag { fill: var(--muted); font-size: 11px; text-anchor: middle;
    text-transform: uppercase; letter-spacing: .09em; }
  /* text color roles — semantic color on captions/labels/tags (no raw hex in decks) */
  .viz .cap.accent, .viz .lbl.accent, .viz .tag.accent { fill: var(--info); }
  .viz .cap.good,   .viz .lbl.good,   .viz .tag.good   { fill: var(--pos); }
  .viz .cap.warn,   .viz .lbl.warn,   .viz .tag.warn   { fill: var(--warn); }
  .viz .cap.danger, .viz .lbl.danger, .viz .tag.danger { fill: var(--neg); }
  .viz .cap.plum,   .viz .lbl.plum,   .viz .tag.plum   { fill: var(--plum); }
  /* region — translucent set/area (Venn circles, highlighted zones); overlaps blend */
  .viz .region { fill: var(--info-soft); fill-opacity: .5; stroke: var(--info);
    stroke-width: var(--stroke-reg); }
  .viz .region.good   { fill: var(--pos-soft);  stroke: var(--pos); }
  .viz .region.warn   { fill: var(--warn-soft); stroke: var(--warn); }
  .viz .region.danger { fill: var(--neg-soft);  stroke: var(--neg); }
  .viz .region.plum   { fill: var(--plum-soft); stroke: var(--plum); }
  /* bars & quantities */
  .viz .bar { fill: var(--info); }
  .viz .bar.good{fill:var(--pos);} .viz .bar.warn{fill:var(--warn);}
  .viz .bar.danger{fill:var(--neg);} .viz .bar.muted{fill:#D9CBB2;}
  .viz .track { fill: var(--paper-deep); }
  .viz .axis { stroke: var(--rule-strong); stroke-width: 1.25px; }
  /* grid / matrix cells */
  .viz .cell { fill: #FBF4E6; stroke: #fff; stroke-width: 2px; }
  .viz .cell.on{fill:var(--pos-soft);} .viz .cell.off{fill:var(--paper-edge);}
  .viz .cell.hot{fill:var(--neg-soft);} .viz .cell.sel{fill:var(--warn-soft);}
  /* datastore — a database / log cylinder. Draw a body <path> + a top <ellipse>,
     both class="store" (see the vocabulary deck for the snippet). */
  .viz .store { fill: var(--node-fill); stroke: var(--node-stroke); stroke-width: var(--stroke-reg); }
  .viz .store.good   { fill: var(--pos-soft);  stroke: var(--pos); }
  .viz .store.warn   { fill: var(--warn-soft); stroke: var(--warn); }
  .viz .store.accent { fill: var(--info);      stroke: var(--info); }
  /* moving token */
  .viz .token { fill: var(--neg); }
  .viz .token.accent{fill:var(--info);} .viz .token.good{fill:var(--pos);}
  /* arrowheads use marker refs; authors add a <defs> with id=arr / id=arrA (see vocabulary deck) */

  /* ═══════════ MOTION PRIMITIVES (named, eased, opt-in) ═══════════ */
  /* fade-in — HTML + SVG; stagger with style="--i:N" */
  @keyframes m-in { from{opacity:0;} to{opacity:1;} }
  .m-in { opacity:0; animation: m-in .65s var(--ease-out) forwards; animation-delay: calc(var(--i,0)*.14s); }
  /* rise-in — HTML elements */
  @keyframes m-rise { from{opacity:0; transform:translateY(7px);} to{opacity:1; transform:none;} }
  .m-rise { opacity:0; animation: m-rise .7s var(--ease-out) forwards; animation-delay: calc(var(--i,0)*.14s); }
  /* gentle pulse — attention */
  @keyframes m-pulse { 0%,100%{opacity:.5;} 50%{opacity:1;} }
  .m-pulse { animation: m-pulse 2.6s var(--ease-io) infinite; }
  /* dim — de-emphasize / "this recedes" */
  @keyframes m-dim { to{opacity:.28;} }
  .m-dim { animation: m-dim .8s var(--ease-io) forwards; animation-delay: var(--d,0s); }
  /* draw-on a stroke — set style="--len:<path length>" */
  @keyframes m-draw { from{stroke-dashoffset: var(--len,240);} to{stroke-dashoffset:0;} }
  .m-draw { stroke-dasharray: var(--len,240); animation: m-draw 1.1s var(--ease-out) forwards;
    animation-delay: calc(var(--i,0)*.12s); }
  /* breathing emphasis */
  @keyframes m-beat { 0%,100%{transform:scale(1);} 50%{transform:scale(1.06);} }
  .m-beat { transform-box: fill-box; transform-origin: center; animation: m-beat 2.4s var(--ease-io) infinite; }
  @media (prefers-reduced-motion: reduce){ .m-in,.m-rise,.m-draw{animation-duration:.01s;} .m-pulse,.m-beat{animation:none;} }

  /* ——— chrome ——— */
  .reveal .slide-number { background: transparent; color: var(--muted);
    font-family: var(--sans); font-size: 14px; letter-spacing: .05em;
    right: auto; left: 14px; bottom: 13px; top: auto; }
  .reveal .controls { color: var(--ink); }
  .reveal .controls button { animation: none !important; }
  .reveal .progress { color: var(--info); height: 3px;
    background: rgba(185,167,138,.25); }
  /* cover — the start overlay doubles as the deck's title card */
  #start { position: fixed; inset: 0; background: var(--paper);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 1.05rem; z-index: 1000; cursor: pointer; text-align: center; }
  #start:focus-visible { outline: 3px solid var(--info); outline-offset: -3px; }
  #start .eyebrow { font: 600 .72rem var(--sans); color: var(--muted);
    text-transform: uppercase; letter-spacing: .18em; }
  #start .cover-title { font-family: var(--serif); font-weight: 600; color: var(--ink);
    font-size: clamp(2rem, 5.2vw, 3.6rem); line-height: 1.08; letter-spacing: -.012em;
    max-width: 22ch; padding: 0 1rem; }
  #start .cover-rule { width: 54px; border-top: 1px solid var(--rule-strong); margin: .3rem 0; }
  #start .meta { font: 500 .85rem var(--sans); color: var(--muted); letter-spacing: .04em; }
  #start .btn { margin-top: 1.15rem; font: 600 1.05rem var(--sans); color: var(--paper);
    background: var(--info); padding: .65rem 2.4rem; border-radius: 4px; letter-spacing: .02em; }
  .badge { position: fixed; bottom: 11px; left: 50%; transform: translateX(-50%);
    color: var(--muted); font: 500 .68rem var(--sans); z-index: 30;
    letter-spacing: .08em; text-transform: uppercase; transition: opacity .6s; }
  .badge.dim { opacity: .12; }
  .badge.dim:hover { opacity: 1; }
</style>
</head>
<body>
<div id="start" role="button" tabindex="0" aria-label="Start narrated slideshow">
  <div class="eyebrow">Narrated explainer</div>
  <div class="cover-title">{{TITLE}}</div>
  <div class="cover-rule"></div>
  <div class="meta" id="cover-meta"></div>
  <span class="btn">&#9654;&nbsp;&nbsp;Start</span>
</div>
<div class="reveal"><div class="slides">
{{SECTIONS}}
</div></div>
<div class="badge"><b id="ps">ready</b> &middot; space: play/pause &middot; auto-advance <b id="aa">on</b> (A) &middot; notes: S</div>

<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/dist/reveal.js"></script>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/markdown/markdown.js"></script>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/highlight/highlight.js"></script>
<script src="https://cdn.jsdelivr.net/npm/reveal.js@5.1.0/plugin/notes/notes.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/mermaid@10.9.1/dist/mermaid.min.js"></script>
<script>
const deck = new Reveal({
  plugins: [ RevealMarkdown, RevealHighlight, RevealNotes ],
  hash: true, slideNumber: 'c/t', transition: 'fade',
  width: 1280, height: 720, margin: 0.055,   // 16:9 canvas, scaled to the window
  center: false,                             // top-align dense technical slides
  minScale: 0.2, maxScale: 1.8,
  keyboard: { 32: null }   // free space for play/pause (below)
});
deck.initialize().then(() => {
  const n = document.querySelectorAll('.reveal .slides > section').length;
  document.getElementById('cover-meta').textContent = n + ' slides · audio narration';
  initMermaid();
  renderSlideDiagrams(deck.getCurrentSlide());
  renderMathInElement(document.querySelector('.reveal .slides'), {
    delimiters: [ {left:'$$',right:'$$',display:true}, {left:'$',right:'$',display:false} ],
    throwOnError: false
  });
});
// Mermaid measures html labels via layout; a diagram inside a display:none slide
// measures as zero and dagre emits NaN transforms. So render each slide's diagrams
// only once that slide is visible.
deck.on('slidechanged', e => renderSlideDiagrams(e.currentSlide));

function initMermaid(){
  if (!window.mermaid) return;
  mermaid.initialize({ startOnLoad:false, theme:'base',
    flowchart:{ curve:'basis', htmlLabels:false, wrap:true, useMaxWidth:true, padding:12, nodeSpacing:42, rankSpacing:46 },
    themeVariables:{
      fontFamily:"'Source Sans 3', system-ui, sans-serif", fontSize:'15px',
      background:'#FFF1E5', primaryColor:'#F6E5D2', primaryTextColor:'#262A33',
      primaryBorderColor:'#1A3F70', lineColor:'#7A736C',
      secondaryColor:'#ECDDC5', tertiaryColor:'#FFF1E5',
      edgeLabelBackground:'#FFF1E5', clusterBkg:'#FBF4E6', clusterBorder:'#E0CFB8'
  }});
}
function renderSlideDiagrams(slide){
  if (!window.mermaid || !slide) return;
  const nodes = [...slide.querySelectorAll('.mermaid:not([data-processed])')];
  if (!nodes.length) return;
  // Wait for webfonts before measuring: mermaid sizes label boxes from text
  // metrics, and measuring against a fallback font clips the loaded font's wider glyphs.
  const fonts = (document.fonts && document.fonts.ready) || Promise.resolve();
  fonts.then(() => mermaid.run({ nodes }));
}

const audio = new Audio();
let autoAdvance = true;

function setPS(t){ const el = document.getElementById('ps'); if(el) el.textContent = t; }

function playCurrent(){
  const cur = deck.getCurrentSlide();
  const src = cur && cur.getAttribute('data-audio');
  audio.pause();
  if(src){ audio.src = src; audio.currentTime = 0; audio.play().catch(()=>{}); }
}
function togglePause(){
  if(!audio.src) return;                       // nothing loaded (pre-Start)
  if(audio.paused) audio.play().catch(()=>{});
  else audio.pause();
}
let badgeDimmed = false;
function scheduleBadgeDim(){
  if(badgeDimmed) return;
  badgeDimmed = true;
  setTimeout(() => document.querySelector('.badge').classList.add('dim'), 5000);
}
audio.addEventListener('play',  () => { setPS('playing'); scheduleBadgeDim(); });
audio.addEventListener('pause', () => setPS('paused'));
audio.addEventListener('ended', () => {
  setPS('paused');
  if(autoAdvance && !deck.isLastSlide()) deck.next();
});
deck.on('slidechanged', playCurrent);

function startShow(){
  const el = document.getElementById('start');
  if(el.style.display === 'none') return;
  el.style.display = 'none';
  playCurrent();
}
document.getElementById('start').addEventListener('click', startShow);
document.addEventListener('keydown', (e) => {
  const coverUp = document.getElementById('start').style.display !== 'none';
  if(coverUp && (e.key === 'Enter' || e.key === ' ' || e.code === 'Space')){
    e.preventDefault();
    startShow();
  } else if(e.key === ' ' || e.code === 'Space'){   // play/pause
    e.preventDefault();
    togglePause();
  } else if(e.key === 'a' || e.key === 'A'){         // toggle auto-advance
    autoAdvance = !autoAdvance;
    document.getElementById('aa').textContent = autoAdvance ? 'on' : 'off';
    if(badgeDimmed){                                 // surface the badge while it changes
      const b = document.querySelector('.badge');
      b.classList.remove('dim');
      setTimeout(() => b.classList.add('dim'), 2500);
    }
  }
});
</script>
</body>
</html>
"""


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args:
        sys.exit("usage: python3 render.py decks/<name>.md [--voice <name>] "
                 "[--tts say|fish|higgs] [--gpu-voice irons|fiennes]")
    voice = None
    tts = "say"
    gpu_voice = "irons"
    if "--voice" in args:
        i = args.index("--voice")
        voice = args[i + 1]
        args = args[:i] + args[i + 2:]
    if "--tts" in args:
        i = args.index("--tts")
        tts = args[i + 1]
        args = args[:i] + args[i + 2:]
    # --gpu-voice is the backend-neutral name; --fish-voice kept as an alias so
    # the existing render_fish.sh job keeps working unchanged.
    for flag in ("--gpu-voice", "--fish-voice"):
        if flag in args:
            i = args.index(flag)
            gpu_voice = args[i + 1]
            args = args[:i] + args[i + 2:]
    build(args[0], voice=voice, tts=tts, gpu_voice=gpu_voice)
