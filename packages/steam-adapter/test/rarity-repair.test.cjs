const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../../../.test-build/packages/core/src');
const { parseGlobalRarity } = require('../../../.test-build/packages/steam-adapter/src/global-rarity');
const raw = (id) => ({ id, name: id, description: '', hidden: false, achieved: true, globalUnlockPercent: 0, unlockedAtUnix: 100, iconUrl: null, currentProgress: null, minProgress: null, maxProgress: null });
const game = () => core.buildGameSnapshot({ appId: 10, name: 'Fixture', achievements: ['a','b','c'].map(raw), nowUnix: 200, staleTtlSeconds: 600 });

test('global rarity parses exact IDs, decimal strings, and genuine zero', () => {
  assert.deepEqual([...parseGlobalRarity('{"achievementpercentages":{"achievements":[{"name":"a","percent":"87.0"},{"name":"b","percent":0}]}}')], [['a',87],['b',0]]);
  assert.throws(() => parseGlobalRarity('{"achievementpercentages":{"achievements":[{"name":"a","percent":null}]}}'));
  assert.throws(() => parseGlobalRarity('{"error":"offline"}'));
});
test('legacy gold repair preserves identity, unlock dates and Platinum; ordinary drift does not rewrite awards', () => {
  const before = game();
  assert.equal(before.summary.goldCount, 3);
  const fixed = core.repairRarity(before, new Map([['a',87],['b',12],['c',3]]));
  assert.deepEqual([fixed.summary.bronzeCount,fixed.summary.silverCount,fixed.summary.goldCount], [1,1,1]);
  assert.deepEqual(fixed.platinum, before.platinum);
  assert.deepEqual(fixed.achievements.map(a=>[a.id,a.unlockedAtUnix,a.firstObservedAtUnix,a.achieved]), before.achievements.map(a=>[a.id,a.unlockedAtUnix,a.firstObservedAtUnix,a.achieved]));
  assert.equal(before.summary.goldCount, 3); // No mutation of input/backup.
  const later = core.repairRarity(fixed, new Map([['a',3],['b',87],['c',87]]));
  assert.deepEqual(later.achievements.map(a=>a.awardedTier), fixed.achievements.map(a=>a.awardedTier));
});
test('unavailable rarity is unknown, not zero, and can be resolved later', () => {
  const missing = core.repairRarity(game(), new Map());
  assert.equal(missing.achievements[0].globalUnlockPercent, null);
  assert.equal(missing.summary.goldCount, 0);
  const later = core.repairRarity(missing, new Map([['a',3]]));
  assert.equal(later.achievements.find(a=>a.id==='a').awardedTier, 'gold');
});
test('repair does not reinterpret nonzero legacy award history as the zero-source bug', () => {
  const before = game();
  before.achievements[0].globalUnlockPercent = 3;
  before.achievements[0].awardedGlobalUnlockPercent = 3;
  const fixed = core.repairRarity(before, new Map([['a',87]]));
  assert.equal(fixed.achievements[0].awardedTier, 'gold');
});
test('explicit refresh reclassifies verified awards while ordinary background refresh preserves history', () => {
  const before = core.repairRarity(game(), new Map([['a',3],['b',12],['c',87]]));
  const current = new Map([['a',87],['b',3],['c',12]]);
  const fixed = core.repairRarity(before,current,undefined,true);
  assert.deepEqual(fixed.achievements.map(a=>a.awardedTier), ['bronze','gold','silver']);
  assert.deepEqual(fixed.achievements.map(a=>a.unlockedAtUnix),before.achievements.map(a=>a.unlockedAtUnix));
  assert.deepEqual(fixed.platinum,before.platinum);
  assert.equal(core.repairRarity(before,new Map(),undefined,true).achievements[0].awardedTier,'gold');
});
test('initial import is silent while known-game refresh can announce', () => {
  assert.equal(core.shouldAnnounceRefresh(undefined), false);
  assert.equal(core.shouldAnnounceRefresh(game()), true);
});

