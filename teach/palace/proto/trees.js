// Trees: EZ-Tree presets instanced near the walk, camera-facing impostors far away.
import * as THREE from 'three';
import { Tree } from 'ez-tree';

// Generate one EZ-Tree variant normalised to 1 m tall with its base at the origin.
export function makeVariant(preset, seed, tint, { noLeaves = false, bark = null } = {}) {
  const tree = new Tree();
  tree.loadPreset(preset);
  tree.options.seed = seed;
  if (tint) tree.options.leaves.tint = tint;
  if (noLeaves) tree.options.leaves.count = 0;
  if (bark) tree.options.bark.tint = bark;
  tree.generate();
  const box = new THREE.Box3().setFromObject(tree);
  const s = 1 / (box.max.y - box.min.y);
  const fix = (g) => g.clone().translate(0, -box.min.y, 0).scale(s, s, s);
  const bGeo = fix(tree.branchesMesh.geometry), lGeo = fix(tree.leavesMesh.geometry);
  const bMat = tree.branchesMesh.material, lMat = tree.leavesMesh.material;
  lMat.alphaToCoverage = true;
  // EZ-Tree's own wind shader bypasses instancing; replace it with an instancing-safe sway.
  const wind = { value: 0 };
  lMat.onBeforeCompile = (sh) => {
    sh.uniforms.uTime = wind;
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vec3 ip = vec3(0.0);
        #ifdef USE_INSTANCING
          ip = instanceMatrix[3].xyz;
        #endif
        float ph = ip.x * 0.13 + ip.z * 0.07 + position.y * 3.0;
        transformed.xz += uv.y * vec2(sin(uTime * 1.3 + ph), cos(uTime * 1.1 + ph * 1.3)) * 0.012;`);
  };
  lMat.customProgramCacheKey = () => `leaf-${preset}`;
  const tris = (g) => (g.index ? g.index.count : g.attributes.position.count) / 3;
  console.log(`tree ${preset}#${seed}: ${Math.round(tris(bGeo) + tris(lGeo))} tris`);
  return { bGeo, lGeo, bMat, lMat, wind, preset, tris: tris(bGeo) + tris(lGeo) };
}

export function instanceVariant(scene, v, placements) {
  const n = placements.length;
  if (!n) return null;
  const b = new THREE.InstancedMesh(v.bGeo, v.bMat, n), l = new THREE.InstancedMesh(v.lGeo, v.lMat, n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), c = new THREE.Color();
  placements.forEach((p, i) => {
    q.setFromEuler(new THREE.Euler(p.tilt || 0, p.yaw, p.tilt2 || 0));
    s.set(p.h * (p.wide || 1), p.h, p.h * (p.wide || 1));
    m.compose(new THREE.Vector3(p.x, p.y, p.z), q, s);
    b.setMatrixAt(i, m); l.setMatrixAt(i, m);
    c.setScalar(p.shade ?? 1); l.setColorAt(i, c);
  });
  for (const mesh of [b, l]) { mesh.castShadow = true; mesh.receiveShadow = true; mesh.computeBoundingSphere(); scene.add(mesh); }
  return [b, l];
}

// Render a variant from the side into a transparent texture for use as an impostor.
export function bakeImpostor(renderer, v, env) {
  const sc = new THREE.Scene();
  sc.environment = env; sc.environmentIntensity = 0.6;
  const g = new THREE.Group();
  g.add(new THREE.Mesh(v.bGeo, v.bMat), new THREE.Mesh(v.lGeo, v.lMat));
  sc.add(g);
  const box = new THREE.Box3().setFromObject(g);
  const halfW = Math.max(-box.min.x, box.max.x, -box.min.z, box.max.z) * 1.03; // in tree-heights
  const H = 512, W = Math.min(1024, Math.round(H * (2 * halfW) / 1.02));
  const rt = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
  rt.texture.generateMipmaps = true;
  rt.texture.minFilter = THREE.LinearMipmapLinearFilter;
  const cam = new THREE.OrthographicCamera(-halfW, halfW, 1.01, -0.01, 0.01, 10);
  cam.position.set(0, 0, 5); cam.lookAt(0, 0.5, 0); cam.position.y = 0; cam.rotation.set(0, 0, 0);
  const sun = new THREE.DirectionalLight(0xfff2e0, 2.6); sun.position.set(2, 3, 4); sc.add(sun);
  sc.add(new THREE.HemisphereLight(0xb8c8e0, 0x404030, 0.8));
  const prevTM = renderer.toneMapping, prevClear = renderer.getClearAlpha();
  renderer.setRenderTarget(rt);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  renderer.render(sc, cam);
  renderer.setRenderTarget(null);
  renderer.setClearColor(0x000000, prevClear);
  renderer.toneMapping = prevTM;
  return { tex: rt.texture, width: 2 * halfW };
}

export function makeImpostors(imp, placements, { sunDir }) {
  const n = placements.length;
  const g = new THREE.InstancedBufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0.5, 1, 0, -0.5, 1, 0], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
  g.setIndex([0, 1, 2, 0, 2, 3]);
  const off = new Float32Array(n * 4), shade = new Float32Array(n);
  placements.forEach((p, i) => { off.set([p.x, p.y, p.z, p.h], i * 4); shade[i] = p.shade ?? 1; });
  g.setAttribute('aOff', new THREE.InstancedBufferAttribute(off, 4));
  g.setAttribute('aShade', new THREE.InstancedBufferAttribute(shade, 1));
  g.instanceCount = n;
  const mat = new THREE.ShaderMaterial({
    fog: true, alphaToCoverage: true, side: THREE.DoubleSide,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTex: { value: null }, uW: { value: imp.width }, uSunDir: { value: sunDir } }]),
    vertexShader: /* glsl */`
      attribute vec4 aOff; attribute float aShade;
      uniform float uW;
      varying vec2 vUv; varying float vShade;
      #include <fog_pars_vertex>
      void main(){
        vec3 c = aOff.xyz; float h = aOff.w;
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
  mat.uniforms.uTex.value = imp.tex;
  const mesh = new THREE.Mesh(g, mat);
  mesh.frustumCulled = false;
  return mesh;
}
