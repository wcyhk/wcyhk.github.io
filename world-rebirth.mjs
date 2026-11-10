import {seededRandom,rebirthState,siegeState,enemyPose,palaceBuild} from './world-model.mjs?v=altar-siege-20261110';

const vertex=`varying vec3 vW,vN;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`;
const hash=`float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}`;

// All additions are local procedural geometry. Shared instancing keeps the temples inexpensive.
export function createRebirthWorld(THREE,scene,camera,surfaces){
  const random=seededRandom(312),darkness=new THREE.Group(),heavens=new THREE.Group(),sanctum=new THREE.Group();
  darkness.name='Ancient watchers';heavens.name='Cloud palaces';sanctum.name='Sacred world centre';scene.add(darkness,heavens,sanctum);
  const u={time:{value:0},cleanse:{value:0},sun:{value:0},wave:{value:0},ratio:{value:1},camera:{value:camera.position},threat:{value:0},enemyClock:{value:0},sources:{value:[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()]}};
  const shadowMaterial=new THREE.ShaderMaterial({transparent:true,side:THREE.DoubleSide,depthWrite:false,uniforms:{uTime:u.time,uCleanse:u.cleanse,uCamera:u.camera},vertexShader:vertex,
    fragmentShader:`varying vec3 vW,vN;uniform float uTime,uCleanse;uniform vec3 uCamera;${hash}
    void main(){float n=noise(vW*1.5+vec3(0,uTime*.025,0));float field=length(vW-vec3(0,3.15,-3.2))*.017+n*.35;float threshold=uCleanse*1.5-.1;if(field<threshold)discard;float rim=pow(clamp(1.-abs(dot(normalize(vN),normalize(uCamera-vW))),0.,1.),2.);float edge=exp(-abs(field-threshold)*65.)*step(.01,uCleanse);vec3 col=vec3(.008,.013,.029)+vec3(.042,.028,.085)*rim+vec3(.018,.01,.03)*n;col+=vec3(2.9,1.5,.42)*edge;gl_FragColor=vec4(col,(.94-.15*rim)*(1.-smoothstep(.8,1.,uCleanse)));}`});
  const eyeMaterial=new THREE.MeshBasicMaterial({color:new THREE.Color(2.6,.14,.34),transparent:true,opacity:.85,toneMapped:false});
  const sphere=new THREE.SphereGeometry(1,20,14),cone=new THREE.ConeGeometry(1,1,12),torus=new THREE.TorusGeometry(1,.028,6,96);
  function mesh(group,geo,material,pos,scale=[1,1,1],rotation=[0,0,0]){const o=new THREE.Mesh(geo,material);o.position.set(...pos);o.scale.set(...scale);o.rotation.set(...rotation);group.add(o);return o;}
  function path(group,points,r0,r1,mat=shadowMaterial){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),g=new THREE.TubeGeometry(curve,40,1,7,false),p=g.attributes.position;
    for(let i=0;i<=40;i++){const c=curve.getPointAt(i/40),r=r0+(r1-r0)*Math.pow(i/40,.8);for(let j=0;j<=7;j++){const k=i*8+j;p.setXYZ(k,c.x+(p.getX(k)-c.x)*r,c.y+(p.getY(k)-c.y)*r,c.z+(p.getZ(k)-c.z)*r);}}
    g.computeVertexNormals();return mesh(group,g,mat,[0,0,0]);
  }
  function joint(parent,pivot,parts){const g=new THREE.Group();g.position.set(...pivot);for(const part of parts){part.position.sub(g.position);g.add(part);}parent.add(g);return g;}
  function membrane(group,side,shapePoints){const shape=new THREE.Shape();shape.moveTo(shapePoints[0][0]*side,shapePoints[0][1]);for(const p of shapePoints.slice(1))shape.lineTo(p[0]*side,p[1]);shape.closePath();return mesh(group,new THREE.ShapeGeometry(shape,8),shadowMaterial,[0,0,-.12]);}
  function eyes(group,x,y,z,spacing=.21){for(const side of [-1,1])mesh(group,sphere,eyeMaterial,[x+side*spacing,y,z],[.11,.045,.045],[0,0,side*.2]);}
  function wing(group,side,large=1){
    const g=new THREE.Group();g.scale.setScalar(large);group.add(g);
    membrane(g,side,[[.3,1.4],[1.4,3.0],[3.7,3.6],[3.0,2.4],[3.5,1.3],[2.45,1.65],[2.5,.5],[1.7,1.0],[1.1,.1],[.6,.7]]);
    for(const end of [[3.7,3.6],[3.5,1.3],[2.5,.5],[1.1,.1]])path(g,[[side*.3,1.4,0],[side*1.4,2.8,.05],[side*end[0],end[1],0]],.11,.008);
    return g;
  }
  const watchers=[];
  // Veiled elder: crown, broad mantle, layered facial tendrils and long reaching arms.
  const elder=new THREE.Group();darkness.add(elder);elder.position.set(-11,1.5,-13);elder.rotation.y=.24;elder.scale.setScalar(1.4);
  mesh(elder,sphere,shadowMaterial,[0,.8,0],[1.13,2.15,.65]);mesh(elder,sphere,shadowMaterial,[0,2.6,.12],[.8,1.04,.59]);
  const mantle=new THREE.Shape();mantle.moveTo(-.65,2);mantle.bezierCurveTo(-2,1.8,-2.6,-.2,-2.5,-1.7);mantle.lineTo(-1.6,-1.3);mantle.lineTo(-1.1,-2.3);mantle.lineTo(0,-1.8);mantle.lineTo(1.1,-2.3);mantle.lineTo(1.6,-1.3);mantle.lineTo(2.5,-1.7);mantle.bezierCurveTo(2.6,-.2,2,1.8,.65,2);mantle.closePath();mesh(elder,new THREE.ShapeGeometry(mantle,18),shadowMaterial,[0,0,-.3]);
  const tendrils=[],elderArms=[];
  for(let i=0;i<7;i++){const x=(i-3)*.22;tendrils.push(joint(elder,[x,2.5,.6],[path(elder,[[x,2.5,.6],[x*1.6,1.7,.88],[x*2.0,.9,.65],[x*2.5+.2, .1+Math.abs(x),.95]],.15,.006)]));}
  for(const s of [-1,1]){path(elder,[[s*.6,3,0],[s*1.05,3.7,.1],[s*.75,4.45,.15]],.22,.005);const parts=[path(elder,[[s*.9,1.7,0],[s*1.9,.4,.1],[s*2.0,-.45,.5]],.28,.12)];for(let j=0;j<3;j++)parts.push(path(elder,[[s*2,-.4,.5],[s*(2.1+j*.13),-.9,.65],[s*(1.95+j*.17),-1.25,.8]],.06,.003));elderArms.push(joint(elder,[s*.9,1.7,0],parts));}
  eyes(elder,0,2.84,.65,.31);watchers.push({group:elder,x:-11,y:1.5,phase:0});
  // Crowned demon in the distant zenith. Wings read as a single immense silhouette.
  const demon=new THREE.Group();darkness.add(demon);demon.position.set(1,3,-29);demon.scale.setScalar(1.2);
  mesh(demon,sphere,shadowMaterial,[0,.1,0],[.7,1.6,.47]);mesh(demon,sphere,shadowMaterial,[0,1.9,.03],[.45,.65,.4]);
  const demonArms=[],demonLegs=[];
  for(const s of [-1,1]){path(demon,[[s*.25,2.2,0],[s*.65,2.8,0],[s*.42,3.55,.15]],.16,.003);demonArms.push(joint(demon,[s*.6,.8,0],[path(demon,[[s*.6,.8,0],[s*1.05,-.2,.15],[s*.65,-.8,.5]],.18,.04)]));demonLegs.push(joint(demon,[s*.36,-1.1,0],[path(demon,[[s*.36,-1.1,0],[s*.6,-2.1,0],[s*.9,-2.65,.35]],.22,.04)]));}
  const demonWings=[wing(demon,-1,1.25),wing(demon,1,1.25)];eyes(demon,0,2,.39,.18);watchers.push({group:demon,x:1,y:3,phase:2});
  // Serpentine dragon: long neck, horned skull, hooked tail, talons and ribbed bat wings.
  const dragon=new THREE.Group();darkness.add(dragon);dragon.position.set(11.5,1.2,-13.8);dragon.rotation.y=-.3;dragon.scale.setScalar(1.35);
  mesh(dragon,sphere,shadowMaterial,[0,0,0],[1.0,1.15,.65]);path(dragon,[[0,.2,0],[-.25,1.6,.05],[-.9,2.7,.18],[-1.4,2.55,.6]],.54,.24);
  mesh(dragon,sphere,shadowMaterial,[-1.4,2.5,.7],[.52,.29,.42],[0,0,.3]);mesh(dragon,cone,shadowMaterial,[-1.55,2.4,.98],[.3,.7,.3],[Math.PI/2,0,0]);
  const dragonTail=joint(dragon,[.4,-.6,0],[path(dragon,[[.4,-.6,0],[1.6,-1.5,-.1],[2.8,-1,.2],[3.1,.1,.4],[2.4,.6,.6]],.42,.004)]);
  const dragonClaws=[],dragonJaw=joint(dragon,[-1.1,2.25,.5],[mesh(dragon,sphere,shadowMaterial,[-1.5,2.22,.8],[.4,.08,.36])]);
  for(const s of [-1,1]){path(dragon,[[-1.2+s*.23,2.65,.5],[-1.0+s*.38,3.1,.25],[-.8+s*.45,3.5,.15]],.13,.003);dragonClaws.push(joint(dragon,[s*.6,-.4,.1],[path(dragon,[[s*.6,-.4,.1],[s*1.1,-1.15,.3],[s*1.4,-1.7,.8]],.24,.08)]));}
  for(let i=0;i<7;i++)mesh(dragon,cone,shadowMaterial,[.2,1.1-i*.34,-.45],[.13,.4,.14],[0,0,-.4]);
  const dragonWings=[wing(dragon,-1,1.25),wing(dragon,1,1.35)];mesh(dragon,sphere,eyeMaterial,[-1.59,2.58,.98],[.1,.045,.045]);watchers.push({group:dragon,x:11.5,y:1.2,phase:4});

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
    b.add(dome,marble,[0,3.08,-.15],[1.65,1.45,1.5]);b.add(dome,gilt,[0,3.12,-.15],[1.4,1.5,1.25]);b.add(cone,gilt,[0,4.88,-.15],[.15,.7,.15]);b.add(sphere,lightMat,[0,5.28,-.15],[.12,.12,.12]);
    for(const s of [-1,1]){b.add(cylinder,marble,[s*3.25,2.0,-.8],[.49,3.3,.49]);b.add(dome,gilt,[s*3.25,3.65,-.8],[.65,.65,.65]);b.add(cone,gilt,[s*3.25,4.45,-.8],[.1,.55,.1]);for(let j=0;j<3;j++)b.add(box,gilt,[s*3.25,1.4+j*.6,-.295],[.15,.23,.025]);}
    // Front approach / miniature stairs and balustrades give the temples a readable scale.
    for(let j=0;j<7;j++)b.add(box,marble,[0,.48-j*.065,2.05+j*.22],[1.4,.13,.3]);
    for(const s of [-1,1])for(let j=0;j<8;j++){b.add(cylinder,marble,[s*(1.3+j*.2),.85,2.12],[.045,.5,.045]);}
    b.finish();const halo=mesh(root,torus,lightMat,[0,2.2,-1.7],[3.75,3.75,3.75]);halo.rotation.x=.12;
    const ringMaterial=new THREE.MeshBasicMaterial({color:new THREE.Color(2.3,1.6,.65),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});
    const constructionRing=mesh(root,new THREE.TorusGeometry(3.4,.018,6,120),ringMaterial,[0,.4,0],[1,1,1],[Math.PI/2,0,0]);
    return {root,x,y,scale:size,index,halo,layers,constructionRing};
  }
  const palaces=[palace(-11,1.0,-13,1.15,0),palace(11.5,.7,-13.8,1.1,1),palace(1,3,-29,1.1,2)];

  const cloudGeo=new THREE.BufferGeometry(),cloudCount=144,cloudPos=new Float32Array(cloudCount*3),cloudSeed=new Float32Array(cloudCount*3);
  for(let i=0;i<cloudCount;i++){const p=palaces[i%3],a=random()*Math.PI*2,r=1+random()*4;cloudPos.set([p.x+Math.cos(a)*r*p.scale,p.y-.6+random()*.7,p.root.position.z+Math.sin(a)*r*p.scale],i*3);cloudSeed.set([random(),random(),random()],i*3);}
  cloudGeo.setAttribute('position',new THREE.BufferAttribute(cloudPos,3));cloudGeo.setAttribute('aSeed',new THREE.BufferAttribute(cloudSeed,3));
  const cloudMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:u.time,uOpacity:{value:0},uRatio:u.ratio},
    vertexShader:`attribute vec3 aSeed;uniform float uTime,uRatio;varying float vSeed;void main(){vec3 p=position;p.x+=sin(uTime*.018+aSeed.x*6.)*.35;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=min(240.,(100.+aSeed.y*160.)*uRatio*8./max(1.,-mv.z));vSeed=aSeed.z;}`,
    fragmentShader:`uniform float uOpacity;varying float vSeed;void main(){float r=length((gl_PointCoord-.5)*vec2(1.,1.35))*2.;float a=exp(-r*r*3.5)*(1.-smoothstep(.65,1.,r));gl_FragColor=vec4(mix(vec3(.25,.4,.55),vec3(.93,.79,.59),vSeed),a*.28*uOpacity);}`});
  const cloudOriginal=cloudPos.slice(),clouds=new THREE.Points(cloudGeo,cloudMat);heavens.add(clouds);clouds.frustumCulled=false;

  // The ruined centre is restored with a complete marble dais, processional ring and pylons.
  const pylons=new THREE.Group();sanctum.add(pylons);const foundationBatch=batchBuilder(sanctum),pylonBatch=batchBuilder(pylons),box=surfaces.bevelGeometry;
  const b={add(geo,mat,p,s,r){(p[1]>.2?pylonBatch:foundationBatch).add(geo,mat,p,s,r);},finish(){foundationBatch.finish();pylonBatch.finish();}};
  b.add(cylinder,marble,[0,-.24,-.1],[5.9,.22,5.9]);
  for(let i=0;i<80;i++){const a=i/80*Math.PI*2,r=5.45;b.add(box,i%5===0?lightMat:gilt,[Math.cos(a)*r,-.04,Math.sin(a)*r-.1],[.025,.025,i%5===0?.42:.18],[0,-a,0]);}
  for(let j=0;j<3;j++){const r=4.95+j*.15;b.add(new THREE.TorusGeometry(r,.025,5,128),gilt,[0,-.015,-.1],[1,1,1],[Math.PI/2,0,0]);}
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,x=Math.cos(a)*5.5,z=Math.sin(a)*5.5-.1;if(z>2&&Math.abs(x)<2.5)continue;
    b.add(cylinder,marble,[x,.05,z],[.4,.25,.4]);b.add(cylinder,marble,[x,.85,z],[.17,1.4,.17]);b.add(cylinder,gilt,[x,1.6,z],[.32,.12,.32]);b.add(sphere,lightMat,[x,1.83,z],[.12,.12,.12]);}
  for(const s of [-1,1]){b.add(box,marble,[s*4.7,1.85,-2.6],[.62,4.2,.62]);b.add(box,gilt,[s*4.7,3.95,-2.6],[.91,.16,.91]);b.add(cone,gilt,[s*4.7,4.5,-2.6],[.3,.9,.3]);}
  b.finish();
  const repairPieces=[],sectorGeometry=new THREE.CylinderGeometry(5.72,5.72,.065,8,1,false,0,Math.PI*2/12-.018);
  for(let i=0;i<12;i++){const tile=mesh(scene,sectorGeometry,blue,[0,-.1,-.1]);tile.name=`Sanctuary floor sector ${i+1}`;repairPieces.push(tile);}
  const crest=mesh(sanctum,new THREE.RingGeometry(1,1.025,96),lightMat,[0,.01,-.1],[1,1,1],[Math.PI/2,0,0]);
  const rays=new THREE.Mesh(new THREE.PlaneGeometry(62,62),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    uniforms:{uTime:u.time,uSun:u.sun},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vUv;uniform float uTime,uSun;void main(){vec2 p=(vUv-.5)*2.;float r=length(p),a=atan(p.y,p.x);float f=pow(max(0.,sin(a*27.+sin(a*11.)*.8+uTime*.012)),18.);float f2=pow(max(0.,sin(a*53.-uTime*.008)),26.);float mask=smoothstep(.084,.13,r)*(1.-smoothstep(.15,1.,r));float halo=exp(-r*7.);gl_FragColor=vec4(vec3(2.6,1.85,.83),mask*halo*(.19+f*.65+f2*.22)*uSun);}`}));
  rays.position.set(0,3.15,-3.35);scene.add(rays);
  const waveShell=mesh(scene,new THREE.SphereGeometry(1,48,28),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{uWave:u.wave,uCamera:u.camera},vertexShader:vertex,
    fragmentShader:`varying vec3 vW,vN;uniform float uWave;uniform vec3 uCamera;void main(){float rim=pow(clamp(1.-abs(dot(normalize(vN),normalize(uCamera-vW))),0.,1.),4.);float life=sin(clamp(uWave,0.,1.)*3.14159265);gl_FragColor=vec4(vec3(3.5,2.3,.9),rim*life*.32);}`}),[0,3.15,-3.2]);
  const particles=1800,pg=new THREE.BufferGeometry(),seeds=new Float32Array(particles*4);
  for(let i=0;i<particles;i++)seeds.set([random()*Math.PI*2,random()*2-1,random(),random()],i*4);
  pg.setAttribute('position',new THREE.BufferAttribute(new Float32Array(particles*3),3));pg.setAttribute('aP',new THREE.BufferAttribute(seeds,4));
  const pm=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:u.time,uSun:u.sun,uWave:u.wave,uRatio:u.ratio},
    vertexShader:`attribute vec4 aP;uniform float uTime,uSun,uWave,uRatio;varying float vA;void main(){float r=3.+uWave*39.*(.4+aP.z*.6);float h=aP.y,s=sqrt(max(0.,1.-h*h));float a=aP.x+uTime*.015;vec3 p=vec3(cos(a)*s*r,h*r,sin(a)*s*r)+vec3(0,3.15,-3.2);p.y+=sin(uTime*.1+aP.w*8.)*.5;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((1.+aP.w*2.)*uRatio*25./max(.5,-mv.z),1.,6.);vA=uSun*(.35+.65*sin(aP.z*40.+uTime*.14)*sin(aP.z*40.+uTime*.14));}`,
    fragmentShader:`varying float vA;void main(){vec2 p=(gl_PointCoord-.5)*2.;float r=length(p);if(r>1.)discard;float star=exp(-abs(p.x)*23.)+exp(-abs(p.y)*23.);gl_FragColor=vec4(vec3(2.6,1.9,.8),vA*(exp(-r*r*7.)+star*.2)*(1.-smoothstep(.7,1.,r)));}`});
  const motes=new THREE.Points(pg,pm);motes.frustumCulled=false;scene.add(motes);
  // Crimson energy streams reach towards the altar as the three bodies advance.
  const menaceCount=540,menaceSeeds=new Float32Array(menaceCount*4),menaceGeo=new THREE.BufferGeometry();
  for(let i=0;i<menaceCount;i++)menaceSeeds.set([i%3,random(),random(),random()],i*4);
  menaceGeo.setAttribute('position',new THREE.BufferAttribute(new Float32Array(menaceCount*3),3));menaceGeo.setAttribute('aP',new THREE.BufferAttribute(menaceSeeds,4));
  const menace=new THREE.Points(menaceGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uThreat:u.threat,uClock:u.enemyClock,uCleanse:u.cleanse,uSources:u.sources,uRatio:u.ratio},
    vertexShader:`attribute vec4 aP;uniform float uThreat,uClock,uCleanse,uRatio;uniform vec3 uSources[3];varying float vA;void main(){vec3 source=uSources[0];if(aP.x>.5)source=uSources[1];if(aP.x>1.5)source=uSources[2];float f=fract(aP.y+uClock*(.16+uThreat*.11));vec3 p=mix(source,vec3(0.,.5,-.2),f);p.y+=sin(f*3.14159265)*(1.+aP.z*2.);p.x+=sin(f*15.+aP.w*6.)*.3;p.z+=cos(f*12.+aP.w*6.)*.3;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((1.+aP.z*2.)*uRatio*28./max(1.,-mv.z),1.,5.);vA=uThreat*(1.-uCleanse)*sin(f*3.14159265);}`,
    fragmentShader:`varying float vA;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(vec3(1.9,.08,.28),exp(-r*r*5.)*vA*.65);}`}));menace.frustumCulled=false;scene.add(menace);
  return {
    darkness,heavens,sanctum,watchers,palaces,repairPieces,
    quality(light,ratio){pg.setDrawRange(0,light?650:particles);cloudGeo.setDrawRange(0,light?90:cloudCount);menaceGeo.setDrawRange(0,light?210:menaceCount);u.ratio.value=ratio;},
    update(time,elapsed,mask,siegeElapsed=0,reduced=false){const s=rebirthState(elapsed,mask),threat=siegeState(siegeElapsed);u.time.value=time;u.sun.value=s.sun;u.cleanse.value=s.cleanse;u.wave.value=s.wave;u.threat.value=threat.urgency;u.enemyClock.value=reduced?0:siegeElapsed;
      darkness.visible=s.cleanse<1;heavens.visible=s.palaces>0;sanctum.visible=s.sanctum>0;rays.visible=s.sun>0;motes.visible=s.sun>0;waveShell.visible=s.wave>0&&s.wave<1;
      eyeMaterial.opacity=(1-s.cleanse)*(.72+threat.urgency*.28);waveShell.scale.setScalar(2+s.wave*43);rays.quaternion.copy(camera.quaternion);menace.visible=threat.urgency>0&&s.cleanse<1;
      // Keep landmarks within the portrait field without changing their real 3D interaction space.
      const spread=Math.min(1,Math.max(.57,camera.aspect));
      watchers.forEach((w,i)=>{const pose=enemyPose(i,siegeElapsed,elapsed,mask,reduced);w.group.position.set(pose.position[0]*spread,pose.position[1],pose.position[2]);w.group.rotation.set(0,pose.yaw,pose.roll);w.group.scale.setScalar(pose.scale);u.sources.value[i].copy(w.group.position);});
      const clock=reduced?0:siegeElapsed,reach=threat.urgency;
      tendrils.forEach((w,i)=>{w.rotation.z=reduced?0:Math.sin(clock*1.8+i*.8)*(.13+reach*.18);w.rotation.x=reduced?0:Math.cos(clock*1.4+i)*.16;});
      elderArms.forEach((w,i)=>{w.rotation.x=reduced?0:-.15-reach*.75+Math.sin(clock*1.4+i*3)*.18;w.rotation.z=reduced?0:Math.sin(clock*1.1+i*3)*.14;});
      demonArms.forEach((w,i)=>w.rotation.x=reduced?0:-reach*.8+Math.sin(clock*1.5+i*3)*.27);demonLegs.forEach((w,i)=>w.rotation.x=reduced?0:Math.sin(clock*1.8+i*Math.PI)*.35);
      demonWings.forEach((w,i)=>{w.rotation.y=reduced?0:Math.sin(clock*1.65)*.48*(i?1:-1);w.rotation.z=reduced?0:Math.cos(clock*1.65)*.065*(i?1:-1);});
      dragonWings.forEach((w,i)=>w.rotation.y=reduced?0:Math.sin(clock*2.1+.5)*.55*(i?1:-1));dragonTail.rotation.y=reduced?0:Math.sin(clock*1.7)*.4;dragonJaw.rotation.x=reduced?0:Math.max(0,Math.sin(clock*1.1))*(.2+reach*.35);dragonClaws.forEach((w,i)=>w.rotation.x=reduced?0:-reach*.6+Math.sin(clock*2.1+i*3)*.2);
      const palaceSpread=spread*(camera.aspect<.8?.67:.88),palaceScale=camera.aspect<.8?.68:1;
      palaces.forEach(p=>{const build=palaceBuild(elapsed,p.index);p.root.position.set(p.x*palaceSpread,p.y,p.root.position.z);p.root.scale.setScalar(p.scale*palaceScale);p.root.rotation.y=(1-build.finish)*.12;
        const [foundation,hall,crown]=p.layers;foundation.visible=build.foundation>0;foundation.position.y=-(1-build.foundation)*3;foundation.rotation.y=-(1-build.foundation)*Math.PI*.55;
        hall.visible=build.hall>0;hall.scale.y=Math.max(.001,build.hall);hall.rotation.y=-(1-build.hall)*.24;
        crown.visible=build.crown>0;crown.position.y=(1-build.crown)*7;crown.rotation.y=(1-build.crown)*Math.PI*.6;
        p.halo.visible=build.foundation>0;p.halo.scale.setScalar(3.75*(.6+build.foundation*.4));p.halo.rotation.z=time*.008;
        p.constructionRing.visible=build.foundation>0&&build.finish<1;p.constructionRing.position.y=.4+build.hall*5;p.constructionRing.material.opacity=(1-build.finish)*.5;p.constructionRing.rotation.z=elapsed*.45;
      });
      for(let i=0;i<cloudCount;i++){const p=palaces[i%3];cloudPos[i*3]=p.x*palaceSpread+(cloudOriginal[i*3]-p.x)*palaceScale;}
      cloudGeo.attributes.position.needsUpdate=true;cloudMat.uniforms.uOpacity.value=s.palaces;
      sanctum.position.y=-(1-s.sanctum)*1.4;sanctum.scale.setScalar(1);pylons.scale.y=Math.max(.001,s.sanctum);crest.rotation.z=time*.018;
      repairPieces.forEach((tile,i)=>{const assemble=rebirthState(Math.max(0,elapsed-i*.07),mask).sanctum,a=i/12*Math.PI*2,d=1-assemble;tile.visible=mask===7&&elapsed>1.1;tile.position.set(Math.sin(a)*d*(4+i%3),-.1-d*(1.5+(i%4)*.7),-.1+Math.cos(a)*d*(4+i%3));tile.rotation.set(d*.6*Math.sin(a),a+d*Math.PI*1.3,d*.6*Math.cos(a));});
      return s;
    },
  };
}
