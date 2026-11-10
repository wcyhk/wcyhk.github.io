import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const base=existsSync(new URL('../dist/index.html',import.meta.url))?'../dist/':'../';
const THREE=await import(new URL(`${base}assets/vendor/three.module.js`,import.meta.url));
const {createWorldScene}=await import(new URL(`${base}world-scene.mjs`,import.meta.url));
const {BEACONS,newJourney,activateBeacon,frameDelta,renderScale,isTap,beaconAnchors,flowLabel,dawnAmount,rebirthState,advanceRebirth,REBIRTH_DURATION,advanceSiege,siegeState,resolveSiege,enemyPose,SIEGE_DURATION,materializationState,sphereHitsIsland}=await import(new URL(`${base}world-model.mjs`,import.meta.url));

test('Only three unique world markers can complete a journey; duplicates cannot skip progress',()=>{
  let state=newJourney();assert.equal(activateBeacon(state,'unknown'),state);
  state=activateBeacon(state,'education');state=activateBeacon(state,'education');assert.equal(state.count,1);assert.equal(state.complete,false);
  state=activateBeacon(state,'creativity');assert.equal(state.count,2);assert.equal(state.complete,false);
  state=activateBeacon(state,'technology');assert.deepEqual(state,{mask:7,count:3,selected:'technology',complete:true});
  assert.equal(activateBeacon(state,'technology').count,3);assert.deepEqual(newJourney(),{mask:0,count:0,selected:null,complete:false});
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
  for(let i=0;i<241;i++){elapsed=advanceRebirth(elapsed,.05,7);const next=rebirthState(elapsed,7);for(const k of ['sun','wave','cleanse','palaces','sanctum']){assert.ok(next[k]>=previous[k]&&next[k]<=1);assert.ok(Number.isFinite(next[k]));}previous=next;}
  assert.equal(elapsed,REBIRTH_DURATION);assert.equal(previous.complete,true);assert.equal(previous.palaces,1);assert.equal(previous.sanctum,1);
  assert.equal(rebirthState(.8,7).palaces,0);assert.equal(rebirthState(1,7).title,false);assert.equal(rebirthState(1.5,7).title,true);
  assert.ok(rebirthState(.05,7).sun>0);assert.ok(rebirthState(.05,7).cleanse>0);assert.equal(rebirthState(.65,7).cleanse,1);assert.equal(rebirthState(1.15,7).wave,1);
  assert.equal(advanceRebirth(0,.016,7,true),12);assert.equal(rebirthState(advanceRebirth(12,.05,0),0).sun,0);
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

test('All three enemies advance towards the altar and recoil from light',()=>{
  for(let i=0;i<3;i++){
    const a=enemyPose(i,0,0,0),b=enemyPose(i,32,0,0),r=enemyPose(i,32,.6,7);
    assert.ok(Math.hypot(b.position[0],b.position[2])<Math.hypot(a.position[0],a.position[2]));assert.ok(Math.hypot(b.position[0],b.position[2])>6.8);
    assert.ok(Math.hypot(r.position[0],r.position[2])>Math.hypot(b.position[0],b.position[2]));assert.deepEqual(enemyPose(i,32,0,0,true).position,enemyPose(i,0,0,0,true).position);
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
  const snapshots=manifests.map(m=>m.meshes.map(o=>o.matrixWorld.toArray()));
  for(const m of manifests){assert.ok(m.materials.every(x=>x.opacity>0&&x.opacity<1));assert.ok(m.passes.every(x=>x.visible&&x.material.colorWrite===false));assert.ok(m.materials.every(x=>x.depthFunc===THREE.EqualDepth));}
  for(const elapsed of [4,6,9,12]){world.update(elapsed,1,0,.05,7,elapsed,20);world.scene.updateMatrixWorld();manifests.forEach((m,i)=>m.meshes.forEach((o,j)=>{assert.deepEqual(o.matrixWorld.toArray(),snapshots[i][j]);assert.deepEqual(m.passes[j].matrixWorld.toArray(),o.matrixWorld.toArray(),'The depth shell must exactly match every materialized mesh.');}));}
  for(const m of manifests){assert.ok(m.passes.every(x=>!x.visible));assert.ok(m.materials.every(x=>x.opacity===1&&x.depthWrite));}
  world.update(0,0,0,.05,0,0,0);assert.ok(world.reborn.palaces.every(p=>p.manifest.materials.every(m=>m.opacity===0)));world.dispose();
});

test('Actual articulated enemy contacts shatter islands once, across desktop and phone layouts, and replay restores them',()=>{
  assert.equal(sphereHitsIsland([0,8,0],1,{x:0,y:0,z:0,radius:3,depth:2}),false);
  assert.equal(sphereHitsIsland([3.2,.1,0],.3,{x:0,y:0,z:0,radius:3,depth:2}),true);
  for(const aspect of [1.2,.48]){const world=createWorldScene(THREE,new THREE.PerspectiveCamera(43,aspect,.15,160));world.update(0,0,0,.05,0,0,0);assert.equal(world.destruction.records.filter(r=>r.shattered).length,0);
    let firstDefence=null;for(let i=1;i<=640;i++){world.update(i*.0325,0,0,.05,0,0,i*.05);if(world.destruction.altarThreat&&firstDefence===null)firstDefence=i*.05;}
    const hits=world.destruction.records.filter(r=>r.shattered);assert.deepEqual([...new Set(hits.map(r=>r.hitBy))].sort(),[0,1,2]);assert.ok(firstDefence>15&&firstDefence<=32);for(const hit of hits){assert.equal(hit.group.visible,false);assert.equal(hit.fragments.visible,true);}
    world.update(0,1,0,.05,7,12,32);for(const hit of hits){assert.equal(hit.group.visible,true);assert.equal(hit.fragments.visible,false);}
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
    for(const actor of world.reborn.ancients.actors){const worldFace=actor.head.getWorldPosition(new THREE.Vector3()),face=worldFace.clone().project(camera);assert.ok(Math.abs(face.x)<.95&&Math.abs(face.y)<.95,`${actor.group.name}: ${face.toArray()}`);ray.setFromCamera(new THREE.Vector2(face.x,face.y),camera);const blocker=ray.intersectObjects(blockers,false)[0];assert.ok(!blocker||blocker.distance>camera.position.distanceTo(worldFace),`${actor.group.name} face must not be hidden by the moon or gate on arrival.`);}world.dispose();
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
