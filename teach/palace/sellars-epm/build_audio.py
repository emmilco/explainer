"""Assemble the walk's single narration track from the per-block mp3s, sample-exact.

Each block is decoded to PCM and written at its planned start time (plan.json blocks[].t0), so
the walk's clock (audio.currentTime) and the plan agree to the sample; encoder padding in the
individual mp3s can't accumulate into drift. Output: narration.m4a (AAC, mono).

  python3 build_audio.py
"""
import array
import json
import subprocess
import wave
from pathlib import Path

BASE = Path(__file__).resolve().parent
SR = 24000


def decode(mp3):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(mp3), '-f', 's16le', '-ac', '1', '-ar', str(SR), '-'],
                         capture_output=True, check=True).stdout
    a = array.array('h'); a.frombytes(raw)
    return a


def main():
    plan = json.loads((BASE / 'plan.json').read_text())
    total = int(plan['end'] * SR) + SR
    out = array.array('h', bytes(2 * total))
    for b in plan['blocks']:
        pcm = decode(BASE / b['audio'])
        start, n = int(round(b['t0'] * SR)), min(len(pcm), int(round(b['dur'] * SR)))
        out[start:start + n] = pcm[:n]
    wav = BASE / 'audio' / '_narration.wav'
    with wave.open(str(wav), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(wav), '-c:a', 'aac', '-b:a', '80k', str(BASE / 'narration.m4a')], check=True)
    wav.unlink()
    print(f"narration.m4a: {total / SR / 60:.1f} min, {len(plan['blocks'])} blocks")


if __name__ == '__main__':
    main()
