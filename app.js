import {createSpotlightCarousel} from './carousel.js';
import {createRepositoryFeed,selectLatestRepositories} from './latest-projects.js';
import {buildCatalog,countCategories,selectSpotlightProjectIds} from './catalog.js';
import {latestSnapshot} from './latest-snapshot.js';
import {projects,channel} from './projects.js';
const $=s=>document.querySelector(s);
let spotlightCarousel;
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let catalog=buildCatalog(latestSnapshot,projects);
const projectById=id=>catalog.find(p=>p.id===id)||projects.find(p=>p.id===id);
const external=(url,text,classes='')=>`<a class="${classes}" href="${escapeHTML(url)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
const videoAction=(p,classes='')=>p.video?`<button class="${classes}" data-video="${p.id}" aria-label="觀看${escapeHTML(p.title)}示範影片">▷ 示範影片</button>`:external(channel,'▷ YouTube 頻道',classes);
const trailerAction=(p,classes='')=>p.trailer?`<button class="${classes}" data-trailer="${p.id}" aria-label="觀看${escapeHTML(p.title)}作品宣傳片">▶ 宣傳片</button>`:'';
let filter='all',query='';
function renderProjects(){
 const found=catalog.filter(p=>(filter==='all'||p.category===filter)&&`${escapeHTML(p.title)} ${escapeHTML(p.english)} ${p.repo} ${escapeHTML(p.description)} ${escapeHTML(p.categoryName)}`.toLocaleLowerCase().includes(query));
 $('#project-grid').innerHTML=found.map((p,i)=>`<article class="project-card" data-project="${p.id}" style="--accent:${p.accent};animation-delay:${Math.min(i,5)*40}ms"><button class="poster" data-details="${p.id}" aria-label="查看${escapeHTML(p.title)}作品詳情"><img src="${p.posterImage||p.image}" alt="${escapeHTML(p.title)}${p.autoDiscovered?'共用動漫概念封面':'日系動漫概念海報'}" loading="lazy" width="1024" height="1240"><span class="poster-frame" aria-hidden="true"></span><span class="poster-topline"><span>WCY.HK STUDIO</span><span class="poster-badge">${escapeHTML(p.label)}</span></span><span class="poster-title"><small>${escapeHTML(p.english)}</small><h3>${escapeHTML(p.title)}</h3><p>${escapeHTML(p.tagline)}</p></span><span class="poster-view" aria-hidden="true">↗</span></button><div class="card-body"><div class="card-category"><span>${escapeHTML(p.categoryName)}</span><span>NO. ${p.number}</span></div><p class="card-description">${escapeHTML(p.description)}</p><div class="card-actions">${p.url?external(p.url,`${p.category==='gateway'?'開啟入口':'開啟作品'} ↗`,'card-open'):`<button class="card-open" data-video="${p.id}">觀看示範 ↗</button>`}<div class="card-secondary">${trailerAction(p)}${videoAction(p)}${external(p.github,'GitHub ↗')}</div></div></div></article>`).join('');
 $('#empty-state').hidden=found.length>0;
 $('#filter-status').textContent=`顯示 ${found.length} 個作品`;
}
let spotlightArtworkRequest=0;
async function setSpotlight(id){
 const p=projectById(id);if(!p)return false;
 const image=$('#spotlight-art'),previous=$('#spotlight-art-previous'),request=++spotlightArtworkRequest;
 if(image.getAttribute('src')!==p.image){
  const preload=new Image();preload.src=p.image;
  try{await preload.decode();}catch{return false;}
 }
 if(request!==spotlightArtworkRequest)return false;
 const change=image.getAttribute('src')!==p.image;
 const fade=change&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
 previous.src=image.currentSrc||image.src;
 previous.classList.toggle('is-visible',fade);
 image.src=p.image;image.alt=`${p.title}原創動漫概念插圖`;
 const primary=p.url?external(p.url,'開啟作品 <span>↗</span>','button button-gold'):p.video?`<button class="button button-gold" data-video="${p.id}">觀看示範 ▷</button>`:external(p.github,'前往專案 <span>↗</span>','button button-gold');
 $('#spotlight-copy').innerHTML=`<span class="spotlight-category">${escapeHTML(p.categoryName)}</span><h3>${escapeHTML(p.title)}</h3><p class="spotlight-en">${escapeHTML(p.english)}</p><p class="spotlight-tagline">${escapeHTML(p.tagline)}</p><p class="spotlight-description">${escapeHTML(p.description)}</p><div class="spotlight-actions">${primary}<button class="text-link" data-details="${p.id}">了解更多 ＋</button></div>`;
 $('#spotlight').dataset.activeProject=p.id;
 document.querySelectorAll('[data-feature]').forEach(button=>button.classList.toggle('active',button.dataset.feature===p.id));
 if(fade)requestAnimationFrame(()=>requestAnimationFrame(()=>{if(request===spotlightArtworkRequest)previous.classList.remove('is-visible');}));
 return true;
}
function renderCarouselState(state){
 const section=$('#spotlight');section.dataset.carouselState=state.playing?'playing':'paused';section.dataset.carouselProjects=state.items.join(',');section.setAttribute('aria-busy',String(state.loading));
 const reasons=state.pausedReasons;
 $('#carousel-hint').textContent=reasons.includes('hover')?'滑鼠移入，輪播暫停':reasons.includes('keyboard')?'操作中，輪播暫停':reasons.includes('reduced-motion')?'自動播放已關閉':'每 6 秒切換；滑鼠移入或鍵盤操作時暫停。';
}
function initializeSpotlightCarousel(){
 const section=$('#spotlight');
 spotlightCarousel=createSpotlightCarousel({items:selectSpotlightProjectIds(latestSnapshot,catalog),onChange:setSpotlight,onState:renderCarouselState});
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 spotlightCarousel.setPaused('reduced-motion',motion.matches);spotlightCarousel.setPaused('hidden',document.hidden);spotlightCarousel.setPaused('offscreen',true);
 motion.addEventListener('change',event=>spotlightCarousel.setPaused('reduced-motion',event.matches));
 section.addEventListener('pointerenter',event=>{if(event.pointerType!=='touch')spotlightCarousel.setPaused('hover',true);});
 section.addEventListener('pointerleave',event=>{if(event.pointerType!=='touch')spotlightCarousel.setPaused('hover',false);});
 section.addEventListener('pointerdown',()=>spotlightCarousel.setPaused('keyboard',false));
 section.addEventListener('focusin',event=>{if(event.target.matches(':focus-visible'))spotlightCarousel.setPaused('keyboard',true);});
 section.addEventListener('focusout',event=>{if(!section.contains(event.relatedTarget))spotlightCarousel.setPaused('keyboard',false);});
 document.addEventListener('visibilitychange',()=>spotlightCarousel.setPaused('hidden',document.hidden));
 const observer=new IntersectionObserver(entries=>{for(const entry of entries)spotlightCarousel.setPaused('offscreen',entry.intersectionRatio<.2);},{threshold:[0,.2]});observer.observe(section);
 for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('close',()=>spotlightCarousel.setPaused('dialog',!!document.querySelector('dialog[open]')));
 spotlightCarousel.start();
}
function updateSpotlightDeck(repositories){
 spotlightCarousel.setItems(selectSpotlightProjectIds(repositories,catalog));
}
function showProject(id){
 const p=projectById(id);if(!p)return;
 $('#dialog-content').innerHTML=`<div class="dialog-layout"><div class="dialog-art"><img src="${p.posterImage||p.image}" alt="${escapeHTML(p.title)}原創動漫海報"><span class="dialog-art-caption">WCY.HK STUDIO · ORIGINAL PROJECT ${p.number}</span></div><div class="dialog-copy"><span class="spotlight-category">${escapeHTML(p.categoryName)}</span><h2 id="dialog-title">${escapeHTML(p.title)}</h2><p class="spotlight-en">${escapeHTML(p.english)}</p><p class="spotlight-tagline">${escapeHTML(p.tagline)}</p><p class="dialog-description">${escapeHTML(p.description)}</p><ul class="feature-list">${p.features.map(f=>`<li>${escapeHTML(f)}</li>`).join('')}</ul><div class="dialog-actions">${p.url?external(p.url,`${p.category==='gateway'?'開啟入口':'開啟作品'} ↗`,'button button-gold'):`<button class="button button-gold" data-video="${p.id}">觀看作品示範 ▷</button>`}${trailerAction(p,'button button-outline')}${videoAction(p,'button button-outline')}${external(p.github,'GitHub 程式碼 ↗','button button-outline')}${p.extraUrl?external(p.extraUrl,'鄰伴平台入口 ↗','button button-outline'):''}</div>${!p.video?'<p class="video-fallback">此作品暫未收錄獨立示範影片，可前往 YouTube 頻道查看。</p>':''}<p class="dialog-note">${escapeHTML(p.note)}</p>${p.autoDiscovered?'':`<button class="poster-download" data-poster="${p.id}">↓ 下載這張作品海報</button>`}</div></div>`;
 spotlightCarousel?.setPaused('dialog',true);$('#project-dialog').showModal();
}
function showVideo(id){
 const p=projectById(id);if(!p?.video)return;
 $('#video-title').textContent=`${escapeHTML(p.title)}｜示範影片`;
 $('#video-content').innerHTML=`<iframe class="video-frame" src="https://www.youtube-nocookie.com/embed/${p.video}?rel=0" title="${escapeHTML(p.title)}示範影片" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>${external(`https://www.youtube.com/watch?v=${p.video}`,'影片無法播放？前往 YouTube 觀看 ↗','video-direct')}`;
 spotlightCarousel?.setPaused('dialog',true);$('#video-dialog').showModal();
}
function showTrailer(id){
 const p=projectById(id);if(!p?.trailer)return;
 $('#video-title').textContent=`${p.title}｜作品宣傳片`;
 $('#video-content').innerHTML=`<video class="video-frame" controls playsinline preload="metadata" poster="${escapeHTML(p.image)}" aria-label="${escapeHTML(p.title)}作品宣傳片"><source src="${escapeHTML(p.trailer)}" type="video/mp4"></video><p class="video-direct">原創動漫概念視覺、實際操作節錄、彈出字幕及原創配樂音效；縮時及功能限制已在影片標示。</p>`;
 spotlightCarousel?.setPaused('dialog',true);$('#video-dialog').showModal();
 $('#video-content video').play().catch(()=>{});
}
function notify(message){$('#toast').textContent=message;$('#toast').classList.add('visible');clearTimeout(notify.timer);notify.timer=setTimeout(()=>$('#toast').classList.remove('visible'),3500)}
async function downloadPoster(id,button){
 const p=projectById(id);if(!p)return;button.disabled=true;const original=button.textContent;button.textContent='正在製作海報…';
 try{
  await document.fonts.ready;
  const image=new Image();image.src=p.posterImage||p.image;await image.decode();
  const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=2200;const ctx=canvas.getContext('2d');
  ctx.fillStyle='#0b1729';ctx.fillRect(0,0,1600,2200);
  const scale=Math.max(1600/image.width,1900/image.height),w=image.width*scale,h=image.height*scale;ctx.drawImage(image,(1600-w)/2,p.posterImage?0:(1900-h)/2,w,h);
  const shade=ctx.createLinearGradient(0,1150,0,2100);shade.addColorStop(0,'rgba(7,17,34,0)');shade.addColorStop(.65,'rgba(7,17,34,.94)');shade.addColorStop(1,'#071122');ctx.fillStyle=shade;ctx.fillRect(0,1100,1600,1100);
  ctx.strokeStyle='#d9c199';ctx.lineWidth=2;ctx.strokeRect(46,46,1508,2108);ctx.fillStyle='#e6d4b2';ctx.font='500 25px "Noto Sans TC",sans-serif';ctx.fillText('WCY.HK STUDIO',88,115);ctx.textAlign='right';ctx.fillText(`ORIGINAL WORLD / ${p.number}`,1512,115);ctx.textAlign='left';
  ctx.fillStyle=p.accent;ctx.font='500 31px "Noto Sans TC",sans-serif';ctx.fillText(p.english,100,1750);
  let fontSize=86;ctx.font=`700 ${fontSize}px "Noto Serif TC",serif`;while(ctx.measureText(p.title).width>1390&&fontSize>45){fontSize-=2;ctx.font=`700 ${fontSize}px "Noto Serif TC",serif`}
  ctx.fillStyle='#fff8e8';ctx.fillText(p.title,100,1880);
  ctx.font='400 35px "Noto Sans TC",sans-serif';ctx.fillStyle='#d5dbe4';ctx.fillText(p.tagline,105,1960);
  ctx.strokeStyle='#d9c19980';ctx.beginPath();ctx.moveTo(100,2020);ctx.lineTo(1500,2020);ctx.stroke();ctx.font='400 21px "Noto Sans TC",sans-serif';ctx.fillStyle='#a0aabb';ctx.fillText(`${escapeHTML(p.categoryName)}  ·  AN ORIGINAL PROJECT BY WCY.HK STUDIO`,105,2080);ctx.font='400 17px "Noto Sans TC",sans-serif';ctx.fillText('原創概念插圖 · 實際內容請以作品網站為準',105,2120);
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('海報輸出失敗')),'image/png'));
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`WCY.HK-STUDIO-${p.repo}-poster.png`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),10000);notify('作品海報已準備好，開始下載。');
 }catch(error){console.error(error);notify('海報暫時未能下載，請稍後再試。')}finally{button.disabled=false;button.textContent=original}
}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-details],[data-video],[data-trailer],[data-spotlight],[data-feature],[data-poster],[data-carousel-next],[data-carousel-previous]');if(!button)return;
 if(button.dataset.details)showProject(button.dataset.details);
 if(button.dataset.video)showVideo(button.dataset.video);
 if(button.dataset.trailer)showTrailer(button.dataset.trailer);
 if(button.dataset.spotlight)spotlightCarousel.select(button.dataset.spotlight);
 if(button.dataset.feature){event.preventDefault();spotlightCarousel.select(button.dataset.feature,{source:'latest'});if(location.hash!=='#spotlight')history.pushState(null,'','#spotlight');$('#spotlight').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}
 if(button.dataset.poster)downloadPoster(button.dataset.poster,button);
 if(button.hasAttribute('data-carousel-next'))spotlightCarousel.next();
 if(button.hasAttribute('data-carousel-previous'))spotlightCarousel.previous();
});
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.filter;document.querySelectorAll('[data-filter]').forEach(b=>{const active=b===button;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});renderProjects()}));
$('#project-search').addEventListener('input',event=>{query=event.target.value.trim().toLocaleLowerCase();renderProjects()});
$('.dialog-close').addEventListener('click',()=>$('#project-dialog').close());
$('.video-close').addEventListener('click',()=>$('#video-dialog').close());
$('#video-dialog').addEventListener('close',()=>{$('#video-content').innerHTML=''});
for(const dialog of document.querySelectorAll('dialog'))dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close()});
const toggle=$('.menu-toggle'),mobile=$('.mobile-nav');toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!open));toggle.setAttribute('aria-label',open?'開啟選單':'關閉選單');mobile.hidden=open});
mobile.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{mobile.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','開啟選單')}));
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting)document.querySelectorAll('.desktop-nav a').forEach(a=>a.classList.toggle('active',a.hash===`#${entry.target.id}`))})},{rootMargin:'-15% 0px -60% 0px'});document.querySelectorAll('main>section[id]').forEach(section=>observer.observe(section))}
renderProjects();initializeSpotlightCarousel();

