"""Print a loudness envelope (0.25 s windows) for the tail of a block's audio.
Usage: tail_rms.py <block-id> [seconds-from-end]"""
import json
import math
import struct
import subprocess
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent
bid, back = sys.argv[1], float(sys.argv[2]) if len(sys.argv) > 2 else 12
b = next(x for x in json.loads((BASE / 'walk.json').read_text())['blocks'] if x['id'] == bid)
start = max(0, b['duration'] - back)
raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(start), '-i', str(BASE / b['audio']), '-ac', '1', '-ar', '16000', '-f', 's16le', '-'],
                     capture_output=True, check=True).stdout
s = struct.unpack('<%dh' % (len(raw) // 2), raw[:len(raw) // 2 * 2])
print(f"{bid} duration {b['duration']}s; text ends: …{b['speech'][-80:]}")
for i in range(0, len(s), 4000):
    seg = s[i:i + 4000]
    db = 20 * math.log10(math.sqrt(sum(x * x for x in seg) / max(1, len(seg))) / 32768 + 1e-9)
    print(f"{start + i / 16000:6.2f}s {db:6.1f} " + '#' * max(0, int((db + 60) / 2)))
