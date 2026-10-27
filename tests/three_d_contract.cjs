'use strict';

// Headless geometry check for the main course renderer. This exercises the
// real mesh builder and its public render API without opening a local browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
const gamePrelude = source.slice(0, source.indexOf('const clubNames'));
assert.ok(gamePrelude.includes('function courseLayout'), 'course layout prelude missing');

const uploads = [];
const draws = [];
let boundBuffer = null;
const gl = new Proxy({
  VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4,
  ARRAY_BUFFER: 5, FLOAT: 6, STATIC_DRAW: 7, DYNAMIC_DRAW: 8,
  DEPTH_TEST: 9, LEQUAL: 10, CULL_FACE: 11, TRIANGLES: 12,
  COLOR_BUFFER_BIT: 13, DEPTH_BUFFER_BIT: 14,
  createShader() { return {}; }, createProgram() { return {}; },
  createBuffer() { return {}; }, createVertexArray() { return {}; },
  getShaderParameter() { return true; }, getProgramParameter() { return true; },
  getAttribLocation() { return 0; }, getUniformLocation() { return {}; },
  bindBuffer(_target, buffer) { boundBuffer = buffer; },
  bufferData(_target, data, usage) {
    assert.ok(Array.from(data).every(Number.isFinite), 'non-finite mesh vertex');
    assert.equal(data.length % 30, 0, 'mesh is not all triangles');
    uploads.push({ buffer: boundBuffer, usage, count: data.length / 10,
      checksum: Array.from(data).reduce((sum, value, index) => sum + value * ((index % 7) + 1), 0) });
  },
  uniformMatrix4fv(_location, _transpose, matrix) {
    assert.ok(Array.from(matrix).every(Number.isFinite), 'non-finite camera matrix');
  },
  uniform3fv(_location, vector) {
    assert.ok(Array.from(vector).every(Number.isFinite), 'non-finite camera');
  },
  drawArrays(_mode, first, count) {
    assert.equal(first, 0);
    assert.ok(Number.isInteger(count) && count > 0, 'empty or fractional draw');
    draws.push(count);
  }
}, { get(target, key) { return key in target ? target[key] : () => {}; } });

const canvas = {
  width: 0, height: 0,
  getContext(kind) { assert.equal(kind, 'webgl2'); return gl; },
  getBoundingClientRect() { return { width: 1280, height: 720 }; }
};
const context = vm.createContext({ window: { devicePixelRatio: 1 }, Float32Array, Math, Map, console });
vm.runInContext(fs.readFileSync(path.join(root, 'course-blueprints.js'), 'utf8'), context,
  { filename: 'course-blueprints.js' });
vm.runInContext(`${gamePrelude}\nglobalThis.courseLayout = courseLayout;`, context,
  { filename: 'game.js:layout' });
vm.runInContext(fs.readFileSync(path.join(root, 'game-3d.js'), 'utf8'), context,
  { filename: 'game-3d.js' });
const renderer = context.window.Game3D.create(canvas);
assert.ok(renderer, 'WebGL renderer did not initialize');

const levels = [1, 2, 4, 5, 6, 20, 100, 250];
const stats = [];
for (const level of levels) {
  const layout = context.courseLayout(level);
  const eye = { x: layout.start.x - 3, y: 2.35, z: layout.start.z };
  const target = { x: layout.start.x + 5, y: .35, z: layout.start.z };
  const dx = target.x - eye.x, dy = target.y - eye.y;
  const len = Math.hypot(dx, dy);
  const camera = { eye, target,
    forward: { x: dx / len, y: dy / len, z: 0 },
    right: { x: 0, y: 0, z: 1 },
    up: { x: -dy / len, y: dx / len, z: 0 } };
  const state = { layout, camera, ball: { ...layout.start },
    progress: { equipped: level === 250 ? 'club-t1000-c' : 'rookie',
      equippedBall: level === 250 ? 'ball-t1000-b' : 'classic' },
    featureTime: 2, stage: { time: 2000 }, phase: 'ready', shot: null,
    movingFeature(feature, time) {
      if (!feature.move) return feature;
      const a = layout.centerline(Math.max(0, feature.t - .002));
      const b = layout.centerline(Math.min(1, feature.t + .002));
      const d = Math.hypot(b.x - a.x, b.z - a.z) || 1;
      const offset = Math.sin(time * feature.rate + feature.phase) * feature.move;
      return { ...feature, x: feature.x - (b.z - a.z) / d * offset,
        z: feature.z + (b.x - a.x) / d * offset };
    } };
  const uploadStart = uploads.length, drawStart = draws.length;
  renderer.render(state);
  const sceneUploads = uploads.slice(uploadStart);
  const sceneDraws = draws.slice(drawStart);
  assert.equal(sceneUploads.length, 2, `hole ${level}: static and dynamic uploads`);
  assert.equal(sceneDraws.length, 2, `hole ${level}: two depth-tested draws`);
  assert.deepEqual(sceneUploads.map(item => item.count), sceneDraws,
    `hole ${level}: draw count disagrees with uploaded mesh`);
  assert.ok(sceneUploads[0].count > 500, `hole ${level}: missing terrain`);
  assert.ok(sceneUploads[1].count > 500, `hole ${level}: missing ball/club`);
  stats.push({ level, staticVertices: sceneUploads[0].count,
    dynamicVertices: sceneUploads[1].count });

  // The course mesh remains cached, while a moving bumper, ball, and open
  // backstop can update during the same shot.
  state.phase = 'running'; state.featureTime = 5;
  state.stage.time = 5000;
  state.shot = { start: 1000, elapsed: 4, backstopFlapAt: 3.8,
    mole: { active: true, x: layout.start.x + 1, z: layout.start.z } };
  state.ball = { x: layout.start.x + 1, y: .7, z: layout.start.z };
  const nextStart = uploads.length;
  renderer.render(state);
  assert.equal(uploads.length - nextStart, 1, `hole ${level}: static mesh rebuilt during shot`);
  assert.ok(uploads.at(-1).count > 500, `hole ${level}: dynamic shot mesh empty`);
}

renderer.destroy();
console.log(`3D geometry OK: ${stats.map(s => `${s.level}:${s.staticVertices}/${s.dynamicVertices}`).join(' ')}`);
