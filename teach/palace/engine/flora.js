// Vegetation and rocks for streamed tiles. Workers scatter per-tile instance lists (stride 7:
// x, y, z, yaw, size, wide, shade). Near the camera, real meshes are drawn from distance-limited
// pools refreshed a few times a second; trees further out are camera-facing impostors that hide
// themselves wherever the real mesh is drawn.
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { makeVariant, bakeImpostor } from './trees.js';
import { fixedSurface } from './ground.js';
import { fbm } from './noise.js';

// EZ-Tree presets: name -> [preset, seed, leaf tint, options]
export const VARIANTS = {
  pine1: ['Pine Large', 11, 0x7f9272], pine2: ['Pine Medium', 23, 0x758a6c], pine3: ['Pine Large', 37, 0x8a9a78],
  pineSmall: ['Pine Small', 5, 0x7a8c70], aspen: ['Aspen Medium', 5, 0xb8b894], birch: ['Aspen Large', 14, 0x9fb07a],
  oak: ['Oak Medium', 8, 0x93a47e], oakLarge: ['Oak Large', 17, 0x93a47e], ash: ['Ash Medium', 12, 0x9aa882],
  autumnOak: ['Oak Medium', 31, 0xd08a3c], autumnMaple: ['Ash Medium', 44, 0xc4502a], autumnBirch: ['Aspen Medium', 52, 0xe0b040],
  dead: ['Ash Medium', 29, 0xffffff, { noLeaves: true, bark: 0xd8d0c4 }],
  fbush: ['Bush 2', 3, 0x8c9c78], dbush: ['Bush 2', 9, 0x949a6a], redbush: ['Bush 1', 21, 0xb0503a], heather: ['Bush 3', 6, 0x9a7aa0],
};
const RADIUS = { tree: 95, bush: 150, rock: 260, cactus: 420 };

const srgb = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);

