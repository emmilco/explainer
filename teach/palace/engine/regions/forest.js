// Riverside forest valley: a river on the valley floor, conifer walls rising to snowy ridges.
// The trail starts in the riverside meadow, climbs the valley wall, and traverses high.
import { fbm, ridged, smoothstep, mix, C } from '../noise.js';

const P = {
  grassA: C(0.24, 0.33, 0.12), grassB: C(0.36, 0.40, 0.15),
};

export default {
  name: 'forest',
  floor: 0,
  water: { river: true },
  lift: [[0, 0], [0.2, 0], [0.5, 30], [0.62, 36], [0.85, 34], [1, 0]],

  height(x, z, d) {
    const ad = Math.abs(d);
    const wall = Math.pow(smoothstep(24, 420, ad), 1.3) * 230;
    const r = ridged(x * 0.0022 + 3.1, z * 0.0022 - 1.7, 6);
    let h = wall * (0.55 + 0.75 * r)
      + fbm(x * 0.006, z * 0.006, 4) * 14 * smoothstep(14, 90, ad)
      + fbm(x * 0.05, z * 0.05, 3) * 0.6;
    h -= (1 - smoothstep(3.5, 10.5, ad)) * 2.6; // river channel
    return h;
  },

  surface(x, z, h, slope, d) {
    const ad = Math.abs(d);
    const n1 = fbm(x * 0.02, z * 0.02, 3) * 0.5 + 0.5, n2 = fbm(x * 0.07 + 9, z * 0.07, 2) * 0.5 + 0.5;
    let rock = smoothstep(0.25, 0.4, slope + (n1 - 0.5) * 0.12);
    rock = Math.max(rock, smoothstep(165, 215, h + n1 * 30) * 0.85);
    const floor = smoothstep(22, 70, ad + (n2 - 0.5) * 50);
    const snow = smoothstep(215, 245, h + n1 * 25) * smoothstep(0.6, 0.35, slope);
    const drift = 0.88 + 0.24 * n2;
    return {
      w: { meadow: (1 - floor) * (1 - rock), forest: floor * (1 - rock), rock: rock * (0.7 + 0.3 * n2), lichen: rock * 0.3 * (1 - n2) },
      tint: [drift, drift, drift], snow,
    };
  },

  grass(x, z, d, h) {
    const ad = Math.abs(d);
    const n = fbm(x * 0.045 + 2, z * 0.045 - 5, 3) * 0.5 + 0.5;
    const lush = smoothstep(9.5, 12, ad) * (1 - smoothstep(35, 110, ad)) * smoothstep(0.2, 0.55, n) * (1 - smoothstep(60, 110, h));
    const dry = smoothstep(60, 120, ad) * 0.25;
    return [lush, dry];
  },

  flora: [
    { kind: 'tree', variants: ['pine1', 'pine2', 'pine3'], size: [14, 30],
      density: (x, z, d, h, slope) => {
        const clump = fbm(x * 0.01, z * 0.01, 3) + 0.35 * fbm(x * 0.05, z * 0.05, 2);
        return 0.0045 * smoothstep(-0.3, 0.15, clump) * (1 - smoothstep(150, 190, h)) * (smoothstep(12, 45, Math.abs(d)) * 0.7 + 0.3) * (slope < 0.5 ? 1 : 0);
      } },
    { kind: 'tree', variants: ['aspen', 'oak'], size: [9, 16],
      density: (x, z, d, h, slope) => (Math.abs(d) > 10 && Math.abs(d) < 70 && slope < 0.35 ? 0.0012 * smoothstep(-0.1, 0.4, fbm(x * 0.02 + 40, z * 0.02, 2)) : 0) },
    { kind: 'bush', variants: ['fbush'], size: [0.8, 2.2], wide: [0.9, 1.4],
      density: (x, z, d, h, slope) => (Math.abs(d) > 10 && slope < 0.4 && h < 120 ? 0.006 : 0) },
    { kind: 'rock', layer: 'rock', size: [0.6, 5],
      density: (x, z, d, h, slope) => (Math.abs(d) > 8 ? 0.0012 + 0.006 * smoothstep(0.1, 0.35, slope) : 0) },
  ],

  atmosphere: {
    sunElev: 26, sunAz: 290, turbidity: 4.5, rayleigh: 1.3, mie: 0.003,
    fog: [0.60, 0.68, 0.78], fogDensity: 0.0008, exposure: 0.52, env: 0.25,
  },

  vignettes: ['poppies', 'lupines', 'daisies', 'tallgrass', 'hedgering', 'hedgerow', 'bigtree', 'cairn', 'log', 'birches'],
};
