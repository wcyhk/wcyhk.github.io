import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const base=existsSync(new URL('../dist/index.html',import.meta.url))?'../dist/':'../';
const THREE=await import(new URL(`${base}assets/vendor/three.module.js`,import.meta.url));
const {createWorldScene}=await import(new URL(`${base}world-scene.mjs`,import.meta.url));
const {createPalaceIsland}=await import(new URL(`${base}world-islands.mjs`,import.meta.url));
const {BEACONS,newJourney,activateBeacon,frameDelta,renderScale,isTap,beaconAnchors,flowLabel,dawnAmount,rebirthState,advanceRebirth,REBIRTH_DURATION,advanceSiege,siegeState,resolveSiege,enemyPose,SIEGE_DURATION,materializationState,sphereHitsIsland,processionalStep,awakeningCameraKeys,holyRadius,holyContact,swarmPose,smootherStep,SHIELD,shieldIntersection,cannonPacket,advanceSpin,realmState}=await import(new URL(`${base}world-model.mjs`,import.meta.url));

test('Floating palace cliffs are closed, outward facing and support the complete courtyard',()=>{
  const island=createPalaceIsland(THREE,new THREE.Group(),{},0),g=island.cliff.geometry,p=g.attributes.position,n=g.attributes.normal;
  assert.ok(n.getX(81)>.5,'The outer cliff face must face the viewer rather than disappear from outside.');
  assert.ok(g.boundingBox.min.y < -3.9 && g.boundingBox.max.y >= -.206);
  const top=[];for(let i=0;i<p.count;i++)if(Math.abs(p.getY(i)+.205)<1e-5)top.push([p.getX(i),p.getZ(i)]);
  for(const [x,z] of [[-4.8,-3.8],[4.8,4.3],[-4.8,4.3],[4.8,-3.8]]){
    let inside=false;for(let i=0,j=79;i<80;j=i++){const a=top[i],b=top[j];if((a[1]>z)!==(b[1]>z)&&x<(b[0]-a[0])*(z-a[1])/(b[1]-a[1])+a[0])inside=!inside;}assert.ok(inside,'Every courtyard corner has a continuous rock crown below it.');
  }
  assert.ok(Array.from(p.array).every(Number.isFinite));
});

test('Island mist follows the independent ambient clock, supports light mode and clears on replay',()=>{
  const w=createWorldScene(THREE,new THREE.PerspectiveCamera(43,.48,.15,160));w.quality(true,1);
  w.reborn.update(0,26,7,20,false,12);w.scene.updateMatrixWorld();
  for(const p of w.reborn.palaces){const i=p.island;assert.equal(i.uniforms.uClock.value,12);assert.equal(i.uniforms.uOpacity.value,1);assert.equal(i.mist.geometry.drawRange.count,54);assert.equal(i.uniforms.uScale.value,p.root.scale.x);}
  const before=w.reborn.palaces.map(p=>p.island.cliff.matrixWorld.toArray());w.reborn.update(0,26,7,20,false,14);w.scene.updateMatrixWorld();w.reborn.palaces.forEach((p,i)=>{assert.equal(p.island.uniforms.uClock.value,14);assert.deepEqual(p.island.cliff.matrixWorld.toArray(),before[i]);});
  w.reborn.update(0,26,7,20,true,20);assert.ok(w.reborn.palaces.every(p=>p.island.uniforms.uClock.value===0));
  w.reborn.update(0,0,0,0,false,25);assert.ok(w.reborn.palaces.every(p=>!p.island.mist.visible&&p.island.uniforms.uOpacity.value===0));w.dispose();
});

test('Only three unique world markers can complete a journey; duplicates cannot skip progress',()=>{
  let state=newJourney();assert.equal(activateBeacon(state,'unknown'),state);
  state=activateBeacon(state,'education');state=activateBeacon(state,'education');assert.equal(state.count,1);assert.equal(state.complete,false);
  state=activateBeacon(state,'creativity');assert.equal(state.count,2);assert.equal(state.complete,false);
  state=activateBeacon(state,'technology');assert.deepEqual(state,{mask:7,count:3,selected:'technology',complete:true});
  assert.equal(activateBeacon(state,'technology').count,3);assert.deepEqual(newJourney(),{mask:0,count:0,selected:null,complete:false});
});

async function loadTestAvatar(){
  const {GLTFLoader}=await import(new URL(`${base}assets/vendor/GLTFLoader.js`,import.meta.url));const {VRMLoaderPlugin}=await import(new URL(`${base}assets/vendor/three-vrm.module.min.js`,import.meta.url));const loader=new GLTFLoader();loader.register(parser=>{parser.loadTexture=()=>Promise.resolve(new THREE.Texture());return {name:'headless-test-textures'};});loader.register(parser=>new VRMLoaderPlugin(parser));const bytes=readFileSync(new URL(`${base}assets/goddess-avatar.vrm`,import.meta.url));return await new Promise((resolve,reject)=>loader.parse(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'',resolve,reject));
}

