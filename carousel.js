export function createSpotlightCarousel({items,onChange,onState=()=>{},intervalMs=6000,schedule=setTimeout,cancel=clearTimeout}){
 let order=[...new Set(items)],current=order[0]||null,timer=null,started=false,destroyed=false,loading=false,generation=0;
 const pauses=new Set();
 const state=()=>({current,items:[...order],pausedReasons:[...pauses],playing:started&&!destroyed&&!loading&&!pauses.size&&order.length>1,loading});
 const publish=()=>onState(state());
 const clear=()=>{if(timer!==null){cancel(timer);timer=null;}};
 function arm(){clear();if(started&&!destroyed&&!loading&&!pauses.size&&order.length>1)timer=schedule(()=>{timer=null;advance(1,'auto');},intervalMs);}
 function show(id,source){
  if(destroyed||!id)return;
  clear();current=id;const ticket=++generation;
  const result=onChange(id,{source});
  if(result&&typeof result.then==='function'){
   loading=true;publish();
   return Promise.resolve(result).finally(()=>{if(ticket===generation&&!destroyed){loading=false;arm();publish();}});
  }
  loading=false;arm();publish();return result;
 }
 function advance(direction=1,source='manual'){
  if(!order.length||destroyed)return;
  const index=Math.max(0,order.indexOf(current));
  return show(order[(index+direction+order.length)%order.length],source);
 }
 return {
  get current(){return current;},get items(){return [...order];},get pausedReasons(){return [...pauses];},
  start(){if(started||destroyed)return;started=true;if(current)return show(current,'initial');publish();},
  select(id,{source='manual'}={}){if(!id||destroyed)return;if(!order.includes(id))order.push(id);return show(id,source);},
  next(){return advance(1);},previous(){return advance(-1);},
  setItems(next){
   const updated=[...new Set(next)];if(JSON.stringify(updated)===JSON.stringify(order))return;
   order=updated;if(!order.includes(current)){current=order[0]||null;if(started&&current)return show(current,'catalog');}
   arm();publish();
  },
  setPaused(reason,paused){
   if(destroyed||pauses.has(reason)===paused)return;
   if(paused)pauses.add(reason);else pauses.delete(reason);
   arm();publish();
  },
  destroy(){destroyed=true;generation++;clear();publish();}
 };
}
