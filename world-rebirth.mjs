import {seededRandom,rebirthState,siegeState,materializationState,cosmicSpread,processionalStep,holyRadius,smootherStep,HOLY_ORIGIN} from './world-model.mjs?v=goddess-revival-20261110';
import {createAncients} from './world-creatures.mjs?v=goddess-revival-20261110';
import {createManifestation} from './world-reveal.mjs?v=goddess-revival-20261110';

import {createDemonSwarm} from './world-swarm.mjs?v=goddess-revival-20261110';

import {createPalaceIsland} from './world-islands.mjs?v=goddess-revival-20261110';

import {createAscension} from './world-ascension.mjs?v=goddess-revival-20261110';

const vertex=`varying vec3 vW,vN;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`;

// All additions are local procedural geometry. Shared instancing keeps the temples inexpensive.
export function createRebirthWorld(THREE,scene,camera,surfaces){
  const random=seededRandom(312),darkness=new THREE.Group(),heavens=new THREE.Group(),sanctum=new THREE.Group();
  darkness.name='Ancient watchers';heavens.name='Cloud palaces';sanctum.name='Sacred world centre';scene.add(darkness,heavens,sanctum);
  const u={time:{value:0},cleanse:{value:0},sun:{value:0},wave:{value:0},ratio:{value:1},camera:{value:camera.position},threat:{value:0},enemyClock:{value:0},radius:{value:0},sources:{value:[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()]}};
  const sphere=new THREE.SphereGeometry(1,24,18),cone=new THREE.ConeGeometry(1,1,16),torus=new THREE.TorusGeometry(1,.028,6,96);
  function mesh(group,geo,material,pos,scale=[1,1,1],rotation=[0,0,0]){const o=new THREE.Mesh(geo,material);o.position.set(...pos);o.scale.set(...scale);o.rotation.set(...rotation);group.add(o);return o;}
  const ancients=createAncients(THREE,darkness,camera),watchers=ancients.actors,swarm=createDemonSwarm(THREE,darkness,scene,camera);

  const marble=new THREE.MeshStandardMaterial({map:surfaces.inlayMap,normalMap:surfaces.normalMap,normalScale:new THREE.Vector2(.13,.13),color:0xe9e6d9,metalness:.22,roughness:.38,envMapIntensity:1.1});
  const gilt=new THREE.MeshStandardMaterial({color:0xe5bc6b,metalness:.84,roughness:.23,envMapIntensity:1.5});
  const blue=new THREE.MeshStandardMaterial({color:0x275675,metalness:.48,roughness:.27});
  const lightMat=new THREE.MeshBasicMaterial({color:new THREE.Color(2.1,1.5,.65),toneMapped:false});
  const cylinder=new THREE.CylinderGeometry(1,1,1,24),dome=new THREE.SphereGeometry(1,36,24,0,Math.PI*2,0,Math.PI/2);
  const pedimentShape=new THREE.Shape();pedimentShape.moveTo(-2.42,0);pedimentShape.lineTo(2.42,0);pedimentShape.lineTo(0,.94);pedimentShape.closePath();
  const pediment=new THREE.ExtrudeGeometry(pedimentShape,{depth:.22,bevelEnabled:true,bevelSize:.025,bevelThickness:.025,bevelSegments:2,steps:1}),doorArch=new THREE.TorusGeometry(.65,.08,8,40,Math.PI);
  function batchBuilder(group){const pools=new Map(),dummy=new THREE.Object3D();return {add(geo,mat,p,s,r=[0,0,0]){const key=geo.uuid+mat.uuid;if(!pools.has(key))pools.set(key,{geo,mat,entries:[]});pools.get(key).entries.push({p,s,r});},finish(){for(const {geo,mat,entries} of pools.values()){const inst=new THREE.InstancedMesh(geo,mat,entries.length);entries.forEach((e,i)=>{dummy.position.set(...e.p);dummy.scale.set(...e.s);dummy.rotation.set(...e.r);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);});inst.castShadow=false;inst.receiveShadow=true;group.add(inst);}}};}
  function palace(x,y,z,size,index){
    const root=new THREE.Group();heavens.add(root);root.position.set(x,y,z);root.scale.setScalar(size);
    const layers=Array.from({length:3},()=>{const g=new THREE.Group();root.add(g);return g;}),builders=layers.map(g=>batchBuilder(g));
    const b={add(geo,mat,p,s,r){builders[p[1]<.65?0:p[1]>3.06?2:1].add(geo,mat,p,s,r);},finish(){builders.forEach(b=>b.finish());}},box=surfaces.bevelGeometry;
    for(let k=0;k<3;k++)b.add(cylinder,marble,[0,k*.16,0],[3.0-k*.22,.17,2.4-k*.18]);
    b.add(cylinder,gilt,[0,.55,0],[2.65,.08,2.05]);b.add(box,marble,[0,1.65,0],[2.9,2.2,1.65]);b.add(box,blue,[0,1.65,.85],[1.25,1.8,.035]);
    function column(x,z){b.add(cylinder,marble,[x,1.7,z],[.17,2.12,.17]);for(const h of [.65,2.68]){b.add(box,marble,[x,h,z],[.48,.15,.48]);b.add(cylinder,gilt,[x,h+.11,z],[.235,.07,.235]);}for(const s of [-1,1])b.add(sphere,gilt,[x+s*.19,2.76,z],[.085,.085,.085]);for(let k=0;k<8;k++){const a=k*Math.PI/4;b.add(cylinder,gilt,[x+Math.cos(a)*.173,1.7,z+Math.sin(a)*.173],[.008,1.85,.008]);}}
    for(let side of [-1,1])for(let j=0;j<5;j++)column(side*1.9,-1.55+j*.77);
    for(let j=0;j<6;j++)column(-2.0+j*.8,1.65);
    b.add(box,marble,[0,2.92,0],[4.6,.22,3.85]);b.add(box,gilt,[0,3.07,0],[4.65,.08,3.9]);
    b.add(pediment,marble,[0,3.13,1.97],[1,1,1]);b.add(box,gilt,[0,3.13,2.22],[4.85,.06,.055]);
    for(const side of [-1,1])b.add(box,gilt,[side*1.21,3.6,2.22],[2.6,.055,.055],[0,0,-side*.37]);
    b.add(cylinder,gilt,[0,3.52,2.24],[.23,.045,.23],[Math.PI/2,0,0]);b.add(sphere,blue,[0,3.52,2.28],[.13,.13,.025]);
    // The recessed entrance and its stone arch read as architecture rather than a flat facade.
    b.add(doorArch,gilt,[0,2.03,.93],[1,1,1]);for(const side of [-1,1]){b.add(box,marble,[side*.72,1.42,.91],[.16,1.25,.2]);b.add(box,gilt,[side*.61,1.42,1.025],[.04,1.25,.025]);}
    for(let j=0;j<9;j++){const x=-2.08+j*.52;b.add(box,gilt,[x,2.96,1.95],[.12,.13,.035]);}
    for(const side of [-1,1]){b.add(box,marble,[side*1.51,1.62,-.2],[.22,2.1,2.7]);for(let j=0;j<4;j++){const z=-1.17+j*.67;b.add(box,blue,[side*1.635,1.72,z],[.03,.95,.3]);b.add(box,gilt,[side*1.66,2.26,z],[.03,.065,.36]);}}
    b.add(dome,marble,[0,3.08,-.15],[1.65,1.45,1.5]);
    for(let k=0;k<8;k++){const az=k/8*Math.PI*2,points=[];for(let j=0;j<=18;j++){const t=j/18*Math.PI/2;points.push(new THREE.Vector3(Math.sin(t)*Math.cos(az)*1.67,3.08+Math.cos(t)*1.47,-.15+Math.sin(t)*Math.sin(az)*1.52));}b.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),24,.018,6,false),gilt,[0,0,0],[1,1,1]);}b.add(cone,gilt,[0,4.88,-.15],[.15,.7,.15]);b.add(sphere,lightMat,[0,5.28,-.15],[.12,.12,.12]);
    for(const s of [-1,1]){b.add(cylinder,marble,[s*3.25,2.0,-.8],[.49,3.3,.49]);for(const h of [.45,.65,3.35,3.56])b.add(cylinder,gilt,[s*3.25,h,-.8],[.57,.11,.57]);b.add(dome,gilt,[s*3.25,3.65,-.8],[.65,.65,.65]);b.add(cone,gilt,[s*3.25,4.45,-.8],[.1,.55,.1]);for(let j=0;j<3;j++){b.add(box,blue,[s*3.25,1.4+j*.6,-.295],[.22,.34,.025]);b.add(box,gilt,[s*3.25,1.62+j*.6,-.28],[.28,.04,.03]);}}
    // Front approach / miniature stairs and balustrades give the temples a readable scale.
    for(let j=0;j<7;j++)b.add(box,marble,[0,.48-j*.065,2.05+j*.22],[3.,.13,.34]);
    for(const s of [-1,1])for(let j=0;j<8;j++){b.add(cylinder,marble,[s*(1.3+j*.2),.85,2.12],[.045,.5,.045]);}
    // A continuous load-bearing terrace now supports every tower and the whole courtyard.
    b.add(box,marble,[0,-.08,.25],[9.6,.25,8.1]);b.add(box,gilt,[0,.065,.25],[9.64,.045,8.14]);b.add(box,marble,[0,.1,.25],[9.35,.04,7.9]);
    for(const side of [-1,1]){b.add(box,marble,[side*2.95,1.5,-.25],[1.22,2.15,3.9]);b.add(box,gilt,[side*2.95,2.62,-.25],[1.32,.12,4.0]);for(let j=0;j<4;j++){b.add(box,blue,[side*3.575,1.62,-1.65+j*.85],[.035,.88,.3]);b.add(box,gilt,[side*3.6,2.12,-1.65+j*.85],[.04,.07,.38]);}
      for(const z of [-2.75,3.35]){b.add(cylinder,marble,[side*3.85,1.22,z],[.48,2.2,.48]);b.add(cylinder,gilt,[side*3.85,2.37,z],[.55,.13,.55]);b.add(dome,marble,[side*3.85,2.44,z],[.5,.5,.5]);b.add(cone,gilt,[side*3.85,3.1,z],[.1,.48,.1]);}
      b.add(box,gilt,[side*4.5,.16,.25],[.045,.035,7.8]);for(let j=0;j<13;j++)b.add(cylinder,marble,[side*4.42,.5,-3.35+j*.6],[.055,.72,.055]);b.add(box,marble,[side*4.42,.9,.25],[.17,.12,7.75]);
      for(let j=0;j<6;j++){const x=side*(1.8+j*.49);b.add(cylinder,marble,[x,.48,4.12],[.055,.7,.055]);b.add(box,gilt,[x,.9,4.12],[.45,.07,.15]);}}
    b.add(box,marble,[0,1.55,-2.55],[7.75,2.8,.45]);b.add(box,gilt,[0,3,-2.55],[7.9,.13,.6]);for(let j=0;j<15;j++)b.add(box,marble,[-3.65+j*.52,3.28,-2.55],[.28,.45,.55]);
    for(const z of [-3.65,4.15])b.add(box,gilt,[0,.16,z],[9.1,.035,.045]);
    b.finish();const island=createPalaceIsland(THREE,root,surfaces,index);const halo=mesh(root,torus,lightMat,[0,2.2,-1.7],[3.75,3.75,3.75]);halo.position.z=-2.15;halo.rotation.x=.12;
    const ringMaterial=new THREE.MeshBasicMaterial({color:new THREE.Color(2.3,1.6,.65),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
    const constructionRing=mesh(root,new THREE.TorusGeometry(3.4,.018,6,120),ringMaterial,[0,.4,0],[1,1,1],[Math.PI/2,0,0]);
    root.userData.completeCastle=true;return {root,x,y,scale:size,index,island,halo,layers,constructionRing,footprint:{halfWidth:4.8,front:4.3,back:-3.8}};
  }
  const palaces=[palace(-11,1.0,-13,1.35,0),palace(11.5,.7,-13.8,1.3,1),palace(-5.5,3,-29,1.28,2)];
  palaces.forEach(p=>{p.halo.userData.revealIgnore=true;p.constructionRing.userData.revealIgnore=true;p.manifest=createManifestation(THREE,p.root);});

  const cloudGeo=new THREE.BufferGeometry(),cloudCount=144,cloudPos=new Float32Array(cloudCount*3),cloudSeed=new Float32Array(cloudCount*3);
  for(let i=0;i<cloudCount;i++){const p=palaces[i%3],a=random()*Math.PI*2,r=1+random()*4;cloudPos.set([p.x+Math.cos(a)*r*p.scale,p.y-.6+random()*.7,p.root.position.z+Math.sin(a)*r*p.scale],i*3);cloudSeed.set([random(),random(),random()],i*3);}
  cloudGeo.setAttribute('position',new THREE.BufferAttribute(cloudPos,3));cloudGeo.setAttribute('aSeed',new THREE.BufferAttribute(cloudSeed,3));
  const cloudMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:u.time,uOpacity:{value:0},uWarm:{value:0},uRatio:u.ratio},
    vertexShader:`attribute vec3 aSeed;uniform float uTime,uRatio;varying float vSeed;void main(){vec3 p=position;p.x+=sin(uTime*.018+aSeed.x*6.)*.35;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=min(240.,(100.+aSeed.y*160.)*uRatio*8./max(1.,-mv.z));vSeed=aSeed.z;}`,
    fragmentShader:`uniform float uOpacity,uWarm;varying float vSeed;void main(){float r=length((gl_PointCoord-.5)*vec2(1.,1.35))*2.;float a=exp(-r*r*3.5)*(1.-smoothstep(.65,1.,r));vec3 cold=mix(vec3(.25,.4,.55),vec3(.93,.79,.59),vSeed),warm=mix(vec3(.65,.25,.055),vec3(1.55,1.04,.43),vSeed);gl_FragColor=vec4(mix(cold,warm,uWarm),a*.14*uOpacity);}`});
  const cloudOriginal=cloudPos.slice(),clouds=new THREE.Points(cloudGeo,cloudMat);heavens.add(clouds);clouds.frustumCulled=false;

  // The ruined centre is restored with a complete marble dais, processional ring and pylons.
  const pylons=new THREE.Group();sanctum.add(pylons);const foundationBatch=batchBuilder(sanctum),pylonBatch=batchBuilder(pylons),box=surfaces.bevelGeometry;
  const b={add(geo,mat,p,s,r){(p[1]>.2?pylonBatch:foundationBatch).add(geo,mat,p[1]===-.585?p:[p[0],p[1]-.33,p[2]],s,r);},finish(){foundationBatch.finish();pylonBatch.finish();}};
  b.add(cylinder,marble,[0,-.72,-.1],[6.6,.42,6.6]);b.add(cylinder,gilt,[0,-.495,-.1],[6.63,.045,6.63]);b.add(cylinder,marble,[0,-.4,-.1],[6.25,.18,6.25]);
  b.add(cylinder,marble,[0,-.585,-.1],[5.9,.22,5.9]);
  for(let i=0;i<80;i++){const a=i/80*Math.PI*2,r=5.45;b.add(box,i%5===0?lightMat:gilt,[Math.cos(a)*r,-.04,Math.sin(a)*r-.1],[.025,.025,i%5===0?.42:.18],[0,-a,0]);}
  for(let j=0;j<3;j++){const r=4.95+j*.15;b.add(new THREE.TorusGeometry(r,.025,5,128),gilt,[0,-.015,-.1],[1,1,1],[Math.PI/2,0,0]);}
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,x=Math.cos(a)*5.5,z=Math.sin(a)*5.5-.1;if(z>2&&Math.abs(x)<2.5)continue;
    b.add(cylinder,marble,[x,.05,z],[.4,.25,.4]);b.add(cylinder,marble,[x,.85,z],[.17,1.4,.17]);b.add(cylinder,gilt,[x,1.6,z],[.32,.12,.32]);b.add(sphere,lightMat,[x,1.83,z],[.12,.12,.12]);}
  for(const s of [-1,1]){b.add(box,marble,[s*4.7,1.85,-2.6],[.72,4.2,.72]);for(const h of [.0,.18,3.7,3.95])b.add(box,gilt,[s*4.7,h,-2.6],[.98,.12,.98]);for(const side of [-1,1]){b.add(box,gilt,[s*4.7+side*.29,1.9,-2.22],[.035,3.25,.025]);}b.add(box,blue,[s*4.7,2,-2.22],[.29,2.6,.025]);b.add(cone,gilt,[s*4.7,4.5,-2.6],[.3,.9,.3]);}
  // The restored summoning circle stays clear; the night approach remains in world-scene.
  b.finish();
  const floorGroup=new THREE.Group();scene.add(floorGroup);const repairPieces=[],sectorGeometry=new THREE.CylinderGeometry(5.72,5.72,.065,8,1,false,0,Math.PI*2/12-.018);
  for(let i=0;i<12;i++){const tile=mesh(floorGroup,sectorGeometry,blue,[0,-.4425,-.1],[1,1,1],[0,i/12*Math.PI*2,0]);tile.name=`Sanctuary floor sector ${i+1}`;repairPieces.push(tile);}
  const crest=mesh(sanctum,new THREE.RingGeometry(1,1.025,96),lightMat,[0,-.39,-.1],[1,1,1],[Math.PI/2,0,0]);
  const centreManifest=createManifestation(THREE,sanctum),floorManifest=createManifestation(THREE,floorGroup),ascension=createAscension(THREE,scene,palaces,surfaces,marble,gilt,camera);
  const rays=new THREE.Mesh(new THREE.PlaneGeometry(62,62),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    uniforms:{uTime:u.time,uSun:u.sun},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vUv;uniform float uTime,uSun;void main(){vec2 p=(vUv-.5)*2.;float r=length(p),a=atan(p.y,p.x);float f=pow(max(0.,sin(a*27.+sin(a*11.)*.8+uTime*.012)),18.);float f2=pow(max(0.,sin(a*53.-uTime*.008)),26.);float mask=smoothstep(.084,.13,r)*(1.-smoothstep(.15,1.,r));float halo=exp(-r*7.);gl_FragColor=vec4(vec3(2.6,1.85,.83),mask*halo*(.19+f*.65+f2*.22)*uSun);}`}));
  rays.position.set(0,3.9,-3.35);scene.add(rays);
  const waveShell=mesh(scene,new THREE.SphereGeometry(1,48,28),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{uWave:u.wave,uCamera:u.camera},vertexShader:vertex,
    fragmentShader:`varying vec3 vW,vN;uniform float uWave;uniform vec3 uCamera;void main(){float rim=pow(clamp(1.-abs(dot(normalize(vN),normalize(uCamera-vW))),0.,1.),4.);float life=sin(clamp(uWave,0.,1.)*3.14159265);gl_FragColor=vec4(vec3(3.5,2.3,.9),rim*life*.32);}`}),[0,3.9,-3.2]);
  const particles=1800,pg=new THREE.BufferGeometry(),seeds=new Float32Array(particles*4);
  for(let i=0;i<particles;i++)seeds.set([random()*Math.PI*2,random()*2-1,random(),random()],i*4);
  pg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(particles*3),3));pg.setAttribute('aP',new THREE.BufferAttribute(seeds,4));
  const pm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:u.time,uSun:u.sun,uWave:u.wave,uRatio:u.ratio},
    vertexShader:`attribute vec4 aP;uniform float uTime,uSun,uWave,uRatio;varying float vA;void main(){float r=mix(0.,54.*uWave,.94+aP.z*.06);float h=aP.y,s=sqrt(max(0.,1.-h*h));float a=aP.x+uTime*.015;vec3 p=vec3(cos(a)*s*r,h*r,sin(a)*s*r)+vec3(0,3.9,-3.2);p.y+=sin(uTime*.1+aP.w*8.)*.5;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((1.+aP.w*2.)*uRatio*25./max(.5,-mv.z),1.,6.);vA=uSun*(.35+.65*sin(aP.z*40.+uTime*.14)*sin(aP.z*40.+uTime*.14));}`,
    fragmentShader:`varying float vA;void main(){vec2 p=(gl_PointCoord-.5)*2.;float r=length(p);if(r>1.)discard;float star=exp(-abs(p.x)*23.)+exp(-abs(p.y)*23.);gl_FragColor=vec4(vec3(2.6,1.9,.8),vA*(exp(-r*r*7.)+star*.2)*(1.-smoothstep(.7,1.,r)));}`});
  const motes=new THREE.Points(pg,pm);motes.frustumCulled=false;scene.add(motes);
  const gatherCount=1400,gatherGeo=new THREE.BufferGeometry(),destinations=new Float32Array(gatherCount*3),gatherSeeds=new Float32Array(gatherCount*4),origins=Array.from({length:4},()=>new THREE.Vector3()),scales=new Float32Array([1,1,1,1]),opacity=new Float32Array(4),gatherLight=new Float32Array(4);
  for(let i=0;i<gatherCount;i++){const id=i%4,x=-2+Math.round(random()*6)*.67,y=.6+random()*2.2,z=1.8;if(id===3){const a=random()*Math.PI*2,r=2+random()*3.7;destinations.set([Math.cos(a)*r,-.37,Math.sin(a)*r-.1],i*3);}else if(random()<.6)destinations.set([x,y,z],i*3);else{const a=random()*Math.PI*2,t=random()*Math.PI/2;destinations.set([Math.sin(t)*Math.cos(a)*1.69,3.08+Math.cos(t)*1.49,-.15+Math.sin(t)*Math.sin(a)*1.54],i*3);}gatherSeeds.set([id,random(),random(),random()],i*4);}
  gatherGeo.setAttribute('position',new THREE.BufferAttribute(destinations,3));gatherGeo.setAttribute('aP',new THREE.BufferAttribute(gatherSeeds,4));
  const gather=new THREE.Points(gatherGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:u.time,uRatio:u.ratio,uOrigins:{value:origins},uScales:{value:scales},uReveal:{value:opacity},uGlow:{value:gatherLight}},
    vertexShader:`attribute vec4 aP;uniform float uTime,uRatio;uniform vec3 uOrigins[4];uniform float uScales[4],uReveal[4],uGlow[4];varying float vA;void main(){int id=int(aP.x);float r=uReveal[id],g=uGlow[id];vec3 p=position*uScales[id]+uOrigins[id];p+=vec3(sin(uTime*.7+aP.y*12.)*(1.-r),(.5+aP.z*4.)*(1.-r),cos(uTime*.6+aP.w*9.)*(1.-r));vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((1.+aP.w*2.)*uRatio*28./max(1.,-mv.z),1.,5.);vA=g*(.45+.55*sin(aP.z*30.+uTime)*sin(aP.z*30.+uTime));}`,
    fragmentShader:`varying float vA;void main(){vec2 p=(gl_PointCoord-.5)*2.;float r=length(p);if(r>1.)discard;float star=exp(-abs(p.x)*18.)+exp(-abs(p.y)*18.);gl_FragColor=vec4(vec3(2.7,2.15,1.1),(exp(-r*r*6.)+star*.14)*vA);}`}));gather.frustumCulled=false;scene.add(gather);
  return {
    darkness,heavens,sanctum,watchers,palaces,repairPieces,ancients,swarm,ascension,centreManifest,floorManifest,dispose(){ancients.dispose();ascension.goddess.dispose();},
    quality(light,ratio){palaces.forEach(p=>p.island.quality(light,ratio));ascension.quality(light,ratio);swarm.quality(light,ratio);pg.setDrawRange(0,light?650:particles);gatherGeo.setDrawRange(0,light?500:gatherCount);cloudGeo.setDrawRange(0,light?90:cloudCount);u.ratio.value=ratio;},
    update(time,elapsed,mask,siegeElapsed=0,reduced=false,ambient=time){const s=rebirthState(elapsed,mask),threat=siegeState(siegeElapsed);u.time.value=time;u.sun.value=s.sun;u.cleanse.value=s.cleanse;u.wave.value=s.wave;u.radius.value=holyRadius(elapsed,mask);u.threat.value=.2+threat.urgency*.8;u.enemyClock.value=reduced?0:siegeElapsed;
      darkness.visible=s.cleanse<1;heavens.visible=s.palaces>0;sanctum.visible=s.sanctum>0;rays.visible=s.sun>0;motes.visible=s.sun>0;waveShell.visible=s.wave>0&&s.wave<1;
      waveShell.scale.setScalar(Math.max(.001,u.radius.value));rays.quaternion.copy(camera.quaternion);
      // Keep landmarks within the portrait field without changing their real 3D interaction space.
      const spread=cosmicSpread(camera.aspect);
      ancients.update(siegeElapsed,elapsed,mask,reduced,spread);swarm.update(siegeElapsed,elapsed,mask,reduced);
      watchers.forEach((w,i)=>{if(i===2)w.head.localToWorld(u.sources.value[i].set(0,-.1,1.3));else w.orb.getWorldPosition(u.sources.value[i]);});
      const palaceSpread=spread*(camera.aspect<.8?.53:.88),palaceScale=camera.aspect<.8?.5:1;
      palaces.forEach(p=>{const reveal=materializationState(elapsed,p.index,mask);
        p.root.position.set(p.x*palaceSpread,p.y,p.root.position.z);p.root.scale.setScalar(p.scale*palaceScale);p.root.rotation.set(0,0,0);
        p.layers.forEach(layer=>{layer.position.set(0,0,0);layer.rotation.set(0,0,0);layer.scale.setScalar(1);});
        const enemy=watchers[[0,2,1][p.index]],centre=enemy.group.position,clearAt=1.4+(Math.hypot(centre.x-HOLY_ORIGIN[0],centre.y+1-HOLY_ORIGIN[1],centre.z-HOLY_ORIGIN[2])+6.5)/5;
        reveal.opacity*=smootherStep((elapsed-clearAt)/1.5);
        p.manifest.update(reveal.opacity,time);p.island.update(reveal.opacity,ambient,p.root.scale.x,reduced);p.halo.visible=reveal.opacity>0;p.constructionRing.visible=false;
        origins[p.index].copy(p.root.position);scales[p.index]=p.root.scale.x;opacity[p.index]=reveal.opacity;gatherLight[p.index]=reveal.particles;
      });
      for(let i=0;i<cloudCount;i++){const p=palaces[i%3];cloudPos[i*3]=p.x*palaceSpread+(cloudOriginal[i*3]-p.x)*palaceScale;}
      cloudGeo.attributes.position.needsUpdate=true;cloudMat.uniforms.uOpacity.value=s.palaces;ascension.update(elapsed,mask,ambient,camera.aspect,reduced);cloudMat.uniforms.uWarm.value=ascension.cloudProgress;
      sanctum.position.set(0,0,0);sanctum.scale.setScalar(1);pylons.scale.setScalar(1);crest.rotation.z=0;
      centreManifest.update(materializationState(elapsed,0,mask).opacity,time);
      repairPieces.forEach((tile,i)=>{tile.visible=mask===7&&s.sanctum>0;tile.position.set(0,-.4425,-.1);tile.rotation.set(0,i/12*Math.PI*2,0);});
      floorManifest.update(materializationState(elapsed,0,mask).opacity,time);
      const central=materializationState(elapsed,0,mask);origins[3].set(0,0,0);scales[3]=1;opacity[3]=central.opacity;gatherLight[3]=central.particles;gather.visible=mask===7&&elapsed>.7&&elapsed<9.6;
      return s;
    },
  };
}
