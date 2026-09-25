// Boreal taiga around a still lake. The lake fills the low (−d) side of the valley, dotted with
// rounded, spruce-crowned granite islands; across it a far shore of dark spruce hills and, beyond,
// a low range of rounded blue fells. The trail runs along a raised shore bench a few metres above
// a pebble beach, so the water is always in view on the left; inland lie mossy spruce woods with
// white-stemmed birch groves, lichen-grey boulders, and small muskeg pools ringed by drowned snags.
import { fbm, ridged, smoothstep } from '../noise.js';

const WL = -0.6; // lake level relative to floor (matches the forest river's surface where they meet)

// near shoreline (d of the waterline) and far shore distance
// the near shore bends away from the trail at the end, so the rising trail doesn't embank into it
const nearShore = (x, u) => -3 + fbm(x * 0.0045 + 11, 0.5, 3) * 9 - 70 * smoothstep(0.78, 1, u); // d ≈ −12..+6
const farShore = (x) => -(560 + fbm(x * 0.0022 - 4, 2.2, 3) * 240);       // 320..800 across

// muskeg pools on the inland bench: 0 dry .. 1 open water
function pool(x, z, d) {
  const p = fbm(x * 0.012 + 31.7, z * 0.012 - 5.2, 3);
  return smoothstep(0.3, 0.42, p) * smoothstep(40, 70, d) * (1 - smoothstep(190, 250, d));
}

