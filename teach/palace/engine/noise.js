// Deterministic 2D noise shared by the world model, the terrain workers, and the Node build.

const perm = new Uint8Array(512);
{
  let s = 1337;
  const rand = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const p = Array.from({ length: 256 }, (_, i) => i);
  for (let i = 255; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; }
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
}
const G = [[1, 1], [-1, 1], [1, -1], [-1, -1], [1, 0], [-1, 0], [0, 1], [0, -1]];
const F2 = 0.5 * (Math.sqrt(3) - 1), G2 = (3 - Math.sqrt(3)) / 6;

export function simplex(x, y) {
  const s = (x + y) * F2;
  const i = Math.floor(x + s), j = Math.floor(y + s);
  const t = (i + j) * G2;
  const x0 = x - (i - t), y0 = y - (j - t);
  const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
  const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2;
  const x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
  const ii = i & 255, jj = j & 255;
  let n = 0;
  let t0 = 0.5 - x0 * x0 - y0 * y0;
  if (t0 > 0) { const g = G[perm[ii + perm[jj]] & 7]; t0 *= t0; n += t0 * t0 * (g[0] * x0 + g[1] * y0); }
  let t1 = 0.5 - x1 * x1 - y1 * y1;
  if (t1 > 0) { const g = G[perm[ii + i1 + perm[jj + j1]] & 7]; t1 *= t1; n += t1 * t1 * (g[0] * x1 + g[1] * y1); }
  let t2 = 0.5 - x2 * x2 - y2 * y2;
  if (t2 > 0) { const g = G[perm[ii + 1 + perm[jj + 1]] & 7]; t2 *= t2; n += t2 * t2 * (g[0] * x2 + g[1] * y2); }
  return 70 * n; // ~[-1, 1]
}

export function fbm(x, y, oct = 5) {
  let a = 0.5, f = 1, sum = 0, norm = 0;
  for (let o = 0; o < oct; o++) { sum += a * simplex(x * f, y * f); norm += a; a *= 0.5; f *= 2.03; }
  return sum / norm;
}

export function ridged(x, y, oct = 5) {
  let a = 0.5, f = 1, sum = 0, norm = 0, w = 1;
  for (let o = 0; o < oct; o++) {
    let n = 1 - Math.abs(simplex(x * f, y * f));
    n *= n * w; w = Math.min(1, n * 1.6);
    sum += a * n; norm += a; a *= 0.5; f *= 2.1;
  }
  return sum / norm; // ~[0, 1]
}

// cellular (Worley F1) noise: distance to the nearest jittered feature point, ~[0, 1]
export function worley(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y);
  let best = 9;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = xi + i, cy = yi + j;
    const h = hash2(cx, cy);
    const dx = cx + h[0] - x, dy = cy + h[1] - y;
    best = Math.min(best, dx * dx + dy * dy);
  }
  return Math.sqrt(best);
}

export function hash2(x, y) {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  const a = ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  h = Math.imul(h ^ 0x9e3779b9, 1597334677);
  return [a, ((h ^ (h >>> 15)) >>> 0) / 4294967296];
}

export const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const mix = (a, b, t) => a + (b - a) * t;
export const clamp = (x, a, b) => Math.min(b, Math.max(a, x));

export function terrace(h, step, sharp = 0.72) {
  const t = h / step, f = Math.floor(t), fr = t - f;
  return step * (f + smoothstep(sharp, 0.98, fr) + 0.08 * fr);
}

// seeded PRNG (mulberry32)
export function rng(seed) {
  let a = seed | 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

export const lin = (c) => Math.pow(c, 2.2);
export const C = (r, g, b) => [lin(r), lin(g), lin(b)];
