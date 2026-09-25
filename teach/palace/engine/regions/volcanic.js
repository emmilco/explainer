// Volcanic field: black, blocky aa lava flows with steep flow fronts over dark cinder ground,
// grey-olive moss on the older flows, a scatter of rust-rimmed cinder cones, and a dark
// stratovolcano towering on the −d side. The trail crosses the flows, then climbs a cinder
// apron on the +d side among the cones.
import { fbm, simplex, smoothstep, terrace } from '../noise.js';

// integer hash -> [0, 1), allocation-free
const hs = (i, j, s) => {
  let h = (i * 374761393 + j * 668265263 + s * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
};
// the valley centreline (mirrors world.js zc) so cones can be kept out of the trail corridor
const zc = (x) => 60 * Math.sin(x / 430) + 24 * Math.sin(x / 137 + 1.3) + 9 * Math.sin(x / 53 + 0.4);

// the stratovolcano: centred at mid-region, VD m to the −d side; footprint in u so it never
// reaches the region boundaries whatever the region length
const VD = -1500, VU = 0.6, VH = 640;
function volcano(d, u) {
  const rx = (u - VU) / 0.36, rz = (d - VD) / 1200;
  const r = Math.sqrt(rx * rx + rz * rz);
  if (r >= 1) return 0;
  const q = 1 - r;
  let h = VH * q * q * (1.25 - 0.25 * q); // concave flanks steepening to the summit
  // radial gullies and spurs down the flanks
  const ir = 1 / (r + 1e-6);
  h += VH * 0.07 * fbm(rx * ir * 2.6 + r * 1.2, rz * ir * 2.6 - r * 0.8, 2) * smoothstep(0.03, 0.2, r) * q;
  h -= VH * 0.09 * smoothstep(0.1, 0.03, r); // summit crater
  return h;
}

const CS = 520; // cone cell size (m)
// Cinder cones: at most one per cell; returns height, sets coneRed (oxidised crater rim 0..1)
let coneRed = 0;
function cones(x, z) {
  const gx = x / CS, gz = z / CS;
  const i0 = Math.floor(gx - 0.5), j0 = Math.floor(gz - 0.5);
  let best = 0; coneRed = 0;
  for (let j = j0; j <= j0 + 1; j++) for (let i = i0; i <= i0 + 1; i++) {
    if (hs(i, j, 1) > 0.78) continue;
    const cx = (i + 0.2 + 0.6 * hs(i, j, 2)) * CS, cz = (j + 0.2 + 0.6 * hs(i, j, 3)) * CS;
    const cd = cz - zc(cx);
    const far = smoothstep(500, 1600, Math.abs(cd));
    const R = (95 + 120 * hs(i, j, 4)) * (1 + 0.5 * far);
    if (cd - R < 420 && cd + R > -200) continue; // trail corridor clear
    const dx = x - cx, dz = z - cz, r2 = dx * dx + dz * dz;
    if (r2 >= R * R) continue;
    const t = Math.sqrt(r2) / R, H = R * (0.36 + 0.1 * hs(i, j, 5)), tc = 0.28 + 0.08 * hs(i, j, 7);
    let h;
    // steep straight-sided scoria cone (~30°) with a soft foot, and a bowl crater
    if (t > tc) { const s = (1 - t) / (1 - tc); h = H * s * (0.55 + 0.45 * s) ; }
    else { const q = t / tc; h = H - H * 0.34 * (1 - q * q); }
    if (h > best) { best = h; coneRed = smoothstep(0.62, 0.22, t) * (0.4 + 0.6 * hs(i, j, 6)); }
  }
  return best;
}

// lava flow mask (1 on a flow, 0 on cinder ground); sharp margins make steep flow fronts
const flowN = (x, z) => fbm(x * 0.0032 + 11, z * 0.0032 - 4, 3) + 0.12;
const flowMask = (x, z) => smoothstep(-0.015, 0.02, flowN(x, z));
// older flows are mossed over, in patches
const mossMask = (x, z) => smoothstep(0.15, 0.4, fbm(x * 0.008 - 7, z * 0.008 + 2, 3));

// aa clinker: irregular Voronoi blocks, each a tilted slab; cracks between them.
// Writes bH (block height 0..1) and bE (distance to the nearest crack, 0 on it).
let bH = 0, bE = 0;
function blocks(x, z) {
  const gx = x / 4.2, gz = z / 4.2;
  const xi = Math.floor(gx), zi = Math.floor(gz);
  let b1 = 9, b2 = 9, id = 0, ci = 0, cj = 0, px = 0, pz = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const cx = xi + i, cz = zi + j;
    const fx = cx + hs(cx, cz, 11) - gx, fz = cz + hs(cx, cz, 12) - gz;
    const d2 = fx * fx + fz * fz;
    if (d2 < b1) { b2 = b1; b1 = d2; ci = cx; cj = cz; px = fx; pz = fz; } else if (d2 < b2) b2 = d2;
  }
  id = hs(ci, cj, 13);
  bE = Math.sqrt(b2) - Math.sqrt(b1);
  bH = id + (hs(ci, cj, 14) - 0.5) * px * 0.8 + (hs(ci, cj, 15) - 0.5) * pz * 0.8;
}