test('The volumetric goddess requires all beacons and a loaded skinned model, then replays safely',async()=>{
  const w=createWorldScene(THREE,new THREE.PerspectiveCamera()),g=w.reborn.ascension.goddess;let ready=0;g.onReady=()=>ready++;g.update(26,7,10,false);assert.equal(g.root.visible,false);g.setAvatar(await loadTestAvatar());assert.equal(ready,1);assert.equal(g.assetState,'ready');assert.ok(g.avatar.meshes.some(m=>m.isSkinnedMesh));
  for(let mask=0;mask<7;mask++){g.update(26,mask,10,false);assert.equal(g.strength,0);assert.equal(g.root.visible,false);}
  g.update(4.5,7,10,false);assert.equal(g.root.visible,false);g.update(9,7,10,false);assert.equal(g.root.visible,true);assert.equal(g.strength,1);assert.ok(g.avatar.materials.every(x=>x.material.transparent&&!x.material.depthWrite&&x.material.depthTest));assert.equal(g.uniforms.uWind.value,1);
  const size=new THREE.Box3().setFromObject(g.avatar.root).getSize(new THREE.Vector3());assert.ok(size.z>1.5,'The character has substantial true depth.');assert.ok(size.y>5);let planes=0;g.root.traverse(o=>{if(o.isMesh&&o.geometry.type==='PlaneGeometry')planes++;});assert.equal(planes,0,'No portrait billboard remains in the character.');
  g.update(0,0,12,false);assert.equal(g.root.visible,false);assert.equal(g.uniforms.uPower.value,0);w.dispose();
});

test('The goddess stays in the world as the camera orbits, and all animated depth shells match',async()=>{
  const camera=new THREE.PerspectiveCamera(),w=createWorldScene(THREE,camera),g=w.reborn.ascension.goddess;g.setAvatar(await loadTestAvatar());
  for(const [x,z] of [[0,18],[18,0],[0,-18],[-18,0]]){camera.position.set(x,6,z);g.update(26,7,10,false);w.scene.updateMatrixWorld(true);assert.deepEqual(g.root.rotation.toArray().slice(0,3),[0,0,0]);g.avatar.meshes.forEach((m,i)=>{const p=g.avatar.passes[i];assert.deepEqual(m.matrixWorld.toArray(),p.matrixWorld.toArray());if(m.isSkinnedMesh){assert.equal(m.skeleton,p.skeleton);assert.deepEqual(m.bindMatrix.toArray(),p.bindMatrix.toArray());}});}
  g.update(26,7,10.04,false);w.scene.updateMatrixWorld(true);g.avatar.meshes.forEach((m,i)=>assert.deepEqual(m.matrixWorld.toArray(),g.avatar.passes[i].matrixWorld.toArray()));w.dispose();
});

test('The skinned goddess freezes wind in reduced motion and caps mobile particles',async()=>{
  const w=createWorldScene(THREE,new THREE.PerspectiveCamera()),g=w.reborn.ascension.goddess;g.setAvatar(await loadTestAvatar());g.quality(true,1);g.update(26,7,10,true);const position=g.root.position.toArray();g.update(26,7,20,true);assert.deepEqual(g.root.position.toArray(),position);assert.equal(g.uniforms.uClock.value,0);assert.equal(g.uniforms.uWind.value,0);assert.equal(g.particles.geometry.drawRange.count,240);assert.equal(g.ribbons.rotation.y,0);assert.ok(g.avatar.hairBones.length>10);w.dispose();
});

test('Reborn altar has no approach stepping stones while the original night stairway remains',()=>{
  const w=createWorldScene(THREE,new THREE.PerspectiveCamera());w.update(0,1,0,.05,7,26,20);const matrix=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();let steppingStones=0;
  for(const mesh of w.reborn.centreManifest.meshes)if(mesh.isInstancedMesh)for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);matrix.decompose(p,q,s);if(Math.abs(s.x-1.05)<1e-5&&Math.abs(s.y-.018)<1e-5&&Math.abs(s.z-.37)<1e-5)steppingStones++;}
  assert.equal(steppingStones,0);assert.equal(w.stairs.visible,false);w.update(0,0,0,.05,0,0,0);assert.equal(w.stairs.visible,true);assert.equal(w.stairs.children.filter(o=>o.geometry===w.stairs.children[0].geometry).length,19);w.dispose();
});
test('All discovery orders complete consistently and leave previous states immutable',()=>{
  for(const order of [['education','technology','creativity'],['education','creativity','technology'],['technology','education','creativity'],['technology','creativity','education'],['creativity','education','technology'],['creativity','technology','education']]){
    const start=newJourney();let state=start;for(const id of order)state=activateBeacon(state,id);assert.equal(state.count,3);assert.equal(state.complete,true);assert.equal(start.mask,0);
  }
});
test('The void cannot ignite before all three beacons, and replay immediately restores the black hole',()=>{
  for(const mask of [0,1,2,3,4,5,6])assert.equal(dawnAmount(1,mask),0);
  assert.equal(dawnAmount(.5,7),0);assert.ok(dawnAmount(.8,7)>0&&dawnAmount(.8,7)<1);assert.equal(dawnAmount(1,7),1);assert.equal(dawnAmount(2,7),1);assert.equal(dawnAmount(-1,7),0);assert.equal(dawnAmount(1,newJourney().mask),0);
});

