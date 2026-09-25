// Vignettes: small distinctive features along the walk (a cluster of poppies, a ring of
// hedges, waist-high grass, a cairn…) that break up the walking stretches. Layout is pure
// (positions only) so vegetation can keep clear; build() adds the meshes.
import * as THREE from 'three';
import { fbm, smoothstep } from './noise.js';

// the world model this module places things on (set once by the walk)
let T = null;
export function setWorld(W) { T = { height: W.height, trailWeight: W.trailWeight, zc: W.zc, fbm, smoothstep }; }
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

const FOREST = ['poppies', 'lupines', 'daisies', 'tallgrass', 'hedgering', 'hedgerow', 'bigtree', 'cairn', 'log', 'birches'];
const DESERT = ['brittlebush', 'barrels', 'ocotillo', 'balanced', 'deadtree', 'hoodoos', 'desertpoppies'];
const RADIUS = {
  poppies: 4, lupines: 4, daisies: 5, tallgrass: 8, hedgering: 5, hedgerow: 7, bigtree: 9, cairn: 2, log: 4, birches: 6,
  brittlebush: 5, barrels: 3, ocotillo: 4, balanced: 4, deadtree: 6, hoodoos: 6, desertpoppies: 5,
};

// Place vignettes every ~spacing metres of path, alternating sides, avoiding stops.
export function layout({ curve, LEN, frameAt, rnd, stopS, spacing = 34 }) {
  const out = [];
  const bag = { f: [], d: [] };
  const draw = (desert) => {
    const key = desert ? 'd' : 'f', src = desert ? DESERT : FOREST;
    if (!bag[key].length) bag[key] = [...src].sort(() => rnd() - 0.5);
    return bag[key].pop();
  };
  let side = rnd() < 0.5 ? -1 : 1;
  for (let s = 22 + rnd() * 10; s < LEN - 15; s += spacing * (0.75 + rnd() * 0.5)) {
    if (stopS.some((ss) => Math.abs(ss - s) < 18)) continue;
    const { p, t, n } = frameAt(s / LEN);
    const b = T.biome(p.x);
    if (b > 0.35 && b < 0.6) continue; // transition zone stays plain
    const kind = draw(b >= 0.5);
    const r = RADIUS[kind];
    const off = r + 3 + rnd() * 5;
    const at = (sd) => p.clone().addScaledVector(n, sd * off).addScaledVector(t, (rnd() - 0.5) * 6);
    const wet = (q) => b < 0.5 && Math.abs(q.z - T.zc(q.x)) < 11 + r; // keep out of the river
    let c = at(side);
    if (wet(c)) { side = -side; c = at(side); }
    if (wet(c)) continue;
    c.y = T.height(c.x, c.z);
    out.push({ kind, c, r, s, side, notice: rnd() < 0.55, seed: Math.floor(rnd() * 1e6) });
    side = -side;
  }
  return out;
}

// Grass modifiers baked into the grass field: [tall 0..1, suppress 0..1]
export function grassMod(vigs) {
  const tall = vigs.filter((v) => v.kind === 'tallgrass');
  const clear = vigs.filter((v) => ['cairn', 'balanced', 'hoodoos'].includes(v.kind));
  return (x, z) => {
    let t = 0, sup = 0;
    for (const v of tall) {
      const d = Math.hypot(x - v.c.x, z - v.c.z) + T.fbm(x * 0.3, z * 0.3, 2) * 2;
      t = Math.max(t, 1 - T.smoothstep(v.r * 0.6, v.r, d));
    }
    for (const v of clear) sup = Math.max(sup, 1 - T.smoothstep(v.r * 0.4, v.r * 0.8, Math.hypot(x - v.c.x, z - v.c.z)));
    return [t, sup];
  };
}

// ---------- geometry helpers ----------
const srgb = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
function mulberry(seed) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// Flowers: stems and heads as two instanced meshes sharing transforms, swaying in the wind.
function flowerMeshes(kind, count) {
  const stem = new THREE.CylinderGeometry(0.006, 0.009, 1, 4, 1).translate(0, 0.5, 0);
  let head;
  if (kind === 'lupine') head = new THREE.ConeGeometry(0.035, 0.28, 7).translate(0, 1.0, 0);
  else if (kind === 'daisy') head = new THREE.CylinderGeometry(0.035, 0.03, 0.01, 10).translate(0, 1.0, 0);
  else if (kind === 'ocotillo') head = new THREE.ConeGeometry(0.03, 0.22, 5).translate(0, 1.02, 0);
  else head = new THREE.SphereGeometry(0.045, 8, 5, 0, Math.PI * 2, 0, Math.PI * 0.6).rotateX(Math.PI).translate(0, 1.02, 0); // cup
  const wind = { value: 0 };
  const sway = (m) => {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uTime = wind;
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', '#include <common>\nuniform float uTime;')
        .replace('#include <begin_vertex>', `#include <begin_vertex>
          vec3 ip = instanceMatrix[3].xyz;
          float k = clamp(position.y, 0.0, 1.2); k *= k;
          transformed.x += sin(uTime * 1.6 + ip.x * 0.7 + ip.z * 0.4) * 0.08 * k;
          transformed.z += cos(uTime * 1.3 + ip.x * 0.5) * 0.05 * k;`);
    };
    m.customProgramCacheKey = () => 'flower-sway';
    return m;
  };
  const stems = new THREE.InstancedMesh(stem, sway(new THREE.MeshStandardMaterial({ color: srgb(0.22, 0.34, 0.12), roughness: 0.8 })), count);
  const heads = new THREE.InstancedMesh(head, sway(new THREE.MeshStandardMaterial({ roughness: 0.6, side: THREE.DoubleSide })), count);
  return { stems, heads, wind };
}

