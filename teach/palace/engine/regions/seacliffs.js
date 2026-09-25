// Sea cliffs: the trail runs along a grassy clifftop with the open sea on the −d side, far
// below. Pale cliffs drop to a wave-cut shelf; headlands and coves alternate along the coast,
// a few sea stacks stand offshore, and rolling downs rise inland. Low warm sun over the water.
import { fbm, ridged, worley, smoothstep, mix, terrace } from '../noise.js';

const SEA = -30;     // water level relative to floor
const BED = -95;     // sea floor

// clifftop height at the brink and the coastline position (d of the brink) at x
function rimAt(x, u) {
  const bump = smoothstep(0.02, 0.3, u) * (1 - 0.5 * smoothstep(0.72, 0.98, u));
  return 10 + 30 * bump + fbm(x * 0.0031 + 5.3, 1.7, 3) * 16 * (0.4 + 0.6 * bump);
}
// coves along the trail, and every few hundred metres a long headland running out to sea.
// edgeAt depends on x alone and is called several times per sample, so it is memoised in a
// small direct-mapped cache (terrain grids revisit the same x values row after row).
const CN = 4096, cKey = new Float64Array(CN).fill(NaN), cVal = new Float64Array(CN);
function edgeAt(x) {
  const i = ((Math.round(x * 4) % CN) + CN) % CN;
  if (cKey[i] === x) return cVal[i];
  cKey[i] = x;
  return (cVal[i] = edgeRaw(x));
}
function edgeRaw(x) {
  const head = Math.pow(smoothstep(-0.05, 0.4, fbm(x * 0.0028 + 1.3, 7.7, 3)), 2.2);
  const e = -18 + fbm(x * 0.0045 - 2.1, 4.4, 3) * 26 + fbm(x * 0.019, 9.1, 2) * 8 - head * 240;
  return e > -12 ? -12 + (e + 12) * 0.15 : e; // keep the brink clear of the trail (d ≈ 15)
}

