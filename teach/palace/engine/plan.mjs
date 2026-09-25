// Walk planner (Node). Turns a narration timeline + a region sequence into a complete walk plan:
// region lengths (iterated so each unit's narration plays inside its region), route tables,
// stop placements and choreography, vignettes, vistas, glances, and the time→distance table.
//
//   node plan.mjs <walk-dir>      reads <walk-dir>/walk.config.json + walk.json, writes plan.json
import fs from 'node:fs';
import path from 'node:path';
import { makeWorld, EYE } from './world.js';
import { rng, smoothstep } from './noise.js';

const dir = path.resolve(process.argv[2]);
const cfg = JSON.parse(fs.readFileSync(path.join(dir, 'walk.config.json'), 'utf8'));
const walk = JSON.parse(fs.readFileSync(path.join(dir, 'walk.json'), 'utf8'));
const R = rng(cfg.seed ?? 7);
const V0 = cfg.speed ?? 1.8, HOLD = cfg.hold ?? 15, GAP = cfg.gap ?? 0.8, UNIT_GAP = cfg.unitGap ?? 2.5, PREROLL = cfg.preroll ?? 8;

// ---------- 1. timeline ----------
const blocks = walk.blocks.map((b) => ({ id: b.id, unit: b.unit, dur: b.duration, audio: b.audio, stop: b.stop }));
let t = PREROLL;
blocks.forEach((b, i) => {
  if (i > 0) t += blocks[i - 1].unit === b.unit ? GAP : UNIT_GAP;
  b.t0 = t; t += b.dur;
});
const END = t + 25; // walk on a little after the last word

// stops: arrive as the block ends; hold while the next block begins
const stops = [];
blocks.forEach((b, i) => { if (b.stop) stops.push({ block: b.id, unit: b.unit, tArrive: b.t0 + b.dur, ...b.stop }); });
stops.forEach((s, i) => {
  const next = stops[i + 1]?.tArrive ?? END;
  s.hold = Math.min(HOLD, Math.max(6, (next - s.tArrive) * 0.3));
  s.tDepart = s.tArrive + s.hold;
});

// walking segments between stop departures and arrivals
const segs = [];
{
  let tPrev = 0;
  for (const s of stops) { segs.push({ t0: tPrev, t1: s.tArrive, stopAfter: s }); tPrev = s.tDepart; }
  segs.push({ t0: tPrev, t1: END, stopAfter: null });
}
// vignettes: roughly every other walking stretch of 40 s or more, around its middle
const vigTimes = [];
segs.forEach((g, i) => {
  const w = g.t1 - g.t0;
  if (w >= 30 && R() < 0.75) vigTimes.push({ t: g.t0 + w * (0.4 + 0.25 * R()), notice: R() < 0.55 });
});

// speed as a function of time: drift, ramps into/out of stops, slowdowns at noticed vignettes
function speedAt(tt) {
  let v = V0 * (1 + 0.13 * Math.sin(tt * 0.021 + 0.7) + 0.07 * Math.sin(tt * 0.061 + 2.1));
  for (const g of segs) {
    if (tt < g.t0 || tt > g.t1) continue;
    const a = Math.min(1, (tt - g.t0) / 4.5), b = g.stopAfter ? Math.min(1, (g.t1 - tt) / 4.5) : 1;
    v *= smoothstep(0, 1, a) * smoothstep(0, 1, b);
    break;
  }
  if (stops.some((s) => tt > s.tArrive && tt < s.tDepart)) return 0;
  for (const vt of vigTimes) if (vt.notice) { const d = (tt - vt.t) / 2.8; if (Math.abs(d) < 4) v *= 1 - 0.8 * Math.exp(-d * d); }
  return v;
}
const DT = 0.25, NT = Math.ceil(END / DT) + 1, S = new Float32Array(NT);
for (let i = 1; i < NT; i++) S[i] = S[i - 1] + 0.5 * (speedAt((i - 1) * DT) + speedAt(i * DT)) * DT;
const sAt = (tt) => { const g = Math.min(NT - 1.001, Math.max(0, tt / DT)), i = Math.floor(g); return S[i] + (S[i + 1] - S[i]) * (g - i); };
const LEN = S[NT - 1];
console.log(`timeline ${(END / 60).toFixed(1)} min, route length needed ${(LEN / 1000).toFixed(2)} km, ${stops.length} stops, ${vigTimes.length} vignettes`);