function scatterFlowers(scene, winds, v, kind, colors, n, hRange, { ring = false } = {}) {
  const r = mulberry(v.seed + kind.length);
  const { stems, heads, wind } = flowerMeshes(kind, n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), c = new THREE.Color();
  let k = 0;
  for (let i = 0; i < n * 3 && k < n; i++) {
    // clustered: denser toward the centre, with a few satellite clumps
    const a = r() * Math.PI * 2, d = v.r * Math.pow(r(), ring ? 0.3 : 0.75);
    const x = v.c.x + Math.cos(a) * d, z = v.c.z + Math.sin(a) * d;
    if (T.trailWeight(x, z) > 0.1) continue;
    const h = hRange[0] + (hRange[1] - hRange[0]) * r();
    q.setFromEuler(new THREE.Euler((r() - 0.5) * 0.25, r() * 6.28, (r() - 0.5) * 0.25));
    s.set(1, h, 1);
    m.compose(new THREE.Vector3(x, T.height(x, z) - 0.02, z), q, s);
    stems.setMatrixAt(k, m); heads.setMatrixAt(k, m);
    const col = colors[Math.floor(r() * colors.length)];
    c.copy(col).multiplyScalar(0.85 + r() * 0.3); heads.setColorAt(k, c);
    k++;
  }
  stems.count = heads.count = k;
  for (const o of [stems, heads]) { o.castShadow = false; o.receiveShadow = true; o.computeBoundingSphere(); scene.add(o); }
  winds.push(wind);
}

// Place an instanced tree variant at explicit spots
function placeVariant(scene, instanceVariant, variant, spots) {
  instanceVariant(scene, variant, spots.map((p) => ({ yaw: p.yaw ?? 0, h: p.h, wide: p.wide, shade: p.shade ?? 1, x: p.x, y: T.height(p.x, p.z) - 0.1, z: p.z })));
}

