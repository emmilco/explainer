// Engine bootstrap: renderer, region-blended sky/sun/fog, streamed terrain, flora, grass,
// rivers, post grade. A driver (the walk) supplies the camera pose each frame via render().
import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { makeWorld } from './world.js';
import { makeGround } from './ground.js';
import { Tiles } from './tiles.js';
import { Flora } from './flora.js';
import { makeGrass, fieldTextures } from './grass.js';
import { rng, smoothstep } from './noise.js';

const V3 = THREE.Vector3;

export async function createEngine({ spec, tables, clear = [], tall = [], assetBase, container = document.body, quality = 'high', status = () => {} }) {
  const LOW = quality === 'low';
  const world = makeWorld(spec, tables);
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, LOW ? 1 : 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 30000);
  scene.fog = new THREE.FogExp2(0xffffff, 0.0008);

  // ---------- sky, sun, env ----------
  const sky = new Sky(); sky.scale.setScalar(20000); scene.add(sky);
  const envSky = new Sky(); envSky.scale.setScalar(1000);
  const envScene = new THREE.Scene(); envScene.add(envSky);
  const pmrem = new THREE.PMREMGenerator(renderer);
  let envRT = null, envKey = '';
  const sunDir = new V3(), sunCol = new THREE.Color();
  const sun = new THREE.DirectionalLight(0xffffff, 3);
  sun.castShadow = true;
  sun.shadow.mapSize.set(LOW ? 2048 : 4096, LOW ? 2048 : 4096);
  Object.assign(sun.shadow.camera, { left: -80, right: 80, top: 80, bottom: -80, near: 1, far: 900 });
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.5;
  scene.add(sun, sun.target);
  const hemi = new THREE.HemisphereLight(new THREE.Color().setRGB(0.55, 0.65, 0.85), new THREE.Color().setRGB(0.30, 0.26, 0.20), 0.15);
  scene.add(hemi);

  function applyAtmosphere(x) {
    const a = world.atmosphere(x);
    sunDir.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - a.sunElev), THREE.MathUtils.degToRad(a.sunAz));
    for (const s of [sky, envSky]) {
      const u = s.material.uniforms;
      u.turbidity.value = a.turbidity; u.rayleigh.value = a.rayleigh; u.mieCoefficient.value = a.mie; u.mieDirectionalG.value = 0.8;
      u.sunPosition.value.copy(sunDir);
    }
    const warm = smoothstep(2, 30, a.sunElev);
    sunCol.setRGB(1.0, THREE.MathUtils.lerp(0.62, 0.9, warm), THREE.MathUtils.lerp(0.38, 0.76, warm));
    sun.color.copy(sunCol);
    sun.intensity = THREE.MathUtils.lerp(1.6, 3.0, smoothstep(0, 25, a.sunElev));
    scene.fog.color.setRGB(...a.fog); scene.fog.density = a.fogDensity;
    renderer.toneMappingExposure = a.exposure;
    scene.environmentIntensity = a.env;
    const key = [a.sunElev, a.sunAz, a.turbidity].map((v) => Math.round(v * 2)).join(',');
    if (key !== envKey) { // re-bake the environment when the sky has visibly changed
      envKey = key;
      const rt = pmrem.fromScene(envScene, 0, 0.1, 5000);
      if (envRT) envRT.dispose();
      envRT = rt; scene.environment = rt.texture;
    }
    return a;
  }
  applyAtmosphere(world.X0);

  // ---------- ground, terrain, flora ----------
  status('Loading ground textures…');
  const ground = await makeGround(assetBase);
  const flora = new Flora({ scene, renderer, env: scene.environment, ground });
  const tiles = new Tiles({ scene, world, spec, tables: world.tables, clear, tall, ground,
    onFlora: (k, lists) => flora.add(k, lists), onFloraDrop: (k) => flora.drop(k), nWorkers: LOW ? 4 : 6 });
  await tiles.ready;
  status('Shaping the far country…');
  await tiles.buildFar();

  // ---------- rivers ----------
  {
    const pos = [], uv = [], idx = [];
    let run = null;
    const flush = () => { run = null; };
    for (let x = world.X0 - world.PAD; x <= world.X1 + world.PAD; x += 2) {
      const a = world.riverAmount(x);
      if (a < 0.02) { flush(); continue; }
      const z = world.zc(x), y = world.waterLevel(x), base = pos.length / 3;
      pos.push(x, y, z - 11, x, y, z + 11); uv.push(a, 0, a, 1);
      const wc = waterColorAt(x); wcol.push(...wc, ...wc);
      if (run !== null) idx.push(base - 2, base - 1, base, base - 1, base + 1, base);
      run = base;
    }
    if (idx.length) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
      g.setAttribute('wcol', new THREE.Float32BufferAttribute(wcol, 3));
      g.setIndex(idx);
      const water = new THREE.Mesh(g, waterMaterial(sunDir, sunCol));
      water.renderOrder = 1; water.frustumCulled = false; scene.add(water);
      scene.userData.water = water.material;
    }
  }

  // ---------- lakes and sea ----------
  for (const sw of world.stillWaters) {
    const g = new THREE.PlaneGeometry(sw.x1 - sw.x0, 9000, 8, 8).rotateX(-Math.PI / 2);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, Math.min(1, Math.min(uv.getX(i), 1 - uv.getX(i)) * 12), 0.5);
    const wc = waterColorAt((sw.x0 + sw.x1) / 2), wcol = new Float32Array(uv.count * 3);
    for (let i = 0; i < uv.count; i++) wcol.set(wc, i * 3);
    g.setAttribute('wcol', new THREE.BufferAttribute(wcol, 3));
    const m = new THREE.Mesh(g, waterMaterial(sunDir, sunCol, sw.kind === 'sea' ? 0.9 : 0.8));
    m.position.set((sw.x0 + sw.x1) / 2, sw.y, 0);
    m.renderOrder = 1; scene.add(m);
    (scene.userData.waters = scene.userData.waters || []).push(m.material);
  }

  // ---------- grass (camera-local field, re-baked as the camera moves) ----------
  status('Growing grass…');
  const FIELD = { size: 176, step: 1 };
  let fieldAt = new V3(world.X0, 0, world.pathZ(world.X0)), baking = false;
  const f0 = fieldTextures(await tiles.bakeField(fieldAt.x, fieldAt.z, FIELD.size, FIELD.step));
  const grass = makeGrass({ fields: f0, sunDir, sunCol, rnd: rng(99),
    patches: LOW ? [{ R: 30, count: 150000 }] : [{ R: 13, count: 200000, scale: 0.9 }, { R: 40, count: 400000 }] });
  grass.meshes.forEach((m) => scene.add(m));

  // ---------- post ----------
  const composer = new EffectComposer(renderer, new THREE.WebGLRenderTarget(innerWidth, innerHeight, { type: THREE.HalfFloatType, samples: LOW ? 0 : 4 }));
  composer.addPass(new RenderPass(scene, camera));
  composer.addPass(new OutputPass());
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

  function frame(pos, quat, time) {
    camera.position.copy(pos); camera.quaternion.copy(quat);
    applyAtmosphere(pos.x);
    sun.position.copy(pos).addScaledVector(sunDir, 400); sun.target.position.copy(pos);
    tiles.update(pos);
    flora.update(pos, time);
    grass.update(pos, time);
    if (scene.userData.water) scene.userData.water.uniforms.uTime.value = time;
    for (const w of scene.userData.waters || []) w.uniforms.uTime.value = time;
    if (!baking && Math.hypot(pos.x - fieldAt.x, pos.z - fieldAt.z) > 28) {
      baking = true;
      const at = pos.clone();
      tiles.bakeField(at.x, at.z, FIELD.size, FIELD.step).then((f) => { grass.setField(fieldTextures(f)); fieldAt = at; baking = false; });
    }
    composer.render();
  }

  // Warm up: load the tiles around a starting pose before the first visible frame.
  async function warm(pos, maxMs = 30000) {
    tiles.update(pos);
    const t0 = performance.now();
    while (tiles.loading > 0 && performance.now() - t0 < maxMs) {
      status(`Building terrain… ${tiles.loading} tiles to go`);
      await new Promise((r) => setTimeout(r, 120));
    }
    flora.update(pos, 0);
    const f = await tiles.bakeField(pos.x, pos.z, FIELD.size, FIELD.step);
    grass.setField(fieldTextures(f)); fieldAt = pos.clone();
  }

  return { world, scene, camera, renderer, tiles, flora, grass, sunDir, frame, warm, EYE: 1.7 };
}

