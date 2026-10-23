'use strict';

// Contact checks at the places where the opt-in 3D course changes grade.
// These call the actual game physics in a headless host, without a browser.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const elements = new Map();
const gradient = { addColorStop() {} };
const ctx = new Proxy({
  createLinearGradient() { return gradient; },
  createRadialGradient() { return gradient; },
  measureText(value) { return { width: String(value).length * 7 }; }
}, { get(target, key) { return key in target ? target[key] : () => {}; } });
function element(id) {
  if (!elements.has(id)) elements.set(id, {
    id, textContent: '', hidden: false, style: { setProperty() {} },
    classList: { add() {}, remove() {}, toggle() {} },
    addEventListener() {}, appendChild() {}, setPointerCapture() {},
    getBoundingClientRect() { return { width: 1280, height: 720, left: 0, top: 0 }; },
    getContext() { return ctx; }
  });
  return elements.get(id);
}
const document = {
  getElementById: element,
  querySelector() { return element('game-shell'); },
  createElement(tag) { return element(`created-${tag}`); },
  body: element('body')
};
const storage = new Map();
const window = {
  devicePixelRatio: 1, location: { search: '' },
  addEventListener() {}
};
const context = vm.createContext({
  document, window, localStorage: {
    getItem(key) { return storage.get(key) ?? null; },
    setItem(key, value) { storage.set(key, String(value)); }
  },
  performance: { now: () => 1000 }, requestAnimationFrame() {},
  setTimeout() { return 1; }, clearTimeout() {}, console, Math
});
for (const file of ['gear-progression.js', 'ball-upgrades.js', 'course-blueprints.js', 'game.js']) {
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
}

const result = vm.runInContext(`(() => {
  const samples = [];
  const close = (actual, expected, label, tolerance=.012) => {
    if(Math.abs(actual-expected)>tolerance)throw Error(label+': '+actual+' vs '+expected);
  };
  const worldAt = (f,along,across) => {
    const d=pathTangent(f.t),n={x:-d.z,z:d.x};
    return{x:f.x+d.x*along+n.x*across,z:f.z+d.z*along+n.z*across};
  };
  for(const level of [5,22,50,250]){
    setLayout(level);courseState={level,completed:false};
    const river=layout.river,bridge=layout.features.find(f=>f.kind==='bridge');
    if(!river||!bridge)throw Error('river/bridge missing at hole '+level);
    phase='ready';ball={...START};shot=null;updateCamera(1000);
    startShot(60,{x:160,y:0});
    for(const across of [-1.5,1.5]){
      const p=worldAt(river,riverCenter(across),across),grade=layout.heightAt(p.x,p.z);
      const surface=courseSurfaceAt(p.x,p.z,grade+BALL_RADIUS);
      close(surface,grade-.10,'water support hole '+level);
      ball={x:p.x,y:surface+BALL_RADIUS,z:p.z};
      shot.velocity.x=0;shot.velocity.z=0;shot.velocity.y=0;
      if(!riverContact(1/120)||Math.hypot(shot.velocity.x,shot.velocity.z)<.007)
        throw Error('river current absent at hole '+level);
      const out=worldAt(river,riverCenter(across)+.9,across);
      const dry=courseSurfaceAt(out.x,out.z,layout.heightAt(out.x,out.z)+BALL_RADIUS);
      close(dry,layout.heightAt(out.x,out.z),'dry exit support hole '+level);
      ball={x:out.x,y:dry+BALL_RADIUS,z:out.z};
      if(riverContact(1/120))throw Error('river current outside channel at hole '+level);
    }
    for(const along of [-1.36,-1.08,0,1.08,1.36]){
      const p=worldAt(bridge,along,0),grade=layout.heightAt(p.x,p.z);
      const ramp=Math.max(0,Math.min(1,(1.36-Math.abs(along))/.28));
      const expected=grade+.18*smooth(ramp);
      close(bridgeDeckHeight(bridge,p.x,p.z),expected,'bridge deck hole '+level);
      close(courseSurfaceAt(p.x,p.z,expected+BALL_RADIUS),expected,'bridge support hole '+level);
    }
    samples.push({level,water:'contact + exit',bridge:'ramp + deck'});
  }
  // The physical cup surround should descend locally with the visible bowl,
  // then meet the surrounding course again at the outer contour.
  setLayout(5);courseState={level:5,completed:false};
  const cupGround=layout.heightAt(CUP.x,CUP.z);
  const center=courseSurfaceAt(CUP.x,CUP.z,cupGround+BALL_RADIUS);
  const rim=courseSurfaceAt(CUP.x-3.3,CUP.z,layout.heightAt(CUP.x-3.3,CUP.z)+BALL_RADIUS);
  close(center,cupGround-.12,'cup depression');
  close(rim,layout.heightAt(CUP.x-3.3,CUP.z),'outer contour support');
  phase='ready';ball={...START};shot=null;updateCamera(1000);
  startShot(60,{x:160,y:0});
  const dir=pathTangent(1),p={x:CUP.x-dir.x*1.25,z:CUP.z-dir.z*1.25};
  ball={x:p.x,y:courseSurfaceAt(p.x,p.z,layout.heightAt(p.x,p.z)+BALL_RADIUS)+BALL_RADIUS,z:p.z};
  shot.velocity.x=dir.x*1.5;shot.velocity.z=dir.z*1.5;shot.velocity.y=0;
  let steps=0;for(;steps<120*20&&phase==='running';steps++)stepPhysics(1/120);
  if(phase!=='complete')throw Error('near-cup approach did not sink');
  return{samples,cupDepth:cupGround-center,cupSeconds:steps/120};
})()`, context);

assert.equal(result.samples.length, 4);
console.log(`3D physics contact OK: 4 rivers/bridges; cup depth ${result.cupDepth.toFixed(2)}, sink ${result.cupSeconds.toFixed(2)}s`);

const feel = vm.runInContext(`(() => {
  let widest=0;
  for(const level of [4,5,100,250]){
    setLayout(level);
    for(let t=.15;t<.90;t+=.025){
      const c=layout.pathPoint(t,0),center=layout.heightAt(c.x,c.z);
      for(const side of [-1,1]){
        const p=layout.pathPoint(t,side*1.7);
        widest=Math.max(widest,Math.abs(center-layout.heightAt(p.x,p.z)));
      }
    }
  }
  function launch(power){
    setLayout(1);courseState={level:1,completed:false};
    phase='ready';ball={...START};shot=null;updateCamera(1000);
    startShot(power,{x:160,y:0});
    const initial=Math.hypot(shot.velocity.x,shot.velocity.z),origin={...ball};
    for(let i=0;i<24;i++)stepPhysics(1/120);
    return{initial,earlyTravel:Math.hypot(ball.x-origin.x,ball.z-origin.z)};
  }
  return{widest,half:launch(50),full:launch(100)};
})()`, context);
assert.ok(feel.widest < .08, `fairway still has a steep side crown: ${feel.widest}`);
assert.ok(feel.full.initial / feel.half.initial > 2.1, 'full pull does not feel faster at launch');
assert.ok(feel.full.earlyTravel / feel.half.earlyTravel > 1.8,
  'full pull does not cover more ground before course effects');
console.log(`3D feel OK: max lateral height difference ${feel.widest.toFixed(3)}, ` +
  `100%/50% speed ${(feel.full.initial / feel.half.initial).toFixed(2)}×, ` +
  `early travel ${(feel.full.earlyTravel / feel.half.earlyTravel).toFixed(2)}×`);
