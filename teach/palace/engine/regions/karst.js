// Tower karst: isolated limestone towers — fluted grey walls streaked ochre and black, jungle
// clinging to every ledge, rounded wooded crowns — rising straight out of a flat plain of rice
// paddies, a slow river winding between them. The trail keeps to the river meadows; the towers
// stand close on both banks and recede in blue, hazy ranks like an ink painting.
import { fbm, smoothstep } from '../noise.js';

const S = 190; // tower cell size (m)

// integer hash → [0,1), no allocation
function hr(ix, iz, k) {
  let h = (ix * 374761393 + iz * 668265263 + k * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// height of the tallest tower covering (x, z); d is the lateral offset of the sample
function towers(x, z, d, wob) {
  const gx = x / S, gz = z / S, xi = Math.floor(gx), zi = Math.floor(gz);
  let best = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = xi + i, cz = zi + j;
    const px = (cx + 0.15 + 0.7 * hr(cx, cz, 1)) * S, pz = (cz + 0.15 + 0.7 * hr(cx, cz, 2)) * S;
    const tc = d + (pz - z), dc = Math.abs(tc); // tower centre's offset from the valley line
    if (hr(cx, cz, 7) < 0.3 - 0.26 * smoothstep(350, 1100, dc)) continue; // empty cell: open plain
    const R = S * (0.2 + 0.17 * hr(cx, cz, 3)) * (1 + 0.35 * smoothstep(300, 1400, dc));
    // keep the river clear, and every wall > 60 m from the trail (d ≈ 15): world.js flattens
    // tall ground within 60 m of the route, which would shear a closer tower into a flat slab
    if (Math.abs(tc - 15) < 1.22 * R + 64) continue;
    const dx = x - px, dz = z - pz;
    const q = Math.sqrt(dx * dx + dz * dz) / R + wob;
    const t = 1 - q;
    if (t <= 0) continue;
    // tall and narrow: height ≈ 1.2–3.5 × radius, the far ranks tallest
    const H = (80 + 150 * hr(cx, cz, 4)) * (0.75 + 0.6 * smoothstep(60, 600, dc));
    const k = 2.2 + 1.8 * hr(cx, cz, 5); // sugarloaf: sheer foot, domed crown
    const u = 1 - Math.min(1, t * 1.12);
    const shape = 1 - Math.pow(u, k) + 0.05 * smoothstep(-0.1, 0.05, t); // + a talus lip at the foot
    const h = H * shape;
    if (h > best) best = h;
  }
  return best;
}

// paddy fields: a slightly rotated grid of plots; returns plot kind in [0,1) and bund closeness
let bund = 0;
function paddy(x, z) {
  const a = 0.42, ca = Math.cos(a), sa = Math.sin(a);
  const fx = (x * ca - z * sa) / 34, fz = (x * sa + z * ca) / 21;
  const ix = Math.floor(fx), iz = Math.floor(fz);
  const ex = Math.min(fx - ix, 1 - fx + ix) * 34, ez = Math.min(fz - iz, 1 - fz + iz) * 21;
  bund = 1 - smoothstep(0.4, 1.3, Math.min(ex, ez));
  return hr(ix, iz, 11);
}

export default {
  name: 'karst',
  floor: 0,
  water: { river: true },
  lift: [[0, 0], [1, 0]],

  height(x, z, d) {
    const ad = Math.abs(d);
    // flutes: fine vertical grooves in the walls; broad lobes shape each tower's footprint
    const wob = fbm(x * 0.018 + 11, z * 0.018 - 4, 3) * 0.13 + fbm(x * 0.055, z * 0.055, 2) * 0.045;
    let h = towers(x, z, d, wob)
      + fbm(x * 0.008, z * 0.008, 3) * 1.3 * smoothstep(12, 60, ad)
      + fbm(x * 0.05, z * 0.05, 2) * 0.25;
    h -= (1 - smoothstep(3.5, 10.5, ad)) * 2.6; // river channel
    return h;
  },

  surface(x, z, h, slope, d) {
    const ad = Math.abs(d);
    const n1 = fbm(x * 0.02, z * 0.02, 3) * 0.5 + 0.5, n2 = fbm(x * 0.07 + 9, z * 0.07, 2) * 0.5 + 0.5;
    const tower = smoothstep(2.5, 7, h);
    // on a vertical wall, noise in (x, z) alone becomes vertical stripes: runoff streaks,
    // bands of bare rock between hanging curtains of jungle
    // ...broken across by ledges (the h term) so the curtains don't run top to bottom
    const stripe = fbm(x * 0.06 + 3, z * 0.06 - 2, 2) * 0.5 + 0.5 + fbm(x * 0.02 - 8, h * 0.05 + z * 0.02, 2) * 0.28;
    const streak = fbm(x * 0.16 - 5, z * 0.16 + 7, 2) * 0.5 + 0.5;
    const bare = smoothstep(0.5, 0.68, stripe + (slope - 0.8) * 0.6 + (n1 - 0.5) * 0.2) * smoothstep(0.45, 0.7, slope) * tower;
    const jungle = tower * (1 - bare);
    // plain: patchwork of paddies (young rice, ripening, fallow stubble) between the towers
    const kind = paddy(x, z);
    const field = smoothstep(16, 26, ad) * (1 - tower);
    const bank = (1 - field) * (1 - tower);
    const rice = field * (kind < 0.55 ? 1 : 0), ripe = field * (kind >= 0.55 && kind < 0.8 ? 1 : 0), fallow = field - rice - ripe;
    const bd = bund * field;
    const g = 0.9 + 0.2 * n2;
    // limestone: pale grey, streaked ochre (iron) and black (algae) down the walls
    const ochre = smoothstep(0.55, 0.8, streak), black = smoothstep(0.45, 0.2, streak);
    const lr = 1.08 + 0.2 * ochre - 0.5 * black, lg = 1.02 - 0.02 * ochre - 0.5 * black, lb = 0.8 - 0.25 * ochre - 0.38 * black;
    const jd = 0.62 + 0.35 * n2; // jungle: dark, varied greens
    const ledge = 1 - smoothstep(0.35, 0.6, slope); // planar layers only where they won't smear
    return {
      w: {
        meadow: bank * 0.8 + rice * 0.9 + ripe * 0.6 + bd * 0.4 + jungle * 0.15 * ledge,
        steppe: fallow * 0.8 + ripe * 0.4 + bank * 0.2 * n1,
        pebbles: bd * 0.5,
        moss: jungle * (0.55 + 0.45 * (1 - ledge)) + bare * 0.12 * (1 - streak),
        forest: jungle * 0.3 * ledge,
        limestone: bare * 0.9,
      },
      tint: [
        (bank * g * 0.86 + rice * g * 0.95 + ripe * 1.12 + fallow * 1.02) * (1 - bd * 0.25) + jungle * jd * 0.55 + bare * lr,
        (bank * g * 1.1 + rice * g * 1.28 + ripe * 1.15 + fallow * 0.95) * (1 - bd * 0.25) + jungle * jd * 0.95 + bare * lg,
        (bank * g * 0.78 + rice * g * 0.62 + ripe * 0.6 + fallow * 0.82) * (1 - bd * 0.25) + jungle * jd * 0.5 + bare * lb,
      ],
    };
  },

  grass(x, z, d, h) {
    const ad = Math.abs(d);
    const n = fbm(x * 0.04 + 2, z * 0.04 - 5, 3) * 0.5 + 0.5;
    const kind = paddy(x, z);
    const flat = 1 - smoothstep(2, 6, h);
    const field = smoothstep(16, 26, ad);
    // young rice stands dense and even; the river meadow is patchy; fallow is dry stubble
    const bankLush = smoothstep(9.5, 12, ad) * (1 - field) * smoothstep(0.2, 0.55, n);
    const rice = field * (kind < 0.55 ? 0.95 : kind < 0.8 ? 0.35 : 0) * (1 - bund);
    const dry = field * (kind >= 0.55 ? 0.45 : 0) * (1 - bund);
    return [(bankLush + rice) * flat, dry * flat];
  },

  flora: [
    // jungle on the towers' ledges and crowns
    { kind: 'tree', variants: ['oak', 'ash', 'oakLarge'], size: [7, 14],
      density: (x, z, d, h, slope) => (h > 6 && slope < 0.8 ? 0.006 * smoothstep(6, 20, h) * (slope < 0.55 ? 1 : 0.5) : 0) },
    // a line of big shade trees along the river banks and in the hamlets
    { kind: 'tree', variants: ['oakLarge', 'ash'], size: [10, 18],
      density: (x, z, d, h, slope) => {
        const ad = Math.abs(d);
        if (ad < 11.5 || h > 3 || slope > 0.2) return 0;
        const n = fbm(x * 0.01 + 40, z * 0.01, 2);
        return 0.0045 * (1 - smoothstep(13, 22, ad)) * smoothstep(-0.1, 0.25, n)
          + 0.0012 * smoothstep(0.2, 0.5, n) * smoothstep(22, 40, ad);
      } },
    { kind: 'bush', variants: ['fbush'], size: [0.9, 2.6], wide: [1.0, 1.6],
      density: (x, z, d, h, slope) => {
        const ad = Math.abs(d);
        if (ad < 10 || slope > 0.9) return 0;
        if (h > 3) return 0.008; // scrub on the tower walls
        return ad < 20 ? 0.004 : 0.0006; // riverside thickets; the paddies stay open
      } },
    // talus blocks at the towers' feet
    { kind: 'rock', layer: 'limestone', size: [0.6, 3.5],
      density: (x, z, d, h, slope) => (Math.abs(d) > 9 && h > 0.6 && h < 12 && slope < 0.55 ? 0.006 * smoothstep(0.08, 0.3, slope) : 0) },
  ],

  atmosphere: {
    sunElev: 52, sunAz: 200, turbidity: 5, rayleigh: 1.3, mie: 0.006,
    fog: [0.62, 0.71, 0.77], fogDensity: 0.0017, exposure: 0.5, env: 0.3,
  },

  vignettes: ['tallgrass', 'hedgerow', 'bigtree', 'log', 'cairn'],
};
