const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../../../.test-build/packages/core/src/index.js');
const storage = require('../../../.test-build/packages/storage/src/index.js');

test('sharded repository round-trips a game and compact index', async () => {
  const driver = new storage.MemoryStorageDriver();
  const repo = new storage.ShardRepository(driver);
  const game = core.buildGameSnapshot({
    appId: 570,
    name: 'Dota-ish Test',
    achievements: [{
      id: 'A', name: 'A', description: '', hidden: false, achieved: true, globalUnlockPercent: 12,
      unlockedAtUnix: 100, iconUrl: null, currentProgress: null, minProgress: null, maxProgress: null,
    }],
    nowUnix: 200,
    staleTtlSeconds: 600,
  });
  const index = core.buildLibraryIndex([game.summary], 200);
  await repo.writeGame(game);
  await repo.writeIndex(index);
  assert.equal((await repo.readGame(570)).name, game.name);
  assert.equal((await repo.readIndex()).games[0].appId, 570);
});

test('event log is monthly NDJSON', async () => {
  const driver = new storage.MemoryStorageDriver();
  const repo = new storage.ShardRepository(driver);
  await repo.appendEvents([{version:1,type:'platinum_unlocked',atUnix:Date.UTC(2026,8,6)/1000,appId:10}]);
  const files = driver.dump();
  const path = [...files.keys()][0];
  assert.match(path, /2026-09\.ndjson$/);
  assert.match(files.get(path), /platinum_unlocked/);
});

test('asset LRU keeps most recently used assets inside budget', () => {
  const plan = storage.planAssetEviction([
    {hash:'old', bytes: 8, lastAccessAtUnix: 1},
    {hash:'new', bytes: 8, lastAccessAtUnix: 3},
    {hash:'mid', bytes: 8, lastAccessAtUnix: 2},
  ], 16);
  assert.deepEqual(plan.keep.map((a) => a.hash), ['new','mid']);
  assert.deepEqual(plan.evict.map((a) => a.hash), ['old']);
});

test('runtime codecs reject malformed persisted state instead of trusting TypeScript casts', () => {
  assert.throws(() => storage.decodeLibraryIndex(JSON.stringify({schemaVersion:1,generatedAtUnix:1,games:[{appId:'oops'}],totals:{}}), 'state/index.v1.json'), /Corrupt SteamTrophies data/);
  assert.throws(() => storage.decodeGameSnapshot(JSON.stringify({schemaVersion:1,appId:10,name:'Broken',achievements:'nope'}), 'state/games/10.v1.json'), /Corrupt SteamTrophies data/);
});
