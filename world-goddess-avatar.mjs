import {GLTFLoader} from './assets/vendor/GLTFLoader.js';
import {VRMLoaderPlugin} from './assets/vendor/three-vrm.module.min.js';

export function loadGoddessAvatar(url){
  const loader=new GLTFLoader();loader.register(parser=>new VRMLoaderPlugin(parser));return loader.loadAsync(url);
}

export function createGoddessAvatar(THREE,gltf,uniforms){
  const vrm=gltf.userData.vrm,root=new THREE.Group();root.name='Volumetric celestial goddess';root.position.y=-3;root.scale.setScalar(3.6);root.add(vrm.scene);
  const meshes=[],passes=[],materials=[],oldMaterials=new Set(),textures=new Set(),hairBones=[];
  const wind=`float skirtWind=(1.-smoothstep(.08,.95,position.y))*uWind;transformed.x+=sin(uClock*.68+position.y*5.+position.x*8.)*.018*skirtWind;transformed.z+=sin(uClock*.53+position.y*7.+position.z*6.)*.016*skirtWind;`;
  function hook(material,{cloth=false,trim=false,hair=false,ivory=false,iris=false}={}){
    material.onBeforeCompile=shader=>{shader.uniforms.uClock=uniforms.uClock;shader.uniforms.uWind=uniforms.uWind;
      shader.vertexShader='uniform float uClock,uWind;varying float vAvatarY;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvAvatarY=position.y;'+(cloth?wind:''));
      shader.fragmentShader='varying float vAvatarY;\n'+shader.fragmentShader;
      if(trim)shader.fragmentShader=shader.fragmentShader.replace('#include <alphatest_fragment>','#include <alphatest_fragment>\nif(vAvatarY<.84)discard;');
      if(material.isMeshStandardMaterial){let recolor='';if(hair)recolor='float hairShade=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=mix(vec3(.48,.51,.60),vec3(.95,.92,.82),clamp(hairShade*2.2,0.,1.));';if(ivory)recolor='float clothShade=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=mix(vec3(.50,.51,.55),vec3(.90,.88,.81),clamp(clothShade*1.5+.25,0.,1.));';if(iris)recolor='float eyeShade=dot(diffuseColor.rgb,vec3(.2126,.7152,.0722));diffuseColor.rgb=mix(vec3(.16,.07,.015),vec3(.85,.56,.13),clamp(eyeShade*2.3,0.,1.));';if(recolor)shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+recolor);
      }
    };material.customProgramCacheKey=()=>JSON.stringify({goddess:'volume-v1',cloth,trim,hair,ivory,iris,depth:material.isMeshDepthMaterial});
  }
  function register(mesh,material,alpha,settings={}){
    mesh.material=material;mesh.renderOrder=33;mesh.frustumCulled=false;material.transparent=true;material.opacity=0;material.depthWrite=false;material.depthFunc=THREE.EqualDepth;material.side=THREE.FrontSide;material.alphaTest=Math.max(material.alphaTest||0,.08);hook(material,settings);materials.push({material,alpha});meshes.push(mesh);
    const depth=new THREE.MeshDepthMaterial({map:material.map,alphaTest:material.alphaTest,colorWrite:false,depthWrite:true,depthTest:true,side:THREE.FrontSide});hook(depth,settings);
    let pass;if(mesh.isSkinnedMesh){pass=new THREE.SkinnedMesh(mesh.geometry,depth);pass.bindMode=mesh.bindMode;pass.bind(mesh.skeleton,mesh.bindMatrix);pass.bindMatrixInverse.copy(mesh.bindMatrixInverse);}else pass=new THREE.Mesh(mesh.geometry,depth);
    pass.position.copy(mesh.position);pass.quaternion.copy(mesh.quaternion);pass.scale.copy(mesh.scale);pass.morphTargetInfluences=mesh.morphTargetInfluences;pass.morphTargetDictionary=mesh.morphTargetDictionary;pass.renderOrder=32;pass.frustumCulled=false;pass.name='Goddess matched depth shell';mesh.parent.add(pass);passes.push(pass);
  }
  const sourceMeshes=[];vrm.scene.traverse(o=>{if(o.isMesh)sourceMeshes.push(o);if(o.isBone&&/^J_Sec_Hair/.test(o.name))hairBones.push(o);});
  for(const mesh of sourceMeshes){const source=[mesh.material].flat()[0],name=source.name||'';for(const m of [mesh.material].flat()){oldMaterials.add(m);for(const value of Object.values(m))if(value?.isTexture)textures.add(value);}
    if(/Bottoms|Shoes/.test(name)){mesh.visible=false;continue;}
    const hair=/HAIR/.test(name),ivory=/CLOTH/.test(name),iris=/Iris/.test(name),detail=/Eyeline|Brow|Mouth|EyeWhite|Highlight/.test(name);
    const m=new THREE.MeshStandardMaterial({name:'Goddess '+name,map:source.map,color:0xffffff,roughness:hair?.5:.72,metalness:hair?.08:0,envMapIntensity:.8,emissive:0x262c3b,emissiveIntensity:detail?.015:.08});
    register(mesh,m,detail?.99:hair?.82:ivory?.89:.97,{trim:name==='Body_00_SKIN',hair,ivory,iris});
  }
  // Original clothing: full-length folded brocade, sculpted bodice, gold piping and crown.
  const size=256,pixels=new Uint8Array(size*size*4);for(let y=0;y<size;y++)for(let x=0;x<size;x++){const u=x/size,v=y/size,thread=Math.abs(Math.sin(u*Math.PI*8+Math.sin(v*Math.PI*8)*.8)),leaf=Math.abs(Math.sin(v*Math.PI*8+Math.sin(u*Math.PI*8)*.8)),gold=thread<.05||leaf<.045,grain=(Math.sin(x*1.6+y*2.7)+1)*2;pixels.set(gold?[190,153,82,255]:[226+grain,225+grain,219+grain,255],(y*size+x)*4);}
  const brocade=new THREE.DataTexture(pixels,size,size);brocade.colorSpace=THREE.SRGBColorSpace;brocade.wrapS=brocade.wrapT=THREE.RepeatWrapping;brocade.repeat.set(3,2);brocade.needsUpdate=true;textures.add(brocade);
  function garment(geometry,options={}){const m=new THREE.MeshStandardMaterial({color:options.gold?0xd9b36a:0xf5eee1,map:options.gold?null:brocade,metalness:options.gold?.72:.08,roughness:options.gold?.28:.68,envMapIntensity:1,emissive:options.gold?0x302109:0x0c1826,emissiveIntensity:.12});const o=new THREE.Mesh(geometry,m);root.add(o);register(o,m,options.gold?.88:.87,{cloth:options.wind!==false});return o;}
  function robeGeometry(){const rings=30,sides=96,p=[],uv=[],idx=[];for(let j=0;j<=rings;j++){const t=j/rings,y=.06+t*.90,r=.45*(1-t)+.16*t+.025*Math.sin(t*Math.PI);for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2,fold=1+.075*Math.cos(a*16)*(1-t);p.push(Math.cos(a)*r*fold,y+.018*Math.cos(a*8)*(1-t),Math.sin(a)*r*.82*fold);uv.push(i/sides,t);if(j<rings&&i<sides){const k=j*(sides+1)+i;idx.push(k,k+sides+1,k+1,k+1,k+sides+1,k+sides+2);}}}const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();return g;}
  const skirt=garment(robeGeometry());skirt.name='Three-dimensional folded ceremonial gown';
  const bodice=garment(new THREE.LatheGeometry([new THREE.Vector2(.16,.91),new THREE.Vector2(.16,1.00),new THREE.Vector2(.20,1.14),new THREE.Vector2(.205,1.23),new THREE.Vector2(.10,1.31)],64),{wind:false});bodice.scale.z=.76;bodice.name='Sculpted ivory brocade bodice';
  function tube(points,radius=.004,gold=true,winded=true){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));return garment(new THREE.TubeGeometry(curve,64,radius,6,false),{gold,wind:winded});}
  for(let i=0;i<16;i++){const a=i/16*Math.PI*2,points=[];for(let j=0;j<=22;j++){const t=j/22,y=.06+t*.9,r=.45*(1-t)+.16*t+.025*Math.sin(t*Math.PI);points.push([Math.cos(a)*(r+.004)*(1+.075*(1-t)),y,Math.sin(a)*(r+.004)*.82*(1+.075*(1-t))]);}tube(points,.0028);}
  for(const y of [.085,.94,1.015]){const ring=garment(new THREE.TorusGeometry(y>.9?.163:.443,.007,6,96),{gold:true,wind:y<.9});ring.rotation.x=Math.PI/2;ring.position.y=y;ring.scale.y=.82;}
  const head=vrm.humanoid.getRawBoneNode('head'),headMount=new THREE.Group(),crown=new THREE.Group();head.updateWorldMatrix(true,false);headMount.quaternion.copy(head.getWorldQuaternion(new THREE.Quaternion())).invert();head.add(headMount);crown.name='Sculpted divine crown';headMount.add(crown);crown.position.y=.205;
  const crownGold=new THREE.MeshStandardMaterial({color:0xe3bc66,metalness:.78,roughness:.24,emissive:0x3a270a,emissiveIntensity:.12});
  function crownPart(g,p,s=[1,1,1]){const o=new THREE.Mesh(g,crownGold.clone());o.position.set(...p);o.scale.set(...s);crown.add(o);register(o,o.material,.94);return o;}
  const circlet=crownPart(new THREE.TorusGeometry(.158,.008,8,96),[0,0,0]);circlet.rotation.x=Math.PI/2;
  for(let i=0;i<12;i++){const a=i/12*Math.PI*2,x=Math.cos(a)*.15,z=Math.sin(a)*.15,h=.06+(i%3===0?.045:0);crownPart(new THREE.ConeGeometry(.012,h,7),[x,h*.5,z]);crownPart(new THREE.SphereGeometry(.009,8,6),[x,h,z]);}
  const gemMaterial=new THREE.MeshStandardMaterial({color:0x79dce5,emissive:0x1b4953,emissiveIntensity:.4,metalness:.3,roughness:.18});const gem=new THREE.Mesh(new THREE.OctahedronGeometry(.025),gemMaterial);gem.position.set(0,.035,.165);crown.add(gem);register(gem,gemMaterial,.94);
  const glory=crownPart(new THREE.TorusGeometry(.235,.0035,6,96),[0,.025,-.095]);glory.name='Three-dimensional crown halo';
  // A closed, pleated mantle gives the silhouette a layered front, side and back.
  const capePositions=[],capeUV=[],capeIndices=[],rows=32,columns=40;
  for(let layer=0;layer<2;layer++)for(let j=0;j<=rows;j++)for(let i=0;i<=columns;i++){const t=j/rows,u=i/columns,w=.18+t*.24;capePositions.push((u*2-1)*w,1.245-t*1.1+Math.cos(u*Math.PI*8)*.025*t,-.13-Math.sin(t*Math.PI/2)*.21-Math.cos(u*Math.PI*8)*.012+layer*.005);capeUV.push(u,t);}
  const planeCount=(rows+1)*(columns+1);for(let j=0;j<rows;j++)for(let i=0;i<columns;i++){const k=j*(columns+1)+i;capeIndices.push(k,k+1,k+columns+1,k+1,k+columns+2,k+columns+1);const b=k+planeCount;capeIndices.push(b,b+columns+1,b+1,b+1,b+columns+1,b+columns+2);}for(let j=0;j<rows;j++)for(const edge of [0,columns]){const k=j*(columns+1)+edge,n=k+columns+1;capeIndices.push(k,n,k+planeCount,n,n+planeCount,k+planeCount);}
  const capeGeo=new THREE.BufferGeometry();capeGeo.setAttribute('position',new THREE.Float32BufferAttribute(capePositions,3));capeGeo.setAttribute('uv',new THREE.Float32BufferAttribute(capeUV,2));capeGeo.setIndex(capeIndices);capeGeo.computeVertexNormals();const cape=garment(capeGeo);cape.name='Layered flowing royal mantle';
  for(const side of [-1,1]){const shoulder=garment(new THREE.SphereGeometry(1,20,12),{gold:true,wind:false});shoulder.position.set(side*.13,1.265,-.025);shoulder.scale.set(.085,.035,.10);const points=[];for(let j=0;j<=32;j++){const t=j/32;points.push([side*(.18+t*.24),1.245-t*1.1+.025*t,-.13-Math.sin(t*Math.PI/2)*.21-.012]);}tube(points,.004);}
  const chestGem=new THREE.Mesh(new THREE.OctahedronGeometry(.025),gemMaterial.clone());chestGem.position.set(0,1.205,.165);root.add(chestGem);register(chestGem,chestGem.material,.95);
  // Gold chest filigree follows the actual torso rather than a front-facing picture.
  for(const side of [-1,1])tube([[side*.08,1.285,.072],[side*.14,1.22,.13],[side*.09,1.13,.15],[0,1.08,.15]],.004,true,false);
  const q=new THREE.Quaternion(),axis=new THREE.Vector3(0,0,1),pose={};for(const [bone,angle] of [['leftUpperArm',-.83],['rightUpperArm',.83]]){q.setFromAxisAngle(axis,angle);pose[bone]={rotation:q.toArray()};}vrm.humanoid.setNormalizedPose(pose);vrm.update(0);root.updateMatrixWorld(true);
  let previousClock=null,wasActive=false;
  const api={root,vrm,meshes,passes,materials,skirt,hairBones,
    update(amount,clock,reduced){uniforms.uClock.value=reduced?0:clock;uniforms.uWind.value=reduced?0:1;for(const {material,alpha} of materials)material.opacity=amount*alpha;meshes.forEach((m,i)=>{const p=passes[i];p.position.copy(m.position);p.quaternion.copy(m.quaternion);p.scale.copy(m.scale);p.visible=amount>0;});
      const t=reduced?0:clock,headBone=vrm.humanoid.getNormalizedBoneNode('head'),chest=vrm.humanoid.getNormalizedBoneNode('chest');headBone.rotation.y=Math.sin(t*.36)*.025;headBone.rotation.x=Math.sin(t*.48)*.012;chest.rotation.z=Math.sin(t*.42)*.008;
      const dt=reduced||previousClock===null?0:Math.max(0,Math.min(.05,clock-previousClock));previousClock=clock;root.updateMatrixWorld(true);vrm.update(amount>0?dt:0);if(wasActive&&amount===0)vrm.springBoneManager?.reset();wasActive=amount>0;
    },
    dispose(){textures.forEach(t=>t.dispose());oldMaterials.forEach(m=>m.dispose());const skeletons=new Set();vrm.scene.traverse(o=>{if(o.isSkinnedMesh)skeletons.add(o.skeleton);});skeletons.forEach(s=>s.dispose());},
  };return api;
}
