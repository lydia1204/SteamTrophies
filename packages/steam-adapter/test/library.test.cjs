const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { libraryAppIds } = require('../../../.test-build/frontend/runtime/library.js');
const { artworkOrder, resolveGameArtwork } = require('../../../.test-build/frontend/runtime/library.js');
test('artwork hierarchy tries the selected style first without repeating it', () => {
  assert.deepEqual(artworkOrder('icon',['landscape','capsule','icon']),['icon','landscape','capsule']);
  assert.deepEqual(artworkOrder('landscape',['capsule','icon','landscape']),['landscape','capsule','icon']);
  assert.equal(resolveGameArtwork(-1,'landscape'),null);
  assert.equal(resolveGameArtwork(105600,'landscape'),'https://shared.steamstatic.com/store_item_assets/steam/apps/105600/header.jpg');
});

test('discovery excludes known DLC and tool overviews rather than probing them as games', () => {
  assert.deepEqual(libraryAppIds({m_mapApps: new Map([[10,{app_type:1}], [20,{app_type:4}], [30,{app_type:2}]])}), [10]);
});

test('discovers observable map-like Steam libraries without instanceof Map', () => {
  const m_mapApps = { *keys() { yield 570; yield '10'; yield 570; yield 'bad'; yield 0; yield -1; yield 2 ** 32; yield true; yield null; } };
  assert.deepEqual(libraryAppIds({ m_mapApps }), [10, 570]);
});
test('discovers a library Map created in another Steam window', () => {
  const m_mapApps = vm.runInNewContext('new Map([[570, {}], [10, {}]])');
  assert.equal(m_mapApps instanceof Map, false);
  assert.deepEqual(libraryAppIds({ m_mapApps }), [10, 570]);
});
test('not-yet-loaded and inaccessible libraries remain retryable', () => {
  assert.deepEqual(libraryAppIds(undefined), []);
  assert.deepEqual(libraryAppIds({}), []);
  assert.deepEqual(libraryAppIds({ m_mapApps: { keys() { throw new Error('loading'); } } }), []);
});
