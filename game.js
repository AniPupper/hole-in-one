const PROGRESS_KEY = 'hole-in-one-progress-v1';
const COURSE_KEY = 'hole-in-one-course-v1';
const START = { x: -4.15, y: .23, z: 2.65 };
const CUP = { x: 4.03, y: .04, z: -2.35 };
const clubNames = { rookie: 'The Rookie', meteor: 'The Comet', cloud: 'Cloud Nine', lightning: 'The Spark', orbit: 'Orbit Driver', lotus: 'Lotus Launcher', volt: 'Volt Viper', nebula: 'The Nebula', rocket: 'Rocket Club', aurora: 'Aurora Ace' };
const clubColors = { rookie: '#be8057', meteor: '#bf5a2c', cloud: '#71b6bd', lightning: '#9d70b6', orbit: '#7caa81', lotus: '#ca7499', volt: '#a7a247', nebula: '#686cb2', rocket: '#d46642', aurora: '#5ba997' };
const courseNames = ['The First Green', 'The Friendly Bumper', 'Little Launch', 'The Sky Loop', 'Driftwood River', 'Cannonball Corner', 'The Grand Detour'];
const courseSubtitles = ['One little green. One perfectly impossible shot.', 'A gentle nudge in exactly the right direction.', 'The sky is just another shortcut.', 'Round and round, then straight to glory.', 'The current has excellent aim.', 'Some shots call for a cannon.', 'Every shortcut in the world, all at once.'];
const scene = document.getElementById('scene');
const ctx = scene.getContext('2d');
const $ = (id) => document.getElementById(id);
const stage = { width: 0, height: 0, dpr: 1, time: 0 };
let savedProgress = readProgress();
let courseState = readCourse();
let dragging = false;
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
  const fallback = { xp: 1240, holeCount: 4, equipped: 'rookie', claimed: [], owned: ['rookie'] };
  try {
    const data = JSON.parse(localStorage.getItem(PROGRESS_KEY));
    if (data && Number.isFinite(data.xp) && Number.isInteger(data.holeCount)) return { ...fallback, ...data };
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
function shortName() { return courseNames[themeLevel() - 1]; }
function updateHud() {
  $('xp-total').textContent = Math.round(savedProgress.xp).toLocaleString();
  $('streak-count').textContent = savedProgress.holeCount.toLocaleString();
  $('club-name').textContent = clubNames[savedProgress.equipped] || clubNames.rookie;
  $('hole-number').textContent = String(courseState.level).padStart(2, '0');
  $('course-name').textContent = shortName();
  $('course-subtitle').textContent = courseSubtitles[themeLevel() - 1];
  $('world-number').textContent = String(Math.floor((courseState.level - 1) / 7) + 1).padStart(2, '0');
  $('hole-progress-text').textContent = `${String(courseState.level).padStart(2, '0')} / 40 TO LEGEND`;
  $('hole-progress-fill').style.width = `${Math.min(100, courseState.level / 40 * 100)}%`;
  $('weather-name').textContent = courseState.level === 1 ? 'Calm & sunny' : courseState.level >= 5 ? 'Magic in the air' : 'A helpful breeze';
  $('weather-icon').textContent = courseState.level === 1 ? '☀' : '〰';
}
function resize() {
  const rect = scene.getBoundingClientRect();
  stage.width = rect.width;
  stage.height = rect.height;
  stage.dpr = Math.min(window.devicePixelRatio || 1, 2);
  scene.width = Math.round(rect.width * stage.dpr);
  scene.height = Math.round(rect.height * stage.dpr);
  ctx.setTransform(stage.dpr, 0, 0, stage.dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();
updateHud();
if (courseState.completed) showCelebration(false);

// A low camera sits just behind the ball, then eases forward to follow its flight.
const courseVector = { x: CUP.x - START.x, z: CUP.z - START.z };
const courseLength = Math.hypot(courseVector.x, courseVector.z);
const courseForward = { x: courseVector.x / courseLength, z: courseVector.z / courseLength };
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
  const startEye={x:START.x-courseForward.x*3,y:2.35,z:START.z-courseForward.z*3};
  const startTarget={x:START.x+courseForward.x*5,y:.35,z:START.z+courseForward.z*5};
  if(phase!=='running'||!shot){placeCamera(startEye,startTarget);return;}
  const elapsed=now-shot.start;
  const follow=smooth(Math.max(0,Math.min(1,(elapsed-650)/950)));
  const movingEye={x:ball.x-courseForward.x*3,y:2.35+ball.y*.35,z:ball.z-courseForward.z*3};
  const movingTarget={x:ball.x+courseForward.x*4.4,y:.35+ball.y*.25,z:ball.z+courseForward.z*4.4};
  placeCamera({x:mix(startEye.x,movingEye.x,follow),y:mix(startEye.y,movingEye.y,follow),z:mix(startEye.z,movingEye.z,follow)},
              {x:mix(startTarget.x,movingTarget.x,follow),y:mix(startTarget.y,movingTarget.y,follow),z:mix(startTarget.z,movingTarget.z,follow)});
}
function project(x,y,z) {
  const rel={x:x-camera.eye.x,y:y-camera.eye.y,z:z-camera.eye.z};
  const depth=Math.max(.45,rel.x*camera.forward.x+rel.y*camera.forward.y+rel.z*camera.forward.z);
  const focal=Math.min(stage.height*.76,stage.width*1.4);
  const horizontal=rel.x*camera.right.x+rel.y*camera.right.y+rel.z*camera.right.z;
  const vertical=rel.x*camera.up.x+rel.y*camera.up.y+rel.z*camera.up.z;
  return {x:stage.width*.5+horizontal*focal/depth,y:stage.height*.42-vertical*focal/depth,scale:focal/depth,depth};
}
placeCamera({x:START.x-courseForward.x*3,y:2.35,z:START.z-courseForward.z*3},{x:START.x+courseForward.x*5,y:.35,z:START.z+courseForward.z*5});
function pathWorld(points, y = 0) {
  ctx.beginPath();
  points.forEach((p, i) => { const q = project(p.x, p.y ?? y, p.z); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
  ctx.closePath();
}
function poly(points, fill, stroke, lineWidth = 1) { pathWorld(points); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lineWidth; ctx.stroke(); } }
function lineWorld(points, color, width, dash = []) {
  ctx.beginPath(); points.forEach((p, i) => { const q = project(p.x, p.y, p.z); if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y); });
  ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
}
function ellipseWorld(x, y, z, rx, rz, fill, stroke, width = 1) {
  const pts = []; for (let i = 0; i <= 36; i++) { const a = i * Math.PI * 2 / 36; pts.push({ x: x + rx * Math.cos(a), y, z: z + rz * Math.sin(a) }); }
  poly(pts, fill, stroke, width);
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
function centerline() {
  const points=[];
  for(let i=0;i<=36;i++) {const t=i/36;const x=START.x+(CUP.x-START.x)*t; const z=START.z+(CUP.z-START.z)*t + Math.sin(t*Math.PI*2)*(.18+(courseState.level>1?.18:0)); points.push({x,y:.04,z});}
  return points;
}
function ribbon(points,width,fill,stroke){const left=[],right=[];for(let i=0;i<points.length;i++){const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz)||1;left.push({x:points[i].x-dz/len*width/2,y:points[i].y,z:points[i].z+dx/len*width/2});right.push({x:points[i].x+dz/len*width/2,y:points[i].y,z:points[i].z-dx/len*width/2});}poly([...left,...right.reverse()],fill,stroke,stroke?1.5:0);}
function drawFairway(){const path=centerline();ribbon(path,2.75,'#5e9f6b','#4c8f62');const upper=path.map(p=>({...p,y:.055}));ribbon(upper,2.36,'#b9d38a','#f2e7a8');const inner=path.map(p=>({...p,y:.06}));ribbon(inner,1.83,'#d2dca0');lineWorld(inner.map((p,i)=>({...p,y:.07})).filter((_,i)=>i%3===0),'#f6e9ba72',2,[4,12]);}
function drawBunker(){ellipseWorld(-2.85,.04,-2.87,1.45,.66,'#d9c990','#f2ddab',3);ellipseWorld(-2.85,.05,-2.87,1.11,.39,'#e9d9a6');}
function drawWater(){if(courseState.level<5)return;const pts=[];for(let i=0;i<=24;i++){const t=i/24;pts.push({x:-1.8+t*4.4,y:.07,z:-1.85+Math.sin(t*5)*.4});}ribbon(pts,1.2,'#4ba6ac','#a0dcd3');lineWorld(pts.map(p=>({...p,y:.09})), '#d7f3db99',3,[10,9]);}
function tree(x,z,s=1){const p=project(x,.07,z);const top=project(x,1.45*s,z);const r=p.scale*.32*s;ellipseWorld(x,.065,z,.31*s,.2*s,'#417d5a57');ctx.strokeStyle='#816d45';ctx.lineWidth=Math.max(2,p.scale*.055)*s;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(top.x,top.y);ctx.stroke();const g=ctx.createRadialGradient(top.x-r*.35,top.y-r*.35,1,top.x,top.y,r*1.1);g.addColorStop(0,'#b8dba1');g.addColorStop(.7,'#438b68');g.addColorStop(1,'#2e705a');ctx.fillStyle=g;ctx.beginPath();ctx.arc(top.x,top.y,r,0,Math.PI*2);ctx.fill();ctx.fillStyle='#d7e4a1bb';ctx.beginPath();ctx.arc(top.x-r*.3,top.y-r*.25,r*.22,0,Math.PI*2);ctx.fill();}
function drawDetails(t){
  const trees=[[-5.25,-3.5,.95],[5.36,2.58,.86],[5.62,-3.65,.72],[-5.55,2.9,.68],[-3.65,-3.72,.62]];
  trees.forEach(([x,z,s])=>tree(x,z,s));
  for(let i=0;i<47;i++){let x=Math.sin(i*83.39)*5.75,z=Math.cos(i*24.74)*3.42;const near=Math.abs(z-(START.z+(CUP.z-START.z)*(x+4.15)/8.18));if(near<1.45)continue;const p=project(x,.09,z);ctx.fillStyle=i%3?'#f4e7aa':'#f2aa79';ctx.beginPath();ctx.arc(p.x,p.y,Math.max(1.1,p.scale*.035),0,Math.PI*2);ctx.fill();}
  for(let i=0;i<7;i++){let x=-4.9+i*1.5,z=-3.6;const p=project(x,.06,z);ctx.fillStyle='#eed599';ctx.beginPath();ctx.arc(p.x,p.y,1.8,0,7);ctx.fill();}
}
function drawPad(x,z,t){ellipseWorld(x,.09,z,.73,.65,'#b96142','#a44e37',3);ellipseWorld(x,.13,z,.52,.44,'#d87943','#ffe0a2',3);const p=project(x,.15,z);ctx.fillStyle='#fff6d1';ctx.font=`900 ${Math.max(16,p.scale*.55)}px Outfit`;ctx.textAlign='center';ctx.fillText('↗',p.x,p.y+4);const pulse=project(x,.12,z);ctx.strokeStyle=`rgba(241,150,80,${.25+.16*Math.sin(t*.004)})`;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(pulse.x,pulse.y,25+Math.sin(t*.004)*4,11+Math.sin(t*.004)*2,-.24,0,7);ctx.stroke();}
function drawBumper(x,z){ellipseWorld(x,.1,z,.47,.47,'#8b674c','#ead4aa',2);const p=project(x,.38,z);const r=Math.max(7,p.scale*.25);ctx.fillStyle='#bf5a2c';ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*.78,0,0,7);ctx.fill();ctx.fillStyle='#fff0c5';ctx.beginPath();ctx.ellipse(p.x-r*.2,p.y-r*.3,r*.33,r*.17,-.25,0,7);ctx.fill();}
function drawLoop(x,z){const pts=[];for(let i=0;i<=32;i++){const a=i/32*Math.PI*2;pts.push({x:x+Math.sin(a)*.8,y:1.15+Math.cos(a)*1.12,z});}lineWorld(pts,'#a25a3d',16);lineWorld(pts,'#f0ad68',9);const p=project(x,1.15,z);ctx.fillStyle='#fff2d3';ctx.beginPath();ctx.arc(p.x,p.y,5,0,7);ctx.fill();}
function drawCannon(x,z){const back=project(x-.52,.55,z+.18),front=project(x+.58,.72,z-.16);lineWorld([{x:x-.5,y:.57,z:z+.18},{x:x+.58,y:.75,z:z-.18}],'#6e6957',24);lineWorld([{x:x-.5,y:.57,z:z+.18},{x:x+.58,y:.75,z:z-.18}],'#bf5a2c',17);ctx.fillStyle='#503c35';ctx.beginPath();ctx.ellipse(front.x,front.y,11,7,-.2,0,7);ctx.fill();ellipseWorld(x,.1,z,.8,.52,'#a6815c','#705e4c',2);}
function drawFeatures(t){const l=themeLevel();if(l>=2)drawBumper(-1.55,1.2);if(l>=3)drawPad(.15,.12,t);if(l>=4)drawLoop(1.1,-.6);if(l>=6)drawCannon(-2.4,.45);if(l>=7){drawPad(-.1,-1.25,t);drawBumper(2.15,-1.4);}}
function drawHole(){const p=project(CUP.x,.08,CUP.z);ellipseWorld(CUP.x,.08,CUP.z,.38,.3,'#183f31','#f6e9be',4);ellipseWorld(CUP.x,.06,CUP.z,.22,.17,'#0e2d26');lineWorld([{x:CUP.x+.21,y:.08,z:CUP.z},{x:CUP.x+.21,y:1.92,z:CUP.z}], '#fff6df',4);const top=project(CUP.x+.21,1.92,CUP.z);const fl=project(CUP.x+1.07,1.67,CUP.z);const base=project(CUP.x+.21,1.46,CUP.z);ctx.fillStyle='#bf5a2c';ctx.beginPath();ctx.moveTo(top.x,top.y);ctx.lineTo(fl.x,fl.y);ctx.lineTo(base.x,base.y);ctx.closePath();ctx.fill();ctx.strokeStyle='#9f4a37';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#fff2cf';ctx.font=`900 ${Math.max(10,p.scale*.34)}px Outfit`;ctx.fillText('1',top.x+(fl.x-top.x)*.35,top.y+(base.y-top.y)*.56);}
function drawRescueEffect(t){
  if(phase!=='running'||!shot)return;
  const elapsed=t-shot.start,from=shot.launchMs,to=from+shot.approachMs+shot.rescueMs;
  if(elapsed<from-180||elapsed>to+500)return;
  const p=project(shot.anchor.x,.12,shot.anchor.z),q=project(shot.exit.x,.18,shot.exit.z);
  const pulse=1+Math.sin(t*.014)*.12,r=Math.max(15,Math.min(64,p.scale*.23))*pulse;
  ctx.save();ctx.globalAlpha=elapsed>to?Math.max(0,1-(elapsed-to)/500):.85;
  ctx.strokeStyle=shot.kind==='wind'?'#a9f3dc':'#f7c27a';ctx.lineWidth=3;
  ctx.beginPath();ctx.ellipse(p.x,p.y,r,r*.42,-.22,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.ellipse(p.x,p.y,r*.67,r*.27,-.22,0,Math.PI*2);ctx.stroke();
  ctx.setLineDash([7,8]);ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.quadraticCurveTo((p.x+q.x)/2,(p.y+q.y)/2-35,q.x,q.y);ctx.stroke();ctx.setLineDash([]);
  ctx.restore();
}
function drawBall(t){const p=project(ball.x,ball.y,ball.z);const ground=project(ball.x,.07,ball.z);const r=Math.max(5,p.scale*.19);ctx.save();ctx.fillStyle='rgba(22,66,42,.25)';ctx.beginPath();ctx.ellipse(ground.x+3,ground.y+2,r*1.3,r*.55,0,0,7);ctx.fill();ctx.restore();for(let i=0;i<trail.length;i++){const tr=trail[i],q=project(tr.x,tr.y,tr.z);const a=(i+1)/trail.length;ctx.fillStyle=`rgba(255,226,158,${a*.22})`;ctx.beginPath();ctx.arc(q.x,q.y,r*a*.7,0,7);ctx.fill();}const g=ctx.createRadialGradient(p.x-r*.35,p.y-r*.4,1,p.x,p.y,r);g.addColorStop(0,'#ffffff');g.addColorStop(.6,'#f9fbef');g.addColorStop(1,'#b9c9ba');ctx.fillStyle=g;ctx.beginPath();ctx.arc(p.x,p.y,r,0,7);ctx.fill();ctx.strokeStyle='#76998488';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='#b6c3b0';for(let i=0;i<4;i++){const a=i*2.4;ctx.beginPath();ctx.arc(p.x+Math.cos(a)*r*.35,p.y+Math.sin(a)*r*.35,r*.08,0,7);ctx.fill();}}
function drawClub(t){
  if(phase==='running' && (!shot || stage.time-shot.start>450))return;
  const p=project(START.x,START.y,START.z);
  const retreat=dragging?Math.min(92,power*.95):0;
  const pullX=dragging?(dragNow.x-dragOrigin.x)*.2:0;
  const pullY=dragging?(dragNow.y-dragOrigin.y)*.2:0;
  const contact={x:p.x+29+pullX,y:p.y+18+retreat*.48+pullY};
  if(phase==='running'&&shot){const e=Math.min(1,(stage.time-shot.start)/450);contact.x+=e*85;contact.y-=e*50;}
  const handle={x:stage.width*.64,y:stage.height+42};
  ctx.save();ctx.lineCap='round';
  ctx.strokeStyle='#1d4a39aa';ctx.lineWidth=17;ctx.beginPath();ctx.moveTo(handle.x+3,handle.y+3);ctx.lineTo(contact.x+4,contact.y+3);ctx.stroke();
  const shaft=ctx.createLinearGradient(handle.x,handle.y,contact.x,contact.y);shaft.addColorStop(0,'#3a5346');shaft.addColorStop(.35,'#e7d9b2');shaft.addColorStop(1,'#f9f5e5');
  ctx.strokeStyle=shaft;ctx.lineWidth=10;ctx.beginPath();ctx.moveTo(handle.x,handle.y);ctx.lineTo(contact.x,contact.y);ctx.stroke();
  ctx.strokeStyle=clubColors[savedProgress.equipped]||'#bf5a2c';ctx.lineWidth=12;ctx.beginPath();ctx.moveTo(handle.x,handle.y);ctx.lineTo(mix(handle.x,contact.x,.22),mix(handle.y,contact.y,.22));ctx.stroke();
  const angle=dragging?Math.atan2(dragOrigin.y-dragNow.y,dragOrigin.x-dragNow.x)*.28:-.23;
  ctx.translate(contact.x,contact.y);ctx.rotate(angle);
  const head=ctx.createLinearGradient(-38,-13,25,15);head.addColorStop(0,'#f7e0af');head.addColorStop(.45,clubColors[savedProgress.equipped]||'#bf5a2c');head.addColorStop(1,'#754634');
  ctx.fillStyle=head;ctx.beginPath();ctx.roundRect(-39,-13,62,25,7);ctx.fill();ctx.strokeStyle='#fff4d7';ctx.lineWidth=2;ctx.stroke();
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
  const intendedDistance=.3+Math.max(0,Math.min(100,p))/100*4.45;
  const limits={minX:-5.8,maxX:5.8,minZ:-3.65,maxZ:3.55};
  let distance=intendedDistance,wall=null;
  for(const [axis,min,max] of [['x',limits.minX,limits.maxX],['z',limits.minZ,limits.maxZ]]){
    const v=dir[axis],start=START[axis];
    if(v<-.001){const hit=(min-start)/v;if(hit>=0&&hit<distance){distance=hit;wall=axis;}}
    if(v>.001){const hit=(max-start)/v;if(hit>=0&&hit<distance){distance=hit;wall=axis;}}
  }
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
  const label=preview.wall?'BANK SHOT':power<25?'WIND WILL HELP':`${Math.round(preview.distance*10)/10} M INITIAL FLIGHT`;
  ctx.font='800 11px Outfit';ctx.textAlign='center';const labelY=Math.min(stage.height-155,Math.max(270,end.y-19));
  const tw=ctx.measureText(label).width;ctx.fillStyle='#173e32e0';ctx.beginPath();ctx.roundRect(end.x-tw/2-11,labelY-17,tw+22,24,8);ctx.fill();ctx.fillStyle='#fff5d8';ctx.fillText(label,end.x,labelY);
  ctx.restore();
}
function drawParticles(dt){sparkles=sparkles.filter(p=>p.life>0);for(const p of sparkles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.02*dt;p.life-=dt;ctx.save();ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle=p.color;ctx.translate(p.x,p.y);ctx.rotate(p.life*.04);ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size);ctx.restore();}}
function sparkleBurst(x,y,count=20){const colors=['#bf5a2c','#f3c36b','#fff0cc','#5aac83'];for(let i=0;i<count;i++){const a=Math.PI*2*i/count,s=1+Math.random()*3;sparkles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-1,life:60,max:60,size:2+Math.random()*4,color:colors[i%colors.length]});}}
function frame(now){const dt=Math.min(3,(now-animatedAt)/16.67||1);animatedAt=now;stage.time=now;if(phase==='running')updateShot(now,dt);updateCamera(now);background(now);drawStage();drawBunker();drawWater();drawFairway();drawDetails(now);drawFeatures(now);drawRescueEffect(now);drawHole();drawAim();drawBall(now);drawClub(now);drawParticles(dt);requestAnimationFrame(frame)}
requestAnimationFrame(frame);

