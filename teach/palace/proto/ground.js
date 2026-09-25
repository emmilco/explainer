// Ground material: six PBR texture layers splatted by per-vertex weights.
// Layers are packed into two DataArrayTextures (albedo, normal) so the shader
// needs only two samplers. Albedo is divided by each layer's mean colour and
// re-tinted, so hue is controlled by terrain.js and the texture supplies detail.
import * as THREE from 'three';
import { LAYER_COLORS } from './terrain.js';

const LAYERS = ['sparse_grass', 'forest_leaves_04', 'rock_face_03', 'sand_01', 'rocky_trail', 'worn_rock_natural_01'];
// metres per texture repeat
const SCALE = [3.0, 3.5, 7.0, 4.0, 2.5, 9.0];
const TRIPLANAR = [0, 0, 1, 0, 0, 1];
const SIZE = 1024;

function loadImage(url) {
  return new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
}

async function packArray(suffix, withMean) {
  const imgs = await Promise.all(LAYERS.map((n) => loadImage(`assets/tex/${n}_${suffix}.jpg`)));
  const c = document.createElement('canvas'); c.width = c.height = SIZE;
  const ctx = c.getContext('2d', { willReadFrequently: true });
  const data = new Uint8Array(SIZE * SIZE * 4 * LAYERS.length);
  const means = [];
  imgs.forEach((img, i) => {
    ctx.drawImage(img, 0, 0, SIZE, SIZE);
    const px = ctx.getImageData(0, 0, SIZE, SIZE).data;
    data.set(px, i * SIZE * SIZE * 4);
    if (withMean) {
      let r = 0, g = 0, b = 0;
      for (let k = 0; k < px.length; k += 64) { r += (px[k] / 255) ** 2.2; g += (px[k + 1] / 255) ** 2.2; b += (px[k + 2] / 255) ** 2.2; }
      const n = px.length / 64;
      means.push(new THREE.Vector3(r / n, g / n, b / n));
    }
  });
  const tex = new THREE.DataArrayTexture(data, SIZE, SIZE, LAYERS.length);
  tex.format = THREE.RGBAFormat;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.anisotropy = 8;
  if (withMean) tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return { tex, means };
}

