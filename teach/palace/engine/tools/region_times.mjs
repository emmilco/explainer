// Print the walk time (s) at given fractions through each region, for screenshot review.
// Usage: node region_times.mjs <walk-dir> [fractions, default 0.5]
import fs from 'node:fs';
import path from 'node:path';

const plan = JSON.parse(fs.readFileSync(path.join(process.argv[2], 'plan.json'), 'utf8'));
const fr = (process.argv[3] || '0.5').split(',').map(Number);
const arcAtX = (x) => { const i = plan.curve.findIndex((p) => p[0] >= x); return plan.arc[i < 0 ? plan.arc.length - 1 : i]; };
const tAtS = (s) => { const i = plan.s.findIndex((v) => v >= s); return (i < 0 ? plan.s.length - 1 : i) * plan.dt; };
const out = [];
for (const r of plan.regions) for (const f of fr) out.push(Math.round(tAtS(arcAtX(r.x0 + (r.x1 - r.x0) * f))));
console.log(plan.regions.map((r) => r.type).join(' '));
console.log(out.join(','));