test('The restoration requires every beacon, follows a monotonic story clock and resets on replay',()=>{
  for(const mask of [0,1,2,3,4,5,6]){const s=rebirthState(12,mask);assert.equal(s.sun,0);assert.equal(s.palaces,0);assert.equal(s.sanctum,0);assert.equal(s.title,false);assert.equal(advanceRebirth(8,.05,mask),0);}
  let elapsed=0,previous=rebirthState(0,7);
  for(let i=0;i<Math.ceil(REBIRTH_DURATION/.05)+1;i++){elapsed=advanceRebirth(elapsed,.05,7);const next=rebirthState(elapsed,7);for(const k of ['sun','wave','cleanse','palaces','sanctum']){assert.ok(next[k]>=previous[k]&&next[k]<=1);assert.ok(Number.isFinite(next[k]));}previous=next;}
  assert.equal(elapsed,REBIRTH_DURATION);assert.equal(previous.complete,true);assert.equal(previous.palaces,1);assert.equal(previous.sanctum,1);
  assert.equal(rebirthState(.8,7).palaces,0);assert.equal(rebirthState(1,7).title,false);assert.equal(rebirthState(1.5,7).title,true);
  assert.ok(rebirthState(.05,7).sun>0);assert.equal(rebirthState(1.4,7).wave,0);assert.ok(Math.abs(rebirthState(12.2,7).wave-1)<1e-8);
  assert.equal(advanceRebirth(0,.016,7,true),REBIRTH_DURATION);assert.equal(rebirthState(advanceRebirth(12,.05,0),0).sun,0);
});

test('Siege advances only while the scene is being viewed and automatically awakens all missing beacons once',()=>{
  assert.equal(advanceSiege(12,.05,false,false),12);assert.equal(advanceSiege(12,.05,true,true),12);assert.equal(advanceSiege(12,1000,true,false),12.05);
  assert.equal(siegeState(SIEGE_DURATION-.001).imminent,false);assert.equal(siegeState(SIEGE_DURATION).imminent,true);
  for(const original of [newJourney(),activateBeacon(newJourney(),'education'),activateBeacon(activateBeacon(newJourney(),'technology'),'creativity')]){
    assert.equal(resolveSiege(original,31.99).journey,original);const resolved=resolveSiege(original,32);assert.equal(resolved.automatic,true);assert.equal(resolved.journey.mask,7);assert.equal(resolved.journey.count,3);assert.equal(resolveSiege(resolved.journey,32).automatic,false);assert.equal(original.complete,false);
  }
  let manual=newJourney();for(const b of BEACONS)manual=activateBeacon(manual,b.id);assert.equal(resolveSiege(manual,32).journey,manual);assert.equal(resolveSiege(manual,32).automatic,false);
  assert.equal(advanceSiege(0,.05,false,false),0);assert.equal(resolveSiege(newJourney(),0).automatic,false);
});

test('All three enemies advance towards the altar and remain in place before wave contact',()=>{
  for(let i=0;i<3;i++){
    const a=enemyPose(i,0,0,0),b=enemyPose(i,32,0,0),r=enemyPose(i,32,.6,7);
    assert.ok(Math.hypot(b.position[0],b.position[2])<Math.hypot(a.position[0],a.position[2]));assert.ok(Math.hypot(b.position[0],b.position[2])>6.8);
    assert.ok(Math.abs(Math.hypot(r.position[0],r.position[2])-Math.hypot(b.position[0],b.position[2]))<1e-8);assert.deepEqual(enemyPose(i,32,0,0,true).position,enemyPose(i,0,0,0,true).position);
  }
  const world=createWorldScene(THREE,new THREE.PerspectiveCamera());
  for(const [siege,rebirth,mask] of [[0,0,0],[16,0,1],[31.9,0,3],[32,.02,7],[32,.3,7],[32,.65,7],[32,4,7],[32,7,7],[32,12,7],[0,0,0]]){
    world.update(0,1,0,.016,mask,rebirth,siege);world.scene.updateMatrixWorld();world.scene.traverse(o=>{assert.ok([...o.matrixWorld.elements].every(Number.isFinite),o.name);});
  }
  world.update(0,1,0,.016,7,12,32);for(const piece of world.reborn.repairPieces){assert.ok(Math.abs(piece.position.x)<1e-8);assert.equal(piece.position.y,-.4425);assert.equal(piece.position.z,-.1);}world.dispose();
});

test('Architecture manifests at fixed transforms with a depth prepass, then becomes solid',()=>{
  for(const mask of [0,1,3,6])assert.equal(materializationState(12,0,mask).opacity,0);
  const world=createWorldScene(THREE,new THREE.PerspectiveCamera(43,1.2,.15,160));
  world.update(0,1,0,.05,7,2,20);world.scene.updateMatrixWorld();
  const manifests=[...world.reborn.palaces.map(p=>p.manifest),world.reborn.centreManifest,world.reborn.floorManifest];
  manifests.forEach(m=>m.update(.5,2));const snapshots=manifests.map(m=>m.meshes.map(o=>o.matrixWorld.toArray()));
  for(const m of manifests){assert.ok(m.materials.every(x=>x.opacity>0&&x.opacity<1));assert.ok(m.passes.every(x=>x.visible&&x.material.colorWrite===false));assert.ok(m.materials.every(x=>x.depthFunc===THREE.EqualDepth));}
  for(const elapsed of [4,6,9,26]){world.update(elapsed,1,0,.05,7,elapsed,20);world.scene.updateMatrixWorld();manifests.forEach((m,i)=>m.meshes.forEach((o,j)=>{assert.deepEqual(o.matrixWorld.toArray(),snapshots[i][j]);assert.deepEqual(m.passes[j].matrixWorld.toArray(),o.matrixWorld.toArray(),'The depth shell must exactly match every materialized mesh.');}));}
  for(const m of manifests){assert.ok(m.passes.every(x=>!x.visible));assert.ok(m.materials.every(x=>x.opacity===1&&x.depthWrite));}
  world.update(0,0,0,.05,0,0,0);assert.ok(world.reborn.palaces.every(p=>p.manifest.materials.every(m=>m.opacity===0)));world.dispose();
});

