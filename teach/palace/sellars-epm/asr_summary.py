"""Summarise audio/_asr/report.txt: worst blocks by WER, plus every insertion or deletion of 2+
words (the signature of hallucinated or dropped speech, as opposed to spelling noise)."""
import re
from pathlib import Path

rep = (Path(__file__).resolve().parent / 'audio/_asr/report.txt').read_text().splitlines()
blocks, cur = [], None
for line in rep:
    m = re.match(r'^(\S+)\s+WER ([\d.]+)%', line)
    if m:
        cur = {'id': m.group(1), 'wer': float(m.group(2)), 'diffs': []}
        blocks.append(cur)
    elif cur and line.strip():
        cur['diffs'].append(line.strip())
print('mean WER %.1f%%' % (sum(b['wer'] for b in blocks) / len(blocks)))
print('worst:', ', '.join(f"{b['id']} {b['wer']}%" for b in sorted(blocks, key=lambda b: -b['wer'])[:10]))
print('\nmulti-word insertions/deletions:')
for b in blocks:
    for d in b['diffs']:
        left, _, right = d.partition(' → ')
        right = re.sub(r' @[\d.]+s p=[\d.]+$', '', right)
        lw = 0 if left == '∅' else len(left.split())
        rw = 0 if right == '∅' else len(right.split())
        if abs(lw - rw) >= 2 or (lw == 0 and rw >= 2) or (rw == 0 and lw >= 2):
            print(f"  {b['id']}: {d}")
