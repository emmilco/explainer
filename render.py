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


FISH_PYTHON = "/Users/elliotmilco/Documents/GitHub/philosophy-tts/.venv/bin/python"


def run_fish(jobs, out_dir, voice):
    """Synthesize narration via the Fish worker under the philosophy-tts venv."""
    job_file = out_dir / "_fish_jobs.json"
    job_file.write_text(json.dumps(jobs))
    print(f"  fish ({voice}): synthesizing {len(jobs)} segment(s) — loading model...", flush=True)
    subprocess.run([FISH_PYTHON, str(ROOT / "tts_fish.py"), str(job_file), voice], check=True)
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


def build(deck_path, voice=None, tts="say", fish_voice="irons"):
    deck_path = Path(deck_path)
    name = deck_path.stem
    out_dir = ROOT / "out" / name
    audio_dir = out_dir / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)

    title, slides = parse_deck(deck_path.read_text())
    sections = []
    fish_jobs = []
    voice_id = fish_voice if tts == "fish" else (voice or "default")
    for i, s in enumerate(slides):
        audio_rel = ""
        if s["narration"]:
            key = f"{tts}:{voice_id}\n{s['narration']}"
            digest = hashlib.sha1(key.encode("utf-8")).hexdigest()[:12]
            mp3 = audio_dir / f"seg_{digest}.mp3"
            audio_rel = f"audio/seg_{digest}.mp3"
            if mp3.exists() and mp3.stat().st_size > 0:
                print(f"  cache slide {i}", flush=True)
            elif tts == "fish":
                fish_jobs.append({"text": s["narration"], "out": str(mp3)})
            else:
                print(f"  synth slide {i} ({len(s['narration'])} chars)...", flush=True)
                synth(s["narration"], mp3, voice)
        sections.append(_section(s["visual"], s["narration"], audio_rel))

    if fish_jobs:
        run_fish(fish_jobs, out_dir, fish_voice)

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
    --paper:#FFF1E5; --paper-deep:#F6E5D2; --paper-edge:#ECDDC5;
    --ink:#262A33; --ink-soft:#4D4944; --muted:#7A736C; --muted-soft:#9C948A;
    --rule:#E0CFB8; --rule-strong:#B9A78A;
    --pos:#0F5D5D; --neg:#9D3A24; --warn:#A87B12; --info:#1A3F70;
    --serif:'Source Serif 4', Georgia, 'Times New Roman', serif;
    --sans:'Source Sans 3', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
    --mono:'Source Code Pro', ui-monospace, Menlo, monospace;
  }
  html, body, .reveal, .reveal-viewport { background: var(--paper); }
  .reveal { font-family: var(--sans); color: var(--ink); font-size: 32px; line-height: 1.5; }
  .reveal .slides { text-align: left; }
  .reveal .slides section { text-align: left; padding: 0 4%; }
  .reveal h1, .reveal h2, .reveal h3 {
    font-family: var(--serif); color: var(--ink); font-weight: 600;
    text-transform: none; letter-spacing: -0.005em; line-height: 1.12; margin: 0 0 .5em;
  }
  .reveal h1 { font-size: 2.3em; }
  .reveal h2 { font-size: 1.7em; padding-bottom: .26em; border-bottom: 1px solid var(--rule); }
  .reveal p { line-height: 1.5; }
  .reveal ul { list-style: none; margin-left: 0; padding-left: 0; }
  .reveal li { margin: .36em 0; padding-left: 1.1em; position: relative; line-height: 1.5; }
  .reveal li::before { content: ''; position: absolute; left: 0; top: .58em;
    width: .4em; height: .4em; background: var(--rule-strong); }
  .reveal strong { color: var(--info); font-weight: 600; }
  .reveal em { font-style: italic; color: var(--ink-soft); }
  .reveal a { color: var(--info); }
  .reveal code { font-family: var(--mono); }
  .reveal pre { width: 100%; box-shadow: none; margin: .6em 0; font-size: .6em; }
  .reveal pre code, .reveal pre code.hljs {
    font-family: var(--mono); background: var(--paper-deep); color: var(--ink);
    border: 1px solid var(--rule); border-radius: 8px;
    padding: 1em 1.2em; line-height: 1.5; max-height: none;
  }
  .reveal .katex { color: var(--ink); }
  .reveal .katex-display { text-align: center; margin: .7em 0; font-size: 1.15em; }
  .reveal .mermaid { display: flex; justify-content: center; margin: .3em 0; }
  .reveal .mermaid svg { max-width: 100%; max-height: 60vh; height: auto; }
  .reveal blockquote { border-left: 3px solid var(--rule-strong);
    padding: .1em .9em; margin: .4em 0; box-shadow: none; background: none;
    color: var(--muted); font-style: italic; font-family: var(--serif); }
  .reveal .slide-number { background: transparent; color: var(--muted);
    font-family: var(--sans); font-size: 14px; letter-spacing: .05em;
    right: auto; left: 12px; bottom: 12px; top: auto; }
  .reveal .controls { color: var(--ink); }
  .reveal .controls button { animation: none !important; }

  #start { position: fixed; inset: 0; background: var(--paper);
    display: flex; align-items: center; justify-content: center; z-index: 1000; cursor: pointer; }
  #start span { font-family: var(--serif); color: var(--ink);
    font-size: 1.5rem; font-weight: 600; padding: .7rem 2rem;
    border: 1px solid var(--ink); border-radius: 4px; letter-spacing: .01em; }
  .badge { position: fixed; bottom: 10px; left: 50%; transform: translateX(-50%);
    color: var(--muted); font: 500 .68rem var(--sans); z-index: 30;
    letter-spacing: .08em; text-transform: uppercase; }
