// Steppe: endless rolling grassland under a big sky. Long gentle swells of straw-gold feather
// grass with greener swales, lichened rock outcrops, old burial mounds, a lone tree now and
// then, and low blue ridges far off on both horizons. The trail rides up onto a broad swell
// for the long view.
import { fbm, ridged, smoothstep } from '../noise.js';

const hs = (i, j, s) => {
  let h = (i * 374761393 + j * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};

// the valley centreline (mirrors world.js zc) so mounds can be kept off the trail
const zc = (x) => 60 * Math.sin(x / 430) + 24 * Math.sin(x / 137 + 1.3) + 9 * Math.sin(x / 53 + 0.4);

// rocky knolls (tors): 0..1 mask
const torMask = (x, z, ad) => smoothstep(0.52, 0.66, fbm(x * 0.009 + 30, z * 0.009 - 12, 2)) * smoothstep(35, 80, ad);

// burial mounds (kurgans): smooth domes on a sparse grid, kept off the trail
const KS = 300;
function kurgans(x, z) {
  const i = Math.floor(x / KS), j = Math.floor(z / KS);
  if (hs(i, j, 1) > 0.35) return 0;
  const cx = (i + 0.25 + 0.5 * hs(i, j, 2)) * KS, cz = (j + 0.25 + 0.5 * hs(i, j, 3)) * KS;
  const r = 14 + 14 * hs(i, j, 4);
  const cd = cz - zc(cx);
  if (cd > -r - 30 && cd < 380 + r) return 0; // the trail wanders up to ~350 m onto the +d side
  const dx = x - cx, dz = z - cz, t2 = (dx * dx + dz * dz) / (r * r);
  if (t2 >= 1) return 0;
  const k = 1 - t2;
  return (2.5 + 4 * hs(i, j, 5)) * k * Math.sqrt(k);
}

// the far ridges: long, low, rounded, layered one behind another
function ranges(x, z, d) {
  const ad = Math.abs(d);
  const m = smoothstep(1700, 2500, ad + fbm(x * 0.0006, 3.3 + Math.sign(d), 2) * 400);
  if (m <= 0) return 0;
  const a = fbm(x * 0.0007 + 4, z * 0.0007 - 2, 3) * 0.5 + 0.5;
  const b = ridged(x * 0.0005 - 1, z * 0.0005 + 7, 2);
  return m * (40 + 150 * a * a + 90 * b * b) * (1 - smoothstep(3200, 3700, ad));
}

export default {
  name: 'steppe',
  floor: 12,
  lift: [[0, 2], [0.3, 6], [0.6, 14], [0.85, 11], [1, 4]],

  height(x, z, d) {
    const ad = Math.abs(d);
    const swell = fbm(x * 0.0013 + 2, z * 0.0013 - 6, 4) * (8 + 30 * smoothstep(40, 700, ad));
    const ramp = smoothstep(0, 700, d) * 32;
    const tm = torMask(x, z, ad);
    const tor = tm * (1.2 + (fbm(x * 0.035 - 3, z * 0.035 + 5, 3) * 0.5 + 0.5) * 3.2);
    return swell + ramp + ranges(x, z, d) + tor + kurgans(x, z) + fbm(x * 0.045, z * 0.045, 2) * 0.35;
  },

  surface(x, z, h, slope, d) {
    const ad = Math.abs(d);
    const n1 = fbm(x * 0.005 + 4, z * 0.005, 3) * 0.5 + 0.5, n2 = fbm(x * 0.07 + 9, z * 0.07, 2) * 0.5 + 0.5;
    const tm = torMask(x, z, ad);
    const far = smoothstep(1300, 2000, ad); // the far ridges read as soft grassed forms, no crags
    const rock = Math.max(smoothstep(0.24, 0.42, slope + (n2 - 0.5) * 0.1) * (1 - far), smoothstep(0.35, 0.8, tm) * smoothstep(0.35, 0.75, n2 + 0.2));
    const green = smoothstep(0.45, 0.75, n1) * 0.7; // greener swales vs straw-gold rises
    const g = green * (1 - far * 0.6);
    const drift = 0.92 + 0.16 * n2;
    return {
      w: {
        steppe: (1 - rock) * (1 - g), meadow: (1 - rock) * g,
        lichen: rock * 0.7, pebbles: rock * 0.3 + tm * 0.2 * (1 - rock),
      },
      tint: [drift * (1.16 - 0.22 * g), drift * (1.04 - 0.02 * g), drift * (0.78 + 0.02 * g)],
    };
  },

  grass(x, z, d) {
    const ad = Math.abs(d);
    const n = fbm(x * 0.005 + 4, z * 0.005, 3) * 0.5 + 0.5; // same field as the ground's green
    const m = fbm(x * 0.03 + 2, z * 0.03 - 5, 2) * 0.5 + 0.5;
    const bare = 1 - smoothstep(0.15, 0.5, torMask(x, z, ad));
    const lush = 0.05 + 0.25 * smoothstep(0.45, 0.8, n);
    return [lush * bare, (0.3 + 0.35 * m) * bare];
  },

  flora: [
    // a lone tree now and then, standing in a green swale
    { kind: 'tree', variants: ['oakLarge', 'ash'], size: [10, 16],
      density: (x, z, d, h, slope) => (Math.abs(d) > 25 && slope < 0.15 ? 0.00006 * smoothstep(0.55, 0.75, fbm(x * 0.005 + 4, z * 0.005, 3) * 0.5 + 0.5) : 0) },
    { kind: 'bush', variants: ['dbush', 'fbush'], size: [0.4, 1.2], wide: [1.0, 1.7],
      density: (x, z, d, h, slope) => (slope < 0.3 ? 0.0009 * smoothstep(0.2, 0.55, fbm(x * 0.02 + 7, z * 0.02, 2)) + 0.003 * torMask(x, z, Math.abs(d)) : 0) },
    { kind: 'rock', layer: 'rock', size: [0.4, 3.2],
      density: (x, z, d, h, slope) => 0.00015 + 0.0075 * torMask(x, z, Math.abs(d)) },
  ],

  atmosphere: {
    sunElev: 24, sunAz: 280, turbidity: 2.2, rayleigh: 1.6, mie: 0.003,
    fog: [0.58, 0.68, 0.86], fogDensity: 0.0004, exposure: 0.5, env: 0.25,
  },

  vignettes: ['tallgrass', 'bigtree', 'cairn', 'poppies'],
};