// ---------- 2. regions sized so each unit plays inside its region (iterate x ↔ arc length) ----------
const unitOrder = [...new Set(blocks.map((b) => b.unit))];
const unitSpan = Object.fromEntries(unitOrder.map((u) => {
  const bs = blocks.filter((b) => b.unit === u);
  return [u, [sAt(bs[0].t0), sAt(bs[bs.length - 1].t0 + bs[bs.length - 1].dur)]];
}));
const regionUnits = cfg.regions; // [{ type, units: [...] }]
// region boundaries start at each region's first unit, then are pushed forward so that every
// region spans at least MIN metres of trail (a short unit's region runs on into the next unit)
const MIN = cfg.minRegion ?? 650;
const bounds = regionUnits.map((r, i) => (i === 0 ? 0 : unitSpan[r.units[0]][0]));
bounds.push(LEN);
for (let i = 1; i < bounds.length - 1; i++) bounds[i] = Math.max(bounds[i], bounds[i - 1] + MIN);
for (let i = bounds.length - 2; i > 0; i--) bounds[i] = Math.min(bounds[i], bounds[i + 1] - MIN * 0.6);
const regionS = regionUnits.map((r, i) => [bounds[i], bounds[i + 1]]);
let lengths = regionS.map(([a, b]) => (b - a) * 0.9);
let W, curve, arc;
for (let iter = 0; iter < 4; iter++) {
  W = makeWorld({ transition: cfg.transition ?? 180, regions: regionUnits.map((r, i) => ({ type: r.type, length: Math.round(lengths[i]) })) });
  ({ curve, arc } = sampleCurve(W));
  const total = arcAtX(W.X1);
  console.log(`iter ${iter}: route ${(total / 1000).toFixed(2)} km for ${(LEN / 1000).toFixed(2)} needed`);
  // rescale each region's x-length by how much arc it produced vs. how much it needs
  lengths = lengths.map((L, i) => {
    const x0 = W.regions[i].x0, x1 = W.regions[i].x1;
    const sA = arcAtX(x0), sB = arcAtX(x1), need = regionS[i][1] - regionS[i][0];
    return Math.max(200, L * need / Math.max(1, sB - sA));
  });
  if (Math.abs(total - LEN) < 30) break;
}
function arcAtX(x) { let i = curve.findIndex((p) => p[0] >= x); if (i < 0) i = curve.length - 1; return arc[i]; }

function sampleCurve(Wd) {
  const pts = [], cum = [0];
  let last = null;
  for (let x = Wd.X0; x <= Wd.X1 + 400; x += 0.25) {
    const q = [x, Wd.pathY(x) + EYE, Wd.pathZ(x)];
    if (!last || Math.hypot(q[0] - last[0], q[1] - last[1], q[2] - last[2]) >= 3) {
      if (last) cum.push(cum[cum.length - 1] + Math.hypot(q[0] - last[0], q[1] - last[1], q[2] - last[2]));
      pts.push(q); last = q;
    }
  }
  return { curve: pts, arc: cum };
}
function pointAt(s) {
  let i = 1; while (i < arc.length - 1 && arc[i] < s) i++;
  const f = (s - arc[i - 1]) / Math.max(1e-6, arc[i] - arc[i - 1]);
  const a = curve[i - 1], b = curve[i];
  const p = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  let tx = b[0] - a[0], tz = b[2] - a[2]; const l = Math.hypot(tx, tz); tx /= l; tz /= l;
  return { p, t: [tx, 0, tz], n: [-tz, 0, tx] }; // n points toward +d (uphill on a lifted trail)
}
const add = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];