test('Actual articulated enemy contacts shatter islands once, across desktop and phone layouts, and replay restores them',()=>{
  assert.equal(sphereHitsIsland([0,8,0],1,{x:0,y:0,z:0,radius:3,depth:2}),false);
  assert.equal(sphereHitsIsland([3.2,.1,0],.3,{x:0,y:0,z:0,radius:3,depth:2}),true);
  for(const aspect of [1.2,.48]){const world=createWorldScene(THREE,new THREE.PerspectiveCamera(43,aspect,.15,160));world.update(0,0,0,.05,0,0,0);assert.equal(world.destruction.records.filter(r=>r.shattered).length,0);
    let firstDefence=null;for(let i=1;i<=640;i++){world.update(i*.0325,0,0,.05,0,0,i*.05);if(world.destruction.altarThreat&&firstDefence===null)firstDefence=i*.05;}
    const hits=world.destruction.records.filter(r=>r.shattered);assert.deepEqual([...new Set(hits.map(r=>r.hitBy))].sort(),[0,1,2]);assert.ok(firstDefence>15&&firstDefence<=32);for(const hit of hits){assert.equal(hit.group.visible,false);assert.equal(hit.fragments.visible,true);}
    world.update(0,1,0,.05,7,12,32);for(const hit of hits){assert.equal(hit.group.visible,false);assert.equal(hit.fragments.visible,false);}assert.ok(world.reborn.palaces.every(p=>p.manifest.materials.every(m=>m.opacity===1)));
    world.update(0,0,0,.05,0,0,0);assert.ok(world.destruction.records.every(r=>!r.shattered&&r.hitAt===null&&r.group.visible));world.dispose();
  }
});

test('Sculpted enemies have separate facial features, claws, curved wing webs and opaque skin; the accretion disk clears the ground',()=>{
  const world=createWorldScene(THREE,new THREE.PerspectiveCamera());world.update(0,0,0,.05,0,0,0);world.scene.updateMatrixWorld();
  world.reborn.ancients.actors.forEach((a,i)=>{assert.ok(a.features.eyes>=2&&a.features.claws>=10);if(i>0)assert.ok(a.features.wingWebs>=8);a.group.traverse(o=>{if(o.material?.isMeshStandardMaterial){assert.equal(o.material.transparent,false);assert.equal(o.material.depthWrite,true);}});});
  const disk=world.gate.children.find(m=>m.geometry?.parameters?.outerRadius===3.8);assert.ok(disk);assert.ok(new THREE.Box3().setFromObject(disk).min.y>.4);world.dispose();
});

test('All three sculpted face centres fit the initial desktop and portrait compositions',()=>{
  for(const [aspect,fov,position] of [[980/812,43,[1.5,6.9,18]],[375/810,48,[0,7.4,26]]]){
    const camera=new THREE.PerspectiveCamera(fov,aspect,.15,160);camera.position.set(...position);camera.lookAt(0,1.2,-1.8);camera.updateMatrixWorld();const world=createWorldScene(THREE,camera);world.update(0,0,0,.05,0,0,0);world.scene.updateMatrixWorld();
    const blockers=[world.scene.children.find(o=>o.geometry?.parameters?.radius===5.7),world.gate.children.find(o=>o.geometry?.parameters?.radius===2.55)],ray=new THREE.Raycaster();
    for(const siege of [0,12,20,26]){world.update(siege*.65,0,0,.05,0,0,siege);world.scene.updateMatrixWorld();for(const actor of world.reborn.ancients.actors){const worldFace=actor.head.getWorldPosition(new THREE.Vector3()),face=worldFace.clone().project(camera);assert.ok(Math.abs(face.x)<.95&&Math.abs(face.y)<.95,`${actor.group.name}: ${face.toArray()}`);ray.setFromCamera(new THREE.Vector2(face.x,face.y),camera);const blocker=ray.intersectObjects(blockers,false)[0];assert.ok(!blocker||blocker.distance>camera.position.distanceTo(worldFace),`${actor.group.name} face must not be hidden by the moon or gate during approach at ${siege}s.`);}}world.dispose();
  }
});

