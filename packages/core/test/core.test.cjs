const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../../../.test-build/packages/core/src/index.js');

test('Platinum preserves the original completion identity after later catalogue additions', () => {
  const records = [{id:'first',achieved:true,unlockedAtUnix:10},{id:'final',achieved:true,unlockedAtUnix:20}];
  const original = core.computePlatinum(10, records);
  assert.equal(original.completionAchievementId, 'final');
  const expanded = [...records, {id:'new',achieved:true,unlockedAtUnix:30}, {id:'locked',achieved:false,unlockedAtUnix:null}];
  const retained = core.computePlatinum(10, expanded, original);
  assert.equal(retained.achieved, true); assert.equal(retained.unlockedAtUnix, 20);
  assert.equal(core.completionAchievement(expanded, retained).id, 'final');
});
test('legacy Platinum resolves against its stored timestamp, not latest unlock or current completion', () => {
  const platinum = { achieved:true, unlockedAtUnix:20 };
  assert.equal(core.completionAchievement([{id:'original',achieved:true,unlockedAtUnix:20},{id:'later',achieved:true,unlockedAtUnix:30}],platinum).id,'original');
  assert.equal(core.completionAchievement([{id:'a',achieved:true,unlockedAtUnix:20},{id:'b',achieved:true,unlockedAtUnix:20}],platinum),null);
});
test('Forager Completionist proves historical completion; names alone do not', () => {
  const records = [{id:'feat83',name:'Completionist',achieved:true,unlockedAtUnix:20},{id:'later',achieved:false,unlockedAtUnix:null}];
  const platinum = core.computePlatinum(751780,records);
  assert.equal(platinum.achieved,true); assert.equal(platinum.completionAchievementId,'feat83'); assert.equal(platinum.unlockedAtUnix,20);
  assert.equal(core.computePlatinum(10,records).achieved,false);
  const previous = { achievements:records, platinum:{achieved:false} };
  const next = {appId:751780,achievements:records,platinum,summary:{lastRefreshAtUnix:100,achievementCount:2,earnedCount:1}};
  assert.equal(core.deriveEvents(previous,next).some(e=>e.type==='platinum_unlocked'),false);
});

const achievement = (overrides = {}) => ({
  id: 'ACH_1',
  name: 'First Blood',
  description: 'Do the thing.',
  hidden: false,
  achieved: false,
  globalUnlockPercent: 50,
  unlockedAtUnix: null,
  iconUrl: 'https://cdn.example.test/a.png',
  currentProgress: 0,
  minProgress: 0,
  maxProgress: 1,
  ...overrides,
});

test('rarity thresholds make genuinely rare achievements gold', () => {
  assert.equal(core.classifyRarity(5), 'gold');
  assert.equal(core.classifyRarity(5.01), 'silver');
  assert.equal(core.classifyRarity(20), 'silver');
  assert.equal(core.classifyRarity(20.01), 'bronze');
  assert.equal(core.classifyRarity(null), 'bronze');
});

test('import time is never substituted for an unknown unlock or platinum date', () => {
  const snap = core.buildGameSnapshot({ appId: 100, name: 'Unknown dates', achievements: [achievement({ achieved: true })], nowUnix: 1234567890, staleTtlSeconds: 600 });
  assert.equal(snap.achievements[0].unlockedAtUnix, null);
  assert.equal(snap.achievements[0].firstObservedAtUnix, 1234567890);
  assert.equal(snap.platinum.achieved, true);
  assert.equal(snap.platinum.unlockedAtUnix, null);
});

test('0% games stay hidden under the default earned-only policy', () => {
  const snap = core.buildGameSnapshot({
    appId: 100,
    name: 'Zero Percent',
    achievements: [achievement()],
    nowUnix: 1000,
    staleTtlSeconds: 600,
  });
  assert.equal(snap.summary.visible, false);
  assert.equal(snap.summary.earnedCount, 0);
});

test('first earned trophy makes a game visible', () => {
  const snap = core.buildGameSnapshot({
    appId: 100,
    name: 'Started Game',
    achievements: [achievement({ achieved: true, unlockedAtUnix: 900, globalUnlockPercent: 4.2 })],
    nowUnix: 1000,
    staleTtlSeconds: 600,
  });
  assert.equal(snap.summary.visible, true);
  assert.equal(snap.summary.goldCount, 1);
});

test('rarity at award is frozen even if global rarity changes later', () => {
  const first = core.buildGameSnapshot({
    appId: 100,
    name: 'Drifting Rarity',
    achievements: [achievement({ achieved: true, unlockedAtUnix: 900, globalUnlockPercent: 3 })],
    nowUnix: 1000,
    staleTtlSeconds: 600,
  });
  const later = core.buildGameSnapshot({
    appId: 100,
    name: 'Drifting Rarity',
    achievements: [achievement({ achieved: true, unlockedAtUnix: 900, globalUnlockPercent: 70 })],
    previous: first,
    nowUnix: 2000,
    staleTtlSeconds: 600,
  });
  assert.equal(later.achievements[0].tier, 'bronze');
  assert.equal(later.achievements[0].awardedTier, 'gold');
  assert.equal(later.summary.goldCount, 1);
});