// ---------- 3. stops ----------
const clear = [];
const ground = (x, z) => W.height(x, z);
function flatSpot(p, n, t, side, off, along) {
  const q = add(add(p, n, side * off), t, along);
  const y = ground(q[0], q[2]);
  const e = 1.2, sl = Math.hypot(ground(q[0] + e, q[2]) - ground(q[0] - e, q[2]), ground(q[0], q[2] + e) - ground(q[0], q[2] - e)) / (2 * e);
  return { q: [q[0], y, q[2]], ok: Math.abs(y - (p[1] - EYE)) < 1.6 && sl < 0.35, sl };
}
function march(o, dir, maxD = 140) {
  for (let d = 8; d < maxD; d += 0.5) {
    const x = o[0] + dir[0] * d, y = o[1] + dir[1] * d, z = o[2] + dir[2] * d;
    if (y < ground(x, z)) {
      const e = 0.6, nx = ground(x - e, z) - ground(x + e, z), nz = ground(x, z - e) - ground(x, z + e), l = Math.hypot(nx, 2 * e, nz);
      return { point: [x, y, z], normal: [nx / l, 2 * e / l, nz / l], dist: d };
    }
  }
  return null;
}
const MOVES = ['orbit', 'pan', 'approach', 'pan', 'orbit'];
// a projection surface must be close to planar over the image's footprint
function flatFace(hit) {
  const nAt = (x, z) => { const e = 0.6, nx = ground(x - e, z) - ground(x + e, z), nz = ground(x, z - e) - ground(x, z + e), l = Math.hypot(nx, 2 * e, nz); return [nx / l, 2 * e / l, nz / l]; };
  const [px, , pz] = hit.point, n0 = hit.normal, side = [-n0[2], 0, n0[0]], sl = Math.hypot(side[0], side[2]) || 1;
  for (const k of [-5, -2.5, 2.5, 5]) {
    const x = px + side[0] / sl * k, z = pz + side[2] / sl * k, n = nAt(x, z);
    if (n[0] * n0[0] + n[1] * n0[1] + n[2] * n0[2] < 0.88) return false;
    if (Math.abs(ground(x, z) - ground(px, pz)) > 6) return false;
  }
  return true;
}
stops.forEach((s, i) => {
  s.s = sAt(s.tArrive);
  const { p, t, n } = pointAt(s.s);
  s.p = p;
  // try a rock face for a projected image every few stops
  let cliff = null;
  if (i % 4 === 2) {
    for (const side of [-1, 1]) for (const ang of [-0.5, -0.25, 0, 0.25, 0.5]) {
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const dx = (n[0] * ca + t[0] * sa) * side, dz = (n[2] * ca + t[2] * sa) * side, l = Math.hypot(dx, 0.06, dz);
      const hit = march([p[0], p[1] - 0.2, p[2]], [dx / l, 0.06 / l, dz / l]);
      if (hit && hit.normal[1] < 0.6 && hit.dist > 22 && flatFace(hit) && (!cliff || hit.dist < cliff.dist)) cliff = hit;
    }
  }
  if (cliff) {
    s.kind = 'cliff'; s.move = 'rise';
    s.cliff = cliff;
    s.focus = [cliff.point[0], cliff.point[1] + 2, cliff.point[2]];
    clear.push({ seg: [p[0], p[2], cliff.point[0], cliff.point[2]], r: 8 });
  } else {
    // easel + keyword letters on the side with level ground, preferring downhill (open view behind)
    let best = null;
    for (const side of [-1, 1]) for (const off of [5, 6.5, 4]) {
      const e = flatSpot(p, n, t, side, off, 2.5), k = flatSpot(p, n, t, side, off + 1.5, -2.5);
      const score = (e.ok ? 2 : 0) + (k.ok ? 1 : 0) + (side < 0 ? 0.5 : 0) - e.sl;
      if (!best || score > best.score) best = { score, side, e: e.q, k: k.q };
    }
    s.kind = 'easel'; s.move = MOVES[i % MOVES.length];
    s.easel = best.e; s.letters = best.k; s.side = best.side;
    s.focus = [(best.e[0] + best.k[0]) / 2, (best.e[1] + best.k[1]) / 2 + 1.1, (best.e[2] + best.k[2]) / 2];
    for (const q of [best.e, best.k]) { clear.push({ seg: [p[0], p[2], q[0], q[2]], r: 4 }); clear.push({ x: q[0], z: q[2], r: 9 }); }
  }
});