test('Actual monsters, palaces and central restoration switch correctly, with finite instanced transforms',()=>{
  const camera=new THREE.PerspectiveCamera(43,.48,.15,160),world=createWorldScene(THREE,camera),r=world.reborn;
  assert.equal(r.watchers.length,3);assert.equal(r.palaces.length,3);
  for(const [mask,elapsed] of [[0,12],[3,12],[7,0],[7,4],[7,7],[7,12],[0,0]]){
    const s=world.update(0,1,0,.05,mask,elapsed);assert.equal(r.darkness.visible,s.cleanse<1);assert.equal(r.heavens.visible,s.palaces>0);assert.equal(r.sanctum.visible,s.sanctum>0);
    world.scene.traverse(o=>{if(o.isInstancedMesh)assert.ok([...o.instanceMatrix.array].every(Number.isFinite));});
    for(const p of r.palaces)assert.ok(p.root.scale.x>0);
  }
  assert.equal(r.darkness.visible,true);assert.equal(r.heavens.visible,false);assert.equal(r.sanctum.visible,false);
  const geometries=new Set(),materials=new Set();world.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);if(o.material)materials.add(o.material);});
  let disposed=0;geometries.forEach(g=>g.addEventListener('dispose',()=>disposed++));world.dispose();assert.equal(disposed,geometries.size);
});
test('Hidden-tab gaps and clock anomalies cannot cause an animation jump',()=>{assert.equal(frameDelta(10000),.05);assert.equal(frameDelta(-30),0);assert.equal(frameDelta(NaN),0);assert.equal(frameDelta(16),.016);assert.equal(flowLabel(0),'星流凝止');assert.equal(flowLabel(-.5),'星流逆行');});
test('Framebuffer resolution is capped for high DPI and very large viewports',()=>{for(const [w,h,dpr] of [[390,810,3],[1440,900,2],[3840,2160,3]]){const scale=renderScale(w,h,dpr);assert.ok(w*h*scale*scale<=1900001);assert.ok(scale<=1.45);}assert.equal(renderScale(390,810,3,true),1);});
test('Drag releases do not activate a marker; small taps remain accessible',()=>{assert.equal(isTap(null,{x:0,y:0}),false);assert.equal(isTap({x:10,y:10},{x:14,y:13}),true);assert.equal(isTap({x:10,y:10},{x:40,y:35}),false);});
test('Screen markers keep usable hit positions when multiple world coordinates align',()=>{
  const anchors=beaconAnchors([{x:0,y:0,z:.3},{x:0,y:0,z:.3},{x:4,y:-4,z:2}],390,810);assert.notEqual(anchors[0].y,anchors[1].y);assert.equal(anchors[2].visible,false);for(const a of anchors){assert.ok(a.x>=60&&a.x<=330);assert.ok(a.y>=205&&a.y<=620);}
});
test('The actual procedural scene has valid geometry and all three raycast targets',()=>{
  const world=createWorldScene(THREE,new THREE.PerspectiveCamera());assert.equal(world.beacons.length,3);assert.deepEqual(world.pickTargets.map(m=>m.userData.beaconId),BEACONS.map(b=>b.id));
  for(const [time,mask] of [[-120,0],[0,1],[10000,7]]){world.update(time,mask===7?1:0,.4,.016,mask);world.scene.updateMatrixWorld();world.scene.traverse(o=>{
    assert.ok(o.position.toArray().every(Number.isFinite));if(o.geometry){const p=o.geometry.getAttribute('position');assert.ok([...p.array].every(Number.isFinite));if(o.geometry.index)assert.ok([...o.geometry.index.array].every(i=>i<p.count));if(o.material?.normalMap){const uv=o.geometry.getAttribute('uv');assert.ok(uv,`${o.type} with a normal map needs UV coordinates`);assert.equal(uv.count,p.count);assert.ok([...uv.array].every(Number.isFinite));}}
  });}
  world.quality(true,1);world.dispose();
});
test('All three physical beacons are in view and raycastable on initial desktop and mobile cameras',()=>{
  for(const [aspect,position] of [[1440/812,[1.5,6.9,18]],[375/810,[1,7.4,24]]]){
    const camera=new THREE.PerspectiveCamera(43,aspect,.15,160);camera.position.set(...position);camera.lookAt(0,1.2,-1.8);camera.updateMatrixWorld();
    const world=createWorldScene(THREE,camera);world.scene.updateMatrixWorld();const ray=new THREE.Raycaster();
    for(const target of world.pickTargets){const point=target.getWorldPosition(new THREE.Vector3()).project(camera);assert.ok(Math.abs(point.x)<1&&Math.abs(point.y)<1&&point.z<1);ray.setFromCamera(new THREE.Vector2(point.x,point.y),camera);assert.ok(ray.intersectObjects(world.pickTargets,false).some(hit=>hit.object===target));}
    world.dispose();
  }
});
test('World title and accessible biography are readable without executing WebGL',()=>{
  const html=readFileSync(new URL(`${base}index.html`,import.meta.url),'utf8');assert.ok(html.includes('世界的盡頭'));assert.ok(!html.includes('時間的盡頭'));assert.ok(html.includes('id="studio-profile"'));assert.ok(html.includes('專業資格與學歷'));assert.ok(html.includes('STEM 陀螺'));
  for(const b of BEACONS)assert.ok(html.includes(`aria-label="喚醒${b.name}界標"`));assert.ok(html.includes('role="status" aria-live="polite"'));assert.ok(!html.includes('ANSON WONG'));
});


test('The shared processional path clears every beacon foundation in both worlds',()=>{
  for(let i=0;i<19;i++){const p=processionalStep(i);for(const b of BEACONS){const dx=Math.max(0,Math.abs(p.x-b.position[0])-.55),dz=Math.max(0,Math.abs(p.z-b.position[2])-.24);assert.ok(Math.hypot(dx,dz)>.75,`Step ${i} intersects ${b.id}`);}}
  const world=createWorldScene(THREE,new THREE.PerspectiveCamera());const blocks=world.stairs.children.filter(o=>o.geometry===world.stairs.children[0].geometry);assert.equal(blocks.length,19);blocks.forEach((o,i)=>{const p=processionalStep(i);assert.equal(o.position.x,p.x);assert.equal(o.position.z,p.z);});world.dispose();
});

