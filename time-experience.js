import { clamp, flowLabel, renderScale, seededRandom } from './time-math.mjs';

const root = document.querySelector('.time-studio');
if (root) {
  const canvas = document.querySelector('#time-canvas');
  const host = document.querySelector('#time-scene');
  const status = document.querySelector('#time-status');
  const flow = document.querySelector('#time-flow');
  const flowOutput = document.querySelector('#time-flow-value');
  const flowText = document.querySelector('#time-flow-label');
  const pause = document.querySelector('#time-pause');
  const reset = document.querySelector('#time-reset');
  const rebirth = document.querySelector('#time-rebirth');
  const quality = document.querySelector('#time-quality');
  const touchStart = document.querySelector('#time-touch-start');
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const mobile = matchMedia('(max-width: 720px)');
  let initialized = false, visible = false, failed = false, cleanUp;
  let speed = motion.matches ? 0 : 1, lastSpeed = 1, light = mobile.matches;
  let animationId = 0, wake = () => {};
  const announce = (message) => { status.textContent = message; };
  const setFlow = (value) => {
    speed = clamp(Number(value), -1, 1); if (Math.abs(speed) < .05) speed = 0;
    if (speed) lastSpeed = speed;
    flow.value = speed; flowOutput.textContent = `${Math.abs(speed).toFixed(1)}×`;
    flowText.textContent = flowLabel(speed); pause.textContent = speed ? 'Ⅱ 凝止' : '▷ 繼續';
    pause.setAttribute('aria-pressed', String(!speed)); root.dataset.flow = String(speed); wake();
  };
  setFlow(speed);
  pause.addEventListener('click', () => setFlow(speed ? 0 : lastSpeed));
  flow.addEventListener('input', () => setFlow(flow.value));
  const setUnavailable = (message) => {
    failed = true; root.dataset.ready = 'fallback'; announce(message);
    for (const button of [pause, reset, rebirth, quality, touchStart]) button.disabled = true;
    flow.disabled = true; canvas.tabIndex = -1; canvas.style.pointerEvents = 'none'; canvas.style.touchAction = 'pan-y'; document.querySelector('.time-discoveries').hidden = true; document.querySelector('#time-instructions').textContent = '靜態欣賞模式 · 你的裝置暫未支援 3D，個人介紹仍可完整閱讀';
  };
  async function init() {
    if (initialized) return; initialized = true;
    try {
      const THREE = await import('./assets/vendor/three.module.js');
      const { OrbitControls } = await import('./assets/vendor/OrbitControls.js');
      if (!canvas.isConnected) return;
      const rnd = seededRandom(9172026);
      const renderer = new THREE.WebGLRenderer({canvas, antialias: !mobile.matches, alpha: true, powerPreference: 'low-power'});
      renderer.setClearColor(0x090c10, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.15;
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x090c10, .017);
      const camera = new THREE.PerspectiveCamera(43, 1, .1, 120);
      const controls = new OrbitControls(camera, canvas);
      controls.enableDamping = true; controls.dampingFactor = .065; controls.enablePan = false;
      controls.minDistance = 6.2; controls.maxDistance = 20; controls.minPolarAngle = .25; controls.maxPolarAngle = Math.PI - .25;
      controls.rotateSpeed = .45; controls.zoomSpeed = .5;
      controls.enableZoom = !mobile.matches; controls.enabled = !mobile.matches;
      // On a phone, scrolling the page stays available until Explore is explicitly enabled.
      canvas.style.touchAction = mobile.matches ? 'pan-y' : 'none';
      const original = () => {
        // Drain pending orbit/zoom damping before restoring a stable view.
        const damping = controls.enableDamping; controls.enableDamping = false; controls.update(); controls.enableDamping = damping;
        camera.position.set(mobile.matches ? 0 : .5, mobile.matches ? 1.4 : 1.7, mobile.matches ? 14.5 : 12.8);
        controls.target.set(0, mobile.matches ? .25 : .2, 0); controls.update();
      };
      original();
      const ambient = new THREE.HemisphereLight(0x92abc3, 0x191511, 2.4); scene.add(ambient);
      const goldLight = new THREE.PointLight(0xffc16d, 105, 35, 2); goldLight.position.set(-4, 2.5, 4); scene.add(goldLight);
      const rimLight = new THREE.DirectionalLight(0xb4d0e7, 3); rimLight.position.set(4, 3, -3); scene.add(rimLight);
      const keyLight = new THREE.DirectionalLight(0xffe2b0, 3.4); keyLight.position.set(-3, 4, 5); scene.add(keyLight);
      const sculpture = new THREE.Group(); scene.add(sculpture);
      const bronze = new THREE.MeshStandardMaterial({color:0x806441,metalness:.82,roughness:.32});
      const pale = new THREE.MeshStandardMaterial({color:0xdcc29a,metalness:.7,roughness:.23});
      const black = new THREE.MeshStandardMaterial({color:0x18232c,metalness:.85,roughness:.36});
      const glowMat = new THREE.MeshBasicMaterial({color:new THREE.Color(3.0,1.45,.45),toneMapped:false});
      const wireMat = new THREE.LineBasicMaterial({color:0xae8d60,transparent:true,opacity:.34});
      const ring = (radius,tube,material,arc=Math.PI*2) => new THREE.Mesh(new THREE.TorusGeometry(radius,tube,8,Math.ceil(arc*38),arc),material);
      const inner = ring(1.35,.028,glowMat); sculpture.add(inner);
      const edge = ring(1.415,.008,glowMat); edge.rotation.z=.17; sculpture.add(edge);
      const core = new THREE.Mesh(new THREE.SphereGeometry(1.31,48,32),new THREE.ShaderMaterial({
        uniforms:{uCamera:{value:camera.position}},
        vertexShader:`varying vec3 vNormal; varying vec3 vWorld; void main(){vNormal=normalize(mat3(modelMatrix)*normal);vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`varying vec3 vNormal;varying vec3 vWorld;uniform vec3 uCamera;void main(){float f=pow(1.-max(0.,dot(normalize(vNormal),normalize(uCamera-vWorld))),5.);gl_FragColor=vec4(vec3(.013,.019,.023)+vec3(.27,.14,.045)*f,1.);}`
      })); sculpture.add(core);
      const halo = new THREE.Mesh(new THREE.PlaneGeometry(7.8,7.8),new THREE.ShaderMaterial({
        transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
        uniforms:{uPulse:{value:0},uTime:{value:0}},
        vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
        fragmentShader:`varying vec2 vUv;uniform float uPulse;uniform float uTime;void main(){vec2 p=vUv-.5;float r=length(p);float a=atan(p.y,p.x);float edge=exp(-abs(r-.174)*105.)*.8;float mist=exp(-abs(r-.178)*20.)*.13;float rays=(.6+.4*sin(a*71.+sin(a*9.)*4.+uTime*.05))*exp(-abs(r-.18)*24.)*.08;float mask=smoothstep(.166,.173,r);vec3 col=mix(vec3(.34,.53,.72),vec3(1.,.58,.21),smoothstep(-.4,.5,p.x));float intensity=(edge+mist+rays)*mask;gl_FragColor=vec4(col*(1.+uPulse*2.5),clamp(intensity,0.,1.));}`
      })); halo.position.z=-.02; sculpture.add(halo);
      const orbitRings=[];
      const ringDefs=[{r:2.02,t:.024,rot:[.6,.28,.2]},{r:2.65,t:.04,rot:[.32,-.6,-.35]},{r:3.12,t:.012,rot:[1.0,.2,.55]}];
      ringDefs.forEach((def,idx)=>{
        const g=new THREE.Group(); g.rotation.set(...def.rot);
        const rim=ring(def.r,def.t,idx===1?bronze:pale); g.add(rim);
        g.add(ring(def.r+.085,.006,new THREE.MeshBasicMaterial({color:idx===2?0x7b9bab:0x98774a,transparent:true,opacity:.7})));
        if(idx<2){
          const majorTicks=new THREE.InstancedMesh(new THREE.BoxGeometry(.022,.14,.018),pale,12);
          const minorTicks=new THREE.InstancedMesh(new THREE.BoxGeometry(.009,.055,.018),bronze,60);
          const dummy=new THREE.Object3D();let majorIndex=0,minorIndex=0;
          for(let i=0;i<72;i++){
            const a=i/72*Math.PI*2, major=i%6===0;
            dummy.position.set(Math.cos(a)*(def.r-.12),Math.sin(a)*(def.r-.12),0);dummy.rotation.z=a-Math.PI/2;dummy.updateMatrix();
            if(major)majorTicks.setMatrixAt(majorIndex++,dummy.matrix);else minorTicks.setMatrixAt(minorIndex++,dummy.matrix);
          }g.add(majorTicks,minorTicks);
          for(let j=0;j<4;j++){const arc=ring(def.r+.04,.018,glowMat,.16);arc.rotation.z=j*Math.PI/2;g.add(arc);}
        }
        sculpture.add(g); orbitRings.push(g);
      });
      // Monumental clock hands, suspended rather than attached to an ordinary dial.
      const hands=new THREE.Group();hands.position.z=1.38;
      const hand1=new THREE.Mesh(new THREE.ConeGeometry(.055,1.4,4),pale);hand1.position.y=.9;hands.add(hand1);
      const hand2=new THREE.Mesh(new THREE.ConeGeometry(.04,.9,4),bronze);hand2.position.set(-.45,0,0);hand2.rotation.z=Math.PI/2;hands.add(hand2);
      const axle=new THREE.Mesh(new THREE.OctahedronGeometry(.09),glowMat);hands.add(axle);sculpture.add(hands);
      // Orbital dust is animated in the GPU: no per-frame particle allocation.
      const count=3600, dustGeo=new THREE.BufferGeometry();
      const placeholder=new Float32Array(count*3), params=new Float32Array(count*3), colors=new Float32Array(count*3), sizes=new Float32Array(count);
      for(let i=0;i<count;i++){
        const r=1.6+Math.pow(rnd(),1.8)*4.1; params.set([r,rnd()*Math.PI*2,(rnd()-.5)*(.05+(r-1.6)*.12)],i*3);
        const c=new THREE.Color().setRGB(.4+rnd()*.6,.28+rnd()*.4,.12+rnd()*.24); colors.set([c.r,c.g,c.b],i*3); sizes[i]=rnd()>.98?3.4:.5+rnd()*1.5;
      }
      dustGeo.setAttribute('position',new THREE.BufferAttribute(placeholder,3));dustGeo.setAttribute('aParams',new THREE.BufferAttribute(params,3));dustGeo.setAttribute('aColor',new THREE.BufferAttribute(colors,3));dustGeo.setAttribute('aSize',new THREE.BufferAttribute(sizes,1));
      const dustMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uTime:{value:0},uPulse:{value:0},uRatio:{value:1}},
        vertexShader:`attribute vec3 aParams;attribute vec3 aColor;attribute float aSize;uniform float uTime;uniform float uPulse;uniform float uRatio;varying vec3 vColor;varying float vAlpha;void main(){float r=aParams.x+uPulse*.32;float a=aParams.y+uTime*.085/(r*r);vec3 p=vec3(cos(a)*r,aParams.z,sin(a)*r);vec4 mv=modelViewMatrix*vec4(p,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(aSize*uRatio*14./-mv.z,.5,5.);vColor=aColor;float twinkle=sin(aParams.y*7.+uTime*.13);vAlpha=(.4+.6*twinkle*twinkle)*(1.+uPulse);}`,
        fragmentShader:`varying vec3 vColor;varying float vAlpha;void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;float a=pow(1.-d*2.,1.6);gl_FragColor=vec4(vColor*1.5,a*vAlpha);}`
      });
      const dust=new THREE.Points(dustGeo,dustMat);dust.rotation.set(.34,.05,-.22);dust.frustumCulled=false;scene.add(dust);
      for(let i=0;i<6;i++){
        const pts=[];const r=2.0+i*.48;
        for(let j=0;j<=180;j++){const a=j/180*Math.PI*2;pts.push(new THREE.Vector3(Math.cos(a)*r,0,Math.sin(a)*r));}
        const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),wireMat);line.rotation.copy(dust.rotation);line.material=wireMat.clone();line.material.opacity=.07+i*.015;scene.add(line);
      }
      const starsGeo=new THREE.BufferGeometry(), starsArray=new Float32Array(1200*3);
      for(let i=0;i<1200;i++){starsArray[i*3]=(rnd()-.5)*60;starsArray[i*3+1]=(rnd()-.5)*40;starsArray[i*3+2]=-10-rnd()*35;}
      starsGeo.setAttribute('position',new THREE.BufferAttribute(starsArray,3));const stars=new THREE.Points(starsGeo,new THREE.PointsMaterial({color:0xb9c4cd,size:.018,transparent:true,opacity:.65,sizeAttenuation:true}));scene.add(stars);
      // Broken fragments are dimensional, rough metal, arranged as a quiet explosion.
      const shards=new THREE.Group();const shardData=[];
      for(let i=0;i<32;i++){
        const a=rnd()*Math.PI*2,r=2.8+rnd()*2.5;
        const geom=new THREE.TetrahedronGeometry(.065+rnd()*.12,0);const m=new THREE.Mesh(geom,i%3===0?pale:black);
        m.scale.set(.4+rnd(),1+rnd()*2.5,.4+rnd());m.position.set(Math.cos(a)*r,Math.sin(a)*r*.7,(rnd()-.5)*2.5);m.rotation.set(rnd()*3,rnd()*3,rnd()*3);shards.add(m);shardData.push({mesh:m,y:m.position.y,phase:rnd()*6.28});
      }scene.add(shards);
      // Three explorable coordinates correspond to the actual biography below.
      const coordDefs=[{id:'education',position:new THREE.Vector3(-2.4,.6,.7),text:'教育｜把學習目標設計成可以實作的任務。'}, {id:'technology',position:new THREE.Vector3(1.7,1.9,.2),text:'科技｜把程式開發與 AI 應用，做成可以使用的工具。'}, {id:'creativity',position:new THREE.Vector3(1.3,-1.7,1),text:'創作｜讓抽象構想變成可以操作、測試與改良的作品。'}];
      let selected=-1, pulse=0, simTime=0, last=performance.now(), frames=0, activeTouch=false;
      const projection=new THREE.Vector3(); const nodeMeshes=[];
      const setCoordinate=(i)=>{
        selected=i;pulse=.7;const c=coordDefs[i];
        document.querySelectorAll('.time-node').forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));
        document.querySelectorAll('[data-bio]').forEach(el=>el.classList.toggle('coordinate-highlight',el.dataset.bio.split(' ').includes(c.id)));
        announce(c.text);document.querySelector('#time-instructions').textContent=c.text;wake();
      };
      coordDefs.forEach((c,i)=>{
        const group=new THREE.Group();group.position.copy(c.position);
        const point=new THREE.Mesh(new THREE.OctahedronGeometry(.07),glowMat);group.add(point);sculpture.add(group);nodeMeshes.push(group);
        document.querySelector(`[data-coordinate="${c.id}"]`).addEventListener('click',()=>setCoordinate(i));
      });
      let dragging=false,down=null;
      canvas.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};dragging=true;wake();});
      canvas.addEventListener('pointerup',e=>{dragging=false;if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<6){pulse=.35;wake();}down=null;});
      canvas.addEventListener('pointercancel',()=>{dragging=false;down=null;});
      controls.addEventListener('start',()=>{dragging=true;wake();});controls.addEventListener('end',()=>{dragging=false;wake();});controls.addEventListener('change',()=>wake());
      reset.addEventListener('click',()=>{original();pulse=.25;announce('已重設視角。');wake();});
      rebirth.addEventListener('click',()=>{simTime=0;pulse=1.2;setFlow(motion.matches?0:1);original();announce('時間重生，回到起點。');wake();});
      touchStart.addEventListener('click',()=>{activeTouch=!activeTouch;controls.enabled=activeTouch;controls.enableZoom=activeTouch;canvas.style.touchAction=activeTouch?'none':'pan-y';touchStart.textContent=activeTouch?'完成探索 · 繼續閱讀 ↓':'開始探索 ↗';touchStart.setAttribute('aria-pressed',String(activeTouch));if(activeTouch)canvas.focus({preventScroll:true});});
      canvas.addEventListener('keydown',e=>{
        const keys=['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-',' ','r','R','Escape'];if(!keys.includes(e.key))return;e.preventDefault();
        if(e.key===' '){setFlow(speed?0:lastSpeed);return;}if(e.key.toLowerCase()==='r'){original();wake();return;}
        if(e.key==='Escape'){activeTouch=false;controls.enabled=!mobile.matches;canvas.style.touchAction=mobile.matches?'pan-y':'none';touchStart.textContent='開始探索 ↗';touchStart.setAttribute('aria-pressed','false');canvas.blur();return;}
        const offset=camera.position.clone().sub(controls.target);const spherical=new THREE.Spherical().setFromVector3(offset);
        if(e.key==='ArrowLeft')spherical.theta-=.12;if(e.key==='ArrowRight')spherical.theta+=.12;if(e.key==='ArrowUp')spherical.phi-=.1;if(e.key==='ArrowDown')spherical.phi+=.1;
        if(e.key==='+'||e.key==='=')spherical.radius*=.91;if(e.key==='-')spherical.radius*=1.09;
        spherical.phi=clamp(spherical.phi,.25,Math.PI-.25);spherical.radius=clamp(spherical.radius,6.2,20);camera.position.copy(new THREE.Vector3().setFromSpherical(spherical).add(controls.target));controls.update();wake();
      });
      function resize(){const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setPixelRatio(renderScale(w,h,devicePixelRatio,light));renderer.setSize(w,h,false);dustMat.uniforms.uRatio.value=renderer.getPixelRatio();dustGeo.setDrawRange(0,light?1400:count);quality.setAttribute('aria-pressed',String(light));wake();}
      const ro=new ResizeObserver(resize);ro.observe(host);
      quality.addEventListener('click',()=>{light=!light;resize();announce(light?'已使用輕量模式。':'已使用標準模式。');});
      function frame(now){
        animationId=0;if(!visible||document.hidden||failed)return;
        const dt=Math.min((now-last)/1000,.05);last=now;simTime+=dt*speed;pulse=Math.max(0,pulse-dt*.65);
        sculpture.rotation.y=Math.sin(simTime*.025)*.14;sculpture.rotation.z=Math.sin(simTime*.018)*.035;
        orbitRings[0].rotation.z=.2+simTime*.019;orbitRings[1].rotation.z=-.35-simTime*.012;orbitRings[2].rotation.y=.2+simTime*.021;
        hands.rotation.z=-simTime*.045;dustMat.uniforms.uTime.value=simTime;dustMat.uniforms.uPulse.value=pulse;halo.material.uniforms.uPulse.value=pulse;halo.material.uniforms.uTime.value=simTime;
        inner.scale.setScalar(1+Math.sin(simTime*.6)*.004+pulse*.006);
        for(const d of shardData){d.mesh.position.y=d.y+Math.sin(simTime*.15+d.phase)*.12;d.mesh.rotation.y+=dt*speed*.025;}
        controls.update();scene.updateMatrixWorld();
        coordDefs.forEach((c,i)=>{
          nodeMeshes[i].getWorldPosition(projection);projection.project(camera);
          const el=document.querySelector(`[data-coordinate="${c.id}"]`);const w=host.clientWidth,h=host.clientHeight;
          let x=(projection.x*.5+.5)*w,y=(-projection.y*.5+.5)*h;
          // Keep controls on canvas and away from the biography at all orbit angles.
          const bioLeft=document.querySelector('.studio-copy').getBoundingClientRect().left-host.getBoundingClientRect().left;
          x=clamp(x,55,mobile.matches?w-70:Math.min(w-90,bioLeft-85));y=clamp(y,mobile.matches?180:280,mobile.matches?400:h-260);
          el.style.left=`${x}px`;el.style.top=`${y}px`;el.style.opacity=projection.z<1?'1':'0';
        });
        renderer.render(scene,camera);frames++;if(frames%60===0)root.dataset.frames=String(frames);
        if(!animationId && (speed||pulse>.001||dragging)) animationId=requestAnimationFrame(frame);
      }
      wake=()=>{if(!animationId&&visible&&!document.hidden&&!failed){last=performance.now();animationId=requestAnimationFrame(frame);}};
      document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(animationId);animationId=0;}else wake();});
      motion.addEventListener('change',e=>{if(e.matches)setFlow(0);});
      mobile.addEventListener('change',()=>{activeTouch=false;touchStart.textContent='開始探索 ↗';touchStart.setAttribute('aria-pressed','false');controls.enabled=!mobile.matches;controls.enableZoom=!mobile.matches;canvas.style.touchAction=mobile.matches?'pan-y':'none';original();resize();});
      canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(animationId);animationId=0;setUnavailable('3D 顯示暫停，請重新整理再試。個人介紹不受影響。');});
      cleanUp=()=>{cancelAnimationFrame(animationId);ro.disconnect();controls.dispose();renderer.dispose();scene.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose();}});};
      window.addEventListener('pagehide',e=>{if(!e.persisted)cleanUp();});
      resize();root.dataset.ready='true';announce('時間裝置已就緒。可拖曳旋轉，調節時間流速，或探索三個創作座標。');wake();
    } catch(error){console.warn('Time experience unavailable:',error.message);setUnavailable('你的瀏覽器暫時未能啟動 3D 裝置，已改用靜態畫面。個人介紹仍可完整閱讀。');}
  }
  const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible){init();wake();}else{cancelAnimationFrame(animationId);animationId=0;}},{rootMargin:'150px'});
  observer.observe(document.querySelector('.time-exhibit'));
}
