#!/usr/bin/env python3
"""Higgs Audio v3 narration worker for the explainer renderer.

Runs under the philosophy-tts Higgs venv (.venv-higgs: mlx-audio git-main +
torch, carrying the higgs_audio_v3 module). Reads a JSON job list
[{"text", "out"}, ...], loads the Higgs v3 model and the chosen voice
reference once, renders each narration to an mp3 via philosophy-tts's
production Higgs render path (sentence/clause split + per-unit
CachedHiggsRenderer with prefix KV-cache reuse + fade/stitch), and prints
per-segment timing.

The structural twin of tts_fish.py — same job protocol, same atomic-write
caching contract — differing only in the TTS backend it borrows. Invoked by
render.py as a subprocess; not run directly.
"""
import json
import subprocess
import sys
import time
from pathlib import Path

PHILO = Path("/Users/elliotmilco/Documents/GitHub/philosophy-tts/philosophy_tts")
sys.path.insert(0, str(PHILO))

import soundfile as sf
import render_book_higgs as higgs
from higgs_render import CachedHiggsRenderer

# Explainer voice name -> philosophy-tts Higgs reference clip. "irons" is the
# production default: Higgs ref-mode y2, the same Irons oxford clip Fish used,
# so a deck's chosen voice carries across the backend swap.
REFS = {
    "irons": higgs.REF_MODES["y2"]["wav"],
    "fiennes": higgs.REF_MODES["fiennes"]["wav"],
    "rorty": higgs.REF_MODES["rorty"]["wav"],
}
DEFAULT_REF = "irons"


def main():
    jobs = json.loads(Path(sys.argv[1]).read_text())
    voice = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_REF
    if not jobs:
        return
    ref_wav = REFS.get(voice, REFS[DEFAULT_REF])
    ref_txt = ref_wav.with_suffix(".txt")

    # q8 backbone carries no codec tensors; fall back to the bf16 snapshot for
    # the codec (same install production uses) before loading.
    higgs._install_codec_fallback()
    from mlx_audio.tts import load

    t0 = time.perf_counter()
    model = load(higgs.DEFAULT_MODEL_ID)
    print(f"[higgs] model loaded in {time.perf_counter() - t0:.1f}s", flush=True)

    renderer = CachedHiggsRenderer(model, ref_wav, ref_txt.read_text().strip())
    print(f"[higgs] voice={voice} ref encoded: {ref_wav.name}", flush=True)

    # render_chunk lazily builds the 200ms intra gap and hands it back; thread
    # it through so the silence array is allocated once across the deck.
    gap_intra = None
    for i, job in enumerate(jobs):
        out = Path(job["out"])
        t = time.perf_counter()
        result = higgs.render_chunk(
            renderer, job["text"], is_title=False, gap_intra=gap_intra
        )
        wall = time.perf_counter() - t
        if result.get("audio") is None:
            print(f"[higgs] seg {i}: SKIPPED ({result.get('skipped')})", flush=True)
            continue
        gap_intra = result.get("gap_intra", gap_intra)
        wav = out.with_suffix(".wav")
        tmp = out.with_suffix(".tmp")
        sf.write(str(wav), result["audio"], result["sr"])
        # write to a temp name, then atomic-rename: a kill mid-conversion can
        # never leave a truncated .mp3 that the per-slide cache treats as complete
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-f", "mp3", str(tmp)],
            check=True,
        )
        tmp.replace(out)
        wav.unlink(missing_ok=True)
        dur = result["duration_s"]
        rtf = wall / dur if dur else 0
        print(
            f"[higgs] seg {i}: {dur}s audio / {wall:.1f}s wall "
            f"(RTF {rtf:.2f}) -> {out.name}",
            flush=True,
        )


if __name__ == "__main__":
    main()
