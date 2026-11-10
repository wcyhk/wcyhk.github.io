import {seededRandom} from './world-model.mjs?v=cloud-islands-20261110';

// A continuous, load-bearing crown tapers into eroded hanging cliffs, not loose debris.
export function createPalaceIsland(THREE,parent,surfaces,index){
  const random=seededRandom(810+index),root=new THREE.Group();root.name='Weathered floating palace island';parent.add(root);
  const segments=80,levels=[[-.205,1],[-.42,1.025],[-.86,.98],[-1.45,.88],[-2.12,.72],[-2.85,.49],[-3.55,.25],[-4.03,.035]],positions=[],colors=[],indices=[];
  for(let j=0;j<levels.length;j++)for(let i=0;i<=segments;i++){
    const a=i/segments*Math.PI*2,c=Math.cos(a),s=Math.sin(a),[y,r]=levels[j];
    const coast=1+(j===0?0:(Math.sin(a*7+index)*.028+Math.sin(a*13+1.2)*.018)),x=Math.sign(c)*Math.pow(Math.abs(c),.2)*5.2*r*coast,z=Math.sign(s)*Math.pow(Math.abs(s),.2)*4.5*r*coast;
    const erosion=j===0?0:Math.sin(a*11+j*.9)*.10*Math.sin(j/7*Math.PI);
    positions.push(x+Math.sin(j*.7)*.18,y+erosion,z+.25+Math.sin(j*.5)*.16);
    const vein=.5+.5*Math.sin(a*18+j*2.4),stratum=[.86,.94,.80,.90,.76,.84,.78,.82][j],grain=(random()-.5)*.07;
    const color=new THREE.Color().setRGB((stratum+grain)*(.86+vein*.08),(stratum+grain)*(.78+vein*.065),(stratum+grain)*(.66+vein*.055));colors.push(color.r,color.g,color.b);
    if(j<levels.length-1&&i<segments){const k=j*(segments+1)+i;indices.push(k,k+segments+1,k+1,k+1,k+segments+1,k+segments+2);}
  }
  // Close both caps so a low orbit cannot look through the island.
  for(const [j,flip] of [[0,false],[levels.length-1,true]]){const center=positions.length/3;positions.push(Math.sin(j*.7)*.18,levels[j][0],.25+Math.sin(j*.5)*.16);colors.push(.78,.71,.6);for(let i=0;i<segments;i++){const k=j*(segments+1)+i;indices.push(...(flip?[center,k+1,k]:[center,k,k+1]));}}
  for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();geometry.computeBoundingSphere();
  const material=new THREE.MeshStandardMaterial({color:0xcbbba5,vertexColors:true,roughness:.91,metalness:.02,normalMap:surfaces.normalMap||null,normalScale:new THREE.Vector2(.28,.28),envMapIntensity:1.35,emissive:0x60472d,emissiveIntensity:.26});
  // World-space sediment/fissure detail stays continuous across the cliff strips.
  material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vCliffPosition;').replace('#include <begin_vertex>','#include <begin_vertex>\nvCliffPosition=position;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vCliffPosition;').replace('#include <color_fragment>',`#include <color_fragment>
    float grain=sin(vCliffPosition.x*24.+sin(vCliffPosition.z*17.))*sin(vCliffPosition.y*31.+vCliffPosition.z*11.);
    float strata=pow(.5+.5*sin(vCliffPosition.y*23.+sin(vCliffPosition.x*2.2+vCliffPosition.z*1.8)*.7),12.);
    diffuseColor.rgb*=.97+grain*.05-strata*.22;`);};material.customProgramCacheKey=()=> 'weathered-cliff-v1';
  // Planar UVs for the shared fine rock normal texture.
  const uv=new Float32Array(positions.length/3*2);for(let i=0;i<positions.length/3;i++){uv[i*2]=positions[i*3]*.25;uv[i*2+1]=(positions[i*3+1]+positions[i*3+2]*.15)*.25;}geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));
  const cliff=new THREE.Mesh(geometry,material);cliff.name='Continuous stratified sandstone cliff';cliff.receiveShadow=true;root.add(cliff);
  const boulders=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1,1),material,56),dummy=new THREE.Object3D();
  for(let i=0;i<56;i++){const a=i/56*Math.PI*2,t=.15+random()*.55,r=1-t*.48,c=Math.cos(a),s=Math.sin(a);dummy.position.set(Math.sign(c)*Math.pow(Math.abs(c),.2)*5.02*r,-.45-t*2.8,Math.sign(s)*Math.pow(Math.abs(s),.2)*4.34*r+.25);dummy.rotation.set(random()*.6,random()*Math.PI,random()*.4);dummy.scale.set(.25+random()*.38,.28+random()*.55,.22+random()*.28);dummy.updateMatrix();boulders.setMatrixAt(i,dummy.matrix);}boulders.name='Attached eroded rock outcrops';boulders.receiveShadow=true;root.add(boulders);
  const count=108,p=new Float32Array(count*3),seeds=new Float32Array(count*3);
  for(let i=0;i<count;i++){const a=i/count*Math.PI*2,band=i%3,r=.9+random()*.20;p.set([Math.cos(a)*5.4*r,-.55-band*.8-random()*.6,Math.sin(a)*4.65*r+.25],i*3);seeds.set([random(),random(),band],i*3);}
  const fogGeometry=new THREE.BufferGeometry();fogGeometry.setAttribute('position',new THREE.BufferAttribute(p,3));fogGeometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,3));
  const uniforms={uClock:{value:0},uOpacity:{value:0},uRatio:{value:1},uScale:{value:1}};
  const fogMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,toneMapped:false,uniforms,
    vertexShader:`attribute vec3 aSeed;uniform float uClock,uRatio,uScale;varying vec3 vSeed;void main(){vec3 p=position;float a=uClock*.012*(.7+aSeed.x*.6),c=cos(a),s=sin(a);p.xz=mat2(c,-s,s,c)*p.xz;p.y+=sin(uClock*.18+aSeed.x*9.)*.17;vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=min(230.*uRatio,(1.5+aSeed.y*1.8)*uScale*uRatio*650./max(1.,-mv.z));vSeed=aSeed;}`,
    fragmentShader:`uniform float uClock,uOpacity;varying vec3 vSeed;float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+1.),f.x),f.y);}void main(){vec2 p=(gl_PointCoord-.5)*2.;float n=noise(p*3.+vSeed.xy*11.+vec2(uClock*.024,-uClock*.016))*.65+noise(p*7.-uClock*.018)*.35;float r=length(p*vec2(.85,1.15));float a=exp(-r*r*2.6)*(1.-smoothstep(.45,.98,r+(n-.5)*.24));vec3 color=mix(vec3(.55,.39,.23),vec3(1.30,1.04,.67),clamp(n*.7+vSeed.y*.4,0.,1.));gl_FragColor=vec4(color,a*uOpacity*.25);}`});
  const mist=new THREE.Points(fogGeometry,fogMaterial);mist.name='Slowly flowing island mist';mist.userData.revealIgnore=true;mist.frustumCulled=false;mist.renderOrder=25;root.add(mist);
  return {root,cliff,boulders,mist,uniforms,quality(light,ratio){fogGeometry.setDrawRange(0,light?54:count);uniforms.uRatio.value=ratio;},update(opacity,ambient,scale,reduced){uniforms.uOpacity.value=opacity;uniforms.uClock.value=reduced?0:ambient;uniforms.uScale.value=scale;mist.visible=opacity>0;}};
}
