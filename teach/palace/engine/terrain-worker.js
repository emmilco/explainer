// Terrain worker: builds tile meshes (positions, normals, splat weights, tint, snow), scatters
// vegetation instances for a tile, and bakes the camera-local grass field. Stateless apart
// from the world model, which is built once from the spec + precomputed route tables.
import { makeWorld } from './world.js';
import { NLAYERS } from './layers.js';
import { rng, fbm, smoothstep } from './noise.js';

let W = null, clear = [], tall = [];

function slopeAt(x, z, e = 1) {
  const dx = W.height(x + e, z) - W.height(x - e, z), dz = W.height(x, z + e) - W.height(x, z - e);
  return 1 - 1 / Math.sqrt(1 + (dx * dx + dz * dz) / (4 * e * e));
}

function buildTile({ x0, z0, size, res, flora }) {
  const n = Math.round(size / res) + 1, N = n * n;
  const pos = new Float32Array(N * 3), nrm = new Float32Array(N * 3), tint = new Float32Array(N * 3), snow = new Float32Array(N);
  const wts = new Float32Array(N * NLAYERS);
  // heights on a grid with a one-sample border for normals
  const m = n + 2, H = new Float32Array(m * m);
  for (let j = 0; j < m; j++) for (let i = 0; i < m; i++) H[j * m + i] = W.height(x0 + (i - 1) * res, z0 + (j - 1) * res);
  let k = 0;
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++, k++) {
    const x = x0 + i * res, z = z0 + j * res, h = H[(j + 1) * m + i + 1];
    const hx = H[(j + 1) * m + i + 2] - H[(j + 1) * m + i], hz = H[(j + 2) * m + i + 1] - H[j * m + i + 1];
    let nx = -hx, ny = 2 * res, nz = -hz; const l = Math.hypot(nx, ny, nz); nx /= l; ny /= l; nz /= l;
    pos[k * 3] = x; pos[k * 3 + 1] = h; pos[k * 3 + 2] = z;
    nrm[k * 3] = nx; nrm[k * 3 + 1] = ny; nrm[k * 3 + 2] = nz;
    const s = W.surface(x, z, h, ny);
    wts.set(s.w, k * NLAYERS);
    tint[k * 3] = s.tint[0]; tint[k * 3 + 1] = s.tint[1]; tint[k * 3 + 2] = s.tint[2];
    snow[k] = s.snow;
  }
  const idx = new Uint32Array((n - 1) * (n - 1) * 6);
  let q = 0;
  for (let j = 0; j < n - 1; j++) for (let i = 0; i < n - 1; i++) {
    const a = j * n + i, b = a + 1, c = a + n, d = c + 1;
    idx[q++] = a; idx[q++] = c; idx[q++] = b; idx[q++] = b; idx[q++] = c; idx[q++] = d;
  }
  const out = { pos, nrm, tint, snow, wts, idx, n };
  if (flora) out.flora = scatter(x0, z0, size);
  return out;
}

// clear zones: stops, vignettes, sightlines (segments with radius) — no vegetation inside
function blocked(x, z, r = 0) {
  for (const c of clear) {
    if (c.seg) {
      const [ax, az, bx, bz] = c.seg, abx = bx - ax, abz = bz - az;
      const t = Math.max(0, Math.min(1, ((x - ax) * abx + (z - az) * abz) / (abx * abx + abz * abz)));
      if (Math.hypot(x - ax - abx * t, z - az - abz * t) < c.r + r) return true;
    } else if (Math.hypot(x - c.x, z - c.z) < c.r + r) return true;
  }
  return false;
}

// the open slope between a raised trail and the valley floor stays mostly clear for the view
function belowView(x, z) {
  return W.pathOffset(x) > 45 && z < W.pathZ(x) - 3 && z > W.zc(x) + 12 && W.pathZ(x) - z < 170;
}

