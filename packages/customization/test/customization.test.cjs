const test = require('node:test');
const assert = require('node:assert/strict');
const {
  BUILTIN_PACKS,
  DEFAULT_CUSTOMIZATION_STATE,
  DEFAULT_THEME,
  RESOLUTION_TEST_MATRIX,
  addTrophyProject,
  classifyResponsiveMetrics,
  compileThemeCssVariables,
  isQuietNow,
  mergePackCatalog,
  message,
  recordThemeFailure,
  recordThemeSuccess,
  pseudoLocalize,
  removePackReferences,
  reorderWidget,
  resolveToastSound,
  resolveTrophyAsset,
  setAchievementOverride,
  setGamePackOverride,
  setProjectTargets,
  validateCustomizationState,
  validatePackManifest,
  validateNotificationPreferences,
} = require('../../../.test-build/packages/customization/src/index.js');

test('English catalog interpolates values and pseudo locale expands visible strings safely', () => {
  assert.equal(message('app.gamesEarned', { count: 12 }), '12 games with earned trophies');
  const pseudo = message('app.gamesEarned', { count: 12 }, 'qps-ploc');
  assert.match(pseudo, /^⟦.*12.*⟧$/);
  assert.ok(pseudo.length > '12 games with earned trophies'.length);
  assert.equal(pseudoLocalize('Open {count} games').includes('{count}'), true);
});

test('desktop appearance migration preserves user lists and defaults to capsules without optional borders', () => {
  const state = structuredClone(DEFAULT_CUSTOMIZATION_STATE);
  state.library = { pinnedAppIds: [105600], hiddenAppIds: [214420], trackedAppIds: [] };
  const migrated = validateCustomizationState(state);
  assert.deepEqual(migrated.library.pinnedAppIds, [105600]);
  assert.deepEqual(migrated.library.hiddenAppIds, [214420]);
  assert.equal(migrated.library.artworkStyle, 'capsule');
  assert.deepEqual(migrated.library.artworkFallbackOrder, ['landscape','capsule','icon']);
  state.library.artworkStyle = 'landscape';
  state.library.artworkFallbackOrder = ['icon','icon','not-art','capsule'];
  assert.equal(validateCustomizationState(state).library.artworkStyle, 'landscape');
  assert.deepEqual(validateCustomizationState(state).library.artworkFallbackOrder, ['icon','capsule','landscape']);
  assert.equal(migrated.library.bronzeBorders, false);
  assert.equal(migrated.library.silverBorders, false);
  assert.equal(migrated.library.achievementSize, 44);
  state.library.achievementSize = 10000;
  assert.equal(validateCustomizationState(state).library.achievementSize, 72);
});

test('toast animation preferences are allowlisted and MP3 pack references are accepted', () => {
  for (const animation of ['slide','fade','rise','zoom','bounce','flip','none']) assert.equal(validateNotificationPreferences({ animation }).animation, animation);
  assert.equal(validateNotificationPreferences({ animation: 'arbitrary' }).animation, 'slide');
  assert.equal(userPack({ sounds: { 'toast.gold': 'sounds/gold.mp3' } }).manifest.sounds['toast.gold'], 'sounds/gold.mp3');
  const state = structuredClone(DEFAULT_CUSTOMIZATION_STATE);
  state.notifications.soundPackId = 'example.safe-pack';
  const pack = userPack({ sounds: { 'toast.gold': 'sounds/gold.mp3' } });
  assert.equal(resolveToastSound(state, [...BUILTIN_PACKS, pack], { tier: 'gold' }).packId, 'example.safe-pack');
  assert.equal(state.trophies.globalPackId, DEFAULT_CUSTOMIZATION_STATE.trophies.globalPackId);
});

function userPack(overrides = {}) {
  return {
    source: 'user',
    manifest: validatePackManifest({
      manifestVersion: 1,
      id: 'example.safe-pack',
      name: 'Safe Pack',
      version: '1.0.0',
      author: 'Tester',
      type: 'trophy-icon-pack',
      homepage: 'https://example.invalid/trophies',
      tags: ['clean', 'test'],
      accentColor: '#88CCFF',
      assets: {
        'trophy.bronze': 'trophies/b.png',
        'trophy.silver': 'trophies/s.png',
        'trophy.gold': 'trophies/g.png',
        'trophy.platinum': 'trophies/p.webp',
      },
      customTrophies: { 'custom.slime-crown': 'trophies/slime.png' },
      sounds: { 'toast.gold': 'sounds/gold.ogg' },
      ...overrides,
    }),
  };
}