function showCallout(message, icon='✦', duration=1300){$('callout-text').textContent=message;$('callout-icon').textContent=icon;$('event-callout').classList.add('visible');clearTimeout(calloutTimer);calloutTimer=setTimeout(()=>$('event-callout').classList.remove('visible'),duration)}
function setPower(value){power=Math.max(0,Math.min(100,value));$('shot-percent').textContent=`${Math.round(power)}%`;$('power-fill').style.width=`${power}%`;$('shot-instruction').textContent=power<25?'A little goes a long way…':power<70?'Looking good. Let it fly.':'This is going to be BIG.'}
function pointerPos(e){const r=scene.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}}
scene.addEventListener('pointerdown',e=>{if(phase!=='ready')return;dragging=true;dragOrigin=pointerPos(e);dragNow=dragOrigin;scene.setPointerCapture(e.pointerId);setPower(0)});
scene.addEventListener('pointermove',e=>{if(!dragging)return;dragNow=pointerPos(e);setPower(Math.hypot(dragNow.x-dragOrigin.x,dragNow.y-dragOrigin.y)/1.65)});
scene.addEventListener('pointerup',e=>{if(!dragging)return;dragNow=pointerPos(e);const vector={x:dragOrigin.x-dragNow.x,y:dragOrigin.y-dragNow.y};dragging=false;startShot(power,vector)});
scene.addEventListener('pointercancel',()=>{dragging=false;setPower(0)});
function defaultAimVector(){const a=project(START.x,START.y,START.z),b=project(CUP.x,.23,CUP.z);return{x:b.x-a.x,y:b.y-a.y};}
$('keyboard-shot').addEventListener('click',()=>{if(phase==='ready')startShot(58,defaultAimVector())});
window.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&phase==='ready'&&document.activeElement===document.body){e.preventDefault();startShot(58,defaultAimVector())}});
function mix(a,b,t){return a+(b-a)*t}
function smooth(t){return t*t*(3-2*t)}
function clampCourse(p){return{x:Math.max(-5.7,Math.min(5.7,p.x)),y:p.y,z:Math.max(-3.55,Math.min(3.45,p.z))};}
function toward(a,b){const x=b.x-a.x,z=b.z-a.z,n=Math.hypot(x,z)||1;return{x:x/n,z:z/n};}
function buildShotPlan(p,vector){
  const flight=initialFlight(p,vector),level=courseState.level;
  let kind;
  if(flight.wall)kind='bank';
  else if(p<24||flight.offAngle>1.05)kind='wind';
  else if(level>=6&&p>68)kind='cannon';
  else if(level>=5&&flight.offAngle>.35)kind='river';
  else if(level>=4&&p>44&&p<80)kind='loop';
  else if(level>=3&&p>70)kind='launcher';
  else if(level>=2&&flight.offAngle>.3)kind='bumper';
  else if(flight.offAngle>.3)kind='wind';
  else kind='slope';
  const end=flight.end, towardCup=toward(end,CUP);
  let anchor={...end}, exit;
  if(kind==='bank'){
    const reflect={x:flight.wall==='x'?-flight.dir.x:flight.dir.x,z:flight.wall==='z'?-flight.dir.z:flight.dir.z};
    const blended={x:reflect.x*.68+courseForward.x*.62,z:reflect.z*.68+courseForward.z*.62};const n=Math.hypot(blended.x,blended.z)||1;
    exit=clampCourse({x:end.x+blended.x/n*1.8,y:.35,z:end.z+blended.z/n*1.8});
  }else if(kind==='wind'){
    exit=clampCourse({x:end.x+towardCup.x*1.9,y:.45,z:end.z+towardCup.z*1.9});
  }else if(kind==='bumper'){
    anchor={x:-1.55,y:.3,z:1.2};exit={x:anchor.x+1.35,y:.77,z:anchor.z-.8};
  }else if(kind==='launcher'){
    anchor={x:.15,y:.24,z:.12};exit={x:1.65,y:1.65,z:-.72};
  }else if(kind==='loop'){
    anchor={x:1.1,y:.65,z:-.6};exit={x:2.2,y:1.3,z:-1.15};
  }else if(kind==='river'){
    anchor={x:-1.8,y:.24,z:-1.85};exit={x:.4,y:.48,z:-1.55};
  }else if(kind==='cannon'){
    anchor={x:-2.4,y:.5,z:.45};exit={x:.25,y:2.3,z:-.55};
  }else{
    exit={x:mix(end.x,CUP.x,.32),y:.25,z:mix(end.z,CUP.z,.32)};
  }
  const launchMs=850+Math.max(0,Math.min(100,p))*10.5;
  const approachDistance=Math.hypot(anchor.x-end.x,anchor.z-end.z);
  const approachMs=approachDistance>.28?680+Math.min(700,approachDistance*130):0;
  const rescueMs=kind==='loop'||kind==='cannon'?1500:kind==='wind'?1180:960;
  const totalMs=Math.max(Math.min(60000,3400+level*1350),launchMs+approachMs+rescueMs+1600);
  return{...flight,kind,anchor,exit,launchMs,approachMs,rescueMs,totalMs,power:p,vector};
}
function sampleShot(plan,elapsed){
  const launchEnd=plan.launchMs,approachEnd=launchEnd+plan.approachMs,rescueEnd=approachEnd+plan.rescueMs;
  if(elapsed<launchEnd){const t=Math.max(0,elapsed/launchEnd),e=1-Math.pow(1-t,1.35);return{x:mix(START.x,plan.end.x,e),y:.23+Math.sin(t*Math.PI)*Math.min(.58,plan.power*.006),z:mix(START.z,plan.end.z,e)};}
  if(elapsed<approachEnd){const t=smooth((elapsed-launchEnd)/plan.approachMs);return{x:mix(plan.end.x,plan.anchor.x,t),y:mix(plan.end.y,plan.anchor.y,t)+Math.sin(t*Math.PI)*.2,z:mix(plan.end.z,plan.anchor.z,t)};}
  if(elapsed<rescueEnd){const t=(elapsed-approachEnd)/plan.rescueMs,e=smooth(t);const lead=plan.kind==='wind'?plan.dir:plan.kind==='bank'?{x:-plan.dir.x,z:-plan.dir.z}:toward(plan.anchor,plan.exit);
    const control={x:plan.anchor.x+lead.x*1.25,z:plan.anchor.z+lead.z*1.25};
    return{x:(1-e)*(1-e)*plan.anchor.x+2*(1-e)*e*control.x+e*e*plan.exit.x,
      y:mix(plan.anchor.y,plan.exit.y,e)+Math.sin(t*Math.PI)*(plan.kind==='launcher'||plan.kind==='cannon'?1.4:plan.kind==='loop'?1.0:.34),
      z:(1-e)*(1-e)*plan.anchor.z+2*(1-e)*e*control.z+e*e*plan.exit.z};
  }
  const t=Math.max(0,Math.min(1,(elapsed-rescueEnd)/(plan.totalMs-rescueEnd))),e=smooth(t);
  const side=plan.dir.x*courseForward.z-plan.dir.z*courseForward.x;
  let x=mix(plan.exit.x,CUP.x,e)+Math.sin(Math.PI*t)*side*.55;
  let z=mix(plan.exit.z,CUP.z,e)+Math.sin(Math.PI*t)*side*.36;
  let y=mix(plan.exit.y,.23,e)+Math.sin(t*Math.PI)*(plan.kind==='cannon'||plan.kind==='launcher'?1.1:.16);
  if(courseState.level>=8){const cycles=Math.min(10,Math.floor(courseState.level/5)+1),envelope=Math.sin(t*Math.PI);x+=Math.sin(t*Math.PI*2*cycles)*.5*envelope;z+=Math.cos(t*Math.PI*2*cycles)*.36*envelope;y+=Math.max(0,Math.sin(t*Math.PI*2*cycles))*.6*envelope;}
  return{x,y,z};
}
const rescueLabels={wind:['WIND TAKES OVER','〰'],bank:['BANKED OFF THE EDGE','✳'],bumper:['BUMPER TO THE RESCUE','✳'],launcher:['LAUNCH PAD!','✹'],loop:['THROUGH THE LOOP','◎'],river:['RIVER RIDE','≈'],cannon:['CANNON FIRED','✹'],slope:['THE GREEN LEANS IN','↗']};
function cueForShot(plan,elapsed){
  if(elapsed<plan.launchMs)return plan.power<24?['A GENTLE TAP','↗']:plan.offAngle>1?['BOLD DIRECTION','↗']:['YOUR SHOT, YOUR WAY','↗'];
  if(elapsed<plan.launchMs+plan.approachMs)return ['COURSE IS READY','✦'];
  if(elapsed<plan.launchMs+plan.approachMs+plan.rescueMs)return rescueLabels[plan.kind];
  const remaining=(elapsed-plan.launchMs-plan.approachMs-plan.rescueMs)/(plan.totalMs-plan.launchMs-plan.approachMs-plan.rescueMs);
  if(courseState.level>=8){const events=['ONE MORE BOOST','BUMPER BONUS','SKY LOOP','RIVER RIDE','WIND PICKS UP','ALMOST THERE'];const count=Math.min(28,5+Math.floor(courseState.level*.55));return[events[Math.min(count-1,Math.floor(remaining*count))%events.length],'✦'];}
  return remaining>.72?['STRAIGHT FOR THE CUP','✦']:['IT KNOWS THE WAY','↗'];
}
function startShot(p,vector){
  if(phase!=='ready')return;
  const plan=buildShotPlan(p,vector);phase='running';shot={...plan,start:performance.now(),lastCue:'',lastTrail:0,lastPhase:'launch'};
  $('shot-dock').classList.add('hidden');$('keyboard-shot').disabled=true;
  showCallout(p<24?'TINY SWING. BIG DESTINY.':plan.offAngle>1?'LET’S SEE WHERE THAT GOES':'HERE WE GO!',p<24?'〰':'✦',900);setPower(0);
}
function updateShot(now,dt){
  if(!shot)return;
  const elapsed=Math.max(0,now-shot.start);
  ball=sampleShot(shot,Math.min(elapsed,shot.totalMs));
  const currentPhase=elapsed<shot.launchMs?'launch':elapsed<shot.launchMs+shot.approachMs?'approach':elapsed<shot.launchMs+shot.approachMs+shot.rescueMs?'rescue':'home';
  if(currentPhase!==shot.lastPhase){shot.lastPhase=currentPhase;const p=project(ball.x,ball.y,ball.z);sparkleBurst(p.x,p.y,currentPhase==='rescue'?25:10);}
  if(currentPhase==='rescue'&&shot.kind==='wind'){
    const p=project(ball.x,ball.y,ball.z);$('wind-streaks').style.left=`${p.x-135}px`;$('wind-streaks').style.top=`${p.y-100}px`;$('wind-streaks').classList.add('active');
  }else $('wind-streaks').classList.remove('active');
  if(elapsed-shot.lastTrail>Math.max(22,shot.totalMs/150)){trail.push({...ball});if(trail.length>17)trail.shift();shot.lastTrail=elapsed;}
  const cue=cueForShot(shot,elapsed);if(cue[0]!==shot.lastCue&&elapsed>shot.launchMs*.5){shot.lastCue=cue[0];showCallout(...cue,1050);}
  if(elapsed>=shot.totalMs){ball={...CUP,y:-.02};trail=[];finishShot();}
}
function finishShot(){phase='complete';$('wind-streaks').classList.remove('active');const base=300+courseState.level*72;const bonus=Math.min(140,Math.round(shot.power*1.2));const reward=base+bonus;savedProgress=readProgress();savedProgress.xp=Math.max(0,Number(savedProgress.xp)||0)+reward;savedProgress.holeCount=Math.max(0,Number(savedProgress.holeCount)||0)+1;courseState.completed=true;save(PROGRESS_KEY,savedProgress);save(COURSE_KEY,courseState);updateHud();const p=project(CUP.x,.3,CUP.z);sparkleBurst(p.x,p.y,40);showCelebration(true,reward);shot=null;}
function showCelebration(animate,reward){$('celebration-total').textContent=`${Math.round(savedProgress.xp).toLocaleString()} XP`;$('reward-xp').textContent=reward?`+${reward.toLocaleString()} XP`:'PERFECT SHOT';$('celebration-story').textContent=themeLevel()===1?'That ball knew exactly where it was going.':themeLevel()>=5?'What a ride. And somehow, exactly as planned.':'A little chaos. A lot of perfect aim.';$('celebration').hidden=false;$('shot-dock').classList.add('hidden');$('keyboard-shot').disabled=true;if(animate)burstConfetti();}
function burstConfetti(){const layer=$('confetti');layer.innerHTML='';const colors=['#bf5a2c','#ecab6f','#f4d27a','#8ec9a0','#ffffff','#729bb2'];for(let i=0;i<130;i++){const el=document.createElement('i');el.style.setProperty('--x',`${Math.random()*100}%`);el.style.setProperty('--w',`${4+Math.random()*8}px`);el.style.setProperty('--h',`${7+Math.random()*13}px`);el.style.setProperty('--c',colors[i%colors.length]);el.style.setProperty('--d',`${2.2+Math.random()*2}s`);el.style.setProperty('--delay',`${Math.random()*.6}s`);el.style.setProperty('--drift',`${(Math.random()-.5)*340}px`);el.style.setProperty('--rot',`${300+Math.random()*900}deg`);layer.appendChild(el);}setTimeout(()=>layer.innerHTML='',5000);}
$('next-hole').addEventListener('click',()=>{courseState={level:courseState.level+1,completed:false};save(COURSE_KEY,courseState);phase='ready';ball={...START};trail=[];shot=null;$('celebration').hidden=true;$('shot-dock').classList.remove('hidden');$('keyboard-shot').disabled=false;updateHud();showCallout('A NEW ADVENTURE','✳',1300)});
