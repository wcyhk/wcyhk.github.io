import {test} from 'node:test';
import assert from 'node:assert/strict';
import {destinationFor} from '../redirect.mjs';

test('old printed entry links retain their query and bookmark',()=>{
  assert.equal(destinationFor('https://yuenhk.github.io/qingming-hand-treasure/?v=e1a1131#start'), 'https://yuenhk.github.io/QingMing-Hand-Treasure/?v=e1a1131#start');
  assert.equal(destinationFor('https://yuenhk.github.io/qingming-hand-treasure'), 'https://yuenhk.github.io/QingMing-Hand-Treasure/');
});
test('case variants and deep links point to the same destination host',()=>{
  assert.equal(destinationFor('https://yuenhk.github.io/QINGMING-HAND-TREASURE/assets/public-poster/landscape.pdf'), 'https://yuenhk.github.io/QingMing-Hand-Treasure/assets/public-poster/landscape.pdf');
  assert.equal(destinationFor('https://yuenhk.github.io/qingming-hand-treasure/?next=https://example.com/'), 'https://yuenhk.github.io/QingMing-Hand-Treasure/?next=https://example.com/');
});
test('canonical links do not loop and unrelated paths are left alone',()=>{
  assert.equal(destinationFor('https://yuenhk.github.io/QingMing-Hand-Treasure/'), null);
  assert.equal(destinationFor('https://yuenhk.github.io/other-project/'), null);
  assert.equal(destinationFor('https://yuenhk.github.io/qingming-hand-treasure-other/'), null);
  assert.equal(destinationFor('https://yuenhk.github.io/'), 'https://yuenhk.github.io/QingMing-Hand-Treasure/');
});