export function build(scene, vigs, deps) {
  const { V, makeVariant, instanceVariant, rockMesh, rnd } = deps;
  const winds = [];
  const extra = {
    bigoak: makeVariant('Oak Large', 17, 0x93a47e),
    dead: (() => { const v = makeVariant('Ash Medium', 29, 0xffffff, { noLeaves: true, bark: 0xd8d0c4 }); return v; })(),
  };
  const hedges = { ring: [], row: [], brittle: [], birch: [], oak: [], dead: [] };
  const rocks = [];
  // stack rocks bottom-up: each entry [width, height] in rock-geometry units
  const stack = (x, z, dims, desert, r, jitter) => {
    let y = 0;
    for (const [w, h] of dims) {
      y += 0.3 * h * 0.85;
      rocks.push({ x: x + (r() - 0.5) * jitter, z: z + (r() - 0.5) * jitter, y, s: [w, h, w * (0.9 + r() * 0.2)], desert, yaw: r() * 6.28 });
      y += 0.45 * h * 0.85;
    }
  };
  const blobs = [];
  const logs = [];
  const barrels = [];
  for (const v of vigs) {
    const r = mulberry(v.seed);
    switch (v.kind) {
      case 'poppies':
        scatterFlowers(scene, winds, v, 'poppy', [srgb(0.78, 0.07, 0.04), srgb(0.85, 0.12, 0.05), srgb(0.7, 0.05, 0.08)], 420, [0.35, 0.6]); break;
      case 'desertpoppies':
        scatterFlowers(scene, winds, v, 'poppy', [srgb(0.95, 0.5, 0.05), srgb(0.98, 0.62, 0.1)], 300, [0.2, 0.35]); break;
      case 'lupines':
        scatterFlowers(scene, winds, v, 'lupine', [srgb(0.35, 0.25, 0.75), srgb(0.5, 0.3, 0.8), srgb(0.75, 0.55, 0.85)], 260, [0.55, 0.85]); break;
      case 'daisies':
        scatterFlowers(scene, winds, v, 'daisy', [srgb(0.95, 0.95, 0.9), srgb(0.95, 0.85, 0.3)], 600, [0.18, 0.35]); break;
      case 'ocotillo':
        for (let i = 0; i < 5; i++) {
          const a = r() * 6.28, d = r() * v.r * 0.7;
          scatterFlowers(scene, winds, { ...v, c: v.c.clone().add(new THREE.Vector3(Math.cos(a) * d, 0, Math.sin(a) * d)), r: 0.5, seed: v.seed + i },
            'ocotillo', [srgb(0.85, 0.12, 0.05)], 14, [2.2, 3.6], { ring: true });
        }
        break;
      case 'hedgering': {
        const n = 9 + Math.floor(r() * 4);
        for (let i = 0; i < n; i++) { const a = i / n * 6.283, sz = 0.75 + 0.2 * Math.sin(i * 2.1); blobs.push({ x: v.c.x + Math.cos(a) * v.r * 0.8, z: v.c.z + Math.sin(a) * v.r * 0.8, s: [sz, sz * 1.15, sz], yaw: r() * 6 }); }
        blobs.push({ x: v.c.x, z: v.c.z, s: [1.1, 1.6, 1.1], yaw: 0 }); // a taller centrepiece
        break;
      }
      case 'hedgerow': {
        const dir = new THREE.Vector3(r() - 0.5, 0, r() - 0.5).normalize();
        for (let i = -6; i <= 6; i++) {
          const p = v.c.clone().addScaledVector(dir, i * 1.1);
          p.addScaledVector(new THREE.Vector3(-dir.z, 0, dir.x), Math.sin(i * 0.7) * 1.4);
          blobs.push({ x: p.x, z: p.z, s: [0.95, 0.8 + 0.35 * Math.sin(i * 1.3) ** 2, 0.8], yaw: Math.atan2(dir.x, dir.z) });
        }
        break;
      }
      case 'bigtree': hedges.oak.push({ x: v.c.x, z: v.c.z, h: 24, wide: 1.1, yaw: r() * 6 }); break;
      case 'birches':
        for (let i = 0; i < 8; i++) { const a = r() * 6.28, d = r() * v.r * 0.7; hedges.birch.push({ x: v.c.x + Math.cos(a) * d, z: v.c.z + Math.sin(a) * d, h: 11 + r() * 6, yaw: r() * 6 }); }
        break;
      case 'deadtree': hedges.dead.push({ x: v.c.x, z: v.c.z, h: 9, yaw: r() * 6 }); break;
      case 'brittlebush':
        for (let i = 0; i < 7; i++) { const a = r() * 6.28, d = r() * v.r * 0.8; hedges.brittle.push({ x: v.c.x + Math.cos(a) * d, z: v.c.z + Math.sin(a) * d, h: 0.9 + r() * 0.5, wide: 1.3, yaw: r() * 6 }); }
        scatterFlowers(scene, winds, v, 'daisy', [srgb(0.98, 0.82, 0.1)], 350, [0.7, 1.2]);
        break;
      case 'cairn':
        stack(v.c.x, v.c.z, [0.6, 0.52, 0.45, 0.4, 0.34, 0.28, 0.22].map((w) => [w, w * 0.85]), false, r, 0.08); break;
      case 'balanced': // a narrow pedestal carrying a much bigger boulder
        stack(v.c.x, v.c.z, [[1.3, 1.2], [0.9, 1.1], [0.6, 0.9], [2.0, 1.7]], true, r, 0.1); break;
      case 'hoodoos':
        for (let i = 0; i < 5; i++) {
          const a = r() * 6.28, d = r() * v.r * 0.7, n = 3 + Math.floor(r() * 5);
          stack(v.c.x + Math.cos(a) * d, v.c.z + Math.sin(a) * d,
            [...Array.from({ length: n }, (_, k) => [0.95 - k * 0.06, 1.0]), [1.35, 0.6]], true, r, 0.12);
        }
        break;
      case 'log': logs.push({ c: v.c, yaw: r() * 6.28, len: 7 + r() * 4, rad: 0.35 + r() * 0.15 }); break;
      case 'barrels':
        for (let i = 0; i < 9; i++) { const a = r() * 6.28, d = r() * v.r; barrels.push({ x: v.c.x + Math.cos(a) * d, z: v.c.z + Math.sin(a) * d, s: 0.35 + r() * 0.35 }); }
        break;
      default: break; // tallgrass lives in the grass field
    }
  }
  if (blobs.length) {
    const g0 = new THREE.IcosahedronGeometry(1, 4); g0.deleteAttribute('normal'); g0.deleteAttribute('uv');
    const g = mergeVertices(g0);
    const p = g.attributes.position, col = new Float32Array(p.count * 3), base = srgb(0.20, 0.30, 0.12);
    for (let i = 0; i < p.count; i++) {
      const v3 = new THREE.Vector3().fromBufferAttribute(p, i);
      const n1 = T.fbm(v3.x * 3 + v3.y * 2, v3.z * 3 - v3.y, 3), n2 = T.fbm(v3.x * 11 + v3.y * 7, v3.z * 11 - v3.y * 5, 2);
      v3.multiplyScalar(1 + n1 * 0.06 + n2 * 0.09);
      if (v3.y < -0.2) v3.y = -0.2 + (v3.y + 0.2) * 0.3; // flat-ish base
      p.setXYZ(i, v3.x, v3.y + 0.2, v3.z);
      const k = 0.75 + 0.5 * (n2 * 0.5 + 0.5) + 0.15 * v3.y;
      col.set([base.r * k, base.g * k, base.b * k * 0.9], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    const mesh = new THREE.InstancedMesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true, envMapIntensity: 0.5 }), blobs.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion();
    blobs.forEach((b, i) => {
      q.setFromEuler(new THREE.Euler(0, b.yaw, 0));
      m.compose(new THREE.Vector3(b.x, T.height(b.x, b.z) - 0.05, b.z), q, new THREE.Vector3(...b.s));
      mesh.setMatrixAt(i, m);
    });
    mesh.castShadow = mesh.receiveShadow = true; mesh.computeBoundingSphere();
    scene.add(mesh);
  }
  placeVariant(scene, instanceVariant, V.dbush, hedges.brittle);
  placeVariant(scene, instanceVariant, V.aspen, hedges.birch);
  placeVariant(scene, instanceVariant, extra.bigoak, hedges.oak);
  placeVariant(scene, instanceVariant, extra.dead, hedges.dead);
  for (const w of [extra.bigoak.wind, extra.dead.wind]) winds.push(w);

  // stacked rocks (cairns, balanced rocks, hoodoos) share the ground rock meshes
  for (const desert of [false, true]) {
    const list = rocks.filter((x) => x.desert === desert);
    if (!list.length) continue;
    const mesh = rockMesh(desert, list.length);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion();
    list.forEach((o, i) => {
      q.setFromEuler(new THREE.Euler(0, o.yaw, 0));
      m.compose(new THREE.Vector3(o.x, T.height(o.x, o.z) + o.y, o.z), q, new THREE.Vector3(...o.s));
      mesh.setMatrixAt(i, m);
    });
    mesh.computeBoundingSphere();
    scene.add(mesh);
  }
  // fallen logs: bark-textured cylinders borrowed from the pine variant
  for (const L of logs) {
    const g = new THREE.CylinderGeometry(L.rad, L.rad * 1.15, L.len, 12, 1).rotateZ(Math.PI / 2);
    const mesh = new THREE.Mesh(g, V.pine1.bMat);
    mesh.position.set(L.c.x, T.height(L.c.x, L.c.z) + L.rad * 0.6, L.c.z);
    mesh.rotation.y = L.yaw;
    mesh.castShadow = mesh.receiveShadow = true;
    scene.add(mesh);
  }
  // barrel cacti with pink flower crowns
  if (barrels.length) {
    const body = new THREE.SphereGeometry(1, 16, 10);
    const p = body.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 + 0.08 * Math.cos(a * 14); p.setXYZ(i, x * k, p.getY(i) * 1.25, z * k); }
    body.computeVertexNormals();
    const bm = new THREE.InstancedMesh(body, new THREE.MeshStandardMaterial({ color: srgb(0.22, 0.32, 0.14), roughness: 0.85 }), barrels.length);
    const crown = new THREE.InstancedMesh(new THREE.TorusGeometry(0.45, 0.14, 6, 14).rotateX(Math.PI / 2), new THREE.MeshStandardMaterial({ color: srgb(0.9, 0.3, 0.5), roughness: 0.6 }), barrels.length);
    const m = new THREE.Matrix4();
    barrels.forEach((b, i) => {
      const y = T.height(b.x, b.z);
      m.compose(new THREE.Vector3(b.x, y + b.s * 0.9, b.z), new THREE.Quaternion(), new THREE.Vector3(b.s, b.s, b.s)); bm.setMatrixAt(i, m);
      m.compose(new THREE.Vector3(b.x, y + b.s * 2.1, b.z), new THREE.Quaternion(), new THREE.Vector3(b.s, b.s, b.s)); crown.setMatrixAt(i, m);
    });
    for (const o of [bm, crown]) { o.castShadow = o.receiveShadow = true; o.computeBoundingSphere(); scene.add(o); }
  }
  return { winds };
}