export default {
  name: 'taiga',
  floor: 0,
  floorNoise: 0,
  water: { level: WL, kind: 'lake' },
  lift: [[0, 0], [0.8, 0], [1, 6]],

  height(x, z, d, u) {
    const ns = nearShore(x, u), fs = farShore(x);
    const D = Math.min(ns - d, d - fs); // > 0 inside the lake
    if (D > 0) {
      // lake bed shelving from the waterline
      let h = WL + 0.35 - Math.min(D, 4) * 0.3 - D * 0.05 - 8 * smoothstep(6, 110, D);
      // rounded granite islands, domed rather than flat-topped
      const isl = fbm(x * 0.0058 + 3.3, z * 0.0058 - 8.1, 3) + 0.18 * fbm(x * 0.024, z * 0.024, 2);
      const e = Math.max(0, isl - 0.24) * smoothstep(45, 100, D);
      const dome = WL - 3.5 + 15 * (1 - Math.exp(-e * 7)) + fbm(x * 0.05, z * 0.05, 2) * 0.8 * smoothstep(0, 0.05, e);
      return Math.max(h, dome);
    }
    const ad = Math.abs(d);
    if (d > ns) {
      // near side: pebble beach, a short bank up to the shore bench, then the wooded hills
      const L = d - ns;
      const bank = 4.6 * smoothstep(2.5, 13, L) + 0.03 * Math.max(0, L - 13);
      const hills = fbm(x * 0.0032, z * 0.0032, 4) * 0.5 + 0.5;
      let h = WL + 0.35 + Math.min(L, 2.5) * 0.12 + bank
        + Math.pow(smoothstep(60, 380, L), 1.3) * (40 + 120 * hills)
        + fbm(x * 0.013, z * 0.013, 3) * 3.5 * smoothstep(14, 50, L)
        + fbm(x * 0.06, z * 0.06, 2) * 0.3;
      // bog pools sink into the flat bench (only where it is still low)
      const p = pool(x, z, d) * (1 - smoothstep(8, 16, h));
      h += (WL - 0.9 - h) * p;
      h += smoothstep(1300, 2800, ad) * (120 + 240 * Math.pow(fbm(x * 0.0009 + 2.1, z * 0.0009, 3) * 0.5 + 0.5, 1.4));
      return h;
    }
    // far shore: rounded, glacially scoured hills under a low range of blue fells
    const L = fs - d;
    const hills = fbm(x * 0.0028 + 17, z * 0.0028, 4) * 0.5 + 0.5;
    let h = WL + 0.35 + Math.min(L, 20) * 0.12
      + smoothstep(15, 420, L) * (45 + 110 * hills)
      + fbm(x * 0.012, z * 0.012, 3) * 5 * smoothstep(4, 40, L);
    const fell = fbm(x * 0.0008 + 5.2, z * 0.0008 - 3.1, 3) * 0.5 + 0.5;
    h += smoothstep(900, 2400, ad) * (110 + 260 * Math.pow(fell, 1.3) + 40 * ridged(x * 0.0024, z * 0.0024, 3));
    return h;
  },

  surface(x, z, h, slope, d) {
    const n1 = fbm(x * 0.02, z * 0.02, 3) * 0.5 + 0.5, n2 = fbm(x * 0.07 + 9, z * 0.07, 2) * 0.5 + 0.5;
    const wet = 1 - smoothstep(WL - 0.05, WL + 0.5, h);                // lake bed and pool bottoms
    const beach = (1 - smoothstep(WL + 0.5, WL + 1.3 + n2 * 0.6, h)) * (1 - wet) * (d < 40 ? 1 : 0.2);
    const rock = smoothstep(0.34, 0.5, slope + (n1 - 0.5) * 0.16);
    const land = (1 - wet) * (1 - beach) * (1 - rock);
    const lichenFloor = smoothstep(0.55, 0.72, n1);                       // pale reindeer-lichen patches
    const bog = pool(x, z, d) > 0.02 ? smoothstep(0.02, 0.5, pool(x, z, d) + 0.15) : 0;
    const drift = 0.9 + 0.2 * n2;
    const wood = smoothstep(3, 25, h) * (1 - rock);
    const k = 1 - 0.28 * wood;
    return {
      w: {
        pebbles: beach + wet * 0.5, sand: wet * 0.5,
        moss: land * (0.55 + 0.35 * wood) * (1 - lichenFloor * 0.6),
        forest: land * (0.35 + 0.2 * wood) * (1 - bog),
        lichen: rock * 0.7 + land * lichenFloor * 0.55,
        meadow: land * (0.15 + 0.6 * bog),
        rock: rock * 0.3,
      },
      tint: [drift * 0.93 * k, drift * 0.99 * k, drift * 0.93 * k],
      snow: smoothstep(300, 360, h + n1 * 30) * smoothstep(0.55, 0.3, slope),
    };
  },

  grass(x, z, d, h) {
    const n = fbm(x * 0.05 + 2, z * 0.05 - 5, 3) * 0.5 + 0.5;
    const above = smoothstep(WL + 0.4, WL + 1.1, h);
    const bog = smoothstep(0, 0.3, pool(x, z, d) + 0.12) * (1 - smoothstep(0.5, 0.9, pool(x, z, d)));
    // sedge fringes on the beach top and round the pools; sparse tussock elsewhere
    const fringe = smoothstep(WL + 0.8, WL + 1.6, h) * (1 - smoothstep(WL + 2.2, WL + 3.2, h)) * (d < 40 ? 1 : 0);
    // under the spruce the floor is moss and lichen, not grass
    const lush = above * Math.min(1, fringe * 0.6 + bog * 0.9 + smoothstep(0.65, 0.9, n) * 0.12) * (1 - smoothstep(30, 60, h));
    const dry = above * smoothstep(0.5, 0.8, 1 - n) * 0.2;
    return [lush, dry];
  },

  flora: [
    // spruce: narrow dark spires in dense stands inland and crowning the islands
    { kind: 'tree', variants: ['pine2', 'pine3', 'pine1'], size: [8, 20], wide: [0.3, 0.44],
      density: (x, z, d, h, slope) => {
        if (h < WL + 1.2 || slope > 0.55) return 0;
        const clump = fbm(x * 0.012 + 5, z * 0.012, 3) + 0.3 * fbm(x * 0.06, z * 0.06, 2);
        const back = d < 0 ? 1 : smoothstep(28, 55, d);     // keep the shore bench open for the view
        const wet = 1 - smoothstep(0.02, 0.2, pool(x, z, d));
        return 0.006 * smoothstep(-0.4, 0.05, clump) * back * wet * (1 - smoothstep(250, 310, h));
      } },
    // birch: white stems in groves along the shore bench and at the wood edge
    { kind: 'tree', variants: ['birch'], size: [7, 14], wide: [0.55, 0.8],
      density: (x, z, d, h, slope) => {
        if (h < WL + 1.2 || slope > 0.35 || (d > 8 && d < 22)) return 0;
        const grove = smoothstep(0.0, 0.35, fbm(x * 0.016 + 40, z * 0.016, 2));
        const strand = d > 0 ? 0.6 + 1.4 * (1 - smoothstep(30, 80, d)) : 0.5;
        return 0.0024 * grove * strand * (1 - smoothstep(60, 110, h));
      } },
    // drowned snags round the muskeg pools, a few in the woods
    { kind: 'tree', variants: ['dead'], size: [6, 12], wide: [0.45, 0.65],
      density: (x, z, d, h, slope) => {
        const p = pool(x, z, d);
        return slope < 0.3 && h > WL - 0.5 ? 0.0002 + 0.003 * smoothstep(0.02, 0.2, p) * (1 - smoothstep(0.5, 0.8, p)) : 0;
      } },
    // blueberry / heather and dwarf birch underfoot
    { kind: 'bush', variants: ['heather', 'dbush', 'fbush'], size: [0.4, 1.1], wide: [1.0, 1.6],
      density: (x, z, d, h, slope) => (h > WL + 1 && slope < 0.4 && (d < 7 || d > 22) ? 0.007 * smoothstep(-0.25, 0.25, fbm(x * 0.04 + 7, z * 0.04, 2)) : 0) },
    // glacial erratics: grey lichened boulders, thickest along the waterline
    { kind: 'rock', layer: 'lichen', size: [0.5, 4.5],
      density: (x, z, d, h, slope) => 0.0008 + 0.005 * (1 - smoothstep(0.3, 1.6, Math.abs(h - WL))) + 0.004 * smoothstep(0.2, 0.4, slope) },
  ],

  atmosphere: {
    sunElev: 30, sunAz: 300, turbidity: 3.0, rayleigh: 1.5, mie: 0.003,
    fog: [0.62, 0.70, 0.80], fogDensity: 0.00055, exposure: 0.52, env: 0.27,
  },

  vignettes: ['birches', 'log', 'cairn', 'deadtree', 'tallgrass'],
};
