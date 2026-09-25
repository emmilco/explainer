// Ground material: 16 PBR layers splatted by per-vertex weights (four vec4 attributes read
// from one interleaved buffer). Albedo is normalised by each layer's mean colour and re-tinted,
// so hue comes from the world model and the texture supplies detail. `discardR` hides fragments
// within that horizontal distance of the camera, which is how the coarser LODs hand off to the
// finer ones.
import * as THREE from 'three';
import { LAYERS, NLAYERS, L } from './layers.js';

const SIZE = 1024;

function loadImage(url) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
}

async function packArray(base, suffix, srgb) {
  const imgs = await Promise.all(LAYERS.map((l) => loadImage(`${base}/tex/${l.file}_${suffix}.jpg`)));
  const c = document.createElement('canvas'); c.width = c.height = SIZE;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const data = new Uint8Array(SIZE * SIZE * 4 * NLAYERS);
  const means = [];
  imgs.forEach((img, i) => {
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
    const px = ctx.getImageData(0, 0, SIZE, SIZE).data;
    data.set(px, i * SIZE * SIZE * 4);
    if (srgb) {
      let r = 0, g = 0, b = 0;
      for (let k = 0; k < px.length; k += 64) { r += (px[k] / 255) ** 2.2; g += (px[k + 1] / 255) ** 2.2; b += (px[k + 2] / 255) ** 2.2; }
      const n = px.length / 64;
      means.push([r / n, g / n, b / n]);
    }
  });
  const tex = new THREE.DataArrayTexture(data, SIZE, SIZE, NLAYERS);
  tex.format = THREE.RGBAFormat;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true; tex.anisotropy = 8;
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return { tex, means };
}

