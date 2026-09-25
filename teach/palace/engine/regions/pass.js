// High mountain pass at sunset. The coast path leaves the sea cliffs and climbs a broad, stony
// saddle: a great snow massif on the right (+d), on the left a tilted shelf of turf and lichen
// that breaks off to the sea far below. Past the crest the path runs out along a promontory
// whose left side falls away to a fjord and a valley; beyond, hazy ranges stand against the
// setting sun. The walk ends on that promontory, looking out.
import { fbm, ridged, smoothstep, mix, terrace } from '../noise.js';

const CREST = 0.84;  // u where the climb tops out
const TOP = 76;      // saddle crest above the floor
const SEA = -55;     // sea level relative to floor (the same absolute level as the sea cliffs)
const VALE = -32;    // floor of the valley beyond the pass
const DRY = 1.1;     // past about here (just beyond the world's last sea) the low ground is land

const LIP = 1.1;     // u past which the far side steepens into the valley (beyond the walk's end)

// height of the trail line: a steady climb (grade ≈ 0.12) easing into the crest, a gentle
// descent that opens the view, then the steep fall into the far valley
function prof(u) {
  const a = Math.min(1, Math.max(0, u / CREST)), k = 0.2;
  const up = (a - Math.max(0, a - (1 - k)) ** 2 / (2 * k)) / (1 - k / 2);
  const t = Math.max(0, u - CREST);
  return mix(TOP * up - 80 * (t < 0.06 ? t * t / 0.12 : t - 0.03), VALE, smoothstep(LIP, LIP + 0.35, u));
}

