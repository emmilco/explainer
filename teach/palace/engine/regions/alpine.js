// Alpine meadows under snow peaks: a broad high valley of flowered pasture with a few small pines,
// walled by big snow massifs. The massifs are a handful of large peaks (low-frequency ridged
// noise, domain-warped), their faces stepped into rock bands where snow lies on the ledges and
// the steep risers stay bare; snowfields fill the gentler upper slopes. The highest wall is on
// the −d side, across the valley. The trail climbs the +d meadows to a long high traverse, then
// drops toward the glacier.
import { fbm, ridged, simplex, smoothstep, terrace } from '../noise.js';

// ridged noise with a slightly rounded crest (smooth |n|), so distant skylines don't alias into
// a comb of teeth on the terrain grid
function softRidged(x, y, oct) {
  let a = 0.5, f = 1, sum = 0, norm = 0, w = 1;
  for (let o = 0; o < oct; o++) {
    const s = simplex(x * f, y * f);
    let n = 1 - Math.sqrt(s * s + 0.004);
    n *= n * w; w = Math.min(1, n * 1.6);
    sum += a * n; norm += a; a *= 0.5; f *= 2.1;
  }
  return sum / norm;
}

// a snow massif: few, large peaks with arêtes, stepped into rock bands
function massif(x, z, s) {
  const wx = x + 260 * fbm(x * 0.0009 + s, z * 0.0009, 2);
  const wz = z + 260 * fbm(x * 0.0009 - 3.1, z * 0.0009 + s, 2);
  const big = 0.7 * softRidged(wx * 0.00052 + s, wz * 0.00052 - s, 2) + 0.3 * (fbm(wx * 0.0007, wz * 0.0007 + s, 2) * 0.5 + 0.5);
  const are = softRidged(wx * 0.0016 - s, wz * 0.0016 + 1.7, 2);
  const m = 240 + 820 * Math.pow(big, 1.5) + 55 * are * (0.3 + big);
  return m * 0.75 + terrace(m, 52, 0.5) * 0.25;
}

// rocky knuckles in the meadows on the trail side (0..1)
function outcrop(x, z, d) {
  if (d < 30) return 0;
  return smoothstep(0.22, 0.45, fbm(x * 0.011 + 3.3, z * 0.011 - 1.9, 3)) * smoothstep(40, 90, d) * (1 - smoothstep(600, 800, d));
}

