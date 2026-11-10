import {BEACONS,activateBeacon,newJourney,clamp,renderScale,frameDelta,isTap,flowLabel,beaconAnchors} from './world-model.mjs?v=worlds-end-polish-20261110';

const root=document.querySelector('.time-studio');
if(root){
  const $=s=>root.querySelector(s),canvas=$('#time-canvas'),host=$('#time-scene');
  const status=$('#time-status'),flow=$('#time-flow'),pause=$('#time-pause'),reset=$('#time-reset'),rebirth=$('#time-rebirth'),quality=$('#time-quality'),touch=$('#time-touch-start');
  const motion=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width: 720px)');
  const events=new AbortController(),listen=(el,type,fn,options={})=>el.addEventListener(type,fn,{...options,signal:events.signal});
  let journey=newJourney(),speed=motion.matches?0:.65,lastSpeed=.65,light=mobile.matches,initialized=false,visible=false,failed=false,raf=0,disposed=false;
  let wake=()=>{},resetView=()=>{},resetWorld=()=>{},setQuality=()=>{},time=0;
  const announce=message=>{status.textContent=message;};
  function flowChange(value){speed=clamp(Number(value)||0,-1,1);if(Math.abs(speed)<.025)speed=0;if(speed)lastSpeed=speed;flow.value=speed;$('#time-flow-value').textContent=`${Math.abs(speed).toFixed(1)}×`;$('#time-flow-label').textContent=flowLabel(speed);pause.textContent=speed?'Ⅱ 暫停星流':'▷ 繼續星流';pause.setAttribute('aria-pressed',String(!speed));root.dataset.flow=String(speed);wake();}
  flowChange(speed);
  listen(flow,'input',()=>flowChange(flow.value));listen(pause,'click',()=>flowChange(speed?0:lastSpeed));
  listen(reset,'click',()=>{resetView();announce('已返回世界邊界的初始視角。');wake();});
  listen(rebirth,'click',()=>{journey=newJourney();updateJourney();resetWorld();flowChange(motion.matches?0:.65);announce('新的旅程開始。再次喚醒教育、科技、創作三座界標。');});
  listen(quality,'click',()=>{light=!light;quality.setAttribute('aria-pressed',String(light));quality.textContent=light?'◇ 輕量模式':'◇ 標準模式';setQuality();announce(light?'已切換輕量畫面，互動玩法完整保留。':'已切換標準光影模式。');});

  function updateJourney(){
    root.dataset.beacons=String(journey.count);root.dataset.completed=String(journey.complete);root.dataset.phase=journey.complete?'dawn':journey.count?'awakening':'void';
    $('#world-progress').textContent=`${String(journey.count).padStart(2,'0')} / 03`;
    $('#world-chapter').textContent=journey.complete?'世界的盡頭，太陽再次升起。':journey.count?'界標已回應。黑洞正等待最後的光。':'喚醒三座界標，讓黑洞迎來曙光。';
    BEACONS.forEach((b,i)=>{const el=$(`[data-coordinate="${b.id}"]`),lit=!!(journey.mask&(1<<i));el.setAttribute('aria-pressed',String(lit));el.setAttribute('aria-label',`${lit?'已喚醒':'喚醒'}${b.name}界標`);el.querySelector('.node-orbit').textContent=lit?'✦':String(i+1).padStart(2,'0');});
    root.querySelectorAll('[data-bio]').forEach(el=>el.classList.toggle('coordinate-highlight',!!journey.selected&&el.dataset.bio.split(' ').includes(journey.selected)));
  }
  const select=id=>{if(failed||!initialized||root.dataset.ready!=='true')return;const old=journey.count;journey=activateBeacon(journey,id);updateJourney();const def=BEACONS.find(b=>b.id===id);announce(journey.complete?'三座界標已全部喚醒。虛無重燃成太陽，世界再次充滿希望。':def.message);$('#time-instructions').textContent=def.message;root.dispatchEvent(new CustomEvent('world-beacon',{detail:{id,newLight:journey.count>old,complete:journey.complete}}));wake();};
  BEACONS.forEach(b=>listen($(`[data-coordinate="${b.id}"]`),'click',()=>select(b.id)));
  updateJourney();

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
        import('./assets/vendor/three.module.js'),import('./assets/vendor/OrbitControls.js'),import('./world-scene.mjs?v=beam-edge-fix-20261110'),import('./world-post.mjs?v=worlds-end-polish-20261110'),
      ]);
      if(disposed||!canvas.isConnected)return;
      const renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});
      renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.98;renderer.setClearColor(0x080e1d);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
      const camera=new THREE.PerspectiveCamera(43,1,.15,160),controls=new OrbitControls(camera,canvas);
      controls.enableDamping=true;controls.dampingFactor=.075;controls.enablePan=false;controls.minDistance=10;controls.maxDistance=30;controls.minPolarAngle=.38;controls.maxPolarAngle=1.54;controls.rotateSpeed=.48;controls.zoomSpeed=.6;
      controls.enabled=!mobile.matches;controls.enableZoom=!mobile.matches;canvas.style.touchAction=mobile.matches?'pan-y':'none';
      const hdrSupported=renderer.extensions.has('EXT_color_buffer_float');
      if(!hdrSupported){light=true;quality.disabled=true;quality.title='此裝置使用相容光影，所有探索功能仍可使用。';}
      const world=createWorldScene(THREE,camera),post=hdrSupported?createWorldPost(THREE,renderer):null,raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();
      world.environment(renderer);
      let last=performance.now(),pulse=0,energy=0,dragging=false,down=null,touchActive=false,tween=null,frames=0;
      const markerWorld=BEACONS.map(()=>new THREE.Vector3()),markerNdc=BEACONS.map(()=>new THREE.Vector3());
      const defaultView=()=>({position:new THREE.Vector3(mobile.matches?1.0:1.5,mobile.matches?7.4:6.9,mobile.matches?24.0:18.0),target:new THREE.Vector3(0,1.2,-1.8)});
      const drainDamping=()=>{const damping=controls.enableDamping;controls.enableDamping=false;controls.update();controls.enableDamping=damping;};
      resetView=()=>{tween=null;drainDamping();const v=defaultView();camera.position.copy(v.position);controls.target.copy(v.target);controls.update();pulse=.2;wake();};
      resetView();
      resetWorld=()=>{time=0;pulse=.8;energy=0;for(const b of world.beacons)b.lit=0;resetView();};
      function setTouch(active){touchActive=active;controls.enabled=active||!mobile.matches;controls.enableZoom=controls.enabled;canvas.style.touchAction=mobile.matches&&!active?'pan-y':'none';touch.textContent=active?'完成探索 · 繼續閱讀 ↓':'開始 3D 探索 ↗';touch.setAttribute('aria-pressed',String(active));if(active)canvas.focus({preventScroll:true});}
      listen(touch,'click',()=>setTouch(!touchActive));
      listen(root,'world-beacon',e=>{pulse=e.detail.newLight?1:.35;if(e.detail.complete&&e.detail.newLight&&!motion.matches){drainDamping();tween={elapsed:0,from:camera.position.clone(),targetFrom:controls.target.clone(),to:new THREE.Vector3(mobile.matches?0:0.7,mobile.matches?6.6:5.4,mobile.matches?22.5:16.4),targetTo:new THREE.Vector3(0,1.7,-2.4)};}wake();});
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
        if(e.key==='+'||e.key==='=')spherical.radius*=.92;if(e.key==='-')spherical.radius*=1.08;spherical.radius=clamp(spherical.radius,10,30);spherical.phi=clamp(spherical.phi,.38,1.54);
        camera.position.setFromSpherical(spherical).add(controls.target);controls.update();wake();
      });
      function resize(){
        const w=host.clientWidth,h=host.clientHeight;if(w<1||h<1)return;
        camera.aspect=w/h;camera.updateProjectionMatrix();const ratio=renderScale(w,h,devicePixelRatio,light);renderer.setPixelRatio(ratio);renderer.setSize(w,h,false);const size=renderer.getDrawingBufferSize(new THREE.Vector2());post?.resize(size.x,size.y);world.quality(light,ratio);root.dataset.quality=light?'light':'standard';wake();
      }
      setQuality=resize;const ro=new ResizeObserver(resize);ro.observe(host);
      function frame(now){
        raf=0;if(!visible||document.hidden||failed||disposed)return;
        const dt=frameDelta(now-last);last=now;time+=dt*speed;pulse=Math.max(0,pulse-dt*.62);energy+=(journey.count/3-energy)*(1-Math.exp(-dt*1.8));
        if(tween){tween.elapsed+=dt;const t=clamp(tween.elapsed/3,0,1),smooth=t*t*(3-2*t);camera.position.lerpVectors(tween.from,tween.to,smooth);controls.target.lerpVectors(tween.targetFrom,tween.targetTo,smooth);if(t>=1)tween=null;}
        const moving=controls.update();world.update(time,energy,pulse,dt,journey.mask);world.scene.updateMatrixWorld();
        world.beacons.forEach((b,i)=>{b.group.getWorldPosition(markerWorld[i]);markerWorld[i].y+=1.65;markerNdc[i].copy(markerWorld[i]).project(camera);});
        const anchors=beaconAnchors(markerNdc,host.clientWidth,host.clientHeight);
        anchors.forEach((a,i)=>{const el=$(`[data-coordinate="${BEACONS[i].id}"]`);el.style.left=`${a.x}px`;el.style.top=`${a.y}px`;el.style.opacity=a.visible?'1':'0';el.style.pointerEvents=a.visible?'auto':'none';});
        if(light||!post){renderer.setRenderTarget(null);renderer.render(world.scene,camera);}else post.render(world.scene,camera,energy);
        if(frames===0)root.querySelectorAll('.time-node').forEach(el=>el.disabled=false);
        frames++;root.dataset.frames=String(frames);root.dataset.camera=camera.position.toArray().map(n=>n.toFixed(2)).join(',');root.dataset.worldTime=time.toFixed(3);root.dataset.energy=energy.toFixed(3);
        const settling=Math.abs(energy-journey.count/3)>.001||world.beacons.some((b,i)=>Math.abs(b.lit-Number(!!(journey.mask&(1<<i))))>.001);
        if(!raf&&(speed||pulse>.001||dragging||moving||tween||settling))raf=requestAnimationFrame(frame);
      }
      wake=()=>{if(!raf&&visible&&!document.hidden&&!failed&&!disposed){last=performance.now();raf=requestAnimationFrame(frame);}};
      listen(document,'visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();});
      listen(motion,'change',e=>{if(e.matches)flowChange(0);});
      listen(mobile,'change',()=>{setTouch(false);resetView();resize();});
      listen(canvas,'webglcontextlost',e=>{e.preventDefault();fallback('3D 顯示已暫停，重新整理可再試。個人介紹仍可完整閱讀。');});
      listen(window,'pagehide',e=>{if(e.persisted)return;disposed=true;cancelAnimationFrame(raf);observer.disconnect();ro.disconnect();controls.dispose();post?.dispose();world.dispose();renderer.dispose();events.abort();});
      resize();root.dataset.ready='true';quality.setAttribute('aria-pressed',String(light));quality.textContent=light?'◇ 輕量模式':'◇ 標準模式';announce('世界邊界已就緒。拖曳自由探索，點選教育、科技、創作三座界標。');wake();
    }catch(error){console.warn('World experience unavailable:',error.message);fallback('暫時未能啟動 3D 世界，已顯示靜態星圖。個人介紹仍可完整閱讀。');}
  }
  const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);root.dataset.inView=String(visible);if(visible){init();wake();}else{cancelAnimationFrame(raf);raf=0;}},{rootMargin:'100px'});
  observer.observe($('.time-exhibit'));
}
