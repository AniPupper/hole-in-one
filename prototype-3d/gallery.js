/* Standalone WebGL2 object study. Geometry is built in game world units and
   never loaded by the production game. +X = course tangent, +Z = lane across. */
(() => {
  'use strict';
  const canvas=document.getElementById('preview');
  const gl=canvas.getContext('webgl2',{antialias:true,alpha:false,powerPreference:'high-performance'});
  if(!gl){document.getElementById('webgl-error').hidden=false;return;}

  const assets=[
    {id:'course',icon:'⌁',kind:'THE WHOLE COURSE',name:'A world you can touch.',short:'Full assembly',description:'A playable-scale landscape study: raised turf, timber rails, moving props, water, and a cup that belongs in the terrain.',specs:[['UNITS','One unit = one gameplay unit'],['LIGHT','Upper-left warm sun'],['PATH','Local +X forward, +Z across']],camera:{az:1.05,el:.48,r:22,target:[1.1,.4,0]}},
    {id:'fairway',icon:'⌁',kind:'TRACK / TOPOGRAPHY',name:'Land with a real edge.',short:'Fairway & rails',description:'The fairway rises into a gentle hill. Grassy bank toes meet surrounding soil, while capped timber side rails follow the route.',specs:[['LANE','±2.1 units after tee'],['RAIL','0.14 thick; 0.16–0.55 high'],['TEE','Open behind the ball']],camera:{az:.98,el:.47,r:11,target:[0,.1,0]}},
    {id:'balls',icon:'●',kind:'EQUIPMENT / BALL',name:'A little sphere of luck.',short:'Ball families',description:'Pale pearl shells carry shallow geometric dimples and one composed, surface-following family crest. Rebound, Whirl, and Glide stay recognizable from orbit.',specs:[['RADIUS','0.19 units'],['FAMILIES','Bounce / spin / roll'],['FINISH','Pearl shell + recessed dimples']],camera:{az:1.08,el:.28,r:3.5,target:[0,.23,0]}},
    {id:'clubs',icon:'♠',kind:'EQUIPMENT / CLUB',name:'Three ways to swing.',short:'Vertical clubs',description:'A driver, wedge, and iron now have closed, solid head meshes with front, back, crown, sole, and edge faces. Their shafts and grips share one material language.',specs:[['STANCE','Vertical first-person profile'],['FAMILIES','Driver / wedge / iron'],['MATERIAL','Metal, enamel, rubber']],camera:{az:1.08,el:.31,r:5.5,target:[0,1.18,0]}},
    {id:'pad',icon:'↗',kind:'INTERACTIVE / LAUNCH',name:'Step on the spark.',short:'Launch pad',description:'A near-circular violet contact disc has bright arrows and a lit perimeter that read cleanly from every approach.',specs:[['CONTACT','Circle radius 0.78'],['HEIGHT','0.045 units'],['DIRECTION','Local +X forward']],camera:{az:1.0,el:.57,r:3.7,target:[0,.08,0]}},
    {id:'bumper',icon:'✳',kind:'INTERACTIVE / BOUNCE',name:'A joyful rebound.',short:'Bumper & mole',description:'A glossy spring bumper and an earthy rescue mole both show where a physical push comes from.',specs:[['BUMPER','Body radius 0.37'],['MOLE','Body radius 0.33'],['SHADOW','Grounded contact footprint']],camera:{az:.95,el:.42,r:4.8,target:[0,.35,0]}},
    {id:'windmill',icon:'✣',kind:'OBSTACLE / MOVING',name:'Catch the rotor.',short:'Windmill',description:'A tapered plaster tower carries a real four-blade rotor. Blade motion shares one phase so visual and future collision can agree.',specs:[['BASE','Ellipse X 0.54 / Z 0.39'],['HUB','Y 1.72, Z +0.32'],['BLADES','0.15–0.93 radial span']],camera:{az:1.15,el:.37,r:5.1,target:[0,1.18,0]}},
    {id:'bridge',icon:'≈',kind:'TERRAIN / WATER',name:'Over the blue.',short:'River & bridge',description:'A turquoise current meanders below grade in a cut channel. Smooth timber ramps lead over a raised deck with solid railings.',specs:[['DECK','X ±1.08 / top Y 0.18'],['RAMPS','Smooth to X ±1.36'],['WATER','Y −0.10 / meandering'],['RAILS','Z ±0.82 / top Y 0.74']],camera:{az:1.0,el:.53,r:5.5,target:[0,.12,0]}},
    {id:'cup',icon:'⚑',kind:'TARGET / FINISH',name:'The perfect finish.',short:'Flag & cup',description:'A ball banks off the fixed curved timber wall, rolls down the gentle green, and drops into a genuine recessed cup.',specs:[['BOWL','Radius 3.3 / depth 0.12'],['CUP','Dark inner wall / recessed floor'],['BACKSTOP','X=1.25−0.18·Z²'],['MOUTH','0.51 × 0.49 half-axes']],camera:{az:2.15,el:.38,r:5.6,target:[.25,.62,0]}},
    {id:'tricks',icon:'◎',kind:'SPECTACLE / LATE HOLES',name:'The impossible route.',short:'Loop & cannon',description:'A thick turquoise loop opens across the lane. Watch a ball enter the blue steel cannon, settle in its recessed barrel, then fire along the course tangent.',specs:[['LOOP','Across 0.82 / center Y 1.1'],['CANNON','Load · pause · fire'],['DIRECTION','Along local +X']],camera:{az:1.04,el:.38,r:6.4,target:[0,.8,0]}}
  ];
  const byId=Object.fromEntries(assets.map(asset=>[asset.id,asset]));
  const list=document.getElementById('catalog-list');
  for(const [i,asset] of assets.entries()){
    const button=document.createElement('button');button.type='button';button.className='catalog-item';button.dataset.asset=asset.id;
    button.innerHTML=`<span class="catalog-icon" aria-hidden="true">${asset.icon}</span><span class="catalog-copy"><b>${asset.short}</b><small>${asset.kind}</small></span>`;
    button.addEventListener('click',()=>select(asset.id));list.appendChild(button);
  }
  let selected='course',camera={...byId.course.camera},drag=null,turning=true,clock=0,previous=performance.now();
  function select(id){
    selected=id;camera={...byId[id].camera};turning=id!=='course';
    for(const button of list.children)button.classList.toggle('active',button.dataset.asset===id);
    const item=byId[id];document.getElementById('asset-kind').textContent=item.kind;
    document.getElementById('asset-title').textContent=item.name;
    document.getElementById('asset-description').textContent=item.description;
    document.getElementById('scene-index').textContent=`${String(assets.indexOf(item)+1).padStart(2,'0')} / ${assets.length}`;
    document.getElementById('spec-list').innerHTML=item.specs.map(([label,value])=>`<div class="spec"><small>${label}</small><strong>${value}</strong></div>`).join('');
    rebuildStatic();
  }
  document.getElementById('reset-camera').addEventListener('click',()=>{camera={...byId[selected].camera};turning=selected!=='course';});
  canvas.addEventListener('pointerdown',event=>{drag={x:event.clientX,y:event.clientY,az:camera.az,el:camera.el};turning=false;canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{if(!drag)return;camera.az=drag.az+(event.clientX-drag.x)*.008;camera.el=Math.max(.08,Math.min(1.28,drag.el+(event.clientY-drag.y)*.006));});
  canvas.addEventListener('pointerup',()=>{drag=null;});canvas.addEventListener('pointercancel',()=>{drag=null;});
  canvas.addEventListener('wheel',event=>{event.preventDefault();camera.r=Math.max(1.6,Math.min(34,camera.r*Math.exp(event.deltaY*.001)));},{passive:false});

  const vertexSource=`#version 300 es
    in vec3 aPosition;in vec3 aNormal;in vec3 aColor;in float aShine;
    uniform mat4 uProjection;uniform mat4 uView;
    out vec3 vPosition;out vec3 vNormal;out vec3 vColor;out float vShine;
    void main(){vPosition=aPosition;vNormal=aNormal;vColor=aColor;vShine=aShine;gl_Position=uProjection*uView*vec4(aPosition,1.0);}`;
  const fragmentSource=`#version 300 es
    precision highp float;
    in vec3 vPosition;in vec3 vNormal;in vec3 vColor;in float vShine;
    uniform vec3 uCamera;out vec4 outputColor;
    void main(){
      vec3 normal=normalize(vNormal)*(gl_FrontFacing?1.0:-1.0);
      vec3 light=normalize(vec3(-0.48,0.86,0.29));
      float shade=max(0.0,dot(normal,light));
      float hemisphere=0.43+0.12*normal.y;
      vec3 viewDirection=normalize(uCamera-vPosition);
      float sparkle=pow(max(dot(normal,normalize(light+viewDirection)),0.0),mix(12.0,58.0,vShine))*vShine*0.55;
      vec3 color=vColor*(hemisphere+shade*0.58)+vec3(1.0,0.91,0.72)*sparkle;
      outputColor=vec4(pow(min(color,vec3(1.0)),vec3(0.94)),1.0);
    }`;
  const compile=(kind,source)=>{const shader=gl.createShader(kind);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(shader));return shader;};
  const program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertexSource));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragmentSource));gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
  const geometryBuffer=()=>{
    const buffer=gl.createBuffer(),vao=gl.createVertexArray();gl.bindVertexArray(vao);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    for(const [name,size,offset] of [['aPosition',3,0],['aNormal',3,3],['aColor',3,6],['aShine',1,9]]){
      const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,40,offset*4);
    }
    return{buffer,vao};
  };
  const staticGeometry=geometryBuffer(),movingGeometry=geometryBuffer();let staticCount=0;
  gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.disable(gl.CULL_FACE);
  const uniforms={projection:gl.getUniformLocation(program,'uProjection'),view:gl.getUniformLocation(program,'uView'),camera:gl.getUniformLocation(program,'uCamera')};

  const V=(x,y,z)=>[x,y,z],add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],scale=(a,s)=>[a[0]*s,a[1]*s,a[2]*s],dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>scale(a,1/(Math.hypot(...a)||1));
  const colors=new Map();function rgb(hex){if(Array.isArray(hex))return hex;if(colors.has(hex))return colors.get(hex);const h=hex.replace('#','');const c=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255);colors.set(hex,c);return c;}
  let vertices=[],pose={x:0,y:0,z:0,yaw:0};
  function world(p){const c=Math.cos(pose.yaw),s=Math.sin(pose.yaw);return [pose.x+p[0]*c-p[2]*s,pose.y+p[1]+(pose.slope||0)*p[0],pose.z+p[0]*s+p[2]*c];}
  function normalWorld(n){const c=Math.cos(pose.yaw),s=Math.sin(pose.yaw),nx=n[0]-(pose.slope||0)*n[1];return unit([nx*c-n[2]*s,n[1],nx*s+n[2]*c]);}
  function withPose(x,y,z,yaw,draw){const old=pose,p=world([x,y,z]);pose={x:p[0],y:p[1],z:p[2],yaw:old.y+yaw,slope:old.slope||0};draw();pose=old;}
  function withSlopePose(x,y,z,yaw,slope,draw){const old=pose,p=world([x,y,z]);pose={x:p[0],y:p[1],z:p[2],yaw:old.yaw+yaw,slope};draw();pose=old;}
  function emit(p,n,c,shine){vertices.push(p[0],p[1],p[2],n[0],n[1],n[2],c[0],c[1],c[2],shine);}
  function tri(a,b,c,color,shine=.18){const wa=world(a),wb=world(b),wc=world(c),n=unit(cross(sub(wb,wa),sub(wc,wa))),col=rgb(color);emit(wa,n,col,shine);emit(wb,n,col,shine);emit(wc,n,col,shine);}
  function smoothTri(a,na,b,nb,c,nc,color,shine=.18){const col=rgb(color);emit(world(a),normalWorld(na),col,shine);emit(world(b),normalWorld(nb),col,shine);emit(world(c),normalWorld(nc),col,shine);}
  function quad(a,b,c,d,color,shine=.18){tri(a,b,c,color,shine);tri(a,c,d,color,shine);}
  function polygon(points,color,shine=.18){for(let i=1;i<points.length-1;i++)tri(points[0],points[i],points[i+1],color,shine);}
  function extrudeProfile(profile,back,front,colors,shine=.38){
    polygon(profile.map(([x,y])=>V(x,y,front)),colors.front,shine);
    polygon([...profile].reverse().map(([x,y])=>V(x,y,back)),colors.back,shine*.65);
    for(let i=0;i<profile.length;i++){
      const [ax,ay]=profile[i],[bx,by]=profile[(i+1)%profile.length];
      quad(V(ax,ay,back),V(bx,by,back),V(bx,by,front),V(ax,ay,front),
        i===0?colors.sole:i>=profile.length-2?colors.crown:colors.edge,shine*.8);
    }
  }
  function box(x,y,z,w,h,d,faces,shine=.18){const x0=x-w/2,x1=x+w/2,y0=y-h/2,y1=y+h/2,z0=z-d/2,z1=z+d/2;const paint=Array.isArray(faces)?faces:[faces,faces,faces,faces,faces,faces];
    quad(V(x0,y1,z0),V(x1,y1,z0),V(x1,y1,z1),V(x0,y1,z1),paint[0],shine);
    quad(V(x0,y0,z1),V(x1,y0,z1),V(x1,y0,z0),V(x0,y0,z0),paint[1],shine);
    quad(V(x0,y0,z1),V(x1,y0,z1),V(x1,y1,z1),V(x0,y1,z1),paint[2],shine);
    quad(V(x1,y0,z0),V(x0,y0,z0),V(x0,y1,z0),V(x1,y1,z0),paint[3],shine);
    quad(V(x1,y0,z1),V(x1,y0,z0),V(x1,y1,z0),V(x1,y1,z1),paint[4],shine);
    quad(V(x0,y0,z0),V(x0,y0,z1),V(x0,y1,z1),V(x0,y1,z0),paint[5],shine);
  }
  function ellipsoid(x,y,z,rx,ry,rz,color,shine=.24,lat=12,lon=20){
    const at=(a,b)=>{const theta=a*Math.PI/lat,phi=b*2*Math.PI/lon;const sx=Math.sin(theta)*Math.cos(phi),sy=Math.cos(theta),sz=Math.sin(theta)*Math.sin(phi);return{p:V(x+rx*sx,y+ry*sy,z+rz*sz),n:unit(V(sx/rx,sy/ry,sz/rz))};};
    for(let i=0;i<lat;i++)for(let j=0;j<lon;j++){const a=at(i,j),b=at(i+1,j),c=at(i+1,j+1),d=at(i,j+1);smoothTri(a.p,a.n,b.p,b.n,c.p,c.n,color,shine);smoothTri(a.p,a.n,c.p,c.n,d.p,d.n,color,shine);}
  }
  let golfMesh=null;
  function golfShell(x,y,z,color){
    if(!golfMesh){
      const lat=30,lon=48,r=.19,centers=[];
      for(let i=0;i<72;i++){
        const sy=1-2*(i+.5)/72,a=i*2.399963229,p=Math.sqrt(1-sy*sy);
        centers.push(V(Math.cos(a)*p,sy,Math.sin(a)*p));
      }
      const surface=(theta,phi)=>{
        const direction=V(Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi));
        let nearest=-1;for(const c of centers)nearest=Math.max(nearest,dot(direction,c));
        const q=Math.max(0,Math.min(1,(nearest-Math.cos(.145))/(1-Math.cos(.145))));
        const radius=r-.0035*q*q*(3-2*q);
        return scale(direction,radius);
      };
      const vertex=(i,j)=>{
        const theta=i*Math.PI/lat,phi=j*2*Math.PI/lon,e=.003;
        const p=surface(theta,phi),alongPhi=sub(surface(theta,phi+e),surface(theta,phi-e));
        const alongTheta=sub(surface(Math.min(Math.PI,theta+e),phi),surface(Math.max(0,theta-e),phi));
        const bent=cross(alongPhi,alongTheta);
        return{p,n:Math.hypot(...bent)<1e-8?unit(p):unit(bent)};
      };
      const grid=Array.from({length:lat+1},(_,i)=>
        Array.from({length:lon+1},(_,j)=>vertex(i,j)));
      golfMesh=[];
      for(let i=0;i<lat;i++)for(let j=0;j<lon;j++){
        const a=grid[i][j],b=grid[i+1][j],c=grid[i+1][j+1],d=grid[i][j+1];
        golfMesh.push(a,b,c,a,c,d);
      }
    }
    const offset=V(x,y,z),col=rgb(color);
    for(const vertex of golfMesh)
      emit(world(add(offset,vertex.p)),normalWorld(vertex.n),col,.69);
  }
  function ellipseDisc(x,y,z,rx,rz,height,sideColor,topColor,segments=28){
    const y0=y,y1=y+height;
    for(let i=0;i<segments;i++){const a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments;
      const lowA=V(x+rx*Math.cos(a),y0,z+rz*Math.sin(a)),lowB=V(x+rx*Math.cos(b),y0,z+rz*Math.sin(b));
      const upA=V(lowA[0],y1,lowA[2]),upB=V(lowB[0],y1,lowB[2]);quad(lowA,lowB,upB,upA,sideColor);tri(V(x,y1,z),upA,upB,topColor);
    }
  }
  function tube(points,radius,color,shine=.24,sides=8,closed=false){
    const length=points.length;
    for(let i=0;i<(closed?length:length-1);i++){
      const a=points[i],b=points[(i+1)%length],t=unit(sub(b,a));let u=unit(cross(t,[0,1,0]));if(Math.hypot(...u)<.2)u=[1,0,0];const v=unit(cross(t,u));
      for(let k=0;k<sides;k++){const q=k*2*Math.PI/sides,r=(k+1)*2*Math.PI/sides;
        const off=angle=>add(scale(u,Math.cos(angle)*radius),scale(v,Math.sin(angle)*radius));
        quad(add(a,off(q)),add(b,off(q)),add(b,off(r)),add(a,off(r)),color,shine);
      }
    }
  }
  function cylinder(a,b,rA,rB,color,shine=.24,segments=16){
    const axis=unit(sub(b,a));let u=unit(cross(axis,[0,0,1]));if(Math.hypot(...u)<.2)u=[1,0,0];const v=unit(cross(axis,u));
    for(let i=0;i<segments;i++){const q=i*2*Math.PI/segments,r=(i+1)*2*Math.PI/segments,offset=(angle,radius)=>add(scale(u,Math.cos(angle)*radius),scale(v,Math.sin(angle)*radius));
      quad(add(a,offset(q,rA)),add(a,offset(r,rA)),add(b,offset(r,rB)),add(b,offset(q,rB)),color,shine);
      tri(a,add(a,offset(r,rA)),add(a,offset(q,rA)),color,shine);tri(b,add(b,offset(q,rB)),add(b,offset(r,rB)),color,shine);
    }
  }
  function ellipticalFrustum(x,z,y0,y1,rx0,rz0,rx1,rz1,base,lit,segments=16){
    for(let i=0;i<segments;i++){const a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments;
      const face=Math.sin((a+b)/2);const color=face>.4?lit:base;
      quad(V(x+rx0*Math.cos(a),y0,z+rz0*Math.sin(a)),V(x+rx0*Math.cos(b),y0,z+rz0*Math.sin(b)),V(x+rx1*Math.cos(b),y1,z+rz1*Math.sin(b)),V(x+rx1*Math.cos(a),y1,z+rz1*Math.sin(a)),color,.14);
    }
  }
  function ringXZ(x,y,z,rx,rz,tubeRadius,color,shine=.35){const points=[];for(let i=0;i<44;i++){const a=i*2*Math.PI/44;points.push(V(x+rx*Math.cos(a),y,z+rz*Math.sin(a)));}tube(points,tubeRadius,color,shine,7,true);}
  function annulusXZ(x,y,z,outerX,outerZ,innerX,innerZ,color,shine=.18){
    for(let i=0;i<40;i++){const a=i*Math.PI/20,b=(i+1)*Math.PI/20;
      quad(V(x+outerX*Math.cos(a),y,z+outerZ*Math.sin(a)),V(x+outerX*Math.cos(b),y,z+outerZ*Math.sin(b)),
        V(x+innerX*Math.cos(b),y,z+innerZ*Math.sin(b)),V(x+innerX*Math.cos(a),y,z+innerZ*Math.sin(a)),color,shine);
    }
  }
  function groundPlate(width=5,depth=5){box(0,-.13,0,width,.22,depth,['#d7e0c8','#8f8b6f','#9ab28e','#7a9c84','#a7b498','#a8bda5'],.02);
    box(0,-.015,0,width-.05,.015,depth-.05,'#bad2aa',.01);
    for(let i=0;i<32;i++){const x=(((i*37)%31)/31-.5)*(width-.5),z=(((i*19)%29)/29-.5)*(depth-.5);box(x,-.004,z,.04,.004,.012,i%2?'#d6e6bd':'#8db498',.02);}
  }
  function terrainWithHole(width,depth,holeX,holeZ,radius){
    const count=96,halfX=width/2,halfZ=depth/2,top=-.008,bottom=-.24;
    for(let i=0;i<count;i++){
      const a=i*2*Math.PI/count,b=(i+1)*2*Math.PI/count;
      const edge=angle=>{
        const dx=Math.cos(angle),dz=Math.sin(angle);
        const rx=dx>0?(halfX-holeX)/dx:(-halfX-holeX)/dx;
        const rz=dz>0?(halfZ-holeZ)/dz:(-halfZ-holeZ)/dz;
        const out=Math.min(Number.isFinite(rx)?rx:Infinity,Number.isFinite(rz)?rz:Infinity);
        return V(holeX+dx*out,top,holeZ+dz*out);
      };
      const ia=V(holeX+Math.cos(a)*radius,top,holeZ+Math.sin(a)*radius);
      const ib=V(holeX+Math.cos(b)*radius,top,holeZ+Math.sin(b)*radius);
      const oa=edge(a),ob=edge(b);
      quad(ia,ib,ob,oa,'#a8c69b',.025);
      quad(oa,ob,V(ob[0],bottom,ob[2]),V(oa[0],bottom,oa[2]),'#89a18a',.02);
    }
  }
  function shadow(x,z,rx,rz,soft=false){
    const outer=soft?'#a8c2a0':'#789983',inner=soft?'#97b596':'#638572';
    ellipseDisc(x,.003,z,rx,rz,.003,outer,outer,28);
    ellipseDisc(x,.006,z,rx*.67,rz*.65,.003,inner,inner,28);
  }
  function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)/(near-far),-1,0,0,2*far*near/(near-far),0]);}
  function lookAt(eye,target){const z=unit(sub(eye,target)),x=unit(cross([0,1,0],z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}

  // Geometry is authored in local course coordinates. Terrain and rail
  // dimensions follow the current game; decorative trim stays outside the
  // contact envelope so it will not imply an invisible collision.
  function trailPoint(t,length){const x=(t-.5)*length,z=Math.sin(t*Math.PI*1.35)*.58*Math.sin(Math.PI*t)**2;
    const y=.025+.46*Math.exp(-(((t-.48)/.17)**2))+.17*Math.exp(-(((t-.76)/.11)**2));return{x,y,z};}
  function buildFairway(length=9,decor=true,cupCut=false){
    if(cupCut)terrainWithHole(20,9,6.2,0,3.3);
    else groundPlate(length+2.4,7.8);
    const rows=cupCut?84:44,lanes=cupCut?24:12,half=2.1;
    for(let i=0;i<rows;i++)for(let j=0;j<lanes;j++){
      const t=i/rows,u=(i+1)/rows,a=-half+j*half*2/lanes,b=-half+(j+1)*half*2/lanes;
      const point=(q,side)=>{const p=trailPoint(q,length),before=trailPoint(Math.max(0,q-.005),length),after=trailPoint(Math.min(1,q+.005),length),v=unit([after.x-before.x,0,after.z-before.z]);return V(p.x-v[2]*side,p.y+.018+(1-Math.abs(side)/half)*.015,p.z+v[0]*side);};
      const middle=point((t+u)/2,(a+b)/2);
      if(cupCut&&(Math.hypot(middle[0]-6.2,middle[2])<3.43||
        (Math.abs(middle[0]-3-riverCenter(middle[2]))<.69&&Math.abs(middle[2])<3.2)))continue;
      const pa=point(t,a),pb=point(u,a),pc=point(u,b),pd=point(t,b);
      const grass=j<2||j>9?'#77a66f':i%7===0?'#a6ca8c':'#96bd7d';quad(pa,pb,pc,pd,grass,.025);
      if(j===0||j===lanes-1){const side=j===0?-1:1,p=j===0?pa:pd,q=j===0?pb:pc;
        quad(V(p[0],-.025,p[2]),V(q[0],-.025,q[2]),q,p,'#66855c',.01);
      }
    }
    // The bank is a sloped terrain shoulder; the timber inner face marks the
    // actual side-wall centerline. No crossbar closes the tee mouth.
    for(const side of [-1,1])for(let i=0;i<44;i++){
      const t=i/44,u=(i+1)/44;const profile=(q,width,raise)=>{const p=trailPoint(q,length),b=trailPoint(Math.min(1,q+.004),length),a=trailPoint(Math.max(0,q-.004),length),dir=unit([b.x-a.x,0,b.z-a.z]);return V(p.x-dir[2]*side*width,p.y+raise,p.z+dir[0]*side*width);};
      if(cupCut){const center=profile((t+u)/2,2.55,0);if(Math.hypot(center[0]-6.2,center[2])<3.35)continue;}
      quad(profile(t,2.11,.008),profile(u,2.11,.008),profile(u,2.53,.33),profile(t,2.53,.33),'#71936b',.02);
      quad(profile(t,2.53,.33),profile(u,2.53,.33),profile(u,3.26,-.01),profile(t,3.26,-.01),'#89aa78',.02);
      if(t>=.10&&t<=.96){const p=trailPoint(t,length),q=trailPoint(u,length),dir=unit([q.x-p.x,0,q.z-p.z]),yaw=Math.atan2(dir[2],dir[0]),mid=trailPoint((t+u)/2,length),seg=Math.hypot(q.x-p.x,q.z-p.z)+.02;
        const taper=Math.min(1,Math.max(0,(t-.10)/.055),Math.max(0,(.97-t)/.055)),height=.16+.39*taper*taper*(3-2*taper);
        withPose(mid.x,mid.y,mid.z,yaw,()=>{
          box(0,height/2,side*(half+.07),seg,height,.14,['#e8cb91','#634934','#956d47','#6d4b34','#8b623f','#a37a50'],.11);
          box(0,height+.015,side*(half+.08),seg+.015,.03,.18,['#fae3ae','#775333','#b9945e','#88613d','#b9945e','#b9945e'],.19);
          if(i%4===0&&height>.35)cylinder(V(0,.09,side*(half+.14)),V(0,height-.03,side*(half+.14)),.017,.017,'#70523c',.19,7);
        });
      }
    }
    if(decor){for(let i=0;i<46;i++){const t=((i*17)%47)/47,p=trailPoint(t,length),across=(((i*13)%29)/29-.5)*3.25;
      withPose(p.x,p.y+.022,p.z+across,0,()=>{
        const c=i%3?'#cfdfaa':'#e5e7bd';tube([V(-.036,0,-.022),V(0,.025,0),V(.032,0,.025)],.004,c,.02,4);
      });
    }}
    // Tee ring and ball are real, separately scaled meshes.
    const tee=trailPoint(.07,length);withPose(tee.x,tee.y,tee.z,0,()=>{ellipseDisc(0,.012,0,.72,.62,.025,'#b69b70','#ead69e');ringXZ(0,.047,0,.51,.44,.021,'#fff3c7',.15);modelBall('classic',0,.25,0);});
  }
  function ballMark(family){
    const s=(x,y)=>V(x,y,Math.sqrt(Math.max(0,.19*.19-x*x-y*y))+.003);
    const center=s(0,0),rim=[],inner=[];
    for(let i=0;i<36;i++){const a=i*Math.PI/18;rim.push(s(Math.cos(a)*.105,Math.sin(a)*.105));inner.push(s(Math.cos(a)*.083,Math.sin(a)*.083));}
    const field=family==='rebound'?'#bb6f55':family==='whirl'?'#539f9f':'#9b86b9';
    for(let i=0;i<36;i++){
      const j=(i+1)%36;quad(rim[i],rim[j],inner[j],inner[i],'#f7e7cb',.24);
      tri(center,inner[i],inner[j],field,.25);
    }
    const ink='#fff9e8';
    if(family==='rebound'){
      // The bolt is three non-overlapping triangles, not a concave fan.
      tri(s(-.018,.062),s(.032,.062),s(.001,.008),ink,.3);
      tri(s(-.018,.062),s(.001,.008),s(-.045,.008),ink,.3);
      tri(s(-.045,.008),s(.001,.008),s(-.015,-.068),ink,.3);
    }else if(family==='whirl'){
      const points=[];for(let i=0;i<29;i++){const a=i*.48,r=.004+i*.0025;points.push(s(Math.cos(a)*r,Math.sin(a)*r));}tube(points,.006,ink,.35,6);
    }else for(const offset of [-.023,.022]){
      const points=[];for(let i=0;i<24;i++){const q=i/23;points.push(s(-.067+q*.134,offset+Math.sin(q*Math.PI*2)*.012));}tube(points,.005,ink,.35,6);
    }
  }
  function modelBall(family='classic',x=0,y=.23,z=0,time=0){
    const palettes={classic:['#fcfcf6','#d5dfd7'],rebound:['#fff6e6','#d58a68'],whirl:['#effcf9','#72b9b5'],glide:['#f8f5ff','#ae9bc9']};
    const [shell,trim]=palettes[family]||palettes.classic;
    shadow(x,z,.27,.21);
    golfShell(x,y,z,shell);
    if(family==='classic')return;
    // Two thin, broken meridian seams tie the emblem to the pearl shell
    // without a heavy equator ring or high-contrast polka dots.
    for(const yaw of [0,Math.PI])withPose(x,y,z,yaw,()=>{
      ballMark(family);
      for(const side of [-1,1]){
        const line=[];for(let i=0;i<19;i++){const q=i/18,a=-1.22+q*2.44;
          line.push(V(side*.145*Math.cos(a),.191*Math.sin(a),.124*Math.cos(a)));}
        tube(line,.0035,trim,.22,5);
      }
    });
  }
  function modelClubs(time=0){
    groundPlate(4.3,2.5);
    const data=[[-1.22,'driver','#d87958','#6e473d'],[0,'wedge','#7cbabb','#356a74'],[1.22,'iron','#ad93c8','#655679']];
    for(const [x,family,finish,grip] of data){
      withPose(x,0,0,0,()=>{
        shadow(0,0,.5,.25);
        cylinder(V(.085,.39,0),V(.08,.61,0),.042,.031,'#e4c58e',.57,14);
        cylinder(V(.08,.56,0),V(.10,2.43,0),.028,.019,'#dce5e2',.74,16);
        cylinder(V(.10,2.12,0),V(.10,2.56,0),.045,.047,grip,.27,16);
        for(let i=0;i<8;i++)ringXZ(.10,2.16+i*.05,0,.047,.047,.0025,i%2?'#e7d5ad':'#80908d',.15);
        ellipsoid(.10,2.57,0,.048,.018,.048,'#e9d8b7',.45,8,16);
        let front;
        if(family==='driver'){
          const profile=[[-.48,.20],[-.36,.13],[.09,.13],[.24,.21],[.20,.34],[.05,.40],[-.32,.39],[-.47,.30]];
          front=.18;extrudeProfile(profile,-.18,front,{front:finish,back:'#8e5346',sole:'#68463e',crown:'#efb28b',edge:'#b96e54'},.62);
          ellipsoid(-.13,.29,front+.009,.20,.055,.012,'#e7a37d',.65,8,16);
          tube([V(-.32,.31,front+.025),V(-.14,.35,front+.025),V(.04,.31,front+.025)],.009,'#fff0d7',.38,7);
        }else if(family==='wedge'){
          const profile=[[-.44,.16],[.12,.16],[.20,.21],[.13,.43],[-.36,.42],[-.45,.35]];
          front=.13;extrudeProfile(profile,-.13,front,{front:finish,back:'#467982',sole:'#466068',crown:'#b9e0d5',edge:'#5e9a9d'},.5);
          for(let i=0;i<4;i++)tube([V(-.31+i*.12,.255,front+.008),V(-.28+i*.12,.38,front+.008)],.007,'#e6f6e7',.32,6);
        }else{
          const profile=[[-.42,.18],[.13,.18],[.20,.24],[.14,.42],[-.32,.43],[-.43,.34]];
          front=.12;extrudeProfile(profile,-.12,front,{front:finish,back:'#68567f',sole:'#55516d',crown:'#d4bee5',edge:'#8976aa'},.58);
          for(let i=0;i<3;i++)tube([V(-.30+i*.135,.255,front+.009),V(-.26+i*.135,.39,front+.009)],.008,'#f9ebd4',.3,6);
        }
        ellipsoid(-.13,.27,front+.014,.038,.038,.011,'#f9e8bd',.55,8,12);
        ellipsoid(-.13,.27,front+.026,.015,.015,.006,grip,.5,7,10);
      });
    }
  }
  function modelPad(time=0){
    shadow(0,0,.92,.88);ellipseDisc(0,.005,0,.78,.78,.045,'#56385e','#ad82d1');
    ellipseDisc(0,.054,0,.64,.64,.009,'#a979cf','#a979cf');
    ringXZ(0,.066,0,.75,.75,.024,'#eed2ff',.66);ringXZ(0,.073,0,.42,.42,.012,'#f8e3bd',.6);
    for(let i=0;i<16;i++){const a=i*Math.PI/8;ellipsoid(Math.cos(a)*.715,.075,Math.sin(a)*.715,.025,.012,.025,i%2?'#ffddae':'#fbecfc',.9,7,9);}
    for(const z of [-.27,0,.27]){
      tri(V(-.22,.089,z-.11),V(.06,.089,z),V(-.22,.089,z+.11),'#fff7d4',.25);
      box(-.29,.096,z,.08,.015,.19,'#e7c89d',.25);
    }
    for(let i=0;i<3;i++){const a=time*1.2+i*2.09;ellipsoid(Math.cos(a)*.86,.12+Math.sin(time*2+i)*.07,Math.sin(a)*.86,.018,.018,.018,'#f8d2ff',.9,7,9);}
  }
  function modelBumper(){
    shadow(0,0,.7,.6,true);ellipseDisc(0,.005,0,.57,.54,.075,'#95677d','#e6adbf');
    ringXZ(0,.086,0,.48,.44,.03,'#fff0cb',.56);
    ellipticalFrustum(0,0,.16,.49,.37,.37,.345,.345,'#d45171','#fa9a9c',24);
    ringXZ(0,.18,0,.375,.375,.035,'#fce8c4',.72);
    ringXZ(0,.47,0,.35,.35,.032,'#f6d8b4',.74);
    ellipsoid(0,.51,0,.34,.145,.34,'#f47d92',.73,16,26);
    ellipsoid(-.075,.61,.21,.115,.045,.025,'#ffe9d4',.66,9,14);
    ellipseDisc(0,.624,0,.105,.105,.012,'#a64a66','#fff1dc');
    for(let i=0;i<8;i++){const a=i*Math.PI/4;ellipsoid(Math.cos(a)*.475,.104,Math.sin(a)*.44,.018,.009,.018,'#ffe7b5',.75,7,9);}
  }
  function modelMole(time=0){
    const pop=.84+.08*Math.sin(time*2.5),x=1.04;
    shadow(x,0,.42,.35,true);ellipseDisc(x,.008,0,.46,.41,.033,'#c5a278','#ead1a6');
    ringXZ(x,.045,0,.35,.31,.017,'#f3d6a3',.17);
    ellipsoid(x,.16+pop*.17,0,.32,.31*pop,.29,'#d0ab83',.28,12,18);
    ellipsoid(x,.19+pop*.13,.23,.2,.12,.08,'#f1dbb9',.23,10,14);
    for(const side of [-1,1]){ellipsoid(x+side*.13,.34+pop*.13,.255,.026,.03,.018,'#3e3430',.28,7,9);ellipsoid(x+side*.32,.14,.15,.12,.06,.1,'#cba67d',.14,8,10);}
    ellipsoid(x,.25+pop*.13,.30,.055,.038,.025,'#eaa29a',.34,8,11);
    for(const side of [-1,1])for(const j of [-1,1])tube([V(x+side*.09,.26+pop*.13,.32),V(x+side*.31,.24+pop*.13+j*.045,.37)],.004,'#efddbb',.12,5);
  }
  function modelWindmill(){
    shadow(0,0,.78,.58);ellipseDisc(0,.003,0,.61,.49,.08,'#8b6445','#d2a875');
    ellipticalFrustum(0,0,.08,2.1,.54,.39,.33,.20,'#c99a6e','#ecd1a3',20);
    const roofA=V(-.48,2.06,.29),roofB=V(.48,2.06,.29),roofC=V(.48,2.06,-.28),roofD=V(-.48,2.06,-.28),peak=V(0,2.54,.02);
    tri(roofD,roofC,peak,'#865e47');tri(roofC,roofB,peak,'#a97050');tri(roofD,peak,roofA,'#b5835c');tri(roofA,peak,roofB,'#c59062');
    quad(V(-.49,2.02,.30),V(.49,2.02,.30),roofB,roofA,'#704f3c');
    for(const y of [.52,.92,1.32,1.72])ringXZ(0,y,0,.48-(y/2.1)*.15,.36-(y/2.1)*.16,.014,'#e6c093',.12);
    // Recessed arched doorway faces the same +Z side as the rotor.
    box(0,.44,.38,.32,.53,.025,'#624938',.05);ellipsoid(0,.69,.395,.16,.14,.02,'#624938',.05,8,12);
    cylinder(V(0,1.72,.28),V(0,1.72,.45),.12,.12,'#5d668d',.75,16);
  }
  function modelWindmillRotor(time=0){
    const phase=time*1.5+.4;
    for(let i=0;i<4;i++){
      const a=phase+i*Math.PI/2,c=Math.cos(a),s=Math.sin(a),perp=V(-s,c,0);
      const blade=(r,w,z)=>V(c*r+perp[0]*w,1.72+s*r+perp[1]*w,z);
      const innerL=blade(.15,-.07,.46),innerR=blade(.15,.07,.46),outerL=blade(.93,-.16,.46),outerR=blade(.93,.16,.46);
      quad(innerL,outerL,outerR,innerR,i%2?'#ece4f3':'#fff5e7',.4);
      quad(blade(.15,-.07,.38),blade(.93,-.16,.38),outerL,innerL,'#695c93',.26);
      quad(blade(.93,-.16,.38),blade(.93,.16,.38),outerR,outerL,'#645183',.25);
      tube([blade(.20,0,.48),blade(.82,0,.48)],.012,'#866da9',.2,6);
      quad(blade(.72,-.13,.482),blade(.93,-.16,.482),blade(.93,.16,.482),blade(.72,.13,.482),'#e87b91',.48);
    }
    ellipsoid(0,1.72,.50,.16,.16,.08,'#859bc5',.81,12,16);ellipsoid(-.05,1.77,.566,.038,.038,.015,'#fff3d3',.86,8,11);
  }
  function riverCenter(z){return .18*Math.sin(Math.PI*z/3.2)+.07*Math.sin(3*Math.PI*z/3.2);}
  function deckHeight(x){
    const a=Math.abs(x);
    if(a<=1.08)return .18;
    if(a>=1.36)return 0;
    const q=(1.36-a)/.28;return .18*q*q*(3-2*q);
  }
  function modelWaterBridge(time=0,standalone=true){
    const count=48,span=3.2;
    // The cut channel has real side faces. The moving water mesh is uploaded
    // separately each frame below this surrounding grade.
    for(let i=0;i<count;i++){
      const z0=-span+i*2*span/count,z1=-span+(i+1)*2*span/count,c0=riverCenter(z0),c1=riverCenter(z1);
      for(const side of [-1,1]){
        const x0=c0+side*.70,x1=c1+side*.70,b0=c0+side*.58,b1=c1+side*.58;
        if(standalone){
          const far=side*2.6;
          quad(V(far,0,z0),V(far,0,z1),V(x1,0,z1),V(x0,0,z0),i%5?'#a3c493':'#afcc9b',.03);
          quad(V(far,-.19,z0),V(far,0,z0),V(far,0,z1),V(far,-.19,z1),'#8b9878',.02);
        }else{
          quad(V(c0+side*.92,0,z0),V(c1+side*.92,0,z1),V(x1,0,z1),V(x0,0,z0),'#96b985',.02);
        }
        quad(V(x0,0,z0),V(x1,0,z1),V(b1,-.17,z1),V(b0,-.17,z0),
          side<0?'#72978d':'#6d8e85',.06);
      }
      quad(V(c0-.58,-.18,z0),V(c1-.58,-.18,z1),V(c1+.58,-.18,z1),V(c0+.58,-.18,z0),'#296f78',.08);
    }
    // A single smooth support profile carries a ball over both end ramps.
    box(0,.055,0,2.12,.11,1.55,['#c28e5f','#6d503b','#926747','#926747','#a77951','#a77951'],.12);
    const parts=42;
    for(let i=0;i<parts;i++){
      const a=-1.36+i*2.72/parts,b=-1.36+(i+1)*2.72/parts;
      const h0=deckHeight(a),h1=deckHeight(b),tone=Math.floor(i/3)%2?'#dba66e':'#e4b47c';
      quad(V(a,h0, -.79),V(b,h1,-.79),V(b,h1,.79),V(a,h0,.79),tone,.20);
      for(const side of [-1,1])quad(V(a,h0-.055,side*.79),V(b,h1-.055,side*.79),
        V(b,h1,side*.79),V(a,h0,side*.79),'#8a5f42',.12);
    }
    for(const side of [-1,1]){
      for(const x of [-.93,-.31,.31,.93]){
        const foot=deckHeight(x);
        box(x,(foot+.74)/2,side*.82,.07,.74-foot,.07,
          ['#d2a06a','#684b37','#bb8959','#835c3e','#ac784c','#a47750'],.16);
      }
      box(0,.70,side*.82,2.06,.08,.11,
        ['#f4d59f','#825836','#ca9a64','#9a6b47','#b88858','#b88858'],.26);
      box(0,.52,side*.82,2.03,.035,.05,'#a8744e',.14);
      for(const x of [-.62,0,.62])tube([V(x-.28,.20,side*.82),V(x+.28,.71,side*.82)],.021,'#a3714d',.16,6);
    }
    for(let i=-4;i<=4;i++){
      const x=i*.235,h=deckHeight(x);
      for(const side of [-1,1])ellipsoid(x,h+.008,side*.62,.012,.004,.012,'#76513b',.5,5,7);
    }
  }
  function modelWaterSurface(time){
    const count=64,bands=8,span=3.2,width=.575;
    const height=(z,u)=>-.108
      +.008*Math.sin(z*5.2-time*2.8+u*2.4)*(1-.3*Math.abs(u))
      +.0035*Math.sin(z*10.4+time*1.7-u*5.2);
    const point=(z,u,lift=0)=>V(riverCenter(z)+u*width,height(z,u)+lift,z);
    // Broad moving color bands and real wave normals replace a flat strip.
    for(let i=0;i<count;i++)for(let j=0;j<bands;j++){
      const z0=-span+i*2*span/count,z1=-span+(i+1)*2*span/count;
      const u0=-1+j*2/bands,u1=-1+(j+1)*2/bands;
      const midZ=(z0+z1)/2,midU=(u0+u1)/2;
      const current=Math.sin(midZ*2.3-time*1.9+midU*2.7);
      const flash=Math.sin(midZ*5.1-time*3.2-midU*4.4);
      const tone=Math.abs(midU)>.78?'#318b9e':current>.55&&flash>.2?'#80cbd0':current>-.2?'#48aabb':'#2b91a8';
      quad(point(z0,u0),point(z1,u0),point(z1,u1),point(z0,u1),tone,.77);
    }
    // Long current veins curl with the meander and slip beneath the bridge.
    for(let lane=0;lane<5;lane++)for(let run=0;run<3;run++){
      const speed=.42+lane*.035;
      const start=-3.35+((run*2.16+lane*.44+time*speed)%7.2);
      const points=[];
      for(let k=0;k<11;k++){
        const z=start+k*.07;
        if(z<-3.15||z>3.15)continue;
        const u=(lane-2)*.34+.05*Math.sin(z*4.8-time*1.4+lane);
        points.push(point(z,u,.013));
      }
      if(points.length>1)tube(points,.0045,lane%2?'#a8dfe0':'#c7ece6',.78,5);
    }
    // Short broken crests and bank eddies make the flow feel less uniform.
    for(let i=0;i<29;i++){
      const z=-3.12+((i*.47+time*(.34+.035*(i%4)))%6.24);
      const u=((i*7)%13-6)/9;
      const curl=(i%2?1:-1)*.045;
      const points=[point(z-.07,u-.095,.016),point(z,u+curl,.019),point(z+.07,u+.095,.014)];
      tube(points,i%5===0?.006:.0035,i%5===0?'#e1f6e9':'#a9dbd9',.70,5);
    }
    for(const side of [-1,1])for(let i=0;i<13;i++){
      const z=-3.02+((i*.51+time*.22)%6.04);
      tube([point(z-.09,side*.96,.018),point(z,side*.91,.02),point(z+.09,side*.97,.017)],
        .0038,'#d5e9dc',.5,5);
    }
  }
  function modelBridgeDemoBall(time){
    const cycle=time%5.2;
    if(cycle>.0&&cycle<4.2){
      const x=-1.8+cycle*(3.6/4.2),y=deckHeight(x)+.19;
      ellipseDisc(x,deckHeight(x)+.006,0,.24,.17,.003,'#927253','#927253',20);
      ellipsoid(x,y,0,.19,.19,.19,'#f8faf5',.75,12,20);
    }
  }
  function bowlHeight(x,z){const r=Math.hypot(x,z),q=Math.max(0,1-(r/3.3)**2);return -.12*q*q;}
  function modelCup(time=0,standalone=true){
    if(standalone)terrainWithHole(7.6,7.6,0,0,3.3);
    const rings=13,sides=48;
    for(let j=0;j<rings;j++){const r0=.54+j*(3.3-.54)/rings,r1=.54+(j+1)*(3.3-.54)/rings;
      for(let i=0;i<sides;i++){const a=i*2*Math.PI/sides,b=(i+1)*2*Math.PI/sides;
        const at=(r,angle)=>V(Math.cos(angle)*r,bowlHeight(Math.cos(angle)*r,Math.sin(angle)*r)+.02,Math.sin(angle)*r);
        quad(at(r0,a),at(r1,a),at(r1,b),at(r0,b),'#a0bf87',.025);
      }
    }
    annulusXZ(0,.021,0,3.49,3.49,3.3,3.3,'#a1bf8c',.025);
    for(const r of [.95,1.65,2.45,3.3]){const points=[];for(let i=0;i<48;i++){const a=i*2*Math.PI/48,x=Math.cos(a)*r,z=Math.sin(a)*r;points.push(V(x,bowlHeight(x,z)+.025,z));}tube(points,.009,r===.95?'#ecedbb':'#b9d5a1',.05,5,true);}
    const floor=bowlHeight(0,0),poleGround=bowlHeight(.72,0);
    annulusXZ(0,floor+.029,0,.59,.57,.49,.47,'#f4e3b7',.25);
    for(let i=0;i<40;i++){const a=i*Math.PI/20,b=(i+1)*Math.PI/20;
      quad(V(.49*Math.cos(a),floor+.027,.47*Math.sin(a)),V(.49*Math.cos(b),floor+.027,.47*Math.sin(b)),
        V(.41*Math.cos(b),floor-.46,.39*Math.sin(b)),V(.41*Math.cos(a),floor-.46,.39*Math.sin(a)),'#17423a',.05);
    }
    ringXZ(0,floor+.037,0,.54,.52,.042,'#f8e7b8',.36);
    ringXZ(0,floor+.032,0,.46,.44,.010,'#4b6751',.1);
    // A lower inner wall and floor make this a cavity, not a black sticker.
    ellipseDisc(0,floor-.48,0,.42,.40,.012,'#0b2b28','#0b2b28');
    const x=.72;ellipseDisc(x,poleGround+.018,0,.18,.15,.045,'#806b4b','#f0d19a');
    cylinder(V(x,poleGround+.06,0),V(x,poleGround+2.15,0),.034,.024,'#f5e7c4',.81,12);
    cylinder(V(x,poleGround+2.13,0),V(x,poleGround+2.2,0),.045,.03,'#d0a56e',.73,10);
    const wave=Math.sin(time*2)*.06;
    const a=V(x,poleGround+2.09,0),b=V(x+1.06,poleGround+1.88+wave,.05),c=V(x,poleGround+1.60,0),fold=V(x+.52,poleGround+1.89+wave*.5,.10);
    tri(a,fold,c,'#f5848c',.18);tri(a,b,fold,'#ea667e',.26);tri(fold,b,c,'#b9446c',.16);
    tube([V(x,poleGround+2.08,.015),V(x+.48,poleGround+2.02+wave*.4,.08),V(x+1.03,poleGround+1.89+wave,.06)],.013,'#ffe4d9',.24,6);
    // The wall is a fixed shallow parabola. Its front normals bank off-axis
    // overshoots back toward the cup; the geometry never moves.
    modelCurvedBackstop();
  }
  function backstopX(z){return 1.25-.18*z*z;}
  function modelCurvedBackstop(){
    const segments=32,half=1.8,thickness=.14;
    for(let i=0;i<segments;i++){
      const z0=-half+i*2*half/segments,z1=-half+(i+1)*2*half/segments;
      const f0=backstopX(z0),f1=backstopX(z1),b0=bowlHeight(f0,z0),b1=bowlHeight(f1,z1);
      const t0=b0+.55,t1=b1+.55;
      const shade=i%5===0?'#a77b50':'#9b704a';
      quad(V(f0,b0,z0),V(f1,b1,z1),V(f1,t1,z1),V(f0,t0,z0),shade,.19);
      quad(V(f0+thickness,b0,z0),V(f0+thickness,t0,z0),
        V(f1+thickness,t1,z1),V(f1+thickness,b1,z1),'#76563d',.12);
      quad(V(f0-.015,t0+.028,z0),V(f1-.015,t1+.028,z1),
        V(f1+thickness+.015,t1+.028,z1),V(f0+thickness+.015,t0+.028,z0),'#f8deb0',.24);
      quad(V(f0-.015,t0-.006,z0),V(f1-.015,t1-.006,z1),
        V(f1-.015,t1+.028,z1),V(f0-.015,t0+.028,z0),'#caa16b',.22);
      if(i%4===0){
        const points=[V(f0-.008,b0+.08,z0),V(f0-.008,t0-.055,z0)];
        tube(points,.011,'#e3bd84',.18,5);
      }
    }
    // A slim timber toe helps the front contact surface read at low angles.
    const toe=[];for(let i=0;i<=32;i++){
      const z=-1.8+i*3.6/32,x=backstopX(z);
      toe.push(V(x-.018,bowlHeight(x,z)+.045,z));
    }
    tube(toe,.022,'#694b38',.13,7);
  }
  function modelBackstopDemoBall(time){
    const cycle=time%6.4;
    if(cycle<.55||cycle>4.2)return;
    const impactZ=1,faceX=backstopX(impactZ);
    const normal=unit(V(-1,0,-.36*impactZ));
    const impactX=faceX+normal[0]*.19,contactZ=impactZ+normal[2]*.19;
    const incoming=(impactX+.75)/1.45,dotIn=incoming*normal[0],restitution=.82;
    const vx=incoming-(1+restitution)*dotIn*normal[0];
    const vz=-(1+restitution)*dotIn*normal[2];
    let x,z,y;
    if(cycle<2){
      const q=(cycle-.55)/1.45;
      x=-.75+(impactX+.75)*q;z=contactZ;
    }else if(cycle<3.35){
      const flight=cycle-2;
      x=impactX+vx*flight;z=contactZ+vz*flight;
    }else{x=impactX+vx*1.35;z=contactZ+vz*1.35;}
    y=bowlHeight(x,z)+.19;
    if(cycle>=3.35){
      const q=Math.min(1,(cycle-3.35)/.66);
      y=bowlHeight(x,z)+.19-.468*q;
    }
    if(cycle<3.35)ellipseDisc(x,bowlHeight(x,z)+.008,z,.24,.18,.003,'#77916f','#77916f',20);
    ellipsoid(x,y,z,.19,.19,.19,'#f9faf2',.72,12,20);
    ellipsoid(x-.05,y+.07,z+.135,.025,.025,.009,'#ffffff',.6,7,10);
    if(Math.abs(cycle-2)<.13){
      const glint=Math.max(.008,.05*(1-Math.abs(cycle-2)/.13));
      ellipsoid(faceX-.02,bowlHeight(faceX,impactZ)+.34,impactZ,glint,glint,glint,'#fff3c5',.7,8,10);
    }
  }
  function modelLoop(){
    shadow(0,0,1.0,.65);ellipseDisc(0,.009,0,.76,.59,.055,'#287486','#7fcad2');
    const ring=[];for(let i=0;i<48;i++){const a=i*2*Math.PI/48;ring.push(V(0,1.1+Math.cos(a)*1.1,Math.sin(a)*.82));}
    tube(ring,.13,'#66c5d1',.6,10,true);
    const inner=[];for(let i=0;i<48;i++){const a=i*2*Math.PI/48;inner.push(V(.035,1.1+Math.cos(a)*1.1,Math.sin(a)*.82));}
    tube(inner,.035,'#dff8ef',.46,7,true);
    for(const x of [-.30,-.04,.22])polygon([V(x-.12,.071,-.11),V(x+.14,.071,0),V(x-.12,.071,.11)],'#f8efc7',.2);
    for(let i=0;i<5;i++){const a=i*2*Math.PI/5;ellipsoid(.02,1.1+Math.cos(a)*1.1,Math.sin(a)*.82,.045,.045,.045,'#fff0bd',.87,7,9);}
  }
  function modelCannon(){
    shadow(0,0,.95,.7);ellipseDisc(0,.008,0,.86,.65,.07,'#6e533f','#ba8258');
    box(0,.28,0,1.28,.15,.64,['#be8b5f','#544638','#8f6748','#76553f','#99714d','#9c714c'],.15);
    const rear=V(-.47,.56,0),front=V(.59,.73,0),axis=unit(sub(front,rear)),side=unit(cross(axis,[0,1,0])),up=unit(cross(side,axis));
    const ring=(center,a,r)=>add(center,add(scale(side,Math.cos(a)*r),scale(up,Math.sin(a)*r)));
    for(let i=0;i<24;i++){const a=i*2*Math.PI/24,b=(i+1)*2*Math.PI/24;
      quad(ring(rear,a,.25),ring(rear,b,.25),ring(front,b,.29),ring(front,a,.29),i%3?'#5386b7':'#7faed6',.67);
      quad(ring(front,a,.29),ring(front,b,.29),ring(front,b,.21),ring(front,a,.21),'#e9cc94',.51);
      quad(ring(rear,b,.25),ring(rear,a,.25),ring(rear,a,.218),ring(rear,b,.218),'#b99974',.24);
      quad(ring(front,a,.21),ring(front,b,.21),ring(rear,b,.218),ring(rear,a,.218),'#254657',.13);
    }
    box(-.77,.32,0,.38,.055,.28,['#e7bf89','#604537','#b18660','#8a6244','#a67851','#a67851'],.16);
    for(const center of [rear,front]){const points=[];for(let i=0;i<32;i++){const a=i*2*Math.PI/32;points.push(ring(center,a,center===front?.305:.263));}tube(points,.024,'#f5dfa9',.62,7,true);}
    for(const x of [-.40,.40])for(const z of [-.45,.45]){
      cylinder(V(x,.29,z),V(x,.29,z+(z>0?.08:-.08)),.27,.27,'#8b5a41',.24,18);
      const wheelZ=z+(z>0?.09:-.09);
      for(let i=0;i<8;i++){const a=i*Math.PI/4;tube([V(x,.29,wheelZ),V(x+Math.cos(a)*.23,.29+Math.sin(a)*.23,wheelZ)],.015,'#e9c090',.26,6);}
      ellipsoid(x,.29,wheelZ,.055,.055,.018,'#f2d5a3',.48,8,12);
    }
  }
  function modelCannonDemoBall(time){
    const cycle=time%3.6;
    if(cycle<.20||cycle>2.80)return;
    let x,y;
    if(cycle<.70){const q=(cycle-.20)/.50;x=-1.34+q*.77;y=.35+q*.18;}
    else if(cycle<1.15){const q=(cycle-.70)/.45;x=-.57+q*.97;y=.53+q*.16;}
    else if(cycle<1.45){x=.40;y=.69;}
    else{
      const q=(cycle-1.45)/1.35;x=.40+q*2.15;
      y=x<=.82?.69+(x-.40)*(.17/1.06):.757+(x-.82)*.40-.08*(x-.82)**2;
    }
    ellipsoid(x,y,0,.19,.19,.19,'#fff8e8',.76,12,20);
    ellipsoid(x-.045,y+.07,.136,.026,.026,.009,'#ffffff',.63,7,10);
    if(cycle>=1.45&&cycle<1.72){
      const r=.04+(cycle-1.45)*.7;
      const flash=[];for(let i=0;i<24;i++){const a=i*Math.PI/12;flash.push(V(.73,.73+Math.sin(a)*r,Math.cos(a)*r));}
      tube(flash,.023,'#ffdf9c',.8,7,true);
      for(let i=0;i<7;i++){const a=i*Math.PI*2/7;
        ellipsoid(.82+Math.abs(Math.cos(a))*r,.73+Math.sin(a)*r*.8,Math.cos(a)*r,.025,.025,.025,'#ffb86d',.8,6,8);}
    }
  }
  function buildScene(id,time){
    if(id==='course'){
      buildFairway(14,false,true);
      withPose(-4.15,.08,.10,0,()=>modelPad(time));
      withPose(-2.15,.07,-.35,0,()=>modelBumper());
      withPose(-.5,.10,.25,0,()=>modelLoop());
      withPose(1.1,.10,-2.8,0,modelWindmill);
      withSlopePose(3.0,.267,0,0,-.046,()=>modelWaterBridge(time,false));
      withPose(4.4,.09,.2,0,()=>modelCannon());
      withPose(6.2,.05,0,0,()=>modelCup(time,false));
    }else if(id==='fairway')buildFairway();
    else if(id==='balls'){groundPlate(3.4,1.8);for(const [i,family] of ['rebound','whirl','glide'].entries()){
      const x=(i-1)*.92;ellipseDisc(x,.002,0,.39,.37,.045,'#8aab8d','#dbe2c2');modelBall(family,x,.29,0,time);
    }}
    else if(id==='clubs')modelClubs(time);
    else if(id==='pad'){groundPlate(2.8,2.5);modelPad(time);}
    else if(id==='bumper'){groundPlate(3.4,2.6);withPose(-.9,0,0,0,modelBumper);modelMole(time);}
    else if(id==='windmill'){groundPlate(2.6,2.4);modelWindmill();}
    else if(id==='bridge')modelWaterBridge(time);
    else if(id==='cup')modelCup(time);
    else if(id==='tricks'){groundPlate(5.2,2.7);withPose(-1.45,0,0,0,modelLoop);withPose(1.35,0,0,0,modelCannon);}
  }
  function buildMovement(id,time){
    if(id==='windmill')modelWindmillRotor(time);
    else if(id==='cup')modelBackstopDemoBall(time);
    else if(id==='bridge'){modelWaterSurface(time);modelBridgeDemoBall(time);}
    else if(id==='tricks')withPose(1.35,0,0,0,()=>modelCannonDemoBall(time));
    else if(id==='course'){
      withPose(1.1,.10,-2.8,0,()=>modelWindmillRotor(time));
      withSlopePose(3.0,.267,0,0,-.046,()=>modelWaterSurface(time));
    }
  }
  function rebuildStatic(){
    vertices=[];pose={x:0,y:0,z:0,yaw:0};buildScene(selected,0);
    const data=new Float32Array(vertices);staticCount=data.length/10;
    gl.bindBuffer(gl.ARRAY_BUFFER,staticGeometry.buffer);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);
  }

  function resize(){const bounds=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2,Math.sqrt(5000000/Math.max(1,bounds.width*bounds.height)));const w=Math.max(1,Math.round(bounds.width*dpr)),h=Math.max(1,Math.round(bounds.height*dpr));if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}gl.viewport(0,0,w,h);}
  function frame(now){const dt=Math.min(.05,(now-previous)/1000);previous=now;clock+=dt;if(turning)camera.az+=dt*.14;resize();
    gl.clearColor(.86,.92,.87,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);gl.useProgram(program);
    const target=camera.target,aspect=canvas.width/canvas.height,r=camera.r*Math.max(1,Math.min(1.45,.98/aspect)),el=camera.el,az=camera.az;
    const eye=[target[0]+r*Math.cos(el)*Math.cos(az),target[1]+r*Math.sin(el),target[2]+r*Math.cos(el)*Math.sin(az)];
    gl.uniformMatrix4fv(uniforms.projection,false,perspective(48*Math.PI/180,aspect,.05,90));gl.uniformMatrix4fv(uniforms.view,false,lookAt(eye,target));gl.uniform3fv(uniforms.camera,eye);
    gl.bindVertexArray(staticGeometry.vao);gl.drawArrays(gl.TRIANGLES,0,staticCount);
    if(selected==='windmill'||selected==='course'||selected==='cup'||selected==='bridge'||selected==='tricks'){
      vertices=[];pose={x:0,y:0,z:0,yaw:0};buildMovement(selected,clock);
      gl.bindBuffer(gl.ARRAY_BUFFER,movingGeometry.buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(vertices),gl.DYNAMIC_DRAW);
      gl.bindVertexArray(movingGeometry.vao);gl.drawArrays(gl.TRIANGLES,0,vertices.length/10);
    }
    requestAnimationFrame(frame);
  }
  select('course');requestAnimationFrame(frame);
})();
