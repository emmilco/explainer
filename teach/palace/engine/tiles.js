// Streaming terrain: 256 m tiles at two LODs around the camera, plus a coarse mesh of the whole
// world. Tiles are built by a pool of workers; nearest tiles are requested first. Each coarser
// layer discards fragments inside the radius covered by the next finer one.
import * as THREE from 'three';
import { tileGeometry } from './ground.js';

const TILE = 256;
const NEAR = { res: 1, half: 384, discard: 0 };
const MID = { res: 4, half: 1300, discard: 360 };
const FAR = { res: 16, discard: 1290, zHalf: 3600 };

export class Tiles {
  constructor({ scene, world, spec, tables, clear, tall = [], ground, onFlora, onFloraDrop, nWorkers = 6 }) {
    this.scene = scene; this.world = world; this.ground = ground;
    this.onFlora = onFlora; this.onFloraDrop = onFloraDrop;
    this.mats = { near: ground.make({ discardR: NEAR.discard }), mid: ground.make({ discardR: MID.discard, polygonOffset: 1 }), far: ground.make({ discardR: FAR.discard, polygonOffset: 2 }) };
    for (const m of Object.values(this.mats)) m.userData.discard = true;
    this.near = new Map(); this.mid = new Map(); this.pending = new Map(); this.floraKeys = new Set();
    this.queue = []; this.busy = 0; this.cb = new Map(); this.seq = 0;
    this.workers = [];
    const ready = [];
    for (let i = 0; i < nWorkers; i++) {
      const w = new Worker(new URL('./terrain-worker.js', import.meta.url), { type: 'module' });
      ready.push(new Promise((res) => { w.onmessage = (e) => { if (e.data.type === 'ready') res(); }; }));
      w.postMessage({ type: 'init', spec, tables, clear, tall });
      w.idle = true;
      this.workers.push(w);
    }
    this.ready = Promise.all(ready).then(() => {
      for (const w of this.workers) w.onmessage = (e) => this._onMessage(w, e.data);
    });
  }

  _onMessage(w, m) {
    w.idle = true;
    const cb = this.cb.get(m.key ?? m.id);
    this.cb.delete(m.key ?? m.id);
    if (cb) cb(m);
    this._pump();
  }

  _post(msg, key, cb, transfer = []) { this.queue.push({ msg, key, cb, transfer }); this._pump(); }

  _pump() {
    if (this.camXZ) this.queue.sort((a, b) => (a.pri ?? this._pri(a.msg)) - (b.pri ?? this._pri(b.msg)));
    for (const w of this.workers) {
      if (!w.idle || !this.queue.length) continue;
      const job = this.queue.shift();
      if (job.msg.type === 'tile' && !this._wanted(job.msg.key)) { this.pending.delete(job.msg.key); continue; }
      w.idle = false;
      this.cb.set(job.key, job.cb);
      w.postMessage(job.msg, job.transfer);
    }
  }

  _pri(msg) {
    if (msg.type === 'field') return -1e9;
    if (msg.type !== 'tile') return 0;
    const cx = msg.x0 + msg.size / 2, cz = msg.z0 + msg.size / 2;
    return Math.hypot(cx - this.camXZ.x, cz - this.camXZ.y) * (msg.res === 1 ? 0.5 : 1) + (msg.far ? 1e6 : 0);
  }

  _wanted(key) {
    const [lod, i, j] = key.split(':');
    const set = lod === 'n' ? this._needNear : lod === 'm' ? this._needMid : null;
    return !set || set.has(`${i}:${j}`);
  }

  // Build the whole-world coarse mesh as 1024 m squares (awaited once at start).
  async buildFar() {
    const W = this.world, sq = 1024;
    const jobs = [];
    for (let x = W.X0 - W.PAD; x < W.X1 + W.PAD; x += sq) {
      for (let z = -FAR.zHalf; z < FAR.zHalf; z += sq) {
        const key = `f:${x}:${z}`;
        jobs.push(new Promise((res) => this._post({ type: 'tile', key, x0: x, z0: z, size: sq, res: FAR.res, far: true }, key, res)));
      }
    }
    for (const t of await Promise.all(jobs)) this.scene.add(new THREE.Mesh(tileGeometry(t), this.mats.far));
  }

  update(cam) {
    this.camXZ = new THREE.Vector2(cam.x, cam.z);
    this.ground.shared.uCamXZ.value.set(cam.x, cam.z);
    const needNear = this._keys(cam, NEAR.half), needMid = this._keys(cam, MID.half);
    this._needNear = needNear; this._needMid = needMid;
    this._sync(this.near, needNear, 'n', NEAR.res, this.mats.near, false);
    this._sync(this.mid, needMid, 'm', MID.res, this.mats.mid, true);
  }

  _keys(cam, half) {
    const s = new Set();
    const i0 = Math.floor((cam.x - half) / TILE), i1 = Math.floor((cam.x + half) / TILE);
    const j0 = Math.floor((cam.z - half) / TILE), j1 = Math.floor((cam.z + half) / TILE);
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) s.add(`${i}:${j}`);
    return s;
  }

  _sync(map, need, lod, res, mat, flora) {
    for (const [k, mesh] of map) {
      if (need.has(k)) continue;
      if (mesh) { this.scene.remove(mesh); mesh.geometry.dispose(); }
      map.delete(k);
      if (flora && this.floraKeys.has(k)) { this.floraKeys.delete(k); this.onFloraDrop?.(k); }
    }
    for (const k of need) {
      if (map.has(k) || this.pending.has(`${lod}:${k}`)) continue;
      const [i, j] = k.split(':').map(Number);
      const key = `${lod}:${k}`;
      this.pending.set(key, true);
      this._post({ type: 'tile', key, x0: i * TILE, z0: j * TILE, size: TILE, res, flora }, key, (t) => {
        this.pending.delete(key);
        if (!(lod === 'n' ? this._needNear : this._needMid).has(k)) return;
        const mesh = new THREE.Mesh(tileGeometry(t), mat);
        mesh.receiveShadow = lod === 'n';
        this.scene.add(mesh);
        map.set(k, mesh);
        if (t.flora) { this.floraKeys.add(k); this.onFlora?.(k, t.flora); }
      });
    }
  }

  // camera-local grass/height field
  bakeField(cx, cz, size, step) {
    const id = `field:${++this.seq}`;
    return new Promise((res) => this._post({ type: 'field', id, cx, cz, size, step }, id, res));
  }

  get loading() { return this.pending.size; }
}