function renderLatestRail(repositories,{source}){
 const rail=$('.release-rail');
 const label='<div class="rail-label"><span class="live-dot"></span> LATEST WORLDS<small>最新作品</small></div>';
 const items=repositories.map((repo,index)=>{
  const known=catalog.find(p=>p.repo.toLowerCase()===repo.name.toLowerCase());
  const title=known?.title || repo.name.replace(/[-_]+/g,' ');
  const date=repo.created_at.slice(0,10).replaceAll('-','.');
  const contents=`<span class="release-number">${String(index+1).padStart(2,'0')}</span><span class="release-copy"><span class="release-title">${escapeHTML(title)}</span><small><time datetime="${escapeHTML(repo.created_at)}">${date}</time> · ${escapeHTML(repo.name.toUpperCase())}</small></span><span class="release-arrow" aria-hidden="true">↗</span>`;
  const classes=`release-item${spotlightCarousel?.current===known?.id?' active':''}`;
  return known?`<a class="${classes}" href="#spotlight" data-feature="${known.id}" data-latest-repo="${escapeHTML(repo.name)}" aria-label="最新作品：${escapeHTML(title)}，查看大圖">${contents}</a>`:'';
 }).join('');
 rail.innerHTML=label+items+(repositories.length?'':'<a class="release-item" href="https://github.com/wcyhk?tab=repositories" target="_blank" rel="noopener noreferrer">探索更多作品 ↗</a>');
 rail.dataset.syncSource=source;
 $('#latest-status').textContent=source==='live'?'已顯示 GitHub 最新建立的公開作品。':'顯示最近一次取得的作品列表。';
}
let latestStorage;try{latestStorage=localStorage;}catch{}
let catalogSignature='';
function syncPublicProjects(repositories,state){
 const next=buildCatalog(repositories,projects),signature=JSON.stringify(next);
 if(signature!==catalogSignature){
  catalog=next;catalogSignature=signature;
  const counts=countCategories(catalog);
  document.querySelectorAll('[data-filter]').forEach(button=>{
   const count=counts[button.dataset.filter]||0;
   button.querySelector('span').textContent=count;
   if(button.dataset.filter==='new')button.hidden=count===0;
  });
  $('.collection-count strong').textContent=catalog.length;
  if(filter==='new'&&!counts.new){filter='all';document.querySelectorAll('[data-filter]').forEach(b=>{const active=b.dataset.filter==='all';b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active))});}
  renderProjects();
 }
 $('#project-grid').dataset.syncSource=state.source;
 renderLatestRail(selectLatestRepositories(repositories),state);
 updateSpotlightDeck(repositories);
}
const latestFeed=createRepositoryFeed({initialRepositories:latestSnapshot,render:syncPublicProjects,storage:latestStorage});
latestFeed.refresh();
setInterval(()=>{if(!document.hidden)latestFeed.refresh();},5*60*1000);
const refreshOnReturn=()=>{if(!document.hidden && Date.now()-latestFeed.lastSuccess>=60*1000)latestFeed.refresh();};
window.addEventListener('focus',refreshOnReturn);
document.addEventListener('visibilitychange',refreshOnReturn);
