// Height field, path, and biome colouring for the palace prototype.
// World axes: x runs along the walk (forest at -x, desert at +x), z is lateral, y is up.

// ---------- noise ----------
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

function ridged(x, y, oct = 5) {
  let a = 0.5, f = 1, sum = 0, norm = 0, w = 1;
  for (let o = 0; o < oct; o++) {
    let n = 1 - Math.abs(simplex(x * f, y * f));
    n *= n * w; w = Math.min(1, n * 1.6);
    sum += a * n; norm += a; a *= 0.5; f *= 2.1;
  }
  return sum / norm; // ~[0, 1]
}

export const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
export const mix = (a, b, t) => a + (b - a) * t;

// ---------- layout ----------
export const X0 = -480, X1 = 330;                  // walk extent along x
export const zc = (x) => 35 * Math.sin(x / 150) + 14 * Math.sin(x / 53 + 1.3); // valley / river centreline
export const biome = (x) => smoothstep(-70, 90, x); // 0 forest -> 1 desert
export const WATER_END = -5;                          // river sinks into the sand past here
const floorH = (x) => -0.03 * x;
export const waterLevel = (x) => floorH(x) - 0.55;

function terrace(h, step) {
  const t = h / step, f = Math.floor(t), fr = t - f;
  return step * (f + smoothstep(0.72, 0.98, fr) + 0.08 * fr);
}

function rawHeight(x, z) {
  const d = z - zc(x), ad = Math.abs(d), b = biome(x);
  let forest = 0, desert = 0;
  if (b < 1) {
    const wall = Math.pow(smoothstep(24, 420, ad), 1.3) * 230;
    const r = ridged(x * 0.0022 + 3.1, z * 0.0022 - 1.7, 6);
    forest = wall * (0.55 + 0.75 * r)
      + fbm(x * 0.006, z * 0.006, 4) * 14 * smoothstep(14, 90, ad)
      + fbm(x * 0.05, z * 0.05, 3) * 0.6;
    forest -= (1 - smoothstep(3.5, 10.5, ad)) * 2.6; // river channel
  }
  if (b > 0) {
    const m = fbm(x * 0.0032 + 7.1, z * 0.0032 - 3.3, 4) * 0.5 + 0.5;
    const mask = smoothstep(30, 150, ad);
    const massif = m * m * 190 * mask + ad * 0.04 + smoothstep(250, 700, ad) * 90;
    desert = terrace(massif, 13)
      + fbm(x * 0.02, z * 0.02, 3) * 1.3 * (1 - mask * 0.7)
      + fbm(x * 0.12, z * 0.12, 2) * 0.25;
    desert -= (1 - smoothstep(2, 13, ad)) * 1.1; // dry wash
  }
  return mix(forest, desert, b) + floorH(x);
}

