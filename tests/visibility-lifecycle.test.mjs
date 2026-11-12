import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../time-experience.js',import.meta.url),'utf8');
test('scene prepares on entry without advancing outside actual viewport',()=>{
 assert.ok(source.includes("observer.observe($('.time-exhibit'));"));
 assert.match(source,/\/\/ Prepare assets and scene on entry[\s\S]*init\(\);/);
 assert.match(source,/rootMargin:'0px',threshold:0/);
 assert.match(source,/raf=0;if\(!visible\|\|document.hidden\|\|failed\|\|disposed\)return;/);
 assert.match(source,/if\(!raf&&visible&&!document.hidden&&!failed&&!disposed\)/);
 assert.match(source,/else\{cancelAnimationFrame\(raf\);raf=0;\}/);
});
test('reduced motion does not run automatic siege countdown',()=>{
 assert.ok(source.includes('advanceSiege(siegeElapsed,dt,storyVisible&&!motion.matches,journey.complete)'));
 assert.ok(source.includes('const siegeMoving=storyVisible&&!motion.matches&&!journey.complete'));
});
