// World model: a sequence of regions along +x, blended at their boundaries, with a trail that
// follows contour lines. Pure and deterministic — the same code runs in the page, in the
// terrain workers, and in the Node build (which precomputes the route tables).
//
// Axes: x runs along the journey, z is lateral, y is up. Each region shapes terrain relative to
// the valley centreline zc(x); d = z − zc(x) is the lateral distance from it.
import { fbm, smoothstep, mix } from './noise.js';
import { L, NLAYERS } from './layers.js';
import { REGIONS } from './regions/index.js';

export const EYE = 1.7;

export function makeWorld(spec, tables = null) {
  const TR = spec.transition ?? 240;
  const regions = [];
  let x = 0;
  for (const r of spec.regions) {
    const mod = REGIONS[r.type];
    if (!mod) throw new Error(`unknown region type ${r.type}`);
    regions.push({ ...r, mod, x0: x, x1: x + r.length });
    x += r.length;
  }
  const X0 = 0, X1 = x;
  const PAD = 900; // world extends past both ends so the first and last views aren't empty

  // region weights at x: at most two regions overlap, across a transition of width TR
  function weights(x) {
    const out = [];
    for (let i = 0; i < regions.length; i++) {
      const r = regions[i];
      const a = i === 0 ? -1e9 : r.x0 - TR / 2, b = i === 0 ? -1e9 : r.x0 + TR / 2;
      const c = i === regions.length - 1 ? 1e9 : r.x1 - TR / 2, e = i === regions.length - 1 ? 1e9 : r.x1 + TR / 2;
      const w = smoothstep(a, b, x) * (1 - smoothstep(c, e, x));
      if (w > 1e-4) out.push([r, w]);
    }
    const s = out.reduce((a, [, w]) => a + w, 0) || 1;
    return out.map(([r, w]) => [r, w / s]);
  }
  const frac = (r, x) => (x - r.x0) / (r.x1 - r.x0);

  const zc = (x) => 60 * Math.sin(x / 430) + 24 * Math.sin(x / 137 + 1.3) + 9 * Math.sin(x / 53 + 0.4);
  function floorH(x) {
    let f = 0, amp = 0;
    for (const [r, w] of weights(x)) { f += w * (r.mod.floor ?? 0); amp += w * (r.mod.floorNoise ?? 1); }
    return f + fbm(x * 0.0015, 3.7, 3) * 14 * amp;
  }
  function rawHeight(x, z) {
    const d = z - zc(x);
    let h = 0;
    for (const [r, w] of weights(x)) h += w * r.mod.height(x, z, d, frac(r, x));
    return h + floorH(x);
  }

  // ---------- route ----------
  const RP0 = Math.floor(X0 - PAD), RP1 = Math.ceil(X1 + PAD);
  function lift(x) {
    let l = 0;
    for (const [r, w] of weights(x)) l += w * keyed(r.mod.lift ?? [[0, 0], [1, 0]], frac(r, x));
    return l;
  }
  function computeTables() {
    const n = RP1 - RP0 + 1;
    const raw = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = RP0 + i, lf = lift(x), base = rawHeight(x, zc(x) + 15);
      let off = 15;
      if (lf > 0.5) {
        const target = base + lf;
        off = 380;
        let prev = 15;
        for (let o = 15; o <= 380; o += 2) {
          if (rawHeight(x, zc(x) + o) >= target) {
            // refine between prev and o
            let lo = prev, hi = o;
            for (let k = 0; k < 5; k++) { const m = (lo + hi) / 2; if (rawHeight(x, zc(x) + m) >= target) hi = m; else lo = m; }
            off = hi; break;
          }
          prev = o;
        }
      }
      raw[i] = off;
    }
    const off = gaussian(raw, 9, 27);
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 1; i < n; i++) off[i] = Math.min(off[i - 1] + 1.4, Math.max(off[i - 1] - 1.4, off[i]));
      for (let i = n - 2; i >= 0; i--) off[i] = Math.min(off[i + 1] + 1.4, Math.max(off[i + 1] - 1.4, off[i]));
    }
    // trail elevation: natural height along the route, smoothed per metre of trail, grade-limited
    const ry = new Float32Array(n), S = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const x = RP0 + i; ry[i] = rawHeight(x, zc(x) + off[i]);
      if (i) S[i] = S[i - 1] + Math.hypot(1, zc(x) + off[i] - zc(x - 1) - off[i - 1]);
    }
    const py = new Float32Array(n), sig = 10;
    let lo = 0, hi = 0;
    for (let i = 0; i < n; i++) {
      while (S[i] - S[lo] > 3 * sig) lo++;
      while (hi < n - 1 && S[hi + 1] - S[i] <= 3 * sig) hi++;
      let s = 0, ws = 0;
      for (let j = lo; j <= hi; j++) { const dd = S[j] - S[i], w = Math.exp(-(dd * dd) / (2 * sig * sig)); s += ry[j] * w; ws += w; }
      py[i] = s / ws;
    }
    const G = 0.16;
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 1; i < n; i++) { const m = G * (S[i] - S[i - 1]); py[i] = Math.min(py[i - 1] + m, Math.max(py[i - 1] - m, py[i])); }
      for (let i = n - 2; i >= 0; i--) { const m = G * (S[i + 1] - S[i]); py[i] = Math.min(py[i + 1] + m, Math.max(py[i + 1] - m, py[i])); }
    }
    return { off: Array.from(off, (v) => +v.toFixed(2)), py: Array.from(py, (v) => +v.toFixed(2)) };
  }
  const T = tables || computeTables();
  const lerpTable = (tab, x) => {
    const g = Math.min(RP1 - RP0 - 1, Math.max(0, x - RP0)), i = Math.floor(g), f = g - i;
    return tab[i] * (1 - f) + tab[i + 1] * f;
  };
  const pathOffset = (x) => lerpTable(T.off, x);
  const pathZ = (x) => zc(x) + pathOffset(x);
  const pathY = (x) => lerpTable(T.py, x);
  function pathDist(x, z) {
    const k = pathZ(x + 0.5) - pathZ(x - 0.5);
    return Math.abs(z - pathZ(x)) / Math.sqrt(1 + k * k);
  }
  function height(x, z) {
    // cut/fill the trail into the terrain with banks that widen with depth (~1:1.3), so a
    // deep cut reads as a hillside notch rather than a trench with vertical walls
    const dp = pathDist(x, z);
    if (dp > 30) return rawHeight(x, z);
    const h = rawHeight(x, z), py = pathY(x) - 0.08;
    const outer = Math.min(30, 9 + 1.3 * Math.abs(h - py));
    if (dp > outer) return h;
    return mix(h, py, 1 - smoothstep(1.6, outer, dp));
  }
  const trailWeight = (x, z) => 1 - smoothstep(0.9, 2.4, pathDist(x, z));

  // ---------- water ----------
  // rivers run along zc in regions that declare one; seas fill below a region's sea level
  function riverAmount(x) {
    let a = 0;
    for (const [r, w] of weights(x)) if (r.mod.water?.river) a += w;
    return a;
  }
  const waterLevel = (x) => floorH(x) - 0.55;
  // still water (lakes, sea): regions declare water.level relative to their floor; set
  // floorNoise: 0 in such regions so the level sits exactly where the terrain expects it
  const stillWaters = regions.filter((r) => r.mod.water?.level !== undefined)
    .map((r) => ({ x0: r.x0 - TR, x1: r.x1 + TR, y: (r.mod.floor ?? 0) + r.mod.water.level, kind: r.mod.water.kind || 'lake' }));

  // ---------- surface ----------
  function surface(x, z, h, ny) {
    const d = z - zc(x), slope = 1 - ny;
    const w = new Float32Array(NLAYERS);
    const tint = [0, 0, 0];
    let snow = 0;
    for (const [r, rw] of weights(x)) {
      const s = r.mod.surface(x, z, h - floorH(x), slope, d, frac(r, x));
      let sum = 0;
      for (const k in s.w) sum += s.w[k];
      for (const k in s.w) w[L[k]] += rw * s.w[k] / (sum || 1);
      const t = s.tint || [1, 1, 1];
      tint[0] += rw * t[0]; tint[1] += rw * t[1]; tint[2] += rw * t[2];
      snow += rw * (s.snow || 0);
    }
    // the trail overlays every region; river banks get wet mud where a river runs
    const ra = riverAmount(x), bank = (1 - smoothstep(7, 11, Math.abs(d))) * ra;
    const tr = Math.max(trailWeight(x, z) * 0.95, bank * 0.8);
    for (let i = 0; i < NLAYERS; i++) w[i] *= 1 - tr;
    w[L.trail] += tr;
    if (bank > 0) for (let i = 0; i < 3; i++) tint[i] *= 1 - bank * 0.45;
    return { w, tint, snow: snow * (1 - tr) };
  }

  function grass(x, z) {
    const d = z - zc(x);
    let lush = 0, dry = 0;
    const h = rawHeight(x, z) - floorH(x);
    for (const [r, w] of weights(x)) {
      const g = r.mod.grass ? r.mod.grass(x, z, d, h, frac(r, x)) : [0, 0];
      lush += w * g[0]; dry += w * g[1];
    }
    const ra = riverAmount(x);
    lush *= 1 - ra * (1 - smoothstep(9.5, 12, Math.abs(d)));
    const tw = trailWeight(x, z);
    lush *= 1 - smoothstep(0.1, 0.5, tw); dry *= 1 - smoothstep(0.05, 0.3, tw);
    return [lush, dry];
  }

  function atmosphere(x) {
    const out = {};
    for (const [r, w] of weights(x)) {
      for (const [k, v] of Object.entries(r.mod.atmosphere)) {
        if (Array.isArray(v)) { out[k] = out[k] || v.map(() => 0); v.forEach((c, i) => { out[k][i] += w * c; }); }
        else out[k] = (out[k] || 0) + w * v;
      }
    }
    return out;
  }

  const regionAt = (x) => weights(x).sort((a, b) => b[1] - a[1])[0][0];

  return {
    spec, regions, X0, X1, PAD, weights, frac, zc, floorH, rawHeight, height, lift,
    pathOffset, pathZ, pathY, pathDist, trailWeight, riverAmount, waterLevel, stillWaters,
    surface, grass, atmosphere, regionAt, tables: T,
  };
}

export function keyed(keys, u) {
  if (u <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [xa, a] = keys[i], [xb, b] = keys[i + 1];
    if (u <= xb) { let t = (u - xa) / (xb - xa); t = t * t * (3 - 2 * t); return a + (b - a) * t; }
  }
  return keys[keys.length - 1][1];
}

function gaussian(arr, sig, win) {
  const n = arr.length, out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let s = 0, ws = 0;
    for (let k = -win; k <= win; k++) {
      const j = Math.min(n - 1, Math.max(0, i + k)), w = Math.exp(-(k * k) / (2 * sig * sig));
      s += arr[j] * w; ws += w;
    }
    out[i] = s / ws;
  }
  return out;
}
