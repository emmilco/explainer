// The walk: turns a plan (plan.mjs) into what the camera does and what stands in the landscape.
// Time is the narration's clock; everything is a function of it, so seeking just works.
import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
import { instanceVariant } from './trees.js';
import * as VG from './vignettes.js';

const V3 = THREE.Vector3, UP = new V3(0, 1, 0);
const srgb = (r, g, b) => new THREE.Color().setRGB(r, g, b, THREE.SRGBColorSpace);
const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * THREE.MathUtils.clamp(x, 0, 1));
const sstep = THREE.MathUtils.smoothstep;

export async function createWalk({ engine, plan, images, assetBase }) {
  const { scene, world: W, flora } = engine;
  const EYE = plan.EYE;

  // ---------- path ----------
  const pts = plan.curve.map((p) => new V3(p[0], p[1], p[2]));
  const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
  const N = pts.length, ARC = plan.arc;
  function uAtS(s) {
    let lo = 0, hi = N - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (ARC[m] <= s) lo = m; else hi = m; }
    const f = THREE.MathUtils.clamp((s - ARC[lo]) / Math.max(1e-6, ARC[hi] - ARC[lo]), 0, 1);
    return (lo + f) / (N - 1);
  }
  const posAtS = (s) => curve.getPoint(uAtS(THREE.MathUtils.clamp(s, 0, ARC[N - 1])));
  function frameAtS(s) {
    const p = posAtS(s), q = posAtS(s + 2);
    const t = q.sub(p).setY(0).normalize();
    return { p, t, n: new V3(-t.z, 0, t.x) };
  }
  const sAt = (t) => {
    const g = THREE.MathUtils.clamp(t / plan.dt, 0, plan.s.length - 1.001), i = Math.floor(g);
    return plan.s[i] + (plan.s[i + 1] - plan.s[i]) * (g - i);
  };

  // ---------- stop furniture ----------
  const font = await new Promise((res) => new FontLoader().load(`${assetBase}/helvetiker_bold.typeface.json`, res));
  const texLoader = new THREE.TextureLoader();
  const wood = new THREE.MeshStandardMaterial({ color: srgb(0.22, 0.15, 0.1), roughness: 0.7 });
  const letterMat = new THREE.MeshStandardMaterial({ color: srgb(0.9, 0.87, 0.8), roughness: 0.75 });

  function blockWord(word) {
    const g = new TextGeometry(word.toUpperCase(), { font, size: 1, depth: 0.38, curveSegments: 5, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.035, bevelSegments: 2 });
    g.computeBoundingBox();
    const bb = g.boundingBox, w = bb.max.x - bb.min.x, k = Math.min(0.85, 3.6 / w);
    g.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2).scale(k, k, k);
    const m = new THREE.Mesh(g, letterMat); m.castShadow = m.receiveShadow = true;
    m.userData.width = w * k;
    return m;
  }
  function frame(tex, aspect, h) {
    const w = h * aspect, g = new THREE.Group();
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.75 }));
    pic.position.z = 0.052;
    g.add(new THREE.Mesh(new THREE.BoxGeometry(w + 0.18, h + 0.18, 0.1), wood), pic);
    for (const sx of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.4, 0.08), wood); leg.position.set(sx * w * 0.35, -h / 2 - 0.6, -0.05); g.add(leg); }
    g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return g;
  }
  function textTexture(text, px = 160) {
    const c = document.createElement('canvas'), ctx = c.getContext('2d');
    ctx.font = `700 ${px}px Georgia, serif`;
    c.width = Math.ceil(ctx.measureText(text).width) + 80; c.height = px + 80;
    ctx.font = `700 ${px}px Georgia, serif`;
    ctx.fillStyle = 'rgba(255,248,235,0.92)'; ctx.textBaseline = 'middle'; ctx.fillText(text, 40, c.height / 2);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  function project(point, normal, tex, w, h) {
    const patch = new THREE.Mesh(new THREE.BufferGeometry());
    const n = 160, x0 = point.x - 30, z0 = point.z - 30, pos = [], idx = [];
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) { const x = x0 + 60 * i / n, z = z0 + 60 * j / n; pos.push(x, W.height(x, z), z); }
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const a = j * (n + 1) + i; idx.push(a, a + n + 1, a + 1, a + 1, a + n + 1, a + n + 2); }
    patch.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); patch.geometry.setIndex(idx); patch.geometry.computeVertexNormals();
    const helper = new THREE.Object3D(); helper.position.copy(point); helper.lookAt(point.clone().add(normal));
    const mat = new THREE.MeshStandardMaterial({ map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25, roughness: 0.9 });
    const d = new THREE.Mesh(new DecalGeometry(patch, point, helper.rotation, new V3(w, h, 8)), mat);
    d.receiveShadow = true; patch.geometry.dispose();
    return d;
  }

  const stops = plan.stops.map((s) => ({ ...s, built: false, group: null }));
  async function buildStop(s) {
    s.built = true;
    const img = images[s.block];
    const tex = await new Promise((res) => texLoader.load(img.url, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; res(t); }));
    const aspect = tex.image.width / tex.image.height;
    const g = new THREE.Group();
    const p = new V3(...s.p);
    const foci = [];
    if (s.kind === 'cliff') {
      const pt = new V3(...s.cliff.point), nrm = new V3(...s.cliff.normal), size = THREE.MathUtils.clamp(s.cliff.dist * 0.22, 8, 24);
      g.add(project(pt, nrm, tex, Math.min(size * aspect, size * 1.6), size));
      const along = new V3().crossVectors(UP, nrm).setY(0).normalize();
      const kw = textTexture(s.keyword), kwW = size * 0.8, kwH = kwW * kw.image.height / kw.image.width;
      const kwPt = pt.clone().addScaledVector(along, Math.min(size * aspect, size * 1.6) / 2 + kwW * 0.6).add(new V3(0, -size * 0.25, 0));
      kwPt.y = Math.max(kwPt.y, W.height(kwPt.x, kwPt.z) + kwH);
      g.add(project(kwPt, nrm, kw, kwW, kwH));
      foci.push({ c: pt.clone().add(new V3(0, size * 0.1, 0)), w: size, top: pt.y + size * 0.8, bot: pt.y - size * 0.45 });
    } else {
      const h = aspect > 1.3 ? 1.25 : 1.5;
      const e = new V3(...s.easel), pic = frame(tex, aspect, h);
      pic.position.copy(e).add(new V3(0, h / 2 + 1.25, 0)); pic.lookAt(p.x, pic.position.y, p.z); g.add(pic);
      const word = blockWord(s.keyword), l = new V3(...s.letters);
      { // seat the word on the highest ground under its footprint so no letter is buried
        const side = new V3(p.x - l.x, 0, p.z - l.z).normalize().cross(UP), hw = word.userData.width / 2;
        let y = -Infinity;
        for (const k of [-1, -0.5, 0, 0.5, 1]) for (const dd of [-0.25, 0.25]) {
          const q = l.clone().addScaledVector(side, k * hw).add(new V3(p.x - l.x, 0, p.z - l.z).normalize().multiplyScalar(dd));
          y = Math.max(y, W.height(q.x, q.z));
        }
        l.y = y;
      }
      word.position.copy(l).add(new V3(0, -0.05, 0)); word.lookAt(p.x, word.position.y, p.z); g.add(word);
      foci.push({ c: pic.position.clone(), w: h * aspect, top: pic.position.y + h / 2, bot: pic.position.y - h / 2 });
      foci.push({ c: l.clone().add(new V3(0, 0.6, 0)), w: word.userData.width, top: l.y + 1.1, bot: l.y });
    }
    scene.add(g);
    s.group = g; s.tex = tex;
    s.detour = choreograph(s.move, p, frameAtS(s.s).t, foci, new V3(...s.focus));
  }
  function dropStop(s) {
    if (!s.group) return;
    scene.remove(s.group);
    s.group.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); if (o.material !== wood && o.material !== letterMat) o.material.dispose(); } });
    s.tex?.dispose(); s.group = null; s.built = false; s.detour = null;
  }

  // a stop is a short walk off the path at eye level: positions and gaze targets as curves
  function choreograph(move, p, tan, foci, focus) {
    const eyeAt = (x, z) => new V3(x, W.height(x, z) + EYE, z);
    const flat = (v) => new V3(v.x, 0, v.z);
    const P = [p.clone()], L = [focus.clone()];
    if (move === 'orbit') {
      const f = foci[0], c = f.c, toPath = flat(p).sub(flat(c)).normalize(), r = 3.3, sw = 0.95;
      for (let k = 0; k <= 6; k++) {
        const a = -sw + 2 * sw * k / 6, d = toPath.clone().applyAxisAngle(UP, a), q = flat(c).addScaledVector(d, r + 0.6 * Math.cos(a * 1.6));
        P.push(eyeAt(q.x, q.z)); L.push(c.clone().setY(THREE.MathUtils.lerp(f.top, f.bot, 0.35 + 0.25 * Math.sin(k / 6 * Math.PI))));
      }
    } else if (move === 'pan' && foci.length > 1) {
      const sorted = [...foci].sort((a, b) => flat(a.c).sub(flat(p)).dot(tan) - flat(b.c).sub(flat(p)).dot(tan));
      const [left, right] = [sorted[0], sorted[sorted.length - 1]], toward = flat(focus).sub(flat(p)).normalize();
      const stand = flat(p).addScaledVector(toward, 1.6);
      [-1.2, -0.4, 0.4, 1.2].forEach((k, i) => { const q = stand.clone().addScaledVector(tan, k).addScaledVector(toward, i * 0.45); P.push(eyeAt(q.x, q.z)); });
      L.push(left.c.clone().addScaledVector(tan, -left.w * 0.45), left.c.clone().lerp(right.c, 0.35), right.c.clone().lerp(left.c, 0.2), right.c.clone().addScaledVector(tan, right.w * 0.45));
    } else { // approach / rise: walk toward it while the gaze travels up it
      const f = foci[0], c = f.c, toward = flat(c).sub(flat(p)).normalize();
      const dist = flat(c).distanceTo(flat(p));
      const walk = move === 'rise' ? Math.min(16, dist * 0.4) : Math.max(0, Math.min(2.2, dist - 3.4));
      for (let k = 1; k <= 4; k++) { const q = flat(p).addScaledVector(toward, walk * k / 4).addScaledVector(tan, (k - 2) * (move === 'rise' ? 1.2 : 0.35)); P.push(eyeAt(q.x, q.z)); }
      L.push(c.clone().setY(f.bot + 0.2), c.clone().setY(THREE.MathUtils.lerp(f.bot, f.top, 0.35)), c.clone().setY(THREE.MathUtils.lerp(f.bot, f.top, 0.7)), c.clone().setY(f.top - 0.1));
    }
    P.push(p.clone()); L.push(focus.clone());
    return { pos: new THREE.CatmullRomCurve3(P, false, 'centripetal'), look: new THREE.CatmullRomCurve3(L, false, 'centripetal') };
  }

  // ---------- vignettes (built progressively as the walker approaches) ----------
  VG.setWorld(W);
  const vigs = plan.vignettes.map((v) => ({ ...v, c: new V3(...v.c), built: false }));
  const vgDeps = {
    V: { get dbush() { return flora.variant('bush', 'dbush'); }, get aspen() { return flora.variant('tree', 'aspen'); }, get pine1() { return flora.variant('tree', 'pine1'); }, get fbush() { return flora.variant('bush', 'fbush'); } },
    makeVariant: (preset, seed, tint, opts) => flora.variant('tree', preset.startsWith('Oak Large') ? 'oakLarge' : 'dead'),
    instanceVariant,
    rockMesh: (desert, n) => flora.rockInstanced(desert ? 'strata' : 'rock', n),
    rnd: Math.random,
  };
  const vgWinds = [];

  // ---------- pose ----------
  const qA = new THREE.Quaternion(), qB = new THREE.Quaternion(), qN = new THREE.Quaternion(), m4 = new THREE.Matrix4(), eN = new THREE.Euler(0, 0, 0, 'YXZ');
  function vistaAt(s) {
    const V = plan.vistas, g = THREE.MathUtils.clamp(s / plan.vistaStep, 0, V.length - 1.001), i = Math.floor(g), f = g - i;
    const a = V[i], b = V[i + 1], sc = a[3] + (b[3] - a[3]) * f;
    const w = sstep(sc, 0.35, 1.0) * (0.5 + 0.28 * Math.sin(s * 0.021 + 0.8));
    return { target: new V3(a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f), w: Math.min(0.8, w) };
  }
  function pose(t) {
    const s = sAt(t);
    let pos = posAtS(s);
    const ahead = posAtS(s + 25);
    ahead.y = pos.y + (ahead.y - pos.y) * 0.35 + 0.4;
    m4.lookAt(pos, ahead, UP); qA.setFromRotationMatrix(m4);
    const v = vistaAt(s);
    if (v.w > 0) { m4.lookAt(pos, v.target, UP); qB.setFromRotationMatrix(m4); qA.slerp(qB, v.w); }
    let calm = 1;
    for (const st of stops) {
      if (t < st.tArrive - 6 || t > st.tDepart + 4) continue;
      const w = Math.min(sstep(t, st.tArrive - 6, st.tArrive), 1 - sstep(t, st.tDepart, st.tDepart + 4));
      if (w <= 0) continue;
      let look = new V3(...st.focus);
      if (st.detour && t >= st.tArrive && t <= st.tDepart) {
        const k = ease((t - st.tArrive) / (st.tDepart - st.tArrive));
        pos = st.detour.pos.getPoint(k); look = st.detour.look.getPoint(k);
      }
      m4.lookAt(pos, look, UP); qB.setFromRotationMatrix(m4); qA.slerp(qB, w);
      calm = Math.min(calm, 1 - w * 0.7);
    }
    for (const g of plan.glances) {
      if (t < g.t0 || t > g.t1) continue;
      const w = sstep(t, g.t0, g.t0 + 1.8) * (1 - sstep(t, g.t1 - 2.2, g.t1)) * g.amt;
      m4.lookAt(pos, new V3(...g.target), UP); qB.setFromRotationMatrix(m4); qA.slerp(qB, w);
    }
    eN.set((0.025 * Math.sin(t * 0.29 + 2) + 0.012 * Math.sin(t * 0.71)) * calm, (0.06 * Math.sin(t * 0.17) + 0.03 * Math.sin(t * 0.43 + 1)) * calm, 0);
    qA.multiply(qN.setFromEuler(eN));
    eN.setFromQuaternion(qA, 'YXZ');
    const loose = 1 - calm;
    eN.x = THREE.MathUtils.clamp(eN.x, -0.12 - loose * 0.6, 0.14 + loose * 0.6); eN.z = 0;
    qA.setFromEuler(eN);
    return { pos, quat: qA.clone(), s };
  }

  // ---------- streaming of stops/vignettes around the walker ----------
  let lastSync = -1;
  function sync(s) {
    if (Math.abs(s - lastSync) < 5) return;
    lastSync = s;
    for (const st of stops) {
      const d = st.s - s;
      if (!st.built && d > -120 && d < 520) buildStop(st);
      else if (st.built && st.group && (d < -250 || d > 800)) dropStop(st);
    }
    for (const v of vigs) {
      const d = Math.hypot(v.c.x - posAtS(s).x, v.c.z - posAtS(s).z);
      if (!v.built && d < 450) {
        v.built = true;
        const out = VG.build(scene, [v], vgDeps);
        vgWinds.push(...out.winds);
      }
    }
  }

  return {
    pose, sync, sAt, stops, winds: vgWinds,
    warmTo: async (t) => { const { pos } = pose(t); lastSync = -1e9; sync(sAt(t)); await engine.warm(pos); },
  };
}
