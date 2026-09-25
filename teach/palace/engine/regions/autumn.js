// Autumn hill country: rolling deciduous hills in full colour — gold birch, red maple and russet
// oak woods over a floor of fallen leaves, broken by green meadows, with a few dark conifers
// for contrast and layer on layer of hazy coloured ridges beyond. The trail leaves the valley
// meadows, crosses the shoulders of the hills on the +d side and looks back across the coloured
// valleys on the −d side.
import { fbm, ridged, smoothstep } from '../noise.js';

// woodland mask: large woods with open meadows between them; the hillsides above the trail
// (+d) are more thickly wooded than the valley floor
const woods = (x, z, d) => smoothstep(-0.32, 0.12, fbm(x * 0.0042 + 3.7, z * 0.0042 - 8.2, 3)
  + 0.2 * fbm(x * 0.03, z * 0.03, 2) + 0.22 * smoothstep(40, 220, d));
// the woods thicken over the first stretch, so the glacial valley before opens onto meadows
const ramp = (u) => smoothstep(0.03, 0.16, u);
// canopy colour patches, 0 (crimson) .. 1 (gold)
const hueAt = (x, z) => fbm(x * 0.0035 - 7, z * 0.0035 + 3, 3) * 0.5 + 0.5;

export default {
  name: 'autumn',
  floor: 4,
  lift: [[0, 4], [0.12, 8], [0.3, 34], [0.5, 46], [0.68, 40], [0.85, 16], [1, 5]],

  height(x, z, d) {
    const ad = Math.abs(d);
    // broad shallow valley; the +d side rises into the hills the trail climbs
    const bowl = Math.pow(smoothstep(0, 520, ad), 1.25) * (d > 0 ? 95 : 55);
    const hills = (fbm(x * 0.0023 + 1.9, z * 0.0023 - 4.4, 4) * 0.5 + 0.5) * 95 * smoothstep(25, 260, ad);
    const knolls = fbm(x * 0.008 - 2, z * 0.008 + 6, 2) * 3 * smoothstep(10, 80, ad);
    // successive rounded ridges fading into the distance on both sides
    const r = ridged(x * 0.0011 - 5.1, z * 0.0011 + 2.2, 4);
    const far = smoothstep(700, 2600, ad) * (140 + 170 * Math.sqrt(r));
    return bowl + hills + knolls + far + fbm(x * 0.06, z * 0.06, 2) * 0.4;
  },

  surface(x, z, h, slope, d, u) {
    const ad = Math.abs(d);
    const n1 = fbm(x * 0.02, z * 0.02, 3) * 0.5 + 0.5, n2 = fbm(x * 0.07 + 9, z * 0.07, 2) * 0.5 + 0.5;
    const wd = woods(x, z, d) * ramp(u);
    const rock = smoothstep(0.36, 0.5, slope + (n1 - 0.5) * 0.1);
    const hue = hueAt(x, z);
    // beyond the tree-impostor range the ground itself carries the canopy colour
    const farM = smoothstep(900, 1500, ad);
    const far = farM * (0.45 + 0.55 * woods(x, z, d));
    const near = (1 - far) * (1 - rock);
    const open = (1 - wd) * near;
    const gold = smoothstep(0.5, 0.66, hue), conifer = smoothstep(0.2, 0.1, hue);
    const w = {
      // woodland floor: a carpet of fallen leaves; meadows: green turf with drifted leaves
      autumn: wd * near * (0.45 + 0.25 * n2) + open * (0.15 + 0.2 * n2) + far * (1 - conifer),
      forest: wd * near * (0.4 - 0.2 * n2) + far * conifer,
      meadow: open * (0.65 - 0.2 * n2) + wd * near * 0.15,
      steppe: open * 0.12,
      lichen: rock * 0.6 * (1 - far),
      rock: rock * 0.4 * (1 - far),
    };
    const drift = 0.92 + 0.16 * n1;
    let r = 1.0, g = 1.0, b = 0.95;
    // leaf litter: warm, patches of brighter orange where maples stand
    const litter = wd * near;
    r += litter * (0.04 + 0.08 * (1 - gold)); g += litter * (0.02 + 0.08 * gold); b -= litter * 0.12;
    // meadows: fresh green with a little late-season yellow
    g += open * 0.04; b -= open * 0.1;
    // far canopy: crimson / orange / gold patches, dark green conifer stands
    const red = 1 - gold;
    r += far * (0.25 + 0.05 * gold) * (1 - conifer);
    g += far * ((-0.2 * red + 0.35 * gold) * (1 - conifer) + 0.05 * conifer);
    b += far * (-0.35 * (1 - conifer) - 0.1 * conifer);
    return { w, tint: [drift * r, drift * g, drift * b] };
  },

  grass(x, z, d, h, u) {
    const wd = woods(x, z, d) * ramp(u);
    const n = fbm(x * 0.05 + 2, z * 0.05 - 5, 3) * 0.5 + 0.5;
    const open = 1 - smoothstep(0.2, 0.6, wd);
    return [open * 0.25 * smoothstep(0.45, 0.85, n), open * (0.15 + 0.35 * smoothstep(0.3, 0.7, n))];
  },

  flora: [
    // the woods: colour follows the canopy-hue field, so stands of gold birch and red maple
    // form patches rather than a uniform speckle
    { kind: 'tree', variants: ['autumnBirch', 'autumnBirch', 'autumnBirch'], size: [12, 20],
      density: (x, z, d, h, slope, u) => (slope < 0.42 && Math.abs(d) > 8 ? 0.005 * Math.pow(woods(x, z, d), 0.7) * ramp(u) * (0.25 + 0.75 * smoothstep(0.4, 0.6, hueAt(x, z))) : 0) },
    { kind: 'tree', variants: ['autumnMaple', 'autumnMaple', 'autumnOak'], size: [13, 22],
      density: (x, z, d, h, slope, u) => (slope < 0.42 && Math.abs(d) > 8 ? 0.0045 * Math.pow(woods(x, z, d), 0.7) * ramp(u) * (0.2 + 0.8 * smoothstep(0.6, 0.4, hueAt(x, z))) : 0) },
    // lone trees standing out in the meadows
    { kind: 'tree', variants: ['autumnMaple', 'autumnBirch', 'autumnOak'], size: [12, 18],
      density: (x, z, d, h, slope, u) => (slope < 0.3 && Math.abs(d) > 10 ? 0.0003 * (1 - woods(x, z, d)) * (0.3 + 0.7 * ramp(u)) : 0) },
    // a scattering of dark conifers to set off the colour
    { kind: 'tree', variants: ['pine2', 'pine3'], size: [14, 24],
      density: (x, z, d, h, slope, u) => (slope < 0.45 && Math.abs(d) > 8 ? 0.0008 * woods(x, z, d) * ramp(u) * smoothstep(0.1, 0.4, fbm(x * 0.009 + 30, z * 0.009, 2)) : 0) },
    { kind: 'bush', variants: ['redbush', 'fbush', 'redbush'], size: [0.7, 1.8], wide: [1.0, 1.6],
      density: (x, z, d, h, slope, u) => {
        const wd = woods(x, z, d) * ramp(u);
        return slope < 0.4 && Math.abs(d) > 6 ? 0.0065 * wd * (1 - wd) * 4 * 0.8 + 0.0008 : 0;
      } },
    { kind: 'rock', layer: 'lichen', size: [0.5, 2.8],
      density: (x, z, d, h, slope) => 0.0005 + 0.004 * smoothstep(0.25, 0.45, slope) },
  ],

  atmosphere: {
    sunElev: 50, sunAz: 20, turbidity: 6, rayleigh: 1.0, mie: 0.005,
    fog: [0.80, 0.73, 0.62], fogDensity: 0.0008, exposure: 0.5, env: 0.42,
  },

  vignettes: ['bigtree', 'log', 'hedgerow', 'hedgering', 'birches', 'cairn', 'tallgrass'],
};
