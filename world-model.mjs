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
export const REBIRTH_DURATION=26;
const easeWindow=(value,start,end)=>{const t=clamp((value-start)/(end-start),0,1);return t*t*(3-2*t);};
export const smootherStep=t=>{t=clamp(t,0,1);return t*t*t*(t*(t*6-15)+10);};
export const HOLY_ORIGIN=Object.freeze([0,3.9,-3.2]);
export const SHIELD=Object.freeze({center:Object.freeze([0,-.42,-.1]),radii:Object.freeze([7.65,9.6,7.65])});
export function shieldIntersection(start,target){
  const m=start.map((v,i)=>(v-SHIELD.center[i])/SHIELD.radii[i]),d=target.map((v,i)=>(v-start[i])/SHIELD.radii[i]),a=d.reduce((s,v)=>s+v*v,0),b=2*m.reduce((s,v,i)=>s+v*d[i],0),c=m.reduce((s,v)=>s+v*v,0)-1,disc=b*b-4*a*c;
  if(a<1e-12||c<0||disc<0)return null;const t=(-b-Math.sqrt(disc))/(2*a);if(t<0||t>1)return null;const point=start.map((v,i)=>v+(target[i]-v)*t);if(point[1]<SHIELD.center[1])return null;const normal=point.map((v,i)=>(v-SHIELD.center[i])/SHIELD.radii[i]**2),length=Math.hypot(...normal);return {point,normal:normal.map(v=>v/length),t};
}
export function cannonPacket(index,barrel,clock){
  const raw=clock*.32+barrel*.25+index*.13,cycle=Math.floor(raw),phase=raw-cycle,launched=(cycle-barrel*.25-index*.13)/.32;if(launched<0)return null;const source=swarmPose(index,launched,0,0).position,target=[0,2.2,-.1],direction=target.map((v,i)=>v-source[i]),length=Math.hypot(...direction);for(let i=0;i<3;i++)direction[i]/=length;
  const start=source.map((v,i)=>v+direction[i]*2.3),hit=shieldIntersection(start,target);if(!hit)return null;const flightLength=Math.hypot(...hit.point.map((v,i)=>v-start[i])),travel=clamp(phase/.78,0,1),front=start.map((v,i)=>v+direction[i]*flightLength*travel),beamLength=Math.min(3.4,flightLength*travel);
  return {cycle,phase,start,front,direction,beamLength,hit,arrived:phase>=.78,impactTime:launched+.78/.32};
}
export function advanceSpin(elapsed,dt,reduced=false){return elapsed+(reduced?0:frameDelta(dt*1000));}
export function holyRadius(elapsed,mask){return mask===7?clamp((elapsed-1.4)*5,0,54):0;}
export function holyContact(position,radius,elapsed,mask){const distance=Math.hypot(...position.map((v,i)=>v-HOLY_ORIGIN[i])),wave=holyRadius(elapsed,mask);return {touched:wave>0&&wave>=distance-radius,cleared:wave>=distance+radius,amount:wave>0?clamp((wave-distance+radius)/(2*radius),0,1):0};}
export function swarmPose(index,siege,rebirth,mask,reduced=false){
  const t=reduced?0:siege+(mask===7?rebirth:0),mode=index%3,phase=t*(.85+index%4*.07)+index*1.73,dive=reduced?0:mode===0?Math.max(0,Math.sin(phase)):0;
  const angle=index/48*Math.PI*2+Math.sin(index*7.1)*.09+(reduced?0:Math.sin(phase*.42)*.075),approach=easeWindow(t+(index%5)*.8,5,34),radius=(25+(index%7)*2.5)*(1-approach)+(12+(index%4)*.3)*approach-dive*1.1;
  const cast=reduced?0:mode===1?Math.pow(Math.max(0,Math.sin(phase)),6):mode===2?Math.pow(Math.max(0,Math.sin(phase*.8)),4)*.7:0;
  return {position:[Math.cos(angle)*radius+Math.sign(Math.cos(angle))*8*Math.pow(Math.max(0,Math.sin(angle)),8),4.5+Math.pow(Math.max(0,Math.sin(angle)),4)*12+Math.sin(index*1.7)*.7+Math.sin(phase)*.4-dive*1.8,Math.sin(angle)*radius],yaw:-angle-Math.PI/2,flap:reduced?0:Math.sin(t*(mode===0?7:4.6)+index)*.65,scale:.79+(index%4)*.07,mode,cast,pitch:-.12-dive*.45,bank:reduced?0:Math.sin(phase*.55)*.2,jaw:.12+dive*.35+cast*.2};
}
// Both ruined steps and restored paving take the same route around the creative beacon.
export function processionalStep(i){const z=5.2-i*.47,detour=Math.exp(-(((z-3.8)/1.05)**4));return {x:Math.sin(i*.24)*.45-.3-detour*1.45,z};}
export function awakeningCameraKeys(position,target,phone=false){return [
  {at:0,position:[...position],target:[...target]},
  {at:4,position:phone?[0,25,25]:[1.2,20,26],target:[0,1.6,-5]},
  {at:14,position:phone?[0,25,25]:[1.2,20,26],target:[0,1.6,-5]},
  {at:26,position:phone?[0,7,26]:[.6,6.4,18.5],target:[0,1.25,-2]},
];}
export const SIEGE_DURATION=32;
export function advanceSiege(elapsed,dt,active,complete){return complete||!active?elapsed:clamp(elapsed+frameDelta(dt*1000),0,SIEGE_DURATION);}
export function siegeState(elapsed){const t=clamp(Number.isFinite(elapsed)?elapsed:0,0,SIEGE_DURATION);return {progress:t/SIEGE_DURATION,approach:easeWindow(t,2,SIEGE_DURATION),urgency:easeWindow(t,18,SIEGE_DURATION),imminent:t>=SIEGE_DURATION};}
export function resolveSiege(journey,elapsed){
  if(journey.complete||!siegeState(elapsed).imminent)return {journey,automatic:false};
  return {journey:BEACONS.reduce((s,b)=>activateBeacon(s,b.id),journey),automatic:true};
}
const ENEMY_ROUTES=Object.freeze([
  {start:[-11,1.5,-13],end:[-7.2,.9,-2.7],yaw:[.24,1.12],phase:0,scale:1.4},
  {start:[-9,5,-29],end:[-6,1.0,-10.7],yaw:[.15,.45],phase:2,scale:1.2},
  {start:[12.5,1.2,-15.8],end:[7.9,1.3,-3.4],yaw:[-.3,-1.08],phase:4,scale:1.35},
]);
export function enemyPose(index,elapsed,rebirthElapsed,mask,reduced=false){
  const def=ENEMY_ROUTES[index],threat=siegeState(elapsed),a=reduced?0:index===2?easeWindow(elapsed,0,26):threat.approach,t=reduced?0:elapsed;
  const recoil=0; // Surface-by-surface radial cleansing replaces premature whole-body retreat.
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
  return {sun:easeWindow(t,0,1.2),wave:holyRadius(t,mask)/54,cleanse:holyRadius(t,mask)/54,flare:easeWindow(t,.2,.8)*(1-easeWindow(t,1.1,2.8)),palaces:easeWindow(t,1.5,9.5),sanctum:easeWindow(t,1.1,10),title:t>=1.5,complete:t>=REBIRTH_DURATION};
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