export async function makeGround(assetBase) {
  const [{ tex: alb, means }, { tex: nrm }] = await Promise.all([packArray(assetBase, 'diff', true), packArray(assetBase, 'nor', false)]);
  const shared = {
    uAlb: { value: alb }, uNrm: { value: nrm },
    uLayerCol: { value: LAYERS.map((l, i) => new THREE.Vector3(l.color[0] / means[i][0], l.color[1] / means[i][1], l.color[2] / means[i][2])) },
    uScale: { value: LAYERS.map((l) => 1 / l.scale) },
    uTri: { value: LAYERS.map((l) => (l.triplanar ? 1 : 0)) },
    uCamXZ: { value: new THREE.Vector2() },
  };

  function make({ discardR = 0, polygonOffset = 0 } = {}) {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 });
    if (polygonOffset) { m.polygonOffset = true; m.polygonOffsetFactor = polygonOffset; m.polygonOffsetUnits = polygonOffset; }
    const local = { uDiscardR: { value: discardR } };
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, shared, local);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
          attribute vec4 w0; attribute vec4 w1; attribute vec4 w2; attribute vec4 w3; attribute float snow;
          varying vec3 vWP; varying vec3 vWN; varying vec4 vW0; varying vec4 vW1; varying vec4 vW2; varying vec4 vW3; varying float vSnow;`)
        .replace('#include <fog_vertex>', `#include <fog_vertex>
          vec4 gwp = vec4(transformed, 1.0); vec3 gwn = objectNormal;
          #ifdef USE_INSTANCING
            gwp = instanceMatrix * gwp; gwn = mat3(instanceMatrix) * gwn;
          #endif
          vWP = (modelMatrix * gwp).xyz; vWN = normalize(mat3(modelMatrix) * gwn);
          vW0 = w0; vW1 = w1; vW2 = w2; vW3 = w3; vSnow = snow;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          precision highp sampler2DArray;
          uniform sampler2DArray uAlb; uniform sampler2DArray uNrm;
          uniform vec3 uLayerCol[${NLAYERS}]; uniform float uScale[${NLAYERS}]; uniform float uTri[${NLAYERS}];
          uniform vec2 uCamXZ; uniform float uDiscardR;
          varying vec3 vWP; varying vec3 vWN; varying vec4 vW0; varying vec4 vW1; varying vec4 vW2; varying vec4 vW3; varying float vSnow;
          float gh(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
          float gn(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
            return mix(mix(gh(i),gh(i+vec2(1,0)),u.x), mix(gh(i+vec2(0,1)),gh(i+vec2(1,1)),u.x), u.y); }
          vec3 gAlb; vec3 gN;
          vec3 strataMul(vec3 p){
            float n = gn(p.xz * 0.02) + 0.35 * gn(p.xz * 0.11);
            float y = p.y + n * 5.0 + sin(p.x * 0.013 + p.z * 0.007) * 3.0 + gn(p.xz * 0.004) * 8.0;
            float band = sin(y * 0.55 + sin(y * 0.21) * 1.5) * 0.5 + 0.5, band2 = sin(y * 1.7 + n * 3.0) * 0.5 + 0.5, band3 = sin(y * 6.1 + n) * 0.5 + 0.5;
            vec3 red = pow(vec3(0.58,0.24,0.12), vec3(2.2)), orange = pow(vec3(0.70,0.38,0.19), vec3(2.2));
            vec3 cream = pow(vec3(0.78,0.62,0.45), vec3(2.2)), maroon = pow(vec3(0.40,0.17,0.11), vec3(2.2));
            vec3 c = mix(red, orange, band);
            c = mix(c, cream, smoothstep(0.82, 0.97, band2) * 0.45);
            c = mix(c, maroon, smoothstep(0.8, 1.0, 1.0 - band) * 0.5);
            c *= 0.9 + 0.2 * band3;
            return c / pow(vec3(0.62,0.34,0.20), vec3(2.2));
          }
          void layer(int L, float w, vec3 N, float mixk){
            vec3 col; vec3 n;
            if (uTri[L] > 0.5) {
              vec3 bw = pow(abs(N), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
              vec3 p = vWP * uScale[L];
              vec3 ax = texture(uAlb, vec3(p.zy, L)).rgb, ay = texture(uAlb, vec3(p.xz, L)).rgb, az = texture(uAlb, vec3(p.xy, L)).rgb;
              vec3 tx = texture(uNrm, vec3(p.zy, L)).xyz*2.-1., ty = texture(uNrm, vec3(p.xz, L)).xyz*2.-1., tz = texture(uNrm, vec3(p.xy, L)).xyz*2.-1.;
              tx = vec3(tx.xy + N.zy, abs(tx.z) * N.x); ty = vec3(ty.xy + N.xz, abs(ty.z) * N.y); tz = vec3(tz.xy + N.xy, abs(tz.z) * N.z);
              n = tx.zyx * bw.x + ty.xzy * bw.y + tz.xyz * bw.z;
              col = ax*bw.x + ay*bw.y + az*bw.z;
            } else {
              vec2 uv = vWP.xz * uScale[L];
              vec2 uv2 = mat2(0.8,-0.6,0.6,0.8) * uv * 0.37 + 0.31;
              col = mix(texture(uAlb, vec3(uv, L)).rgb, texture(uAlb, vec3(uv2, L)).rgb, mixk);
              vec3 t = mix(texture(uNrm, vec3(uv, L)).xyz, texture(uNrm, vec3(uv2, L)).xyz, mixk) * 2.0 - 1.0;
              n = vec3(t.xy + N.xz, abs(t.z) * N.y).xzy;
            }
            col *= uLayerCol[L];
            if (L == ${L.strata}) col *= strataMul(vWP);
            gAlb += col * w; gN += n * w;
          }`)
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
          // square hand-off region, matching the finer LOD's square tile coverage
          vec2 dcam = abs(vWP.xz - uCamXZ);
          if (uDiscardR > 0.0 && max(dcam.x, dcam.y) < uDiscardR) discard;`)
        .replace('#include <map_fragment>', `
          vec3 N0 = normalize(vWN);
          float mixk = smoothstep(0.25, 0.75, gn(vWP.xz * 0.045));
          float W[16] = float[16](vW0.x, vW0.y, vW0.z, vW0.w, vW1.x, vW1.y, vW1.z, vW1.w, vW2.x, vW2.y, vW2.z, vW2.w, vW3.x, vW3.y, vW3.z, vW3.w);
          gAlb = vec3(0.0); gN = vec3(0.0); float wsum = 0.0;
          for (int i = 0; i < 16; i++) { if (W[i] > 0.01) { layer(i, W[i], N0, mixk); wsum += W[i]; } }
          wsum = max(wsum, 1e-3);
          gAlb /= wsum;
          diffuseColor.rgb *= gAlb * (0.85 + 0.3 * gn(vWP.xz * 0.013));`)
        .replace('#include <color_fragment>', `#include <color_fragment>
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.92, 0.96), vSnow);`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          vec3 gwN = normalize(mix(gN / wsum, N0, 0.15 + 0.6 * vSnow));
          normal = normalize((viewMatrix * vec4(gwN, 0.0)).xyz);`);
    };
    m.customProgramCacheKey = () => 'ground16';
    m.userData.local = local;
    return m;
  }

  return { make, shared };
}

// Geometry from a worker tile payload.
export function tileGeometry(t) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(t.pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(t.nrm, 3));
  g.setAttribute('color', new THREE.BufferAttribute(t.tint, 3));
  g.setAttribute('snow', new THREE.BufferAttribute(t.snow, 1));
  const ib = new THREE.InterleavedBuffer(t.wts, NLAYERS);
  for (let k = 0; k < 4; k++) g.setAttribute(`w${k}`, new THREE.InterleavedBufferAttribute(ib, 4, k * 4));
  g.setIndex(new THREE.BufferAttribute(t.idx, 1));
  g.computeBoundingSphere();
  return g;
}

// Geometry with a fixed surface (rocks): all vertices share one layer weight set.
export function fixedSurface(g, layerName, tint = [1, 1, 1]) {
  const n = g.attributes.position.count;
  const w = new Float32Array(n * NLAYERS);
  for (let v = 0; v < n; v++) w[v * NLAYERS + L[layerName]] = 1;
  const ib = new THREE.InterleavedBuffer(w, NLAYERS);
  for (let k = 0; k < 4; k++) g.setAttribute(`w${k}`, new THREE.InterleavedBufferAttribute(ib, 4, k * 4));
  const c = new Float32Array(n * 3); for (let v = 0; v < n; v++) c.set(tint, v * 3);
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  g.setAttribute('snow', new THREE.BufferAttribute(new Float32Array(n), 1));
  return g;
}