export default {
  name: 'volcanic',
  floor: 6,
  lift: [[0, 0], [0.3, 2], [0.55, 14], [0.8, 17], [1, 4]],

  height(x, z, d, u) {
    // cinder apron rising on +d toward the cone field
    const apron = smoothstep(40, 700, d) * 70 + smoothstep(600, 1800, d) * 60;
    const swell = fbm(x * 0.0025 + 5, z * 0.0025, 3) * 8 * smoothstep(20, 160, Math.abs(d));
    const c = cones(x, z);
    const v = volcano(d, u);
    // lava: a 3–5 m thick flow with a steep front, tumuli and pressure ridges, blocky top
    const fm = flowMask(x, z) * (1 - smoothstep(1, 12, c)) * (1 - smoothstep(5, 40, v));
    let lava = 0;
    if (fm > 0.001) {
      const pr = 1 - Math.abs(simplex(x * 0.016 + 3, z * 0.04 - 8));
      blocks(x, z);
      const thick = 3.2 + 1.6 * fbm(x * 0.01 + 1, z * 0.01, 2) + pr * pr * 1.5;
      // stepped lobes: flat-topped slabs with sharp risers, broken into blocks
      const slab = terrace(thick + bH * 1.3, 1.1, 0.45);
      lava = fm * (slab - (1 - smoothstep(0, 0.12, bE)) * 0.6);
    }
    const hummock = fbm(x * 0.03 - 4, z * 0.03 + 1, 2) * 0.9;
    return apron + swell + lava + hummock + Math.max(c, v) + fbm(x * 0.09, z * 0.09, 2) * 0.35;
  },

  surface(x, z, h, slope, d, u) {
    const n2 = fbm(x * 0.07 + 9, z * 0.07, 2) * 0.5 + 0.5;
    const n3 = fbm(x * 0.004 - 3, z * 0.004 + 8, 2) * 0.5 + 0.5;
    const cone = smoothstep(1, 12, cones(x, z));
    const red = cone * coneRed;
    const vh = volcano(d, u);
    const vol = smoothstep(5, 40, vh) * (1 - cone);
    const f = flowMask(x, z) * (1 - cone) * (1 - vol);
    const steep = smoothstep(0.35, 0.6, slope);
    // moss only on older flows, gentle ground, in patches
    const moss = mossMask(x, z) * f * (1 - steep) * smoothstep(0.4, 0.65, n3) * 0.5;
    const lava = Math.max(f, steep * (1 - cone) * 0.7) * (1 - moss);
    const ash = (1 - lava) * (1 - moss);
    // aa flow tops are clinker rubble (cinder texture, near black); fronts and slabs are basalt
    const top = lava * (1 - steep) * (0.45 + 0.4 * n2);
    // the volcano: rust-brown summit, dark streaked flanks
    const summit = vol * smoothstep(380, 560, vh);
    // oxidised patches on the cinder flats (old vents): rust-red scoria
    const gate = smoothstep(0.15, 0.3, fbm(x * 0.0022 + 40, z * 0.0022 - 17, 2));
    const fn = (fbm(x * 0.02 + 5, z * 0.02 - 9, 3) * 0.5 + 0.5) * gate + (n2 - 0.5) * 0.1;
    const open = ash * (1 - cone) * (1 - vol) * (1 - steep);
    const rust = open * smoothstep(0.5, 0.66, fn) * 0.8 + red;
    const k = 0.9 + 0.2 * n2;
    // cone flanks: black scoria at the foot, red towards the crater
    const ashK = 0.8 + 0.14 * (n3 - 0.5) + 0.3 * summit - 0.2 * vol - 0.2 * cone * (1 - coneRed);
    return {
      w: {
        basalt: lava - top + ash * vol * 0.35,
        cinder: top + ash * (1 - vol * 0.35),
        moss,
        pebbles: ash * 0.1 * (1 - n2) * (1 - cone) * (1 - vol),
      },
      tint: [
        k * ((lava - top) * 1.0 + top * 0.5 + ash * (ashK + 0.6 * rust) + moss * 1.0),
        k * ((lava - top) * 0.95 + top * 0.47 + ash * (ashK - 0.15 * rust - 0.08 * summit - 0.04) + moss * 0.98),
        k * ((lava - top) * 0.9 + top * 0.45 + ash * (ashK - 0.3 * rust - 0.14 * summit - 0.07) + moss * 0.9),
      ],
    };
  },

  grass(x, z, d) {
    // a few tough tufts on the cinder between the flows
    const n = fbm(x * 0.04 + 2, z * 0.04 - 5, 2) * 0.5 + 0.5;
    return [0, (1 - flowMask(x, z)) * smoothstep(0.6, 0.85, n) * 0.25 * smoothstep(20, 60, d)];
  },

  flora: [
    { kind: 'tree', variants: ['dead'], size: [4, 8],
      density: (x, z, d, h, slope) => (slope < 0.3 ? 0.00012 * (1 - flowMask(x, z)) : 0) },
    { kind: 'bush', variants: ['dbush'], size: [0.3, 0.8], wide: [1.0, 1.5],
      density: (x, z, d, h, slope) => (slope < 0.3 ? 0.0012 * smoothstep(0.2, 0.5, fbm(x * 0.03 + 5, z * 0.03, 2)) * (1 - 0.7 * flowMask(x, z)) : 0) },
    { kind: 'rock', layer: 'basalt', size: [0.5, 2.8],
      density: (x, z, d, h, slope) => 0.0008 + 0.0072 * flowMask(x, z) },
  ],

  atmosphere: {
    sunElev: 32, sunAz: 260, turbidity: 12, rayleigh: 3.5, mie: 0.014,
    fog: [0.55, 0.53, 0.52], fogDensity: 0.00042, exposure: 0.62, env: 0.14,
  },

  vignettes: ['deadtree', 'cairn', 'balanced'],
};
