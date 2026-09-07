const { performance } = require('node:perf_hooks');
const core = require('../.test-build/packages/core/src/index.js');

const GAMES = 2500;
const ACHIEVEMENTS_PER_GAME = 40;
const now = Math.floor(Date.now() / 1000);
const summaries = [];
let serializedGameBytes = 0;
const start = performance.now();
for (let g = 1; g <= GAMES; g++) {
  const achievements = [];
  for (let a = 0; a < ACHIEVEMENTS_PER_GAME; a++) {
    const achieved = g % 3 !== 0 && a < (g % ACHIEVEMENTS_PER_GAME);
    achievements.push({
      id: `G${g}_A${a}`,
      name: `Achievement ${a}`,
      description: 'Synthetic benchmark achievement',
      hidden: false,
      achieved,
      globalUnlockPercent: ((a * 7 + g) % 10000) / 100,
      unlockedAtUnix: achieved ? now - a * 1000 : null,
      iconUrl: `https://cdn.example.invalid/${g}/${a}.jpg`,
      currentProgress: achieved ? 1 : 0,
      minProgress: 0,
      maxProgress: 1,
    });
  }
  const snap = core.buildGameSnapshot({appId:g,name:`Game ${g}`,achievements,nowUnix:now,staleTtlSeconds:600});
  summaries.push(snap.summary);
  if (snap.summary.visible) serializedGameBytes += Buffer.byteLength(JSON.stringify(snap));
}
const index = core.buildLibraryIndex(summaries, now);
const indexBytes = Buffer.byteLength(JSON.stringify(index));
const elapsed = performance.now() - start;
const openStart = performance.now();
const parsed = JSON.parse(JSON.stringify(index));
const simulatedOpenMs = performance.now() - openStart;

console.log(JSON.stringify({
  generatedGames: GAMES,
  achievementsPerGame: ACHIEVEMENTS_PER_GAME,
  visibleGames: index.totals.visibleGames,
  buildMs: Number(elapsed.toFixed(2)),
  compactIndexBytes: indexBytes,
  visibleGameShardBytes: serializedGameBytes,
  simulatedIndexParseMs: Number(simulatedOpenMs.toFixed(3)),
}, null, 2));
if (parsed.games.length !== index.totals.visibleGames) process.exitCode = 1;
const budgets = { buildMs: 3000, compactIndexBytes: 2 * 1024 * 1024, visibleGameShardBytes: 100 * 1024 * 1024, simulatedIndexParseMs: 100 };
const failures = [];
if (elapsed > budgets.buildMs) failures.push(`synthetic rebuild ${elapsed.toFixed(2)}ms > ${budgets.buildMs}ms`);
if (indexBytes > budgets.compactIndexBytes) failures.push(`compact index ${indexBytes}B > ${budgets.compactIndexBytes}B`);
if (serializedGameBytes > budgets.visibleGameShardBytes) failures.push(`visible shards ${serializedGameBytes}B > ${budgets.visibleGameShardBytes}B`);
if (simulatedOpenMs > budgets.simulatedIndexParseMs) failures.push(`warm parse ${simulatedOpenMs.toFixed(3)}ms > ${budgets.simulatedIndexParseMs}ms`);
if (failures.length) { console.error('Performance budget failed:', failures.join('; ')); process.exitCode = 1; }
else console.log('Performance budget passed.');
