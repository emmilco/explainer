#!/bin/bash
# gpu-broker job: transcribe rendered narration and diff against the script (see check_audio.py).
# Conformant: any stop signal -> exit 42; resumable via per-mp3 transcript cache.
trap 'exit 42' USR1 TERM
cd "$(dirname "$0")"
/Users/elliotmilco/Documents/GitHub/philosophy-tts/.venv/bin/python check_audio.py "$@" &
wait $!