const writes = [];
global.backend = {
  writeGameJson: async(id,json)=>{ writes.push(JSON.parse(json)); return true; },
  writeIndexJson: async()=>true, appendEvents: async()=>true, writeDiscoveryJson: async()=>true,
  readGlobalRarityJson: async()=>'{"achievementpercentages":{"achievements":[{"name":"a","percent":87},{"name":"b","percent":12},{"name":"c","percent":3}]}}',
};
const { TrophyService } = require('../../../.test-build/frontend/state/service');
test('Mac parsed JSON bridge preserves cached data and startup never scans', async () => {
  const saved = core.buildLibraryIndex([game().summary], 200);
  let reads = 0, quarantines = 0;
  Object.assign(global.backend, {
    readIndexJson: async()=>saved,
    readSettingsJson: async()=>null,
    readDiscoveryJson: async()=>({schemaVersion:1, scannedAtUnixByAppId:{10:200}}),
    readGameJson: async()=>game(),
    quarantineIndex: async()=>{ quarantines++; },
  });
  global.SteamClient = { Apps: { GetMyAchievementsForApp: async()=>{reads++; return {}; }, RegisterForAchievementChanges: ()=>({unregister(){}}) } };
  const service = new TrophyService();
  await service.boot();
  assert.equal(service.getSnapshot().index.games.length, 1);
  assert.equal(service.getSnapshot().discovering, false);
  assert.equal(reads, 0);
  assert.equal(quarantines, 0);
  service.dispose();
});
test('JSON boundary accepts both host representations and rejects unexpected primitives', () => {
  const { jsonText } = require('../../../.test-build/frontend/runtime/json-boundary');
  assert.equal(jsonText({a:1}), '{"a":1}');
  assert.equal(jsonText('{"a":1}'), '{"a":1}');
  assert.equal(jsonText(null), null);
  assert.throws(()=>jsonText(false));
});
test('card previews read cached achievements without selecting or importing games', async () => {
  const service = new TrophyService();
  const saved = game();
  saved.achievements.forEach((a,i)=>{ a.iconUrl='https://cdn.steamstatic.com/a.png'; a.unlockedAtUnix=100+i; });
  await service.enqueueCommit(saved, [], false);
  const preview = await service.getCachedPreview(saved.appId);
  assert.deepEqual(preview.map(a=>a.id), ['c','b','a']);
  assert.equal(service.getSnapshot().selectedAppId, null);
  assert.equal(service.getSnapshot().discovering, false);
  assert.equal(service.getSnapshot().refreshing, false);
});
test('preview supplies newest earned achievements for width-based capacity; unverified rarity stays unknown', async () => {
  const service = new TrophyService();
  const saved = core.buildGameSnapshot({appId:10,name:'Fixture',achievements:Array.from({length:14},(_,i)=>({...raw(String(i)),iconUrl:'https://cdn.steamstatic.com/a.png',unlockedAtUnix:i+1})),nowUnix:200,staleTtlSeconds:600});
  await service.enqueueCommit(saved, [], false);
  const preview = await service.getCachedPreview(10);
  assert.equal(preview.length,14);
  assert.equal(preview[0].id,'13');
  assert.equal(preview.at(-1).id,'0');
  assert.equal(preview[0].globalUnlockPercent,null);
});
test('service persists imported history without sending notification events', async () => {
  const service = new TrophyService();
  let announced = 0;
  service.subscribeEvents(()=>announced++);
  const next = game();
  await service.enqueueCommit(next, core.deriveEvents(undefined,next), false);
  assert.equal(announced, 0);
  assert.equal(service.getSnapshot().index.games.length, 1);
  await service.enqueueCommit(next, core.deriveEvents(undefined,next), true);
  assert.equal(announced, 1);
});
test('cached repair updates shard and index without achievement reimport or notifications', async () => {
  const service = new TrophyService();
  let announced = 0;
  service.subscribeEvents(()=>announced++);
  await service.enqueueCommit(game(), [], false);
  await service.repairCachedRarity();
  assert.equal(service.getSnapshot().index.totals.gold, 1);
  assert.equal(service.getSnapshot().index.totals.silver, 1);
  assert.equal(service.getSnapshot().index.totals.bronze, 1);
  assert.equal(service.getSnapshot().repairing, false);
  assert.equal(writes.at(-1).rarityRevision, 1);
  assert.equal(announced, 0);
});
test('discovery scheduler can disable automatic retry storms', async () => {
  let calls = 0;
  const scheduler = new core.RefreshScheduler(async()=>{ calls++; throw new Error('result 2'); }, { maxRetries: 0, minPerAppIntervalMs: 0 });
  scheduler.request(10);
  await new Promise(resolve=>setTimeout(resolve,30));
  assert.equal(calls, 1);
  assert.equal(scheduler.pendingCount(), 0);
  scheduler.stop();
});
