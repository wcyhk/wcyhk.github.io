import {seededRandom,sphereHitsIsland,materializationState} from './world-model.mjs?v=goddess-volume-20261110';
import {createManifestation} from './world-reveal.mjs?v=goddess-volume-20261110';

export function createIslandDestruction(THREE,scene,islands,stone){
  const random=seededRandom(841),dummy=new THREE.Object3D(),fragmentGeometry=new THREE.IcosahedronGeometry(1,0),records=[];
  for(const [index,island] of islands.entries()){
    const count=36,fragmentMaterial=stone.clone(),fragments=new THREE.InstancedMesh(fragmentGeometry,fragmentMaterial,count);fragments.visible=false;fragments.frustumCulled=false;scene.add(fragments);
    const distance=Math.hypot(island.x,island.z),awayX=island.x/distance,awayZ=island.z/distance;
    const pieces=Array.from({length:count},(_,j)=>{const a=j/count*Math.PI*2,r=island.radius*(.25+random()*.7);return {x:Math.cos(a)*r,z:Math.sin(a)*r,y:random()*-.7,size:.25+random()*.55,vx:Math.cos(a)*(1+random()*2)+awayX*3.3,vz:Math.sin(a)*(1+random()*2)+awayZ*3.3,vy:1+random()*2,spin:random()*6,blocked:false};});
    const manifest=createManifestation(THREE,island.group);records.push({...island,index,fragments,pieces,manifest,hitAt:null,hitBy:null,shattered:false});
  }
  let previous=0,altarThreat=false;
  return {records,get altarThreat(){return altarThreat;},quality(light){for(const r of records)r.fragments.count=light?22:r.pieces.length;},
    update(siege,rebirth,mask,colliders,spread=1,small=false){
      if(siege<previous){for(const r of records){r.hitAt=null;r.hitBy=null;r.shattered=false;r.pieces.forEach(p=>p.blocked=false);}}previous=siege;
      altarThreat=mask!==7&&colliders.some(c=>sphereHitsIsland(c.center,c.radius,{x:0,y:-.5,z:0,radius:6.8,depth:3.9}));
      for(const r of records){const scale=small?.82:1;r.group.position.set(r.x*spread,r.y,r.z);r.group.scale.setScalar(scale);
        const collider={x:r.x*spread,y:r.y,z:r.z,radius:r.radius*scale,depth:r.depth*scale};
        if(mask!==7&&r.hitAt===null){const hit=colliders.find(c=>sphereHitsIsland(c.center,c.radius,collider));if(hit){r.hitAt=siege;r.hitBy=hit.actor;r.shattered=true;}}
        const reveal=mask===7?materializationState(rebirth,r.index%3,mask).opacity:0;
        r.group.visible=!r.shattered||reveal>0;r.manifest.update(r.shattered?reveal:1,rebirth);
        const age=r.hitAt===null?0:Math.max(0,siege-r.hitAt),fade=mask===7?Math.max(0,1-rebirth/1.1):1;
        r.fragments.visible=r.shattered&&fade>0;r.fragments.material.transparent=fade<1;r.fragments.material.opacity=fade;r.fragments.material.depthWrite=fade>=1;
        if(r.shattered){const t=Math.min(age,4.5);r.pieces.forEach((p,i)=>{dummy.position.set(r.x*spread+p.x*scale+p.vx*t,r.y+p.y+p.vy*t-.65*t*t,r.z+p.z*scale+p.vz*t);
          if(!p.blocked&&t>.05)p.blocked=records.some(other=>other!==r&&!other.shattered&&sphereHitsIsland(dummy.position.toArray(),p.size*.5*scale,{x:other.x*spread,y:other.y,z:other.z,radius:other.radius*scale,depth:other.depth*scale}));
          if(p.blocked)dummy.scale.setScalar(.001);else dummy.scale.set(p.size*scale,p.size*.68*scale,p.size*scale);dummy.rotation.set(p.spin+t*.7,p.spin+t*.9,p.spin-t*.5);dummy.updateMatrix();r.fragments.setMatrixAt(i,dummy.matrix);});r.fragments.instanceMatrix.needsUpdate=true;}
      }
    },
  };
}
