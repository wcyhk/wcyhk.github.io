export const BEACONS = Object.freeze([
  Object.freeze({id:'education',name:'教育',english:'EDUCATION',color:0xffcc84,position:[-3.8,.75,1.0],message:'教育｜把學習目標，變成親手探索的旅程。'}),
  Object.freeze({id:'technology',name:'科技',english:'TECHNOLOGY',color:0x8ae5ef,position:[3.55,.9,-.9],message:'科技｜以程式與 AI，為真實需要開闢新路。'}),
  Object.freeze({id:'creativity',name:'創作',english:'CREATIVITY',color:0xd9b2ff,position:[.5,.65,3.8],message:'創作｜讓腦海裏的世界，成為可以走進的作品。'}),
]);
export const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
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
