import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const base=existsSync(new URL('../dist/index.html',import.meta.url))?'../dist/':'../';
const THREE=await import(new URL(`${base}assets/vendor/three.module.js`,import.meta.url));
const {createWorldScene}=await import(new URL(`${base}world-scene.mjs`,import.meta.url));
const {BEACONS,newJourney,activateBeacon,frameDelta,renderScale,isTap,beaconAnchors,flowLabel,dawnAmount,rebirthState,advanceRebirth,REBIRTH_DURATION}=await import(new URL(`${base}world-model.mjs`,import.meta.url));

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
  assert.equal(rebirthState(2,7).palaces,0);assert.equal(rebirthState(5,7).title,false);assert.equal(rebirthState(6,7).title,true);
  assert.equal(advanceRebirth(0,.016,7,true),12);assert.equal(rebirthState(advanceRebirth(12,.05,0),0).sun,0);
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
