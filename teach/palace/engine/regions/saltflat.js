// Salt pan: a white playa running dead flat to the horizon on the low (−d) side, its crust
// broken into raised polygons, with bare, gullied ranges floating in the glare far across it.
// The trail follows the pan margin at the foot of a gravel bajada, strikes out across the salt
// itself for the middle stretch (white on every side), then climbs onto a low gravel rim.
// Behind the bajada rise bare, sun-baked ranges with alluvial fans spilling from their canyons.
import { fbm, ridged, smoothstep } from '../noise.js';

// integer hash → [0,1), no allocation
function hr(ix, iz, k) {
  let h = (ix * 374761393 + iz * 668265263 + k * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// salt polygons: F2 − F1 cellular distance (small = on a pressure ridge between polygons)
function ridges(x, z) {
  const gx = x / 6.5, gz = z / 6.5, xi = Math.floor(gx), zi = Math.floor(gz);
  let f1 = 9, f2 = 9;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = xi + i, cz = zi + j;
    const dx = cx + hr(cx, cz, 1) - gx, dz = cz + hr(cx, cz, 2) - gz;
    const r = dx * dx + dz * dz;
    if (r < f1) { f2 = f1; f1 = r; } else if (r < f2) f2 = r;
  }
  return Math.sqrt(f2) - Math.sqrt(f1);
}

// where the bajada begins (d); in the middle of the region the pan reaches past the trail
// (the pan only widens while the trail is down at lift 0, so the route never chases the edge)
const panEdge = (u) => 22 + 170 * smoothstep(0.22, 0.36, u) * (1 - smoothstep(0.6, 0.73, u));

export default {
  name: 'saltflat',
  floor: -3,
  floorNoise: 0.2,
  lift: [[0, 0], [0.06, 2.5], [0.12, 2.5], [0.21, 0], [0.75, 0], [0.87, 6], [1, 3]],

  height(x, z, d, u) {
    const e = panEdge(u);
    const bumps = fbm(x * 0.006 + 5, z * 0.006, 4);
    // the bajada: gravel fans rising gently from the pan edge toward the range front
    const fans = fbm(x * 0.0045 - 2, z * 0.0045 + 7, 3); // lobes of individual fans
    let h = smoothstep(e - 4, e + 55, d) * (4 + 2 * bumps)
      + smoothstep(e + 40, e + 520, d) * (26 + 12 * fans)
      + smoothstep(e - 4, e + 60, d) * fbm(x * 0.02, z * 0.02, 3) * 1.2;
    // bare ranges behind the bajada (+d) and far across the pan (−d): gullied, not smooth
    const front = 560 + 160 * bumps;
    const rangeN = smoothstep(front, front + 420, d);
    const rangeF = smoothstep(-1250 + bumps * 250, -1850 + bumps * 250, d);
    if (rangeN > 0 || rangeF > 0) {
      // broad, worn massifs (old fault-block ranges), cut by spurs and gullies
      const m = fbm(x * 0.0013 + 2.3, z * 0.0013 - 6.1, 3) * 0.5 + 0.5;
      const g = ridged(x * 0.0042 - 1.7, z * 0.0042 + 3.9, 4);
      h += rangeN * (30 + 160 * m * m + 38 * g * m) + rangeF * (35 + 230 * m * m + 30 * g * m);
    }
    // the pan itself: dead flat, the faintest swells
    const pan = 1 - smoothstep(e - 10, e + 30, d);
    h += pan * fbm(x * 0.004 - 3, z * 0.004 + 1, 2) * 0.25;
    return h;
  },

  surface(x, z, h, slope, d, u) {
    const e = panEdge(u);
    const n1 = fbm(x * 0.015, z * 0.015, 3) * 0.5 + 0.5, n2 = fbm(x * 0.08 + 9, z * 0.08, 2) * 0.5 + 0.5;
    const pan = (1 - smoothstep(e - 8, e + 26, d + (n1 - 0.5) * 30)) * (1 - smoothstep(1.2, 5, h));
    // crust: blinding white polygons edged by raised ridges; damp brown near the margin
    const rg = ridges(x, z);
    const ridge = (1 - smoothstep(0.03, 0.14, rg)) * pan;
    const damp = pan * smoothstep(e - 40, e + 5, d) * smoothstep(0.45, 0.7, n1) * 0.6;
    const salt = pan;
    const rock = smoothstep(0.26, 0.46, slope + (n1 - 0.5) * 0.2) * (1 - pan);
    const land = (1 - pan) * (1 - rock);
    const grit = smoothstep(0.35, 0.7, n2); // desert pavement vs sand between the scrub
    // ranges: faint colour bands (ochre, rose, grey-green) in the bare rock
    const band = fbm(h * 0.018 + x * 0.0008, z * 0.0008 + 4, 2) * 0.5 + 0.5;
    const s = (0.99 + 0.06 * n2) * (1 - 0.12 * ridge) - 0.3 * damp;
    const w = 0.9 + 0.2 * n1;
    const rr = 1.25 + 0.25 * band, rgc = 1.02 + 0.08 * (1 - band), rb = 0.85 + 0.12 * (1 - band);
    // out on the salt the trail is only a pale vehicle track: lift its colour toward the crust
    // (at lift 0 the route runs at d ≈ 15)
    const tw = 1 - smoothstep(0.9, 2.4, Math.abs(d - 15)); // the engine's trail-weight profile
    const track = pan * tw * tw * smoothstep(0.2, 0.225, u) * (1 - smoothstep(0.745, 0.765, u));
    const tk = 1 + 1.7 * track;
    return {
      w: {
        salt: salt * (1 - ridge * 0.5), pebbles: land * grit * 0.35 + damp * 0.2, snow: ridge * 0.35,
        steppe: land * (0.12 + 0.2 * smoothstep(0.5, 0.85, n1)), sand: land * (0.55 - 0.25 * grit) + rock * 0.25,
        rock: rock * 0.55, cinder: rock * 0.2 * n2 + land * 0.1 * (1 - grit),
      },
      tint: [
        (salt * s * 1.1 + land * w * 1.02 + rock * w * rr) * tk,
        (salt * s * 1.08 + land * w * 0.96 + rock * w * rgc) * tk,
        (salt * s * 1.0 + land * w * 0.9 + rock * w * rb) * tk * 0.97,
      ],
    };
  },

  grass(x, z, d, h, u) {
    const e = panEdge(u);
    const n = fbm(x * 0.05 + 2, z * 0.05 - 5, 3) * 0.5 + 0.5;
    return [0, smoothstep(e + 25, e + 70, d) * smoothstep(0.6, 0.85, n) * 0.06];
  },

  flora: [
    // creosote on the bajada, spaced out as it is in real desert
    { kind: 'bush', variants: ['dbush'], size: [0.6, 1.5], wide: [1.1, 1.7],
      density: (x, z, d, h, slope, u) => {
        const e = panEdge(u);
        if (d < e + 6 || slope > 0.35) return 0;
        return 0.006 * smoothstep(e + 6, e + 40, d) * (0.3 + 0.7 * smoothstep(-0.2, 0.3, fbm(x * 0.03, z * 0.03, 2)));
      } },
    // cobbles washed down the fans
    { kind: 'rock', layer: 'cinder', size: [0.3, 1.2],
      density: (x, z, d, h, slope, u) => (d > panEdge(u) + 15 ? 0.0015 + 0.004 * smoothstep(0.12, 0.35, slope) : 0) },
  ],

  atmosphere: {
    sunElev: 40, sunAz: 230, turbidity: 10, rayleigh: 1.6, mie: 0.009,
    fog: [0.93, 0.9, 0.87], fogDensity: 0.0007, exposure: 0.34, env: 0.34,
  },

  vignettes: ['cairn', 'deadtree', 'balanced', 'brittlebush'],
};