function rockGeo(k) {
  const g0 = new THREE.IcosahedronGeometry(1, 3); g0.deleteAttribute('uv'); g0.deleteAttribute('normal');
  const g = mergeVertices(g0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = new THREE.Vector3().fromBufferAttribute(p, i);
    const n = fbm(v.x * 1.1 + k * 10 + v.y * 0.7, v.z * 1.1 - v.y * 0.9 + k * 3, 5);
    v.multiplyScalar(1 + n * 0.38);
    v.y *= 0.6; if (v.y < -0.1) v.y *= 0.4;
    if (v.y > 0.35) v.y = 0.35 + (v.y - 0.35) * 0.5;
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

function saguaroGeo() {
  const parts = [];
  const ribbed = (r, len) => {
    const g = new THREE.CapsuleGeometry(r, len, 6, 24);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 + 0.09 * Math.cos(a * 12); p.setX(i, x * k); p.setZ(i, z * k); }
    g.computeVertexNormals(); g.deleteAttribute('uv');
    return g.index ? g.toNonIndexed() : g;
  };
  parts.push(ribbed(0.3, 4.8).translate(0, 2.6, 0));
  const arm = (side, y0, up) => { parts.push(ribbed(0.2, 0.6).rotateZ(Math.PI / 2).translate(side * 0.55, y0, 0)); parts.push(ribbed(0.21, up).translate(side * 0.92, y0 + up / 2, 0)); };
  arm(1, 2.1, 1.9); arm(-1, 3.0, 1.3);
  return mergeGeometries(parts);
}

function impostorMaterial(imp) {
  const m = new THREE.ShaderMaterial({
    fog: true, alphaToCoverage: true, side: THREE.DoubleSide,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTex: { value: null }, uW: { value: imp.width } }]),
    vertexShader: /* glsl */`
      attribute vec4 aOff; attribute float aShade;
      uniform float uW; uniform vec3 uCam; uniform float uHide;
      varying vec2 vUv; varying float vShade;
      #include <fog_pars_vertex>
      void main(){
        vec3 c = aOff.xyz; float h = aOff.w;
        if (distance(c.xz, uCam.xz) < uHide) h = 0.0;   // drawn as a real mesh here
        vec3 toCam = cameraPosition - c; toCam.y = 0.0; toCam = normalize(toCam);
        vec3 right = vec3(toCam.z, 0.0, -toCam.x);
        vec3 wp = c + right * position.x * uW * h + vec3(0.0, position.y * h, 0.0);
        vUv = uv; vShade = aShade;
        vec4 mvPosition = viewMatrix * vec4(wp, 1.0);
        gl_Position = projectionMatrix * mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform sampler2D uTex;
      varying vec2 vUv; varying float vShade;
      #include <common>
      #include <fog_pars_fragment>
      void main(){
        vec4 t = texture(uTex, vUv);
        if (t.a < 0.35) discard;
        gl_FragColor = vec4(t.rgb / max(t.a, 1e-3) * vShade * mix(0.55, 1.0, vUv.y), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
  m.uniforms.uTex.value = imp.tex; // render-target textures can't pass through mergeUniforms
  return m;
}

export class Flora {
  constructor({ scene, renderer, env, ground }) {
    this.scene = scene; this.renderer = renderer; this.env = env; this.ground = ground;
    this.tiles = new Map();          // tileKey -> lists
    this.kinds = new Map();          // "kind:variant" -> { kind, variant, meshes[], cap, imp? }
    this.shared = { uCam: { value: new THREE.Vector3() }, uHide: { value: RADIUS.tree - 3 } };
    this.impDirty = false; this.lastPool = -1; this.lastPos = new THREE.Vector3(1e9, 0, 0);
    this.rockMat = ground.make();
    this.rockGeos = {};
    this.cactusMat = new THREE.MeshStandardMaterial({ color: srgb(0.16, 0.24, 0.12), roughness: 0.92, envMapIntensity: 0.4 });
    this.cactusGeo = saguaroGeo();
    this.winds = [];
  }

  _kind(key) {
    let k = this.kinds.get(key);
    if (k) return k;
    const [kind, variant] = key.split(':');
    k = { kind, variant, cap: 0, meshes: [] };
    if (kind === 'tree' || kind === 'bush') {
      const [preset, seed, tint, opts] = VARIANTS[variant] || VARIANTS.pine1;
      k.v = makeVariant(preset, seed, tint, opts || {});
      this.winds.push(k.v.wind);
      if (kind === 'tree') {
        const imp = bakeImpostor(this.renderer, k.v, this.env);
        const g = new THREE.InstancedBufferGeometry();
        g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
        g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
        g.setIndex([0, 1, 2, 0, 2, 3]);
        const mat = impostorMaterial(imp);
        Object.assign(mat.uniforms, this.shared);
        k.imp = new THREE.Mesh(g, mat); k.imp.frustumCulled = false; k.imp.visible = false;
        this.scene.add(k.imp);
      }
    }
    this.kinds.set(key, k);
    return k;
  }

  _ensureCap(k, n) {
    if (n <= k.cap) return;
    const cap = Math.max(64, Math.ceil(n * 1.5));
    for (const m of k.meshes) { this.scene.remove(m); m.dispose(); }
    k.meshes = [];
    const mk = (geo, mat, shadow = true) => {
      const m = new THREE.InstancedMesh(geo, mat, cap);
      m.count = 0; m.castShadow = shadow; m.receiveShadow = true; m.frustumCulled = false;
      this.scene.add(m); k.meshes.push(m); return m;
    };
    if (k.kind === 'tree' || k.kind === 'bush') { mk(k.v.bGeo, k.v.bMat); mk(k.v.lGeo, k.v.lMat); }
    else if (k.kind === 'rock') {
      if (!this.rockGeos[k.variant]) this.rockGeos[k.variant] = [0, 1, 2].map((i) => fixedSurface(rockGeo(i + k.variant.length * 3), k.variant));
      for (const g of this.rockGeos[k.variant]) mk(g, this.rockMat);
    } else if (k.kind === 'cactus') mk(this.cactusGeo, this.cactusMat);
    k.cap = cap;
  }

  // a variant's generated tree (for hand-placed vignettes)
  variant(kind, name) { return this._kind(`${kind}:${name}`).v; }

  // an instanced rock mesh on a ground layer (for hand-placed stacks: cairns, hoodoos)
  rockInstanced(layer, n) {
    if (!this.rockGeos[layer]) this.rockGeos[layer] = [0, 1, 2].map((i) => fixedSurface(rockGeo(i + layer.length * 3), layer));
    const m = new THREE.InstancedMesh(this.rockGeos[layer][0], this.rockMat, n);
    m.castShadow = m.receiveShadow = true;
    return m;
  }

  add(tileKey, lists) { this.tiles.set(tileKey, lists); for (const key in lists) this._kind(key); this.impDirty = true; }
  drop(tileKey) { this.tiles.delete(tileKey); this.impDirty = true; }

  _rebuildImpostors() {
    for (const [key, k] of this.kinds) {
      if (!k.imp) continue;
      const arrs = [];
      for (const lists of this.tiles.values()) if (lists[key]) arrs.push(lists[key]);
      const n = arrs.reduce((a, b) => a + b.length / 7, 0);
      const off = new Float32Array(n * 4), shade = new Float32Array(n);
      let i = 0;
      for (const a of arrs) for (let j = 0; j < a.length; j += 7, i++) { off.set([a[j], a[j + 1], a[j + 2], a[j + 4]], i * 4); shade[i] = a[j + 6]; }
      const g = k.imp.geometry;
      g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 4));
      g.setAttribute('aShade', new THREE.InstancedBufferAttribute(shade, 1));
      g.instanceCount = n; k.imp.visible = n > 0;
    }
    this.impDirty = false;
  }

  _pools(cam) {
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), p = new THREE.Vector3(), e = new THREE.Euler(), c = new THREE.Color();
    for (const [key, k] of this.kinds) {
      const R = RADIUS[k.kind];
      const picks = [];
      for (const [tk, lists] of this.tiles) {
        const a = lists[key]; if (!a) continue;
        const [ti, tj] = tk.split(':').map(Number);
        if (Math.abs((ti + 0.5) * 256 - cam.x) > R + 128 || Math.abs((tj + 0.5) * 256 - cam.z) > R + 128) continue;
        for (let j = 0; j < a.length; j += 7) if (Math.hypot(a[j] - cam.x, a[j + 2] - cam.z) < R) picks.push(a.subarray(j, j + 7));
      }
      this._ensureCap(k, picks.length);
      const nm = k.meshes.length;
      if (k.kind === 'rock') {
        const counts = new Array(nm).fill(0);
        for (const it of picks) {
          const which = Math.floor(it[6] * 997) % nm, mesh = k.meshes[which];
          e.set((it[6] - 0.8) * 1.2, it[3], (it[5] - 1) * 0.5); q.setFromEuler(e);
          s.set(it[4] * (0.8 + 0.5 * it[6]), it[4] * (0.7 + 0.5 * ((it[6] * 7) % 1)), it[4] * (0.8 + 0.5 * ((it[6] * 13) % 1)));
          m4.compose(p.set(it[0], it[1], it[2]), q, s);
          mesh.setMatrixAt(counts[which]++, m4);
        }
        k.meshes.forEach((m, i) => { m.count = counts[i]; m.instanceMatrix.needsUpdate = true; });
        continue;
      }
      picks.forEach((it, i) => {
        e.set(0, it[3], 0); q.setFromEuler(e);
        const h = it[4], w = it[5];
        s.set(h * w, h, h * w);
        m4.compose(p.set(it[0], it[1], it[2]), q, s);
        for (const m of k.meshes) m.setMatrixAt(i, m4);
        if (k.kind !== 'cactus') { c.setScalar(it[6]); k.meshes[1].setColorAt(i, c); }
      });
      for (const m of k.meshes) { m.count = picks.length; m.instanceMatrix.needsUpdate = true; if (m.instanceColor) m.instanceColor.needsUpdate = true; }
    }
  }

  update(cam, time) {
    this.shared.uCam.value.copy(cam);
    for (const w of this.winds) w.value = time;
    const now = performance.now();
    if (this.impDirty && now - (this._impT || 0) > 600) { this._impT = now; this._rebuildImpostors(); }
    if (now - this.lastPool > 350 || cam.distanceTo(this.lastPos) > 6) { this.lastPool = now; this.lastPos.copy(cam); this._pools(cam); }
  }
}