test('Awakening pulls out for the siege, waits until all enemies clear, then returns to the reference framing',()=>{
  for(const phone of [false,true]){const start=phone?[0,7.4,26]:[1.5,6.9,18],keys=awakeningCameraKeys(start,[0,1.2,-1.8],phone),distance=k=>Math.hypot(...k.position.map((v,i)=>v-k.target[i]));assert.deepEqual(keys[0].position,start);assert.ok(distance(keys[1])>distance(keys[0]));assert.deepEqual(keys[1].position,keys[2].position);assert.ok(keys[2].at>=14);assert.ok(distance(keys[3])<distance(keys[2]));assert.deepEqual(keys[3].position,phone?[0,7,26]:[.6,6.4,18.5]);assert.equal(keys[3].at,REBIRTH_DURATION);for(let i=1;i<keys.length;i++){assert.ok(keys[i].at>keys[i-1].at);assert.ok(distance(keys[i])<40);}}
});

test('The dragon reaches the front line before either layout triggers the altar guard',()=>{
  for(const aspect of [1.2,.48]){const world=createWorldScene(THREE,new THREE.PerspectiveCamera(43,aspect,.15,160));let guard=null;for(let t=0;t<=32;t+=.05){world.update(t*.65,0,0,.05,0,0,t);if(world.destruction.altarThreat){guard=t;break;}}
    assert.ok(guard>15);const dragon=enemyPose(2,guard,0,0),elder=enemyPose(0,guard,0,0);assert.ok(Math.hypot(dragon.position[0],dragon.position[2])<=Math.hypot(elder.position[0],elder.position[2])+1);assert.ok(dragon.position[2]>-7);assert.deepEqual([...new Set(world.destruction.records.filter(r=>r.shattered).map(r=>r.hitBy))].sort(),[0,1,2]);world.dispose();
  }
});


test('Holy light reaches near enemies before distant ones; no enemy clears before radial contact',()=>{
  assert.equal(holyRadius(1.4,7),0);assert.equal(holyRadius(5,0),0);assert.equal(holyContact([10,3.9,-3.2],1,2,7).touched,false);
  assert.equal(holyContact([10,3.9,-3.2],1,3.4,7).touched,true);assert.equal(holyContact([30,3.9,-3.2],1,3.4,7).touched,false);
  for(let t=0;t<=26;t+=.1){for(const d of [8,15,30,40]){const hit=holyContact([d,3.9,-3.2],1,t,7);if(hit.cleared)assert.ok(holyRadius(t,7)>=d+1);}}
  const w=createWorldScene(THREE,new THREE.PerspectiveCamera());w.update(0,1,0,.05,7,1,0);assert.equal(w.reborn.ancients.actors.filter(a=>a.group.visible).length,3);w.update(0,1,0,.05,7,26,0);assert.equal(w.reborn.ancients.actors.filter(a=>a.group.visible).length,0);assert.ok(w.reborn.swarm.records.every(r=>r.cleared));w.update(0,0,0,.05,0,0,0);assert.equal(w.reborn.ancients.actors.filter(a=>a.group.visible).length,3);assert.equal(w.reborn.swarm.records.filter(r=>!r.cleared).length,48);w.dispose();
});

test('Flying fiends cover all eight directions even in light mode, advance without entering the altar, and animate wings',()=>{
  const w=createWorldScene(THREE,new THREE.PerspectiveCamera());for(const light of [false,true]){w.quality(light,1);w.update(0,0,0,.05,0,0,0);assert.equal(w.reborn.swarm.records.length,light?24:48);const sectors=new Set(w.reborn.swarm.records.map(r=>Math.floor((Math.atan2(r.position[2],r.position[0])+Math.PI)/(Math.PI/4))%8));assert.equal(sectors.size,8);
    for(const r of w.reborn.swarm.records){const a=swarmPose(r.index,0,0,0),b=swarmPose(r.index,32,0,0);assert.ok(Math.hypot(b.position[0],b.position[2])<Math.hypot(a.position[0],a.position[2]));assert.ok(Math.hypot(b.position[0],b.position[2])>8.7);assert.notEqual(swarmPose(r.index,2,0,0).flap,swarmPose(r.index,3,0,0).flap);}}
  w.dispose();
});

test('Camera interpolation has zero endpoint velocity and acceleration for a smooth hold and pullback',()=>{
  const h=.0001;assert.equal(smootherStep(0),0);assert.equal(smootherStep(1),1);assert.ok(smootherStep(h)/h<.00001);assert.ok((1-smootherStep(1-h))/h<.00001);for(let i=0;i<=100;i++)assert.ok(smootherStep(i/100)>=0&&smootherStep(i/100)<=1);
});


test('Every palace is fully solid before the eye-level hold ends, including immediate activation',()=>{
  for(const aspect of [1.2,.48])for(const siege of [0,19,26]){const w=createWorldScene(THREE,new THREE.PerspectiveCamera(43,aspect,.15,160));w.update(0,1,0,.05,7,11,siege);assert.ok(w.reborn.palaces.every(p=>p.manifest.materials.every(m=>m.opacity===1&&m.depthWrite)));w.dispose();}
});