test('synthetic Platinum appears only after all real Steam achievements are earned', () => {
  const partial = core.buildGameSnapshot({
    appId: 200,
    name: 'Almost',
    achievements: [achievement({ id: 'A', achieved: true }), achievement({ id: 'B' })],
    nowUnix: 1000,
    staleTtlSeconds: 600,
  });
  assert.equal(partial.platinum.achieved, false);

  const complete = core.buildGameSnapshot({
    appId: 200,
    name: 'Almost',
    achievements: [
      achievement({ id: 'A', achieved: true, unlockedAtUnix: 900 }),
      achievement({ id: 'B', achieved: true, unlockedAtUnix: 1100 }),
    ],
    previous: partial,
    nowUnix: 1200,
    staleTtlSeconds: 600,
  });
  assert.equal(complete.platinum.achieved, true);
  assert.equal(complete.platinum.unlockedAtUnix, 1100);
});

test('unlock event is emitted once across refreshes', () => {
  const locked = core.buildGameSnapshot({
    appId: 300,
    name: 'Events',
    achievements: [achievement()],
    nowUnix: 1000,
    staleTtlSeconds: 600,
  });
  const unlocked = core.buildGameSnapshot({
    appId: 300,
    name: 'Events',
    achievements: [achievement({ achieved: true, unlockedAtUnix: 1050 })],
    previous: locked,
    nowUnix: 1100,
    staleTtlSeconds: 600,
  });
  assert.equal(core.deriveEvents(locked, unlocked).filter((e) => e.type === 'achievement_unlocked').length, 1);
  const same = core.buildGameSnapshot({
    appId: 300,
    name: 'Events',
    achievements: [achievement({ achieved: true, unlockedAtUnix: 1050 })],
    previous: unlocked,
    nowUnix: 1200,
    staleTtlSeconds: 600,
  });
  assert.equal(core.deriveEvents(unlocked, same).filter((e) => e.type === 'achievement_unlocked').length, 0);
});


test('earned trophies survive if a publisher later removes the Steam achievement', () => {
  const before = core.buildGameSnapshot({
    appId: 400,
    name: 'Mutable Catalogue',
    achievements: [achievement({ id: 'REMOVED_LATER', achieved: true, unlockedAtUnix: 900, globalUnlockPercent: 2 })],
    nowUnix: 1000,
    staleTtlSeconds: 600,
  });
  const after = core.buildGameSnapshot({
    appId: 400,
    name: 'Mutable Catalogue',
    achievements: [],
    previous: before,
    nowUnix: 2000,
    staleTtlSeconds: 600,
  });
  assert.equal(after.achievements.length, 1);
  assert.equal(after.achievements[0].retired, true);
  assert.equal(after.achievements[0].achieved, true);
  assert.equal(after.achievements[0].awardedTier, 'gold');
  assert.equal(after.summary.visible, true);
});

test('missing locked catalogue entries are not preserved as fake trophies', () => {
  const before = core.buildGameSnapshot({
    appId: 401,
    name: 'Mutable Catalogue',
    achievements: [achievement({ id: 'LOCKED_REMOVED', achieved: false })],
    nowUnix: 1000,
    staleTtlSeconds: 600,
  });
  const after = core.buildGameSnapshot({
    appId: 401,
    name: 'Mutable Catalogue',
    achievements: [],
    previous: before,
    nowUnix: 2000,
    staleTtlSeconds: 600,
  });
  assert.equal(after.achievements.length, 0);
  assert.equal(after.summary.visible, false);
});


test('a Steam achievement reset never revokes an already-awarded trophy', () => {
  const earned = core.buildGameSnapshot({
    appId: 500,
    name: 'Resettable',
    achievements: [achievement({ id: 'RESET_ME', achieved: true, unlockedAtUnix: 900, globalUnlockPercent: 12 })],
    nowUnix: 1000,
    staleTtlSeconds: 600,
  });
  const resetBySteam = core.buildGameSnapshot({
    appId: 500,
    name: 'Resettable',
    achievements: [achievement({ id: 'RESET_ME', achieved: false, unlockedAtUnix: null, globalUnlockPercent: 12 })],
    previous: earned,
    nowUnix: 2000,
    staleTtlSeconds: 600,
  });
  assert.equal(resetBySteam.achievements[0].achieved, true);
  assert.equal(resetBySteam.achievements[0].unlockedAtUnix, 900);
  assert.equal(resetBySteam.summary.earnedCount, 1);
});


test('discovery ledger avoids rescanning recently probed hidden apps but re-probes later', () => {
  let ledger = core.emptyDiscoveryLedger();
  assert.equal(core.shouldProbeApp(ledger, 570, 1000), true);
  ledger = core.markAppScanned(ledger, 570, 1000);
  assert.equal(core.shouldProbeApp(ledger, 570, 1001), false);
  assert.equal(core.shouldProbeApp(ledger, 570, 1000 + core.DEFAULT_DISCOVERY_REPROBE_SECONDS), true);
  const roundTrip = core.parseDiscoveryLedger(JSON.stringify(ledger));
  assert.equal(roundTrip.scannedAtUnixByAppId['570'], 1000);
});

test('refresh scheduler aborts in-flight work and suppresses retry after stop', async () => {
  let aborted = false;
  let calls = 0;
  const scheduler = new core.RefreshScheduler(async (_appId, signal) => {
    calls += 1;
    await new Promise((resolve) => {
      signal.addEventListener('abort', () => { aborted = true; resolve(); }, { once: true });
      setTimeout(resolve, 100);
    });
    if (signal.aborted) throw new Error('aborted');
  }, { concurrency: 1, minPerAppIntervalMs: 0 });
  scheduler.request(10, 'visible');
  await new Promise((resolve) => setTimeout(resolve, 10));
  scheduler.stop();
  await new Promise((resolve) => setTimeout(resolve, 30));
  assert.equal(aborted, true);
  assert.equal(calls, 1);
  assert.equal(scheduler.pendingCount(), 0);
});
