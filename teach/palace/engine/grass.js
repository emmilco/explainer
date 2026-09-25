// Camera-following grass. A fixed pool of blades is scattered over a square of
// half-size R; each frame the square is re-centred on the camera by wrapping blade
// offsets (mod 2R), so density near the viewer is constant everywhere on the walk.
// Height and grass mask come from textures baked from terrain.js.
import * as THREE from 'three';

// Field textures from a worker bake (camera-local height + grass mask, uploaded as textures).
export function fieldTextures(f) {
  const hTex = new THREE.DataTexture(f.hts, f.n, f.n, THREE.RedFormat, THREE.FloatType);
  hTex.minFilter = hTex.magFilter = THREE.NearestFilter; hTex.needsUpdate = true;
  const mTex = new THREE.DataTexture(f.mask, f.n, f.n, THREE.RGBAFormat);
  mTex.minFilter = mTex.magFilter = THREE.LinearFilter; mTex.needsUpdate = true;
  return { hTex, mTex, origin: new THREE.Vector2(f.x0, f.z0), size: new THREE.Vector2((f.n - 1) * f.step, (f.n - 1) * f.step), step: f.step };
}

function bladeGeometry(count, R, rnd) {
  const segs = 5, pos = [], idx = [];
  for (let s = 0; s <= segs; s++) {
    const y = s / segs;
    if (s < segs) pos.push(-0.5, y, 0, 0.5, y, 0); else pos.push(0, 1, 0);
  }
  for (let s = 0; s < segs - 1; s++) { const a = s * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const t = (segs - 1) * 2; idx.push(t, t + 1, t + 2);
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(new Array(pos.length).fill(0), 3));
  g.setIndex(idx);
  const off = new Float32Array(count * 2), r4 = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    off[i * 2] = (rnd() * 2 - 1) * R; off[i * 2 + 1] = (rnd() * 2 - 1) * R;
    r4[i * 4] = rnd() * Math.PI * 2; r4[i * 4 + 1] = rnd(); r4[i * 4 + 2] = rnd(); r4[i * 4 + 3] = rnd();
  }
  g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 2));
  g.setAttribute('aRnd', new THREE.InstancedBufferAttribute(r4, 4));
  g.instanceCount = count;
  return g;
}