// Route: the trail follows contour lines. A target elevation profile (above the local valley
// floor) is chosen first — riverside meadow, a long climb onto the valley wall, a high
// traverse, a descent into the desert wash, a short climb onto the mesa benches — and at
// each x the trail sits at the lateral offset where the terrain reaches that elevation.
const LIFT_KEYS = [[-560, 0], [-420, 0], [-250, 30], [-190, 36], [-120, 34], [150, 0], [215, 0], [330, 11], [420, 14]];
function keyed(keys, x) {
  if (x <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [xa, a] = keys[i], [xb, b] = keys[i + 1];
    if (x <= xb) { let t = (x - xa) / (xb - xa); t = t * t * (3 - 2 * t); return a + (b - a) * t; }
  }
  return keys[keys.length - 1][1];
}
const RP0 = -620, RP1 = 480;
const offTable = (() => {
  const n = RP1 - RP0 + 1, raw = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = RP0 + i, lift = keyed(LIFT_KEYS, x);
    const base = rawHeight(x, zc(x) + 15);
    let off = 15;
    if (lift > 0.5) {
      const target = base + lift;
      off = 330;
      for (let o = 15; o <= 330; o += 0.5) if (rawHeight(x, zc(x) + o) >= target) { off = o; break; }
    }
    raw[i] = off;
  }
  // smooth, then limit how fast the trail can swing sideways
  const out = new Float32Array(n), sig = 9, win = 27;
  for (let i = 0; i < n; i++) {
    let s = 0, ws = 0;
    for (let k = -win; k <= win; k++) { const j = Math.min(n - 1, Math.max(0, i + k)), w = Math.exp(-(k * k) / (2 * sig * sig)); s += raw[j] * w; ws += w; }
    out[i] = s / ws;
  }
  for (let pass = 0; pass < 3; pass++) {
    for (let i = 1; i < n; i++) out[i] = Math.min(out[i - 1] + 1.4, Math.max(out[i - 1] - 1.4, out[i]));
    for (let i = n - 2; i >= 0; i--) out[i] = Math.min(out[i + 1] + 1.4, Math.max(out[i + 1] - 1.4, out[i]));
  }
  return out;
})();
export function pathOffset(x) {
  const g = Math.min(RP1 - RP0 - 1, Math.max(0, x - RP0)), i = Math.floor(g), f = g - i;
  return offTable[i] * (1 - f) + offTable[i + 1] * f;
}
export const pathZ = (x) => zc(x) + pathOffset(x);
// perpendicular distance to the trail (the trail runs diagonally on the climbs)
export function pathDist(x, z) {
  const k = (pathZ(x + 0.5) - pathZ(x - 0.5));
  return Math.abs(z - pathZ(x)) / Math.sqrt(1 + k * k);
}
// Trail elevation: the natural height along the route, heavily smoothed so the climb is a
// steady grade; the terrain is then cut and filled to meet it across a shoulder.
const PY0 = X0 - 80, PY1 = X1 + 80, MAX_GRADE = 0.16;
const pathYTable = (() => {
  // sample per metre of x, but smooth and grade-limit per metre of trail
  const n = PY1 - PY0 + 1, raw = new Float32Array(n), S = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = PY0 + i; raw[i] = rawHeight(x, pathZ(x));
    if (i) S[i] = S[i - 1] + Math.hypot(1, pathZ(x) - pathZ(x - 1));
  }
  const out = new Float32Array(n), sig = 10;
  let lo = 0, hi = 0;
  for (let i = 0; i < n; i++) {
    while (S[i] - S[lo] > 3 * sig) lo++;
    while (hi < n - 1 && S[hi + 1] - S[i] <= 3 * sig) hi++;
    let sum = 0, ws = 0;
    for (let j = lo; j <= hi; j++) { const d = S[j] - S[i], w = Math.exp(-(d * d) / (2 * sig * sig)) * (S[Math.min(n - 1, j + 1)] - S[Math.max(0, j - 1)]); sum += raw[j] * w; ws += w; }
    out[i] = sum / ws;
  }
  // limit grade: relax toward the smoothed profile under a max-slope constraint (both directions)
  for (let pass = 0; pass < 4; pass++) {
    for (let i = 1; i < n; i++) { const m = MAX_GRADE * (S[i] - S[i - 1]); out[i] = Math.min(out[i - 1] + m, Math.max(out[i - 1] - m, out[i])); }
    for (let i = n - 2; i >= 0; i--) { const m = MAX_GRADE * (S[i + 1] - S[i]); out[i] = Math.min(out[i + 1] + m, Math.max(out[i + 1] - m, out[i])); }
  }
  return out;
})();
export function pathY(x) {
  const g = Math.min(PY1 - PY0 - 1, Math.max(0, x - PY0)), i = Math.floor(g), f = g - i;
  return pathYTable[i] * (1 - f) + pathYTable[i + 1] * f;
}

export function height(x, z) {
  const h = rawHeight(x, z);
  const dp = pathDist(x, z);
  if (dp > 10) return h;
  const w = 1 - smoothstep(1.6, 9, dp);
  return mix(h, pathY(x) - 0.08, w);
}

export const trailWeight = (x, z) => 1 - smoothstep(0.9, 2.4, pathDist(x, z));

// ---------- colour (linear RGB) ----------
const lin = (c) => Math.pow(c, 2.2);
const C = (r, g, b) => [lin(r), lin(g), lin(b)];
const PAL = {
  grassA: C(0.24, 0.33, 0.12), grassB: C(0.36, 0.40, 0.15), grassDry: C(0.52, 0.47, 0.26),
  forestFloor: C(0.20, 0.22, 0.11), rock: C(0.40, 0.39, 0.36), rockDark: C(0.27, 0.26, 0.25),
  snow: C(0.92, 0.93, 0.95), mud: C(0.22, 0.18, 0.13), dirt: C(0.42, 0.33, 0.23),
  sand: C(0.80, 0.62, 0.44), sandPale: C(0.86, 0.74, 0.58),
  red: C(0.58, 0.24, 0.12), orange: C(0.70, 0.38, 0.19), cream: C(0.78, 0.62, 0.45), maroon: C(0.40, 0.17, 0.11),
};
const mix3 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