test('The detailed swarm stays outside the complete outbound and return camera corridor',()=>{
  for(const siege of [0,19,26])for(const phone of [false,true]){const keys=awakeningCameraKeys(phone?[0,7.4,26]:[1.5,6.9,18],[0,1.2,-1.8],phone);for(let t=0;t<=26;t+=.25){const end=keys.findIndex((k,i)=>i>0&&t<=k.at),b=keys[end],a=keys[end-1],blend=smootherStep((t-a.at)/(b.at-a.at)),camera=a.position.map((v,i)=>v+(b.position[i]-v)*blend);for(let i=0;i<48;i++){const p=swarmPose(i,siege,t,7);if(!holyContact(p.position,p.scale*2.7,t,7).cleared)assert.ok(Math.hypot(...p.position.map((v,k)=>v-camera[k]))>6);}}}
});

test('Fiends have sculpted faces, fangs, separate curved wings, claws and three attack roles',()=>{
  const w=createWorldScene(THREE,new THREE.PerspectiveCamera()),swarm=w.reborn.swarm;assert.deepEqual(swarm.features,{eyes:2,fangs:12,claws:14,wingWebs:8});assert.ok(swarm.root.children.find(m=>m.name==='Sculpted fiend face').geometry.attributes.position.count>700);assert.ok(swarm.root.children.find(m=>m.name==='Left ribbed wing').geometry.attributes.position.count>1000);
  assert.deepEqual([...new Set(Array.from({length:48},(_,i)=>swarmPose(i,3,0,0).mode))].sort(),[0,1,2]);w.update(0,0,0,.05,0,0,3);assert.ok(swarm.cannonCount>0);w.dispose();
});

test('Golden surface fragments require light contact, finish fading, and reset without lingering; body rune effects are absent',()=>{
  const w=createWorldScene(THREE,new THREE.PerspectiveCamera()),swarm=w.reborn.swarm;w.update(0,0,0,.05,0,0,10);assert.equal(swarm.activeSparks,0);assert.equal(swarm.sparks.visible,false);let peak=0;for(let t=0;t<=16;t+=.2){w.update(t,1,0,.05,7,t,10);peak=Math.max(peak,swarm.activeSparks);}assert.ok(peak>100);assert.equal(swarm.activeSparks,0);w.quality(true,1);w.update(16,1,0,.05,7,16,10);assert.equal(swarm.activeSparks,0);w.update(0,0,0,.05,0,0,0);assert.equal(swarm.activeSparks,0);assert.equal(swarm.sparks.visible,false);w.update(0,1,0,.05,7,26,0,true);assert.equal(swarm.activeSparks,0);
  const creatures=readFileSync(new URL(`${base}world-creatures.mjs`,import.meta.url),'utf8'),skin=readFileSync(new URL(`${base}world-spells.mjs`,import.meta.url),'utf8');assert.ok(!creatures.includes('runeMaterial')&&!creatures.includes('const sigil='));assert.ok(!skin.includes('spellScan'));w.dispose();
});


test('Energy cannon packets stop exactly on the ellipsoidal shield, from every firing direction',()=>{
  const level=p=>p.reduce((sum,v,i)=>sum+((v-SHIELD.center[i])/SHIELD.radii[i])**2,0);
  assert.equal(shieldIntersection(SHIELD.center,[0,2,0]),null);
  for(let i=0;i<48;i++)if(i%3!==0)for(const k of [0,1])for(const clock of [4,10,19,27]){const p=cannonPacket(i,k,clock);assert.ok(p);assert.ok(Math.abs(level(p.hit.point)-1)<1e-9);assert.ok(p.hit.point[1]>=SHIELD.center[1]);assert.ok(Math.abs(Math.hypot(...p.hit.normal)-1)<1e-10);assert.ok(level(p.front)>=1-1e-8);assert.ok(p.beamLength<=3.4);}
});

test('The transparent shield latches each hit once, renders finite effects, fades and resets',()=>{
  const w=createWorldScene(THREE,new THREE.PerspectiveCamera()),shield=w.reborn.swarm.shield,hit=shieldIntersection([20,4,0],[0,2,0]);shield.begin(10,false);shield.hit(1,4,hit,10);shield.hit(1,4,hit,10);shield.update(0,0);assert.equal(shield.totalHits,1);assert.equal(shield.activeImpacts,1);assert.ok(shield.dome.material.transparent&&!shield.dome.material.depthWrite);shield.begin(12,false);shield.update(0,0);assert.equal(shield.activeImpacts,0);shield.begin(0,false);shield.update(0,0);assert.equal(shield.totalHits,0);assert.equal(shield.activeImpacts,0);w.dispose();
});

test('Actual cannon fire hits the shield in both quality modes, and replay clears all shield events',()=>{
  for(const light of [false,true]){const w=createWorldScene(THREE,new THREE.PerspectiveCamera());w.quality(light,1);let maximum=0;for(let t=0;t<=10;t+=.1){w.update(0,0,0,.05,0,0,t,false,t);maximum=Math.max(maximum,w.reborn.swarm.shield.activeImpacts);}assert.ok(w.reborn.swarm.shield.totalHits>10);assert.ok(maximum>0&&maximum<=(light?8:16));assert.ok(w.reborn.swarm.missiles.isInstancedMesh&&w.reborn.swarm.missiles.geometry.type==='CylinderGeometry');w.update(0,0,0,.05,0,0,0);assert.equal(w.reborn.swarm.shield.totalHits,0);w.dispose();}
});

