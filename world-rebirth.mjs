import {seededRandom,rebirthState,siegeState,materializationState,cosmicSpread} from './world-model.mjs?v=creature-reveal-20261110';
import {createAncients} from './world-creatures.mjs?v=creature-reveal-20261110';
import {createManifestation} from './world-reveal.mjs?v=creature-reveal-20261110';

const vertex=`varying vec3 vW,vN;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`;

// All additions are local procedural geometry. Shared instancing keeps the temples inexpensive.
export function createRebirthWorld(THREE,scene,camera,surfaces){
  const random=seededRandom(312),darkness=new THREE.Group(),heavens=new THREE.Group(),sanctum=new THREE.Group();
  darkness.name='Ancient watchers';heavens.name='Cloud palaces';sanctum.name='Sacred world centre';scene.add(darkness,heavens,sanctum);
  const u={time:{value:0},cleanse:{value:0},sun:{value:0},wave:{value:0},ratio:{value:1},camera:{value:camera.position},threat:{value:0},enemyClock:{value:0},sources:{value:[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()]}};
  const sphere=new THREE.SphereGeometry(1,24,18),cone=new THREE.ConeGeometry(1,1,16),torus=new THREE.TorusGeometry(1,.028,6,96);
  function mesh(group,geo,material,pos,scale=[1,1,1],rotation=[0,0,0]){const o=new THREE.Mesh(geo,material);o.position.set(...pos);o.scale.set(...scale);o.rotation.set(...rotation);group.add(o);return o;}
  const ancients=createAncients(THREE,darkness,camera),watchers=ancients.actors;

  const marble=new THREE.MeshStandardMaterial({map:surfaces.inlayMap,normalMap:surfaces.normalMap,normalScale:new THREE.Vector2(.13,.13),color:0xe9e6d9,metalness:.22,roughness:.38,envMapIntensity:1.1});
  const gilt=new THREE.MeshStandardMaterial({color:0xe5bc6b,metalness:.84,roughness:.23,envMapIntensity:1.5});
  const blue=new THREE.MeshStandardMaterial({color:0x275675,metalness:.48,roughness:.27});
  const lightMat=new THREE.MeshBasicMaterial({color:new THREE.Color(2.1,1.5,.65),toneMapped:false});
  const cylinder=new THREE.CylinderGeometry(1,1,1,16),dome=new THREE.SphereGeometry(1,28,16,0,Math.PI*2,0,Math.PI/2);
  function batchBuilder(group){const pools=new Map(),dummy=new THREE.Object3D();return {add(geo,mat,p,s,r=[0,0,0]){const key=geo.uuid+mat.uuid;if(!pools.has(key))pools.set(key,{geo,mat,entries:[]});pools.get(key).entries.push({p,s,r});},finish(){for(const {geo,mat,entries} of pools.values()){const inst=new THREE.InstancedMesh(geo,mat,entries.length);entries.forEach((e,i)=>{dummy.position.set(...e.p);dummy.scale.set(...e.s);dummy.rotation.set(...e.r);dummy.updateMatrix();inst.setMatrixAt(i,dummy.matrix);});inst.castShadow=false;inst.receiveShadow=true;group.add(inst);}}};}
  function palace(x,y,z,size,index){
    const root=new THREE.Group();heavens.add(root);root.position.set(x,y,z);root.scale.setScalar(size);
    const layers=Array.from({length:3},()=>{const g=new THREE.Group();root.add(g);return g;}),builders=layers.map(g=>batchBuilder(g));
    const b={add(geo,mat,p,s,r){builders[p[1]<.65?0:p[1]>3.06?2:1].add(geo,mat,p,s,r);},finish(){builders.forEach(b=>b.finish());}},box=surfaces.bevelGeometry;
    for(let k=0;k<3;k++)b.add(cylinder,marble,[0,k*.16,0],[3.0-k*.22,.17,2.4-k*.18]);
    b.add(cylinder,gilt,[0,.55,0],[2.65,.08,2.05]);b.add(box,marble,[0,1.65,0],[2.9,2.2,1.65]);b.add(box,blue,[0,1.65,.85],[1.25,1.8,.035]);
    for(let side of [-1,1])for(let j=0;j<5;j++){const x=side*1.9,z=-1.55+j*.77;b.add(cylinder,marble,[x,1.7,z],[.13,2.25,.13]);for(const h of [.68,2.75])b.add(box,gilt,[x,h,z],[.43,.12,.43]);}
    for(let j=0;j<7;j++){const x=-2.0+j*.67;b.add(cylinder,marble,[x,1.7,1.65],[.12,2.25,.12]);b.add(box,gilt,[x,2.75,1.65],[.4,.11,.4]);}
    b.add(box,marble,[0,2.92,0],[4.6,.22,3.85]);b.add(box,gilt,[0,3.07,0],[4.65,.08,3.9]);
    b.add(dome,marble,[0,3.08,-.15],[1.65,1.45,1.5]);
    for(let k=0;k<8;k++){const az=k/8*Math.PI*2,points=[];for(let j=0;j<=18;j++){const t=j/18*Math.PI/2;points.push(new THREE.Vector3(Math.sin(t)*Math.cos(az)*1.67,3.08+Math.cos(t)*1.47,-.15+Math.sin(t)*Math.sin(az)*1.52));}b.add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),24,.018,6,false),gilt,[0,0,0],[1,1,1]);}b.add(cone,gilt,[0,4.88,-.15],[.15,.7,.15]);b.add(sphere,lightMat,[0,5.28,-.15],[.12,.12,.12]);
    for(const s of [-1,1]){b.add(cylinder,marble,[s*3.25,2.0,-.8],[.49,3.3,.49]);b.add(dome,gilt,[s*3.25,3.65,-.8],[.65,.65,.65]);b.add(cone,gilt,[s*3.25,4.45,-.8],[.1,.55,.1]);for(let j=0;j<3;j++)b.add(box,gilt,[s*3.25,1.4+j*.6,-.295],[.15,.23,.025]);}
    // Front approach / miniature stairs and balustrades give the temples a readable scale.
    for(let j=0;j<7;j++)b.add(box,marble,[0,.48-j*.065,2.05+j*.22],[1.4,.13,.3]);
    for(const s of [-1,1])for(let j=0;j<8;j++){b.add(cylinder,marble,[s*(1.3+j*.2),.85,2.12],[.045,.5,.045]);}
    b.finish();const halo=mesh(root,torus,lightMat,[0,2.2,-1.7],[3.75,3.75,3.75]);halo.position.z=-2.15;halo.rotation.x=.12;
    const ringMaterial=new THREE.MeshBasicMaterial({color:new THREE.Color(2.3,1.6,.65),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
    const constructionRing=mesh(root,new THREE.TorusGeometry(3.4,.018,6,120),ringMaterial,[0,.4,0],[1,1,1],[Math.PI/2,0,0]);
    return {root,x,y,scale:size,index,halo,layers,constructionRing};
  }
  const palaces=[palace(-11,1.0,-13,1.15,0),palace(11.5,.7,-13.8,1.1,1),palace(1,3,-29,1.1,2)];
  palaces.forEach(p=>{p.halo.userData.revealIgnore=true;p.constructionRing.userData.revealIgnore=true;p.manifest=createManifestation(THREE,p.root);});

  const cloudGeo=new THREE.BufferGeometry(),cloudCount=144,cloudPos=new Float32Array(cloudCount*3),cloudSeed=new Float32Array(cloudCount*3);
  for(let i=0;i<cloudCount;i++){const p=palaces[i%3],a=random()*Math.PI*2,r=1+random()*4;cloudPos.set([p.x+Math.cos(a)*r*p.scale,p.y-.6+random()*.7,p.root.position.z+Math.sin(a)*r*p.scale],i*3);cloudSeed.set([random(),random(),random()],i*3);}
  cloudGeo.setAttribute('position',new THREE.BufferAttribute(cloudPos,3));cloudGeo.setAttribute('aSeed',new THREE.BufferAttribute(cloudSeed,3));
  const cloudMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:u.time,uOpacity:{value:0},uRatio:u.ratio},
    vertexShader:`attribute vec3 aSeed;uniform float uTime,uRatio;varying float vSeed;void main(){vec3 p=position;p.x+=sin(uTime*.018+aSeed.x*6.)*.35;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=min(240.,(100.+aSeed.y*160.)*uRatio*8./max(1.,-mv.z));vSeed=aSeed.z;}`,
    fragmentShader:`uniform float uOpacity;varying float vSeed;void main(){float r=length((gl_PointCoord-.5)*vec2(1.,1.35))*2.;float a=exp(-r*r*3.5)*(1.-smoothstep(.65,1.,r));gl_FragColor=vec4(mix(vec3(.25,.4,.55),vec3(.93,.79,.59),vSeed),a*.28*uOpacity);}`});
  const cloudOriginal=cloudPos.slice(),clouds=new THREE.Points(cloudGeo,cloudMat);heavens.add(clouds);clouds.frustumCulled=false;

  // The ruined centre is restored with a complete marble dais, processional ring and pylons.
  const pylons=new THREE.Group();sanctum.add(pylons);const foundationBatch=batchBuilder(sanctum),pylonBatch=batchBuilder(pylons),box=surfaces.bevelGeometry;
  const b={add(geo,mat,p,s,r){(p[1]>.2?pylonBatch:foundationBatch).add(geo,mat,p[1]===-.585?p:[p[0],p[1]-.33,p[2]],s,r);},finish(){foundationBatch.finish();pylonBatch.finish();}};
  b.add(cylinder,marble,[0,-.585,-.1],[5.9,.22,5.9]);
  for(let i=0;i<80;i++){const a=i/80*Math.PI*2,r=5.45;b.add(box,i%5===0?lightMat:gilt,[Math.cos(a)*r,-.04,Math.sin(a)*r-.1],[.025,.025,i%5===0?.42:.18],[0,-a,0]);}
  for(let j=0;j<3;j++){const r=4.95+j*.15;b.add(new THREE.TorusGeometry(r,.025,5,128),gilt,[0,-.015,-.1],[1,1,1],[Math.PI/2,0,0]);}
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,x=Math.cos(a)*5.5,z=Math.sin(a)*5.5-.1;if(z>2&&Math.abs(x)<2.5)continue;
    b.add(cylinder,marble,[x,.05,z],[.4,.25,.4]);b.add(cylinder,marble,[x,.85,z],[.17,1.4,.17]);b.add(cylinder,gilt,[x,1.6,z],[.32,.12,.32]);b.add(sphere,lightMat,[x,1.83,z],[.12,.12,.12]);}
  for(const s of [-1,1]){b.add(box,marble,[s*4.7,1.85,-2.6],[.62,4.2,.62]);b.add(box,gilt,[s*4.7,3.95,-2.6],[.91,.16,.91]);b.add(cone,gilt,[s*4.7,4.5,-2.6],[.3,.9,.3]);}
  for(let i=0;i<19;i++){const z=5.2-i*.47,x=Math.sin(i*.24)*.45-.3;b.add(box,i%4===0?gilt:marble,[x,-.06,z],[1.05,.018,.37]);}
  b.finish();
  const floorGroup=new THREE.Group();scene.add(floorGroup);const repairPieces=[],sectorGeometry=new THREE.CylinderGeometry(5.72,5.72,.065,8,1,false,0,Math.PI*2/12-.018);
  for(let i=0;i<12;i++){const tile=mesh(floorGroup,sectorGeometry,blue,[0,-.4425,-.1],[1,1,1],[0,i/12*Math.PI*2,0]);tile.name=`Sanctuary floor sector ${i+1}`;repairPieces.push(tile);}
  const crest=mesh(sanctum,new THREE.RingGeometry(1,1.025,96),lightMat,[0,-.39,-.1],[1,1,1],[Math.PI/2,0,0]);
  const centreManifest=createManifestation(THREE,sanctum),floorManifest=createManifestation(THREE,floorGroup);
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
    vertexShader:`attribute vec4 aP;uniform float uTime,uSun,uWave,uRatio;varying float vA;void main(){float r=3.+uWave*39.*(.4+aP.z*.6);float h=aP.y,s=sqrt(max(0.,1.-h*h));float a=aP.x+uTime*.015;vec3 p=vec3(cos(a)*s*r,h*r,sin(a)*s*r)+vec3(0,3.9,-3.2);p.y+=sin(uTime*.1+aP.w*8.)*.5;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((1.+aP.w*2.)*uRatio*25./max(.5,-mv.z),1.,6.);vA=uSun*(.35+.65*sin(aP.z*40.+uTime*.14)*sin(aP.z*40.+uTime*.14));}`,
    fragmentShader:`varying float vA;void main(){vec2 p=(gl_PointCoord-.5)*2.;float r=length(p);if(r>1.)discard;float star=exp(-abs(p.x)*23.)+exp(-abs(p.y)*23.);gl_FragColor=vec4(vec3(2.6,1.9,.8),vA*(exp(-r*r*7.)+star*.2)*(1.-smoothstep(.7,1.,r)));}`});
  const motes=new THREE.Points(pg,pm);motes.frustumCulled=false;scene.add(motes);
  const gatherCount=1400,gatherGeo=new THREE.BufferGeometry(),destinations=new Float32Array(gatherCount*3),gatherSeeds=new Float32Array(gatherCount*4),origins=Array.from({length:4},()=>new THREE.Vector3()),scales=new Float32Array([1,1,1,1]),opacity=new Float32Array(4),gatherLight=new Float32Array(4);
  for(let i=0;i<gatherCount;i++){const id=i%4,x=-2+Math.round(random()*6)*.67,y=.6+random()*2.2,z=1.8;if(id===3){const a=random()*Math.PI*2,r=2+random()*3.7;destinations.set([Math.cos(a)*r,-.37,Math.sin(a)*r-.1],i*3);}else if(random()<.6)destinations.set([x,y,z],i*3);else{const a=random()*Math.PI*2,t=random()*Math.PI/2;destinations.set([Math.sin(t)*Math.cos(a)*1.69,3.08+Math.cos(t)*1.49,-.15+Math.sin(t)*Math.sin(a)*1.54],i*3);}gatherSeeds.set([id,random(),random(),random()],i*4);}
  gatherGeo.setAttribute('position',new THREE.BufferAttribute(destinations,3));gatherGeo.setAttribute('aP',new THREE.BufferAttribute(gatherSeeds,4));
  const gather=new THREE.Points(gatherGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:u.time,uRatio:u.ratio,uOrigins:{value:origins},uScales:{value:scales},uReveal:{value:opacity},uGlow:{value:gatherLight}},
    vertexShader:`attribute vec4 aP;uniform float uTime,uRatio;uniform vec3 uOrigins[4];uniform float uScales[4],uReveal[4],uGlow[4];varying float vA;void main(){int id=int(aP.x);float r=uReveal[id],g=uGlow[id];vec3 p=position*uScales[id]+uOrigins[id];p+=vec3(sin(uTime*.7+aP.y*12.)*(1.-r),(.5+aP.z*4.)*(1.-r),cos(uTime*.6+aP.w*9.)*(1.-r));vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((1.+aP.w*2.)*uRatio*28./max(1.,-mv.z),1.,5.);vA=g*(.45+.55*sin(aP.z*30.+uTime)*sin(aP.z*30.+uTime));}`,
    fragmentShader:`varying float vA;void main(){vec2 p=(gl_PointCoord-.5)*2.;float r=length(p);if(r>1.)discard;float star=exp(-abs(p.x)*18.)+exp(-abs(p.y)*18.);gl_FragColor=vec4(vec3(2.7,2.15,1.1),(exp(-r*r*6.)+star*.14)*vA);}`}));gather.frustumCulled=false;scene.add(gather);
  // Crimson energy streams reach towards the altar as the three bodies advance.
  const menaceCount=1800,menaceSeeds=new Float32Array(menaceCount*4),menaceGeo=new THREE.BufferGeometry();
  for(let i=0;i<menaceCount;i++)menaceSeeds.set([i%3,random(),random(),random()],i*4);
  menaceGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(menaceCount*3),3));menaceGeo.setAttribute('aP',new THREE.BufferAttribute(menaceSeeds,4));
  const menace=new THREE.Points(menaceGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uThreat:u.threat,uClock:u.enemyClock,uCleanse:u.cleanse,uSources:u.sources,uRatio:u.ratio},
    vertexShader:`attribute vec4 aP;uniform float uThreat,uClock,uCleanse,uRatio;uniform vec3 uSources[3];varying float vA;varying vec3 vColor;void main(){vec3 source=uSources[0];if(aP.x>.5)source=uSources[1];if(aP.x>1.5)source=uSources[2];float f=fract(aP.y+uClock*(.16+uThreat*.11));float swirl=uClock*(1.7+aP.z)+aP.w*6.283;vec3 vortex=vec3(cos(swirl),sin(swirl),sin(swirl*.7))*(.4+aP.z*1.0)*(1.-f);vec3 p=mix(source,vec3(0.,.5,-.2),f)+vortex;p.y+=sin(f*3.14159265)*(1.+aP.z*2.);p.x+=sin(f*15.+aP.w*6.)*.3;p.z+=cos(f*12.+aP.w*6.)*.3;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((1.+aP.z*2.)*uRatio*28./max(1.,-mv.z),1.,5.);vA=uThreat*(1.-uCleanse)*sin(f*3.14159265);vColor=aP.x<.5?vec3(.9,.18,2.):aP.x<1.5?vec3(2.,.08,.22):vec3(.12,.6,2.1);}`,
    fragmentShader:`varying float vA;varying vec3 vColor;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(vColor,exp(-r*r*5.)*vA*.85);}`}));menace.frustumCulled=false;scene.add(menace);
  return {
    darkness,heavens,sanctum,watchers,palaces,repairPieces,ancients,centreManifest,floorManifest,
    quality(light,ratio){pg.setDrawRange(0,light?650:particles);gatherGeo.setDrawRange(0,light?500:gatherCount);cloudGeo.setDrawRange(0,light?90:cloudCount);menaceGeo.setDrawRange(0,light?600:menaceCount);u.ratio.value=ratio;},
    update(time,elapsed,mask,siegeElapsed=0,reduced=false){const s=rebirthState(elapsed,mask),threat=siegeState(siegeElapsed);u.time.value=time;u.sun.value=s.sun;u.cleanse.value=s.cleanse;u.wave.value=s.wave;u.threat.value=.2+threat.urgency*.8;u.enemyClock.value=reduced?0:siegeElapsed;
      darkness.visible=s.cleanse<1;heavens.visible=s.palaces>0;sanctum.visible=s.sanctum>0;rays.visible=s.sun>0;motes.visible=s.sun>0;waveShell.visible=s.wave>0&&s.wave<1;
      waveShell.scale.setScalar(2+s.wave*43);rays.quaternion.copy(camera.quaternion);menace.visible=s.cleanse<1;
      // Keep landmarks within the portrait field without changing their real 3D interaction space.
      const spread=cosmicSpread(camera.aspect);
      ancients.update(siegeElapsed,elapsed,mask,reduced,spread);
      watchers.forEach((w,i)=>w.orb.getWorldPosition(u.sources.value[i]));
      const palaceSpread=spread*(camera.aspect<.8?.67:.88),palaceScale=camera.aspect<.8?.68:1;
      palaces.forEach(p=>{const reveal=materializationState(elapsed,p.index,mask);
        p.root.position.set(p.x*palaceSpread,p.y,p.root.position.z);p.root.scale.setScalar(p.scale*palaceScale);p.root.rotation.set(0,0,0);
        p.layers.forEach(layer=>{layer.position.set(0,0,0);layer.rotation.set(0,0,0);layer.scale.setScalar(1);});
        p.manifest.update(reveal.opacity,time);p.halo.visible=reveal.opacity>0;p.constructionRing.visible=false;
        origins[p.index].copy(p.root.position);scales[p.index]=p.root.scale.x;opacity[p.index]=reveal.opacity;gatherLight[p.index]=reveal.particles;
      });
      for(let i=0;i<cloudCount;i++){const p=palaces[i%3];cloudPos[i*3]=p.x*palaceSpread+(cloudOriginal[i*3]-p.x)*palaceScale;}
      cloudGeo.attributes.position.needsUpdate=true;cloudMat.uniforms.uOpacity.value=s.palaces;
      sanctum.position.set(0,0,0);sanctum.scale.setScalar(1);pylons.scale.setScalar(1);crest.rotation.z=0;
      centreManifest.update(materializationState(elapsed,0,mask).opacity,time);
      repairPieces.forEach((tile,i)=>{tile.visible=mask===7&&s.sanctum>0;tile.position.set(0,-.4425,-.1);tile.rotation.set(0,i/12*Math.PI*2,0);});
      floorManifest.update(materializationState(elapsed,0,mask).opacity,time);
      const central=materializationState(elapsed,0,mask);origins[3].set(0,0,0);scales[3]=1;opacity[3]=central.opacity;gatherLight[3]=central.particles;gather.visible=mask===7&&elapsed>.7&&elapsed<9.6;
      return s;
    },
  };
}
