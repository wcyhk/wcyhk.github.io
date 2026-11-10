import {BEACONS,activateBeacon,newJourney,clamp,renderScale,frameDelta,isTap,flowLabel,beaconAnchors,advanceRebirth,REBIRTH_DURATION,advanceSiege,siegeState,resolveSiege,SIEGE_DURATION,awakeningCameraKeys,smootherStep} from './world-model.mjs?v=slow-sanctuary-20261110';

const root=document.querySelector('.time-studio');
if(root){
  const $=s=>root.querySelector(s),canvas=$('#time-canvas'),host=$('#time-scene');
  const status=$('#time-status'),flow=$('#time-flow'),pause=$('#time-pause'),reset=$('#time-reset'),rebirth=$('#time-rebirth'),quality=$('#time-quality'),touch=$('#time-touch-start');
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width: 720px)');
  const events=new AbortController(),listen=(el,type,fn,options={})=>el.addEventListener(type,fn,{...options,signal:events.signal});
  let journey=newJourney(),speed=motion.matches?0:.65,lastSpeed=.65,light=mobile.matches,initialized=false,visible=false,storyVisible=false,failed=false,raf=0,disposed=false;
  let wake=()=>{},resetView=()=>{},resetWorld=()=>{},setQuality=()=>{},time=0;
  const announce=message=>{status.textContent=message;};
  function storyText(reborn=false){
    if(root.dataset.storyTitle===String(reborn))return;root.dataset.storyTitle=String(reborn);
    $('.time-title').textContent=reborn?'世界的復甦':'世界的盡頭';$('.time-english').textContent=reborn?'THE WORLD REBORN':'THE END OF THE WORLD';
    $('.time-poem').innerHTML=reborn?'黑暗散去，<br>每一束光，都成為新的開始。':'在世界的邊界，<br>尋找下一個開始。';
    $('.world-quest-kicker').textContent=reborn?'A WORLD REBORN':'THE LAST THREE LIGHTS';
    $('.time-exhibit').setAttribute('aria-label',`${reborn?'世界的復甦':'世界的盡頭'}，3D 互動作品`);
    canvas.setAttribute('aria-label',`${reborn?'世界的復甦':'世界的盡頭'} 3D 星海。拖曳旋轉，滾輪縮放，點選界標；方向鍵旋轉，加減鍵縮放，空白鍵暫停，R 鍵重設視角。`);
  }
  function flowChange(value){speed=clamp(Number(value)||0,-1,1);if(Math.abs(speed)<.025)speed=0;if(speed)lastSpeed=speed;flow.value=speed;$('#time-flow-value').textContent=`${Math.abs(speed).toFixed(1)}×`;$('#time-flow-label').textContent=flowLabel(speed);pause.textContent=speed?'Ⅱ 暫停星流':'▷ 繼續星流';pause.setAttribute('aria-pressed',String(!speed));root.dataset.flow=String(speed);wake();}
  flowChange(speed);
  listen(flow,'input',()=>flowChange(flow.value));listen(pause,'click',()=>flowChange(speed?0:lastSpeed));
  listen(reset,'click',()=>{resetView();announce('已返回世界邊界的初始視角。');wake();});
  listen(rebirth,'click',()=>{journey=newJourney();root.dataset.awakening='none';updateJourney();resetWorld();flowChange(motion.matches?0:.65);announce('新的旅程開始。暗影正在接近，點亮三座界標守護祭壇。');});
  listen(quality,'click',()=>{light=!light;quality.setAttribute('aria-pressed',String(light));quality.textContent=light?'◇ 輕量模式':'◇ 標準模式';setQuality();announce(light?'已切換輕量畫面，互動玩法完整保留。':'已切換標準光影模式。');});

  function updateJourney(){
    root.dataset.beacons=String(journey.count);root.dataset.completed=String(journey.complete);root.dataset.phase=journey.complete?'dawn':journey.count?'awakening':'void';
    $('#world-progress').textContent=`${String(journey.count).padStart(2,'0')} / 03`;
    if(!journey.complete)storyText(false);
    $('#world-chapter').textContent=journey.complete?'聖光反擊，黑暗即刻退散。':'暗影正逼近祭壇。點亮三座界標，釋放聖光。';
    BEACONS.forEach((b,i)=>{const el=$(`[data-coordinate="${b.id}"]`),lit=!!(journey.mask&(1<<i));el.setAttribute('aria-pressed',String(lit));el.setAttribute('aria-label',`${lit?'已喚醒':'喚醒'}${b.name}界標`);el.querySelector('.node-orbit').textContent=lit?'✦':String(i+1).padStart(2,'0');});
    root.querySelectorAll('[data-bio]').forEach(el=>el.classList.toggle('coordinate-highlight',!!journey.selected&&el.dataset.bio.split(' ').includes(journey.selected)));
  }
  const select=id=>{if(failed||!initialized||root.dataset.ready!=='true')return;const old=journey.count;journey=activateBeacon(journey,id);if(journey.complete&&old<3)root.dataset.awakening='manual';updateJourney();const def=BEACONS.find(b=>b.id===id);announce(journey.complete?'三座界標已全部喚醒。聖光即時反擊，黑暗正在退散。':def.message);$('#time-instructions').textContent=def.message;root.dispatchEvent(new CustomEvent('world-beacon',{detail:{id,newLight:journey.count>old,complete:journey.complete}}));wake();};
  BEACONS.forEach(b=>listen($(`[data-coordinate="${b.id}"]`),'click',()=>select(b.id)));
  root.dataset.awakening='none';updateJourney();

  function fallback(message){
    failed=true;cancelAnimationFrame(raf);raf=0;root.dataset.ready='fallback';announce(message);
    for(const el of [flow,pause,reset,rebirth,quality,touch,...root.querySelectorAll('.time-node')])el.disabled=true;
    canvas.tabIndex=-1;canvas.style.pointerEvents='none';canvas.style.touchAction='pan-y';
    $('#time-instructions').textContent='靜態欣賞模式 · 個人介紹與所有作品入口仍可閱讀';
  }
  async function init(){
    if(initialized||disposed)return;initialized=true;
    try{
      const [THREE,{OrbitControls},{createWorldScene},{createWorldPost}]=await Promise.all([
        import('./assets/vendor/three.module.js'),import('./assets/vendor/OrbitControls.js'),import('./world-scene.mjs?v=slow-sanctuary-20261110'),import('./world-post.mjs?v=worlds-end-polish-20261110'),
      ]);
      if(disposed||!canvas.isConnected)return;
      const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
      renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;renderer.setClearColor(0x080e1d);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      const camera=new THREE.PerspectiveCamera(43,1,.15,160),controls=new OrbitControls(camera,canvas);
      controls.enableDamping=true;controls.dampingFactor=.075;controls.enablePan=false;controls.minDistance=10;controls.maxDistance=40;controls.minPolarAngle=.38;controls.maxPolarAngle=1.54;controls.rotateSpeed=.48;controls.zoomSpeed=.6;
      controls.enabled=!mobile.matches;controls.enableZoom=!mobile.matches;canvas.style.touchAction=mobile.matches?'pan-y':'none';
      const hdrSupported=renderer.extensions.has('EXT_color_buffer_float');
      if(!hdrSupported){light=true;quality.disabled=true;quality.title='此裝置使用相容光影，所有探索功能仍可使用。';}
      const world=createWorldScene(THREE,camera),post=hdrSupported?createWorldPost(THREE,renderer):null,raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
      world.environment(renderer);
      let last=performance.now(),pulse=0,energy=0,siegeElapsed=0,rebirthElapsed=0,dragging=false,down=null,touchActive=false,tween=null,frames=0;
      const markerWorld=BEACONS.map(()=>new THREE.Vector3()),markerNdc=BEACONS.map(()=>new THREE.Vector3());
      const defaultView=()=>({position:new THREE.Vector3(mobile.matches?0:1.5,mobile.matches?7.4:6.9,mobile.matches?26.0:18.0),target:new THREE.Vector3(0,1.2,-1.8)});
      const drainDamping=()=>{const damping=controls.enableDamping;controls.enableDamping=false;controls.update();controls.enableDamping=damping;};
      resetView=()=>{tween=null;drainDamping();const v=defaultView();camera.position.copy(v.position);controls.target.copy(v.target);controls.update();pulse=.2;wake();};
      resetView();
      resetWorld=()=>{time=0;pulse=.8;energy=0;siegeElapsed=0;rebirthElapsed=0;for(const b of world.beacons)b.lit=0;resetView();};
      function setTouch(active){touchActive=active;controls.enabled=active||!mobile.matches;controls.enableZoom=controls.enabled;canvas.style.touchAction=mobile.matches&&!active?'pan-y':'none';touch.textContent=active?'完成探索 · 繼續閱讀 ↓':'開始 3D 探索 ↗';touch.setAttribute('aria-pressed',String(active));if(active)canvas.focus({preventScroll:true});}
      listen(touch,'click',()=>setTouch(!touchActive));
      listen(root,'world-beacon',e=>{pulse=e.detail.newLight?1:.35;if(e.detail.complete&&e.detail.newLight&&!motion.matches){drainDamping();tween={elapsed:0,keys:awakeningCameraKeys(camera.position.toArray(),controls.target.toArray(),mobile.matches).map(k=>({...k,position:new THREE.Vector3(...k.position),target:new THREE.Vector3(...k.target)}))};}wake();});
      controls.addEventListener('start',()=>{dragging=true;tween=null;wake();});controls.addEventListener('end',()=>{dragging=false;wake();});controls.addEventListener('change',()=>wake());
      listen(canvas,'pointerdown',e=>{if(!controls.enabled)return;down={x:e.clientX,y:e.clientY};tween=null;wake();});
      listen(canvas,'pointerup',e=>{if(!controls.enabled)return;if(isTap(down,{x:e.clientX,y:e.clientY})){const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(world.pickTargets,false)[0];if(hit)select(hit.object.userData.beaconId);else{pulse=.35;wake();}}down=null;});
      listen(canvas,'pointercancel',()=>{down=null;dragging=false;});
      listen(canvas,'pointermove',e=>{if(dragging||!controls.enabled)return;const rect=canvas.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);canvas.style.cursor=raycaster.intersectObjects(world.pickTargets,false).length?'pointer':'grab';});
      listen(canvas,'keydown',e=>{
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-',' ','r','R','Escape'].includes(e.key))return;e.preventDefault();
        if(e.key===' '){flowChange(speed?0:lastSpeed);return;}if(e.key.toLowerCase()==='r'){resetView();return;}if(e.key==='Escape'){setTouch(false);canvas.blur();return;}
        tween=null;const spherical=new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
        if(e.key==='ArrowLeft')spherical.theta-=.12;if(e.key==='ArrowRight')spherical.theta+=.12;if(e.key==='ArrowUp')spherical.phi-=.09;if(e.key==='ArrowDown')spherical.phi+=.09;
        if(e.key==='+'||e.key==='=')spherical.radius*=.92;if(e.key==='-')spherical.radius*=1.08;spherical.radius=clamp(spherical.radius,10,40);spherical.phi=clamp(spherical.phi,.38,1.54);
        camera.position.setFromSpherical(spherical).add(controls.target);controls.update();wake();
      });
      function resize(){
        const w=host.clientWidth,h=host.clientHeight;if(w<1||h<1)return;
        camera.aspect=w/h;camera.fov=mobile.matches?48:43;camera.updateProjectionMatrix();const ratio=renderScale(w,h,devicePixelRatio,light);renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);const size=renderer.getDrawingBufferSize(new THREE.Vector2());post?.resize(size.x,size.y);world.quality(light,ratio);root.dataset.quality=light?'light':'standard';wake();
      }
      setQuality=resize;const ro=new ResizeObserver(resize);ro.observe(host);
      function frame(now){
        raf=0;if(!visible||document.hidden||failed||disposed)return;
        const dt=frameDelta(now-last);last=now;time+=dt*speed;pulse=Math.max(0,pulse-dt*.62);energy+=(journey.count/3-energy)*(1-Math.exp(-dt*1.8));
        siegeElapsed=advanceSiege(siegeElapsed,dt,storyVisible,journey.complete);
        const rescue=resolveSiege(journey,world.destruction.altarThreat?SIEGE_DURATION:siegeElapsed);
        if(rescue.automatic){journey=rescue.journey;root.dataset.awakening='automatic';updateJourney();announce('暗影逼近祭壇，守護機制已自動喚醒三座界標，釋放聖光。');$('#time-instructions').textContent='守護機制已自動覺醒，祭壇安全。';root.dispatchEvent(new CustomEvent('world-beacon',{detail:{id:null,newLight:true,complete:true,automatic:true}}));}
        if(tween){tween.elapsed+=dt;const keys=tween.keys,index=keys.findIndex((key,i)=>i>0&&tween.elapsed<=key.at),end=index<0?keys.length-1:index,a=keys[end-1],b=keys[end],t=clamp((tween.elapsed-a.at)/(b.at-a.at),0,1),smooth=smootherStep(t);camera.position.lerpVectors(a.position,b.position,smooth);controls.target.lerpVectors(a.target,b.target,smooth);if(tween.elapsed>=REBIRTH_DURATION)tween=null;}
        rebirthElapsed=advanceRebirth(rebirthElapsed,dt,journey.mask,motion.matches);
        const moving=controls.update(),story=world.update(time,energy,pulse,dt,journey.mask,rebirthElapsed,siegeElapsed,motion.matches);world.scene.updateMatrixWorld();
        storyText(story.title);root.dataset.rebirth=rebirthElapsed.toFixed(2);root.dataset.swarm=String(world.reborn.swarm.records.filter(r=>!r.cleared).length);root.dataset.ancients=String(world.reborn.ancients.actors.filter(a=>a.group.visible).length);root.dataset.holyRadius=(story.wave*54).toFixed(2);root.dataset.shattered=String(world.destruction.records.filter(r=>r.shattered).length);root.dataset.hitBy=[...new Set(world.destruction.records.filter(r=>r.shattered).map(r=>r.hitBy))].sort().join(',');
        const threat=siegeState(siegeElapsed);root.dataset.siege=siegeElapsed.toFixed(2);root.style.setProperty('--siege',String(journey.complete?0:threat.progress));root.style.setProperty('--holy-flash',String(motion.matches?0:story.flare*.32));
        const threatLabel=journey.complete?(root.dataset.awakening==='automatic'?'界標自動覺醒 · 祭壇安全':'聖光已釋放 · 祭壇安全'):threat.urgency>.75?'暗影逼近 · 守護即將覺醒':'暗影正在逼近祭壇';if($('#world-threat-label').textContent!==threatLabel)$('#world-threat-label').textContent=threatLabel;
        const storyPhase=story.complete?'reborn':journey.complete?'purifying':'dark';
        if(storyPhase==='reborn'&&root.dataset.story!==storyPhase)announce('世界的復甦。黑暗身影已消散，雲上宮殿與中央聖域重新建立。');
        root.dataset.story=storyPhase;
        {const chapter=journey.complete?(story.complete?'世界的復甦。希望重回世界中心。':story.title?(rebirthElapsed>=11?'宮殿重現，聖光照耀世界中心。':'聖光擴散，宮殿與聖域正在重現。'):'聖光反擊，黑暗即刻退散。'):threat.urgency>.75?'黑暗已逼近，界標即將自動覺醒。':'暗影正逼近祭壇。點亮三座界標，釋放聖光。';if($('#world-chapter').textContent!==chapter)$('#world-chapter').textContent=chapter;}
        world.beacons.forEach((b,i)=>{b.group.getWorldPosition(markerWorld[i]);markerWorld[i].y+=1.65;markerNdc[i].copy(markerWorld[i]).project(camera);});
        const anchors=beaconAnchors(markerNdc,host.clientWidth,host.clientHeight);
        anchors.forEach((a,i)=>{const el=$(`[data-coordinate="${BEACONS[i].id}"]`);el.style.left=`${a.x}px`;el.style.top=`${a.y}px`;el.style.opacity=a.visible?'1':'0';el.style.pointerEvents=a.visible?'auto':'none';});
        if(light||!post){renderer.setRenderTarget(null);renderer.render(world.scene,camera);}else post.render(world.scene,camera,energy);
        if(frames===0)root.querySelectorAll('.time-node').forEach(el=>el.disabled=false);
        frames++;root.dataset.frames=String(frames);root.dataset.camera=camera.position.toArray().map(n=>n.toFixed(2)).join(',');root.dataset.worldTime=time.toFixed(3);root.dataset.energy=energy.toFixed(3);root.dataset.drawCalls=String(renderer.info.render.calls);root.dataset.triangles=String(renderer.info.render.triangles);
        const settling=(journey.complete&&rebirthElapsed<REBIRTH_DURATION)||Math.abs(energy-journey.count/3)>.001||world.beacons.some((b,i)=>Math.abs(b.lit-Number(!!(journey.mask&(1<<i))))>.001);
        const siegeMoving=storyVisible&&!journey.complete&&siegeElapsed<SIEGE_DURATION;
        if(!raf&&(speed||pulse>.001||dragging||moving||tween||settling||siegeMoving))raf=requestAnimationFrame(frame);
      }
      wake=()=>{if(!raf&&visible&&!document.hidden&&!failed&&!disposed){last=performance.now();raf=requestAnimationFrame(frame);}};
      listen(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();});
      listen(motion,'change',e=>{if(e.matches)flowChange(0);});
      listen(mobile,'change',()=>{setTouch(false);resetView();resize();});
      listen(canvas,'webglcontextlost',e=>{e.preventDefault();fallback('3D 顯示已暫停，重新整理可再試。個人介紹仍可完整閱讀。');});
      listen(window,'pagehide',e=>{if(e.persisted)return;disposed=true;cancelAnimationFrame(raf);observer.disconnect();storyObserver.disconnect();ro.disconnect();controls.dispose();post?.dispose();world.dispose();renderer.dispose();events.abort();});
      resize();root.dataset.ready='true';quality.setAttribute('aria-pressed',String(light));quality.textContent=light?'◇ 輕量模式':'◇ 標準模式';announce('世界邊界已就緒。拖曳自由探索，點選教育、科技、創作三座界標。');wake();
    }catch(error){console.warn('World experience unavailable:',error.message);fallback('暫時未能啟動 3D 世界，已顯示靜態星圖。個人介紹仍可完整閱讀。');}
  }
  const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);root.dataset.inView=String(visible);if(visible){init();wake();}else{cancelAnimationFrame(raf);raf=0;}},{rootMargin:'100px'});
  const storyObserver=new IntersectionObserver(entries=>{storyVisible=entries.some(e=>e.isIntersecting&&e.intersectionRatio>=.35);root.dataset.storyVisible=String(storyVisible);if(storyVisible)wake();},{threshold:[0,.35]});storyObserver.observe($('.time-exhibit'));
  observer.observe($('.time-exhibit'));
}