test('Core and accretion disk keep rotating with a paused star-flow clock in darkness and sunlight',()=>{
  assert.equal(advanceSpin(4,.05),4.05);assert.equal(advanceSpin(4,50),4.05);assert.equal(advanceSpin(4,.05,true),4);
  const w=createWorldScene(THREE,new THREE.PerspectiveCamera());for(const mask of [0,7]){w.update(0,mask===7?1:0,0,.05,mask,26,10,false,4);const a=w.starCore.rotation.y,d=w.disk.rotation.z;w.update(0,mask===7?1:0,0,.05,mask,26,10,false,5);assert.ok(w.starCore.rotation.y>a);assert.ok(w.disk.rotation.z>d);assert.equal(w.starCore.material.uniforms.uTime.value,0);}w.dispose();
});


test('The completed realm removes fractured terrain, restores full castles and reverts cleanly on replay',()=>{
  const w=createWorldScene(THREE,new THREE.PerspectiveCamera(43,1.2,.15,160));w.update(0,1,0,.05,3,26,10);assert.deepEqual(realmState(26,3),{repair:0,ritual:0,clouds:0});assert.equal(w.mainIsland.visible,true);assert.equal(w.reborn.ascension.root.visible,false);
  w.update(0,1,0,.05,7,26,10);assert.deepEqual(realmState(26,7),{repair:1,ritual:1,clouds:1});assert.equal(w.mainIsland.visible,false);assert.ok(w.destruction.records.every(r=>!r.group.visible&&!r.fragments.visible));assert.equal(w.reborn.ascension.progress,1);assert.equal(w.sea.material.uniforms.uRealm.value,1);assert.ok(w.reborn.palaces.every(p=>p.root.userData.completeCastle&&p.root.scale.x>1.2&&p.manifest.materials.every(m=>m.opacity===1)));
  w.update(0,0,0,.05,0,0,0);assert.equal(w.mainIsland.visible,true);assert.ok(w.destruction.records.every(r=>r.group.visible));assert.equal(w.sea.material.uniforms.uRealm.value,0);assert.equal(w.reborn.ascension.root.visible,false);w.dispose();
});

test('Royal bridges remain fixed while revealing and every depth pass follows its actual mesh',()=>{
  const w=createWorldScene(THREE,new THREE.PerspectiveCamera(43,1.2,.15,160));w.update(0,1,0,.05,7,2,20);w.scene.updateMatrixWorld();const bridges=w.reborn.ascension.bridges,snapshots=bridges.map(b=>b.group.matrixWorld.toArray());assert.equal(bridges.length,3);
  for(const t of [4,8,11,26]){w.update(t,1,0,.05,7,t,20);w.scene.updateMatrixWorld();bridges.forEach((b,i)=>{assert.deepEqual(b.group.matrixWorld.toArray(),snapshots[i]);b.manifestation.meshes.forEach((m,k)=>assert.deepEqual(m.matrixWorld.toArray(),b.manifestation.passes[k].matrixWorld.toArray()));});}
  assert.ok(bridges.every(b=>b.manifestation.materials.every(m=>m.opacity===1&&m.depthWrite)));w.dispose();
});

test('Summoning ornaments clear the three beacon bases and remain inside the restored platform',()=>{
  const w=createWorldScene(THREE,new THREE.PerspectiveCamera());w.update(0,1,0,.05,7,26,20);w.scene.updateMatrixWorld();for(const gem of w.reborn.ascension.gems){const p=gem.getWorldPosition(new THREE.Vector3());assert.ok(Math.hypot(p.x,p.z+.1)<5.0);for(const beacon of BEACONS)assert.ok(Math.hypot(p.x-beacon.position[0],p.z-beacon.position[2])>1.1);}assert.ok(w.reborn.ascension.mandala.position.y>-.41);w.dispose();
});

test('Enlarged castles clear the background moon in desktop and portrait layouts',()=>{
  for(const aspect of [1.2,.48]){const w=createWorldScene(THREE,new THREE.PerspectiveCamera(43,aspect,.15,160));w.update(0,1,0,.05,7,26,20);w.scene.updateMatrixWorld();const moon=w.scene.children.find(o=>o.geometry?.parameters?.radius===5.7),point=moon.getWorldPosition(new THREE.Vector3());for(const p of w.reborn.palaces){const bounds=new THREE.Box3().setFromObject(p.root),nearest=bounds.clampPoint(point,new THREE.Vector3());assert.ok(nearest.distanceTo(point)>5.7);}w.dispose();}
});


test('Summoning light layers render after the solid transparent-list floor while retaining depth testing',()=>{
  const w=createWorldScene(THREE,new THREE.PerspectiveCamera());w.update(0,1,0,.05,7,26,20);const floorOrder=Math.max(...w.reborn.floorManifest.meshes.map(m=>m.renderOrder));w.reborn.ascension.root.traverse(o=>{if(o.isMesh||o.isLine||o.isPoints){assert.ok(o.renderOrder>floorOrder);assert.equal(o.material.depthTest,true);}});w.dispose();
});
