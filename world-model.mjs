export const BEACONS = Object.freeze([
  Object.freeze({id:'education',name:'教育',english:'EDUCATION',color:0xffcc84,position:[-3.8,.75,1.0],message:'教育｜把學習目標，變成親手探索的旅程。'}),
  Object.freeze({id:'technology',name:'科技',english:'TECHNOLOGY',color:0x8ae5ef,position:[3.55,.9,-.9],message:'科技｜以程式與 AI，為真實需要開闢新路。'}),
  Object.freeze({id:'creativity',name:'創作',english:'CREATIVITY',color:0xd9b2ff,position:[.5,.65,3.8],message:'創作｜讓腦海裏的世界，成為可以走進的作品。'}),
]);
export const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
export const cosmicSpread=aspect=>Math.min(1,Math.max(.60,aspect));
export function seededRandom(seed=2026){return()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};}
export function newJourney(){return {mask:0,count:0,selected:null,complete:false};}
export function activateBeacon(state,id){
  const index=BEACONS.findIndex(b=>b.id===id);
  if(index<0)return state;
  const mask=state.mask|(1<<index);
  return {mask,count:BEACONS.reduce((n,_,i)=>n+((mask>>i)&1),0),selected:id,complete:mask===7};
}
export function renderScale(w,h,dpr=1,light=false){return Math.min(Math.max(.5,dpr||1),light?1:1.45,Math.sqrt(1900000/Math.max(1,w*h)));}
export function frameDelta(milliseconds){return clamp(Number.isFinite(milliseconds)?milliseconds/1000:0,0,.05);}
export function dawnAmount(energy,mask){return mask===7?clamp((energy-.6)/.4,0,1):0;}
export const REBIRTH_DURATION=12;
const easeWindow=(value,start,end)=>{const t=clamp((value-start)/(end-start),0,1);return t*t*(3-2*t);};
export const SIEGE_DURATION=32;
export function advanceSiege(elapsed,dt,active,complete){return complete||!active?elapsed:clamp(elapsed+frameDelta(dt*1000),0,SIEGE_DURATION);}
export function siegeState(elapsed){const t=clamp(Number.isFinite(elapsed)?elapsed:0,0,SIEGE_DURATION);return {progress:t/SIEGE_DURATION,approach:easeWindow(t,2,SIEGE_DURATION),urgency:easeWindow(t,18,SIEGE_DURATION),imminent:t>=SIEGE_DURATION};}
export function resolveSiege(journey,elapsed){
  if(journey.complete||!siegeState(elapsed).imminent)return {journey,automatic:false};
  return {journey:BEACONS.reduce((s,b)=>activateBeacon(s,b.id),journey),automatic:true};
}
const ENEMY_ROUTES=Object.freeze([
  {start:[-11,1.5,-13],end:[-7.2,.9,-2.7],yaw:[.24,1.12],phase:0,scale:1.4},
  {start:[-3,5,-29],end:[1,1.0,-10.7],yaw:[0,-.2],phase:2,scale:1.2},
  {start:[12.5,1.2,-15.8],end:[7.2,1.0,-3.2],yaw:[-.3,-1.08],phase:4,scale:1.35},
]);
export function enemyPose(index,elapsed,rebirthElapsed,mask,reduced=false){
  const def=ENEMY_ROUTES[index],threat=siegeState(elapsed),a=reduced?0:threat.approach,t=reduced?0:elapsed;
  const recoil=mask===7?easeWindow(rebirthElapsed,0,.65):0;
  const position=def.start.map((v,i)=>v+(def.end[i]-v)*a);
  if(index===1)position[1]-=Math.sin(a*Math.PI)*1.2;
  position[0]+=Math.sign(def.start[0])*recoil*3;position[1]+=Math.sin(t*1.1+def.phase)*.19+recoil*.7;position[2]-=recoil*4;
  return {position,yaw:def.yaw[0]+(def.yaw[1]-def.yaw[0])*a,roll:reduced?0:Math.sin(t*.7+def.phase)*(.035+threat.urgency*.035),scale:def.scale*(1-recoil*.22),urgency:threat.urgency,clock:t};
}
export function materializationState(elapsed,index,mask){const t=mask===7?elapsed:0,delay=index*.25;return {opacity:easeWindow(t,1.1+delay,7.2+delay),particles:easeWindow(t,.7+delay,1.5+delay)*(1-easeWindow(t,6+delay,9+delay))};}
export function sphereHitsIsland(center,radius,island){const horizontal=Math.max(0,Math.hypot(center[0]-island.x,center[2]-island.z)-island.radius),vertical=Math.max(island.y-island.depth-center[1],center[1]-island.y-.2,0);return horizontal*horizontal+vertical*vertical<=radius*radius;}
// Story time is independent of the reversible star-flow clock. Replaying always resets it.
export function advanceRebirth(elapsed,dt,mask,reduced=false){return mask!==7?0:reduced?REBIRTH_DURATION:clamp(elapsed+clamp(dt,0,.05),0,REBIRTH_DURATION);}
export function rebirthState(elapsed,mask){
  const t=mask===7?clamp(Number.isFinite(elapsed)?elapsed:0,0,REBIRTH_DURATION):0;
  return {sun:easeWindow(t,0,.45),wave:easeWindow(t,0,1.15),cleanse:easeWindow(t,0,.65),flare:easeWindow(t,0,.12)*(1-easeWindow(t,.16,1.4)),palaces:easeWindow(t,1.5,9.5),sanctum:easeWindow(t,1.1,10),title:t>=1.5,complete:t>=REBIRTH_DURATION};
}
export function isTap(start,end){return !!start&&Math.hypot(end.x-start.x,end.y-start.y)<7;}
export function flowLabel(value){return Math.abs(value)<.025?'星流凝止':value<0?'星流逆行':'星流前行';}
export function islandHeight(x,z){return .12*Math.sin(x*.8)*Math.cos(z*.72)+.06*Math.sin(z*1.8+x*.6);}
export function beaconAnchors(projected,width,height){
  const result=projected.map(p=>({x:clamp((p.x*.5+.5)*width,60,width-60),y:clamp((-.5*p.y+.5)*height-44,205,height-205),visible:p.z>-1&&p.z<1}));
  // Screen labels keep their own hit areas even when two markers align in orbit.
  for(let i=1;i<result.length;i++)for(let j=0;j<i;j++){
    if(Math.abs(result[i].x-result[j].x)<105&&Math.abs(result[i].y-result[j].y)<58)result[i].y=clamp(result[j].y+64,205,height-190);
  }
  return result;
}