test('user pack manifest supports declared custom trophies and sounds but rejects unsafe paths/types', () => {
  const pack = userPack();
  assert.equal(pack.manifest.customTrophies['custom.slime-crown'], 'trophies/slime.png');
  assert.equal(pack.manifest.sounds['toast.gold'], 'sounds/gold.ogg');
  assert.throws(() => userPack({ assets: { ...pack.manifest.assets, 'trophy.gold': '../escape.png' } }));
  assert.throws(() => userPack({ assets: { ...pack.manifest.assets, 'trophy.gold': 'trophies/x.svg' } }));
  assert.throws(() => userPack({ id: 'builtin.evil' }));
  assert.throws(() => validatePackManifest({ ...pack.manifest, surpriseScript: 'nope.js' }));
  assert.throws(() => userPack({ customTrophies: { 'wrong-key': 'x.png' } }));
  assert.throws(() => userPack({ sounds: { 'toast.gold': 'sounds/payload.js' } }));
});

test('game-specific pack overrides beat global pack and clear cleanly', () => {
  const user = userPack({ id: 'example.game-pack', name: 'Game Pack' });
  const packs = mergePackCatalog([user]);
  const state = setGamePackOverride(DEFAULT_CUSTOMIZATION_STATE, 105600, 'example.game-pack');
  const gameAsset = resolveTrophyAsset(state, packs, { appId: 105600, tier: 'gold' });
  const otherAsset = resolveTrophyAsset(state, packs, { appId: 620, tier: 'gold' });
  assert.equal(gameAsset.packId, 'example.game-pack');
  assert.equal(gameAsset.relativePath, 'trophies/g.png');
  assert.equal(otherAsset.packId, 'builtin.classic');
  const cleared = setGamePackOverride(state, 105600, null);
  assert.equal(cleared.trophies.games['105600'], undefined);
});

test('per-achievement custom resource beats per-game pack', () => {
  const user = userPack({ id: 'example.custom-pack' });
  const packs = mergePackCatalog([user]);
  let state = setGamePackOverride(DEFAULT_CUSTOMIZATION_STATE, 10, 'builtin.minimal');
  state = setAchievementOverride(state, 10, 'ACH_WIN', { packId: 'example.custom-pack', resourceKey: 'custom.slime-crown' });
  const resolved = resolveTrophyAsset(state, packs, { appId: 10, achievementId: 'ACH_WIN', tier: 'bronze' });
  assert.equal(resolved.packId, 'example.custom-pack');
  assert.equal(resolved.resourceKey, 'custom.slime-crown');
  assert.equal(resolved.relativePath, 'trophies/slime.png');
  assert.equal(resolveTrophyAsset(state, packs, { appId: 10, achievementId: 'OTHER', tier: 'bronze' }).packId, 'builtin.minimal');
});

test('customization v1 state migrates losslessly into v2 defaults', () => {
  const v1 = {
    version: 1,
    trophies: { version: 1, globalPackId: 'builtin.crystal', games: { '10': { packId: 'builtin.minimal' } } },
    themeId: 'builtin.midnight',
    layout: structuredClone(DEFAULT_CUSTOMIZATION_STATE.layout),
    accessibility: { reducedMotion: true, highContrast: false, textScale: 1.25, iconScale: 1.1 },
  };
  const migrated = validateCustomizationState(v1);
  assert.equal(migrated.version, 2);
  assert.equal(migrated.trophies.globalPackId, 'builtin.crystal');
  assert.equal(migrated.trophies.games['10'].packId, 'builtin.minimal');
  assert.deepEqual(migrated.projects.entries, []);
  assert.equal(migrated.notifications.enabled, true);
  assert.equal(migrated.accessibility.textScale, 1.25);
});

test('customization state validates 200% accessibility bounds', () => {
  const valid = validateCustomizationState(structuredClone(DEFAULT_CUSTOMIZATION_STATE));
  assert.equal(valid.version, 2);
  const max = structuredClone(DEFAULT_CUSTOMIZATION_STATE);
  max.accessibility.textScale = 2;
  max.accessibility.iconScale = 2;
  assert.equal(validateCustomizationState(max).accessibility.textScale, 2);
  const bad = structuredClone(DEFAULT_CUSTOMIZATION_STATE);
  bad.accessibility.textScale = 2.01;
  assert.throws(() => validateCustomizationState(bad));
});

test('layout reorder is surface-local and theme compiler respects reduced motion', () => {
  const next = reorderWidget(DEFAULT_CUSTOMIZATION_STATE.layout, 'big_picture', 'recentTrophies', 0);
  assert.equal(next.surfaces.big_picture.order[0], 'recentTrophies');
  assert.notEqual(next.surfaces.desktop.order[0], 'recentTrophies');
  const css = compileThemeCssVariables(DEFAULT_THEME, 'big_picture', { reducedMotion: true, highContrast: false, textScale: 1.25, iconScale: 1.1 });
  assert.equal(css['--stt-motion-duration'], '0ms');
  assert.equal(css['--stt-text-scale'], '1.25');
});