</style>
</head>
<body>
<div id="start"><span>&#9654;&nbsp;&nbsp;Start</span></div>
<div class="reveal"><div class="slides">
{{SECTIONS}}
</div></div>
<div class="badge">auto-advance <b id="aa">on</b> &middot; toggle: A &middot; notes: S</div>

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
  hash: true, slideNumber: 'c/t', transition: 'fade'
});
deck.initialize().then(() => {
  renderDiagrams();
  renderMathInElement(document.querySelector('.reveal .slides'), {
    delimiters: [ {left:'$$',right:'$$',display:true}, {left:'$',right:'$',display:false} ],
    throwOnError: false
  });
});

function renderDiagrams(){
  if (!window.mermaid) return;
  mermaid.initialize({ startOnLoad:false, theme:'base', themeVariables:{
    fontFamily:"'Source Sans 3', system-ui, sans-serif", fontSize:'16px',
    background:'#FFF1E5', primaryColor:'#F6E5D2', primaryTextColor:'#262A33',
    primaryBorderColor:'#1A3F70', lineColor:'#7A736C',
    secondaryColor:'#ECDDC5', tertiaryColor:'#FFF1E5'
  }});
  mermaid.run({ querySelector: '.reveal .mermaid' });
}

const audio = new Audio();
let autoAdvance = true;

function playCurrent(){
  const cur = deck.getCurrentSlide();
  const src = cur && cur.getAttribute('data-audio');
  audio.pause();
  if(src){ audio.src = src; audio.currentTime = 0; audio.play().catch(()=>{}); }
}
audio.addEventListener('ended', () => {
  if(autoAdvance && !deck.isLastSlide()) deck.next();
});
deck.on('slidechanged', playCurrent);

document.getElementById('start').addEventListener('click', (e) => {
  e.currentTarget.style.display = 'none';
  playCurrent();
});
document.addEventListener('keydown', (e) => {
  if(e.key === 'a' || e.key === 'A'){
    autoAdvance = !autoAdvance;
    document.getElementById('aa').textContent = autoAdvance ? 'on' : 'off';
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
                 "[--tts say|fish] [--fish-voice irons|fiennes]")
    voice = None
    tts = "say"
    fish_voice = "irons"
    if "--voice" in args:
        i = args.index("--voice")
        voice = args[i + 1]
        args = args[:i] + args[i + 2:]
    if "--tts" in args:
        i = args.index("--tts")
        tts = args[i + 1]
        args = args[:i] + args[i + 2:]
    if "--fish-voice" in args:
        i = args.index("--fish-voice")
        fish_voice = args[i + 1]
        args = args[:i] + args[i + 2:]
    build(args[0], voice=voice, tts=tts, fish_voice=fish_voice)
