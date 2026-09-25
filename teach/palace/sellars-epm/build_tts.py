"""Narration audio for the EPM walk: one mp3 per narration block, via the Higgs worker.

Parses narration/U*.md into blocks (a stop follows each block except where the unit ends
without one), normalizes the text for speech, and renders any block whose audio is missing.
Audio files are keyed by a hash of the spoken text, so edits re-render only what changed and
a re-run after interruption skips finished blocks (gpu-broker resumability).

  python3 build_tts.py --plan          # write walk.json + report what would render
  python3 build_tts.py --render        # render missing blocks (GPU: run via gpu-broker only)
  python3 build_tts.py --durations     # fill block durations into walk.json (ffprobe)
"""
import argparse
import glob
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROOT = BASE.parents[2]  # explainer/
AUDIO = BASE / 'audio'
HIGGS_PYTHON = '/Users/elliotmilco/Documents/GitHub/philosophy-tts/.venv-higgs/bin/python'
VOICE = 'irons'

ONES = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split()
TENS = 'x x twenty thirty forty fifty sixty seventy eighty ninety'.split()


def two(n):
    if n < 20: return ONES[n]
    t, o = divmod(n, 10)
    return TENS[t] + ('' if o == 0 else '-' + ONES[o])


def year(n):
    hi, lo = divmod(n, 100)
    return two(hi) + ' ' + ('hundred' if lo == 0 else ('oh ' + ONES[lo] if lo < 10 else two(lo)))


def speakable(t):
    t = re.sub(r'\b(1[5-9]\d\d|20\d\d)\b', lambda m: year(int(m.group(1))), t)
    t = re.sub(r'\b(\d{1,2})\b', lambda m: two(int(m.group(1))), t)
    t = t.replace('—', ', ').replace('–', ' to ').replace('…', '...')
    t = t.replace('arché', 'arkhay').replace('dénouement', 'denouement').replace('Pickwickian', 'Pick-wickian')
    t = re.sub(r'\*([^*]+)\*', r'\1', t)          # markdown emphasis
    t = re.sub(r' ,', ',', re.sub(r',\s*,', ',', t))
    return re.sub(r'\s+', ' ', t).strip()


def parse():
    units = sorted(glob.glob(str(BASE / 'narration/U*.md')), key=lambda p: int(re.search(r'U(\d+)', p).group(1)))
    blocks = []
    for p in units:
        uid = Path(p).stem
        md = Path(p).read_text()
        title = re.search(r'^# (.*)$', md, re.M).group(1)
        seq = re.findall(r'^::: (narration|stop)\n(.*?)^:::', md, re.M | re.S)
        k = 0
        for i, (kind, body) in enumerate(seq):
            if kind != 'narration': continue
            stop = None
            if i + 1 < len(seq) and seq[i + 1][0] == 'stop':
                sb = seq[i + 1][1]
                g = lambda f: (re.search(rf'^{f}:\s*(.*)$', sb, re.M) or [None, ''])[1].strip()
                stop = {'image': g('image'), 'source_hint': g('source_hint'), 'keyword': g('keyword')}
            speech = speakable(body)
            h = hashlib.sha1((VOICE + '|' + speech).encode()).hexdigest()[:10]
            blocks.append({'id': f'{uid}.{k:02d}', 'unit': uid, 'unit_title': title, 'text': body.strip(),
                           'speech': speech, 'audio': f'audio/{uid}_{k:02d}_{h}.mp3', 'stop': stop})
            k += 1
    return blocks


def load_walk():
    p = BASE / 'walk.json'
    return json.loads(p.read_text()) if p.exists() else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--plan', action='store_true')
    ap.add_argument('--render', action='store_true')
    ap.add_argument('--durations', action='store_true')
    ap.add_argument('--only', default='', help='comma-separated block ids to limit rendering to')
    a = ap.parse_args()
    blocks = parse()
    old = {b['audio']: b for b in (load_walk() or {}).get('blocks', [])}
    for b in blocks:
        if b['audio'] in old and 'duration' in old[b['audio']]: b['duration'] = old[b['audio']]['duration']
    AUDIO.mkdir(exist_ok=True)
    todo = [b for b in blocks if not (BASE / b['audio']).exists()]
    if a.only: todo = [b for b in todo if b['id'] in a.only.split(',')]
    if a.plan or not (a.render or a.durations):
        print(f'{len(blocks)} blocks, {sum(1 for b in blocks if b["stop"])} stops; {len(todo)} to render '
              f'({sum(len(b["speech"].split()) for b in todo)} words)')
    if a.render and todo:
        jobs = [{'text': b['speech'], 'out': str(BASE / b['audio'])} for b in todo]
        jf = AUDIO / '_jobs.json'
        jf.write_text(json.dumps(jobs))
        r = subprocess.run([HIGGS_PYTHON, str(ROOT / 'tts_higgs.py'), str(jf), VOICE])
        if r.returncode != 0: sys.exit(r.returncode)
        todo = [b for b in todo if not (BASE / b['audio']).exists()]
        if todo: sys.exit(42)  # some blocks skipped/failed: come back
    if a.durations or a.render:
        for b in blocks:
            f = BASE / b['audio']
            if f.exists() and 'duration' not in b:
                out = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(f)],
                                     capture_output=True, text=True).stdout.strip()
                b['duration'] = round(float(out), 3)
    (BASE / 'walk.json').write_text(json.dumps({'voice': VOICE, 'blocks': blocks}, indent=1))
    have = [b for b in blocks if 'duration' in b]
    if have:
        print(f'audio: {len(have)}/{len(blocks)} blocks, {sum(b["duration"] for b in have) / 60:.1f} min')


if __name__ == '__main__':
    main()
