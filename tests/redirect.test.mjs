import {test} from 'node:test';
import assert from 'node:assert/strict';
import {destinationFor} from '../redirect.mjs';

test('old printed entry links retain their query and bookmark',()=>{
  assert.equal(destinationFor('https://wcy.hk/qingming-hand-treasure/?v=e1a1131#start'), 'https://wcy.hk/QingMing-Hand-Treasure/?v=e1a1131#start');
  assert.equal(destinationFor('https://wcy.hk/qingming-hand-treasure'), 'https://wcy.hk/QingMing-Hand-Treasure/');
});
test('case variants and deep links point to the same destination host',()=>{
  assert.equal(destinationFor('https://wcy.hk/QINGMING-HAND-TREASURE/assets/public-poster/landscape.pdf'), 'https://wcy.hk/QingMing-Hand-Treasure/assets/public-poster/landscape.pdf');
  assert.equal(destinationFor('https://wcy.hk/qingming-hand-treasure/?next=https://example.com/'), 'https://wcy.hk/QingMing-Hand-Treasure/?next=https://example.com/');
});
test('canonical links do not loop and unrelated paths are left alone',()=>{
  assert.equal(destinationFor('https://wcy.hk/QingMing-Hand-Treasure/'), null);
  assert.equal(destinationFor('https://wcy.hk/other-project/'), null);
  assert.equal(destinationFor('https://wcy.hk/qingming-hand-treasure-other/'), null);
  assert.equal(destinationFor('https://wcy.hk/'), 'https://wcy.hk/QingMing-Hand-Treasure/');
});
