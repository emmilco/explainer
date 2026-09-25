"""Verify rendered narration by transcribing it (mlx-whisper) and diffing against the script.

GPU work: run via gpu-broker only. Resumable: transcripts are cached per mp3 in
audio/_asr/<mp3 stem>.json. Writes audio/_asr/report.txt: per-block word error rate plus
the words the recognizer heard differently (dropped, garbled, or mispronounced material
shows up there; homophones and name spellings are expected noise).

  python3 check_audio.py            # all rendered blocks
  python3 check_audio.py U3.03 U7.03
"""
import difflib
import json
import re
import sys
from pathlib import Path

import mlx_whisper

BASE = Path(__file__).resolve().parent
OUT = BASE / 'audio/_asr'
MODEL = 'mlx-community/whisper-large-v3-turbo'


def words(s):
    return re.findall(r"[a-z0-9']+", s.lower().replace('’', "'"))


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    blocks = json.loads((BASE / 'walk.json').read_text())['blocks']
    only = set(sys.argv[1:])
    lines = []
    for b in blocks:
        if only and b['id'] not in only: continue
        mp3 = BASE / b['audio']
        if not mp3.exists(): continue
        cache = OUT / (mp3.stem + '.json')
        if cache.exists():
            heard = json.loads(cache.read_text())['text']
        else:
            r = mlx_whisper.transcribe(str(mp3), path_or_hf_repo=MODEL, language='en', word_timestamps=True,
                                       condition_on_previous_text=False)
            heard = r['text']
            ws = [{'w': w['word'], 't': round(w['start'], 2), 'e': round(w['end'], 2), 'p': round(w.get('probability', 0), 2)}
                  for seg in r['segments'] for w in seg.get('words', [])]
            tmp = cache.with_suffix('.tmp')
            tmp.write_text(json.dumps({'text': heard, 'words': ws}))
            tmp.replace(cache)
        ref, hyp = words(b['speech']), words(heard)
        sm = difflib.SequenceMatcher(None, ref, hyp, autojunk=False)
        errs = sum(max(i2 - i1, j2 - j1) for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal')
        tw = json.loads(cache.read_text()).get('words', [])
        at = lambda j: f" @{tw[j]['t']}s p={tw[j]['p']}" if j < len(tw) and len(tw) == len(hyp) else ''
        diffs = [f"{' '.join(ref[i1:i2]) or '∅'} → {' '.join(hyp[j1:j2]) or '∅'}{at(j1)}"
                 for op, i1, i2, j1, j2 in sm.get_opcodes() if op != 'equal']
        lines.append(f"{b['id']}  WER {errs / max(1, len(ref)):.1%}  ({len(ref)} words)")
        lines += [f'    {d}' for d in diffs]
        print(lines[-1 - len(diffs)], flush=True)
    (OUT / 'report.txt').write_text('\n'.join(lines) + '\n')


if __name__ == '__main__':
    main()
