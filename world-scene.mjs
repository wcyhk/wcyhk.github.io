import {BEACONS,islandHeight,seededRandom,cosmicSpread,processionalStep,realmState} from './world-model.mjs?v=golden-realm-20261110';
import {createSurfaceKit} from './world-materials.mjs?v=worlds-end-polish-20261110';
import {createIslandDestruction} from './world-destruction.mjs?v=golden-realm-20261110';
import {createRebirthWorld} from './world-rebirth.mjs?v=golden-realm-20261110';

const noiseGLSL=`
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){return noise(p)*.57+noise(p*2.07+3.4)*.28+noise(p*4.13-5.2)*.15;}`;
const uvVertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;

export function createWorldScene(THREE,camera){
  const rnd=seededRandom(10312026),scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x10182d,.018);
  const uniforms={time:{value:0},energy:{value:0},pulse:{value:0},dawn:{value:0},realm:{value:0},camera:{value:camera.position}};
  const surfaces=createSurfaceKit(THREE),surface={map:surfaces.map,normalMap:surfaces.normalMap,normalScale:new THREE.Vector2(.4,.4),roughnessMap:surfaces.roughnessMap};
  const stone=new THREE.MeshStandardMaterial({...surface,color:0x8895a0,roughness:.86,metalness:.08,envMapIntensity:.6});
  const dark=new THREE.MeshPhysicalMaterial({...surface,color:0x344b62,metalness:.6,roughness:.26,clearcoat:.4,clearcoatRoughness:.22,envMapIntensity:.9});
  const gold=new THREE.MeshStandardMaterial({normalMap:surfaces.normalMap,normalScale:new THREE.Vector2(.16,.16),roughnessMap:surfaces.roughnessMap,color:0xb99a65,roughness:.28,metalness:.9,envMapIntensity:1.4});
  const ivory=new THREE.MeshStandardMaterial({...surface,map:surfaces.inlayMap,color:0xbac1bf,roughness:.62,metalness:.15});
  const luminous=new THREE.MeshBasicMaterial({color:new THREE.Color(3.4,2.1,.8),toneMapped:false});
  scene.add(new THREE.HemisphereLight(0xb5cee7,0x151c2d,2.1));
  const key=new THREE.DirectionalLight(0xffdcad,4.0);key.position.set(-5,9,8);scene.add(key);
  key.castShadow=true;key.shadow.mapSize.set(2048,2048);Object.assign(key.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:.5,far:35});key.shadow.camera.updateProjectionMatrix();key.shadow.bias=-.00035;key.shadow.normalBias=.035;
  const rim=new THREE.DirectionalLight(0x88cae9,3.2);rim.position.set(5,5,-8);scene.add(rim);
  const coreLight=new THREE.PointLight(0xffba76,25,18,2);coreLight.position.set(0,3,-1.5);scene.add(coreLight);

  const sky=new THREE.Mesh(new THREE.SphereGeometry(75,32,20),new THREE.ShaderMaterial({
    side:THREE.BackSide,depthWrite:false,uniforms:{uTime:uniforms.time,uEnergy:uniforms.energy,uDawn:uniforms.dawn,uRealm:uniforms.realm},
    vertexShader:`varying vec3 vDir;void main(){vDir=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec3 vDir;uniform float uTime,uEnergy,uDawn,uRealm;${noiseGLSL}
    void main(){vec3 d=normalize(vDir);float h=d.y;vec2 p=vec2(atan(d.z,d.x),h);float cloud=fbm(p*vec2(2.6,5.)+vec2(uTime*.009,0.));vec3 col=mix(vec3(.018,.029,.067),vec3(.095,.135,.22),exp(-abs(h-.08)*6.));float dawn=exp(-pow((h-.075)*6.,2.));col+=vec3(.16,.075,.055)*dawn*(.4+.6*cloud);float aurora=pow(max(0.,1.-abs(h-(.30+sin(p.x*3.+cloud*1.8+uTime*.012)*.11))/.14),3.);col+=mix(vec3(.025,.12,.15),vec3(.15,.07,.19),cloud)*aurora*(.5+uEnergy*.9);col+=vec3(.18,.065,.012)*uDawn*exp(-abs(h-.12)*4.);col+=cloud*.016;col=mix(col,mix(vec3(.19,.075,.035),vec3(.78,.32,.095),cloud),uRealm*(1.-smoothstep(-.2,.32,h))*.72);col*=.48;gl_FragColor=vec4(col,1.);}`,
  }));sky.renderOrder=-20;scene.add(sky);

  // A fractured moon hangs beyond the last inhabited edge.
  const moon=new THREE.Mesh(new THREE.SphereGeometry(5.7,72,48),new THREE.ShaderMaterial({
    uniforms:{uTime:uniforms.time,uEnergy:uniforms.energy},
    vertexShader:`varying vec2 vUv;varying vec3 vN;void main(){vUv=uv;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader:`varying vec2 vUv;varying vec3 vN;uniform float uTime,uEnergy;${noiseGLSL}
    void main(){float n=fbm(vUv*vec2(27.,15.));float fine=noise(vUv*180.);float light=dot(normalize(vN),normalize(vec3(-.86,.24,.28)));float terminator=smoothstep(-.2,.62,light);vec3 shade=mix(vec3(.019,.041,.074),vec3(.28,.39,.49),terminator);shade*=.28+n*.8;float vein=pow(max(0.,1.-abs(n-.48)*38.),5.);shade+=vec3(.55,.23,.075)*vein*(.12+uEnergy*.85)*terminator;shade+=fine*.012;gl_FragColor=vec4(shade,1.);}`,
  }));moon.position.set(11.5,10.5,-29);moon.rotation.z=-.3;scene.add(moon);
  const atmosphere=new THREE.Mesh(new THREE.SphereGeometry(5.88,48,32),new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.BackSide,blending:THREE.AdditiveBlending,
    uniforms:{uCamera:uniforms.camera,uEnergy:uniforms.energy},
    vertexShader:`varying vec3 vW,vN;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`varying vec3 vW,vN;uniform vec3 uCamera;uniform float uEnergy;void main(){float f=pow(1.-abs(dot(normalize(vN),normalize(uCamera-vW))),3.5);gl_FragColor=vec4(mix(vec3(.2,.52,.72),vec3(.7,.42,.18),uEnergy),f*.7);}`,
  }));atmosphere.position.copy(moon.position);scene.add(atmosphere);
  const moonArc=new THREE.Mesh(new THREE.TorusGeometry(7.0,.015,6,160,Math.PI*1.25),new THREE.MeshBasicMaterial({color:0xb8cbd7,transparent:true,opacity:.32}));moonArc.position.copy(moon.position);moonArc.rotation.set(.8,.5,.2);scene.add(moonArc);

  const radialTexture=(()=>{const size=64,data=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const r=Math.hypot((x+.5)/size-.5,(y+.5)/size-.5)*2,idx=(y*size+x)*4;data[idx]=data[idx+1]=data[idx+2]=255;data[idx+3]=Math.round(Math.max(0,Math.exp(-r*r*7.)-Math.exp(-7))*255);}const t=new THREE.DataTexture(data,size,size);t.needsUpdate=true;return t;})();
  const glow=(color,size,opacity)=>{const s=new THREE.Sprite(new THREE.SpriteMaterial({map:radialTexture,color,blending:THREE.AdditiveBlending,transparent:true,depthWrite:false,opacity,toneMapped:false}));s.scale.set(size,size,1);return s;};

  const topMaterial=new THREE.MeshStandardMaterial({...surface,vertexColors:true,roughness:.88,metalness:.06,normalScale:new THREE.Vector2(.52,.52),envMapIntensity:.55});
  function island(radius,depth,seed){
    const random=seededRandom(seed),group=new THREE.Group(),positions=[],colors=[],indices=[],uvs=[];
    const segments=96,rings=12,edge=Array.from({length:segments},(_,j)=>.94+.07*Math.sin(j*.31+seed)+.04*Math.sin(j*.87)+random()*.035);
    positions.push(0,islandHeight(0,0),0);colors.push(.38,.43,.46);uvs.push(.5,.5);
    for(let ring=1;ring<=rings;ring++)for(let j=0;j<segments;j++){
      const a=j/segments*Math.PI*2,r=radius*ring/rings*edge[j],x=Math.cos(a)*r,z=Math.sin(a)*r,y=islandHeight(x,z)+(random()-.5)*.035;
      positions.push(x,y,z);uvs.push(x/(radius*2)+.5,z/(radius*2)+.5);const tone=.83+random()*.22;colors.push(.31*tone,.38*tone,.43*tone);
    }
    for(let j=0;j<segments;j++)indices.push(0,1+(j+1)%segments,1+j);
    for(let ring=1;ring<rings;ring++)for(let j=0;j<segments;j++){const a=1+(ring-1)*segments+j,b=1+(ring-1)*segments+(j+1)%segments,c=a+segments,d=b+segments;indices.push(a,b,c,b,d,c);}
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
    group.add(new THREE.Mesh(geometry,topMaterial));
    const cliff=new THREE.ConeGeometry(radius*.94,depth,48,6,true),cliffVertices=cliff.getAttribute('position');for(let i=0;i<cliffVertices.count;i++){const x=cliffVertices.getX(i),y=cliffVertices.getY(i),z=cliffVertices.getZ(i),warp=1+.065*Math.sin(x*4.3+y*2.6+seed)+.045*Math.sin(z*5.1-y*3.2);cliffVertices.setXYZ(i,x*warp,y,z*warp);}cliff.computeVertexNormals();
    const under=new THREE.Mesh(cliff,dark);under.rotation.z=Math.PI;under.position.y=-depth*.52;group.add(under);
    const ledges=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),stone,28),dummy=new THREE.Object3D();
    for(let i=0;i<28;i++){const a=random()*Math.PI*2,r=radius*(.35+random()*.53);dummy.position.set(Math.cos(a)*r,-depth*(.25+random()*.35),Math.sin(a)*r);dummy.scale.set(radius*(.09+random()*.11),depth*(.16+random()*.38),radius*(.09+random()*.11));dummy.rotation.set(random()*3,random()*3,random()*3);dummy.updateMatrix();ledges.setMatrixAt(i,dummy.matrix);}group.add(ledges);
    return group;
  }
  const mainIsland=island(6.8,3.9,400);mainIsland.position.y=-.5;scene.add(mainIsland);
  const sideIslands=[[-10,-.4,-9,2.1], [10.5,.3,-10.5,2.7],[-17,-1.8,-18,2.1],[17,-1.0,-24,3.8],[-5.5,-.7,-19,2.2]].map((v,i)=>{const g=island(v[3],v[3]*.75,700+i);g.position.set(v[0],v[1],v[2]);scene.add(g);return {group:g,x:v[0],y:v[1],z:v[2],radius:v[3],depth:v[3]*.75};});
  const stairs=new THREE.Group(),stairData=[];
  for(let i=0;i<19;i++){const {x,z}=processionalStep(i),y=-.23+Math.sin(i*.17)*.1;const block=new THREE.Mesh(surfaces.bevelGeometry,i%4===0?gold:ivory);block.scale.set(1.05,.15,.37);block.position.set(x,y,z);block.rotation.y=Math.sin(i*.7)*.1;stairs.add(block);stairData.push({block,y,phase:i*.4});const line=new THREE.Mesh(new THREE.BoxGeometry(.78,.012,.012),luminous);line.position.set(x,y+.08,z+.185);stairs.add(line);}scene.add(stairs);
  const ruins=new THREE.InstancedMesh(surfaces.bevelGeometry,stone,34),ruinDummy=new THREE.Object3D();
  let ruinCount=0;for(let i=0;i<34;i++){const a=rnd()*Math.PI*2,r=3.5+rnd()*2.7,x=Math.cos(a)*r,z=Math.sin(a)*r;if(Math.abs(x)<1.3)continue;const h=.25+rnd()*1.15;ruinDummy.position.set(x,-.45+islandHeight(x,z)+h*.5,z);ruinDummy.scale.set(.26+rnd()*.5,h,.3+rnd()*.5);ruinDummy.rotation.set((rnd()-.5)*.3,rnd()*3,(rnd()-.5)*.25);ruinDummy.updateMatrix();ruins.setMatrixAt(ruinCount++,ruinDummy.matrix);}ruins.count=ruinCount;scene.add(ruins);

  // A monumental event horizon becomes a living sun only after all three lights.
  const gate=new THREE.Group();gate.position.set(0,3.9,-3.2);gate.rotation.y=.08;scene.add(gate);
  const gateParts=[];const gateStone=new THREE.MeshStandardMaterial({...surface,color:0xb7bdc3,metalness:.82,roughness:.3,envMapIntensity:1.2});
  for(let i=0;i<9;i++){const start=i*Math.PI*2/9,arc=.52+(i%3)*.04;const g=new THREE.Group();g.rotation.z=start;const rock=new THREE.Mesh(new THREE.TorusGeometry(3.04,.11,8,18,arc),i%3===0?gold:gateStone);g.add(rock);const edge=new THREE.Mesh(new THREE.TorusGeometry(2.98,.013,5,22,arc),luminous);edge.position.z=.09;g.add(edge);g.position.set(Math.cos(start)*.08,Math.sin(start)*.08,(i%2)*.11);gate.add(g);gateParts.push(g);}
  const photonRing=new THREE.Mesh(new THREE.TorusGeometry(2.59,.028,8,160),luminous);gate.add(photonRing);
  const engravings=new THREE.InstancedMesh(surfaces.bevelGeometry,gold,48),engravingDummy=new THREE.Object3D();for(let i=0;i<48;i++){const a=i/48*Math.PI*2;engravingDummy.position.set(Math.cos(a)*3.14,Math.sin(a)*3.14,.08);engravingDummy.scale.set(.028,i%4===0?.12:.055,.025);engravingDummy.rotation.z=a-Math.PI/2;engravingDummy.updateMatrix();engravings.setMatrixAt(i,engravingDummy.matrix);}gate.add(engravings);
  const orbital=new THREE.Mesh(new THREE.TorusGeometry(3.65,.012,6,160),gold);orbital.rotation.set(.7,.35,.28);gate.add(orbital);
  const orbital2=new THREE.Mesh(new THREE.TorusGeometry(3.97,.008,5,160),new THREE.MeshBasicMaterial({color:0x98bed6,transparent:true,opacity:.3}));orbital2.rotation.set(-.45,.5,-.25);gate.add(orbital2);
  const starCore=new THREE.Mesh(new THREE.SphereGeometry(2.55,80,56),new THREE.ShaderMaterial({
    uniforms:{uTime:uniforms.time,uDawn:uniforms.dawn,uCamera:uniforms.camera},
    vertexShader:`varying vec3 vN,vW,vLocal;void main(){vLocal=normal;vN=normalize(mat3(modelMatrix)*normal);vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`varying vec3 vN,vW,vLocal;uniform float uTime,uDawn;uniform vec3 uCamera;${noiseGLSL}
    void main(){vec3 n=normalize(vN);vec2 p=normalize(vLocal).xy*6.5+vec2(uTime*.026,uTime*-.013);float turbulence=fbm(p+fbm(p*.7+uTime*.008)*2.);float granules=noise(normalize(vLocal).xy*150.+uTime*.04);float veins=exp(-abs(fbm(p*1.7+3.4)-.49)*85.);float spots=smoothstep(.67,.81,fbm(p*.62-uTime*.005));float limb=pow(max(.02,dot(n,normalize(uCamera-vW))),.52);vec3 fire=mix(vec3(.65,.055,.004),vec3(3.1,1.3,.21),smoothstep(.18,.84,turbulence));fire+=vec3(1.8,.43,.035)*veins;fire*=.32+.68*limb;fire*=.66+granules*.5;fire*=1.-spots*.73;vec3 voidColor=vec3(.0001,.00025,.0006);gl_FragColor=vec4(mix(voidColor,fire,smoothstep(0.,1.,uDawn)),1.);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
    }`,
  }));gate.add(starCore);
  const disk=new THREE.Mesh(new THREE.RingGeometry(2.61,3.8,180,24),new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,
    uniforms:{uTime:uniforms.time,uEnergy:uniforms.energy,uDawn:uniforms.dawn},vertexShader:uvVertex,
    fragmentShader:`varying vec2 vUv;uniform float uTime,uEnergy,uDawn;${noiseGLSL}void main(){vec2 p=(vUv-.5)*2.;float r=length(p),a=atan(p.y,p.x);float swirl=a+uTime*.09/pow(max(.45,r),1.5);vec2 q=vec2(cos(swirl),sin(swirl))*r;float n=fbm(q*21.+vec2(r*13.,0.));float micro=noise(q*vec2(85.,15.)+r*90.);float streak=(.25+.75*n)*(.55+.45*micro);float inner=exp(-(r-.54)*4.7);float mask=smoothstep(.52,.56,r)*(1.-smoothstep(.72,1.,r));float doppler=.65+.35*cos(a-.9);vec3 col=mix(vec3(.9,.19,.035),vec3(3.,2.,.9),doppler*.7+n*.25);float alpha=mask*(streak*.55+inner*.14)*(.6+uEnergy*.4)*(1.-uDawn*.8);gl_FragColor=vec4(col,alpha);}`,
  }));disk.rotation.set(1.0,.08,.1);gate.add(disk);
  const lens=new THREE.Mesh(new THREE.RingGeometry(2.565,3.38,180,8),new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{uTime:uniforms.time,uDawn:uniforms.dawn},vertexShader:uvVertex,fragmentShader:`varying vec2 vUv;uniform float uTime,uDawn;${noiseGLSL}void main(){vec2 p=(vUv-.5)*2.;float r=length(p),a=atan(p.y,p.x);float streak=fbm(vec2(cos(a),sin(a))*12.+r*21.+uTime*.012);float ring=exp(-abs(r-.766)*95.);float arcs=pow(streak,4.)*exp(-(r-.76)*7.);gl_FragColor=vec4(vec3(2.1,1.3,.5),(ring*.22+arcs*.6)*(1.-uDawn));}`}));gate.add(lens);
  const corona=new THREE.Mesh(new THREE.PlaneGeometry(18,18),new THREE.ShaderMaterial({
    transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{uTime:uniforms.time,uDawn:uniforms.dawn},vertexShader:uvVertex,
    fragmentShader:`varying vec2 vUv;uniform float uTime,uDawn;${noiseGLSL}void main(){vec2 p=(vUv-.5)*2.;float r=length(p),a=atan(p.y,p.x);float n=fbm(p*7.+uTime*.01);float flare=pow(max(0.,sin(a*17.+n*8.+uTime*.07)),5.);float glow=exp(-abs(r-.285)*11.)*(.08+flare*.29);float rim=exp(-abs(r-.29)*80.)*.42;gl_FragColor=vec4(vec3(5.6,2.7,.65),(glow+rim)*uDawn);}`,
  }));corona.position.z=-.12;gate.add(corona);
  const prominences=[];for(let i=0;i<14;i++){const angle=i/14*Math.PI*2+.1,normal=new THREE.Vector3(Math.cos(angle),Math.sin(angle),.05).normalize(),tangent=new THREE.Vector3(-normal.y,normal.x,0),points=[],radius=.18+rnd()*.3,height=.2+rnd()*.45;for(let j=0;j<=24;j++){const a=j/24*Math.PI;points.push(normal.clone().multiplyScalar(2.52+Math.sin(a)*height).addScaledVector(tangent,Math.cos(a)*radius));}const mat=new THREE.MeshBasicMaterial({color:new THREE.Color(3.4,.72,.06),transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false});const loop=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),32,.008,5,false),mat);gate.add(loop);prominences.push({loop,phase:rnd()*6});}
  const gateAura=glow(0xf3bc82,13,.15);gateAura.position.set(0,3.9,-3.6);scene.add(gateAura);

  const beacons=[],pickTargets=[];
  BEACONS.forEach((def,i)=>{
    const group=new THREE.Group();group.position.set(def.position[0],-.48+islandHeight(def.position[0],def.position[2]),def.position[2]);scene.add(group);
    const plinth=new THREE.Mesh(new THREE.CylinderGeometry(.47,.6,.22,16),gold);plinth.position.y=.1;group.add(plinth);
    const foundation=new THREE.Mesh(new THREE.CylinderGeometry(.64,.69,.11,24),stone);foundation.position.y=-.025;group.add(foundation);
    const pillar=new THREE.Mesh(surfaces.bevelGeometry,dark);pillar.scale.set(.23,1.1,.23);pillar.position.y=.7;pillar.rotation.y=Math.PI/4;group.add(pillar);
    for(let k=0;k<4;k++){const rib=new THREE.Mesh(new THREE.BoxGeometry(.014,.84,.014),gold),a=k*Math.PI/2;rib.position.set(Math.cos(a)*.16,.72,Math.sin(a)*.16);group.add(rib);}
    const gemMat=new THREE.MeshPhysicalMaterial({color:def.color,emissive:def.color,emissiveIntensity:.35,metalness:.25,roughness:.08,clearcoat:1,clearcoatRoughness:.06});const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.18),gemMat);gem.position.y=1.45;group.add(gem);
    const hoop=new THREE.Mesh(new THREE.TorusGeometry(.37,.016,6,40),gold);hoop.position.y=1.45;hoop.rotation.x=.35;group.add(hoop);
    const aura=glow(def.color,1.4,.45);aura.position.y=1.45;group.add(aura);
    // MSAA evaluates edge samples outside the plane: UVs can exceed [0,1].
    // A negative fractional-power base produces NaN, which HDR bloom spreads into black tiles.
    const beamMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,uniforms:{uLit:{value:0},uColor:{value:new THREE.Color(def.color)}},vertexShader:uvVertex,fragmentShader:`varying vec2 vUv;uniform float uLit;uniform vec3 uColor;void main(){float shaft=exp(-abs(vUv.x-.5)*28.);float fade=pow(clamp(1.-vUv.y,0.,1.),1.7)*smoothstep(0.,.08,vUv.y);gl_FragColor=vec4(uColor*(1.3+uLit),shaft*fade*uLit*.5);}`});
    const beam=new THREE.Mesh(new THREE.PlaneGeometry(1.2,10),beamMat);beam.position.y=6.4;group.add(beam);const beam2=beam.clone();beam2.rotation.y=Math.PI/2;group.add(beam2);
    const hit=new THREE.Mesh(new THREE.SphereGeometry(.55,12,8),new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false,colorWrite:false}));hit.position.y=1.45;hit.userData.beaconId=def.id;group.add(hit);pickTargets.push(hit);
    const point=new THREE.PointLight(def.color,1,5,2);point.position.y=1.5;group.add(point);
    beacons.push({group,gem,gemMat,hoop,aura,beamMat,point,lit:0});
  });
  const bridgeMat=new THREE.LineBasicMaterial({color:0xe7d3ae,transparent:true,opacity:0});
  const bridgePoints=[];BEACONS.forEach((b)=>{bridgePoints.push(new THREE.Vector3(b.position[0],1.1+islandHeight(b.position[0],b.position[2]),b.position[2]),new THREE.Vector3(0,3.9,-3.1));});
  const bridges=new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(bridgePoints),bridgeMat);scene.add(bridges);

  const count=6500,params=new Float32Array(count*4),positions=new Float32Array(count*3);
  for(let i=0;i<count;i++){params.set([rnd()*Math.PI*2,1.7+Math.pow(rnd(),.7)*17,rnd(),.4+rnd()*1.8],i*4);}
  const dustGeo=new THREE.BufferGeometry();dustGeo.setAttribute('position',new THREE.BufferAttribute(positions,3));dustGeo.setAttribute('aP',new THREE.BufferAttribute(params,4));
  const dustMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:uniforms.time,uEnergy:uniforms.energy,uPulse:uniforms.pulse,uRatio:{value:1}},
    vertexShader:`attribute vec4 aP;uniform float uTime,uEnergy,uPulse,uRatio;varying vec3 vC;varying float vA;void main(){float a=aP.x+uTime*.025/aP.y;float r=aP.y+uPulse*sin(aP.x*7.)*.4;vec3 p=vec3(cos(a)*r,(aP.z-.45)*10.+sin(a*2.+uTime*.04)*.6,sin(a)*r-3.);p.y+=uEnergy*pow(max(0.,1.-aP.y/8.),2.)*3.;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aP.w*uRatio*22./max(.5,-mv.z),.6,5.);vC=mix(vec3(.35,.7,.9),vec3(1.8,1.1,.45),aP.z);float tw=sin(aP.x*13.+uTime*.11);vA=.25+.75*tw*tw;vec3 hole=(viewMatrix*vec4(0.,3.9,-3.2,1.)).xyz;float silhouette=(1.-smoothstep(2.48,2.62,length(cross(hole,normalize(mv.xyz)))))*step(0.,dot(hole,mv.xyz));vA*=1.-silhouette;}`,
    fragmentShader:`varying vec3 vC;varying float vA;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(vC,pow(max(0.,1.-r),2.)*vA*.8);}`,
  });const dust=new THREE.Points(dustGeo,dustMat);dust.frustumCulled=false;scene.add(dust);
  const starsPositions=new Float32Array(1700*3);for(let i=0;i<1700;i++){const a=rnd()*Math.PI*2,h=rnd()*.96;const r=50+ rnd()*10;starsPositions.set([Math.cos(a)*r*Math.sqrt(1-h*h),h*r,Math.sin(a)*r],i*3);}
  const starsGeo=new THREE.BufferGeometry();starsGeo.setAttribute('position',new THREE.BufferAttribute(starsPositions,3));scene.add(new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xb8d4e6,size:.045,sizeAttenuation:true,transparent:true,opacity:.8})));

  const sea=new THREE.Mesh(new THREE.PlaneGeometry(130,130),new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:uniforms.time,uRealm:uniforms.realm},vertexShader:`varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader:`varying vec3 vW;uniform float uTime,uRealm;${noiseGLSL}void main(){vec2 p=vW.xz*.105+vec2(uTime*.008,0.);float body=fbm(p*1.7),billow=fbm(p*3.2+body*2.),detail=fbm(p*7.+billow);float density=clamp(body*.52+billow*.36+detail*.12,0.,1.);float ridge=pow(clamp(1.-abs(density-.56)*3.,0.,1.),3.);vec3 cold=vec3(.022,.052,.075)+vec3(.08,.1,.11)*density;vec3 warm=mix(vec3(.22,.065,.018),vec3(1.12,.54,.14),smoothstep(.2,.78,density));warm+=vec3(.55,.34,.12)*ridge;float fade=1.-smoothstep(22.,65.,length(vW.xz));gl_FragColor=vec4(mix(cold,warm,uRealm),fade*(.72+density*.22));}` }));sea.rotation.x=-Math.PI/2;sea.position.y=-4.8;sea.renderOrder=-3;scene.add(sea);
  const cloudBankGeo=new THREE.BufferGeometry(),bankCount=110,bankPos=new Float32Array(bankCount*3),bankSeeds=new Float32Array(bankCount*3);for(let i=0;i<bankCount;i++){const a=rnd()*Math.PI*2,r=5+rnd()*40;bankPos.set([Math.cos(a)*r,-4.5-rnd()*3,Math.sin(a)*r-6],i*3);bankSeeds.set([rnd(),rnd(),rnd()],i*3);}cloudBankGeo.setAttribute('position',new THREE.BufferAttribute(bankPos,3));cloudBankGeo.setAttribute('aSeed',new THREE.BufferAttribute(bankSeeds,3));
  const cloudBank=new THREE.Points(cloudBankGeo,new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uTime:uniforms.time,uRealm:uniforms.realm,uRatio:{value:1}},vertexShader:`attribute vec3 aSeed;uniform float uTime,uRatio;varying float vSeed;void main(){vec3 p=position;p.x+=sin(uTime*.015+aSeed.x*6.)*.3;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((100.+aSeed.y*180.)*uRatio*10./max(1.,-mv.z),1.,220.);vSeed=aSeed.z;}`,fragmentShader:`varying float vSeed;uniform float uRealm;void main(){vec2 p=(gl_PointCoord-.5)*vec2(2.,2.8);float r=length(p),a=exp(-r*r*3.)*(1.-smoothstep(.6,1.,r));vec3 cold=vec3(.1,.16,.23),warm=mix(vec3(.7,.25,.055),vec3(1.55,1.05,.48),vSeed);gl_FragColor=vec4(mix(cold,warm,uRealm),a*(.08+uRealm*.25));}`}));cloudBank.frustumCulled=false;cloudBank.renderOrder=-2;scene.add(cloudBank);

  const floats=new THREE.Group(),floatData=[];
  for(let i=0;i<30;i++){const a=rnd()*Math.PI*2,r=7+rnd()*12;const mesh=new THREE.Mesh(new THREE.IcosahedronGeometry(.05+rnd()*.14,0),i%5===0?gold:dark);mesh.position.set(Math.cos(a)*r,-1+rnd()*8,Math.min(1.5,Math.sin(a)*r-10));mesh.scale.y=1+rnd()*2;mesh.rotation.set(rnd()*3,rnd()*3,rnd()*3);floats.add(mesh);floatData.push({mesh,y:mesh.position.y,phase:rnd()*6});}scene.add(floats);
  scene.traverse(o=>{if(o.isMesh&&o.material?.isMeshStandardMaterial){o.castShadow=true;o.receiveShadow=true;}});
  const reborn=createRebirthWorld(THREE,scene,camera,surfaces);
  const destruction=createIslandDestruction(THREE,scene,sideIslands,stone);
  const labelPosition=new THREE.Vector3();let lastShadowPhase='';
  return {
    scene,beacons,pickTargets,reborn,destruction,gate,starCore,disk,mainIsland,stairs,sea,cloudBank,
    environment(renderer){scene.environment=surfaces.environment(renderer);},
    markerPositions(){return beacons.map(b=>b.group.localToWorld(labelPosition.set(0,1.6,0)).clone());},
    quality(light,ratio){cloudBankGeo.setDrawRange(0,light?60:bankCount);cloudBank.material.uniforms.uRatio.value=ratio;destruction.quality(light);reborn.quality(light,ratio);dustGeo.setDrawRange(0,light?2200:count);dustMat.uniforms.uRatio.value=ratio;const size=light?1024:2048;if(key.shadow.mapSize.x!==size){key.shadow.map?.dispose();key.shadow.map=null;key.shadow.mapSize.set(size,size);}key.shadow.autoUpdate=!light;key.shadow.needsUpdate=true;},
    update(time,energy,pulse,dt,mask,rebirthElapsed=mask===7?12:0,siegeElapsed=0,reduced=false,spinElapsed=time){
      const story=reborn.update(time,rebirthElapsed,mask,siegeElapsed,reduced,spinElapsed);const renewal=realmState(rebirthElapsed,mask);uniforms.realm.value=renewal.clouds;
      uniforms.time.value=time;uniforms.energy.value=energy;uniforms.pulse.value=pulse;const dawn=story.sun;uniforms.dawn.value=dawn;
      const spread=cosmicSpread(camera.aspect);
      destruction.update(siegeElapsed,rebirthElapsed,mask,reborn.ancients.collisionSpheres(),spread,camera.aspect<.8);
      const shadowPhase=`${destruction.records.filter(r=>r.shattered).length}:${mask!==7?0:rebirthElapsed<.65?1:rebirthElapsed<7.8?2:3}`;if(shadowPhase!==lastShadowPhase){key.shadow.needsUpdate=true;lastShadowPhase=shadowPhase;}
      if(renewal.repair>=1)for(const island of destruction.records)island.group.visible=false;mainIsland.visible=renewal.repair<1;
      ruins.position.y=0;ruins.visible=story.sun<1;stairs.visible=story.sun<1;
      mainIsland.children[0].visible=story.sun<1;
      topMaterial.color.setRGB(1+story.sanctum*.5,1+story.sanctum*.4,1+story.sanctum*.23);
      scene.fog.color.setRGB(.063+renewal.clouds*.13,.094+renewal.clouds*.025,.176-renewal.clouds*.075);
      gate.rotation.z=spinElapsed*.035;starCore.rotation.y=spinElapsed*.16;starCore.rotation.z=.12;gateAura.material.opacity=.12+energy*.12+dawn*.3;disk.rotation.z=.1+spinElapsed*.14;orbital.rotation.z=.28+spinElapsed*.055;orbital2.rotation.y=.5-spinElapsed*.04;coreLight.intensity=3+energy*10+dawn*65;key.intensity=2.5+dawn*3.3;key.color.set(dawn>.01?0xffd09a:0xc8d6e5);
      for(const p of prominences)p.loop.material.opacity=dawn*(.35+Math.sin(time*.17+p.phase)*.12);
      for(let i=0;i<gateParts.length;i++){const amount=Math.sin(time*.12+i)*.035+(1-energy)*.075;gateParts[i].position.x=Math.cos(i*Math.PI*2/9)*amount;gateParts[i].position.y=Math.sin(i*Math.PI*2/9)*amount;}
      for(let i=0;i<beacons.length;i++){const b=beacons[i];const ground=-.48+islandHeight(BEACONS[i].position[0],BEACONS[i].position[2]);b.group.position.y=ground+(-.33-ground)*story.sun;b.lit+=(Number(!!(mask&(1<<i)))-b.lit)*(1-Math.exp(-dt*3.4));b.gem.rotation.y=time*.32+i;b.hoop.rotation.y=time*.16+i;b.beamMat.uniforms.uLit.value=b.lit;b.point.intensity=1.1+b.lit*8;b.aura.material.opacity=.32+b.lit*.45;b.aura.scale.setScalar(1.15+b.lit*.7);b.gemMat.color.set(BEACONS[i].color);b.gemMat.emissiveIntensity=.35+b.lit*1.4;}
      bridgeMat.opacity=energy*.38;
      for(const f of floatData){f.mesh.visible=renewal.repair<1;f.mesh.position.y=f.y+Math.sin(time*.14+f.phase)*.2;f.mesh.rotation.y=time*.035+f.phase;}
      for(const f of stairData)f.block.position.y=f.y+Math.sin(time*.2+f.phase)*.018*(1-energy);
      return story;
    },
    dispose(){reborn.dispose();const geometries=new Set(),materials=new Set();scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of o.material?(Array.isArray(o.material)?o.material:[o.material]):[])materials.add(m);});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());radialTexture.dispose();surfaces.dispose();key.shadow.map?.dispose();},
  };
}
