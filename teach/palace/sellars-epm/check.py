"""Mechanical checks on narration/U*.md against the map and the source text.

Checks: narration word count vs. the unit budget in map.md; words between stops; every
quoted span of 6+ words appears verbatim in the EPM sections (or is whitelisted); banned
phrases (references to the walk, images, or stops). Interpretive accuracy is checked by
reading, not here.

Usage: python3 check.py [U3 ...]
"""
import glob
import re
import sys

BASE = __file__.rsplit('/', 1)[0]
N = lambda s: re.sub(r'\s+', ' ', s.replace('’', "'").replace('‘', "'").replace('“', '"')
                     .replace('”', '"').replace('—', '-').replace('–', '-')).strip()
SOURCE = N(' '.join(open(f).read() for f in sorted(glob.glob(f'{BASE}/source/sections/*.txt'))))
SOURCE_LOOSE = re.sub(r'["\']', '', SOURCE)
BUDGET = {m.group(1): int(m.group(2)) for m in re.finditer(r'^## (U\d+) .*?≈ (\d+) w', open(f'{BASE}/map.md').read(), re.M)}
# non-Sellars quotations whose wording the map supplies
WHITELIST = ['Avoiding the Myth of the Given', 'Nothing can count as a reason for holding a belief except another belief',
             'Philosophy and the Scientific Image of Man', 'the spirit of Hegel in the fetters of Carnap']
BANNED = [r'\bas you can see\b', r'\bthe walk\b', r'\blandscape\b', r'\bthis image\b', r'\bpictured here\b',
          r'\blet\'?s dive\b', r'\bgreat question\b']


def blocks(md):
    return re.findall(r'^::: (narration|stop)\n(.*?)^:::', md, re.M | re.S)


def quotes(text):
    t = text.replace('“', '"').replace('”', '"')
    return [q for q in re.findall(r'"([^"]+)"', t) if len(q.split()) >= 6]


def check(unit):
    md = open(f'{BASE}/narration/{unit}.md').read()
    bl = blocks(md)
    narr = [b for k, b in bl if k == 'narration']
    words = sum(len(b.split()) for b in narr)
    budget = BUDGET.get(unit)
    gaps, run = [], 0
    for k, b in bl:
        if k == 'narration': run += len(b.split())
        else: gaps.append(run); run = 0
    gaps.append(run)
    out = [f'{unit}: {words} words' + (f' (budget {budget}, {100 * (words - budget) / budget:+.0f}%)' if budget else ''),
           f'  stops {sum(1 for k, _ in bl if k == "stop")}; words between stops min {min(gaps)} max {max(gaps)}']
    body = '\n'.join(narr)
    for q in quotes(body):
        if any(w in q for w in WHITELIST): continue
        parts = [re.sub(r'["\']', '', p).strip(' .,;:?') for p in re.split(r'\.\.\.|…', N(q)) if len(p.split()) >= 3]
        if parts and not all(p in SOURCE_LOOSE for p in parts):
            out.append(f'  QUOTE NOT IN SOURCE: "{q[:140]}"')
    for pat in BANNED:
        for m in re.finditer(pat, body, re.I):
            out.append(f'  BANNED "{m.group(0)}": …{body[max(0, m.start() - 60):m.end() + 30]}…'.replace('\n', ' '))
    for k, b in bl:
        if k == 'stop' and not all(f in b for f in ('image:', 'keyword:')):
            out.append(f'  MALFORMED STOP: {b[:80]!r}')
    return '\n'.join(out)


units = sys.argv[1:] or sorted((p.rsplit('/', 1)[1][:-3] for p in glob.glob(f'{BASE}/narration/U*.md')), key=lambda u: int(u[1:]))
for u in units:
    print(check(u))