export function colorAt(x, z, h, ny) {
  const b = biome(x), d = Math.abs(z - zc(x));
  const slope = 1 - ny; // 0 flat .. 1 vertical
  const n1 = fbm(x * 0.02, z * 0.02, 3) * 0.5 + 0.5;
  const n2 = fbm(x * 0.15 + 9, z * 0.15, 2) * 0.5 + 0.5;

  // forest
  let f = mix3(PAL.grassA, PAL.grassB, n1);
  f = mix3(f, PAL.grassDry, smoothstep(0.55, 0.9, n2) * 0.35);
  f = mix3(f, PAL.forestFloor, smoothstep(30, 120, d) * 0.6);
  const rockF = mix3(PAL.rock, PAL.rockDark, n2);
  f = mix3(f, rockF, smoothstep(0.28, 0.45, slope + (n1 - 0.5) * 0.12));
  f = mix3(f, PAL.rock, smoothstep(150, 200, h + n1 * 30) * 0.8);
  f = mix3(f, PAL.snow, smoothstep(215, 240, h + n1 * 25) * smoothstep(0.55, 0.3, slope));
  f = mix3(f, PAL.mud, 1 - smoothstep(6, 11, d));

  // desert
  const band = Math.sin(h * 0.85 + n1 * 3) * 0.5 + 0.5, band2 = Math.sin(h * 2.3 + n2 * 2) * 0.5 + 0.5;
  let strata = mix3(PAL.red, PAL.orange, band);
  strata = mix3(strata, PAL.cream, smoothstep(0.75, 0.95, band2) * 0.7);
  strata = mix3(strata, PAL.maroon, smoothstep(0.8, 1.0, 1 - band) * 0.5);
  let dz = mix3(PAL.sand, PAL.sandPale, n2 * 0.7);
  dz = mix3(dz, PAL.orange, smoothstep(0.4, 0.8, n1) * 0.25);
  dz = mix3(dz, strata, smoothstep(0.22, 0.4, slope));

  let c = mix3(f, dz, b);
  c = mix3(c, mix3(PAL.dirt, PAL.sandPale, b * 0.6), trailWeight(x, z) * 0.85);
  return c;
}

// ---------- texture splatting ----------
// Layers (index into the ground texture array):
//   0 meadow · 1 forest floor · 2 rock face · 3 sand · 4 trail · 5 desert rock
// Returns 6 weights (sum 1), a colour tint (linear RGB, applied to the mean-normalised
// texture) and a snow amount.
export const LAYER_COLORS = [
  C(0.32, 0.36, 0.16), C(0.28, 0.23, 0.16), C(0.33, 0.32, 0.30),
  C(0.70, 0.50, 0.34), C(0.42, 0.35, 0.27), C(0.62, 0.34, 0.20),
];

export function surfaceAt(x, z, h, ny) {
  const b = biome(x), d = Math.abs(z - zc(x)), slope = 1 - ny;
  const n1 = fbm(x * 0.02, z * 0.02, 3) * 0.5 + 0.5;
  const n2 = fbm(x * 0.07 + 9, z * 0.07, 2) * 0.5 + 0.5;

  let rock = smoothstep(0.25, 0.4, slope + (n1 - 0.5) * 0.12);
  rock = Math.max(rock, smoothstep(165, 215, h + n1 * 30) * 0.85);
  const floor = smoothstep(22, 70, d + (n2 - 0.5) * 50) * smoothstep(8, 40, pathDist(x, z) + (n1 - 0.5) * 20);
  const f = [(1 - floor) * (1 - rock), floor * (1 - rock), rock];

  const dRock = smoothstep(0.18, 0.34, slope + (n2 - 0.5) * 0.08);
  const w = [f[0] * (1 - b), f[1] * (1 - b), f[2] * (1 - b), (1 - dRock) * b, 0, dRock * b];

  const bank = (1 - smoothstep(7, 11, d)) * (1 - b);        // wet river bank
  const tr = Math.max(trailWeight(x, z) * 0.95, bank * 0.8);
  for (let i = 0; i < 6; i++) w[i] *= 1 - tr;
  w[4] += tr;

  // hue drift; desert-rock strata are computed per pixel in the ground shader
  const drift = 0.88 + 0.24 * n2;
  let tint = [drift, drift, drift];
  if (bank > 0) tint = tint.map((v) => v * (1 - bank * 0.45));

  const snow = smoothstep(215, 245, h + n1 * 25) * (1 - b) * smoothstep(0.6, 0.35, slope);
  return { w, tint, snow };
}

// Grass mask: [lush density, dry-tuft density]
export function grassAt(x, z) {
  const b = biome(x), d = Math.abs(z - zc(x));
  const n = fbm(x * 0.045 + 2, z * 0.045 - 5, 3) * 0.5 + 0.5;
  const n2 = fbm(x * 0.2, z * 0.2, 2) * 0.5 + 0.5;
  let lush = (1 - b) * smoothstep(9.5, 12, d) * Math.max(1 - smoothstep(35, 90, d), 1 - smoothstep(14, 45, pathDist(x, z))) * smoothstep(0.2, 0.55, n);
  let dry = b * smoothstep(0.55, 0.8, n2) * 0.5 + (1 - b) * smoothstep(60, 120, d) * 0.25;
  const tw = trailWeight(x, z);
  lush *= 1 - smoothstep(0.1, 0.5, tw);
  dry *= 1 - smoothstep(0.05, 0.3, tw);
  return [lush, dry];
}
