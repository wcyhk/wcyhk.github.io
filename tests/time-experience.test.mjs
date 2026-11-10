import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {clamp,flowLabel,renderScale,seededRandom,particlePosition} from '../time-math.mjs';
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=readFileSync(new URL('../time-experience.js',import.meta.url),'utf8');
const css=readFileSync(new URL('../time-experience.css',import.meta.url),'utf8');
test('Time flow handles forward, stopped and reverse values',()=>{assert.equal(flowLabel(1),'時間流動');assert.equal(flowLabel(0),'時間凝止');assert.equal(flowLabel(-1),'時間倒流');assert.equal(clamp(3,-1,1),1);assert.equal(clamp(-5,-1,1),-1);});
test('Resolution is bounded for high DPI desktops and mobile',()=>{assert.ok(renderScale(3840,2160,3)<=Math.sqrt(2200000/(3840*2160)));assert.equal(renderScale(390,605,3,true),1);assert.equal(renderScale(900,930,3),1.6);});
test('Deterministic geometry remains finite',()=>{const a=seededRandom(10),b=seededRandom(10);for(let i=0;i<100;i++){assert.equal(a(),b());const p=particlePosition(3,i,.5);assert.ok(p.every(Number.isFinite));assert.ok(Math.abs(p[0]**2+p[2]**2-9)<1e-10);}});
test('Accessible controls and biography coexist without a canvas dependency',()=>{for(const id of ['time-canvas','time-flow','time-pause','time-rebirth','time-reset','time-quality','time-touch-start','time-status'])assert.ok(html.includes(`id="${id}"`));assert.ok(html.includes('aria-live="polite"'));assert.ok(html.includes('tabindex="0"'));assert.ok(html.includes('專業資格與學歷'));assert.ok(html.includes('STEM 陀螺'));});
test('Rendering is lazy, stops offscreen, handles loss and reduced motion',()=>{for(const item of ['IntersectionObserver','document.hidden','webglcontextlost','prefers-reduced-motion','ResizeObserver','requestAnimationFrame','cancelAnimationFrame','renderer.dispose()'])assert.ok(js.includes(item),item);assert.ok(css.includes('pan-y'));assert.ok(js.includes("canvas.style.touchAction=activeTouch?'none':'pan-y'"));});
test('Three.js is vendored locally, licensed, with no runtime third party APIs',()=>{assert.ok(js.includes("import('./assets/vendor/three.module.js')"));assert.ok(!js.includes('fetch('));assert.ok(readFileSync(new URL('../assets/vendor/three.LICENSE',import.meta.url),'utf8').includes('MIT License'));});
test('Intro uses distinct desktop and narrow-screen layouts',()=>{assert.ok(css.includes('@media(max-width:720px)'));assert.ok(css.includes('grid-template-columns:minmax(0,1fr)'));assert.ok(css.includes('font-size:16px;line-height:1.95'));assert.ok(css.includes('.time-studio .studio-qualifications ul'));});
test('Gallery blends into About without obscuring text or input',()=>{assert.match(html,/<div class="worlds-time-transition" aria-hidden="true"><\/div>\s*<section class="studio/);assert.ok(css.includes('#f5f2e9 0%'));assert.ok(css.includes('#090c10 100%'));assert.ok(css.includes('.worlds-time-transition{height:110px}'));assert.match(css,/\.worlds-time-transition\{[^}]*pointer-events:none/);});

test('GPU effects and reset avoid cross-driver visual artifacts',()=>{assert.ok(!js.includes('pow(sin('));assert.ok(js.includes('twinkle*twinkle'));assert.ok(js.includes('hands.position.z=1.38'));assert.ok(js.includes('clamp(intensity,0.,1.)'));assert.ok(js.includes('controls.enableDamping = false; controls.update(); controls.enableDamping = damping'));});

test('Header keeps the exact confirmed Instagram destination',()=>{assert.match(html,/<a class="social-icon" href="https:\/\/www\.instagram\.com\/\_\_ansonw\_\_\/"[^>]+aria-label="Instagram @\_\_ansonw\_\_">/);const header=html.split('</header>')[0];assert.ok(header.indexOf('aria-label="YouTube 頻道"')<header.indexOf('aria-label="Instagram'));assert.ok(header.indexOf('aria-label="Instagram')<header.indexOf('class="header-cta"'));});
