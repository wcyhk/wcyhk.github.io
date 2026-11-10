import {enemyPose,siegeState} from './world-model.mjs?v=creature-reveal-20261110';

// Swept anatomy, sculpted skulls and curved wing webs, with articulated joints.
// Skin is opaque and depth-writing; a holy dissolve uses discard rather than see-through bodies.
export function createAncients(THREE,parent,camera){
  const u={cleanse:{value:0},clock:{value:0}},actors=[],parts=[];
  const vertexWorld=`varying vec3 vCreatureWorld;
`;
  function material(color,roughness=.62,metalness=.12,emissive=0){
    const m=new THREE.MeshStandardMaterial({color,roughness,metalness,emissive,emissiveIntensity:1.5,depthWrite:true,transparent:false});
    m.onBeforeCompile=s=>{s.uniforms.uCleanse=u.cleanse;s.uniforms.uCreatureClock=u.clock;
      s.vertexShader=vertexWorld+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
        vCreatureWorld=(modelMatrix*vec4(transformed,1.)).xyz;`);
      s.fragmentShader=`varying vec3 vCreatureWorld;uniform float uCleanse,uCreatureClock;\n`+s.fragmentShader;
      s.fragmentShader=s.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
        float grain=fract(sin(dot(floor(vCreatureWorld*9.),vec3(12.9898,78.233,37.719)))*43758.5453);
        float dissolve=length(vCreatureWorld-vec3(0,3.9,-3.2))*.016+grain*.25;
        if(dissolve<uCleanse*1.5-.1)discard;`);
      s.fragmentShader=s.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
        float grainShade=fract(sin(dot(floor(vCreatureWorld*70.),vec3(13.17,39.21,18.41)))*9183.17);
        diffuseColor.rgb*=.94+grainShade*.06;
        totalEmissiveRadiance+=vec3(2.6,1.3,.3)*exp(-abs(dissolve-(uCleanse*1.5-.1))*70.)*step(.01,uCleanse);`);
    };m.customProgramCacheKey=()=> 'ancient-skin-v1';return m;
  }
  const skin=[material(0x283d44,.7),material(0x3f2139,.5,.22),material(0x183b4a,.48,.26)],bone=material(0x958b78,.42,.18),armor=material(0x252b3c,.35,.55),mouth=material(0x100e21,.95),pupil=material(0x020207,.9),eyes=[material(0x1d8f75,.3,.1,0x35caa5),material(0x9b253c,.25,.1,0xdd1030),material(0x394b96,.25,.1,0x505ed0)];eyes.forEach(m=>m.emissiveIntensity=.65);
  const sphere=new THREE.SphereGeometry(1,40,28);
  function add(group,geo,mat,p=[0,0,0],scale=[1,1,1],rot=[0,0,0]){const m=new THREE.Mesh(geo,mat);m.position.set(...p);m.scale.set(...scale);m.rotation.set(...rot);group.add(m);return m;}
  function form(group,mat,p,scale,seed=0){const g=sphere.clone(),a=g.attributes.position;
    for(let i=0;i<a.count;i++){let x=a.getX(i),y=a.getY(i),z=a.getZ(i);const n=1+.035*Math.sin(y*17+x*9+seed)*Math.sin(z*12+y*7);a.setXYZ(i,x*n,y*n,z*n);}g.computeVertexNormals();return add(group,g,mat,p,scale);
  }
  function sweep(group,points,radii,mat,segments=32,sides=10){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),frames=curve.computeFrenetFrames(segments,false),p=[],n=[],uv=[],ix=[];
    for(let i=0;i<=segments;i++){const t=i/segments,c=curve.getPointAt(t),j=Math.min(radii.length-2,Math.floor(t*(radii.length-1))),f=t*(radii.length-1)-j,r=radii[j]*(1-f)+radii[j+1]*f;
      for(let k=0;k<=sides;k++){const angle=k/sides*Math.PI*2,normal=frames.normals[i].clone().multiplyScalar(Math.cos(angle)).addScaledVector(frames.binormals[i],Math.sin(angle));const ridge=1+.045*Math.sin(t*35+angle*5);p.push(c.x+normal.x*r*ridge,c.y+normal.y*r*ridge,c.z+normal.z*r*ridge);n.push(...normal.toArray());uv.push(k/sides,t);if(i<segments&&k<sides){const a=i*(sides+1)+k,b=a+sides+1;ix.push(a,b,a+1,b,b+1,a+1);}}
    }const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(n,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(ix);return add(group,g,mat);
  }
  function joint(group,p){const g=new THREE.Group();g.position.set(...p);group.add(g);return g;}
  function eye(group,index,p,size=.11){const globe=form(group,eyes[index],p,[size,size*.26,size*.5]);globe.rotation.z=Math.sign(p[0])*.2;form(group,pupil,[p[0],p[1],p[2]+size*.48],[size*.12,size*.2,.018]);}
  function skull(group,index,dragon=false){const g=new THREE.Group();group.add(g);const geo=new THREE.SphereGeometry(1,64,44),a=geo.attributes.position;
    for(let i=0;i<a.count;i++){let x=a.getX(i),y=a.getY(i),z=a.getZ(i);const front=Math.max(0,z),socket=Math.exp(-((Math.abs(x)-.43)**2*28+(y-.13)**2*48)),brow=Math.exp(-((Math.abs(x)-.4)**2*20+(y-.39)**2*60));z+=front*(-socket*.18+brow*.14+.09*Math.exp(-x*x*35-(y-.04)**2*6));x*=1+.1*Math.exp(-((y+.28)**2)*16);a.setXYZ(i,x*.64,y*.81,z*.55);}geo.computeVertexNormals();add(g,geo,skin[index]);
    for(const side of [-1,1]){eye(g,index,[side*.29,.12,.49],.115);sweep(g,[[side*.12,.16,.51],[side*.3,.3,.56],[side*.55,.38,.35]],[.09,.11,.015],armor,18);sweep(g,[[side*.4,-.03,.38],[side*.54,-.22,.39],[side*.36,-.5,.4]],[.1,.08,.018],bone,18);
      const horn=index===1?[[side*.4,.56,-.08],[side*.95,.95,-.2],[side*1.12,.55,-.5],[side*.78,.32,-.7]]:[[side*.4,.56,-.08],[side*.76,1.02,-.4],[side*.81,1.4,-.9],[side*.58,1.68,-1.25]];
      sweep(g,horn,[.19,.14,.07,.002],bone,30);sweep(g,[[side*.49,-.17,.07],[side*.8,-.25,-.13],[side*.91,-.18,-.4]],[.12,.08,.001],bone,20);
    }
    if(index===0)for(let k=0;k<5;k++){const x=(k-2)*.18;sweep(g,[[x,.65,-.15],[x*1.4,1.1,-.4],[x*1.2+.04,1.55,-.75]],[.11,.065,.001],armor,24);}
    form(g,skin[index],[0,-.05,dragon?.56:.48],dragon?[.37,.24,.75]:[.14,.28,.19]);
    for(const side of [-1,1])form(g,mouth,[side*(dragon?.19:.08),-.12,dragon?1.21:.65],[.055,.035,.018]);
    const jaw=joint(g,[0,-.26,.05]),jawDepth=dragon?.98:.49;
    form(g,mouth,[0,-.28,dragon?.57:.53],dragon?[.37,.2,.50]:[.35,.2,.12]);form(jaw,skin[index],[0,-.23,jawDepth*.55],[dragon?.4:.36,.16,dragon?.65:.4]);
    for(let k=0;k<9;k++){const x=(k-4)*.075,z=dragon?.98+Math.sqrt(Math.max(0,1-(x/.4)**2))*.32:.46+Math.sqrt(Math.max(0,1-(x/.4)**2))*.21;const len=k===1||k===7?.3:.12+(k%3)*.025;
      sweep(g,[[x,-.18,z],[x,-.18-len*.6,z+.025],[x,-.18-len,z-.02]],[.035,.023,.001],bone,10,7);
      sweep(jaw,[[x,-.17,z-.05],[x,-.06,z-.02],[x,.02,z-.04]],[.025,.017,.001],bone,9,7);
    }
    parts.push(g);return {head:g,jaw};
  }
  function hand(group,mat,p,side,large=1){const root=joint(group,p);sweep(root,[[0,0,0],[side*.4,-.55,.1],[side*.44,-1.08,.38]],[.28,.25,.12],mat);form(root,mat,[side*.44,-1.18,.43],[.24,.28,.17]);
    for(let i=0;i<5;i++){const x=side*(.18+i*.12),y=-1.25-(i===0?-.06:.07);sweep(root,[[x,y,.49],[x+side*.06,y-.3,.62],[x+side*.04,y-.47,.8]],[.065,.052,.027],mat,16,8);sweep(root,[[x+side*.04,y-.45,.8],[x-side*.03,y-.65,.96],[x-side*.11,y-.7,.91]],[.055,.035,.001],bone,16,8);}
    root.scale.setScalar(large);parts.push(root);return root;
  }
  function wing(group,side,index){const root=joint(group,[side*.48,1.2,-.48]);
    const tips=[[side*1.4,2.5,-.45],[side*3.5,2.1,-.2],[side*3.8,.3,.25],[side*2.4,-1.1,.4],[side*.7,-1.4,.2]];
    const curves=tips.map((tip,i)=>new THREE.CatmullRomCurve3([new THREE.Vector3(0,0,0),new THREE.Vector3(side*.9,1.5-i*.22,-.1),new THREE.Vector3(...tip)]));
    for(let j=0;j<curves.length-1;j++){const p=[],uv=[],ix=[],nx=12,ny=18;
      for(let y=0;y<=ny;y++)for(let x=0;x<=nx;x++){const u0=x/nx,v=y/ny*(1-Math.sin(x/nx*Math.PI)*.2),a=curves[j].getPoint(v),b=curves[j+1].getPoint(v),q=a.lerp(b,u0);q.z+=Math.sin(u0*Math.PI)*Math.sin(v*Math.PI)*.23;p.push(q.x,q.y,q.z);uv.push(u0,y/ny);if(y<ny&&x<nx){const k=y*(nx+1)+x;ix.push(k,k+1,k+nx+1,k+1,k+nx+2,k+nx+1);}}
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();const mat=skin[index].clone();mat.side=THREE.DoubleSide;mat.onBeforeCompile=skin[index].onBeforeCompile;mat.customProgramCacheKey=skin[index].customProgramCacheKey;add(root,geo,mat);
    }
    tips.forEach((tip,i)=>{sweep(root,[[0,0,0],[side*.9,1.5-i*.22,-.1],tip],[.12,.09,.005],bone,28,8);});parts.push(root);return root;
  }
  function torso(group,index,dragon=false){const profile=dragon?[[-1,.6,.5],[-.3,1.0,.85],[.7,.85,.67],[1.4,.53,.46]]:[[-1.3,.4,.31],[-.6,.55,.42],[.25,.75,.5],[1.1,1.0,.57],[1.6,.6,.4]];
    const p=[],uv=[],ix=[],rings=40,sides=40;
    for(let i=0;i<=rings;i++){const t=i/rings*(profile.length-1),k=Math.min(profile.length-2,Math.floor(t)),f=t-k,y=profile[k][0]+(profile[k+1][0]-profile[k][0])*f,rx=profile[k][1]+(profile[k+1][1]-profile[k][1])*f,rz=profile[k][2]+(profile[k+1][2]-profile[k][2])*f;
      for(let j=0;j<=sides;j++){const a=j/sides*Math.PI*2,n=1+.04*Math.sin(a*8+y*4),chest=Math.max(0,Math.sin(a))*.12*Math.cos(y*6);p.push(Math.cos(a)*rx*n,y,Math.sin(a)*(rz*n+chest));uv.push(j/sides,i/rings);if(i<rings&&j<sides){const k0=i*(sides+1)+j;ix.push(k0,k0+sides+1,k0+1,k0+1,k0+sides+1,k0+sides+2);}}
    }const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(p,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(ix);geo.computeVertexNormals();add(group,geo,skin[index]);
    for(const s of [-1,1])for(let j=0;j<4;j++)sweep(group,[[s*.08,.8-j*.28,.48],[s*.45,.88-j*.28,.61],[s*.7,.65-j*.28,.36]],[.045,.065,.012],index===0?bone:armor,18,8);
  }
  for(let index=0;index<3;index++){
    const group=new THREE.Group();group.name=['Abyssal elder','Crowned archdemon','Ancient void dragon'][index];parent.add(group);torso(group,index,index===2);
    const face=skull(group,index,index===2);face.head.position.set(0,index===0?2.25:2.05,index===2?.65:.05);
    const arms=[hand(group,skin[index],[-.85,1.2,index===2?.4:0],-1),hand(group,skin[index],[.85,1.2,index===2?.4:0],1)];
    const wings=index===0?[]:[wing(group,-1,index),wing(group,1,index)];
    const tentacles=[];
    if(index===0){
      for(let j=0;j<8;j++){const x=(j-3.5)*.12,g=joint(face.head,[x,-.25,.57]);sweep(g,[[0,0,0],[x*.4,-.4,.18],[x*1.4,-.95,.33],[x*2.0+.08,-1.35,.12]],[.095,.09,.045,.001],skin[0],28,9);tentacles.push(g);parts.push(g);}
      for(let j=0;j<2;j++)for(const s of [-1,1])eye(face.head,0,[s*(.22+j*.03),.48+j*.19,.48-j*.15],.08);
      for(let j=0;j<9;j++){const a=j/9*Math.PI*2;sweep(group,[[Math.cos(a)*.45,-1.0,Math.sin(a)*.3],[Math.cos(a)*.8,-1.8,Math.sin(a)*.6],[Math.cos(a)*1.1,-2.8,Math.sin(a)*.8]],[.19,.13,.003],skin[0],25,9);}
    }
    const legs=[];for(const s of [-1,1]){const leg=joint(group,[s*.42,-1.1,index===2?-.45:0]);sweep(leg,[[0,0,0],[s*.16,-.7,-.15],[s*.12,-1.3,.24]],[.3,.22,.13],skin[index],24);for(let j=0;j<3;j++)sweep(leg,[[s*.12+(j-1)*.13,-1.3,.24],[s*.12+(j-1)*.18,-1.52,.57],[s*.12+(j-1)*.2,-1.47,.77]],[.11,.07,.001],bone,14,8);legs.push(leg);parts.push(leg);}
    let tail=null;if(index===2){tail=joint(group,[0,-.65,-.5]);sweep(tail,[[0,0,0],[.4,-.5,-1.2],[1.2,-.4,-2.6],[1.7,.4,-3.4],[1.1,1,-3.8]],[.4,.32,.2,.09,.001],skin[2],50);parts.push(tail);for(let j=0;j<8;j++)sweep(group,[[0,1.2-j*.18,-.5-j*.18],[0,1.65-j*.12,-.7-j*.18],[0,1.75-j*.14,-.95-j*.18]],[.16,.09,.001],bone,15,8);}
    const orb=joint(arms[1],[.4,-1.4,.85]),orbColor=new THREE.Color([0x9c35ff,0xff184a,0x447dff][index]);
    const orbMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uClock:u.clock,uCleanse:u.cleanse,uColor:{value:orbColor}},vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,fragmentShader:`varying vec2 vUv;uniform float uClock,uCleanse;uniform vec3 uColor;void main(){float a=vUv.x*6.283+uClock*1.8;float vein=pow(max(0.,sin(a*5.+sin(vUv.y*24.-uClock)*2.)),8.);gl_FragColor=vec4(uColor*(1.+vein*2.),(.16+vein*.5)*(1.-uCleanse));}`});
    form(orb,orbMaterial,[0,0,0],[.43,.43,.43]);const rings=[];for(let j=0;j<2;j++){const ring=add(orb,new THREE.TorusGeometry(.5+j*.17,.01,6,70),eyes[index]);ring.rotation.x=j*.9;ring.userData.articulated=true;rings.push(ring);}
    actors.push({group,head:face.head,jaw:face.jaw,arms,wings,tentacles,legs,tail,orb,rings,features:{eyes:index===0?6:2,claws:16,wingWebs:wings.length*4}});
  }
  // Merge static sculpt details within each joint, preserving articulation with fewer draw calls.
  function merge(group){for(const child of [...group.children])if(child.isGroup)merge(child);
    const pools=new Map();for(const m of [...group.children])if(m.isMesh&&!m.userData.articulated){m.updateMatrix();const key=m.material.uuid;if(!pools.has(key))pools.set(key,[]);pools.get(key).push(m);}
    for(const list of pools.values()){if(list.length<2)continue;const pos=[],normal=[],uv=[],index=[];let offset=0;
      for(const m of list){const geo=m.geometry.clone().applyMatrix4(m.matrix),p=geo.attributes.position,n=geo.attributes.normal,t=geo.attributes.uv;pos.push(...p.array);normal.push(...n.array);if(t)uv.push(...t.array);else for(let i=0;i<p.count;i++)uv.push(0,0);if(geo.index)for(const i of geo.index.array)index.push(i+offset);else for(let i=0;i<p.count;i++)index.push(i+offset);offset+=p.count;geo.dispose();group.remove(m);}
      const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normal,3));geo.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));geo.setIndex(index);add(group,geo,list[0].material);
    }
  }actors.forEach(a=>merge(a.group));
  const point=new THREE.Vector3();
  return {actors,collisionSpheres(){const result=[];actors.forEach((a,index)=>{a.group.updateWorldMatrix(true,true);const scale=a.group.scale.x;
    const sample=(group,local,radius)=>{group.localToWorld(point.set(...local));result.push({center:point.toArray(),radius:radius*scale,actor:index});};
    sample(a.group,[0,.3,0],.85);sample(a.head,[0,0,.1],.65);
    a.legs.forEach((g,k)=>sample(g,[(k?1:-1)*.12,-1.4,.55],.4));
    a.arms.forEach((g,k)=>sample(g,[(k?1:-1)*.5,-1.55,.85],.42));
    a.wings.forEach((g,k)=>{const side=k?1:-1;sample(g,[side*3.8,.3,.25],.28);sample(g,[side*2.4,-1.1,.4],.28);});
  });return result;},update(siege,rebirth,mask,reduced,spread=1){const state=siegeState(siege);u.cleanse.value=mask===7?Math.min(1,rebirth/.65):0;u.clock.value=siege;
    actors.forEach((a,i)=>{const pose=enemyPose(i,siege,rebirth,mask,reduced),t=reduced?0:siege;
      a.group.position.set(pose.position[0]*spread,pose.position[1],pose.position[2]);a.group.rotation.set(0,pose.yaw*.7,pose.roll);a.group.scale.setScalar(pose.scale*.86);a.head.rotation.y=-pose.yaw*.3;a.jaw.rotation.x=reduced?.15:.2+Math.max(0,Math.sin(t*1.3+i))*(.22+state.urgency*.3);
      a.arms.forEach((g,k)=>{g.rotation.x=reduced?0:-state.urgency*.5+Math.sin(t*1.4+k*3)*.18;g.rotation.z=reduced?0:Math.sin(t*.8+k)*.07;});
      a.wings.forEach((g,k)=>{g.rotation.y=reduced?0:Math.sin(t*(i===1?1.6:2.0))*.32*(k?1:-1);g.rotation.z=reduced?0:Math.cos(t*1.6)*.055*(k?1:-1);});
      a.tentacles.forEach((g,k)=>{g.rotation.z=reduced?0:Math.sin(t*1.8+k*.7)*.21;g.rotation.x=reduced?0:Math.sin(t*1.1+k)*.13;});a.legs.forEach((g,k)=>g.rotation.x=reduced?0:Math.sin(t*1.7+k*Math.PI)*.24);if(a.tail)a.tail.rotation.y=reduced?0:Math.sin(t*1.2)*.3;a.rings.forEach((r,k)=>r.rotation.y=reduced?0:t*(.7+k*.3));
    });
  }};
}
