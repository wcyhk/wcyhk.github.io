import {seededRandom,smootherStep} from './world-model.mjs?v=goddess-volume-20261110';
import {loadGoddessAvatar,createGoddessAvatar} from './world-goddess-avatar.mjs?v=goddess-volume-20261110';

// Fully skinned, volumetric avatar: its orientation belongs to the world, never the camera.
export function createGoddess(THREE,scene,camera){
  const root=new THREE.Group();root.name='Celestial goddess apparition';root.position.set(0,3.60,1.75);scene.add(root);
  const u={uClock:{value:0},uPower:{value:0},uReady:{value:0},uRatio:{value:1},uWind:{value:1}};
  const vertex=`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
  const halo=new THREE.Mesh(new THREE.TorusGeometry(1.02,.012,8,128),new THREE.MeshBasicMaterial({color:new THREE.Color(2.0,1.6,.75),transparent:true,opacity:0,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,toneMapped:false}));halo.position.set(0,2.2,-.5);halo.name='Volumetric divine glory';halo.renderOrder=34;root.add(halo);
  const ribbons=new THREE.Group();ribbons.name='Divine flowing light ribbons';root.add(ribbons);
  const ribbonMaterial=new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,toneMapped:false,uniforms:u,vertexShader:vertex,fragmentShader:`varying vec2 vUv;uniform float uClock,uPower;void main(){float flow=.22+.78*pow(.5+.5*sin(vUv.x*18.-uClock*2.2),4.);float end=sin(vUv.x*3.14159265);gl_FragColor=vec4(vec3(2.2,1.7,.78),flow*end*uPower*.32);}`});
  for(let k=0;k<3;k++){const points=[];for(let j=0;j<=80;j++){const t=j/80,a=t*Math.PI*2.3+k*Math.PI*2/3,r=1.55+Math.sin(t*Math.PI)*.65;points.push(new THREE.Vector3(Math.cos(a)*r,-3.0+t*5.8,Math.sin(a)*r));}const m=new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),120,.025,5,false),ribbonMaterial);m.renderOrder=36;ribbons.add(m);}
  const random=seededRandom(940),count=720,seeds=new Float32Array(count*4),geometry=new THREE.BufferGeometry();for(let i=0;i<count;i++)seeds.set([random(),random(),random(),random()],i*4);geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*3),3));geometry.setAttribute('aSeed',new THREE.BufferAttribute(seeds,4));
  const particles=new THREE.Points(geometry,new THREE.ShaderMaterial({transparent:true,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending,toneMapped:false,uniforms:u,vertexShader:`attribute vec4 aSeed;uniform float uClock,uPower,uRatio;varying float vA;void main(){float t=fract(aSeed.z+uClock*.07),a=aSeed.x*6.283+uClock*.14,r=1.2+aSeed.y*1.5;vec3 p=vec3(cos(a)*r,-3.+t*6.2,sin(a)*r);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp((1.+aSeed.w*2.)*uRatio*24./max(1.,-mv.z),1.,4.5);vA=sin(t*3.14159)*uPower;}`,fragmentShader:`varying float vA;void main(){float r=length(gl_PointCoord-.5)*2.;if(r>1.)discard;gl_FragColor=vec4(vec3(1.8,1.7,1.1),exp(-r*r*7.)*vA*.6);}`}));particles.name='Goddess ascension motes';particles.frustumCulled=false;particles.renderOrder=36;root.add(particles);
  let strength=0,state='loading',disposed=false,avatar;
  const api={root,halo,ribbons,particles,uniforms:u,onReady:null,get strength(){return strength;},get assetState(){return state;},get avatar(){return avatar;},
    setAvatar(gltf){const loaded=createGoddessAvatar(THREE,gltf,u);if(disposed){loaded.dispose();return;}avatar=loaded;root.add(loaded.root);u.uReady.value=1;state='ready';api.onReady?.();},
    quality(light,ratio){geometry.setDrawRange(0,light?240:count);u.uRatio.value=ratio;},
    update(elapsed,mask,clock,reduced){strength=mask===7?smootherStep((elapsed-4.5)/4.5):0;u.uPower.value=strength;u.uClock.value=reduced?0:clock;u.uWind.value=reduced?0:1;root.visible=strength>0&&state==='ready';root.position.y=3.60+(reduced?0:Math.sin(clock*.65)*.055)*strength;avatar?.update(strength,clock,reduced);halo.material.opacity=strength*.25;ribbons.rotation.y=reduced?0:clock*.065;},
    dispose(){disposed=true;avatar?.dispose();},
  };
  root.visible=false;
  if(typeof document!=='undefined')loadGoddessAvatar(new URL('./assets/goddess-avatar.vrm',import.meta.url).href).then(gltf=>api.setAvatar(gltf)).catch(()=>{state='failed';api.onReady?.();});
  return api;
}
