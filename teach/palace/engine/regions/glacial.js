// Glacial valley: a broad U-shaped trough scoured by ice. Hummocky pebble-and-lichen floor strewn
// with erratic boulders, a milky tarn in an overdeepened basin on the −d side, and sheer walls
// cut by gullies and hung with glaciers and snowfields. The trail climbs onto the crest of the
// lateral moraine and looks down across the tarn to the sunlit ice wall.
import { fbm, ridged, smoothstep, terrace } from '../noise.js';

// the floor dips below the neighbours so the tarn sits in a hollow; still water is at −20 absolute,
// so neighbouring regions must keep their terrain above that within 240 m of the boundaries
const FLOOR = -14, LEVEL = -6;

// tarn basin mask: an irregular lobe on the −d side through the middle of the region
function tarn(x, z, d, u) {
  const along = smoothstep(0.18, 0.34, u) * (1 - smoothstep(0.7, 0.84, u));
  const shore = fbm(x * 0.006 + 4.2, z * 0.006 - 1.1, 3) * 40;
  const lat = Math.abs(d + 120 + shore) / 130;
  return along * (1 - smoothstep(0.5, 1.0, lat));
}

// hanging glaciers: smooth ice-filled cirques high on the walls, a few per side
function hanging(x, d) {
  const ad = Math.abs(d);
  const c = fbm(x * 0.0019 + (d < 0 ? 0 : 17), 3.3, 2);
  return smoothstep(0.02, 0.24, c) * smoothstep(440, 580, ad) * (1 - smoothstep(950, 1100, ad));
}

// wall-base distance, warped so the foot of the walls wanders in and out (truncated spurs)
const wallA = (x, d) => Math.abs(d) + fbm(x * 0.0016 + (d < 0 ? 2.1 : 8.4), 0.7, 2) * 110;

// buttresses and gullies running down the walls: ridged noise stretched down-slope, with the
// x coordinate warped so the fluting is irregular rather than a regular corrugation
function flutes(x, a) {
  const wx = x + fbm(x * 0.003 + 1.7, a * 0.002, 2) * 140;
  return ridged(wx * 0.0034 + 9.1, a * 0.0009 + 2.4, 3);
}

// lateral moraine: a sharp-crested gravel ridge along the +d side
function moraine(x, d) {
  const c = 80 + fbm(x * 0.003, 7.3, 2) * 14;
  const t = Math.abs(d - c) / 40;
  return Math.max(0, 1 - t) * Math.max(0, 1 - t) * 0.45 + Math.max(0, 1 - t * t) * 0.55;
}

