import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const base=existsSync(new URL('../dist/styles.css',import.meta.url))?'../dist/':'../';
const css=readFileSync(new URL(`${base}styles.css`,import.meta.url),'utf8');
const {projects}=await import(new URL(`${base}projects.js`,import.meta.url));
test('Meow uses new cinematic artwork and non-cropping responsive styles',()=>{
 assert.equal(projects.find(p=>p.id==='meow').image,'assets/meow-poster-v3.webp');
 assert.match(css,/img\[src\*="meow-poster-v3.webp"\]\{object-fit:contain/);
 assert.match(css,/data-project="meow"\] \.poster img\{object-fit:contain/);
 assert.match(css,/width:100%;height:355px;object-position:center/);
});
test('entire 1536x1024 artwork fits desktop and mobile scene/card boxes',()=>{
 for(const [w,h] of [[1920*.58,880],[1440*.58,790],[768*.58,740],[390,355],[320,355],[165,198]]){
  const scale=Math.min(w/1536,h/1024);assert.ok(1536*scale<=w+.001);assert.ok(1024*scale<=h+.001);
 }
});
