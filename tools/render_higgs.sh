#!/bin/bash
# gpu-broker job: render a deck with Higgs Audio v3 / Irons.
# Usage: render_higgs.sh decks/<name>.md
# Conformant per gpu-broker/CONTRACT.md: any stop signal -> exit 42 (yield);
# resumability comes from render.py's per-slide audio cache (completed
# segments are skipped on re-run) with atomic mp3 writes.
trap 'exit 42' USR1 TERM
cd "$(cd "$(dirname "$0")/.." && pwd)"
python3 render.py "$1" --tts higgs --gpu-voice irons