export default {
  name: 'seacliffs',
  floor: 0,
  floorNoise: 0,
  water: { level: SEA, kind: 'sea' },
  lift: [[0, 0], [1, 0]],

  height(x, z, d, u) {
    const rim = rimAt(x, u), edge = edgeAt(x);
    // land: a clifftop that dips gently toward the brink, rolling downs rising inland
    const n = fbm(x * 0.0026 + 11, z * 0.0026, 4) * 0.5 + 0.5;
    // the top tilts seaward so the water shows from the trail
    const t = Math.min(60, d - 15);
    const land = rim + (t > -45 ? t * 0.22 : -9.9 + (t + 45) * 0.1) + smoothstep(40, 750, d) * 150 * (0.45 + 0.9 * n)
      + fbm(x * 0.009, z * 0.009, 3) * 7 * smoothstep(10, 120, d)
      + fbm(x * 0.045, z * 0.045, 2) * 0.7;
    // cliff face: irregular brink, near-vertical face, wave-cut shelf, then the deep sea floor
    // buttresses and gullies fold the face; ledges step it
    const rough = (ridged(x * 0.03, z * 0.03 + 3, 3) - 0.5) * 16 + (ridged(x * 0.11, z * 0.11 - 5, 2) - 0.5) * 6
      + fbm(x * 0.012, z * 0.012, 2) * 6;
    // distance to the coastline measured across it, so headland flanks get the same relief
    const g = (edgeAt(x + 3) - edgeAt(x - 3)) / 6;
    const e = (d - edge) / Math.sqrt(1 + g * g) + rough;
    const toe = SEA - 1.2 + fbm(x * 0.06, z * 0.06, 2) * 2.2 + (1 - smoothstep(-13, -24, e)) * 2.5;
    const bed = BED + fbm(x * 0.004, z * 0.004, 3) * 14;
    const f = smoothstep(-1, -13, e);
    let h = mix(land - (1 - smoothstep(0, 10, e)) * 2.5, toe, f);
    if (f > 0.02 && f < 0.98) h = mix(h, SEA + terrace(h - SEA, 6.5, 0.55), 0.8 * Math.min(1, f * 5, (1 - f) * 5));
    h = mix(h, bed, smoothstep(-28, -110, e));
    // sea stacks offshore
    if (e < -45) {
      const w = worley(x * 0.009 + 0.3, z * 0.009 + 3.1) + (ridged(x * 0.05, z * 0.05, 3) - 0.5) * 0.09;
      const pick = smoothstep(0.3, 0.45, fbm(x * 0.0021 + 4, z * 0.0021, 2)) * smoothstep(-45, -80, e) * (1 - smoothstep(-450, -650, e));
      if (pick > 0 && w < 0.4) {
        const v = fbm(x * 0.004 - 3, z * 0.004 + 8, 2) * 0.5 + 0.5; // per-stack height and girth
        const r = 0.08 + 0.12 * v;
        const col = smoothstep(r + 0.025, r - 0.01, w) * pick;
        const apron = smoothstep(r + 0.16, r + 0.02, w) * pick;
        const top = SEA + (rim - SEA) * (0.3 + 0.8 * v) + fbm(x * 0.03, z * 0.03, 2) * 5 - smoothstep(r - 0.06, r, w) * 3;
        h = mix(h, toe + 1.5 + fbm(x * 0.2, z * 0.2, 2) * 1.5, apron);
        h = mix(h, SEA + terrace(top - SEA, 5, 0.6) * 0.3 + (top - SEA) * 0.7, col);
      }
    }
    return h;
  },

  surface(x, z, h, slope, d) {
    const n1 = fbm(x * 0.02, z * 0.02, 3) * 0.5 + 0.5, n2 = fbm(x * 0.07 + 9, z * 0.07, 2) * 0.5 + 0.5;
    const cliff = smoothstep(0.24, 0.42, slope + (n1 - 0.5) * 0.1);
    const shore = 1 - smoothstep(SEA + 2, SEA + 6, h + n2 * 2);
    const sea = 1 - smoothstep(SEA - 6, SEA - 1, h);
    const dry = smoothstep(0.45, 0.75, n1) * smoothstep(60, 200, d);
    const green = (1 - cliff) * (1 - shore);
    const drift = 0.9 + 0.2 * n2;
    return {
      w: {
        meadow: green * (1 - dry) * (1 - sea), steppe: green * dry * (1 - sea),
        limestone: cliff * (0.75 + 0.25 * n2) * (1 - sea), rock: cliff * 0.25 * (1 - n2) * (1 - sea),
        lichen: cliff * 0.3 * (1 - n1) * smoothstep(SEA + 8, SEA + 20, h),
        pebbles: shore * (1 - cliff) * (1 - sea), sand: sea,
      },
      tint: [drift * mix(0.97, 1.28, cliff), drift * mix(1.04, 1.24, cliff), drift * mix(0.9, 1.14, cliff)],
    };
  },

  grass(x, z, d, h) {
    const edge = edgeAt(x);
    const n = fbm(x * 0.05 + 2, z * 0.05 - 5, 3) * 0.5 + 0.5;
    const top = smoothstep(edge + 2, edge + 8, d) * smoothstep(0, 5, h);
    const lush = top * smoothstep(0.15, 0.5, n) * (1 - smoothstep(90, 220, d));
    const dry = top * (0.25 + 0.35 * smoothstep(0.5, 0.8, n));
    return [lush, dry];
  },

  flora: [
    // gorse and heather clumps on the clifftop and the downs
    { kind: 'bush', variants: ['fbush', 'dbush'], size: [0.7, 1.8], wide: [1.1, 1.8],
      density: (x, z, d, h, slope) => (h > 4 && slope < 0.3 && d > edgeAt(x) + 10
        ? 0.0065 * smoothstep(0.0, 0.35, fbm(x * 0.012 + 3, z * 0.012, 3)) : 0) },
    { kind: 'bush', variants: ['heather'], size: [0.4, 0.9], wide: [1.2, 2.0],
      density: (x, z, d, h, slope) => (h > 4 && slope < 0.3 && d > edgeAt(x) + 6
        ? 0.007 * smoothstep(-0.1, 0.3, fbm(x * 0.02 - 7, z * 0.02, 2)) : 0) },
    // a few wind-bent trees in the hollows of the downs
    { kind: 'tree', variants: ['oak', 'ash'], size: [6, 11],
      density: (x, z, d, h, slope) => (d > 90 && slope < 0.25 ? 0.0008 * smoothstep(0.15, 0.45, fbm(x * 0.008, z * 0.008 + 5, 3)) : 0) },
    // fallen blocks at the cliff foot, scattered stones on the top
    { kind: 'rock', layer: 'limestone', size: [0.8, 6],
      density: (x, z, d, h, slope) => (h < SEA + 6 && h > SEA - 3 ? 0.008 : 0.0005 * smoothstep(0.2, 0.4, slope)) },
    { kind: 'rock', layer: 'rock', size: [0.4, 2.2],
      density: (x, z, d, h, slope) => (h > 4 ? 0.0006 + 0.004 * smoothstep(0.15, 0.3, slope) : 0) },
  ],

  atmosphere: {
    sunElev: 14, sunAz: 120, turbidity: 4, rayleigh: 1.6, mie: 0.004,
    fog: [0.74, 0.72, 0.70], fogDensity: 0.00055, exposure: 0.5, env: 0.25,
  },

  vignettes: ['daisies', 'tallgrass', 'cairn', 'hedgerow', 'poppies'],
};
