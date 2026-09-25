import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import * as T from './terrain.js';
import { makeGroundMaterial, applySurface } from './ground.js';
import { bakeFields, makeGrass } from './grass.js';
import { makeVariant, instanceVariant, bakeImpostor, makeImpostors } from './trees.js';
import * as VG from './vignettes.js';

const params = new URLSearchParams(location.search);
const LOW = params.get('q') === 'low';
const SPEED = parseFloat(params.get('speed') || '1.8'); // m/s cruise
const HOLD = parseFloat(params.get('hold') || '16');    // s per stop
const EYE = 1.7;
const UP = new THREE.Vector3(0, 1, 0);
const NO_GRASS = params.get('grass') === '0', NO_SHADOWS = params.get('shadows') === '0';
const DPR = parseFloat(params.get('dpr') || '0') || Math.min(devicePixelRatio, LOW ? 1 : 1.5);
const status = document.querySelector('#overlay .status');
const say = (s) => { status.textContent = s; return new Promise((r) => setTimeout(r, 0)); };

// ---------- deterministic rng ----------
let seed = 20260923;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const rr = (a, b) => a + (b - a) * rnd();

// ---------- renderer / scene ----------
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
renderer.setPixelRatio(DPR);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.6;
renderer.shadowMap.enabled = !NO_SHADOWS;
renderer.shadowMap.type = THREE.PCFShadowMap;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 20000);

const FOG_FOREST = new THREE.Color().setRGB(0.60, 0.68, 0.78);
const FOG_DESERT = new THREE.Color().setRGB(0.74, 0.64, 0.54);
scene.fog = new THREE.FogExp2(FOG_FOREST.clone(), 0.0008);

// ---------- sky + sun ----------
const sunDir = new THREE.Vector3().setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - 30), THREE.MathUtils.degToRad(290));
const makeSky = (scale) => {
  const s = new Sky(); s.scale.setScalar(scale);
  const u = s.material.uniforms;
  u.turbidity.value = 4.5; u.rayleigh.value = 1.3; u.mieCoefficient.value = 0.003; u.mieDirectionalG.value = 0.8;
  u.sunPosition.value.copy(sunDir);
  return s;
};
scene.add(makeSky(15000));
let envTex;
{
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene(); envScene.add(makeSky(1000));
  envTex = pmrem.fromScene(envScene, 0, 0.1, 5000).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.25;
}
const sunCol = new THREE.Color().setRGB(1.0, 0.88, 0.72);
const sun = new THREE.DirectionalLight(sunCol, 3.0);
sun.castShadow = true;
sun.shadow.mapSize.set(LOW ? 2048 : 4096, LOW ? 2048 : 4096);
Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, near: 1, far: 900 });
sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.5;
scene.add(sun, sun.target);
scene.add(new THREE.HemisphereLight(new THREE.Color().setRGB(0.55, 0.65, 0.85), new THREE.Color().setRGB(0.30, 0.26, 0.20), 0.15));

// ---------- terrain ----------
await say('Loading ground textures…');
const ground = await makeGroundMaterial();
const groundMat = ground.make();

function buildGrid(x0, x1, z0, z1, nx, nz, lower) {
  const pos = new Float32Array((nx + 1) * (nz + 1) * 3);
  let k = 0;
  for (let j = 0; j <= nz; j++) {
    const z = z0 + (z1 - z0) * j / nz;
    for (let i = 0; i <= nx; i++) {
      const x = x0 + (x1 - x0) * i / nx;
      pos[k++] = x; pos[k++] = T.height(x, z) - (lower ? lower(x, z) : 0); pos[k++] = z;
    }
  }
  const idx = new Uint32Array(nx * nz * 6);
  k = 0;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = j * (nx + 1) + i, b = a + 1, c = a + nx + 1, d = c + 1;
    idx[k++] = a; idx[k++] = c; idx[k++] = b; idx[k++] = b; idx[k++] = c; idx[k++] = d;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  g.computeVertexNormals();
  return applySurface(g, (x, z, h, ny) => T.surfaceAt(x, z, h, ny));
}

await say('Shaping terrain…');
const NEAR = { x0: T.X0 - 170, x1: T.X1 + 170, z0: -340, z1: 340 };
const res = LOW ? 2.5 : 1.0;
const nearMesh = new THREE.Mesh(buildGrid(NEAR.x0, NEAR.x1, NEAR.z0, NEAR.z1,
  Math.round((NEAR.x1 - NEAR.x0) / res), Math.round((NEAR.z1 - NEAR.z0) / res)), groundMat);
nearMesh.receiveShadow = true;
scene.add(nearMesh);
const insideNear = (x, z) => T.smoothstep(0, 40, Math.min(x - NEAR.x0, NEAR.x1 - x, z - NEAR.z0, NEAR.z1 - z)) * 6;
scene.add(new THREE.Mesh(buildGrid(-4200, 4200, -4200, 4200, LOW ? 280 : 560, LOW ? 280 : 560, insideNear), groundMat));

const slopeAt = (x, z) => {
  const e = 1.0;
  const dx = T.height(x + e, z) - T.height(x - e, z), dz = T.height(x, z + e) - T.height(x, z - e);
  return 1 - 1 / Math.sqrt(1 + (dx * dx + dz * dz) / (4 * e * e));
};