// ---------- 4. vignettes ----------
const vigs = [];
{
  const bag = {};
  for (const vt of vigTimes) {
    const s = sAt(vt.t), { p, t, n } = pointAt(s);
    const reg = W.regionAt(p[0]), cat = reg.mod.vignettes || [];
    if (!cat.length) continue;
    bag[reg.type] = bag[reg.type]?.length ? bag[reg.type] : [...cat].sort(() => R() - 0.5);
    const kind = bag[reg.type].pop();
    let placed = null;
    const tries = [];
    for (const off of [9, 12, 7, 15, 18]) for (const side of [-1, 1]) tries.push([side, off]);
    for (const [side, off] of tries) {
      const c = add(add(p, n, side * off), t, (R() - 0.5) * 6);
      const y = ground(c[0], c[2]);
      if (Math.abs(y - (p[1] - EYE)) < 4.5 && !(W.riverAmount(c[0]) > 0.5 && Math.abs(c[2] - W.zc(c[0])) < 14)) { placed = [c[0], y, c[2]]; break; }
    }
    if (!placed) continue;
    const r = { bigtree: 9, tallgrass: 8, hedgerow: 7, birches: 6, deadtree: 6, hoodoos: 6, daisies: 5, desertpoppies: 5, brittlebush: 5, hedgering: 5 }[kind] ?? 4;
    vigs.push({ kind, c: placed, r, t: vt.t, notice: vt.notice, seed: Math.floor(R() * 1e6) });
    clear.push({ x: placed[0], z: placed[2], r: r + (kind === 'bigtree' ? 6 : 2) });
  }
}

// ---------- 5. vistas and glances ----------
const vistas = [];
{
  const raw = [];
  for (let s = 0; s <= LEN; s += 8) {
    const { p, t } = pointAt(s);
    let best = { score: -9, target: add(p, t, 100) };
    for (let yaw = -110; yaw <= 110; yaw += 10) {
      if (Math.abs(yaw) < 20) continue;
      const a = yaw * Math.PI / 180, dx = t[0] * Math.cos(a) - t[2] * Math.sin(a), dz = t[0] * Math.sin(a) + t[2] * Math.cos(a);
      let d = 4, maxAng = -1, peak = null, hitD = null;
      while (d < 3200) {
        const x = p[0] + dx * d, z = p[2] + dz * d, h = ground(x, z), ang = Math.atan2(h - p[1], d);
        if (d > 250 && ang > maxAng) { maxAng = ang; peak = [x, h, z]; }
        if (hitD === null && ang > 0.035) hitD = d;
        d += 1 + d * 0.03;
      }
      let score = (hitD === null ? 1 : Math.min(1, hitD / 250)) * 0.6 + Math.max(0, maxAng) * 5;
      if (hitD !== null && hitD < 120) score -= 1.2 * (1 - hitD / 120);
      if (W.pathOffset(p[0]) > 45 && dz > 0.35) score -= 0.6;
      if (score > best.score && peak) best = { score, target: [peak[0], p[1] + (peak[1] - p[1]) * 0.75, peak[2]] };
    }
    raw.push(best);
  }
  for (let i = 0; i < raw.length; i++) {
    const tg = [0, 0, 0]; let ws = 0, sc = 0;
    for (let k = -3; k <= 3; k++) { const j = Math.min(raw.length - 1, Math.max(0, i + k)), w = Math.exp(-(k * k) / 4); tg[0] += raw[j].target[0] * w; tg[1] += raw[j].target[1] * w; tg[2] += raw[j].target[2] * w; sc += raw[j].score * w; ws += w; }
    vistas.push([+(tg[0] / ws).toFixed(1), +(tg[1] / ws).toFixed(1), +(tg[2] / ws).toFixed(1), +(sc / ws).toFixed(3)]);
  }
}
const glances = [];
for (const v of vigs) glances.push({ t0: v.t - (v.notice ? 4 : 2.5), t1: v.t + (v.notice ? 4.5 : 2.2), target: [v.c[0], v.c[1] + ({ bigtree: 6, hoodoos: 3, deadtree: 3, birches: 4 }[v.kind] ?? 0.5), v.c[2]], amt: v.notice ? 0.9 : 0.55 });
{
  const busy = (tt) => stops.some((s) => tt > s.tArrive - 14 && tt < s.tDepart + 8) || glances.some((g) => tt > g.t0 - 3 && tt < g.t1 + 3);
  for (let tt = 10; tt < END - 10; tt += 18 + 14 * R()) {
    const dur = 4.5 + 3 * R();
    if (busy(tt) || busy(tt + dur)) continue;
    const { p, t } = pointAt(sAt(tt + dur / 2)), side = R() < 0.5 ? -1 : 1, a = side * (0.55 + 0.8 * R());
    const dx = t[0] * Math.cos(a) - t[2] * Math.sin(a), dz = t[0] * Math.sin(a) + t[2] * Math.cos(a);
    const hit = march(p, [dx, 0.05, dz], 1500);
    if (hit && hit.dist < 140) continue;
    const target = hit ? [hit.point[0], hit.point[1] + hit.dist * 0.04, hit.point[2]] : add(p, [dx, 0.02, dz], 600);
    glances.push({ t0: tt, t1: tt + dur, target, amt: 0.55 + 0.3 * R() });
  }
}