export default {
  name: 'pass',
  floor: 25,
  floorNoise: 0,
  water: { level: SEA, kind: 'sea' },
  // beyond the walk's end the path leaves the headwall and contours round the massif
  lift: [[0, 0], [LIP, 0], [LIP + 0.35, 50]],

  height(x, z, d, u) {
    const P = prof(u);
    // ---- the great massif on the +d side: a few big forms, ridged crests, rock bands
    const wq = fbm(x * 0.0008 + 3.1, z * 0.0008 - 1.7, 2);
    const r = ridged(x * 0.0011 + wq * 0.7, z * 0.0011 - wq * 0.5 + 4.2, 3);
    const m = fbm(x * 0.0006 + 9.3, z * 0.0006 + 2.2, 2) * 0.5 + 0.5;
    const ramp = smoothstep(45, 760, d);
    let mass = Math.pow(ramp, 1.3) * (160 + 500 * Math.pow(r, 1.4) * (0.5 + 0.8 * m));
    // ribs and gullies down the faces, and rock bands across them
    mass += (ridged(x * 0.0075 + wq, z * 0.0075 - 3.9, 3) - 0.45) * 70 * smoothstep(30, 200, mass);
    mass = mix(mass, terrace(mass, 30, 0.55), 0.35 * smoothstep(60, 160, mass));
    // ---- the seaward side: a shelf tilting away from the path, then a steep fall to the sea
    // (before the crest the shelf is broad; past it the fall comes right up to the path)
    const top = smoothstep(CREST - 0.12, CREST + 0.1, u);
    const W = mix(170 + 110 * fbm(x * 0.003 + 6.6, 1.9, 2), 14, top);
    const shelf = Math.min(0, d + 6) * mix(0.16, 0.34, top);
    const fall = smoothstep(-W, -W - mix(210, 130, top), d);
    const dry = smoothstep(DRY - 0.05, DRY + 0.08, u);
    const low = mix(SEA - 28 + fbm(x * 0.004, z * 0.004, 3) * 12, VALE + fbm(x * 0.006, z * 0.006, 3) * 9, dry);
    // buttresses and gullies on the fall
    const face = (ridged(x * 0.02 + 2, z * 0.02, 3) - 0.5) * 24 * fall * (1 - fall) * 4;
    let land = P + shelf + mass;
    if (d < 0) land += smoothstep(-50, -120, d) * (1 - top) * Math.max(0, fbm(x * 0.011 - 4, z * 0.011, 3) - 0.15) * 16; // rocky knolls
    let h = mix(land, low, fall) + face;
    // ---- far ranges beyond the valley, in receding layers, low enough for the sun to sit on
    const fr = ridged(x * 0.0024 + 7.7, z * 0.0024 - 3.3, 4);
    const fr2 = ridged(x * 0.0016 - 2.2, z * 0.0016 + 5.1, 3);
    // (a gap straight ahead lets the valley run on toward the sun)
    const gap = smoothstep(50, 280, Math.abs(d + 60));
    h += gap * (smoothstep(1.3, 1.7, u) * (1 - smoothstep(1.75, 1.95, u)) * (30 + 50 * fr)
      + smoothstep(1.8, 2.2, u) * (45 + 70 * fr2));
    // ---- detail
    h += fbm(x * 0.012, z * 0.012, 3) * 5 * smoothstep(20, 80, d)
      + fbm(x * 0.035, z * 0.035, 3) * 1.6
      + (ridged(x * 0.09, z * 0.09, 2) - 0.5) * 0.9;
    return h;
  },

  surface(x, z, h, slope, d, u) {
    const n1 = fbm(x * 0.02, z * 0.02, 3) * 0.5 + 0.5, n2 = fbm(x * 0.07 + 9, z * 0.07, 2) * 0.5 + 0.5;
    const rock = smoothstep(0.3, 0.46, slope + (n1 - 0.5) * 0.14);
    const scree = smoothstep(0.17, 0.32, slope) * (1 - rock);
    const turf = smoothstep(0.38, 0.62, fbm(x * 0.025 - 4, z * 0.025 + 2, 3) * 0.5 + 0.5) * (1 - smoothstep(150, 230, h));
    const flat = (1 - rock) * (1 - scree);
    const shore = 1 - smoothstep(SEA + 1, SEA + 5, h + n2 * 2);
    // snowfields gather on the flatter ground of the high massif and thin on steep faces
    const snow = smoothstep(220, 300, h + n1 * 70) * smoothstep(0.7, 0.42, slope)
      + smoothstep(380, 450, h) * 0.6 * smoothstep(0.9, 0.65, slope);
    const drift = 0.9 + 0.2 * n2;
    return {
      w: {
        rock: rock * (0.5 + 0.3 * n2), lichen: rock * (0.5 - 0.3 * n2) + flat * (1 - turf) * 0.5,
        pebbles: scree * 0.75 + flat * (1 - turf) * 0.25 + shore, cinder: scree * 0.25,
        steppe: flat * turf * (0.35 + 0.3 * n1), meadow: flat * turf * (0.65 - 0.3 * n1),
      },
      tint: [drift * 1.05, drift * 0.99, drift * 0.9], snow: Math.min(1, snow),
    };
  },

  grass(x, z, d, h) {
    const n = fbm(x * 0.05 + 2, z * 0.05 - 5, 3) * 0.5 + 0.5;
    const alt = 1 - smoothstep(160, 240, h);
    return [smoothstep(0.5, 0.8, n) * 0.4 * alt, (0.2 + 0.5 * smoothstep(0.3, 0.7, n)) * alt];
  },

  flora: [
    // stunted pines in the lee of the knolls and down in the far valley
    { kind: 'tree', variants: ['pineSmall', 'pine2'], size: [3, 8],
      density: (x, z, d, h, slope) => (slope < 0.35 && h < 130
        ? 0.0022 * smoothstep(0.1, 0.45, fbm(x * 0.009 + 7, z * 0.009, 3)) * (0.35 + 0.65 * smoothstep(40, 0, h)) : 0) },
    { kind: 'bush', variants: ['heather', 'dbush'], size: [0.4, 1.0], wide: [1.1, 1.8],
      density: (x, z, d, h, slope) => (slope < 0.3 && h < 200 ? 0.005 * smoothstep(-0.1, 0.35, fbm(x * 0.02 - 7, z * 0.02, 2)) : 0) },
    // lichen-covered boulders and scree blocks
    { kind: 'rock', layer: 'lichen', size: [0.5, 4.5],
      density: (x, z, d, h, slope) => 0.002 + 0.005 * smoothstep(0.12, 0.35, slope) },
    { kind: 'rock', layer: 'rock', size: [1.5, 7],
      density: (x, z, d, h, slope) => 0.0005 + 0.0015 * smoothstep(0.2, 0.4, slope) },
  ],

  atmosphere: {
    sunElev: 5, sunAz: 100, turbidity: 9, rayleigh: 3, mie: 0.007,
    fog: [0.66, 0.50, 0.46], fogDensity: 0.00095, exposure: 0.62, env: 0.75,
  },

  vignettes: ['cairn', 'balanced', 'deadtree', 'log'],
};
