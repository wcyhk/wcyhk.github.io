import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../neighbour/entry.mjs',import.meta.url),'utf8');
function fixture(){const frames=[],timers=[],destinations=[];vm.runInNewContext(source,{window:{location:{replace:url=>destinations.push(url)}},requestAnimationFrame:cb=>frames.push(cb),setTimeout:cb=>timers.push(cb)});return {frames,timers,destinations}}
test('first paint then fixed automatic navigation happens once',()=>{const f=fixture();assert.equal(f.destinations.length,0);f.frames.shift()();assert.equal(f.destinations.length,0);f.frames.shift()();f.timers.shift()();assert.deepEqual(f.destinations,['https://neighbour-yuenhk-live.onrender.com/'])});
test('background-tab fallback does not wait indefinitely for animation frames',()=>{const f=fixture();f.timers.shift()();f.frames.shift()();f.frames.shift()();assert.equal(f.destinations.length,1)});
