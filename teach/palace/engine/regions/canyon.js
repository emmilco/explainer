// Red-strata canyon country: terraced mesas of banded sandstone around a dry wash; saguaro,
// scrub, and fallen boulders. The trail follows the wash, then climbs onto the benches.
import { fbm, smoothstep, terrace, C } from '../noise.js';

export default {
  name: 'canyon',
  floor: -6,
  lift: [[0, 0], [0.35, 0], [0.55, 14], [0.8, 18], [1, 4]],

  height(x, z, d) {
    const ad = Math.abs(d);
    const m = fbm(x * 0.0032 + 7.1, z * 0.0032 - 3.3, 4) * 0.5 + 0.5;
    const mask = smoothstep(30, 150, ad);
    const massif = m * m * 190 * mask + ad * 0.04 + smoothstep(250, 700, ad) * 90;
    let h = terrace(massif, 13)
      + fbm(x * 0.02, z * 0.02, 3) * 1.3 * (1 - mask * 0.7)
      + fbm(x * 0.12, z * 0.12, 2) * 0.25;
    h -= (1 - smoothstep(2, 13, ad)) * 1.1; // dry wash
    return h;
  },

  surface(x, z, h, slope) {
    const n2 = fbm(x * 0.07 + 9, z * 0.07, 2) * 0.5 + 0.5;
    const rock = smoothstep(0.18, 0.34, slope + (n2 - 0.5) * 0.08);
    const drift = 0.88 + 0.24 * n2;
    return { w: { sand: 1 - rock, strata: rock }, tint: [drift, drift * 0.98, drift * 0.95] };
  },

  grass(x, z) {
    const n2 = fbm(x * 0.2, z * 0.2, 2) * 0.5 + 0.5;
    return [0, smoothstep(0.55, 0.8, n2) * 0.5];
  },

  flora: [
    { kind: 'cactus', variants: ['saguaro'], size: [0.7, 1.4],
      density: (x, z, d, h, slope) => (Math.abs(d) > 6 && slope < 0.25 ? 0.0009 : 0) },
    { kind: 'bush', variants: ['dbush'], size: [0.6, 1.6], wide: [1.0, 1.6],
      density: (x, z, d, h, slope) => (slope < 0.3 ? 0.004 * (0.3 + 0.7 * (fbm(x * 0.05, z * 0.05, 2) * 0.5 + 0.5)) : 0) },
    { kind: 'rock', layer: 'strata', size: [0.5, 5],
      density: (x, z, d, h, slope) => 0.0008 + 0.006 * smoothstep(0.1, 0.35, slope) },
  ],

  atmosphere: {
    sunElev: 40, sunAz: 250, turbidity: 3.5, rayleigh: 1.1, mie: 0.004,
    fog: [0.74, 0.64, 0.54], fogDensity: 0.00045, exposure: 0.42, env: 0.25,
  },

  vignettes: ['brittlebush', 'barrels', 'ocotillo', 'balanced', 'deadtree', 'hoodoos', 'desertpoppies'],
};
