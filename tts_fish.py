#!/usr/bin/env python3
"""Fish S2 Pro narration worker for the explainer renderer.

Runs under the philosophy-tts venv (which carries the patched mlx-audio +
Fish S2 Pro model). Reads a JSON job list [{"text", "out"}, ...], loads the
model and the Fiennes reference once, renders each narration to an mp3 via
philosophy-tts's production Fish render path (sentence split + per-sentence
render + stitch), and prints per-segment timing.

Invoked by render.py as a subprocess; not run directly.
"""
import json
import subprocess
import sys
import time
from pathlib import Path

PHILO = Path("/Users/elliotmilco/Documents/GitHub/philosophy-tts/philosophy_tts")
sys.path.insert(0, str(PHILO))

import soundfile as sf
import render_book_fish as fish

# Named voice references (each a WAV + a matching transcript sidecar .txt).
# Irons oxford is the production default, mirroring philosophy-tts's
# render_book_fish y2 mode.
REFS = {
    "irons": Path(
        "/Users/elliotmilco/Documents/Books/Philosophy/Audio/Voice-Tests/irons/"
        "2026-04-10_irons_brideshead_oxford_47-39.wav"
    ),
    "fiennes": PHILO.parent / "voice_refs" / "fiennes_ref_clip006.wav",
}
DEFAULT_REF = "irons"


def main():
    jobs = json.loads(Path(sys.argv[1]).read_text())
    voice = sys.argv[2] if len(sys.argv) > 2 else DEFAULT_REF
    if not jobs:
        return
    ref_wav = REFS[voice]
    ref_txt = ref_wav.with_suffix(".txt")

    t0 = time.perf_counter()
    model = fish.load_model(fish.MODEL_ID)
    print(f"[fish] model loaded in {time.perf_counter() - t0:.1f}s", flush=True)

    prompt_tokens = [fish.encode_ref(model, fish.load_ref_audio(ref_wav))]
    prompt_texts = [ref_txt.read_text().strip()]
    print(f"[fish] voice={voice} ref encoded: {ref_wav.name}", flush=True)

    for i, job in enumerate(jobs):
        out = Path(job["out"])
        t = time.perf_counter()
        result = fish.render_chunk(model, job["text"], 1, prompt_texts, prompt_tokens)
        wall = time.perf_counter() - t
        if result.get("audio") is None:
            print(f"[fish] seg {i}: SKIPPED ({result.get('skipped')})", flush=True)
            continue
        wav = out.with_suffix(".wav")
        tmp = out.with_suffix(".tmp")
        sf.write(str(wav), result["audio"], result["sr"])
        # write to a temp name, then atomic-rename: a kill mid-conversion can
        # never leave a truncated .mp3 that the cache would treat as complete
        subprocess.run(
            ["ffmpeg", "-y", "-loglevel", "error", "-i", str(wav), "-f", "mp3", str(tmp)],
            check=True,
        )
        tmp.replace(out)
        wav.unlink(missing_ok=True)
        dur = result["duration_s"]
        rtf = wall / dur if dur else 0
        print(
            f"[fish] seg {i}: {dur}s audio / {wall:.1f}s wall "
            f"(RTF {rtf:.2f}) -> {out.name}",
            flush=True,
        )


if __name__ == "__main__":
    main()