export function makeGrass({ fields, sunDir, sunCol, rnd, patches }) {
  const shared = {
    uTime: { value: 0 }, uCam: { value: new THREE.Vector2() },
    uH: { value: fields.hTex }, uMask: { value: fields.mTex },
    uOrigin: { value: fields.origin }, uSize: { value: fields.size }, uStep: { value: fields.step },
    uSunDir: { value: sunDir }, uSunCol: { value: sunCol },
  };
  const meshes = patches.map(({ R, count, scale = 1 }) => {
    const mat = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, shared, { uR: { value: R }, uThin: { value: scale } });
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
          attribute vec2 aOff; attribute vec4 aRnd;
          uniform float uTime, uR, uStep, uThin; uniform vec2 uCam, uOrigin, uSize; uniform vec3 uSunDir;
          uniform sampler2D uMask; uniform highp sampler2D uH;
          varying vec3 vGCol; varying float vTrans; varying float vGY;
          float hAt(vec2 p){
            vec2 g = (p - uOrigin) / uStep; vec2 i = floor(g), f = g - i;
            ivec2 s = textureSize(uH, 0);
            ivec2 a = clamp(ivec2(i), ivec2(0), s - 2);
            float h00 = texelFetch(uH, a, 0).r, h10 = texelFetch(uH, a + ivec2(1,0), 0).r;
            float h01 = texelFetch(uH, a + ivec2(0,1), 0).r, h11 = texelFetch(uH, a + ivec2(1,1), 0).r;
            return mix(mix(h00, h10, f.x), mix(h01, h11, f.x), f.y);
          }
          vec3 gPos; vec3 gNrm;
          float gh2(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
          float gvn(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
            return mix(mix(gh2(i),gh2(i+vec2(1,0)),u.x), mix(gh2(i+vec2(0,1)),gh2(i+vec2(1,1)),u.x), u.y); }`)
        .replace('#include <beginnormal_vertex>', `
          vec2 rel = mod(aOff - uCam + uR, 2.0 * uR) - uR;
          vec2 wxz = uCam + rel;
          float dist = length(rel);
          vec3 m = texture(uMask, (wxz - uOrigin) / uSize).rgb;
          float lush = m.r, dry = m.g, tall = m.b;
          float isLush = step(aRnd.w, lush);
          float alive = max(isLush, step(aRnd.w, lush + dry));
          float fade = 1.0 - smoothstep(uR * 0.7, uR, dist);
          float y = position.y;
          // clumps and patches in world space
          float clump = gvn(wxz * 0.13) * 0.65 + gvn(wxz * 0.6) * 0.35;
          float dryPatch = smoothstep(0.55, 0.85, gvn(wxz * 0.03 + 7.0));
          float darkPatch = gvn(wxz * 0.09 - 3.0);
          float flowerZone = smoothstep(0.62, 0.8, gvn(wxz * 0.05 + 21.0));
          float flower = step(0.965, fract(aRnd.w * 91.7)) * isLush * flowerZone;
          float h = mix(0.22, 0.8, aRnd.y * aRnd.y) * mix(0.55, 1.35, clump) * mix(0.75, 1.0, isLush) * mix(0.8, 1.15, lush) * fade * alive;
          h *= mix(1.0, 1.25, flower);
          // long-wavelength variation so stretches of the walk differ (short turf vs. lush meadow)
          h *= mix(0.45, 1.3, smoothstep(0.2, 0.8, gvn(wxz * 0.011 + 40.0)));
          h = mix(h, (0.75 + aRnd.y * 0.55) * fade * alive * mix(0.8, 1.0, clump), tall); // waist-high patches
          float w = mix(0.028, 0.052, aRnd.z) * uThin * mix(0.7, 1.0, isLush) * mix(1.0, 0.8, flower);
          float c = cos(aRnd.x), s = sin(aRnd.x);
          vec3 fwd = vec3(c, 0.0, s), side = vec3(-s, 0.0, c);
          // gusts: bands of stronger wind rolling across the ground, plus flutter
          vec2 wdir = normalize(vec2(0.85, 0.5));
          float gust = sin(dot(wxz, wdir) * 0.09 - uTime * 1.25 + gvn(wxz * 0.02) * 4.0) * 0.5 + 0.5;
          gust = smoothstep(0.35, 1.0, gust) * (0.6 + 0.4 * gvn(wxz * 0.015 + uTime * 0.05));
          float flutter = sin(uTime * 3.4 + wxz.x * 0.9 + wxz.y * 0.7 + aRnd.w * 6.28) * 0.12;
          float lean = 0.12 + aRnd.z * 0.3;
          vec3 wind3 = vec3(wdir.x, 0.0, wdir.y);
          vec3 bend = (fwd * lean + wind3 * (0.18 + gust * 0.75) + side * flutter) * y * y * h;
          gPos = vec3(wxz.x, hAt(wxz) - 0.04, wxz.y) + side * (position.x * w * (1.0 - 0.8 * y)) + vec3(0.0, y * h, 0.0) + bend;
          gPos.y -= dot(bend, bend) * 0.6 / max(h, 0.05);
          gNrm = normalize(fwd + side * position.x * 0.9 + vec3(0.0, 0.35, 0.0));
          vec3 lushBase = vec3(0.022, 0.04, 0.009), lushTip = vec3(0.15, 0.23, 0.045);
          vec3 strawTip = vec3(0.34, 0.29, 0.12);
          vec3 dryBase = vec3(0.07, 0.05, 0.02), dryTip = vec3(0.36, 0.28, 0.13);
          lushTip = mix(lushTip, strawTip, dryPatch * 0.7 * aRnd.z);
          lushTip *= mix(0.75, 1.1, darkPatch);
          float v = 0.8 + 0.4 * fract(aRnd.w * 17.3);
          vec3 tip = mix(dryTip, lushTip, isLush) * v * (1.0 + gust * 0.35);
          vGCol = mix(mix(dryBase, lushBase, isLush), tip, smoothstep(0.0, 1.0, y));
          float fk = fract(aRnd.w * 53.1);
          vec3 fcol = fk < 0.4 ? vec3(0.8, 0.78, 0.7) : (fk < 0.75 ? vec3(0.85, 0.6, 0.06) : vec3(0.38, 0.22, 0.6));
          vGCol = mix(vGCol, fcol, flower * smoothstep(0.82, 1.0, y));
          vGY = y;
          vec3 objectNormal = gNrm;`)
        .replace('#include <begin_vertex>', `vec3 transformed = gPos;`)
        .replace('#include <fog_vertex>', `#include <fog_vertex>
          vec3 vdir = normalize(cameraPosition - gPos);
          vTrans = pow(max(dot(vdir, -uSunDir), 0.0), 3.0) * y;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          uniform vec3 uSunCol; varying vec3 vGCol; varying float vTrans; varying float vGY;`)
        .replace('#include <color_fragment>', `diffuseColor.rgb = vGCol;`)
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          totalEmissiveRadiance += vGCol * uSunCol * vTrans * 0.45;`)
        .replace('#include <aomap_fragment>', `#include <aomap_fragment>
          reflectedLight.indirectDiffuse *= mix(0.35, 1.0, vGY);`);
    };
    mat.customProgramCacheKey = () => `grass-${R}`;
    const mesh = new THREE.Mesh(bladeGeometry(count, R, rnd), mat);
    mesh.frustumCulled = false;
    mesh.receiveShadow = true;
    return mesh;
  });
  return {
    meshes,
    update(cam, time) { shared.uCam.value.set(cam.x, cam.z); shared.uTime.value = time; },
    setField(f) {
      shared.uH.value.dispose(); shared.uMask.value.dispose();
      shared.uH.value = f.hTex; shared.uMask.value = f.mTex;
      shared.uOrigin.value.copy(f.origin); shared.uSize.value.copy(f.size); shared.uStep.value = f.step;
    },
  };
}
