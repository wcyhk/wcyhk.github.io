import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const base=existsSync(new URL('../dist/styles.css',import.meta.url))?'../dist/':'../';
const read=path=>readFileSync(new URL(`${base}${path}`,import.meta.url));
const css=read('styles.css').toString(),app=read('app.js').toString();
const {projects}=await import(new URL(`${base}projects.js`,import.meta.url));
const meow=projects.find(p=>p.id==='meow');
test('Eclipse edition, official title art and single play link are aligned',()=>{
 assert.equal(meow.title,'貓貓啟示錄｜緋月之森');
 assert.equal(meow.url,'https://wcy.hk/meow-revelation/eclipse/');
 assert.equal(meow.extraUrl,undefined);
 assert.doesNotMatch(JSON.stringify(meow),/最後一盞潮燈/);
 assert.equal(meow.image,'assets/meow-eclipse-cover.webp');
 assert.equal(meow.posterImage,'assets/meow-eclipse-portrait.webp');
 for(const a of [meow.image,meow.posterImage]) assert.equal(read(a).toString('ascii',8,12),'WEBP');
});
test('Eclipse artwork fills the spotlight and card, with protected framing',()=>{
 assert.match(css,/meow-eclipse-cover.webp"\]\{object-fit:cover/);
 assert.match(css,/data-project="meow"\] \.poster img\{object-fit:cover/);
 assert.match(css,/aspect-ratio:3\/2;object-fit:cover/);
 assert.match(app,/Math\.min\(1600\/image.width,1600\/image.height\)/);
});
