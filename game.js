const PROGRESS_KEY = 'hole-in-one-progress-v1';
const COURSE_KEY = 'hole-in-one-course-v1';
const START = { x: -4.15, y: .23, z: 2.65 };
const CUP = { x: 4.03, y: .04, z: -2.35 };
const BALL_RADIUS = .19;
// All scenery and contacts use the same seeded, world-space course.  A hole's
// number is its seed, so returning to that hole reproduces its exact layout.
function courseLayout(level) {
  const blueprint=window.CourseBlueprints?.get(level);
  if(!blueprint)throw new Error('Course blueprint catalog is unavailable');
  const theme=Math.min(7,Math.max(1,level));
  const span=blueprint.span;
  const start={x:-4.15,y:.23,z:2.65};
  const cup={x:start.x+span,y:.04,z:blueprint.cupZ};
  const route=blueprint.route;
  const hillAt=t=>{
    if(!blueprint.hills.length)return 0;
    const envelope=Math.sin(Math.PI*t)**2;
    return envelope*blueprint.hills.reduce((sum,[center,width,height])=>
      sum+height*Math.exp(-(((t-center)/width)**2)),0);
  };
  const centerline=t=>{
    t=Math.max(0,Math.min(1,t));
    const u=1-t;
    const cubic=u*u*u*start.z+3*u*u*t*route.c1+3*u*t*t*route.c2+t*t*t*cup.z;
    const bends=route.bends.reduce((sum,[center,width,amplitude])=>
      sum+amplitude*Math.exp(-(((t-center)/width)**2)),0);
    return{x:start.x+span*t,y:.04+hillAt(t),
      z:cubic+Math.sin(Math.PI*t)**2*bends};
  };
  const pathPoint=(t,across=0)=>{
    const p=centerline(t),a=centerline(Math.max(0,t-.002)),b=centerline(Math.min(1,t+.002));
    const dx=b.x-a.x,dz=b.z-a.z,n=Math.hypot(dx,dz)||1;
    return{x:p.x-dz/n*across,y:p.y,z:p.z+dx/n*across};
  };
  const corridorHalfWidth=t=>2.1+.9*Math.exp(-Math.max(0,t)*18);
  const railHeightAt=t=>{
    const a=Math.max(0,Math.min(1,(t-.10)/.05));
    const b=Math.max(0,Math.min(1,(.97-t)/.05));
    const q=Math.min(a,b);return .16+.39*q*q*(3-2*q);
  };
  const bankHeightAt=(x,z)=>{
    const t=(x-start.x)/span;if(t<0||t>1.08)return 0;
    const pathT=Math.max(0,Math.min(1,t));
    const p=centerline(pathT),a=centerline(Math.max(0,pathT-.003)),b=centerline(Math.min(1,pathT+.003));
    const dx=b.x-a.x,dz=b.z-a.z,n=Math.hypot(dx,dz)||1;
    const across=Math.abs((x-p.x)*(-dz/n)+(z-p.z)*(dx/n));
    const width=corridorHalfWidth(t);
    // The playable lane stays broad and nearly level across its width. The
    // soft earth bank rises behind the timber rail, not beneath the ball.
    const q=Math.max(0,Math.min(1,(across-width+.03)/.9));
    const outerQ=Math.max(0,Math.min(1,(across-width-.6)/.9));
    const outerFade=1-outerQ*outerQ*(3-2*outerQ);
    const teeFade=Math.max(0,Math.min(1,t/.055));
    const endFade=Math.max(0,Math.min(1,(1.08-t)/.08));
    return .42*q*q*(3-2*q)*outerFade*teeFade*endFade;
  };
  const heightAt=(x,z)=>{
    const t=Math.max(0,Math.min(1,(x-start.x)/span)),p=centerline(t);
    const across=Math.hypot(x-p.x,z-p.z);
    const rail=corridorHalfWidth(t),outside=Math.max(0,Math.min(1,(across-rail)/1.5));
    const hillFade=1-outside*outside*(3-2*outside);
    return .04+(p.y-.04)*hillFade+bankHeightAt(x,z);
  };
  const features=blueprint.features.map((spec,index)=>{
    const p=pathPoint(spec.t,spec.across);
    return{id:`${spec.kind}-${index}`,kind:spec.kind,t:spec.t,across:spec.across,
      x:p.x,z:p.z,y:p.y,phase:spec.phase,move:spec.move,rate:spec.rate};
  });
  const trees=[.08,.22,.42,.59,.76,.93].map((t,i)=>{
    const p=pathPoint(t,(i%2?1:-1)*(corridorHalfWidth(t)+1.05+(i%3)*.17));
    return{x:p.x,z:p.z,scale:.58+(i%3)*.12};
  });
  const river=blueprint.riverT===null?null:(()=>{
    const p=pathPoint(blueprint.riverT);
    return{x:p.x,z:p.z,t:blueprint.riverT,halfWidth:.59,span:3.2};
  })();
  const samples=Array.from({length:65},(_,i)=>centerline(i/64));
  const bounds={minX:start.x-1.65,maxX:cup.x+1.65,
    minZ:Math.min(...samples.map(p=>p.z))-4.15,maxZ:Math.max(...samples.map(p=>p.z))+4.15};
  return{level,theme,title:blueprint.title,subtitle:blueprint.subtitle,start,cup,span,bounds,
    centerline,pathPoint,corridorHalfWidth,railHeightAt,bankHeightAt,heightAt,features,trees,river};
}
const clubNames = { rookie: 'The Rookie', meteor: 'The Comet', cloud: 'Cloud Nine', lightning: 'The Spark', orbit: 'Orbit Driver', lotus: 'Lotus Launcher', volt: 'Volt Viper', nebula: 'The Nebula', rocket: 'Rocket Club', aurora: 'Aurora Ace', wildfire: 'Wildfire', starlift: 'Starlift', ripple: 'Ripple Maker', thunderhead: 'Thunderhead', sunforge: 'Sunforge', mirage: 'Mirage Maker', supernova: 'Supernova', skycrown: 'Skycrown', kaleido: 'Kaleido King' };
const clubColors = { rookie: '#be8057', meteor: '#bf5a2c', cloud: '#71b6bd', lightning: '#9d70b6', orbit: '#7caa81', lotus: '#ca7499', volt: '#a7a247', nebula: '#686cb2', rocket: '#d46642', aurora: '#5ba997', wildfire: '#ed8242', starlift: '#7f9be6', ripple: '#51b9ba', thunderhead: '#a277d2', sunforge: '#efb655', mirage: '#d67ead', supernova: '#e57f58', skycrown: '#76b6df', kaleido: '#b68cdb' };
const courseNames = ['The First Green', 'The Friendly Bumper', 'Little Launch', 'The Sky Loop', 'Driftwood River', 'Cannonball Corner', 'The Grand Detour'];
const courseSubtitles = ['One little green. One perfectly impossible shot.', 'A gentle nudge in exactly the right direction.', 'The sky is just another shortcut.', 'Round and round, then straight to glory.', 'The current has excellent aim.', 'Some shots call for a cannon.', 'Every shortcut in the world, all at once.'];
const scene = document.getElementById('scene');
const gameShell = document.querySelector('.game-shell');
const ctx = scene.getContext('2d');
let renderer3D = null;
const $ = (id) => document.getElementById(id);
const stage = { width: 0, height: 0, dpr: 1, time: 0, featureTime: 0 };
let savedProgress = readProgress();
let courseState = readCourse();
let layout = courseLayout(courseState.level);
Object.assign(START,layout.start);
Object.assign(CUP,layout.cup);
let dragging = false;
let activePointerId = null;
let dragOrigin = null;
let dragNow = null;
let power = 0;
let phase = courseState.completed ? 'complete' : 'ready';
let shot = null;
let ball = { ...START };
let trail = [];
let sparkles = [];
let calloutTimer;
let animatedAt = performance.now();

function readProgress() {
  const fallback = { xp: 0, holeCount: 0, equipped: 'rookie', claimed: [], owned: ['rookie'], equippedBall: 'classic', ownedBalls: ['classic'], claimedBallTiers: [] };
  try {
    const data = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    if (data && Number.isFinite(data.xp) && Number.isInteger(data.holeCount)) {
      const merged={ ...fallback, ...data };
      return window.BallUpgrades?.normalize ? window.BallUpgrades.normalize(merged) : merged;
    }
  } catch (_) { /* Storage may be unavailable; the game remains playable. */ }
  return fallback;
}
function readCourse() {
  try {
    const data = JSON.parse(localStorage.getItem(COURSE_KEY));
    if (data && Number.isInteger(data.level) && data.level > 0) return { level: data.level, completed: !!data.completed };
  } catch (_) { /* Use the first course. */ }
  return { level: 1, completed: false };
}
function save(key, data) { try { localStorage.setItem(key, JSON.stringify(data)); } catch (_) {} }
function themeLevel() { return Math.min(courseState.level, 7); }
function shortName() { return layout.title; }
function shortSubtitle() { return layout.subtitle; }
function updateHud() {
  $('xp-total').textContent = Math.round(savedProgress.xp).toLocaleString();
  $('streak-count').textContent = savedProgress.holeCount.toLocaleString();
  $('club-name').textContent = clubNames[savedProgress.equipped] || generatedClub(savedProgress.equipped)?.name || clubNames.rookie;
  $('ball-name').textContent = window.BallUpgrades?.get(savedProgress.equippedBall).name || 'Classic White';
  $('hole-number').textContent = String(courseState.level).padStart(2, '0');
  $('course-name').textContent = shortName();
  $('course-subtitle').textContent = shortSubtitle();
  const chapter=courseState.level<=7?1:Math.floor((courseState.level-8)/10)+2;
  const chapterHole=courseState.level<=7?courseState.level:(courseState.level-8)%10+1;
  const chapterLength=courseState.level<=7?7:10;
  $('world-number').textContent = String(chapter).padStart(2, '0');
  $('hole-progress-text').textContent = `CHAPTER ${String(chapter).padStart(2, '0')} · HOLE ${String(chapterHole).padStart(2, '0')}`;
  $('hole-progress-fill').style.width = `${chapterHole / chapterLength * 100}%`;
  $('weather-name').textContent = courseState.level === 1 ? 'Calm & sunny' : courseState.level >= 5 ? 'Magic in the air' : 'A helpful breeze';
  $('weather-icon').textContent = courseState.level === 1 ? '☀' : '〰';
}
function resize() {
  const rect = scene.getBoundingClientRect();
  stage.width = rect.width;
  stage.height = rect.height;
  const pixelBudget=7_000_000;
  stage.dpr = Math.max(1,Math.min(window.devicePixelRatio || 1,3,
    Math.sqrt(pixelBudget/Math.max(1,rect.width*rect.height))));
  scene.width = Math.round(rect.width * stage.dpr);
  scene.height = Math.round(rect.height * stage.dpr);
  ctx.setTransform(stage.dpr, 0, 0, stage.dpr, 0, 0);
  ctx.imageSmoothingEnabled=true;
  ctx.imageSmoothingQuality='high';
  renderer3D?.resize();
}
window.addEventListener('resize', resize);
resize();
if(/(?:^|[?&])render=3d(?:&|$)/.test(window.location?.search||'')&&window.Game3D?.create){
  try{
    renderer3D=window.Game3D.create(document.getElementById('scene-3d'));
    renderer3D.resize();
    gameShell.classList.add('render-3d');
    const toggle=$('render-toggle');
    if(toggle){toggle.href='./game.html';toggle.textContent='CLASSIC VIEW ↗';}
  }catch(error){console.warn('3D course unavailable; using classic view.',error);renderer3D=null;}
}
updateHud();
window.addEventListener('pageshow',()=>{savedProgress=readProgress();updateHud();});
if (courseState.completed) showCelebration(false);