// ---------- 6. write ----------
const round = (a) => a.map((v) => +v.toFixed(2));
const plan = {
  spec: W.spec, tables: W.tables, EYE, end: END, dt: DT,
  s: Array.from(S, (v) => +v.toFixed(2)),
  curve: curve.map(round), arc: arc.map((v) => +v.toFixed(2)),
  blocks: blocks.map((b) => ({ id: b.id, unit: b.unit, t0: +b.t0.toFixed(3), dur: b.dur, audio: b.audio })),
  stops: stops.map((s) => ({
    block: s.block, unit: s.unit, keyword: s.keyword, kind: s.kind, move: s.move, s: +s.s.toFixed(2),
    tArrive: +s.tArrive.toFixed(2), tDepart: +s.tDepart.toFixed(2), p: round(s.p), focus: round(s.focus),
    easel: s.easel && round(s.easel), letters: s.letters && round(s.letters),
    cliff: s.cliff && { point: round(s.cliff.point), normal: round(s.cliff.normal), dist: +s.cliff.dist.toFixed(1) },
  })),
  vignettes: vigs.map((v) => ({ ...v, c: round(v.c), t: +v.t.toFixed(2) })),
  vistas, vistaStep: 8, glances: glances.map((g) => ({ ...g, target: round(g.target), t0: +g.t0.toFixed(2), t1: +g.t1.toFixed(2) })),
  clear, regions: W.regions.map((r) => ({ type: r.type, x0: r.x0, x1: r.x1 })),
};
fs.writeFileSync(path.join(dir, 'plan.json'), JSON.stringify(plan));
console.log(`plan: ${plan.stops.length} stops (${plan.stops.filter((s) => s.kind === 'cliff').length} on rock faces), ${plan.vignettes.length} vignettes, ${plan.glances.length} glances; world ${(W.X1 / 1000).toFixed(2)} km of x; ${(fs.statSync(path.join(dir, 'plan.json')).size / 1e6).toFixed(1)} MB`);
for (const r of W.regions) console.log(`  ${r.type.padEnd(10)} x ${r.x0.toFixed(0)}–${r.x1.toFixed(0)}`);
