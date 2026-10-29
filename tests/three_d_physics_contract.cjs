'use strict';

// Contact checks at the places where the 3D course changes grade.
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
  let widest=0,moundClearance=Infinity;
  for(const level of [4,5,100,250]){
    setLayout(level);
    for(const mound of layout.terrainMounds)moundClearance=Math.min(moundClearance,mound.clearance/mound.along);
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
  return{widest,moundClearance,half:launch(50),full:launch(100)};
})()`, context);
assert.ok(feel.widest > .12 && feel.widest < .42,
  `fairway undulation is missing or too steep: ${feel.widest}`);
assert.ok(feel.moundClearance>=1.6,'terrain bump overlaps a course element or water');
assert.ok(feel.full.initial / feel.half.initial > 2.1, 'full pull does not feel faster at launch');
assert.ok(feel.full.earlyTravel / feel.half.earlyTravel > 1.8,
  'full pull does not cover more ground before course effects');

const bankRecovery = vm.runInContext(`(() => {
  setLayout(4);courseState={level:4,completed:false};
  phase='ready';ball={...START};shot=null;updateCamera(1000);startShot(60,{x:160,y:0});
  const t=.5,width=layout.corridorHalfWidth(t),p=layout.pathPoint(t,width+.42),lane=nearestPath(p.x,p.z);
  ball={x:p.x,y:courseSurfaceAt(p.x,p.z,layout.heightAt(p.x,p.z)+BALL_RADIUS)+BALL_RADIUS,z:p.z};
  shot.velocity={x:0,y:0,z:0};shot.elapsed=0;shot.lastGust=0;shot.lastMole=0;
  stepPhysics(1/120);
  const outward=shot.velocity.x*lane.normal.x+shot.velocity.z*lane.normal.z;
  return{outward};
})()`, context);
assert.ok(bankRecovery.outward<0,'raised outer bank did not roll the ball back toward the green');
console.log(`Terrain response OK: rolling fairway grades; outer bank returns the ball inward (${bankRecovery.outward.toFixed(2)})`);
console.log(`3D feel OK: max lateral height difference ${feel.widest.toFixed(3)}, ` +
  `100%/50% speed ${(feel.full.initial / feel.half.initial).toFixed(2)}×, ` +
  `early travel ${(feel.full.earlyTravel / feel.half.earlyTravel).toFixed(2)}×`);

const ballLaunch = vm.runInContext(`(() => {
  function measure(id){
    setLayout(1);courseState={level:1,completed:false};
    phase='ready';ball={...START};shot=null;updateCamera(1000);
    savedProgress.equipped='rookie';savedProgress.equippedBall=id;
    startShot(100,{x:160,y:0});
    const speed=Math.hypot(shot.velocity.x,shot.velocity.z),origin={...ball};
    for(let i=0;i<24;i++)stepPhysics(1/120);
    return{speed,travel:Math.hypot(ball.x-origin.x,ball.z-origin.z)};
  }
  return{classic:measure('classic'),upgrades:['sunburst','tidal','spark'].map(measure)};
})()`, context);
for(const upgrade of ballLaunch.upgrades){
  assert.ok(upgrade.speed / ballLaunch.classic.speed > 1.15,
    'first-tier ball does not clearly improve full-power launch speed');
  assert.ok(upgrade.travel / ballLaunch.classic.travel > 1.1,
    'first-tier ball does not cover more ground early in the shot');
}
console.log(`Starter ball pace OK: first-tier launch is at least ${(Math.min(...ballLaunch.upgrades.map(x=>x.speed)) / ballLaunch.classic.speed).toFixed(2)}× Classic White`);

const coursePace = vm.runInContext(`(() => {
  function trace(level,id){
    setLayout(level);courseState={level,completed:false};
    phase='ready';ball={...START};shot=null;updateCamera(1000);
    savedProgress.equipped='rookie';savedProgress.equippedBall=id;
    startShot(100,{x:160,y:0});
    let steps=0;
    for(;steps<120*60&&phase==='running';steps++)stepPhysics(1/120);
    if(phase!=='complete')throw Error(id+' failed to finish hole '+level);
    return steps/120;
  }
  const samples=[10,20,50,100,150,200,250].map(level=>({level,
    classic:trace(level,'classic'),upgraded:trace(level,'spark')}));
  return samples;
})()`, context);
const classicSeconds = coursePace.reduce((total, sample) => total + sample.classic, 0);
const upgradedSeconds = coursePace.reduce((total, sample) => total + sample.upgraded, 0);
console.log('Ball course pace: '+coursePace.map(x=>`${x.level}:${x.classic.toFixed(1)}/${x.upgraded.toFixed(1)}s`).join(' '));
assert.ok(classicSeconds / upgradedSeconds > 1.18,
  'Classic White does not feel meaningfully slower across later courses');

const cannons = vm.runInContext(`(() => {
  let count=0,largestOffset=0,largestLevel=0,largestTurn=0;
  for(let level=1;level<=250;level++){
    setLayout(level);courseState={level,completed:false};
    for(const feature of layout.features.filter(f=>f.kind==='cannon')){
      phase='ready';ball={...START};shot=null;updateCamera(1000);
      startShot(60,{x:160,y:0});
      ball={x:feature.x,y:layout.heightAt(feature.x,feature.z)+BALL_RADIUS,z:feature.z};
      shot.velocity={x:4,z:0,y:0};
      contactCannon(feature);
      if(!shot.cannon)throw Error('cannon failed to load at hole '+level);
      const initial=shot.cannon.currentDir;
      for(let i=0;i<110&&shot?.cannon?.stage!=='fired';i++)stepPhysics(1/120);
      if(shot?.cannon?.stage!=='fired')throw Error('cannon failed to fire at hole '+level);
      const aimed=shot.cannon.currentDir;
      largestTurn=Math.max(largestTurn,Math.abs(Math.atan2(initial.x*aimed.z-initial.z*aimed.x,initial.x*aimed.x+initial.z*aimed.z)));
      for(let i=0;i<110&&phase==='running';i++){
        stepPhysics(1/120);
        const lane=nearestPath(ball.x,ball.z),offset=Math.abs(lane.across)-layout.corridorHalfWidth(lane.t);
        if(offset>largestOffset){largestOffset=offset;largestLevel=level;}
      }
      count++;
    }
  }
  return{count,largestOffset,largestLevel,largestTurn};
})()`, context);
assert.ok(cannons.count > 100, 'too few cannon samples');
assert.ok(cannons.largestTurn > .2, 'cannon barrel did not visibly turn');
assert.ok(cannons.largestOffset < .5,
  `cannon launched outside fairway at hole ${cannons.largestLevel}: ${cannons.largestOffset.toFixed(2)}`);
console.log(`Cannon aim OK: ${cannons.count} launches, largest lane overshoot ${cannons.largestOffset.toFixed(2)}`);

const tunnel = vm.runInContext(`(() => {
  setLayout(4);courseState={level:4,completed:false};
  const feature=layout.features.find(f=>f.kind==='windmill');
  if(!feature)throw Error('windmill test course missing');
  const worldAt=(f,along,across)=>{
    const d=pathTangent(f.t),n={x:-d.z,z:d.x};
    return{x:f.x+d.x*along+n.x*across,z:f.z+d.z*along+n.z*across};
  };
  function enterAndExit(offset,height){
    phase='ready';ball={...START};shot=null;updateCamera(1000);
    startShot(60,{x:160,y:0});
    const dir=pathTangent(feature.t);
    shot.velocity={x:dir.x*3,y:0,z:dir.z*3};
    const base=layout.heightAt(feature.x,feature.z);
    let previous=worldAt(feature,-.68,offset);
    for(let along=-.66;along<=.68;along+=.02){
      const current=worldAt(feature,along,offset);
      ball={...current,y:base+height};
      windmillContact(feature,0,previous);
      previous=current;
    }
    return{bonus:shot.tunnelBonus,awards:shot.tunnelAwards.size,entry:shot.tunnelEntries.size,
      forward:shot.velocity.x*dir.x+shot.velocity.z*dir.z};
  }
  const pass=enterAndExit(0,BALL_RADIUS);
  const side=enterAndExit(.24,BALL_RADIUS);
  const over=enterAndExit(0,.9);
  return{pass,side,over};
})()`, context);
assert.equal(tunnel.pass.bonus,75,'complete tunnel pass missed its XP bonus');
assert.equal(tunnel.pass.awards,1,'tunnel award was not tracked once');
assert.equal(tunnel.side.bonus,0,'passing beside the tunnel earned XP');
assert.equal(tunnel.over.bonus,0,'passing above the tunnel earned XP');
assert.ok(tunnel.pass.forward>tunnel.side.forward+.5,'full tunnel pass missed its speed boost');
console.log('Windmill tunnel OK: full pass +75 XP and speed boost; side and aerial passes +0 XP');

const freshness = vm.runInContext(`(() => {
  function launch(level,club,ballId){
    setLayout(level);courseState={level,completed:false};
    savedProgress.equipped=club;savedProgress.equippedBall=ballId;
    phase='ready';ball={...START};shot=null;updateCamera(1000);
    startShot(75,{x:160,y:0});
    return{pace:gearFreshnessMultiplier(),speed:Math.hypot(shot.velocity.x,shot.velocity.z)};
  }
  return{early:launch(1,'rookie','classic'),late:launch(160,'rookie','classic'),
    refreshed:launch(160,'club-t20-a','ball-t20-a')};
})()`, context);
assert.equal(freshness.early.pace,1);
assert.ok(freshness.late.pace>=.94&&freshness.late.pace<1,'old gear should slow only a little');
assert.ok(freshness.late.speed<freshness.early.speed,'old gear did not lose launch pace');
assert.equal(freshness.refreshed.pace,1,'new gear should refresh launch pace');
console.log(`Gear freshness OK: old loadout ${Math.round(freshness.late.pace*100)}% pace by hole 160; current loadout 100%`);

const loopGate = vm.runInContext(`(() => {
  setLayout(4);courseState={level:4,completed:false};
  const loop=layout.features.find(feature=>feature.kind==='loop');
  const dir=pathTangent(loop.t),ground=layout.heightAt(loop.x,loop.z);
  function pass(across,height){
    phase='ready';ball={...START};shot=null;updateCamera(1000);
    startShot(60,{x:160,y:0});
    ball={x:loop.x+dir.x*.03-dir.z*across,y:ground+height,z:loop.z+dir.z*.03+dir.x*across};
    shot.velocity={x:dir.x*3,y:0,z:dir.z*3};
    contactLoop(loop);
    return{boosted:shot.usedBoosts.has(loop.id),speed:Math.hypot(shot.velocity.x,shot.velocity.z)};
  }
  return{center:pass(0,1.1),outside:pass(.74,1.1)};
})()`, context);
assert.equal(loopGate.center.boosted,true,'a clean pass through the loop opening missed its boost');
assert.equal(loopGate.outside.boosted,false,'a ball outside the loop opening received a boost');
assert.ok(loopGate.center.speed>loopGate.outside.speed,'loop gate did not increase speed');
console.log('Loop gate OK: clear passage through the ring opening receives a speed boost');

const playableTunnel = vm.runInContext(`(() => {
  for(const level of [4,6]){
    setLayout(level);courseState={level,completed:false};
    const feature=layout.features.find(f=>f.kind==='windmill');
    const heading=Math.atan2(feature.z-START.z,feature.x-START.x);
    for(const power of [35,50,65,80,100])for(let offset=-.4;offset<=.4001;offset+=.04){
      phase='ready';ball={...START};shot=null;updateCamera(1000);
      savedProgress.equipped='rookie';savedProgress.equippedBall='classic';
      startShot(power,{x:160,y:0});
      const speed=Math.hypot(shot.velocity.x,shot.velocity.z),angle=heading+offset;
      shot.velocity.x=speed*Math.cos(angle);shot.velocity.z=speed*Math.sin(angle);
      for(let i=0;i<120*18&&phase==='running'&&!shot.tunnelBonus;i++)stepPhysics(1/120);
      if(shot?.tunnelBonus)return{level,power,offset,bonus:shot.tunnelBonus};
    }
  }
  return null;
})()`, context);
assert.ok(playableTunnel,'no player-like tee shot reached a windmill tunnel');
console.log(`Playable tunnel route OK: hole ${playableTunnel.level}, power ${playableTunnel.power}%, aim offset ${playableTunnel.offset.toFixed(2)} rad`);

const cameraAndMole = vm.runInContext(`(() => {
  setLayout(1);courseState={level:1,completed:false};
  phase='ready';ball={...START};shot=null;updateCamera(1000);
  startShot(75,{x:160,y:0});
  for(let i=0;i<120&&phase==='running';i++)stepPhysics(1/120);
  const earlyMole=!!shot?.mole?.active&&!shot.mole.hidden;
  const p=layout.pathPoint(.4,0);
  ball={x:p.x,y:layout.heightAt(p.x,p.z)+BALL_RADIUS,z:p.z};
  shot.elapsed=1.5;updateCamera(1000);
  const original={...camera.eye};
  cameraOrbit.yaw=.55;cameraOrbit.pitch=.2;updateCamera(1000);
  const changed={...camera.eye};
  updateCamera(1000);
  const kept={...camera.eye};
  cameraOrbit.zoom=1.35;updateCamera(1000);
  const zoomed={...camera.eye};
  const d=pathTangent(.4);
  shot.elapsed=5;shot.velocity={x:d.x*3,y:0,z:d.z*3};
  shot.lastGust=5;shot.gustAt=null;shot.lastMole=-10;shot.mole=null;
  for(let i=0;i<35&&phase==='running';i++)stepPhysics(1/120);
  const lateMole=!!shot?.mole?.active&&!shot.mole.hidden;
  ball={x:p.x,y:layout.heightAt(p.x,p.z)+BALL_RADIUS,z:p.z};
  shot.elapsed=1.5;
  shot.velocity={x:-d.x*3,y:0,z:-d.z*3};
  shot.lastGust=shot.elapsed;shot.gustAt=null;shot.lastMole=-10;shot.mole=null;
  for(let i=0;i<55&&phase==='running';i++)stepPhysics(1/120);
  const riskyRescue=shot?.lastMole>1.5;
  return{earlyMole,lateMole,shift:Math.hypot(original.x-changed.x,original.y-changed.y,original.z-changed.z),
    drift:Math.hypot(changed.x-kept.x,changed.y-kept.y,changed.z-kept.z),
    zoomShift:Math.hypot(zoomed.x-kept.x,zoomed.y-kept.y,zoomed.z-kept.z),riskyRescue};
})()`, context);
assert.equal(cameraAndMole.earlyMole,false,'mole appeared during a normal opening run');
assert.equal(cameraAndMole.lateMole,false,'mole appeared solely because a healthy shot ran long');
assert.ok(cameraAndMole.shift>.5,'camera drag angle did not change the view');
assert.ok(cameraAndMole.drift<1e-9,'camera angle did not remain selected');
assert.ok(cameraAndMole.zoomShift>.5,'camera zoom did not change the view');
assert.ok(cameraAndMole.riskyRescue,'sustained wrong-way travel did not trigger a rescue');
console.log('Camera orbit and mole timing OK: perspective persists, normal route clear, wrong-way rescue activates');

const preview = vm.runInContext(`(() => {
  setLayout(6);courseState={level:6,completed:false};phase='ready';shot=null;ball={...START};
  updateCamera(1000);const original={...camera.eye};
  setPreview(true);updateCamera(1000);const opening={...camera.eye};
  const moved=Math.hypot(opening.x-original.x,opening.y-original.y,opening.z-original.z);
  previewCamera.focusT=.8;updateCamera(1000);
  const traveled=Math.hypot(camera.eye.x-opening.x,camera.eye.y-opening.y,camera.eye.z-opening.z);
  setPreview(false);updateCamera(1000);
  return{moved,traveled,returned:Math.hypot(camera.eye.x-original.x,camera.eye.y-original.y,camera.eye.z-original.z),phase};
})()`, context);
assert.ok(preview.moved>1,'View Course did not change the camera');
assert.ok(preview.traveled>1,'preview controls did not move along the hole');
assert.ok(preview.returned<1e-9,'preview did not return to the tee camera');
assert.equal(preview.phase,'ready','preview started a shot');
console.log('Course preview OK: opens, moves along the hole, and returns without swinging');

const molePlacement = vm.runInContext(`(() => {
  setLayout(1);courseState={level:1,completed:false};phase='ready';ball={...START};shot=null;updateCamera(1000);
  startShot(60,{x:160,y:0});
  const p=layout.pathPoint(.45,0),dir=pathTangent(.45);
  ball={x:p.x,y:layout.heightAt(p.x,p.z)+BALL_RADIUS,z:p.z};
  shot.elapsed=2;shot.velocity={x:-dir.x*3,y:0,z:-dir.z*3};
  if(!spawnMole())throw Error('valid in-lane mole did not spawn');
  const m=shot.mole,lane=nearestPath(m.x,m.z),width=layout.corridorHalfWidth(lane.t);
  const initialStay=m.visualUntil-shot.elapsed;
  shot.elapsed+=.1;ball={x:m.x,y:layout.heightAt(m.x,m.z)+BALL_RADIUS,z:m.z};
  shot.velocity={x:-m.normalX*3,y:0,z:-m.normalZ*3};moleContact();
  const afterHitStay=m.visualUntil-shot.elapsed;
  setLayout(4);courseState={level:4,completed:false};phase='ready';ball={...START};shot=null;updateCamera(1000);
  startShot(60,{x:160,y:0});
  const f=layout.features.find(item=>item.kind==='windmill'),heading=pathTangent(f.t);
  ball={x:f.x-heading.x*.3,y:layout.heightAt(f.x,f.z)+BALL_RADIUS,z:f.z-heading.z*.3};
  shot.elapsed=2;shot.velocity={x:heading.x*3,y:0,z:heading.z*3};
  const nearFeatureSpawned=spawnMole();
  const nearFeatureVisible=!!shot.mole&&!shot.mole.hidden;
  setLayout(1);courseState={level:1,completed:false};phase='ready';ball={...START};shot=null;updateCamera(1000);
  startShot(60,{x:160,y:0});
  const t=.45,edge=layout.corridorHalfWidth(t),nearRail=layout.pathPoint(t,edge-.05),forward=pathTangent(t);
  ball={x:nearRail.x,y:layout.heightAt(nearRail.x,nearRail.z)+BALL_RADIUS,z:nearRail.z};
  shot.elapsed=2;shot.velocity={x:forward.x*3,y:0,z:forward.z*3};
  spawnMole();const nearWallVisible=!!shot.mole&&!shot.mole.hidden;
  return{railMargin:width-Math.abs(lane.across),initialStay,afterHitStay,
    nearFeatureSpawned,nearFeatureVisible,nearWallVisible};
})()`, context);
assert.ok(molePlacement.railMargin>=.65,'mole was too close to the course wall');
assert.ok(molePlacement.initialStay>=2,'mole did not remain visible longer before contact');
assert.ok(molePlacement.afterHitStay>=1.2,'mole disappeared too quickly after contact');
assert.equal(molePlacement.nearFeatureSpawned,false,'mole appeared beside another obstacle');
assert.equal(molePlacement.nearFeatureVisible,false,'mole was visible beside another obstacle');
assert.equal(molePlacement.nearWallVisible,false,'mole was visible beside a course wall');
console.log('Mole placement OK: clear of walls and obstacles, longer visible window');