function waterMaterial(sunDir, sunCol, deep = 0.78) {
  return new THREE.ShaderMaterial({
    transparent: true, fog: true, depthWrite: false,
    uniforms: THREE.UniformsUtils.merge([THREE.UniformsLib.fog, { uTime: { value: 0 }, uSunDir: { value: sunDir }, uSunCol: { value: sunCol } }]),
    vertexShader: /* glsl */`
      attribute vec3 wcol;
      varying vec3 vW; varying vec2 vUv; varying vec3 vDeep;
      #include <fog_pars_vertex>
      void main(){ vec4 w = modelMatrix*vec4(position,1.); vW=w.xyz; vUv=uv; vDeep=wcol;
        vec4 mvPosition = viewMatrix*w; gl_Position = projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader: /* glsl */`
      uniform float uTime; uniform vec3 uSunDir, uSunCol;
      varying vec3 vW; varying vec2 vUv; varying vec3 vDeep;
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
        vec3 col = mix(vDeep, skyc, fres);
        col += uSunCol * pow(max(dot(R,uSunDir),0.0), 400.0) * 8.0;
        float a = mix(float(${deep}), 0.97, fres) * smoothstep(0.0, 0.2, vUv.y) * smoothstep(1.0, 0.8, vUv.y) * smoothstep(0.02, 0.4, vUv.x);
        gl_FragColor = vec4(col, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        #include <fog_fragment>
      }`,
  });
}