test('Trophy Projects cap active hunts and keep explicit achievement targets', () => {
  let state = structuredClone(DEFAULT_CUSTOMIZATION_STATE.projects);
  state = addTrophyProject(state, 10, 1000);
  state = addTrophyProject(state, 20, 1001);
  state = setProjectTargets(state, 20, ['ONE', 'TWO', 'ONE']);
  state = addTrophyProject(state, 30, 1002);
  state = addTrophyProject(state, 40, 1003);
  assert.deepEqual(state.entries.map((x) => x.appId), [40, 30, 20]);
  assert.deepEqual(state.entries.find((x) => x.appId === 20).targetAchievementIds, ['ONE', 'TWO']);
});

test('toast sounds follow game pack, global pack and fallback chain', () => {
  const user = userPack({ id: 'example.sound-pack' });
  const packs = mergePackCatalog([user]);
  let state = setGamePackOverride(DEFAULT_CUSTOMIZATION_STATE, 10, 'example.sound-pack');
  const gold = resolveToastSound(state, packs, { appId: 10, tier: 'gold' });
  assert.equal(gold.packId, 'example.sound-pack');
  assert.equal(gold.relativePath, 'sounds/gold.ogg');
  const bronze = resolveToastSound(state, packs, { appId: 10, tier: 'bronze' });
  assert.equal(bronze.packId, 'builtin.classic');
});

test('quiet hours support overnight ranges', () => {
  const prefs = structuredClone(DEFAULT_CUSTOMIZATION_STATE.notifications);
  prefs.quietHours = { enabled: true, startMinute: 22 * 60, endMinute: 7 * 60 };
  assert.equal(isQuietNow(prefs, new Date(2026, 0, 1, 23, 30)), true);
  assert.equal(isQuietNow(prefs, new Date(2026, 0, 1, 6, 30)), true);
  assert.equal(isQuietNow(prefs, new Date(2026, 0, 1, 12, 0)), false);
});

test('safe mode trips after repeated theme failures and recovers last-known-good', () => {
  let safe = structuredClone(DEFAULT_CUSTOMIZATION_STATE.safeMode);
  safe = recordThemeFailure(recordThemeFailure(recordThemeFailure(safe)));
  assert.equal(safe.themesDisabled, true);
  safe = recordThemeSuccess(safe, 'builtin.oled-black');
  assert.equal(safe.themeFailureCount, 0);
  assert.equal(safe.lastKnownGoodThemeId, 'builtin.oled-black');
});

test('resolution matrix covers Deck, TV, 4K and 32:9 without excessive columns', () => {
  assert.ok(RESOLUTION_TEST_MATRIX.length >= 8);
  for (const fixture of RESOLUTION_TEST_MATRIX) {
    const m = classifyResponsiveMetrics(fixture.width, fixture.height, fixture.surface);
    assert.ok(m.columns >= 1 && m.columns <= 6, fixture.name);
    assert.ok(m.safeInlinePx >= 12, fixture.name);
    assert.ok(m.safeBlockPx >= 12, fixture.name);
  }
  const deck = classifyResponsiveMetrics(1280, 800, 'deck');
  assert.ok(deck.columns <= 3);
  const g9 = classifyResponsiveMetrics(5120, 1440, 'desktop');
  assert.equal(g9.aspectBand, 'super_ultrawide');
  assert.equal(g9.columns, 6);
});

test('removing a custom pack scrubs global, game, tier and achievement references', () => {
  const state = structuredClone(DEFAULT_CUSTOMIZATION_STATE);
  state.trophies.globalPackId = 'example.removed';
  state.trophies.games['105600'] = {
    packId: 'example.removed',
    tierOverrides: { gold: { packId: 'example.removed', resourceKey: 'trophy.gold' }, silver: { packId: 'builtin.crystal', resourceKey: 'trophy.silver' } },
    achievementOverrides: {
      DELETE_ME: { packId: 'example.removed', resourceKey: 'custom.foo' },
      KEEP_ME: { packId: 'builtin.minimal', resourceKey: 'trophy.bronze' },
    },
  };
  const next = removePackReferences(state, 'example.removed');
  assert.equal(next.trophies.globalPackId, 'builtin.classic');
  assert.equal(next.trophies.games['105600'].packId, undefined);
  assert.equal(next.trophies.games['105600'].tierOverrides.gold, undefined);
  assert.equal(next.trophies.games['105600'].tierOverrides.silver.packId, 'builtin.crystal');
  assert.equal(next.trophies.games['105600'].achievementOverrides.DELETE_ME, undefined);
  assert.equal(next.trophies.games['105600'].achievementOverrides.KEEP_ME.packId, 'builtin.minimal');
});

test('notification preferences bound burst visibility and audio cooldown', () => {
  const prefs = validateNotificationPreferences({ maxVisible: 999, audioCooldownMs: -50 });
  assert.equal(prefs.maxVisible, 6);
  assert.equal(prefs.audioCooldownMs, 0);
  const defaults = validateNotificationPreferences({});
  assert.equal(defaults.maxVisible, 4);
  assert.equal(defaults.audioCooldownMs, 850);
});