// A low camera sits just behind the ball, then eases forward to follow its flight.
const courseVector = { x: CUP.x - START.x, z: CUP.z - START.z };
let courseLength = Math.hypot(courseVector.x, courseVector.z);
const courseForward = { x: courseVector.x / courseLength, z: courseVector.z / courseLength };
function setLayout(level){
  layout=courseLayout(level);Object.assign(START,layout.start);Object.assign(CUP,layout.cup);
  courseVector.x=CUP.x-START.x;courseVector.z=CUP.z-START.z;
  courseLength=Math.hypot(courseVector.x,courseVector.z);
  courseForward.x=courseVector.x/courseLength;courseForward.z=courseVector.z/courseLength;
}
function movingFeature(feature,timeSeconds){
  if(!feature.move)return feature;
  const a=layout.centerline(Math.max(0,feature.t-.002)),b=layout.centerline(Math.min(1,feature.t+.002));
  const dx=b.x-a.x,dz=b.z-a.z,n=Math.hypot(dx,dz)||1;
  const offset=Math.sin(timeSeconds*feature.rate+feature.phase)*feature.move;
  return{...feature,x:feature.x-dz/n*offset,z:feature.z+dx/n*offset};
}
const camera = { eye: null, target: null, forward: null, right: null, up: null };
function normalize3(v) { const n = Math.hypot(v.x, v.y, v.z) || 1; return { x: v.x/n, y: v.y/n, z: v.z/n }; }
function cross(a,b) { return { x:a.y*b.z-a.z*b.y, y:a.z*b.x-a.x*b.z, z:a.x*b.y-a.y*b.x }; }
function placeCamera(eye,target) {
  camera.eye=eye; camera.target=target;
  camera.forward=normalize3({x:target.x-eye.x,y:target.y-eye.y,z:target.z-eye.z});
  camera.right=normalize3(cross(camera.forward,{x:0,y:1,z:0}));
  camera.up=normalize3(cross(camera.right,camera.forward));
}
function updateCamera(now) {
  const teeTangent=pathTangent(0);
  // Narrow screens need the first bend and the distant cup in the same view.
  // Blend the local tee direction toward the hole; the ball still launches
  // from the player's chosen screen-space aim vector.
  const headingX=stage.width<650?(teeTangent.x+courseForward.x)*.5:teeTangent.x;
  const headingZ=stage.width<650?(teeTangent.z+courseForward.z)*.5:teeTangent.z;
  const headingLength=Math.hypot(headingX,headingZ)||1;
  const teeDirection={x:headingX/headingLength,z:headingZ/headingLength};
  const startEye={x:START.x-teeDirection.x*3,y:2.35,z:START.z-teeDirection.z*3};
  const startTarget={x:START.x+teeDirection.x*5,y:.35,z:START.z+teeDirection.z*5};
  if(phase!=='running'||!shot){placeCamera(startEye,startTarget);return;}
  const elapsed=shot.elapsed*1000;
  const follow=smooth(Math.max(0,Math.min(1,(elapsed-650)/950)));
  const tangent=pathTangent(Math.max(0,Math.min(1,(ball.x-START.x)/layout.span)));
  const movingEye={x:ball.x-tangent.x*3,y:2.35+ball.y*.35,z:ball.z-tangent.z*3};
  const movingTarget={x:ball.x+tangent.x*4.4,y:.35+ball.y*.25,z:ball.z+tangent.z*4.4};
  const cupDist=Math.hypot(CUP.x-ball.x,CUP.z-ball.z),endBlend=smooth(Math.max(0,Math.min(1,(6-cupDist)/4)));
  const focus={x:(ball.x+CUP.x)*.5,z:(ball.z+CUP.z)*.5};
  const finishEye={x:focus.x-courseForward.x*4.7,y:2.8+ball.y*.2,z:focus.z-courseForward.z*4.7};
  const finishTarget={x:focus.x+courseForward.x*1.15,y:.25,z:focus.z+courseForward.z*1.15};
  const trackedEye={x:mix(movingEye.x,finishEye.x,endBlend),y:mix(movingEye.y,finishEye.y,endBlend),z:mix(movingEye.z,finishEye.z,endBlend)};
  const trackedTarget={x:mix(movingTarget.x,finishTarget.x,endBlend),y:mix(movingTarget.y,finishTarget.y,endBlend),z:mix(movingTarget.z,finishTarget.z,endBlend)};
  placeCamera({x:mix(startEye.x,trackedEye.x,follow),y:mix(startEye.y,trackedEye.y,follow),z:mix(startEye.z,trackedEye.z,follow)},
              {x:mix(startTarget.x,trackedTarget.x,follow),y:mix(startTarget.y,trackedTarget.y,follow),z:mix(startTarget.z,trackedTarget.z,follow)});
}
function pathTangent(t){
  const a=layout.centerline(Math.max(0,t-.003)),b=layout.centerline(Math.min(1,t+.003));
  const dx=b.x-a.x,dz=b.z-a.z,n=Math.hypot(dx,dz)||1;
  return{x:dx/n,z:dz/n};
}
function backstopGeometry(){
  const tangent=pathTangent(1),normal={x:-tangent.z,z:tangent.x};
  return{x:CUP.x+tangent.x*1.25,z:CUP.z+tangent.z*1.25,
    tangent,normal,halfSpan:1.8,height:.55,thickness:.14};
}
function cameraDepth(p){const r={x:p.x-camera.eye.x,y:p.y-camera.eye.y,z:p.z-camera.eye.z};return r.x*camera.forward.x+r.y*camera.forward.y+r.z*camera.forward.z;}
function project(x,y,z) {
  const rel={x:x-camera.eye.x,y:y-camera.eye.y,z:z-camera.eye.z};
  const rawDepth=rel.x*camera.forward.x+rel.y*camera.forward.y+rel.z*camera.forward.z;
  const depth=Math.max(.45,rawDepth);
  const focal=Math.min(stage.height*.76,stage.width*1.4)*(stage.width<650?.92:1);
  const horizontal=rel.x*camera.right.x+rel.y*camera.right.y+rel.z*camera.right.z;
  const vertical=rel.x*camera.up.x+rel.y*camera.up.y+rel.z*camera.up.z;
  const anchor=stage.width<650?.52:.46;
  return {x:stage.width*.5+horizontal*focal/depth,y:stage.height*anchor-vertical*focal/depth,scale:focal/depth,depth:rawDepth,visible:rawDepth>=.45};
}
placeCamera({x:START.x-courseForward.x*3,y:2.35,z:START.z-courseForward.z*3},{x:START.x+courseForward.x*5,y:.35,z:START.z+courseForward.z*5});
function clipNear(points){
  const near=.48,out=[];
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length],da=cameraDepth(a)-near,db=cameraDepth(b)-near;
    if(da>=0)out.push(a);
    if((da<0&&db>0)||(da>0&&db<0)){
      const f=da/(da-db);out.push({x:mix(a.x,b.x,f),y:mix(a.y,b.y,f),z:mix(a.z,b.z,f)});
    }
  }
  return out;
}
function pathWorld(points, y = 0) {
  const visible=clipNear(points.map(p=>({x:p.x,y:p.y??y,z:p.z})));
  ctx.beginPath();
  visible.forEach((p, i) => { const q = project(p.x,p.y,p.z); if (i) ctx.lineTo(q.x,q.y); else ctx.moveTo(q.x,q.y); });
  ctx.closePath();
}
function poly(points, fill, stroke, lineWidth = 1) { pathWorld(points); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); } }
function lineWorld(points, color, width, dash = []) {
  ctx.beginPath();
  let drawing=false;
  for(let i=1;i<points.length;i++){
    let a=points[i-1],b=points[i],da=cameraDepth(a)-.48,db=cameraDepth(b)-.48;
    if(da<0&&db<0){drawing=false;continue;}
    if(da<0||db<0){const f=da/(da-db),cut={x:mix(a.x,b.x,f),y:mix(a.y,b.y,f),z:mix(a.z,b.z,f)};if(da<0)a=cut;else b=cut;}
    const pa=project(a.x,a.y,a.z),pb=project(b.x,b.y,b.z);
    if(!drawing||da<0)ctx.moveTo(pa.x,pa.y);
    ctx.lineTo(pb.x,pb.y);drawing=db>=0;
  }
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
}
function ellipseWorld(x, y, z, rx, rz, fill, stroke, width = 1) {
  const pts = []; for (let i = 0; i <= 36; i++) { const a = i * Math.PI * 2 / 36; pts.push({ x: x + rx * Math.cos(a), y, z: z + rz * Math.sin(a) }); }
  poly(pts, fill, stroke, width);
}
function raisedDisc(x,z,base,rx,rz,height,side,top,stroke){
  const facing=Math.atan2(camera.eye.z-z,camera.eye.x-x),bottom=[],rim=[];
  for(let i=0;i<=20;i++){
    const a=facing-Math.PI/2+i*Math.PI/20;
    bottom.push({x:x+rx*Math.cos(a),y:base+.006,z:z+rz*Math.sin(a)});
    rim.push({x:x+rx*Math.cos(a),y:base+height,z:z+rz*Math.sin(a)});
  }
  poly([...bottom,...rim.reverse()],side);
  ellipseWorld(x,base+height,z,rx,rz,top,stroke,2);
}
function roundedStagePoints(y) { return [
  { x: -5.8, y, z: -4.6 }, { x: 5.8, y, z: -4.6 }, { x: 6.6, y, z: -4.1 }, { x: 6.6, y, z: 3.65 },
  { x: 5.8, y, z: 4.25 }, { x: -5.8, y, z: 4.25 }, { x: -6.6, y, z: 3.65 }, { x: -6.6, y, z: -4.1 }
]; }
function background(t) {
  const { width:w, height:h } = stage;
  const sky = ctx.createLinearGradient(0,0,0,h); sky.addColorStop(0,'#f2e9d8'); sky.addColorStop(.65,'#e6efe5'); sky.addColorStop(1,'#e4d4bb');
  ctx.fillStyle=sky; ctx.fillRect(0,0,w,h);
  const sunX = w*.71, sunY = h*.23;
  const sun = ctx.createRadialGradient(sunX,sunY,5,sunX,sunY,Math.min(w,h)*.4); sun.addColorStop(0,'#fff4d297');sun.addColorStop(.4,'#fff5d737');sun.addColorStop(1,'#fff7e400');
  ctx.fillStyle=sun;ctx.fillRect(0,0,w,h);
  ctx.fillStyle='#f7e5ba'; ctx.beginPath();ctx.arc(sunX,sunY,Math.min(w,h)*.055,0,Math.PI*2);ctx.fill();
  function hill(y, amp, color, shift){ ctx.beginPath(); ctx.moveTo(-20,h);ctx.lineTo(-20,y);for(let x=-20;x<=w+40;x+=35)ctx.lineTo(x,y+Math.sin(x/w*8+shift)*amp+Math.sin(x/w*16+shift*2)*amp*.3);ctx.lineTo(w+40,h);ctx.closePath();ctx.fillStyle=color;ctx.fill(); }
  hill(h*.69,17,'#e0e7d4',.5); hill(h*.79,24,'#cdddc9',1.5); hill(h*.91,14,'#c8d4b5',2.8);
  for (let i=0;i<9;i++){ const x=(i*197+35)%w, y=h*.13+(i*73)%(h*.48);const alpha=.21+(i%3)*.08;ctx.fillStyle=`rgba(255,255,255,${alpha})`;ctx.beginPath();ctx.ellipse(x+Math.sin(t*.00018+i)*8,y,35+(i%3)*12,8,0,0,Math.PI*2);ctx.fill(); }
}
function drawStage() {
  // The course stretches away from the player's feet into the horizon.
  const h=stage.height,w=stage.width;
  const turf=ctx.createLinearGradient(0,h*.2,0,h);turf.addColorStop(0,'#b6cda8');turf.addColorStop(.5,'#83ae8a');turf.addColorStop(1,'#5e996d');
  ctx.beginPath();ctx.moveTo(0,h*.27);ctx.quadraticCurveTo(w*.55,h*.22,w,h*.285);ctx.lineTo(w,h);ctx.lineTo(0,h);ctx.closePath();ctx.fillStyle=turf;ctx.fill();
  for(let i=0;i<11;i++){const y=h*(.33+i*i*.006);ctx.strokeStyle=i%2?'#dce7b617':'#fff8d514';ctx.lineWidth=3+i*.9;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
}
function visualPathPoint(t,across){
  if(t>=0)return layout.pathPoint(t,across);
  const p=layout.pathPoint(0,across),dir=pathTangent(0);
  return{x:p.x+dir.x*t*layout.span,y:.04,z:p.z+dir.z*t*layout.span};
}
function courseEdge(t,across,lift=0){
  const p=visualPathPoint(t,across);
  return {...p,y:layout.heightAt(p.x,p.z)+lift};
}
function courseStrip(acrossA,acrossB,fill,stroke){
  const a=[],b=[];
  const near=-4/layout.span;
  for(let i=0;i<=72;i++){
    const t=near+(1-near)*i/72,w=layout.corridorHalfWidth(t);
    a.push(courseEdge(t,acrossA(w),.012));
    b.push(courseEdge(t,acrossB(w),.012));
  }
  poly([...a,...b.reverse()],fill,stroke,stroke?1.3:0);
}
function drawBanks(){
  // Earth and turf visibly rise beside the corridor. The same heightAt profile
  // guides the ball back toward the fairway, including on the curved holes.
  for(const side of [-1,1]){
    courseStrip(w=>side*(w+1.48),w=>side*(w+1.73),'#385e4531');
    courseStrip(w=>side*(w+1.17),w=>side*(w+1.5),'#87ae82','#66916d');
    courseStrip(w=>side*(w+.78),w=>side*(w+1.17),'#729d76');
    courseStrip(w=>side*(w+.42),w=>side*(w+.78),'#5f8c69');
    courseStrip(w=>side*(w-.1),w=>side*(w+.42),'#7da478','#688963');
    const ridge=[];
    const near=-4/layout.span;
    for(let i=0;i<=64;i++){const t=near+(1-near)*i/64,w=layout.corridorHalfWidth(t);ridge.push(courseEdge(t,side*(w+.36),.025));}
    lineWorld(ridge,'#c8d8ab8c',1.5);
  }
}
function drawRailSegment(side,t,u){
  // The inner timber face coincides with the physical side-wall centerline.
  // The solid cap and dark outer face extend outward, away from the ball.
  const a=courseEdge(t,side*layout.corridorHalfWidth(t));
  const b=courseEdge(u,side*layout.corridorHalfWidth(u));
  const ao=courseEdge(t,side*(layout.corridorHalfWidth(t)+.14));
  const bo=courseEdge(u,side*(layout.corridorHalfWidth(u)+.14));
  const lift=(p,h)=>({...p,y:p.y+h});
  const ha=layout.railHeightAt(t),hb=layout.railHeightAt(u);
  poly([lift(ao,.02),lift(bo,.02),lift(bo,hb-.02),lift(ao,ha-.02)],'#6b4b36');
  poly([lift(a,.025),lift(b,.025),lift(b,hb),lift(a,ha)],side<0?'#9e784f':'#b58b59','#694a35',1);
  poly([lift(a,ha),lift(b,hb),lift(bo,hb),lift(ao,ha)],'#f0d6a1','#684a35',1);
  lineWorld([lift(a,ha-.01),lift(b,hb-.01)],'#fff1c4',2.5);
  lineWorld([lift(a,ha*.53),lift(b,hb*.53)],'#6d4e39',2);
  if(t>.145&&t<.92&&Math.round((t-.1)/.0145)%6===0){
    lineWorld([lift(a,.05),lift(a,ha-.02)],'#765139',Math.max(2.5,project(a.x,a.y,a.z).scale*.032));
    const nail=project(a.x,a.y+ha*.8,a.z);ctx.fillStyle='#f4dfa9';ctx.beginPath();ctx.arc(nail.x,nail.y,Math.max(1.5,nail.scale*.018),0,7);ctx.fill();
  }
}
function drawCorridorRails(){
  // Open tee; no transverse wall or end cap to trap a mis-aimed shot.
  const segments=[];
  for(const side of [-1,1])for(let i=0;i<60;i++){
    const t=.10+.87*i/60,u=.10+.87*(i+1)/60;
    const p=courseEdge((t+u)/2,side*layout.corridorHalfWidth((t+u)/2));
    segments.push({side,t,u,depth:cameraDepth(p)});
  }
  segments.sort((a,b)=>b.depth-a.depth);
  for(const s of segments)drawRailSegment(s.side,s.t,s.u);
}
function drawBackstop(){
  const wall=backstopGeometry();
  const point=(across,along,lift)=>{
    const x=wall.x+wall.normal.x*across+wall.tangent.x*along;
    const z=wall.z+wall.normal.z*across+wall.tangent.z*along;
    return{x,y:layout.heightAt(x,z)+cupBowlDrop(x,z)+lift,z};
  };
  const w=wall.halfSpan,h=wall.height,d=wall.thickness;
  // Front face is the same world plane used by the backstop contact. The cap
  // adds depth only behind it, away from the cup and incoming ball.
  const opening=shot?.backstopFlapAt===undefined?0:
    Math.max(0,Math.min(1,(shot.elapsed-shot.backstopFlapAt)/.22));
  const angle=opening*Math.PI*.47;
  const panelBottom=(across)=>point(across,-h*Math.sin(angle),h-h*Math.cos(angle)+.025);
  poly([point(-w,d,h),point(w,d,h),point(w,0,h),point(-w,0,h)],'#f0d6a1','#684a35',1);
  poly([panelBottom(-w),panelBottom(w),point(w,0,h),point(-w,0,h)],'#b58b59','#694a35',1);
  lineWorld([point(-w,0,h),point(w,0,h)],'#fff1c4',2.5);
  for(const across of [-w,w]){
    lineWorld([point(across,-.025,.025),point(across,-.025,h+.04)],'#765139',3);
    const nail=point(across,0,h*.8),p=project(nail.x,nail.y,nail.z);
    ctx.fillStyle='#f4dfa9';ctx.beginPath();ctx.arc(p.x,p.y,Math.max(1.5,p.scale*.018),0,7);ctx.fill();
  }
}
function centerline(){return Array.from({length:73},(_,i)=>layout.centerline(i/72));}
function ribbon(points,width,fill,stroke){const left=[],right=[];for(let i=0;i<points.length;i++){const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;left.push({x:points[i].x-dz/len*width/2,y:points[i].y,z:points[i].z+dx/len*width/2});right.push({x:points[i].x+dz/len*width/2,y:points[i].y,z:points[i].z-dx/len*width/2});}poly([...left,...right.reverse()],fill,stroke,stroke?1.5:0);}
function drawFairway(){
  // Layered soil sides and a broad, gently crowned grass surface reveal hills
  // and turns without decorative stripes that fight the interactive props.
  for(const side of [-1,1]){
    const near=-4/layout.span;
    for(let i=71;i>=0;i--){
      const t=near+(1-near)*i/72,u=near+(1-near)*(i+1)/72;
      const a=courseEdge(t,side*layout.corridorHalfWidth(t),.012);
      const b=courseEdge(u,side*layout.corridorHalfWidth(u),.012);
      poly([{...a,y:a.y-.15},{...b,y:b.y-.15},b,a],side<0?'#637754':'#748662');
    }
  }
  const edgeLight=ctx.createLinearGradient(0,stage.height*.28,0,stage.height);
  edgeLight.addColorStop(0,'#9fc095');edgeLight.addColorStop(.55,'#75a579');edgeLight.addColorStop(1,'#54865f');
  const turfLight=ctx.createLinearGradient(0,stage.height*.28,0,stage.height);
  turfLight.addColorStop(0,'#c5d9a6');turfLight.addColorStop(.58,'#add095');turfLight.addColorStop(1,'#83b67d');
  courseStrip(w=>-w,w=>w,edgeLight,'#426b50');
  courseStrip(w=>-(w-.20),w=>w-.20,'#8dbc7d');
  courseStrip(w=>-(w-.48),w=>w-.48,turfLight);
  drawFairwayLighting();
  drawTurfTexture();
  const teeY=layout.heightAt(START.x,START.z);
  ellipseWorld(START.x,teeY+.02,START.z,.74,.64,'#cba978','#fff0c4',3);
  ellipseWorld(START.x,teeY+.026,START.z,.57,.49,'#f1dda8','#bc965f',2);
  ellipseWorld(START.x,teeY+.032,START.z,.37,.32,'#d3b277','#f9efcc',2);
}
function drawFairwayLighting(){
  // Broad, low-contrast light follows the actual terrain normal. The uphill
  // face of a ramp catches light; the downhill face stays cooler and deeper.
  const light={x:-.43,y:.86,z:.28};
  for(let i=47;i>=0;i--){
    const t=i/48,u=(i+1)/48;
    for(let j=0;j<8;j++){
      const across0=-1+j/4,across1=across0+.25;
      const half0=layout.corridorHalfWidth(t)-.17,half1=layout.corridorHalfWidth(u)-.17;
      const a=courseEdge(t,across0*half0,.026),b=courseEdge(u,across0*half1,.026);
      const c=courseEdge(u,across1*half1,.026),d=courseEdge(t,across1*half0,.026);
      const x=(a.x+c.x)*.5,z=(a.z+c.z)*.5,e=.13;
      const sx=(layout.heightAt(x-e,z)-layout.heightAt(x+e,z))/(2*e);
      const sz=(layout.heightAt(x,z-e)-layout.heightAt(x,z+e))/(2*e);
      const n=1/Math.hypot(sx,1,sz),lit=(sx*light.x+light.y+sz*light.z)*n;
      const delta=Math.max(-.22,Math.min(.22,lit-light.y));
      const opacity=Math.abs(delta)*.42;
      if(opacity<.008)continue;
      poly([a,b,c,d],delta>0?`rgba(255,250,217,${opacity})`:`rgba(31,72,59,${opacity})`);
    }
  }
}
function drawTurfTexture(){
  // Small, deterministic grass tufts give the broad foreground scale while
  // leaving the shot line and physical obstacles easy to read.
  ctx.save();ctx.lineCap='round';
  for(let i=0;i<108;i++){
    const t=.025+((i*.61803398875)%1)*.945;
    const spread=((i*.75487766625)%1)*2-1;
    const across=spread*(layout.corridorHalfWidth(t)-.42);
    const p=courseEdge(t,across,.03),q=project(p.x,p.y,p.z);
    if(q.depth<.6||q.y<stage.height*.26||q.y>stage.height*1.06)continue;
    const s=Math.max(1,Math.min(5,q.scale*.035));
    ctx.strokeStyle=i%3?'#f1eecf25':'#2f6b4c22';ctx.lineWidth=Math.max(1,s*.48);
    ctx.beginPath();ctx.moveTo(q.x-s,q.y+s*.45);ctx.lineTo(q.x,q.y-s*.45);ctx.lineTo(q.x+s*.8,q.y+s*.25);ctx.stroke();
  }
  ctx.restore();
}
function drawBunker(){
  if(layout.theme===1)return;
  const p=layout.pathPoint(.21,-1.62),y=layout.heightAt(p.x,p.z);
  ellipseWorld(p.x,y+.018,p.z,.78,.48,'#bba773','#eee1aa',3);
  ellipseWorld(p.x,y+.024,p.z,.62,.35,'#e9d9a6');
}
function riverWorldPoint(across){
  const river=layout.river,base=layout.pathPoint(river.t,across),dir=pathTangent(river.t),shift=riverCenter(across);
  return{x:base.x+dir.x*shift,z:base.z+dir.z*shift};
}
function drawWater(t){
  const river=layout.river;if(!river)return;
  const dir=pathTangent(river.t),waterLeft=[],waterRight=[],banks=[[],[]];
  for(let i=0;i<=28;i++){
    const across=-river.span+i/28*river.span*2,p=riverWorldPoint(across);
    const surface=layout.heightAt(p.x,p.z)-.10;
    for(const [index,side] of [-1,1].entries()){
      const inner={x:p.x+dir.x*side*river.halfWidth,y:surface+.008,z:p.z+dir.z*side*river.halfWidth};
      const ox=p.x+dir.x*side*(river.halfWidth+.22),oz=p.z+dir.z*side*(river.halfWidth+.22);
      banks[index].push({inner,outer:{x:ox,y:layout.heightAt(ox,oz)+.012,z:oz}});
      (side<0?waterLeft:waterRight).push(inner);
    }
  }
  for(const bank of banks)poly([...bank.map(p=>p.outer),...bank.map(p=>p.inner).reverse()],'#94775c','#dfcda4',1);
  const water=ctx.createLinearGradient(0,stage.height*.32,0,stage.height*.83);
  water.addColorStop(0,'#27899b');water.addColorStop(.55,'#36a6b4');water.addColorStop(1,'#217f91');
  poly([...waterLeft,...waterRight.reverse()],water,'#b2e7d5',1.4);
  for(let i=0;i<9;i++){
    const across=-river.span+((i/9+t*.00008)%1)*river.span*2,p=riverWorldPoint(across);
    const y=layout.heightAt(p.x,p.z)-.08;
    lineWorld([{x:p.x-dir.x*.22,y,z:p.z-dir.z*.22},{x:p.x+dir.x*.16,y:y+.003,z:p.z+dir.z*.16}],
      i%2?'#e5fff5bb':'#b1f1e8cc',Math.max(1.5,project(p.x,y,p.z).scale*.04));
  }
}
function tree(x,z,s=1){const y=layout.heightAt(x,z),p=project(x,y+.03,z);if(p.depth<.5)return;const top=project(x,y+1.45*s,z),r=p.scale*.32*s;ellipseWorld(x,y+.02,z,.31*s,.2*s,'#417d5a57');ctx.strokeStyle='#816d45';ctx.lineWidth=Math.max(2,p.scale*.055)*s;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(top.x,top.y);ctx.stroke();const g=ctx.createRadialGradient(top.x-r*.35,top.y-r*.35,1,top.x,top.y,r*1.1);g.addColorStop(0,'#b8dba1');g.addColorStop(.7,'#438b68');g.addColorStop(1,'#2e705a');ctx.fillStyle=g;ctx.beginPath();ctx.arc(top.x,top.y,r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d7e4a1bb';ctx.beginPath();ctx.arc(top.x-r*.3,top.y-r*.25,r*.22,0,Math.PI*2);ctx.fill();}
function drawDetails(t){
  for(let i=0;i<18;i++){
    const u=(i+.5)/18,p=layout.pathPoint(u,(i%2?1:-1)*(1.9+(i%4)*.19)),q=project(p.x,layout.heightAt(p.x,p.z)+.03,p.z);
    if(q.depth<.5)continue;
    ctx.fillStyle=i%4?'#f2e6ad':'#e8b8a3';ctx.beginPath();ctx.arc(q.x,q.y,Math.max(1.2,q.scale*.03),0,7);ctx.fill();
  }
}
function drawPad(feature,t){
  const {x,z}=feature,ground=layout.heightAt(x,z);
  const beat=Math.sin(t*.007)*.5+.5;
  ellipseWorld(x,ground+.012,z,.87,.87,'#253a3455');
  raisedDisc(x,z,ground,.78,.78,.045,'#423052','#60447d','#d5b8fa');
  ellipseWorld(x,ground+.052,z,.68,.68,'#e6c7ff','#684391',2);
  ellipseWorld(x,ground+.057,z,.55,.55,'#8555b9','#fff1cf',3);
  ellipseWorld(x,ground+.06,z,.42,.42,'#b47be1');
  for(let i=0;i<16;i++){
    const a=i*Math.PI/8,q=project(x+Math.cos(a)*.75,ground+.061,z+Math.sin(a)*.75);
    ctx.fillStyle=i%2?'#ffe2b9':'#fffbde';ctx.beginPath();ctx.arc(q.x,q.y,Math.max(1.5,q.scale*(.018+.005*beat)),0,7);ctx.fill();
  }
  const p=project(x,ground+.065,z),r=Math.max(13,p.scale*.38);
  const a=layout.centerline(Math.max(0,feature.t-.02)),b=layout.centerline(Math.min(1,feature.t+.02));
  const pa=project(a.x,a.y,a.z),pb=project(b.x,b.y,b.z),angle=Math.atan2(pb.y-pa.y,pb.x-pa.x);
  ctx.save();ctx.translate(p.x,p.y);ctx.rotate(angle);ctx.fillStyle='#fffbe1';ctx.shadowColor='#dfa8ff';ctx.shadowBlur=4+beat*3;
  for(let i=-1;i<=1;i++){const offset=i*r*.27;ctx.beginPath();ctx.moveTo(offset-r*.13,-r*.23);ctx.lineTo(offset+r*.14,0);ctx.lineTo(offset-r*.13,r*.23);ctx.lineWidth=3;ctx.strokeStyle='#fff8d5';ctx.stroke();}
  ctx.restore();
  ctx.strokeStyle=`rgba(193,121,238,${.25+beat*.45})`;ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(p.x,p.y,r*(1.35+beat*.25),r*.52*(1.35+beat*.25),-.2,0,7);ctx.stroke();
}
function drawBumper(feature){
  const {x,z}=feature,ground=layout.heightAt(x,z);
  ellipseWorld(x,ground+.015,z,.65,.60,'#372b3455');
  raisedDisc(x,z,ground,.57,.54,.075,'#6d4661','#e8adbf','#f5bad0');
  ellipseWorld(x,ground+.082,z,.46,.43,'#ffe0ea','#b7496a',3);
  const p=project(x,ground+.38,z),r=Math.max(12,p.scale*.37);
  const shell=ctx.createRadialGradient(p.x-r*.4,p.y-r*.42,1,p.x,p.y,r);
  shell.addColorStop(0,'#ffd9d8');shell.addColorStop(.32,'#f7839c');shell.addColorStop(.76,'#e95679');shell.addColorStop(1,'#a63458');
  ctx.save();ctx.shadowColor='#eb6e90';ctx.shadowBlur=5;ctx.fillStyle=shell;ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*.88,0,0,7);ctx.fill();ctx.restore();
  ctx.fillStyle='#b84564';ctx.beginPath();ctx.ellipse(p.x,p.y+r*.45,r*.57,r*.17,0,0,7);ctx.fill();
  ctx.strokeStyle='#ffe7a6';ctx.lineWidth=Math.max(2,r*.14);ctx.beginPath();ctx.ellipse(p.x,p.y,r*.83,r*.68,0,Math.PI*.05,Math.PI*.95);ctx.stroke();
  ctx.fillStyle='#fff1c5';ctx.beginPath();ctx.ellipse(p.x-r*.26,p.y-r*.27,r*.23,r*.13,-.3,0,7);ctx.fill();
}
function drawLoop(feature){
  const {x,z}=feature,ground=layout.heightAt(x,z);
  const dir=pathTangent(feature.t),normal={x:-dir.z,z:dir.x};
  ellipseWorld(x,ground+.04,z,.98,.57,'#5b584246');
  ellipseWorld(x,ground+.065,z,.79,.55,'#2f7183','#a5e5ed',3);
  ellipseWorld(x,ground+.076,z,.57,.34,'#80d3cf');
  const arrowStart={x:x-dir.x*.31,y:ground+.09,z:z-dir.z*.31},arrowTip={x:x+dir.x*.37,y:ground+.09,z:z+dir.z*.37};
  lineWorld([arrowStart,arrowTip],'#e8fff0',5);
  const wingA={x:x+dir.x*.17+normal.x*.18,y:ground+.09,z:z+dir.z*.17+normal.z*.18};
  const wingB={x:x+dir.x*.17-normal.x*.18,y:ground+.09,z:z+dir.z*.17-normal.z*.18};
  lineWorld([wingA,arrowTip,wingB],'#e8fff0',5);
  const ringPoint=(a,r,depth)=>({x:x+normal.x*Math.sin(a)*(.82+r)+dir.x*depth,
    y:ground+1.1+Math.cos(a)*(1.1+r),z:z+normal.z*Math.sin(a)*(.82+r)+dir.z*depth});
  const sections=[];
  for(let i=0;i<48;i++){
    const a=i/48*Math.PI*2,b=(i+1)/48*Math.PI*2;
    sections.push({a,b,depth:cameraDepth(ringPoint((a+b)/2,0,0))});
  }
  sections.sort((a,b)=>b.depth-a.depth);
  for(const section of sections){
    const {a,b}=section,m=(a+b)/2;
    const outerA=ringPoint(a,.13,.07),outerB=ringPoint(b,.13,.07);
    const innerA=ringPoint(a,-.13,.07),innerB=ringPoint(b,-.13,.07);
    const rearA=ringPoint(a,.13,-.08),rearB=ringPoint(b,.13,-.08);
    poly([rearA,rearB,outerB,outerA],'#245269');
    poly([innerA,innerB,outerB,outerA],Math.cos(m-.65)>.25?'#8cdae2':'#51aabd');
    lineWorld([ringPoint(a,.075,.079),ringPoint(b,.075,.079)],'#e4f7ee',Math.max(1,project(x,ground+1.1,z).scale*.025));
  }
  for(const a of [.45,1.65,2.85,4.05,5.25]){
    const x0=x+normal.x*Math.sin(a)*.82,z0=z+normal.z*Math.sin(a)*.82,y0=ground+1.1+Math.cos(a)*1.1;
    const p=project(x0,y0,z0);ctx.fillStyle='#fff1c6';ctx.beginPath();ctx.arc(p.x,p.y,Math.max(3,p.scale*.06),0,7);ctx.fill();
  }
}
function drawCannon(feature){
  const {x,z}=feature,ground=layout.heightAt(x,z);
  const dir=pathTangent(feature.t),side={x:-dir.z,z:dir.x};
  ellipseWorld(x,ground+.012,z,.99,.75,'#24363366');
  raisedDisc(x,z,ground,.88,.65,.07,'#544c3b','#b47950','#f8dcaa');
  ellipseWorld(x,ground+.077,z,.63,.49,'#bb6d43','#eec48d',2);
  const rear={x:x-dir.x*.47,y:ground+.56,z:z-dir.z*.47};
  const front={x:x+dir.x*.59,y:ground+.73,z:z+dir.z*.59};
  const ringPoint=(center,a,r)=>({x:center.x+side.x*Math.cos(a)*r-dir.x*Math.sin(a)*r*.17,
    y:center.y+Math.sin(a)*r*.985,z:center.z+side.z*Math.cos(a)*r-dir.z*Math.sin(a)*r*.17});
  const panels=[];
  for(let i=0;i<16;i++){
    const a=i/16*Math.PI*2,b=(i+1)/16*Math.PI*2;
    panels.push({a,b,depth:cameraDepth(ringPoint({x:(rear.x+front.x)/2,y:(rear.y+front.y)/2,z:(rear.z+front.z)/2},(a+b)/2,.28))});
  }
  panels.sort((a,b)=>b.depth-a.depth);
  for(const {a,b} of panels){
    const light=Math.sin((a+b)/2)*.7+Math.cos((a+b)/2)*.25;
    const paint=light>.48?'#b9d7eb':light>.08?'#6e9bca':light>-.38?'#476fa4':'#2e537d';
    poly([ringPoint(rear,a,.25),ringPoint(rear,b,.25),ringPoint(front,b,.29),ringPoint(front,a,.29)],paint);
  }
  for(const center of [rear,front]){
    const band=[];for(let i=0;i<=24;i++)band.push(ringPoint(center,i/24*Math.PI*2,center===front?.305:.265));
    lineWorld(band,'#e9cb92',Math.max(2,project(center.x,center.y,center.z).scale*.035));
  }
  for(let i=0;i<16;i++){
    const a=i/16*Math.PI*2,b=(i+1)/16*Math.PI*2;
    poly([ringPoint(front,a,.29),ringPoint(front,b,.29),ringPoint(front,b,.18),ringPoint(front,a,.18)],i%2?'#e7cb9b':'#f6e0ae');
  }
  const mouth=[];for(let i=0;i<20;i++)mouth.push(ringPoint(front,i/20*Math.PI*2,.18));
  poly(mouth,'#172f37','#45647a',2);
  for(const along of [-.44,.24]){
    const q=project(x+dir.x*along+side.x*.37,ground+.29,z+dir.z*along+side.z*.37),r=Math.max(8,q.scale*.25);
    const wheel=ctx.createRadialGradient(q.x-r*.3,q.y-r*.35,1,q.x,q.y,r);
    wheel.addColorStop(0,'#d69e6d');wheel.addColorStop(.68,'#84563f');wheel.addColorStop(1,'#513b31');
    ctx.fillStyle=wheel;ctx.strokeStyle='#f1c58e';ctx.lineWidth=3;ctx.beginPath();ctx.arc(q.x,q.y,r,0,7);ctx.fill();ctx.stroke();
    ctx.strokeStyle='#dfb889';ctx.lineWidth=2;for(let spoke=0;spoke<6;spoke++){
      const a=spoke*Math.PI/3;ctx.beginPath();ctx.moveTo(q.x,q.y);ctx.lineTo(q.x+Math.cos(a)*r*.8,q.y+Math.sin(a)*r*.8);ctx.stroke();
    }
    ctx.fillStyle='#f3d8a2';ctx.beginPath();ctx.arc(q.x,q.y,r*.16,0,7);ctx.fill();
  }
}
function drawBridge(feature){
  const {x,z}=feature,ground=layout.heightAt(x,z);
  const a=layout.centerline(Math.max(0,feature.t-.002)),b=layout.centerline(Math.min(1,feature.t+.002));
  const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz)||1;
  const tangent={x:dx/length,z:dz/length},n={x:-tangent.z,z:tangent.x};
  const point=(along,across,height)=>({x:x+tangent.x*along+n.x*across,y:ground+height,z:z+tangent.z*along+n.z*across});
  poly([point(-1.4,-.96,.012),point(1.4,-.96,.012),point(1.4,.96,.012),point(-1.4,.96,.012)],'#2b423b55');
  poly([point(-1.12,-.88,.08),point(1.12,-.88,.08),point(1.12,.88,.08),point(-1.12,.88,.08)],'#694d3b','#f3d092',3);
  for(const side of [-.78,.78]){
    poly([point(-1.08,side,.035),point(1.08,side,.035),point(1.08,side,.18),point(-1.08,side,.18)],side<0?'#80543b':'#9c6845','#5e4232',1);
    lineWorld([point(-1.08,side,.075),point(1.08,side,.075)],'#c78c5e',2);
  }
  poly([point(-1.36,-.78,.02),point(-1.08,-.78,.18),point(-1.08,.78,.18),point(-1.36,.78,.02)],'#be8054','#f4d49d',2);
  poly([point(1.08,-.78,.18),point(1.36,-.78,.02),point(1.36,.78,.02),point(1.08,.78,.18)],'#be8054','#f4d49d',2);
  poly([point(-1.08,-.78,.18),point(1.08,-.78,.18),point(1.08,.78,.18),point(-1.08,.78,.18)],'#d18b53','#fff0be',3);
  for(let i=-4;i<=4;i++){
    const s=i*.24;
    poly([point(s-.105,-.73,.187),point(s+.105,-.73,.187),point(s+.105,.73,.187),point(s-.105,.73,.187)],
      i%2?'#d9955b':'#e9ad70');
    lineWorld([point(s-.075,-.57,.192),point(s-.075,.51,.192)],'#fff0c057',Math.max(1,project(x,ground+.18,z).scale*.016));
    for(const across of [-.47,.43]){
      const nail=project(point(s,across,.198).x,point(s,across,.198).y,point(s,across,.198).z);
      ctx.fillStyle='#76513a';ctx.beginPath();ctx.arc(nail.x,nail.y,Math.max(1,nail.scale*.014),0,7);ctx.fill();
    }
  }
  for(const side of [-.82,.82]){
    for(const s of [-.9,-.3,.3,.9])lineWorld([point(s,side,.18),point(s,side,.74)],'#704835',Math.max(3,project(x,ground+.18,z).scale*.075));
    lineWorld([point(-1,side,.74),point(1,side,.74)],'#f5dba6',5);
    lineWorld([point(-1,side,.62),point(1,side,.62)],'#8d5f3c',3);
    for(const s of [-.6,0,.6])lineWorld([point(s-.3,side,.2),point(s+.3,side,.6)],'#bd8153',Math.max(1.5,project(x,ground+.18,z).scale*.024));
  }
}
function drawWindmill(feature,t){
  const {x,z}=feature,ground=layout.heightAt(x,z);
  const phase=t/1000*1.5+feature.phase;
  for(let i=0;i<4;i++){
    const a=phase+i*Math.PI/2;
    const tipX=x+Math.cos(a)*.88+.68,tipZ=z-.47;
    const shadeY=layout.heightAt(tipX,tipZ)+.025;
    lineWorld([{x:x+.28,y:layout.heightAt(x+.28,z-.2)+.025,z:z-.2},
      {x:tipX,y:shadeY,z:tipZ}],'#274b4650',Math.max(2,project(x,ground,z).scale*.09));
  }
  ellipseWorld(x,ground+.018,z,.82,.59,'#203d344f');
  raisedDisc(x,z,ground,.61,.49,.09,'#855d42','#d4aa77','#f6ddb0');
  poly([{x:x-.54,y:ground+.05,z:z+.25},{x:x+.54,y:ground+.05,z:z+.25},{x:x+.33,y:ground+2.06,z:z+.14},{x:x-.33,y:ground+2.06,z:z+.14}], '#f5dbad','#b76b3d',2);
  poly([{x:x+.54,y:ground+.05,z:z+.25},{x:x+.6,y:ground+.05,z:z-.18},{x:x+.31,y:ground+2.06,z:z-.17},{x:x+.33,y:ground+2.06,z:z+.14}], '#d9a977','#a36b47',2);
  poly([{x:x-.54,y:ground+.05,z:z+.25},{x:x-.60,y:ground+.05,z:z-.18},{x:x-.31,y:ground+2.06,z:z-.17},{x:x-.33,y:ground+2.06,z:z+.14}], '#be8c61','#a36b47',2);
  poly([{x:x-.49,y:ground+2.01,z:z+.2},{x:x+.42,y:ground+2.01,z:z+.2},{x:x,y:ground+2.53,z:z+.17}], '#976e51','#f7dfaa',3);
  for(const h of [.38,.73,1.08,1.43,1.78]){
    const spread=.54-(.54-.33)*h/2.06;
    lineWorld([{x:x-spread+.035,y:ground+h,z:z+.25-h*.055},{x:x+spread-.035,y:ground+h,z:z+.25-h*.055}],
      '#c9946799',Math.max(1,project(x,ground+h,z).scale*.018));
    for(const side of [-.45,.34]){
      const px=x+spread*side;
      lineWorld([{x:px,y:ground+h+.015,z:z+.25-h*.055},{x:px+.015,y:ground+h+.15,z:z+.24-(h+.15)*.055}],
        '#c9946770',Math.max(1,project(x,ground+h,z).scale*.014));
    }
  }
  const door=project(x,ground+.48,z+.27),dr=Math.max(5,door.scale*.2);
  ctx.fillStyle='#604833';ctx.beginPath();ctx.roundRect(door.x-dr*.7,door.y-dr*1.15,dr*1.4,dr*1.35,[dr,dr,0,0]);ctx.fill();
  ctx.strokeStyle='#f1cf95';ctx.lineWidth=2;ctx.stroke();
  const hub={x,y:ground+1.72,z:z+.32};
  for(let i=0;i<4;i++){
    const angle=phase+i*Math.PI/2,dx=Math.cos(angle),dy=Math.sin(angle),nx=-dy,ny=dx;
    const blade=(distance,side,depth=0)=>({x:hub.x+dx*distance+nx*side,y:hub.y+dy*distance+ny*side,z:hub.z+depth});
    poly([blade(.15,-.07,-.12),blade(.88,-.16,-.12),blade(.88,.14,-.12),blade(.15,.07,-.12)],'#554b68');
    poly([blade(.88,-.16,-.12),blade(.88,.14,-.12),blade(.88,.14),blade(.88,-.16)],'#544560');
    poly([blade(.15,-.07),blade(.88,-.16),blade(.88,.14),blade(.15,.07)],'#faf2ff','#7663b9',2);
    poly([blade(.7,-.13),blade(.88,-.16),blade(.88,.14),blade(.7,.12)],'#e8668f');
    lineWorld([blade(.23,-.012,.012),blade(.76,-.012,.012)],'#b7a9d9',Math.max(1,project(x,ground+1.72,z).scale*.018));
  }
  const p=project(hub.x,hub.y,hub.z),r=Math.max(7,p.scale*.15);
  const metal=ctx.createRadialGradient(p.x-r*.38,p.y-r*.4,1,p.x,p.y,r);
  metal.addColorStop(0,'#f2e3f3');metal.addColorStop(.42,'#8a9bd0');metal.addColorStop(1,'#4d568c');
  ctx.fillStyle=metal;ctx.strokeStyle='#fff0c7';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,r,0,7);ctx.fill();ctx.stroke();
  ctx.fillStyle='#fff5db';ctx.beginPath();ctx.arc(p.x-r*.25,p.y-r*.28,Math.max(2,r*.16),0,7);ctx.fill();
}
function drawMole(mole){
  const ground=layout.heightAt(mole.x,mole.z),age=Math.max(0,shot.elapsed-mole.startedAt);
  const pop=Math.min(1,age/.065),fade=Math.min(1,Math.max(0,(mole.until-shot.elapsed)/.22));
  ellipseWorld(mole.x,ground+.015,mole.z,.48,.42,'#6f563c','#cfad77',3);
  ellipseWorld(mole.x,ground+.02,mole.z,.36,.31,'#342f2a');
  if(pop<=0||fade<=0)return;
  const p=project(mole.x,ground+.25*pop,mole.z),r=Math.max(5,p.scale*.33*pop);
  ctx.save();ctx.globalAlpha=fade;
  const fur=ctx.createRadialGradient(p.x-r*.35,p.y-r*.4,1,p.x,p.y,r);
  fur.addColorStop(0,'#bd9270');fur.addColorStop(1,'#6f4f3d');
  ctx.fillStyle=fur;ctx.strokeStyle='#e3c294';ctx.lineWidth=2;
  ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*.92,0,Math.PI,0);ctx.lineTo(p.x+r,p.y+r*.4);ctx.quadraticCurveTo(p.x,p.y+r*.82,p.x-r,p.y+r*.4);ctx.closePath();ctx.fill();ctx.stroke();
  ctx.fillStyle='#f0d5ad';ctx.beginPath();ctx.ellipse(p.x,p.y+r*.23,r*.53,r*.34,0,0,7);ctx.fill();
  ctx.fillStyle='#263128';for(const side of [-1,1]){ctx.beginPath();ctx.arc(p.x+side*r*.34,p.y-r*.2,Math.max(2,r*.095),0,7);ctx.fill();}
  ctx.fillStyle='#d57d82';ctx.beginPath();ctx.ellipse(p.x,p.y+r*.08,r*.16,r*.12,0,0,7);ctx.fill();
  ctx.strokeStyle='#f5e5c2';ctx.lineWidth=Math.max(1,r*.035);for(const side of [-1,1])for(const row of [-1,1]){ctx.beginPath();ctx.moveTo(p.x+side*r*.17,p.y+r*.16);ctx.lineTo(p.x+side*r*.72,p.y+r*(.12+row*.12));ctx.stroke();}
  ctx.restore();
}
function drawFeatures(t){
  const features=layout.features.map(f=>movingFeature(f,t/1000));
  if(shot?.mole?.active)features.push({...shot.mole,kind:'mole',y:layout.heightAt(shot.mole.x,shot.mole.z)});
  features.sort((a,b)=>project(b.x,b.y,b.z).depth-project(a.x,a.y,a.z).depth);
  for(const f of features){
    if(f.kind==='bumper')drawBumper(f);
    else if(f.kind==='pad')drawPad(f,t);
    else if(f.kind==='loop')drawLoop(f);
    else if(f.kind==='windmill')drawWindmill(f,t);
    else if(f.kind==='bridge')drawBridge(f);
    else if(f.kind==='cannon')drawCannon(f);
    else if(f.kind==='mole')drawMole(f);
  }
}
function drawHole(t){
  const cupY=layout.heightAt(CUP.x,CUP.z)+cupBowlDrop(CUP.x,CUP.z);
  const p=project(CUP.x,cupY+.04,CUP.z);
  ellipseWorld(CUP.x,cupY-.005,CUP.z,.89,.8,'#32524655');
  ellipseWorld(CUP.x,cupY+.035,CUP.z,.79,.74,'#f8e8b2','#b77843',4);
  ellipseWorld(CUP.x,cupY+.041,CUP.z,.68,.64,'#a0b977','#fff7d4',3);
  ellipseWorld(CUP.x,cupY+.046,CUP.z,.59,.57,'#143c31','#fff5d2',4);
  const mouth=ctx.createRadialGradient(p.x-p.scale*.13,p.y-p.scale*.07,1,p.x,p.y,Math.max(8,p.scale*.55));
  mouth.addColorStop(0,'#071f1d');mouth.addColorStop(.7,'#0b302b');mouth.addColorStop(1,'#32604a');
  ellipseWorld(CUP.x,cupY+.03,CUP.z,.51,.49,mouth);
  ctx.strokeStyle='#f7e5ad';ctx.lineWidth=Math.max(2,p.scale*.034);ctx.beginPath();
  ctx.ellipse(p.x,p.y,Math.max(8,p.scale*.51),Math.max(4,p.scale*.2),0,.02,Math.PI-.02);ctx.stroke();
  const poleX=CUP.x+.72;
  const poleY=layout.heightAt(poleX,CUP.z)+cupBowlDrop(poleX,CUP.z);
  ellipseWorld(poleX,poleY+.04,CUP.z,.19,.15,'#72543b','#fff0c5',2);
  lineWorld([{x:poleX,y:poleY+.05,z:CUP.z},{x:poleX-.34,y:poleY+.055,z:CUP.z+.23}],'#576c5055',5);
  lineWorld([{x:poleX,y:poleY+.04,z:CUP.z},{x:poleX,y:poleY+2.11,z:CUP.z}], '#986c45',7);
  lineWorld([{x:poleX,y:poleY+.04,z:CUP.z},{x:poleX,y:poleY+2.11,z:CUP.z}], '#fff7e2',4);
  const top=project(poleX,poleY+2.11,CUP.z),wave=Math.sin(t*.004)*.1;
  const tip=project(poleX+1.05,poleY+1.87+wave,CUP.z),base=project(poleX,poleY+1.55,CUP.z);
  ctx.save();ctx.shadowColor='#9b4725';ctx.shadowBlur=3;
  ctx.fillStyle='#e85e7e';ctx.strokeStyle='#fff0c3';ctx.lineWidth=2.5;
  ctx.beginPath();ctx.moveTo(top.x,top.y);ctx.quadraticCurveTo((top.x+tip.x)*.5,top.y-8,tip.x,tip.y);ctx.lineTo(base.x,base.y);ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
  ctx.fillStyle='#a94768aa';ctx.beginPath();ctx.moveTo(base.x,base.y);ctx.quadraticCurveTo((base.x+tip.x)*.61,base.y-7,tip.x,tip.y);ctx.lineTo(base.x+(tip.x-base.x)*.46,(base.y+top.y)*.51);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#ffd6da';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(top.x+5,top.y+5);ctx.quadraticCurveTo((top.x+tip.x)*.55,(top.y+tip.y)*.5-5,tip.x-5,tip.y-1);ctx.stroke();
  ctx.fillStyle='#ffe9ae';ctx.beginPath();ctx.arc(top.x,top.y,Math.max(3,top.scale*.07),0,7);ctx.fill();
  ctx.fillStyle='#fff6d9';ctx.font=`900 ${Math.max(14,p.scale*.33)}px Outfit`;ctx.textAlign='center';ctx.fillText(String(courseState.level),top.x+(tip.x-top.x)*.42,top.y+(base.y-top.y)*.5);
  ctx.strokeStyle='#fff2c8';ctx.lineWidth=2.5;ctx.beginPath();ctx.ellipse(p.x,p.y,Math.max(9,p.scale*.53),Math.max(5,p.scale*.22),0,0,Math.PI);ctx.stroke();
}
function drawRescueEffect(t){
  if(phase!=='running'||!shot||!shot.effect||shot.elapsed>shot.effect.until)return;
  const effect=shot.effect,p=project(effect.x,.12,effect.z),age=shot.effect.until-shot.elapsed;
  const r=Math.max(18,Math.min(64,p.scale*.23))*(1.35-age*.2);
  ctx.save();ctx.globalAlpha=Math.max(0,Math.min(.9,age));
  ctx.strokeStyle=effect.kind==='wind'?'#a9f3dc':'#f7c27a';ctx.lineWidth=3;
  ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*.42,-.22,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.ellipse(p.x,p.y,r*.65,r*.26,-.22,0,Math.PI*2);ctx.stroke();
  ctx.restore();
}
function drawSlopeGuides(){
  for(const [index,radius] of [.95,1.65,2.45,3.3].entries()){
    const pts=[];
    for(let i=0;i<=48;i++){const a=i/48*Math.PI*2,x=CUP.x+Math.cos(a)*radius,z=CUP.z+Math.sin(a)*radius*.78;
      pts.push({x,y:layout.heightAt(x,z)+cupBowlDrop(x,z)+.06,z});}
    lineWorld(pts,index%2?'#7b9f6288':'#fff3bcad',index===0?4:3,[index===0?0:14,index===0?0:10]);
  }
  for(const distance of [1.12,1.92,2.78]){
    const x=CUP.x-courseForward.x*distance,z=CUP.z-courseForward.z*distance;
    const p=project(x,layout.heightAt(x,z)+cupBowlDrop(x,z)+.08,z),size=Math.max(5,Math.min(15,p.scale*.12));
    ctx.strokeStyle='#f7e6aa';ctx.lineWidth=Math.max(2,size*.23);ctx.lineCap='round';
    ctx.beginPath();ctx.moveTo(p.x-size,p.y-size*.4);ctx.lineTo(p.x,p.y+size*.25);ctx.lineTo(p.x+size,p.y-size*.4);ctx.stroke();
  }
}
function drawBall(t){
  const surface=courseSurfaceAt(ball.x,ball.z,ball.y);
  const p=project(ball.x,ball.y,ball.z),ground=project(ball.x,surface+.03,ball.z),r=Math.max(7,p.scale*.19);
  ctx.save();
  const fade=shot?.sinking?Math.max(0,Math.min(1,
    (ball.y-shot.sinkFloor)/Math.max(.01,shot.sinkStartY-shot.sinkFloor))):1;
  ctx.globalAlpha=fade;
  const altitude=Math.max(0,ball.y-surface-BALL_RADIUS);
  ctx.fillStyle=`rgba(22,66,42,${.11/(1+altitude*.8)})`;ctx.beginPath();ctx.ellipse(ground.x+5,ground.y+3,r*(1.6+altitude*.5),r*(.57+altitude*.16),0,0,7);ctx.fill();
  ctx.fillStyle=`rgba(18,56,38,${.27/(1+altitude*1.4)})`;ctx.beginPath();ctx.ellipse(ground.x+3,ground.y+2,r*(1.12+altitude*.22),r*(.31+altitude*.09),0,0,7);ctx.fill();
  for(let i=0;i<trail.length;i++){
    const q=project(trail[i].x,trail[i].y,trail[i].z),a=(i+1)/trail.length;
    ctx.fillStyle=`rgba(255,222,143,${a*.3})`;ctx.beginPath();ctx.arc(q.x,q.y,r*a*.67,0,7);ctx.fill();
  }
  const g=ctx.createRadialGradient(p.x-r*.4,p.y-r*.45,1,p.x,p.y,r);
  g.addColorStop(0,'#ffffff');g.addColorStop(.36,'#fbfcf5');g.addColorStop(.72,'#e1ebdf');g.addColorStop(.91,'#bacbbb');g.addColorStop(1,'#879d90');
  ctx.shadowColor='#204f3a55';ctx.shadowBlur=5;ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,7);ctx.fill();ctx.shadowBlur=0;
  ctx.save();ctx.beginPath();ctx.arc(p.x,p.y,r*.97,0,7);ctx.clip();
  const dimples=r>18?32:18;
  for(let i=0;i<dimples;i++){
    const a=i*2.399963+t*.00006,rad=Math.sqrt((i+.5)/dimples)*.82;
    const dx=Math.cos(a)*rad*r,dy=Math.sin(a)*rad*r*.9;
    const size=Math.max(.8,r*(.045+.024*(1-rad)));
    ctx.fillStyle='rgba(89,116,103,.20)';ctx.beginPath();ctx.ellipse(p.x+dx+size*.12,p.y+dy+size*.15,size,size*.73,a,0,7);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,.48)';ctx.beginPath();ctx.ellipse(p.x+dx-size*.18,p.y+dy-size*.25,size*.58,size*.36,a,0,7);ctx.fill();
  }
  ctx.restore();
  ctx.strokeStyle='#fafff1';ctx.lineWidth=Math.max(1,r*.065);ctx.beginPath();ctx.arc(p.x,p.y,r*.96,Math.PI*.98,Math.PI*1.8);ctx.stroke();
  ctx.fillStyle='#ffffffbb';ctx.beginPath();ctx.ellipse(p.x-r*.33,p.y-r*.39,r*.19,r*.08,-.55,0,7);ctx.fill();
  if(savedProgress.equippedBall && savedProgress.equippedBall!=='classic')window.BallUpgrades?.draw(ctx,p.x,p.y,r,t,savedProgress.equippedBall);
  else{ctx.fillStyle='#d86e3d';ctx.beginPath();ctx.arc(p.x-r*.15,p.y+r*.23,Math.max(2,r*.11),0,7);ctx.fill();}
  ctx.restore();
}
const clubVisuals={
  rookie:['putter','#b98559','#355544','✦',0],
  meteor:['driver','#d97242','#8b502e','✷',1],cloud:['wedge','#60a8b6','#447c85','☁',1],lightning:['iron','#9a6cad','#6c4c86','ϟ',1],
  orbit:['driver','#6ca67d','#3c7652','◎',2],lotus:['wedge','#c86f91','#924e70','✿',2],volt:['iron','#9a9b44','#626b32','ϟ',2],
  nebula:['driver','#686cb2','#454887','✳',3],rocket:['wedge','#e57957','#a6503c','✦',3],aurora:['iron','#4caa97','#31736f','❋',3],
  wildfire:['driver','#ed8242','#9b3e32','✹',4],starlift:['wedge','#7f9be6','#465a9c','✧',4],ripple:['iron','#51b9ba','#367c87','≋',4],
  thunderhead:['driver','#a277d2','#60458f','ϟ',5],sunforge:['wedge','#efb655','#a06035','☼',5],mirage:['iron','#d67ead','#88446d','◇',5],
  supernova:['driver','#e57f58','#7e3d70','✺',6],skycrown:['wedge','#76b6df','#4d599e','♛',6],kaleido:['iron','#b68cdb','#5f6da2','✦',6]
};
function generatedClub(id){
  const match=/^club-t(\d+)-([abc])$/.exec(id||'');
  return match ? window.GearProgression?.club(Number(match[1]),'abc'.indexOf(match[2])) || null : null;
}
function clubAppearance(id){
  const generated=generatedClub(id);
  if(generated)return [ ['driver','wedge','iron'][generated.family],generated.color,generated.grip,generated.icon,generated.rank ];
  return clubVisuals[id]||clubVisuals.rookie;
}
function drawClub(t){
  if(phase==='running' && (!shot || stage.time-shot.start>450))return;
  const p=project(START.x,START.y,START.z);
  const pullX=dragging?(dragNow.x-dragOrigin.x)*.24:0;
  const pullY=dragging?(dragNow.y-dragOrigin.y)*.16:0;
  const retreat=dragging?Math.min(78,power*.73):0;
  const swing=phase==='running'&&shot?Math.min(1,(stage.time-shot.start)/450):0;
  const contact={x:p.x+44+pullX+retreat*.3+swing*135,y:p.y+13+pullY+retreat*.56-swing*65};
  const shaftHeight=Math.min(stage.height*.46,345);
  const top={x:contact.x+Math.min(39,stage.width*.034),y:contact.y-shaftHeight};
  const [family,color,grip,mark,tier]=clubAppearance(savedProgress.equipped);
  ctx.save();ctx.lineCap='round';
  const axis={x:contact.x-top.x,y:contact.y-top.y},len=Math.hypot(axis.x,axis.y)||1;
  const normal={x:-axis.y/len,y:axis.x/len};
  const surface=(along,side,radius)=>({x:mix(top.x,contact.x,along)+normal.x*side*radius,y:mix(top.y,contact.y,along)+normal.y*side*radius});
  const tube=(start,end,topRadius,bottomRadius,paint)=>{
    const a=surface(start,-1,topRadius),b=surface(start,1,topRadius),c=surface(end,1,bottomRadius),d=surface(end,-1,bottomRadius);
    ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.lineTo(c.x,c.y);ctx.lineTo(d.x,d.y);ctx.closePath();ctx.fillStyle=paint;ctx.fill();
  };
  const shaftShadow=ctx.createLinearGradient(top.x+normal.x*-9,top.y+normal.y*-9,top.x+normal.x*9,top.y+normal.y*9);
  shaftShadow.addColorStop(0,'#253831');shaftShadow.addColorStop(.14,'#687d72');shaftShadow.addColorStop(.43,'#f4f5e8');shaftShadow.addColorStop(.62,tier>=3?color:'#b5c7b8');shaftShadow.addColorStop(.86,'#6e8178');shaftShadow.addColorStop(1,'#243b34');
  tube(.23,.985,6.6,5.4,shaftShadow);
  const gripLight=ctx.createLinearGradient(top.x+normal.x*-10,top.y+normal.y*-10,top.x+normal.x*10,top.y+normal.y*10);
  gripLight.addColorStop(0,'#21352f');gripLight.addColorStop(.25,grip);gripLight.addColorStop(.56,color);gripLight.addColorStop(.8,grip);gripLight.addColorStop(1,'#1e322d');
  tube(.012,.255,9.2,8,gripLight);
  const gripBands=Math.min(10,5+Math.floor(Math.sqrt(tier)));
  for(let i=0;i<gripBands;i++){
    const f=.052+i*.019,a=surface(f,-.74,8.6),b=surface(f,.74,8.6);
    ctx.strokeStyle=tier>=4?'#ffe8bd':'#e8d3a8';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
  for(const f of [.25,.96]){
    const a=surface(f,-1,7.5),b=surface(f,1,7.5);
    ctx.strokeStyle='#e8d1a2';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
  }
  const gleamA=surface(.27,-.15,6),gleamB=surface(.93,-.15,5.2);
  ctx.strokeStyle='#fffdf2bd';ctx.lineWidth=1.7;ctx.beginPath();ctx.moveTo(gleamA.x,gleamA.y);ctx.lineTo(gleamB.x,gleamB.y);ctx.stroke();
  const cap=surface(.012,0,0);ctx.fillStyle=tier>=4?'#fff0bd':color;ctx.strokeStyle='#263a31';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(cap.x,cap.y,9.2,4.4,Math.atan2(axis.y,axis.x),0,7);ctx.fill();ctx.stroke();
  ctx.translate(contact.x,contact.y);ctx.rotate(-.11-swing*.12);
  ctx.fillStyle='#253c303d';ctx.beginPath();ctx.ellipse(-20,26,54,9,0,0,7);ctx.fill();
  const head=ctx.createLinearGradient(-57,-25,44,26);
  head.addColorStop(0,'#fff5df');head.addColorStop(.18,color);head.addColorStop(.54,grip);head.addColorStop(.85,'#445b53');head.addColorStop(1,'#243831');
  const headPath=()=>{
    ctx.beginPath();
    if(family==='driver'){
      ctx.moveTo(-52,-13);ctx.bezierCurveTo(-63,-32,-17,-35,19,-27);ctx.bezierCurveTo(57,-24,59,7,31,20);ctx.bezierCurveTo(4,27,-41,20,-53,6);ctx.closePath();
    }else if(family==='wedge'){
      ctx.moveTo(-55,-15);ctx.lineTo(10,-26);ctx.quadraticCurveTo(32,-30,40,-15);ctx.lineTo(23,20);ctx.lineTo(-44,16);ctx.quadraticCurveTo(-55,10,-55,-15);ctx.closePath();
    }else if(family==='iron'){
      ctx.moveTo(-50,-23);ctx.lineTo(31,-22);ctx.quadraticCurveTo(42,-18,38,-4);ctx.lineTo(28,21);ctx.lineTo(-47,21);ctx.quadraticCurveTo(-55,17,-50,-23);ctx.closePath();
    }else{
      ctx.moveTo(-48,-15);ctx.quadraticCurveTo(-52,-22,-35,-23);ctx.lineTo(23,-15);ctx.quadraticCurveTo(40,-9,33,12);ctx.lineTo(-42,14);ctx.closePath();
    }
  };
  ctx.save();ctx.translate(5,8);headPath();ctx.fillStyle='#263c34';ctx.fill();ctx.strokeStyle='#162b26';ctx.lineWidth=2;ctx.stroke();ctx.restore();
  ctx.fillStyle=head;ctx.strokeStyle=tier>=4?'#ffe9ad':'#f8e4b7';ctx.lineWidth=3;headPath();
  ctx.fill();ctx.stroke();
  ctx.strokeStyle='#fff6dbbb';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-44,-21);ctx.quadraticCurveTo(-3,-30,28,-21);ctx.stroke();
  ctx.strokeStyle='#172c2788';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-45,14);ctx.quadraticCurveTo(-10,23,25,16);ctx.stroke();
  // The shaft and striking face change silhouette with club family; the large
  // shop emblem and tier inlays make each equipped purchase recognizable.
  ctx.strokeStyle='#fff8e9bb';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(-37,-11);ctx.lineTo(20,-12);ctx.stroke();
  if(family==='driver'){
    ctx.fillStyle=grip;ctx.beginPath();ctx.moveTo(-49,-14);ctx.lineTo(-63,-24);ctx.lineTo(-51,3);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#fff3d5';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(31,-16);ctx.lineTo(42,-6);ctx.stroke();
  }else if(family==='wedge'){
    ctx.strokeStyle='#fff3df';ctx.lineWidth=3;for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(-37+i*16,6);ctx.lineTo(-43+i*16,15);ctx.stroke();}
  }else if(family==='iron'){
    ctx.strokeStyle='#fff1d5';ctx.lineWidth=2;for(let i=0;i<3;i++){ctx.beginPath();ctx.moveTo(-36,-5+i*6);ctx.lineTo(-16,-5+i*6);ctx.stroke();}
  }
  ctx.fillStyle='#fff9e6';ctx.strokeStyle=grip;ctx.lineWidth=1;
  ctx.font=`900 ${tier>=4?24:21}px Outfit`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.strokeText(mark,12,0);ctx.fillText(mark,12,0);
  if(tier>=7){
    ctx.fillStyle='#233d39';ctx.beginPath();ctx.roundRect(-49,-10,42,19,6);ctx.fill();
    ctx.strokeStyle='#fff0c2';ctx.lineWidth=1.2;ctx.stroke();
    ctx.fillStyle='#fff6d8';ctx.font='800 12px Outfit';ctx.textAlign='center';ctx.fillText(String(tier),-28,0,37);
  }
  if(tier>=2){ctx.fillStyle='#fff2c5';for(let i=0;i<Math.min(tier,5);i++){ctx.beginPath();ctx.arc(-38+i*8,7,2.1,0,7);ctx.fill();}}
  if(tier>=5){ctx.fillStyle='#fff8d7';for(const [x,y] of [[-65,-26],[48,-31],[51,16]]){ctx.beginPath();ctx.arc(x,y,2+Math.sin(t*.006+x)*.8,0,7);ctx.fill();}}
  ctx.restore();
}
function aimWorldDirection(vector){
  const p=project(START.x,START.y,START.z), px=project(START.x+.1,START.y,START.z), pz=project(START.x,START.y,START.z+.1);
  const a=(px.x-p.x)*10,b=(pz.x-p.x)*10,c=(px.y-p.y)*10,d=(pz.y-p.y)*10;
  const det=a*d-b*c;
  if(Math.abs(det)<.001||Math.hypot(vector.x,vector.y)<5)return {...courseForward};
  let dx=(vector.x*d-b*vector.y)/det,dz=(a*vector.y-vector.x*c)/det;
  const n=Math.hypot(dx,dz)||1;return{x:dx/n,z:dz/n};
}
function initialFlight(p,vector){
  const dir=aimWorldDirection(vector);
  const intendedDistance=.15+Math.max(0,Math.min(100,p))/100*3.5;
  const distance=intendedDistance,wall=null;
  const end={x:START.x+dir.x*distance,y:.23,z:START.z+dir.z*distance};
  const angle=Math.acos(Math.max(-1,Math.min(1,dir.x*courseForward.x+dir.z*courseForward.z)));
  return{dir,end,wall,distance,intendedDistance,offAngle:angle};
}
function drawAim(){
  if(!dragging||!dragOrigin||!dragNow)return;
  const vector={x:dragOrigin.x-dragNow.x,y:dragOrigin.y-dragNow.y};
  const preview=initialFlight(power,vector),start=project(START.x,START.y,START.z),end=project(preview.end.x,.24,preview.end.z);
  ctx.save();ctx.strokeStyle='#fff9dc';ctx.lineWidth=4;ctx.setLineDash([10,9]);ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.setLineDash([]);
  ctx.fillStyle='#bf5a2c';ctx.strokeStyle='#fff5d8';ctx.lineWidth=3;ctx.beginPath();ctx.arc(end.x,end.y,9,0,Math.PI*2);ctx.fill();ctx.stroke();
  const label=preview.wall?'WALL IN PLAY':power<25?'WIND CAN HELP':`${Math.round(power)}% POWER`;
  ctx.font='800 14px Outfit';ctx.textAlign='center';const labelY=Math.min(stage.height-155,Math.max(270,end.y-19));
  const tw=ctx.measureText(label).width;ctx.fillStyle='#173e32e0';ctx.beginPath();ctx.roundRect(end.x-tw/2-11,labelY-17,tw+22,24,8);ctx.fill();ctx.fillStyle='#fff5d8';ctx.fillText(label,end.x,labelY);
  ctx.restore();
}
function drawParticles(dt){sparkles=sparkles.filter(p=>p.life>0);for(const p of sparkles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.02*dt;p.life-=dt;ctx.save();ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.translate(p.x,p.y);ctx.rotate(p.life*.04);ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);ctx.restore();}}
function sparkleBurst(x,y,count=20){const colors=['#bf5a2c','#f3c36b','#fff0cc','#5aac83'];for(let i=0;i<count;i++){const a=Math.PI*2*i/count,s=1+Math.random()*3;sparkles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,life:60,max:60,size:2+Math.random()*4,color:colors[i%colors.length]});}}
function drawDepthObjects(t){
  const objects=layout.features.map(f=>movingFeature(f,t/1000));
  for(const item of layout.trees)objects.push({...item,y:layout.heightAt(item.x,item.z),kind:'tree'});
  if(shot?.mole?.active)objects.push({...shot.mole,kind:'mole',y:layout.heightAt(shot.mole.x,shot.mole.z)});
  const backstop=backstopGeometry();
  objects.push({kind:'backstop',x:backstop.x,y:layout.heightAt(backstop.x,backstop.z)+backstop.height*.5,z:backstop.z});
  objects.push({kind:'cup',x:CUP.x,y:.04,z:CUP.z},{kind:'ball',x:ball.x,y:ball.y,z:ball.z});
  objects.sort((a,b)=>cameraDepth(b)-cameraDepth(a));
  for(const item of objects){
    if(item.kind!=='ball'&&cameraDepth(item)<.45)continue;
    if(item.kind==='cup')drawHole(t);
    else if(item.kind==='backstop')drawBackstop();
    else if(item.kind==='ball')drawBall(t);
    else if(item.kind==='bumper')drawBumper(item);
    else if(item.kind==='pad')drawPad(item,t);
    else if(item.kind==='loop')drawLoop(item);
    else if(item.kind==='windmill')drawWindmill(item,t);
    else if(item.kind==='bridge')drawBridge(item);
    else if(item.kind==='cannon')drawCannon(item);
    else if(item.kind==='mole')drawMole(item);
    else if(item.kind==='tree')tree(item.x,item.z,item.scale);
  }
}
function drawNearRails(){
  const depth=cameraDepth(ball);
  const segments=[];
  for(const side of [-1,1])for(let i=0;i<60;i++){
    const t=.10+.87*i/60,u=.10+.87*(i+1)/60;
    const a=courseEdge(t,side*layout.corridorHalfWidth(t));
    const b=courseEdge(u,side*layout.corridorHalfWidth(u));
    if((cameraDepth(a)+cameraDepth(b))/2>=depth)continue;
    segments.push({side,t,u,depth:(cameraDepth(a)+cameraDepth(b))/2});
  }
  segments.sort((a,b)=>b.depth-a.depth);
  for(const s of segments)drawRailSegment(s.side,s.t,s.u);
}
function frame(now){
  const frameMs=Math.max(0,now-animatedAt);
  const dt=Math.min(3,frameMs/16.67);animatedAt=now;stage.time=now;
  // Keep ball, moving colliders, and follow camera on the same simulation
  // clock. A slow frame can catch up without taking a visible giant step.
  if(phase==='running')updateShot(Math.min(.12,frameMs/1000));else stage.featureTime=now/1000;
  updateCamera(now);
  if(renderer3D){
    renderer3D.render({layout,camera,ball,shot,progress:savedProgress,featureTime:stage.featureTime,
      stage,movingFeature,phase,courseState,riverCenter,bridgeDeckHeight,cupBowlDrop,courseSurfaceAt,
      ballStyle:window.BallUpgrades?.get(savedProgress.equippedBall),
      clubStyle:clubAppearance(savedProgress.equipped)});
    ctx.clearRect(0,0,stage.width,stage.height);
    drawRescueEffect(now);drawAim();drawParticles(dt);
  }else{
    background(now);drawStage();drawBanks();drawBunker();drawFairway();drawWater(now);
    drawSlopeGuides();drawDetails(now);drawCorridorRails();drawDepthObjects(stage.featureTime*1000);
    drawNearRails();drawRescueEffect(now);drawAim();drawClub(now);drawParticles(dt);
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function showCallout(message, icon='✦', duration=1300){
  const callout=$('event-callout');
  $('callout-text').textContent=message;
  $('callout-icon').textContent=icon;
  callout.classList.add('visible');
  // Restart the entrance for every new event, including events that arrive
  // while the previous callout is still on screen.
  callout.classList.remove('popping');
  void callout.offsetWidth;
  callout.classList.add('popping');
  callout.onanimationend=event=>{if(event.target===callout)callout.classList.remove('popping');};
  clearTimeout(calloutTimer);
  calloutTimer=setTimeout(()=>callout.classList.remove('visible','popping'),duration);
}
function setPower(value){power=Math.max(0,Math.min(100,value));$('shot-percent').textContent=`${Math.round(power)}%`;$('power-fill').style.width=`${power}%`;$('shot-instruction').textContent=power<25?'A little goes a long way…':power<70?'Looking good. Let it fly.':'This is going to be BIG.'}
function pointerPos(e){const r=scene.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
gameShell.addEventListener('pointerdown',e=>{
  if(phase!=='ready'||dragging||e.target.closest?.('button,a,[role="dialog"]'))return;
  e.preventDefault();dragging=true;activePointerId=e.pointerId;
  dragOrigin=pointerPos(e);dragNow=dragOrigin;
  try{gameShell.setPointerCapture(e.pointerId)}catch(_){/* Window release still finishes the shot. */}
  setPower(0);
});
function moveShotPointer(e){
  if(!dragging||e.pointerId!==activePointerId)return;
  dragNow=pointerPos(e);
  setPower(Math.hypot(dragNow.x-dragOrigin.x,dragNow.y-dragOrigin.y)/1.65);
}
function releaseShotPointer(e){
  if(!dragging||e.pointerId!==activePointerId)return;
  e.preventDefault();dragNow=pointerPos(e);
  const vector={x:dragOrigin.x-dragNow.x,y:dragOrigin.y-dragNow.y};
  setPower(Math.hypot(vector.x,vector.y)/1.65);
  dragging=false;activePointerId=null;startShot(power,vector);
}
function cancelShotPointer(e){
  if(e.pointerId!==activePointerId)return;
  dragging=false;activePointerId=null;setPower(0);
}
gameShell.addEventListener('pointermove',moveShotPointer);
gameShell.addEventListener('pointerup',releaseShotPointer);
gameShell.addEventListener('pointercancel',cancelShotPointer);
window.addEventListener('pointermove',moveShotPointer);
window.addEventListener('pointerup',releaseShotPointer);
window.addEventListener('pointercancel',cancelShotPointer);
function mix(a,b,t){return a+(b-a)*t}
function smooth(t){return t*t*(3-2*t)}
// The ball is integrated from its velocity. The green is a shallow visible bowl
// around the cup; its downhill force, drag, gusts, and real contacts do the rescuing.
function ballPhysicsProfile(id){
  const raw=window.BallUpgrades?.get(id)?.stats;
  const [bounce,spin,roll]=Array.isArray(raw)&&raw.length===3?raw:[4,4,5];
  // Two easing scales make early upgrades tangible while every later tier
  // still contributes. The resulting physical coefficients remain bounded.
  const b=gearGrowth(bounce,4),sp=gearGrowth(spin,4),r=gearGrowth(roll,5);
  return{
    wallRestitution:.73+b*.15,
    bumperRestitution:.79+b*.10,
    groundRestitution:.22+b*.11,
    launchMultiplier:1+r*.25,
    dragMultiplier:1-r*.16,
    spinRate:sp*.10,
    liftMultiplier:1+b*.16
  };
}
function gearGrowth(value,base=4){
  const delta=Math.max(0,(Number(value)||base)-base);
  return .6*(1-Math.exp(-delta/5))+.4*(1-Math.exp(-delta/350));
}
const curatedClubStats={
  rookie:[4,4,4],meteor:[7,4,3],cloud:[5,8,4],lightning:[6,5,8],
  orbit:[8,6,6],lotus:[6,9,6],volt:[8,6,9],nebula:[9,8,8],rocket:[10,10,7],
  aurora:[8,9,10],wildfire:[11,8,10],starlift:[9,12,10],ripple:[10,10,12],
  thunderhead:[13,10,11],sunforge:[11,14,10],mirage:[11,11,14],
  supernova:[16,12,13],skycrown:[13,16,12],kaleido:[12,13,16]
};
function clubPhysicsProfile(id){
  const generated=/^club-t(\d+)-([abc])$/.exec(id||'');
  const item=generated?window.GearProgression?.club(Number(generated[1]),'abc'.indexOf(generated[2])):null;
  const [distance,height,tricks]=item?.stats||curatedClubStats[id]||curatedClubStats.rookie;
  return{speedMultiplier:1+.18*gearGrowth(distance),
    heightMultiplier:1+.22*gearGrowth(height),
    spinMultiplier:1+.22*gearGrowth(tricks)};
}
function cupDirection(){const x=CUP.x-ball.x,z=CUP.z-ball.z,n=Math.hypot(x,z)||1;return{x:x/n,z:z/n,distance:n};}
function setEffect(kind,x,z,seconds=1){if(!shot)return;shot.effect={kind,x,z,until:shot.elapsed+seconds};}
function contactEvent(kind,x,z,label,icon='✳'){
  setEffect(kind,x,z,1.25);showCallout(label,icon,1000);
  const p=project(x,.25,z);sparkleBurst(p.x,p.y,20);
}
function reflectWall(axis,limit){
  const inward=axis==='x'?(limit===layout.bounds.minX?1:-1):(limit===layout.bounds.minZ?1:-1);
  ball[axis]=limit+inward*BALL_RADIUS;
  if(shot.velocity[axis]*inward<0)shot.velocity[axis]*=-shot.ballProfile.wallRestitution;
  if(shot.elapsed-shot.lastWall>.42){shot.lastWall=shot.elapsed;contactEvent('bank',ball.x,ball.z,'BANK SHOT!','✳');}
}
function contactBumper(x,z,radius,baseY=layout.heightAt(x,z),kind='bumper',height=.74){
  if(ball.y>baseY+height+BALL_RADIUS)return;
  const dx=ball.x-x,dz=ball.z-z,d=Math.hypot(dx,dz);
  if(d>=radius)return;
  const nx=d>.001?dx/d:1,nz=d>.001?dz/d:0,into=shot.velocity.x*nx+shot.velocity.z*nz;
  ball.x=x+nx*radius;ball.z=z+nz*radius;
  if(into<0){shot.velocity.x-=(1+shot.ballProfile.bumperRestitution)*into*nx;shot.velocity.z-=(1+shot.ballProfile.bumperRestitution)*into*nz;}
  if(shot.elapsed-shot.lastBumper>.5){
    shot.velocity.x+=nx*.35;shot.velocity.z+=nz*.35;shot.lastBumper=shot.elapsed;
    const names={windmill:'WINDMILL BANK!',tree:'TREE TRICK!',bumper:'BUMPER BONUS!'};
    contactEvent(kind,x,z,names[kind]||'BANK SHOT!','✳');
  }
}
function contactFlagPole(){
  const x=CUP.x+.72,z=CUP.z,radius=.07+BALL_RADIUS;
  if(ball.y>layout.heightAt(x,z)+cupBowlDrop(x,z)+2.15+BALL_RADIUS)return;
  const dx=ball.x-x,dz=ball.z-z,d=Math.hypot(dx,dz);
  if(d>=radius)return;
  const nx=d>.001?dx/d:-1,nz=d>.001?dz/d:0;
  ball.x=x+nx*radius;ball.z=z+nz*radius;
  const v=shot.velocity,into=v.x*nx+v.z*nz;
  if(into<-.01){
    // A slender flagpole taps the ball back softly. It never gives the ball
    // energy or repeats the generic bumper's outward kick near the cup.
    v.x=(v.x-1.22*into*nx)*.86;
    v.z=(v.z-1.22*into*nz)*.86;
    if(!shot.flagTouched){shot.flagTouched=true;setEffect('flag',x,z,.45);}
  }
}
function contactBoost(kind,feature,radiusX,radiusZ,impulse,lift,label){
  if(shot.usedBoosts.has(kind))return;
  const x=feature.x,z=feature.z,baseY=layout.heightAt(x,z);
  // Pads and cannon plinths fire only when the ball touches their visible top.
  const contactTop=feature.kind==='pad'?.06:.08;
  if(((ball.x-x)/radiusX)**2+((ball.z-z)/radiusZ)**2>1||
     ball.y>baseY+contactTop+BALL_RADIUS+.035)return;
  const ahead=pathTangent(feature.t);
  shot.velocity.x+=ahead.x*impulse;shot.velocity.z+=ahead.z*impulse;
  shot.velocity.y=Math.max(shot.velocity.y,lift*shot.ballProfile.liftMultiplier);shot.usedBoosts.add(kind);
  contactEvent(kind,x,z,label,'✹');
}
function contactCannon(feature){
  if(shot.usedBoosts.has(feature.id)||shot.cannon?.stage==='loading'||shot.cannon?.stage==='chambered')return;
  const base=layout.heightAt(feature.x,feature.z);
  const loc=localCoordinates(feature,ball.x,ball.z);
  if((loc.along/.64)**2+(loc.across/.5)**2>1||ball.y>base+.08+BALL_RADIUS+.035)return;
  const dir=pathTangent(feature.t);
  const rear={x:feature.x-dir.x*.47,y:base+.56,z:feature.z-dir.z*.47};
  const muzzle={x:feature.x+dir.x*.59,y:base+.73,z:feature.z+dir.z*.59};
  shot.cannon={id:feature.id,startedAt:shot.elapsed,duration:.55,stage:'loading',
    feature:{x:feature.x,z:feature.z,t:feature.t},capture:{...ball},rear,muzzle,dir,
    entrySpeed:Math.hypot(shot.velocity.x,shot.velocity.z)};
  shot.usedBoosts.add(feature.id);
  shot.velocity.x=0;shot.velocity.y=0;shot.velocity.z=0;
  shot.windActive=false;shot.riverActive=false;
  contactEvent('cannon',feature.x,feature.z,'CANNON LOADING','✹');
}
function advanceCannon(){
  const c=shot.cannon,age=shot.elapsed-c.startedAt;
  const from=age<.16?c.capture:age<.34?c.rear:c.muzzle;
  const to=age<.16?c.rear:c.muzzle;
  const t=age<.16?smooth(Math.max(0,age/.16)):
    age<.34?smooth((age-.16)/.18):1;
  ball.x=mix(from.x,to.x,t);ball.y=mix(from.y,to.y,t);ball.z=mix(from.z,to.z,t);
  c.stage=age<.34?'loading':'chambered';
  if(age>=c.duration){
    c.stage='fired';c.firedAt=shot.elapsed;
    const speed=Math.max(4.2,c.entrySpeed+3.7);
    shot.velocity.x=c.dir.x*speed;shot.velocity.z=c.dir.z*speed;
    shot.velocity.y=3*shot.ballProfile.liftMultiplier;
    contactEvent('cannon',c.muzzle.x,c.muzzle.z,'CANNON FIRED','✹');
  }
}
function contactLoop(feature){
  if(shot.usedBoosts.has(feature.id))return;
  const loc=localCoordinates(feature,ball.x,ball.z),ground=layout.heightAt(feature.x,feature.z);
  if(Math.abs(loc.along)>.24||Math.abs(loc.across)>.62||ball.y>ground+.56)return;
  const dir=pathTangent(feature.t);
  shot.velocity.x+=dir.x*1.8;shot.velocity.z+=dir.z*1.8;
  shot.velocity.y=Math.max(shot.velocity.y,1.6*shot.ballProfile.liftMultiplier);
  shot.usedBoosts.add(feature.id);contactEvent('loop',feature.x,feature.z,'THROUGH THE LOOP','✹');
}
function localCoordinates(feature,x,z){
  const dir=pathTangent(feature.t),across={x:-dir.z,z:dir.x};
  return{along:(x-feature.x)*dir.x+(z-feature.z)*dir.z,
    across:(x-feature.x)*across.x+(z-feature.z)*across.z,dir,normal:across};
}
function riverCenter(across){
  const span=layout.river?.span||3.2;
  return .18*Math.sin(Math.PI*across/span)+.07*Math.sin(3*Math.PI*across/span);
}
function cupBowlDrop(x,z){
  const radius=Math.hypot(x-CUP.x,z-CUP.z);
  const q=Math.max(0,1-(radius/3.3)**2);
  return -.12*q*q;
}
function riverRegion(x,z){
  if(!layout.river)return null;
  const loc=localCoordinates(layout.river,x,z);
  if(Math.abs(loc.across)>layout.river.span)return null;
  return{...loc,distance:Math.abs(loc.along-riverCenter(loc.across))};
}
function bridgeDeckHeight(feature,x,z){
  const loc=localCoordinates(feature,x,z);
  const ramp=Math.max(0,Math.min(1,(1.36-Math.abs(loc.along))/.28));
  return layout.heightAt(x,z)+.18*smooth(ramp);
}
function bridgeSurfaceAt(x,z,currentY){
  const bridge=layout.features.find(f=>f.kind==='bridge');
  if(!bridge)return null;
  const loc=localCoordinates(bridge,x,z);
  if(Math.abs(loc.along)>1.36||Math.abs(loc.across)>.78-BALL_RADIUS+.02)return null;
  const deck=bridgeDeckHeight(bridge,x,z);
  return currentY>=deck+BALL_RADIUS-.10?deck:null;
}
function courseSurfaceAt(x,z,currentY){
  const deck=bridgeSurfaceAt(x,z,currentY);
  if(deck!==null)return deck;
  const grade=layout.heightAt(x,z)+cupBowlDrop(x,z),river=riverRegion(x,z);
  if(!river)return grade;
  const edge=layout.river.halfWidth,bank=.22;
  const depth=river.distance<=edge?1:
    river.distance>=edge+bank?0:1-smooth((river.distance-edge)/bank);
  return grade-.10*depth;
}
function nearestPath(x,z){
  let t=Math.max(0,Math.min(1,(x-START.x)/layout.span));
  for(let i=0;i<4;i++){
    const p=layout.centerline(t),a=layout.centerline(Math.max(0,t-.002)),b=layout.centerline(Math.min(1,t+.002));
    const dx=(b.x-a.x)/.004,dz=(b.z-a.z)/.004;
    t=Math.max(0,Math.min(1,t+((x-p.x)*dx+(z-p.z)*dz)/(dx*dx+dz*dz||1)));
  }
  const p=layout.centerline(t),dir=pathTangent(t),normal={x:-dir.z,z:dir.x};
  return{t,across:(x-p.x)*normal.x+(z-p.z)*normal.z,normal};
}
function railContact(before){
  const here=nearestPath(ball.x,ball.z),prior=nearestPath(before.x,before.z);
  if(here.t<.10||here.t>.97)return;
  const width=layout.corridorHalfWidth(here.t),priorWidth=layout.corridorHalfWidth(prior.t);
  const inside=Math.abs(prior.across)<priorWidth;
  const target=width+(inside?-BALL_RADIUS:BALL_RADIUS);
  const penetration=inside?Math.abs(here.across)-target:target-Math.abs(here.across);
  if(penetration<=0)return;
  const side=Math.sign(here.across)||1,edgePoint=layout.pathPoint(here.t,side*width);
  if(ball.y>layout.heightAt(edgePoint.x,edgePoint.z)+layout.railHeightAt(here.t)+BALL_RADIUS)return;
  ball.x+=here.normal.x*side*penetration*(inside?-1:1);
  ball.z+=here.normal.z*side*penetration*(inside?-1:1);
  const out=shot.velocity.x*here.normal.x*side+shot.velocity.z*here.normal.z*side;
  if((inside&&out>0)||(!inside&&out<0)){shot.velocity.x-=(1+shot.ballProfile.wallRestitution)*out*here.normal.x*side;
    shot.velocity.z-=(1+shot.ballProfile.wallRestitution)*out*here.normal.z*side;}
  if(shot.elapsed-shot.lastWall>.42){shot.lastWall=shot.elapsed;contactEvent('bank',ball.x,ball.z,'RAIL BANK!','✳');}
}
function backstopContact(before){
  const wall=backstopGeometry(),v=shot.velocity;
  const relativeX=ball.x-wall.x,relativeZ=ball.z-wall.z;
  const along=relativeX*wall.tangent.x+relativeZ*wall.tangent.z;
  const across=relativeX*wall.normal.x+relativeZ*wall.normal.z;
  if(Math.abs(across)>wall.halfSpan+BALL_RADIUS)return;
  const priorAlong=(before.x-wall.x)*wall.tangent.x+(before.z-wall.z)*wall.tangent.z;
  const edgeAcross=Math.max(-wall.halfSpan,Math.min(wall.halfSpan,across));
  const edgeX=wall.x+wall.normal.x*edgeAcross,edgeZ=wall.z+wall.normal.z*edgeAcross;
  const top=layout.heightAt(edgeX,edgeZ)+cupBowlDrop(edgeX,edgeZ)+wall.height;
  if(ball.y>top+BALL_RADIUS)return;
  // A high shot can clear the rail and land behind it. The full hinged leaf
  // visibly folds toward the cup instead of trapping the ball on its rear face.
  const flapClearance=wall.halfSpan-BALL_RADIUS;
  if(Math.abs(across)<flapClearance&&priorAlong>wall.thickness&&along<wall.thickness+BALL_RADIUS+.035){
    if(shot.backstopFlapAt===undefined){shot.backstopFlapAt=shot.elapsed;contactEvent('bank',wall.x,wall.z,'FLAP RETURN!','✳');}
  }
  // Hold a rear arrival against the leaf while it visibly swings clear.
  if(shot.backstopFlapAt!==undefined&&Math.abs(across)<flapClearance&&
     shot.elapsed-shot.backstopFlapAt>=.22)return;
  // The rail's near face is at along=0; its timber cap occupies 0..thickness.
  // Resolve both faces so a shot that arrives from behind cannot pass through it.
  const front=priorAlong<=wall.thickness*.5;
  const contact=front?-BALL_RADIUS:wall.thickness+BALL_RADIUS;
  if((front&&along>=contact&&along<wall.thickness*.5)||
     (!front&&along<=contact&&along>wall.thickness*.5)){
    ball.x+=wall.tangent.x*(contact-along);
    ball.z+=wall.tangent.z*(contact-along);
    const inward=v.x*wall.tangent.x+v.z*wall.tangent.z;
    if((front&&inward>0)||(!front&&inward<0)){
      const restitution=shot.backstopFlapAt!==undefined&&!front?0:.43;
      v.x-=(1+restitution)*inward*wall.tangent.x;
      v.z-=(1+restitution)*inward*wall.tangent.z;
      if(!shot.backstopTouched){shot.backstopTouched=true;contactEvent('bank',ball.x,ball.z,'BACKSTOP SAVE!','✳');}
    }
  }
}
function bridgeContact(feature,before){
  let loc=localCoordinates(feature,ball.x,ball.z);
  const prior=localCoordinates(feature,before.x,before.z),base=layout.heightAt(ball.x,ball.z);
  const deck=bridgeDeckHeight(feature,ball.x,ball.z);
  if(Math.abs(loc.along)>1.36+BALL_RADIUS)return false;
  const sideWidth=Math.abs(loc.along)<1.03?.82:.78;
  const sideTop=Math.abs(loc.along)<1.03?base+.74:deck;
  if(ball.y<sideTop+BALL_RADIUS){
    const inside=Math.abs(prior.across)<sideWidth,target=sideWidth+(inside?-BALL_RADIUS:BALL_RADIUS);
    const penetration=inside?Math.abs(loc.across)-target:target-Math.abs(loc.across);
    if(penetration>0){
      const side=Math.sign(loc.across)||Math.sign(prior.across)||1;
      ball.x+=loc.normal.x*side*penetration*(inside?-1:1);
      ball.z+=loc.normal.z*side*penetration*(inside?-1:1);
      const out=shot.velocity.x*loc.normal.x*side+shot.velocity.z*loc.normal.z*side;
      if((inside&&out>0)||(!inside&&out<0)){
        shot.velocity.x-=(1+shot.ballProfile.wallRestitution)*out*loc.normal.x*side;
        shot.velocity.z-=(1+shot.ballProfile.wallRestitution)*out*loc.normal.z*side;
      }
      if(shot.elapsed-shot.lastWall>.42){shot.lastWall=shot.elapsed;contactEvent('bank',ball.x,ball.z,'BRIDGE BANK!','✳');}
      loc=localCoordinates(feature,ball.x,ball.z);
    }
  }
  // The continuous ramp/deck support is resolved in courseSurfaceAt.
  return true;
}
function riverContact(dt){
  const loc=riverRegion(ball.x,ball.z);
  if(!loc||loc.distance>layout.river.halfWidth)return false;
  const waterSurface=layout.heightAt(ball.x,ball.z)-.10;
  if(ball.y>waterSurface+BALL_RADIUS+.035||bridgeSurfaceAt(ball.x,ball.z,ball.y)!==null)return false;
  shot.velocity.x+=loc.normal.x*.95*dt;shot.velocity.z+=loc.normal.z*.95*dt;
  return true;
}
function windmillContact(feature,timeSeconds){
  const x=feature.x,z=feature.z,baseY=layout.heightAt(x,z),dx=ball.x-x,dz=ball.z-z;
  if(ball.y<baseY+2.15+BALL_RADIUS){
    const h=Math.max(0,Math.min(1,(ball.y-baseY)/2.1));
    const rx=mix(.54,.33,h)+BALL_RADIUS,rz=mix(.39,.2,h)+BALL_RADIUS;
    const q=Math.hypot(dx/rx,dz/rz);
    if(q<1){
      const nx0=dx/(rx*rx),nz0=dz/(rz*rz),length=Math.hypot(nx0,nz0)||1;
      const nx=nx0/length,nz=nz0/length,into=shot.velocity.x*nx+shot.velocity.z*nz;
      ball.x=x+(q>.001?dx/q:rx);ball.z=z+(q>.001?dz/q:0);
      if(into<0){shot.velocity.x-=(1+shot.ballProfile.wallRestitution)*into*nx;
        shot.velocity.z-=(1+shot.ballProfile.wallRestitution)*into*nz;}
      if(shot.elapsed-shot.lastBumper>.5){shot.lastBumper=shot.elapsed;contactEvent('windmill',x,z,'WINDMILL BANK!','✳');}
    }
  }
  const rotorZ=z+.32,hubY=baseY+1.72;
  if(Math.abs(ball.z-rotorZ)>BALL_RADIUS+.14||shot.elapsed-shot.lastBlade<.28)return;
  const a=timeSeconds*1.5+feature.phase;
  for(let i=0;i<4;i++){
    const angle=a+i*Math.PI/2,ux=Math.cos(angle),uy=Math.sin(angle);
    const vx=ball.x-x,vy=ball.y-hubY,radial=vx*ux+vy*uy,side=-vx*uy+vy*ux;
    if(radial<.15||radial>.93||Math.abs(side)>.16+BALL_RADIUS)continue;
    const nx=-uy*Math.sign(side||1),nz=Math.sign(ball.z-rotorZ||1)*.32;
    shot.velocity.x+=nx*1.15;shot.velocity.z+=nz*.6;shot.velocity.y+=uy*.7;
    shot.lastBlade=shot.elapsed;
    contactEvent('blade',ball.x,ball.z,'WINDMILL WHACK!','✳');break;
  }
}
function spawnMole(){
  const toCup=cupDirection(),v=shot.velocity,speed=Math.hypot(v.x,v.z);
  const incoming=speed>.18?{x:v.x/speed,z:v.z/speed}:{x:-toCup.x,z:-toCup.z};
  let nx=toCup.x-incoming.x,nz=toCup.z-incoming.z,n=Math.hypot(nx,nz);
  if(n<.12){nx=toCup.x;nz=toCup.z;n=1;}
  nx/=n;nz/=n;
  // Put the mound in the ball's predicted path, with enough overlap to strike
  // after its visible pop-up. Never place a decorative mole outside the lane.
  const lead=Math.min(1.25,Math.max(.65,speed*.1+.2));
  const x=ball.x+incoming.x*lead-nx*.28,z=ball.z+incoming.z*lead-nz*.28;
  const lane=nearestPath(x,z),width=layout.corridorHalfWidth(lane.t);
  const contactTime=Math.max(.09,(lead-.43)/Math.max(.8,speed));
  const predictedY=ball.y+v.y*contactTime-3.9*contactTime*contactTime;
  const teeMargin=lane.t>0||Math.hypot(x-START.x,z-START.z)<=3.6;
  const cupMargin=lane.t<1||Math.hypot(x-CUP.x,z-CUP.z)<=2;
  const canReach=teeMargin&&cupMargin&&Math.abs(lane.across)<=width+.45&&
    predictedY<=layout.heightAt(x,z)+.66;
  shot.lastMole=shot.elapsed;
  if(!canReach){
    // The gust is visible in the world/HUD, and changes velocity gradually.
    // It can guide a wildly off-course or airborne ball back to a place where
    // a real mound could meet it on a later pass.
    shot.gustAt=shot.elapsed;shot.lastGust=shot.elapsed;shot.gustStrength=4.8;
    contactEvent('wind',ball.x,ball.z,'CROSSWIND RESCUE','〰');
    return false;
  }
  shot.mole={x,z,normalX:nx,normalZ:nz,startedAt:shot.elapsed,contactAt:null,until:shot.elapsed+1.25,active:true};
  return true;
}
function moleContact(){
  const m=shot.mole;if(!m||!m.active)return;
  if(shot.elapsed>m.until){m.active=false;return;}
  if(shot.elapsed-m.startedAt<.09)return;
  const dx=ball.x-m.x,dz=ball.z-m.z,d=Math.hypot(dx,dz),r=.33+BALL_RADIUS;
  if(d>=r||ball.y>layout.heightAt(m.x,m.z)+.66||m.contactAt!==null)return;
  const nx=m.normalX,nz=m.normalZ;
  // A mole rises into the rolling ball; its spring changes velocity without
  // repositioning the ball, even if it emerged slightly late at high speed.
  const into=shot.velocity.x*nx+shot.velocity.z*nz;
  if(into<0){shot.velocity.x-=(1+shot.ballProfile.bumperRestitution)*into*nx;shot.velocity.z-=(1+shot.ballProfile.bumperRestitution)*into*nz;}
  shot.velocity.x+=nx*2.4;shot.velocity.z+=nz*2.4;shot.velocity.y=Math.max(shot.velocity.y,.6);
  m.contactAt=shot.elapsed;m.until=shot.elapsed+.7;
  contactEvent('mole',m.x,m.z,'MOLE SAVE!','✳');
}
function stepPhysics(dt){
  if(!shot||phase!=='running')return;
  shot.elapsed+=dt;
  const v=shot.velocity;
  if(shot.cannon&&(shot.cannon.stage==='loading'||shot.cannon.stage==='chambered')){
    advanceCannon();stage.featureTime=shot.start/1000+shot.elapsed;return;
  }
  if(shot.sinking){
    const fallDrag=Math.exp(-24*dt);v.x*=fallDrag;v.z*=fallDrag;v.y-=8*dt;
    ball.x+=v.x*dt;ball.z+=v.z*dt;ball.y+=v.y*dt;
    if(ball.y<shot.sinkFloor)finishShot();
    return;
  }
  const toCup=cupDirection(),dist=toCup.distance,speed=Math.hypot(v.x,v.z);
  const bowl=Math.max(0,1-dist/3.3),near=1/(1+Math.pow(dist/1.05,4));
  const slopeForce=bowl*(.4+2.7*bowl); // only within the drawn contour rings
  let drag=(.22+2.3*near)*shot.ballProfile.dragMultiplier;
  if(layout.theme>1){
    const sand=layout.pathPoint(.21,-1.62);
    if(((ball.x-sand.x)/.78)**2+((ball.z-sand.z)/.48)**2<1&&ball.y<layout.heightAt(ball.x,ball.z)+BALL_RADIUS+.08)
      drag+=1.15; // the visible sand patch slows a rolling ball
  }
  let ax=toCup.x*slopeForce-v.x*drag;
  let az=toCup.z*slopeForce-v.z*drag;
  // A real raised course changes the ball's speed along its visible hill/ramp.
  const groundHere=courseSurfaceAt(ball.x,ball.z,ball.y),groundAheadX=courseSurfaceAt(ball.x+.03,ball.z,ball.y),groundAheadZ=courseSurfaceAt(ball.x,ball.z+.03,ball.y);
  if(ball.y<=groundHere+BALL_RADIUS+.04){ax-=(groundAheadX-groundHere)/.03*3.8;az-=(groundAheadZ-groundHere)/.03*3.8;}
  // Side spin is set by the player's initial aim, then decays as the ball rolls.
  const spin=shot.spinSign*shot.ballProfile.spinRate*shot.clubProfile.spinMultiplier*Math.max(0,1-shot.elapsed/4);
  ax+=-v.z*spin;az+=v.x*spin;
  const headingToCup=(v.x*toCup.x+v.z*toCup.z)/(speed||1);
  if(dist>2.8&&shot.elapsed-shot.lastGust>3.1&&
     ((shot.power<24&&shot.elapsed>.45)||(shot.elapsed>1.1&&headingToCup<.3)||(shot.elapsed>2.2&&speed<1.3))){
    shot.gustAt=shot.elapsed;shot.lastGust=shot.elapsed;shot.gustStrength=1.05;
    contactEvent('wind',ball.x,ball.z,'TAILWIND TO THE RESCUE','〰');
  }
  const gustAge=shot.gustAt===null?-1:shot.elapsed-shot.gustAt;
  const assisted=gustAge>=0&&gustAge<2.65;
  shot.windActive=assisted;
  if(assisted){const ramp=Math.min(1,gustAge/.55),fade=Math.min(1,(2.65-gustAge)/.7);const strength=(shot.gustStrength||1.05)*ramp*fade;ax+=toCup.x*strength;az+=toCup.z*strength;}
  const lane=nearestPath(ball.x,ball.z),offLane=Math.abs(lane.across)>layout.corridorHalfWidth(lane.t)+.55;
  const outward=(v.x*lane.normal.x+v.z*lane.normal.z)*Math.sign(lane.across||1);
  const behindTee=ball.x<START.x-.4;
  const needsMole=dist>2.6&&shot.elapsed-shot.lastMole>1.9&&
    // A fast, sharply mis-aimed launch still gets a visible initial run, then
    // meets the mole before it can vanish into empty space off the open tee.
    ((shot.elapsed>.13&&speed>6&&Math.abs(lane.across)>.8&&outward>3)||
     (shot.elapsed>.15&&speed>6&&headingToCup<.3)||
     (shot.elapsed>.65&&(offLane||behindTee))||(shot.elapsed>1.1&&headingToCup<-.05)||
     (shot.elapsed>2.4&&speed<1.05)||(shot.elapsed>4.5&&headingToCup<.68));
  if(needsMole&&(!shot.mole||!shot.mole.active))spawnMole();
  v.x+=ax*dt;v.z+=az*dt;
  // Inside the painted cup contours, the shallow bowl gently turns the ball.
  // The turn rotates velocity only: it cannot add speed or alter the launch line.
  if(dist<2.3&&ball.y<=groundHere+BALL_RADIUS+.04){
    const horizontalSpeed=Math.hypot(v.x,v.z);
    if(horizontalSpeed>.12){
      const heading=Math.atan2(v.z,v.x),target=Math.atan2(toCup.z,toCup.x);
      const error=Math.atan2(Math.sin(target-heading),Math.cos(target-heading));
      const turnLimit=.8*Math.pow(1-dist/2.3,1.4)*dt;
      const turn=Math.max(-turnLimit,Math.min(turnLimit,error));
      v.x=Math.cos(heading+turn)*horizontalSpeed;
      v.z=Math.sin(heading+turn)*horizontalSpeed;
    }
  }
  v.y-=7.8*dt;
  const before={x:ball.x,z:ball.z};
  ball.x+=v.x*dt;ball.z+=v.z*dt;ball.y+=v.y*dt;
  const ground=courseSurfaceAt(ball.x,ball.z,ball.y)+BALL_RADIUS;
  if(ball.y<ground){ball.y=ground;if(v.y<-.9)v.y=-v.y*shot.ballProfile.groundRestitution;else v.y=0;}
  // Curved side rails begin beyond the open tee and have no end caps.
  railContact(before);
  backstopContact(before);
  const featureTime=shot.start/1000+shot.elapsed;
  stage.featureTime=featureTime;
  for(const raw of layout.features){
    const f=movingFeature(raw,featureTime),baseY=layout.heightAt(f.x,f.z);
    if(f.kind==='bumper')contactBumper(f.x,f.z,.37+BALL_RADIUS,baseY);
    if(f.kind==='pad')contactBoost(f.id,f,.78,.78,2.5,2.3,'LAUNCH PAD!');
    if(f.kind==='loop')contactLoop(f);
    if(f.kind==='cannon')contactCannon(f);
    if(f.kind==='windmill')windmillContact(f,featureTime);
    if(f.kind==='bridge')bridgeContact(f,before);
  }
  shot.riverActive=riverContact(dt);
  moleContact();
  for(const tree of layout.trees)contactBumper(tree.x,tree.z,.10*tree.scale+BALL_RADIUS,layout.heightAt(tree.x,tree.z),'tree',1.45*tree.scale);
  // The visible flagpole stands beyond the dark cup mouth.
  contactFlagPole();
  const remaining=cupDirection(),finalSpeed=Math.hypot(v.x,v.z);
  const cupY=layout.heightAt(CUP.x,CUP.z)+cupBowlDrop(CUP.x,CUP.z);
  if(remaining.distance<.32&&finalSpeed<1.2&&ball.y<=cupY+BALL_RADIUS+.045){
    shot.sinking=true;shot.sinkStartY=ball.y;shot.sinkFloor=cupY-.29;
    contactEvent('cup',CUP.x,CUP.z,'RIGHT IN THE CUP!','✦');
  }
}
function startShot(p,vector){
  if(phase!=='ready')return;
  const dir=aimWorldDirection(vector),strength=Math.max(0,Math.min(100,p));
  const ballProfile=ballPhysicsProfile(savedProgress.equippedBall);
  const clubProfile=clubPhysicsProfile(savedProgress.equipped);
  const pull=strength/100;
  // A full pull has a distinct burst, while short taps keep fine control.
  // Even the strongest gear stays below one ball radius of travel per 120 Hz
  // physics step, so narrow contacts remain detectable.
  const speed=(.3+pull*6.6+3.5*pull**3)*ballProfile.launchMultiplier*clubProfile.speedMultiplier;
  const cross=dir.x*courseForward.z-dir.z*courseForward.x;
  shot={start:performance.now(),elapsed:0,power:strength,ballProfile,clubProfile,spinSign:Math.abs(cross)<.03?0:Math.sign(cross),velocity:{x:dir.x*speed,y:strength/100*.45*clubProfile.heightMultiplier,z:dir.z*speed},
    windActive:false,riverActive:false,gustAt:null,lastGust:-10,lastMole:-10,lastBlade:-10,mole:null,effect:null,lastWall:-10,lastBumper:-10,usedBoosts:new Set(),sinking:false,lastTrail:0,lastCue:''};
  phase='running';$('shot-dock').classList.add('hidden');
  showCallout(strength<24?'A GENTLE TAP':'LET IT FLY!',strength<24?'〰':'↗',800);setPower(0);
}
function updateShot(elapsedSeconds){
  if(!shot)return;
  const seconds=Math.max(0,Math.min(.12,elapsedSeconds));
  if(seconds>0){
    const steps=Math.ceil(seconds/(1/120));
    for(let i=0;i<steps&&phase==='running';i++)stepPhysics(seconds/steps);
  }
  if(!shot)return;
  if(shot.windActive){const p=project(ball.x,ball.y,ball.z);$('wind-streaks').style.left=`${p.x-135}px`;$('wind-streaks').style.top=`${p.y-100}px`;$('wind-streaks').classList.add('active');}
  else $('wind-streaks').classList.remove('active');
  if(shot.elapsed-shot.lastTrail>.045){trail.push({...ball});if(trail.length>17)trail.shift();shot.lastTrail=shot.elapsed;}
  if(shot.riverActive&&shot.lastCue!=='river'){shot.lastCue='river';showCallout('THE RIVER HELPS','≈',1000);}
}
function finishShot(){phase='complete';$('wind-streaks').classList.remove('active');const base=140+35*courseState.level+30*layout.features.length+Math.round(8*layout.span);const bonus=Math.min(50,Math.round(shot.power*.5));const reward=base+bonus;savedProgress=readProgress();savedProgress.xp=Math.max(0,Number(savedProgress.xp)||0)+reward;savedProgress.holeCount=Math.max(0,Number(savedProgress.holeCount)||0)+1;courseState.completed=true;save(PROGRESS_KEY,savedProgress);save(COURSE_KEY,courseState);updateHud();const p=project(CUP.x,.3,CUP.z);sparkleBurst(p.x,p.y,40);showCelebration(true,reward);shot=null;}
function showCelebration(animate,reward){$('celebration-total').textContent=`${Math.round(savedProgress.xp).toLocaleString()} XP`;$('reward-xp').textContent=reward?`+${reward.toLocaleString()} XP`:'PERFECT SHOT';$('celebration-story').textContent=themeLevel()===1?'That ball knew exactly where it was going.':themeLevel()>=5?'What a ride. And somehow, exactly as planned.':'A little chaos. A lot of perfect aim.';$('celebration').hidden=false;$('shot-dock').classList.add('hidden');if(animate)burstConfetti();}
function burstConfetti(){const layer=$('confetti');layer.innerHTML='';const colors=['#bf5a2c','#ecab6f','#f4d27a','#8ec9a0','#ffffff','#729bb2'];for(let i=0;i<130;i++){const el=document.createElement('i');el.style.setProperty('--x',`${Math.random()*100}%`);el.style.setProperty('--w',`${4+Math.random()*8}px`);el.style.setProperty('--h',`${7+Math.random()*13}px`);el.style.setProperty('--c',colors[i%colors.length]);el.style.setProperty('--d',`${2.2+Math.random()*2}s`);el.style.setProperty('--delay',`${Math.random()*.6}s`);el.style.setProperty('--drift',`${(Math.random()-.5)*340}px`);el.style.setProperty('--rot',`${300+Math.random()*900}deg`);layer.appendChild(el);}setTimeout(()=>layer.innerHTML='',5000);}
$('next-hole').addEventListener('click',()=>{courseState={level:courseState.level+1,completed:false};setLayout(courseState.level);save(COURSE_KEY,courseState);phase='ready';ball={...START};trail=[];shot=null;$('celebration').hidden=true;$('shot-dock').classList.remove('hidden');updateHud();showCallout('A NEW ADVENTURE','✳',1300)});