export default {
  name: 'alpine',
  floor: 26,
  lift: [[0, 8], [0.1, 10], [0.32, 50], [0.45, 68], [0.86, 72], [0.96, 30], [1, 12]],

  height(x, z, d) {
    const ad = Math.abs(d);
    const roll = fbm(x * 0.0045 + 2.2, z * 0.0045 - 6.3, 4) * 0.5 + 0.5;
    let h;
    if (d >= 0) {
      // the trail side: a meadow flank up to a broad high bench (the traverse), an upper pasture
      // with knolls and outcrops, then the massif behind
      h = Math.pow(smoothstep(14, 175, d), 1.25) * 72 * (0.85 + 0.3 * roll)
        + smoothstep(150, 430, d) * 34
        + Math.pow(smoothstep(420, 900, d), 1.3) * 120 * (0.6 + 0.6 * roll);
      h += ridged(x * 0.006 + 7.7, z * 0.006, 3) * 16 * smoothstep(200, 420, d) * (1 - smoothstep(900, 1200, d));
      // limestone outcrops breaking through the pasture
      const oc = outcrop(x, z, d);
      h += oc * (1.5 + 5 * ridged(x * 0.03 + 1.1, z * 0.03, 3));
      h += smoothstep(650, 1600, d) * massif(x, z, 4.3);
    } else {
      // across the valley: short meadow, then the great wall of peaks
      const sw = fbm(x * 0.0016 - 4.4, z * 0.0016, 3) * 0.5 + 0.5;       // broad spurs, not lumps
      h = Math.pow(smoothstep(80, 520, ad), 1.35) * 170 * (0.75 + 0.5 * sw);
      // avalanche gullies and spurs running down the slope below the massif
      h += (ridged(x * 0.0065 + 2.9, ad * 0.0012 - 1.3, 3) - 0.5) * 22 * smoothstep(120, 380, ad) * (1 - smoothstep(700, 1100, ad) * 0.6);
      h += smoothstep(420, 1350, ad) * massif(x, z, -2.6) * 1.15;
    }
    h += fbm(x * 0.008, z * 0.008, 3) * (d > 0 ? 7 : 3.5) * smoothstep(8, 60, ad) * (1 - smoothstep(350, 700, ad)) // hummocks
      + fbm(x * 0.05, z * 0.05, 3) * 0.45;
    h -= (1 - smoothstep(2, 9, ad)) * 0.8;                              // a shallow swale on the floor
    return h;
  },

  surface(x, z, h, slope, d) {
    const n1 = fbm(x * 0.02, z * 0.02, 3) * 0.5 + 0.5, n2 = fbm(x * 0.07 + 9, z * 0.07, 2) * 0.5 + 0.5;
    const n3 = fbm(x * 0.004 + 3, z * 0.004, 2) * 0.5 + 0.5;
    // turf holds on steeper ground low down; crags take over higher
    const rs = 0.3 + 0.1 * (1 - smoothstep(180, 320, h));
    let rock = smoothstep(rs, rs + 0.14, slope + (n1 - 0.5) * 0.14);
    rock = Math.max(rock, outcrop(x, z, d) * smoothstep(0.12, 0.28, slope + (n2 - 0.5) * 0.1));
    rock = Math.max(rock, smoothstep(330, 430, h + n1 * 60) * 0.9);
    const scree = smoothstep(0.2, 0.3, slope) * (1 - rock) * smoothstep(170, 260, h + n2 * 60);
    const meadow = (1 - rock) * (1 - scree);
    // snowfields lie on everything but the steep bands, lower on the gentler, higher ground;
    // above ~800 m only the steepest faces stay bare
    const hs = h + (n1 - 0.5) * 90 + (n3 - 0.5) * 120;
    const snow = Math.max(
      smoothstep(360, 460, hs) * smoothstep(0.64, 0.44, slope + (n2 - 0.5) * 0.18),
      smoothstep(600, 740, hs) * smoothstep(0.82, 0.64, slope));
    // alternating pale limestone and grey rock strata on the cliffs
    const band = smoothstep(-0.25, 0.25, Math.sin(h / 21 + n1 * 2.2));
    const drift = 0.9 + 0.2 * n2;
    const green = 1 - smoothstep(150, 330, h); // lush low, browner and thinner higher up
    // patchwork of pasture: fresh green, sun-bleached tawny patches and dark wet flushes
    const pw = fbm(x * 0.006 - 7, z * 0.006 + 2, 3) * 0.5 + 0.5;
    const tawny = smoothstep(0.55, 0.72, pw), flush = 1 - smoothstep(0.28, 0.4, pw);
    const dryM = Math.min(1, 0.25 * (1 - green) + 0.35 * tawny);
    return {
      w: {
        meadow: meadow * (1 - dryM), steppe: meadow * dryM, moss: meadow * flush * 0.35,
        pebbles: scree * 0.7, lichen: scree * 0.3 + rock * 0.15,
        limestone: rock * (0.2 + 0.55 * band), rock: rock * (0.65 - 0.5 * band),
      },
      tint: [drift * (1.0 - 0.04 * green + 0.02 * tawny - 0.06 * flush), drift * (0.98 + 0.05 * green - 0.04 * flush), drift * (0.88 + 0.08 * (1 - green) - 0.06 * tawny)],
      snow,
    };
  },

  grass(x, z, d, h) {
    const n = fbm(x * 0.04 + 2, z * 0.04 - 5, 3) * 0.5 + 0.5;
    const high = smoothstep(180, 320, h);
    const lush = smoothstep(0.18, 0.45, n) * (1 - high);
    const dry = smoothstep(0.5, 0.8, 1 - n) * 0.3 + high * 0.3 * (1 - smoothstep(330, 400, h));
    return [lush, dry];
  },

  flora: [
    // small, scattered pines in loose clusters, thinning out toward the treeline
    { kind: 'tree', variants: ['pineSmall', 'pine2', 'pine3'], size: [4, 11], wide: [0.6, 0.9],
      density: (x, z, d, h, slope) => {
        if (slope > 0.4) return 0;
        const clump = fbm(x * 0.009 + 21, z * 0.009, 3) + 0.3 * fbm(x * 0.05, z * 0.05, 2);
        return (0.0008 + 0.0042 * smoothstep(0.2, 0.5, clump)) * smoothstep(0.05, 0.2, clump) * (1 - smoothstep(180, 260, h)) * smoothstep(20, 50, Math.abs(d));
      } },
    { kind: 'tree', variants: ['pine1'], size: [10, 17], wide: [0.65, 0.85],
      density: (x, z, d, h, slope) => (slope < 0.35 && h < 150 && Math.abs(d) > 40 ? 0.00018 : 0) },
    // alpenrose and juniper patches
    { kind: 'bush', variants: ['heather', 'fbush'], size: [0.4, 1.1], wide: [1.0, 1.7],
      density: (x, z, d, h, slope) => (slope < 0.45 && h < 330 ? 0.005 * smoothstep(0.1, 0.45, fbm(x * 0.03 + 7, z * 0.03, 2)) : 0) },
    // pale limestone boulders in the meadows, scree under the crags
    { kind: 'rock', layer: 'limestone', size: [0.4, 4.5],
      density: (x, z, d, h, slope) => 0.0009 + 0.006 * smoothstep(0.14, 0.34, slope) },
  ],

  atmosphere: {
    sunElev: 42, sunAz: 320, turbidity: 2.2, rayleigh: 1.6, mie: 0.0025,
    fog: [0.68, 0.76, 0.88], fogDensity: 0.00025, exposure: 0.46, env: 0.25,
  },

  vignettes: ['lupines', 'poppies', 'daisies', 'cairn', 'tallgrass', 'balanced'],
};
