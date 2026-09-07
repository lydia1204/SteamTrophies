const test = require('node:test');
const assert = require('node:assert/strict');
const backup = require('../../../.test-build/packages/backup/src/index.js');

const emptyIndex = {
  schemaVersion: 1,
  generatedAtUnix: 1,
  games: [],
  totals: { visibleGames: 0, earnedTrophies: 0, bronze: 0, silver: 0, gold: 0, platinum: 0 },
};

test('backup bundle explicitly excludes rebuildable caches and logs', () => {
  const bundle = backup.createBackupBundle({
    createdAtUnix: 1,
    appVersion: '0.1.0',
    index: emptyIndex,
    games: [],
    events: [],
  });
  assert.deepEqual(bundle.excludes, ['asset-cache', 'temporary-refresh-state', 'logs']);
  assert.equal(backup.validateBackupBundle(bundle).format, 'steam-trophies-backup');
});

test('backup validator rejects an unsupported format', () => {
  assert.throws(() => backup.validateBackupBundle({ format: 'not-ours', version: 1, games: [], events: [], index: emptyIndex }));
});
