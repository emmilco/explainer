#!/bin/bash
# gpu-broker job: render EPM walk narration with Higgs Audio v3 / Irons.
# Usage: render_tts.sh [--only U3.04,U7.00]
# Conformant per gpu-broker/CONTRACT.md: any stop signal -> exit 42 (yield); resumable because
# build_tts.py skips blocks whose hashed mp3 already exists (atomic writes in the worker).
trap 'exit 42' USR1 TERM
cd "$(dirname "$0")"
python3 build_tts.py --render "$@" &
wait $!
