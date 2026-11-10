import {swarmPose,holyRadius,holyContact} from './world-model.mjs?v=slow-sanctuary-20261110';
import {holySkin} from './world-spells.mjs?v=slow-sanctuary-20261110';

// Four instanced meshes retain articulated wings and glowing eyes for the entire 360° siege.
export function createDemonSwarm(THREE,parent){
  const field={radius:{value:0},active:{value:0},clock:{value:0}},root=new THREE.Group();root.name='Encircling winged fiends';parent.add(root);
  const skin=holySkin(new THREE.MeshStandardMaterial({color:0x25213b,metalness:.28,roughness:.48,side:THREE.DoubleSide}),field),glow=holySkin(new THREE.MeshStandardMaterial({color:0xb82e64,emissive:0xeb265c,emissiveIntensity:1.8}),field);
  const outline=new THREE.Shape();outline.moveTo(0,0);outline.lineTo(.28,.65);outline.lineTo(.8,1.04);outline.lineTo(1.5,.65);outline.quadraticCurveTo(1.1,.52,1.18,.12);outline.quadraticCurveTo(.78,.4,.73,-.22);outline.quadraticCurveTo(.42,.13,.22,-.45);outline.closePath();
  const wingGeo=new THREE.ShapeGeometry(outline,8),bodyGeo=new THREE.SphereGeometry(1,12,10),eyeGeo=new THREE.SphereGeometry(.065,8,6);
  const body=new THREE.InstancedMesh(bodyGeo,skin,48),head=new THREE.InstancedMesh(bodyGeo,skin,48),horns=new THREE.InstancedMesh(new THREE.ConeGeometry(.075,.36,7),skin,96),left=new THREE.InstancedMesh(wingGeo.clone().scale(-1,1,1),skin,48),right=new THREE.InstancedMesh(wingGeo,skin,48),eyes=new THREE.InstancedMesh(eyeGeo,glow,96),meshes=[body,head,horns,left,right,eyes];
  for(const mesh of meshes){mesh.frustumCulled=false;mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);root.add(mesh);}
  const dummy=new THREE.Object3D(),local=new THREE.Object3D(),base=new THREE.Matrix4(),matrix=new THREE.Matrix4(),records=[];let count=48;
  const put=(mesh,index,p,s,r=[0,0,0])=>{local.position.set(...p);local.scale.set(...s);local.rotation.set(...r);local.updateMatrix();matrix.multiplyMatrices(base,local.matrix);mesh.setMatrixAt(index,matrix);};
  return {root,records,get count(){return count;},quality(light){count=light?24:48;body.count=head.count=left.count=right.count=count;eyes.count=horns.count=count*2;},
    update(siege,rebirth,mask,reduced=false){field.radius.value=holyRadius(rebirth,mask);field.active.value=mask===7?1:0;field.clock.value=reduced?0:siege+(mask===7?rebirth:0);records.length=0;
      for(let j=0;j<count;j++){const index=count===24?j*2:j,p=swarmPose(index,siege,rebirth,mask,reduced),hit=holyContact(p.position,p.scale*1.8,rebirth,mask);records.push({index,position:p.position,cleared:hit.cleared,touched:hit.touched});
        dummy.position.set(...p.position);dummy.rotation.set(-.14,p.yaw,Math.sin(field.clock.value*1.4+index)*.1);dummy.scale.setScalar(hit.cleared?.001:p.scale);dummy.updateMatrix();base.copy(dummy.matrix);
        put(body,j,[0,0,0],[.27,.49,.24]);put(head,j,[0,.43,.08],[.23,.26,.23]);put(left,j,[-.19,.1,-.05],[1,1,1],[0,-p.flap,.08]);put(right,j,[.19,.1,-.05],[1,1,1],[0,p.flap,-.08]);
        for(let side=0;side<2;side++){const sign=side?1:-1;put(eyes,j*2+side,[sign*.115,.46,.28],[1,.45,.6]);put(horns,j*2+side,[sign*.16,.72,.06],[1,1,1],[0,0,-sign*.3]);}
      }for(const mesh of meshes)mesh.instanceMatrix.needsUpdate=true;
    },
  };
}