// ---------- water ----------
const water = (() => {
  const xs0 = NEAR.x0, xs1 = T.WATER_END + 10, n = 700, w = 11;
  const pos = [], uv = [], idx = [];
  for (let i = 0; i <= n; i++) {
    const x = xs0 + (xs1 - xs0) * i / n, z = T.zc(x), y = T.waterLevel(x);
    pos.push(x, y, z - w, x, y, z + w); uv.push(x, 0, x, 1);
    if (i < n) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    transparent: true, fog: true, depthWrite: false,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, {
      uTime: { value: 0 }, uSunDir: { value: sunDir }, uSunCol: { value: sunCol }, uEnd: { value: T.WATER_END },
    }]),
    vertexShader: /* glsl */`
      varying vec3 vW; varying vec2 vUv;
      #include <fog_pars_vertex>
      void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; vUv=uv;
        vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime, uEnd; uniform vec3 uSunDir, uSunCol;
      varying vec3 vW; varying vec2 vUv;
      #include <common>
      #include <fog_pars_fragment>
      float h21(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
      float vn(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
        return mix(mix(h21(i),h21(i+vec2(1,0)),u.x), mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),u.x), u.y); }
      float wv(vec2 p){ return vn(p*0.9+vec2(uTime*0.6,uTime*0.15))*0.6 + vn(p*2.7-vec2(uTime*0.9,-uTime*0.3))*0.3 + vn(p*7.0+vec2(uTime*1.7,0.))*0.1; }
      void main(){
        vec2 p = vW.xz; float e = 0.08;
        float h0 = wv(p), hx = wv(p+vec2(e,0.)), hz = wv(p+vec2(0.,e));
        vec3 N = normalize(vec3((h0-hx)/e*0.1, 1.0, (h0-hz)/e*0.1));
        vec3 V = normalize(cameraPosition - vW);
        float fres = 0.02 + 0.98*pow(1.0-max(dot(N,V),0.0), 5.0);
        vec3 R = reflect(-V, N);
        vec3 skyc = mix(vec3(0.50,0.58,0.68), vec3(0.16,0.30,0.60), clamp(R.y*2.5,0.,1.));
        vec3 deep = vec3(0.015,0.05,0.045);
        vec3 col = mix(deep, skyc, fres);
        col += uSunCol * pow(max(dot(R,uSunDir),0.0), 400.0) * 8.0;
        float a = mix(0.78, 0.97, fres);
        a *= smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y);
        a *= 1.0 - smoothstep(uEnd-35.0, uEnd, vUv.x);
        gl_FragColor = vec4(col, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(g, mat);
  mesh.renderOrder = 1;
  scene.add(mesh);
  return mat;
})();

// ---------- path curve (follows the trail's smoothed elevation profile; no head bob) ----------
const pts = [];
{
  let last = null;
  for (let x = T.X0; x <= T.X1; x += 0.25) {
    const q = new THREE.Vector3(x, T.pathY(x) + EYE, T.pathZ(x));
    if (!last || q.distanceTo(last) >= 3 || x + 0.25 > T.X1) { pts.push(q); last = q; }
  }
}
const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
const LEN = curve.getLength();
function frameAt(u) {
  const p = curve.getPointAt(u), t = curve.getTangentAt(u);
  t.y = 0; t.normalize();
  return { p, t, n: new THREE.Vector3(-t.z, 0, t.x) }; // +n points away from the river in the forest stretch
}

function marchTerrain(o, dir, maxD = 260) {
  const p = new THREE.Vector3();
  for (let d = 2; d < maxD; d += 0.5) {
    p.copy(o).addScaledVector(dir, d);
    if (p.y < T.height(p.x, p.z)) {
      const e = 0.6, x = p.x, z = p.z;
      const nrm = new THREE.Vector3(T.height(x - e, z) - T.height(x + e, z), 2 * e, T.height(x, z - e) - T.height(x, z + e)).normalize();
      return { point: p.clone(), normal: nrm, dist: d };
    }
  }
  return null;
}
// ---------- stop layout (computed before scattering so vegetation keeps clear) ----------
// Stops are placed by x along the route; side < 0 is downhill (toward the river / wash),
// so the valley sits behind the object.
const STOP_DEFS = [
  { x: -440, move: 'orbit', items: [{ kind: 'pic', img: 'duck-rabbit', side: -5, along: 3, h: 1.5 }] },
  { x: -290, move: 'pan', items: [{ kind: 'pic', img: 'chess', side: -6, along: -2, h: 1.4 }, { kind: 'word', text: 'GAMES', side: -7, along: 3.5 }] },
  { x: -150, move: 'orbit', items: [{ kind: 'plinth', img: 'box', side: -6, along: 3, h: 1.1 }] },
  { x: 185, move: 'rise', items: [{ kind: 'cliff', img: 'wittgenstein', word: 'RULES' }] },
  { x: 300, move: 'pan', items: [{ kind: 'word', text: 'BEETLE', side: -7, along: 4, size: 1.2 }, { kind: 'pic', img: 'beetle', side: -6, along: -2.2, h: 1.3 }] },
];
{
  const cum = [0];
  for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + pts[i].distanceTo(pts[i - 1]));
  for (const sd of STOP_DEFS) {
    let i = 0; while (i < pts.length - 1 && pts[i].x < sd.x) i++;
    sd.u = cum[i] / cum[cum.length - 1];
  }
}
const clearZones = [];
for (const sd of STOP_DEFS) {
  const { p, t, n } = frameAt(sd.u);
  sd.frame = { p, t, n };
  for (const it of sd.items) {
    if (it.kind === 'cliff') {
      let best = null;
      for (const side of [1, -1]) for (const ang of [-0.5, -0.25, 0, 0.25, 0.5]) {
        const dir = n.clone().multiplyScalar(side).applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
        dir.y = 0.06; dir.normalize();
        const hit = marchTerrain(p.clone().add(new THREE.Vector3(0, 1.5, 0)), dir);
        if (hit && hit.normal.y < 0.6 && hit.dist > 25 && (!best || hit.dist < best.dist)) best = hit;
      }
      it.hit = best;
      if (best) clearZones.push({ a: p, b: best.point, wide: true });
      continue;
    }
    it.at = p.clone().addScaledVector(n, it.side).addScaledVector(t, it.along);
    clearZones.push({ a: p, b: it.at });
  }
}
const vigs = VG.layout({ curve, LEN, frameAt, rnd, stopS: STOP_DEFS.map((sd) => sd.u * LEN) });
for (const v of vigs) clearZones.push({ circle: v.c, r: v.r + (v.kind === 'bigtree' ? 6 : 2) });
console.log('vignettes: ' + vigs.map((v) => v.kind).join(', '));
const segDist = (px, pz, a, b) => {
  const abx = b.x - a.x, abz = b.z - a.z, t = Math.max(0, Math.min(1, ((px - a.x) * abx + (pz - a.z) * abz) / (abx * abx + abz * abz)));
  return Math.hypot(px - a.x - abx * t, pz - a.z - abz * t);
};
const blocked = (x, z, r = 0) => clearZones.some((c) => c.circle ? Math.hypot(x - c.circle.x, z - c.circle.z) < c.r + Math.max(r, -1)
  : segDist(x, z, c.a, c.b) < (c.wide ? 9 : 4) + r || (!c.wide && Math.hypot(x - c.b.x, z - c.b.z) < 10 + r));
const nearPath = (x, z) => T.pathDist(x, z);
// the open slope between a raised trail and the river: kept mostly clear so the view opens up
const belowView = (x, z) => T.pathOffset(x) > 45 && z < T.pathZ(x) - 3 && z > T.zc(x) + 12 && T.pathZ(x) - z < 170;

// ---------- grass ----------
await say('Growing grass…');
const fields = bakeFields({ x0: NEAR.x0, x1: NEAR.x1, z0: NEAR.z0, z1: NEAR.z1 }, 1, VG.grassMod(vigs));
const grass = makeGrass({
  fields, sunDir, sunCol, rnd,
  patches: LOW ? [{ R: 30, count: 150000 }] : [{ R: 13, count: 200000, scale: 0.9 }, { R: 40, count: 400000 }],
});
if (!NO_GRASS) grass.meshes.forEach((m) => scene.add(m));

// ---------- trees ----------
await say('Growing trees…');
const V = {
  pine1: makeVariant('Pine Large', 11, 0x7f9272), pine2: makeVariant('Pine Medium', 23, 0x758a6c), pine3: makeVariant('Pine Large', 37, 0x8a9a78),
  aspen: makeVariant('Aspen Medium', 5, 0xb8b894), oak: makeVariant('Oak Medium', 8, 0x93a47e),
  fbush: makeVariant('Bush 2', 3, 0x8c9c78), dbush: makeVariant('Bush 2', 9, 0x949a6a),
};
const near = Object.fromEntries(Object.keys(V).map((k) => [k, []]));
const far = { pine1: [], aspen: [], oak: [] };
const REAL_R = 55;

// conifers over the forest valley walls and beyond
for (let i = 0; i < (LOW ? 40000 : 120000); i++) {
  const x = rr(T.X0 - 600, 160), z = rr(-1300, 1300);
  const b = T.biome(x);
  if (b > 0.85) continue;
  const d = Math.abs(z - T.zc(x));
  if (d < 12 || nearPath(x, z) < 5) continue;
  if (belowView(x, z) && rnd() > 0.07) continue;
  const h = T.height(x, z);
  const clump = T.fbm(x * 0.01, z * 0.01, 3) + 0.35 * T.fbm(x * 0.05, z * 0.05, 2);
  let p = Math.pow(1 - b, 2) * T.smoothstep(-0.3, 0.15, clump) * (1 - T.smoothstep(150, 190, h)) * (T.smoothstep(12, 45, d) * 0.7 + 0.3);
  p *= 0.16; // trees per candidate
  if (rnd() > p || slopeAt(x, z) > 0.5 || blocked(x, z)) continue;
  const tree = { x, y: h - 0.3, z, yaw: rnd() * 6.283, h: rr(14, 30), shade: rr(0.75, 1.1) };
  const inNear = nearPath(x, z) < REAL_R && x > NEAR.x0 && x < NEAR.x1;
  if (inNear) near[['pine1', 'pine2', 'pine3'][Math.floor(rnd() * 3)]].push(tree);
  else far.pine1.push(tree);
}
// broadleaf trees along the river and in side hollows
for (let i = 0; i < (LOW ? 3000 : 8000); i++) {
  const x = rr(NEAR.x0 - 300, 60), side = rnd() < 0.5 ? -1 : 1, z = T.zc(x) + side * rr(10, 70);
  const b = T.biome(x);
  if (belowView(x, z) || rnd() > Math.pow(1 - b, 2) * 0.12 * T.smoothstep(-0.1, 0.4, T.fbm(x * 0.02 + 40, z * 0.02, 2)) || nearPath(x, z) < 5 || slopeAt(x, z) > 0.35 || blocked(x, z)) continue;
  const tree = { x, y: T.height(x, z) - 0.2, z, yaw: rnd() * 6.283, h: rr(9, 16), shade: rr(0.8, 1.15) };
  if (nearPath(x, z) < REAL_R && x > NEAR.x0) near[rnd() < 0.6 ? 'aspen' : 'oak'].push(tree);
  else far[rnd() < 0.6 ? 'aspen' : 'oak'].push(tree);
}
// forest understory bushes near the path
for (let i = 0; i < (LOW ? 700 : 1800); i++) {
  const x = rr(T.X0 - 20, 40), z = T.pathZ(x) + rr(-40, 40);
  if (rnd() > Math.pow(1 - T.biome(x), 2) * 0.5 || nearPath(x, z) < 3 || Math.abs(z - T.zc(x)) < 10 || slopeAt(x, z) > 0.4 || blocked(x, z, -3)) continue;
  near.fbush.push({ x, y: T.height(x, z) - 0.1, z, yaw: rnd() * 6.283, h: rr(0.8, 2.2), wide: rr(0.9, 1.4), shade: rr(0.8, 1.1) });
}
// desert scrub
for (let i = 0; i < (LOW ? 1200 : 3000); i++) {
  const x = rr(-40, NEAR.x1), z = T.pathZ(x) + rr(-70, 70), b = T.biome(x);
  if (rnd() > b * 0.5 * (0.3 + 0.7 * (T.fbm(x * 0.05, z * 0.05, 2) * 0.5 + 0.5)) || nearPath(x, z) < 2.5 || slopeAt(x, z) > 0.3 || blocked(x, z, -3)) continue;
  near.dbush.push({ x, y: T.height(x, z) - 0.1, z, yaw: rnd() * 6.283, h: rr(0.6, 1.6), wide: rr(1.0, 1.6), shade: rr(0.75, 1.1) });
}
for (const k of Object.keys(V)) instanceVariant(scene, V[k], near[k]);
for (const k of Object.keys(far)) {
  const imp = bakeImpostor(renderer, V[k], envTex);
  scene.add(makeImpostors(imp, far[k], { sunDir }));
}
console.log('trees near ' + Object.entries(near).map(([k, v]) => `${k}:${v.length}x${Math.round(V[k].tris / 1000)}k`).join(' '));

// ---------- rocks + cacti ----------
const srgb = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
function rockGeo(k, layer) {
  const g = new THREE.IcosahedronGeometry(1, 3);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, i);
    const n = T.fbm(v.x * 1.1 + k * 10 + v.y * 0.7, v.z * 1.1 - v.y * 0.9 + k * 3, 5);
    v.multiplyScalar(1 + n * 0.38);
    v.y *= 0.6; if (v.y < -0.1) v.y *= 0.4;
    if (v.y > 0.35) v.y = 0.35 + (v.y - 0.35) * 0.5; // flatter tops
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.deleteAttribute('uv');
  const ng = g.toNonIndexed(); ng.computeVertexNormals();
  return applySurface(ng, () => ({ w: layer === 2 ? [0, 0, 1, 0, 0, 0] : [0, 0, 0, 0, 0, 1], tint: [1, 1, 1], snow: 0 }));
}
const rockMat = ground.make();
for (let k = 0; k < 4; k++) {
  const desert = k >= 2;
  const mesh = new THREE.InstancedMesh(rockGeo(k, desert ? 5 : 2), rockMat, LOW ? 200 : 500);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), c = new THREE.Color();
  let n = 0;
  for (let tries = 0; tries < 20000 && n < mesh.count; tries++) {
    const x = rr(NEAR.x0, NEAR.x1), z = T.pathZ(x) + rr(-140, 140), b = T.biome(x);
    if (desert ? rnd() > b : rnd() > 1 - b) continue;
    if (nearPath(x, z) < 3.5 || Math.abs(z - T.zc(x)) < 8 * (1 - b) || blocked(x, z, -4)) continue;
    const sl = slopeAt(x, z);
    if (sl > 0.4 || rnd() > 0.3 + 0.7 * T.smoothstep(0.1, 0.3, sl)) continue;
    const sc = rr(0.4, 1) ** 2 * rr(1.2, 6);
    q.setFromEuler(new THREE.Euler(rr(-0.3, 0.3), rnd() * 6.283, rr(-0.3, 0.3)));
    s.set(sc * rr(0.8, 1.3), sc * rr(0.7, 1.2), sc * rr(0.8, 1.3));
    m.compose(new THREE.Vector3(x, T.height(x, z) - sc * (0.25 + sl * 0.8), z), q, s);
    mesh.setMatrixAt(n, m);
    const t = desert ? T.surfaceAt(x, z, T.height(x, z) + rr(-6, 6), 0.3).tint : [1, 1, 1];
    c.setRGB(t[0], t[1], t[2]).multiplyScalar(rr(0.85, 1.1)); mesh.setColorAt(n, c);
    n++;
  }
  mesh.count = n; mesh.castShadow = mesh.receiveShadow = true; mesh.computeBoundingSphere();
  scene.add(mesh);
}
function saguaroGeo() {
  const parts = [];
  const ribbed = (r, len) => {
    const g = new THREE.CapsuleGeometry(r, len, 6, 24);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 + 0.09 * Math.cos(a * 12);
      p.setX(i, x * k); p.setZ(i, z * k);
    }
    g.computeVertexNormals();
    return g;
  };
  parts.push(ribbed(0.3, 4.8).translate(0, 2.6, 0));
  const arm = (side, y0, up) => {
    parts.push(ribbed(0.2, 0.6).rotateZ(Math.PI / 2).translate(side * 0.55, y0, 0));
    parts.push(ribbed(0.21, up).translate(side * 0.92, y0 + up / 2, 0));
  };
  arm(1, 2.1, 1.9); arm(-1, 3.0, 1.3);
  return mergeGeometries(parts.map((g) => { g.deleteAttribute('uv'); return g.index ? g.toNonIndexed() : g; }));
}
{
  const mesh = new THREE.InstancedMesh(saguaroGeo(), new THREE.MeshStandardMaterial({ color: srgb(0.16, 0.24, 0.12), roughness: 0.92, envMapIntensity: 0.4 }), LOW ? 150 : 350);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3();
  let n = 0;
  for (let tries = 0; tries < 10000 && n < mesh.count; tries++) {
    const x = rr(60, NEAR.x1), z = T.pathZ(x) + rr(-220, 220), b = T.biome(x);
    if (nearPath(x, z) < 6 || slopeAt(x, z) > 0.25 || rnd() > b || blocked(x, z)) continue;
    const sc = rr(0.7, 1.4);
    q.setFromEuler(new THREE.Euler(rr(-0.04, 0.04), rnd() * 6.283, rr(-0.04, 0.04)));
    s.setScalar(sc);
    m.compose(new THREE.Vector3(x, T.height(x, z) - 0.1, z), q, s);
    mesh.setMatrixAt(n++, m);
  }
  mesh.count = n; mesh.castShadow = mesh.receiveShadow = true; mesh.computeBoundingSphere();
  scene.add(mesh);
}

// ---------- vignettes ----------
const rockGeos = { false: rockGeo(7, 2), true: rockGeo(8, 5) };
const rockMesh = (desert, n) => { const m = new THREE.InstancedMesh(rockGeos[desert], rockMat, n); m.castShadow = m.receiveShadow = true; return m; };
const vgBuilt = VG.build(scene, vigs, { V, makeVariant, instanceVariant, rockMesh, rnd });

// ---------- stops ----------
await say('Placing stops…');
const texLoader = new THREE.TextureLoader();
const loadTex = (url) => new Promise((res) => texLoader.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }));
const font = await new Promise((res) => new FontLoader().load('assets/helvetiker_bold.typeface.json', res));
const IMG = Object.fromEntries(await Promise.all(['duck-rabbit', 'wittgenstein', 'chess', 'box', 'beetle'].map(async (n) => [n, await loadTex(`assets/${n}.jpg`)])));

const groundPoint = (x, z) => new THREE.Vector3(x, T.height(x, z), z);
function framedPicture(tex, heightM, legs = true) {
  const img = tex.image, aspect = img.width / img.height;
  const h = heightM, w = h * aspect, g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: srgb(0.22, 0.15, 0.1), roughness: 0.7 });
  const frame = new THREE.Mesh(new THREE.BoxGeometry(w + 0.18, h + 0.18, 0.1), wood);
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }));
  pic.position.z = 0.052;
  g.add(frame, pic);
  if (legs) for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 0.08), wood);
    leg.position.set(sx * w * 0.35, -h / 2 - 0.6, -0.05);
    g.add(leg);
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData.base = h / 2 + 1.3;
  return g;
}
function blockWord(word, size = 1.3) {
  const g = new TextGeometry(word, { font, size, depth: size * 0.38, curveSegments: 6, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.035, bevelSegments: 2 });
  g.computeBoundingBox();
  const bb = g.boundingBox;
  g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
  const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: srgb(0.9, 0.87, 0.8), roughness: 0.75 }));
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}
function standAt(obj, x, z, eye, lift = 0) {
  obj.position.copy(groundPoint(x, z)).add(new THREE.Vector3(0, lift - 0.05, 0));
  obj.lookAt(eye.x, obj.position.y, eye.z);
  scene.add(obj);
  return obj;
}
function projectOnto(hit, tex, w, h) {
  const patch = new THREE.Mesh(new THREE.BufferGeometry());
  { // local fine patch of the height field to project onto
    const n = 240, x0 = hit.point.x - 30, z0 = hit.point.z - 30, pos = [], idx = [];
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const x = x0 + 60 * i / n, z = z0 + 60 * j / n; pos.push(x, T.height(x, z), z); }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i; idx.push(a, a + n + 1, a + 1, a + 1, a + n + 1, a + n + 2); }
    patch.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); patch.geometry.setIndex(idx); patch.geometry.computeVertexNormals();
  }
  const helper = new THREE.Object3D();
  helper.position.copy(hit.point);
  helper.lookAt(hit.point.clone().add(hit.normal));
  const dg = new DecalGeometry(patch, hit.point, helper.rotation, new THREE.Vector3(w, h, 30));
  const mat = new THREE.MeshStandardMaterial({
    map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4,
    emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25, roughness: 0.9,
  });
  const decal = new THREE.Mesh(dg, mat);
  decal.receiveShadow = true;
  scene.add(decal);
}
function textTexture(text, px = 180) {
  const c = document.createElement('canvas'), ctx = c.getContext('2d');
  ctx.font = `700 ${px}px Georgia, serif`;
  c.width = Math.ceil(ctx.measureText(text).width) + 80; c.height = px + 80;
  ctx.font = `700 ${px}px Georgia, serif`;
  ctx.fillStyle = 'rgba(255,248,235,0.92)'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 40, c.height / 2);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// A stop is a short walk off the path at eye level: positions and gaze targets are
// separate Catmull-Rom curves traversed over the hold, starting and ending on the path.
const eyeAt = (x, z) => new THREE.Vector3(x, T.height(x, z) + EYE, z);
function choreograph(move, p, tan, foci, focus) {
  const P = [p.clone()], L = [focus.clone()];
  const flat = (v) => new THREE.Vector3(v.x, 0, v.z);
  if (move === 'orbit') {
    const f = foci[0], c = f.c;
    const toPath = flat(p).sub(flat(c)).normalize();
    const r = 3.3, sweep = 0.95; // radians either side of the face normal
    for (let k = 0; k <= 6; k++) {
      const a = -sweep + (2 * sweep) * k / 6;
      const d = toPath.clone().applyAxisAngle(UP, a);
      const q = flat(c).addScaledVector(d, r + 0.6 * Math.cos(a * 1.6));
      P.push(eyeAt(q.x, q.z));
      L.push(c.clone().setY(THREE.MathUtils.lerp(f.top, f.bot, 0.35 + 0.25 * Math.sin(k / 6 * Math.PI))));
    }
  } else if (move === 'pan') {
    const sorted = [...foci].sort((a, b) => flat(a.c).sub(flat(p)).dot(tan) - flat(b.c).sub(flat(p)).dot(tan));
    const left = sorted[0], right = sorted[sorted.length - 1];
    const toward = flat(focus).sub(flat(p)).normalize(), side = tan.clone();
    const stand = flat(p).addScaledVector(toward, 1.8);
    const pts = [-1.2, -0.4, 0.4, 1.2].map((k, i) => { const q = stand.clone().addScaledVector(side, k).addScaledVector(toward, i * 0.5); return eyeAt(q.x, q.z); });
    P.push(...pts);
    const lx = left.c.clone().addScaledVector(side, -left.w * 0.45), rx = right.c.clone().addScaledVector(side, right.w * 0.45);
    L.push(lx, left.c.clone().lerp(right.c, 0.35), right.c.clone().lerp(left.c, 0.2), rx);
  } else if (move === 'rise') {
    const f = foci[0], c = f.c;
    const toward = flat(c).sub(flat(p)).normalize();
    // walk toward a distant face (up to ~40% of the way, max 16 m) while tilting up it
    const walk = Math.min(16, flat(c).distanceTo(flat(p)) * 0.4);
    for (let k = 1; k <= 4; k++) { const q = flat(p).addScaledVector(toward, walk * k / 4).addScaledVector(tan, (k - 2) * 1.2); P.push(eyeAt(q.x, q.z)); }
    L.push(c.clone().setY(f.bot), c.clone().setY(THREE.MathUtils.lerp(f.bot, f.top, 0.35)), c.clone().setY(THREE.MathUtils.lerp(f.bot, f.top, 0.7)), c.clone().setY(f.top - f.w * 0.1));
  }
  P.push(p.clone()); L.push(focus.clone());
  return { pos: new THREE.CatmullRomCurve3(P, false, 'centripetal'), look: new THREE.CatmullRomCurve3(L, false, 'centripetal') };
}

const stops = [];
for (const sd of STOP_DEFS) {
  const { p, n } = sd.frame;
  const foci = [];
  for (const it of sd.items) {
    if (it.kind === 'pic') {
      const pic = framedPicture(IMG[it.img], it.h);
      standAt(pic, it.at.x, it.at.z, p, pic.userData.base);
      foci.push({ c: pic.position.clone(), w: 1.5, top: pic.position.y + it.h / 2, bot: pic.position.y - it.h / 2 });
    } else if (it.kind === 'word') {
      const word = standAt(blockWord(it.text, it.size), it.at.x, it.at.z, p);
      word.geometry.computeBoundingBox();
      foci.push({ c: it.at.clone().setY(T.height(it.at.x, it.at.z) + 0.7), w: word.geometry.boundingBox.max.x * 2, top: word.position.y + 1.3, bot: word.position.y });
    } else if (it.kind === 'plinth') {
      const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 1.0), new THREE.MeshStandardMaterial({ color: srgb(0.42, 0.39, 0.35), roughness: 0.95 }));
      plinth.castShadow = plinth.receiveShadow = true;
      standAt(plinth, it.at.x, it.at.z, p, 0.5);
      const pic = framedPicture(IMG[it.img], it.h, false);
      standAt(pic, it.at.x, it.at.z, p, 1.1 + it.h / 2 + 0.07);
      foci.push({ c: pic.position.clone(), w: 1.6, top: pic.position.y + it.h / 2, bot: plinth.position.y - 0.5 });
    } else if (it.kind === 'cliff') {
      const best = it.hit;
      if (!best) { console.warn('no cliff found'); continue; }
      const size = THREE.MathUtils.clamp(best.dist * 0.22, 8, 26);
      projectOnto(best, IMG[it.img], size * 0.65, size);
      const kw = textTexture(it.word);
      // keyword beside the portrait, found by re-marching along the face so it lands on rock
      const along = new THREE.Vector3().crossVectors(UP, best.normal).setY(0).normalize();
      const kwW = size * 0.8, kwH = kwW * kw.image.height / kw.image.width;
      const eye = p.clone().add(new THREE.Vector3(0, 1.5, 0));
      const aim = best.point.clone().addScaledVector(along, size * 0.35 + kwW * 0.6).add(new THREE.Vector3(0, -size * 0.25, 0));
      const kwHit = marchTerrain(eye, aim.sub(eye).normalize(), 400);
      if (kwHit) projectOnto(kwHit, kw, kwW, kwH);
      foci.push({ c: best.point.clone().add(new THREE.Vector3(0, size * 0.1, 0)), w: size, top: best.point.y + size * 0.8, bot: best.point.y - size * 0.45, far: true });
    }
  }
  if (!foci.length) continue;
  const focus = foci.reduce((a, f) => a.add(f.c), new THREE.Vector3()).divideScalar(foci.length);
  stops.push({ s: sd.u * LEN, focus, detour: choreograph(sd.move, p, sd.frame.t, foci, focus) });
}

// ---------- timeline ----------
// Walking speed is a function of arc length: a slow drift in pace, easing out of and into
// stops, and slowing almost to a halt beside vignettes the walker stops to notice.
const noticeS = vigs.filter((v) => v.notice).map((v) => v.s);
function speedAt(s, s0, s1) {
  const acc = 4.5;
  const ramp = Math.min(1, Math.sqrt(Math.max(0, s - s0) / acc), Math.sqrt(Math.max(0, s1 - s) / acc));
  let v = SPEED * (1 + 0.13 * Math.sin(s * 0.019 + 0.7) + 0.07 * Math.sin(s * 0.053 + 2.1));
  for (const n of noticeS) { const d = (s - n) / 2.4; if (Math.abs(d) < 4) v *= 1 - 0.82 * Math.exp(-d * d); }
  return Math.max(0.1, v * ramp);
}
const segs = [];
{
  let s0 = 0, t0 = 0;
  const marks = [...stops.map((st) => st.s), LEN];
  marks.forEach((s1, i) => {
    const ds = 0.1, S = [s0], Tt = [t0];
    let tt = t0, prevV = speedAt(s0, s0, s1);
    for (let x = s0 + ds; x < s1 + ds / 2; x += ds) {
      const v = speedAt(Math.min(x, s1), s0, s1);
      tt += ds / ((v + prevV) / 2); prevV = v;
      S.push(Math.min(x, s1)); Tt.push(tt);
    }
    segs.push({ kind: 'move', t0, t1: tt, s0, s1, S, T: Tt });
    t0 = tt;
    if (i < stops.length) { stops[i].tArrive = t0; stops[i].tDepart = t0 + HOLD; segs.push({ kind: 'hold', t0, t1: t0 + HOLD, s0: s1, s1 }); t0 += HOLD; }
    s0 = s1;
  });
}
const DURATION = segs[segs.length - 1].t1;
function bsearch(arr, x) { let lo = 0, hi = arr.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (arr[m] <= x) lo = m; else hi = m; } return lo; }
function sAt(t) {
  t = THREE.MathUtils.clamp(t, 0, DURATION);
  const g = segs.find((x) => t <= x.t1) || segs[segs.length - 1];
  if (g.kind === 'hold') return g.s0;
  const i = bsearch(g.T, t), f = (t - g.T[i]) / Math.max(1e-6, g.T[i + 1] - g.T[i]);
  return g.S[i] + (g.S[i + 1] - g.S[i]) * THREE.MathUtils.clamp(f, 0, 1);
}
function tAtS(s) {
  const g = segs.find((x) => x.kind === 'move' && s >= x.s0 && s <= x.s1);
  if (!g) return null;
  const i = bsearch(g.S, s);
  return g.T[i];
}
// Vistas: every few metres of trail, score directions by what a walker would want to look
// at — open distance and terrain rising on the horizon — and keep the best, smoothed along
// the route. The head spends a slowly varying share of the walk turned toward it.
const vistas = [];
{
  const STEP = 8;
  const raw = [];
  for (let s = 0; s <= LEN; s += STEP) {
    const { p, t: tan } = frameAt(s / LEN);
    const eye = p.clone(), b = T.biome(p.x);
    let best = { score: -9, target: p.clone().addScaledVector(tan, 100) };
    for (let yaw = -110; yaw <= 110; yaw += 10) {
      if (Math.abs(yaw) < 20) continue;
      const dir = tan.clone().applyAxisAngle(UP, THREE.MathUtils.degToRad(yaw)).setY(0).normalize();
      let d = 4, maxAng = -1, peak = null, hitD = null;
      while (d < 3200) {
        const x = eye.x + dir.x * d, z = eye.z + dir.z * d, h = T.height(x, z);
        const ang = Math.atan2(h - eye.y, d);
        if (d > 250 && ang > maxAng) { maxAng = ang; peak = new THREE.Vector3(x, h, z); }
        if (hitD === null && ang > 0.035) hitD = d; // first terrain that fills the eye line
        d += 1 + d * 0.03;
      }
      const open = hitD === null ? 1 : Math.min(1, hitD / 250);
      let score = open * 0.6 + Math.max(0, maxAng) * 5;
      if (hitD !== null && hitD < 120) score -= 1.2 * (1 - hitD / 120);           // a bank or wall close by blocks the view
      if (b < 0.5 && T.pathOffset(p.x) > 45 && dir.z > 0.35) score -= 0.6;        // uphill into the forest
      if (score > best.score && peak) best = { score, target: peak.clone().lerp(eye, 0.02).setY(eye.y + (peak.y - eye.y) * 0.75) };
    }
    raw.push({ s, ...best });
  }
  for (let i = 0; i < raw.length; i++) {
    const tgt = new THREE.Vector3(); let ws = 0, sc = 0;
    for (let k = -3; k <= 3; k++) {
      const j = Math.min(raw.length - 1, Math.max(0, i + k)), w = Math.exp(-(k * k) / 4);
      tgt.addScaledVector(raw[j].target, w); sc += raw[j].score * w; ws += w;
    }
    vistas.push({ s: raw[i].s, target: tgt.divideScalar(ws), score: sc / ws });
  }
}
function vistaAt(s) {
  const g = Math.min(vistas.length - 1.001, Math.max(0, s / 8)), i = Math.floor(g), f = g - i;
  const a = vistas[i], b = vistas[i + 1];
  const w = THREE.MathUtils.smoothstep(THREE.MathUtils.lerp(a.score, b.score, f), 0.35, 1.0) * (0.5 + 0.28 * Math.sin(s * 0.021 + 0.8));
  return { target: a.target.clone().lerp(b.target, f), w: Math.min(0.8, w) };
}

// Glances: while walking, the walker periodically turns to look at the landscape —
// a cliff, a peak, the river — found by marching a ray over the height field.
const glances = [];
for (const v of vigs) {
  const tv = tAtS(v.s);
  if (tv == null) continue;
  const look = v.c.clone().setY(v.c.y + ({ bigtree: 6, hoodoos: 3, deadtree: 3, birches: 4, ocotillo: 1.5 }[v.kind] ?? 0.4));
  if (v.notice) glances.push({ t0: tv - 4, t1: tv + 4.5, target: look, amt: 0.9 });
  else if (rnd() < 0.6) glances.push({ t0: tv - 2.5, t1: tv + 2.2, target: look, amt: 0.55 });
}
{
  const busy = (tt) => stops.some((st) => tt > st.tArrive - 14 && tt < st.tDepart + 8) || glances.some((g) => tt > g.t0 - 3 && tt < g.t1 + 3);
  for (let tt = rr(6, 12); tt < DURATION - 10; tt += rr(16, 30)) {
    const dur = rr(4.5, 7.5);
    if (busy(tt) || busy(tt + dur)) continue;
    const u = sAt(tt + dur / 2) / LEN, { p, t: tan } = frameAt(u);
    const side = rnd() < 0.5 ? -1 : 1, ang = side * rr(0.55, 1.35);
    const dir = tan.clone().applyAxisAngle(UP, ang); dir.y = rr(0.03, 0.12); dir.normalize();
    const hit = marchTerrain(p.clone(), dir, 1500);
    if (hit && hit.dist < 140) continue; // only glance at things with some distance to them
    const target = hit ? hit.point.clone().add(new THREE.Vector3(0, hit.dist * 0.04, 0))
      : p.clone().addScaledVector(dir.setY(0.02).normalize(), 600);
    glances.push({ t0: tt, t1: tt + dur, target, amt: rr(0.55, 0.85) });
  }
}

const qA = new THREE.Quaternion(), qB = new THREE.Quaternion(), qN = new THREE.Quaternion(), m4 = new THREE.Matrix4(), eN = new THREE.Euler(0, 0, 0, 'YXZ');
const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * THREE.MathUtils.clamp(x, 0, 1));
function poseAt(t) {
  const sNow = sAt(t), u = THREE.MathUtils.clamp(sNow / LEN, 0, 1);
  let pos = curve.getPointAt(u);
  const ahead = curve.getPointAt(Math.min(1, u + 25 / LEN));
  ahead.y = pos.y + (ahead.y - pos.y) * 0.35 + 0.4; // eyes on the horizon, not the ground
  m4.lookAt(pos, ahead, UP); qA.setFromRotationMatrix(m4);
  { const v = vistaAt(sNow); if (v.w > 0) { m4.lookAt(pos, v.target, UP); qB.setFromRotationMatrix(m4); qA.slerp(qB, v.w); } }

  let calm = 1; // how much idle head drift to allow
  for (const st of stops) {
    const a = THREE.MathUtils.smoothstep(t, st.tArrive - 6, st.tArrive);
    const b = 1 - THREE.MathUtils.smoothstep(t, st.tDepart, st.tDepart + 4);
    const w = Math.min(a, b);
    if (w <= 0) continue;
    let look = st.focus;
    if (t >= st.tArrive && t <= st.tDepart) {
      const k = ease((t - st.tArrive) / (st.tDepart - st.tArrive));
      pos = st.detour.pos.getPoint(k);
      look = st.detour.look.getPoint(k);
    }
    m4.lookAt(pos, look, UP); qB.setFromRotationMatrix(m4);
    qA.slerp(qB, w);
    calm = Math.min(calm, 1 - w * 0.7);
  }
  for (const g of glances) {
    if (t < g.t0 || t > g.t1) continue;
    const w = THREE.MathUtils.smoothstep(t, g.t0, g.t0 + 1.8) * (1 - THREE.MathUtils.smoothstep(t, g.t1 - 2.2, g.t1)) * g.amt;
    m4.lookAt(pos, g.target, UP); qB.setFromRotationMatrix(m4);
    qA.slerp(qB, w);
  }
  eN.set(
    (0.025 * Math.sin(t * 0.29 + 2) + 0.012 * Math.sin(t * 0.71)) * calm,
    (0.06 * Math.sin(t * 0.17) + 0.03 * Math.sin(t * 0.43 + 1)) * calm, 0);
  qA.multiply(qN.setFromEuler(eN));
  // while walking, keep the eyes near the horizon: pitch clamped (loosened at stops)
  eN.setFromQuaternion(qA, 'YXZ');
  const loose = 1 - calm; // 0 walking .. 0.7 at a stop
  eN.x = THREE.MathUtils.clamp(eN.x, -0.12 - loose * 0.6, 0.14 + loose * 0.6); eN.z = 0;
  qA.setFromEuler(eN);
  return { pos, q: qA };
}

// ---------- post ----------
const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: LOW ? 0 : 4 }));
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new OutputPass());
// light grade after tone mapping: a touch of contrast and saturation, soft vignette
composer.addPass(new ShaderPass({
  uniforms: { tDiffuse: { value: null } },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
  fragmentShader: `uniform sampler2D tDiffuse; varying vec2 vUv;
    void main(){
      vec3 c = texture2D(tDiffuse, vUv).rgb;
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, 1.06);
      c = clamp((c - 0.5) * 1.1 + 0.5 - 0.015, 0.0, 1.0);
      c *= mix(0.72, 1.0, smoothstep(0.95, 0.3, length((vUv - 0.5) * vec2(1.25, 1.0))));
      gl_FragColor = vec4(c, 1.0);
    }`,
}));
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight); composer.setSize(innerWidth, innerHeight);
});

// ---------- loop ----------
let t = parseFloat(params.get('t') || '0');
let playing = false, last = performance.now();
const clockEl = document.getElementById('clock');
const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function renderAt(tt, wall = tt) {
  const { pos, q } = poseAt(tt);
  camera.position.copy(pos); camera.quaternion.copy(q);
  const b = T.biome(pos.x);
  scene.fog.color.copy(FOG_FOREST).lerp(FOG_DESERT, b);
  scene.fog.density = THREE.MathUtils.lerp(0.0008, 0.0005, b);
  renderer.toneMappingExposure = THREE.MathUtils.lerp(0.52, 0.42, b);
  sun.position.copy(pos).addScaledVector(sunDir, 400);
  sun.target.position.copy(pos);
  grass.update(pos, wall);
  water.uniforms.uTime.value = wall;
  for (const v of Object.values(V)) v.wind.value = wall;
  for (const w of vgBuilt.winds) w.value = wall;
  composer.render();
  if (clockEl) clockEl.textContent = `${fmt(tt)} / ${fmt(DURATION)}`;
}
function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (playing) t = Math.min(DURATION, t + dt);
  renderAt(t, now / 1000);
  requestAnimationFrame(frame);
}
addEventListener('keydown', (e) => {
  if (e.code === 'Space') { playing = !playing; e.preventDefault(); }
  if (e.code === 'ArrowRight') t = Math.min(DURATION, t + 10);
  if (e.code === 'ArrowLeft') t = Math.max(0, t - 10);
});
const overlay = document.getElementById('overlay');
await say(`${fmt(DURATION)} walk · ${stops.length} stops`);
overlay.querySelector('button').disabled = false;
overlay.querySelector('button').onclick = () => { overlay.remove(); playing = true; };
window.__palace = { vigs: vigs.map((v) => ({ k: v.kind, t: +(tAtS(v.s) ?? -1).toFixed(1), notice: v.notice })), seek: (x) => { t = x; renderAt(x); }, pose: (x) => { const r = poseAt(x); return [r.pos.x, r.pos.y, r.pos.z, T.height(r.pos.x, r.pos.z), T.pathY(r.pos.x), T.pathOffset(r.pos.x), sAt(x)].map((v) => +v.toFixed(2)); }, stopInfo: stops.map((s) => ({ f: [s.focus.x, s.focus.z].map((v) => +v.toFixed(2)), n: s.detour.pos.points.length })), duration: DURATION, stops: stops.map((s) => s.tArrive), ready: true };
requestAnimationFrame(frame);
