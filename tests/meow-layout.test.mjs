import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const base=existsSync(new URL('../dist/styles.css',import.meta.url))?'../dist/':'../';
const read=path=>readFileSync(new URL(`${base}${path}`,import.meta.url));
const css=read('styles.css').toString(),app=read('app.js').toString();
const {projects}=await import(new URL(`${base}projects.js`,import.meta.url));
const meow=projects.find(p=>p.id==='meow');
test('Eclipse edition, official title art and both play links are aligned',()=>{
 assert.equal(meow.title,'貓貓啟示錄｜緋月之森');
 assert.equal(meow.url,'https://wcy.hk/meow-revelation/eclipse/');
 assert.equal(meow.extraUrl,'https://wcy.hk/meow-revelation/');
 assert.match(meow.extraLabel,/最後一盞潮燈/);
 assert.equal(meow.image,'assets/meow-eclipse-cover.webp');
 assert.equal(meow.posterImage,'assets/meow-eclipse-portrait.webp');
 for(const a of [meow.image,meow.posterImage]) assert.equal(read(a).toString('ascii',8,12),'WEBP');
 assert.match(app,/p.extraLabel\?bonusLink/);
});
test('Eclipse artwork uses non-cropping on spotlight, card, detail and poster download',()=>{
 assert.match(css,/meow-eclipse-cover.webp"\]\{object-fit:contain/);
 assert.match(css,/data-project="meow"\] \.poster img\{object-fit:contain/);
 assert.match(css,/aspect-ratio:3\/2;object-fit:contain/);
 assert.match(app,/Math\.min\(1600\/image.width,1600\/image.height\)/);
});