export default {
  name: 'glacial',
  floor: FLOOR,
  floorNoise: 0,
  water: { level: LEVEL, kind: 'lake' },
  lift: [[0, 6], [0.1, 8], [0.24, 19], [0.72, 19], [0.88, 9], [1, 6]],

  height(x, z, d, u) {
    const ad = Math.abs(d), a = wallA(x, d);
    // U-shaped trough: flat floor, walls steepening into cliffs, then a jagged crest of peaks
    const side = d < 0 ? 1.1 : 0.9;
    const wm = smoothstep(250, 720, a);
    const trough = Math.pow(wm, 1.8) * 430 * side;
    // rock bands: irregular benches on the faces (offset by noise so they don't read as stripes)
    const bn = fbm(x * 0.004 - 3.1, a * 0.004, 2) * 30;
    const bands = (terrace(trough + bn, 46, 0.7) - trough - bn) * 0.1 * smoothstep(340, 480, a) * (1 - smoothstep(520, 640, a));
    // buttresses and gullies; hanging glaciers smooth and hollow the upper walls
    const g = hanging(x, d);
    const fl = flutes(x, a);
    const spurs = ((fl - 0.5) * 150 + ridged(x * 0.011 - 3.7, a * 0.005 + 1.9, 3) * 10)
      * smoothstep(290, 560, a) * (1 - g * 0.8) - g * 40;
    // crags: blocky knobs and overhang-like steps that break up the flutes
    const crags = fbm(x * 0.008 + 4.4, z * 0.008 - 6.1, 3) * 22 * smoothstep(300, 520, a) * (1 - g * 0.7);
    // summits: a few big massifs rather than a sawtooth
    const r = ridged(x * 0.0011 + 1.3, z * 0.0011 + 5.7, 5);
    const crest = smoothstep(620, 1150, a) * (150 + 420 * r * r);
    // hummocky ground moraine on the floor
    const floorM = 1 - smoothstep(180, 360, ad);
    const hum = (fbm(x * 0.016 + 3.3, z * 0.016 - 8.1, 3) * 2.4 + fbm(x * 0.07, z * 0.07, 2) * 0.35) * floorM;
    let h = trough + bands + spurs + crags + crest + hum;
    const endFade = smoothstep(0.0, 0.1, u) * (1 - smoothstep(0.9, 1.0, u));
    h += moraine(x, d) * 23 * endFade;
    // recessional moraine arcs that cross the valley near the ends
    const arcA = Math.exp(-Math.pow((u - 0.13 - d * 0.00025) / 0.022, 2)) * 6 * (1 - smoothstep(150, 240, ad));
    const arcB = Math.exp(-Math.pow((u - 0.88 + d * 0.0002) / 0.02, 2)) * 5 * (1 - smoothstep(150, 240, ad));
    h += arcA + arcB;
    // overdeepened basin for the tarn
    const t = tarn(x, z, d, u);
    h -= t * t * (3 - 2 * t) * 24;
    return h;
  },

  surface(x, z, h, slope, d) {
    const n1 = fbm(x * 0.02, z * 0.02, 3) * 0.5 + 0.5, n2 = fbm(x * 0.07 + 9, z * 0.07, 2) * 0.5 + 0.5;
    const a = wallA(x, d);
    const cliff = smoothstep(0.16, 0.3, slope + (n1 - 0.5) * 0.1);
    // ice: the hanging glaciers in their cirques; snow: gentle ground up high, and long tongues
    // lodged in the gullies (the troughs of the fluting) — never smeared over the steep faces
    const fl = flutes(x, a);
    const ice = hanging(x, d) * smoothstep(0.55, 0.35, slope) * smoothstep(190, 260, h + (n1 - 0.5) * 50);
    const snowHi = smoothstep(340, 420, h + (n1 - 0.5) * 80) * smoothstep(0.4, 0.22, slope);
    const snowGul = smoothstep(0.42, 0.22, fl) * smoothstep(170, 280, h + (n2 - 0.5) * 60) * smoothstep(0.45, 0.28, slope);
    const snowL = Math.min(1, Math.max(ice, snowHi, snowGul * 0.9));
    const snow = snowL * 0.25;
    const turf = (1 - smoothstep(0.1, 0.24, slope)) * (1 - smoothstep(40, 110, h)) * smoothstep(0.38, 0.7, n1);
    // pale glacial flour below the waterline shows through as milky turquoise
    const flour = 1 - smoothstep(-9, -6, h);
    const shore = (1 - smoothstep(-6, -4, h)) * (1 - flour);
    const scree = smoothstep(0.1, 0.18, slope) * (1 - cliff);
    const rocky = Math.max(0, 1 - snowL);
    const rest = Math.max(0, 1 - cliff - scree - flour) * rocky;
    const nb = fbm(x * 0.004 + 5, z * 0.004 - 2, 2) * 0.5 + 0.5; // large-scale variation breaks up tiling on the walls
    const w = {
      // three rock textures at different scales, blended by large-scale noise, so the faces
      // don't show a single repeating texture
      rock: (cliff * (0.3 + 0.35 * nb) + scree * 0.25) * rocky,
      lichen: (cliff * 0.35 * (1 - nb) + rest * 0.4 * (1 - turf)) * rocky,
      limestone: cliff * 0.2 * smoothstep(0.35, 0.7, n1) * rocky,
      pebbles: (scree * 0.75 + rest * (0.55 - 0.35 * turf)) * rocky + shore * 1.5,
      meadow: rest * turf * 0.8,
      moss: rest * turf * 0.3 * (1 - n2),
      snow: snowL,
      salt: flour * 2,
    };
    // dark, clean granite on the faces; ice takes a faint blue cast
    const drift = (0.9 + 0.18 * n2) * (1 - 0.22 * cliff * rocky);
    const blue = ice * 0.22;
    const tint = [drift * (0.95 - blue), drift * (0.98 - blue * 0.25), drift * (1.03 + blue * 0.6)];
    if (flour > 0) { tint[0] *= 1 - 0.45 * flour; tint[1] *= 1 + 0.05 * flour; tint[2] *= 1 + 0.12 * flour; }
    return { w, tint, snow };
  },

  grass(x, z, d, h) {
    const n = fbm(x * 0.05 + 2, z * 0.05 - 5, 3) * 0.5 + 0.5;
    const flat = (1 - smoothstep(50, 100, h)) * smoothstep(-4, -2, h);
    return [smoothstep(0.55, 0.85, n) * 0.4 * flat, smoothstep(0.3, 0.7, n) * 0.3 * flat];
  },

  flora: [
    // erratics: big lone boulders dropped by the ice across the floor
    { kind: 'rock', layer: 'lichen', size: [4, 14],
      density: (x, z, d, h, slope) => (slope < 0.2 && h > -4 && Math.abs(d) < 340 ? 0.0011 * smoothstep(-0.3, 0.3, fbm(x * 0.008 + 11, z * 0.008, 2)) : 0) },
    // scattered till and scree
    { kind: 'rock', layer: 'rock', size: [0.4, 3.2],
      density: (x, z, d, h, slope) => (h > -4 ? 0.0022 + 0.0055 * smoothstep(0.12, 0.34, slope) : 0) },
    { kind: 'bush', variants: ['heather'], size: [0.35, 0.8], wide: [1.2, 2.0],
      density: (x, z, d, h, slope) => (slope < 0.25 && h > -3 && h < 80 ? 0.006 * smoothstep(0.0, 0.4, fbm(x * 0.03 - 4, z * 0.03 + 6, 2)) : 0) },
    { kind: 'tree', variants: ['pineSmall'], size: [3, 7],
      density: (x, z, d, h, slope) => (slope < 0.3 && h > -2 && h < 50 ? 0.0003 * smoothstep(0.2, 0.5, fbm(x * 0.012 + 20, z * 0.012, 2)) : 0) },
  ],

  atmosphere: {
    sunElev: 48, sunAz: 340, turbidity: 2.4, rayleigh: 1.5, mie: 0.0025,
    fog: [0.66, 0.74, 0.83], fogDensity: 0.00042, exposure: 0.46, env: 0.28,
  },

  vignettes: ['cairn', 'balanced', 'log', 'deadtree'],
};