function scatter(x0, z0, size) {
  const r = rng(((x0 * 73856093) ^ (z0 * 19349663)) | 0);
  const lists = {}; // key "kind:variant" -> flat array [x, y, z, yaw, h, wide, shade]
  const push = (key, a) => { (lists[key] = lists[key] || []).push(...a); };
  const area = size * size;
  const K = 0.03; // candidates per m²; each flora entry may reach K / flora.length
  const cand = Math.round(area * K);
  for (let c = 0; c < cand; c++) {
    const x = x0 + r() * size, z = z0 + r() * size;
    const ws = W.weights(x);
    // pick a region for this candidate by weight
    let u = r(), reg = ws[0][0];
    for (const [rg, w] of ws) { if (u < w) { reg = rg; break; } u -= w; }
    const flora = reg.mod.flora || [];
    if (!flora.length) continue;
    const f = flora[Math.floor(r() * flora.length)];
    const d = z - W.zc(x), h = W.rawHeight(x, z) - W.floorH(x), sl = slopeAt(x, z);
    const dens = f.density(x, z, d, h, sl, W.frac(reg, x)) * flora.length;
    if (r() * K > dens) continue;
    const pd = W.pathDist(x, z);
    const minPath = f.kind === 'tree' ? 5 : f.kind === 'rock' ? 3.5 : 2.5;
    if (pd < minPath) continue;
    if (W.riverAmount(x) > 0.5 && Math.abs(d) < (f.kind === 'rock' ? 7 : 11)) continue;
    if (f.kind === 'tree' && belowView(x, z) && r() > 0.07) continue;
    if (blocked(x, z, f.kind === 'tree' ? 0 : -3)) continue;
    const v = f.variants ? f.variants[Math.floor(r() * f.variants.length)] : f.layer;
    const s = f.size[0] + (f.size[1] - f.size[0]) * (f.kind === 'rock' ? r() * r() : r());
    const wide = f.wide ? f.wide[0] + (f.wide[1] - f.wide[0]) * r() : 1;
    const y = W.height(x, z) - (f.kind === 'rock' ? s * (0.25 + sl * 0.8) : f.kind === 'tree' ? 0.3 : 0.1);
    push(`${f.kind}:${v}`, [x, y, z, r() * 6.283, s, wide, 0.78 + 0.3 * r()]);
  }
  const out = {};
  for (const k in lists) out[k] = new Float32Array(lists[k]);
  return out;
}

function bakeField({ cx, cz, size, step }) {
  const n = Math.round(size / step) + 1, x0 = cx - size / 2, z0 = cz - size / 2;
  const hts = new Float32Array(n * n), mask = new Uint8Array(n * n * 4);
  for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const x = x0 + i * step, z = z0 + j * step, k = j * n + i;
    hts[k] = W.height(x, z);
    let [lush, dry] = W.grass(x, z);
    let tl = 0;
    for (const v of tall) {
      const dd = Math.hypot(x - v.x, z - v.z) + fbm(x * 0.3, z * 0.3, 2) * 2;
      tl = Math.max(tl, 1 - smoothstep(v.r * 0.6, v.r, dd));
    }
    if (tl > 0) lush = Math.max(lush, tl);
    mask[k * 4] = Math.round(Math.min(1, lush) * 255); mask[k * 4 + 1] = Math.round(Math.min(1, dry) * 255); mask[k * 4 + 2] = Math.round(tl * 255);
  }
  return { hts, mask, n, x0, z0, step };
}

self.onmessage = (e) => {
  const m = e.data;
  if (m.type === 'init') { W = makeWorld(m.spec, m.tables); clear = m.clear || []; tall = m.tall || []; self.postMessage({ type: 'ready' }); return; }
  if (m.type === 'tile') {
    const t = buildTile(m);
    const transfer = [t.pos.buffer, t.nrm.buffer, t.tint.buffer, t.snow.buffer, t.wts.buffer, t.idx.buffer];
    if (t.flora) for (const k in t.flora) transfer.push(t.flora[k].buffer);
    self.postMessage({ type: 'tile', key: m.key, ...t }, transfer);
    return;
  }
  if (m.type === 'field') {
    const f = bakeField(m);
    self.postMessage({ type: 'field', id: m.id, ...f }, [f.hts.buffer, f.mask.buffer]);
  }
};