export async function makeGroundMaterial() {
  const [{ tex: alb, means }, { tex: nrm }] = await Promise.all([packArray('diff', true), packArray('nor', false)]);
  const layerCol = LAYER_COLORS.map((c, i) => new THREE.Vector3(c[0] / means[i].x, c[1] / means[i].y, c[2] / means[i].z));

  const uniforms = {
    uAlb: { value: alb }, uNrm: { value: nrm },
    uLayerCol: { value: layerCol },
    uScale: { value: SCALE.map((s) => 1 / s) },
  };

  const make = (opts = {}) => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96, metalness: 0 });
    m.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, uniforms);
      sh.vertexShader = sh.vertexShader
        .replace('#include <common>', `#include <common>
          attribute vec3 w0; attribute vec3 w1; attribute float snow;
          varying vec3 vWP; varying vec3 vWN; varying vec3 vW0; varying vec3 vW1; varying float vSnow;`)
        .replace('#include <fog_vertex>', `#include <fog_vertex>
          vec4 gwp = vec4(transformed, 1.0); vec3 gwn = objectNormal;
          #ifdef USE_INSTANCING
            gwp = instanceMatrix * gwp; gwn = mat3(instanceMatrix) * gwn;
          #endif
          vWP = (modelMatrix * gwp).xyz; vWN = normalize(mat3(modelMatrix) * gwn);
          vW0 = w0; vW1 = w1; vSnow = snow;`);
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
          precision highp sampler2DArray;
          uniform sampler2DArray uAlb; uniform sampler2DArray uNrm;
          uniform vec3 uLayerCol[6]; uniform float uScale[6];
          varying vec3 vWP; varying vec3 vWN; varying vec3 vW0; varying vec3 vW1; varying float vSnow;
          float gh(vec2 p){ p = fract(p*vec2(123.34,456.21)); p += dot(p,p+45.32); return fract(p.x*p.y); }
          float gn(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.-2.*f);
            return mix(mix(gh(i),gh(i+vec2(1,0)),u.x), mix(gh(i+vec2(0,1)),gh(i+vec2(1,1)),u.x), u.y); }
          vec3 gAlb; vec3 gN;
          // sandstone strata: horizontal bands in world height, gently warped
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
          // planar (top-down) sample with a second rotated, larger-scale sample to break tiling
          void planar(int L, float w, vec3 N, float mixk){
            vec2 uv = vWP.xz * uScale[L];
            vec2 uv2 = mat2(0.8,-0.6,0.6,0.8) * uv * 0.37 + 0.31;
            vec3 a = mix(texture(uAlb, vec3(uv, L)).rgb, texture(uAlb, vec3(uv2, L)).rgb, mixk);
            vec3 t = mix(texture(uNrm, vec3(uv, L)).xyz, texture(uNrm, vec3(uv2, L)).xyz, mixk) * 2.0 - 1.0;
            vec3 tn = vec3(t.xy + N.xz, abs(t.z) * N.y);
            gAlb += a * uLayerCol[L] * w; gN += tn.xzy * w;
          }
          void triplanar(int L, float w, vec3 N){
            vec3 bw = pow(abs(N), vec3(4.0)); bw /= (bw.x + bw.y + bw.z);
            vec3 p = vWP * uScale[L];
            vec3 ax = texture(uAlb, vec3(p.zy, L)).rgb, ay = texture(uAlb, vec3(p.xz, L)).rgb, az = texture(uAlb, vec3(p.xy, L)).rgb;
            vec3 tx = texture(uNrm, vec3(p.zy, L)).xyz*2.-1., ty = texture(uNrm, vec3(p.xz, L)).xyz*2.-1., tz = texture(uNrm, vec3(p.xy, L)).xyz*2.-1.;
            tx = vec3(tx.xy + N.zy, abs(tx.z) * N.x);
            ty = vec3(ty.xy + N.xz, abs(ty.z) * N.y);
            tz = vec3(tz.xy + N.xy, abs(tz.z) * N.z);
            vec3 n = tx.zyx * bw.x + ty.xzy * bw.y + tz.xyz * bw.z;
            vec3 col = (ax*bw.x + ay*bw.y + az*bw.z) * uLayerCol[L];
            if (L == 5) col *= strataMul(vWP);
            gAlb += col * w; gN += n * w;
          }`)
        .replace('#include <map_fragment>', `
          vec3 N0 = normalize(vWN);
          float mixk = smoothstep(0.25, 0.75, gn(vWP.xz * 0.045));
          float W[6] = float[6](vW0.x, vW0.y, vW0.z, vW1.x, vW1.y, vW1.z);
          gAlb = vec3(0.0); gN = vec3(0.0);
          ${[0, 1, 2, 3, 4, 5].map((i) => `if (W[${i}] > 0.004) ${TRIPLANAR[i] ? `triplanar(${i}, W[${i}], N0);` : `planar(${i}, W[${i}], N0, mixk);`}`).join('\n')}
          float wsum = max(W[0]+W[1]+W[2]+W[3]+W[4]+W[5], 1e-3);
          gAlb /= wsum;
          diffuseColor.rgb *= gAlb * (0.85 + 0.3 * gn(vWP.xz * 0.013));`)
        .replace('#include <color_fragment>', `#include <color_fragment>
          diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.9, 0.92, 0.96), vSnow);`)
        .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
          vec3 gwN = normalize(mix(gN / wsum, N0, 0.15 + 0.6 * vSnow));
          normal = normalize((viewMatrix * vec4(gwN, 0.0)).xyz);`);
    };
    m.customProgramCacheKey = () => 'ground-splat';
    return m;
  };
  return { make };
}

// Attach splat attributes to a geometry from a per-vertex surface function.
export function applySurface(g, surfaceFn) {
  const pos = g.attributes.position.array, nrm = g.attributes.normal.array, n = pos.length / 3;
  const w0 = new Float32Array(n * 3), w1 = new Float32Array(n * 3), col = new Float32Array(n * 3), sn = new Float32Array(n);
  for (let v = 0; v < n; v++) {
    const s = surfaceFn(pos[v * 3], pos[v * 3 + 2], pos[v * 3 + 1], nrm[v * 3 + 1], v);
    w0.set(s.w.slice(0, 3), v * 3); w1.set(s.w.slice(3), v * 3); col.set(s.tint, v * 3); sn[v] = s.snow;
  }
  g.setAttribute('w0', new THREE.BufferAttribute(w0, 3));
  g.setAttribute('w1', new THREE.BufferAttribute(w1, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.setAttribute('snow', new THREE.BufferAttribute(sn, 1));
  return g;
}
