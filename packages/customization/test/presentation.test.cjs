const test = require('node:test');
const assert = require('node:assert/strict');
const c = require('../../../.test-build/packages/customization/src');

test('row metrics reserve actual content height for every supported size and artwork combination', () => {
  for (const textScale of [.8,1,1.15,1.5,2]) for (const iconScale of [.8,1,1.5,2]) for (const achievementSize of [32,44,72]) for (const artworkStyle of ['icon','capsule','landscape']) {
    const m = c.libraryRowMetrics({textScale,iconScale},{achievementSize,artworkStyle});
    assert.ok(m.tierHeight >= 17*iconScale);
    assert.ok(m.artHeight >= achievementSize);
    assert.equal(m.rowHeight-m.artHeight,26);
    assert.ok(m.rowHeight < 160, JSON.stringify({textScale,iconScale,m}));
    assert.ok(m.artWidth > 0);
  }
  const small=c.libraryRowMetrics({textScale:1,iconScale:1},{achievementSize:44,artworkStyle:'icon'});
  const large=c.libraryRowMetrics({textScale:1,iconScale:2},{achievementSize:44,artworkStyle:'icon'});
  assert.ok(large.rowHeight < small.rowHeight*1.5,'doubling glyphs must not double empty row space');
});

test('pin and hidden states are mutually exclusive without disturbing tracked games', () => {
  let state=c.validateCustomizationState({...c.DEFAULT_CUSTOMIZATION_STATE,library:{pinnedAppIds:[10,20],hiddenAppIds:[10],trackedAppIds:[10]}});
  assert.deepEqual(state.library.pinnedAppIds,[20]);
  state=c.setAppPinned(state,10,true);
  assert.deepEqual(state.library.hiddenAppIds,[]);
  assert.deepEqual(state.library.trackedAppIds,[10]);
  state=c.setAppHidden(state,10,true);
  assert.deepEqual(state.library.pinnedAppIds,[20]);
  assert.deepEqual(state.library.hiddenAppIds,[10]);
});

test('visual preferences reject CSS injection, invalid enums and unbounded sizes', () => {
  const v=c.validateVisual({scrollbarColor:'url(https://bad.invalid)',scrollbarWidth:Infinity,gradient:'url(evil)',backgroundAnimation:'flash',tileColors:{gold:'#aabbcc',silver:'red;display:none',__proto__:{bad:true}},customColors:{text:'#123456',position:'fixed'},tooltipLayout:'script'});
  assert.equal(v.scrollbarColor,'#56616e');assert.equal(v.scrollbarWidth,6);
  assert.deepEqual(v.tileColors,{gold:'#aabbcc'});assert.deepEqual(v.customColors,{text:'#123456'});
  assert.equal(v.gradient,'none');assert.equal(v.backgroundAnimation,'none');assert.equal(v.tooltipLayout,'standard');
  assert.equal(c.validateVisual({scrollbarWidth:999}).scrollbarWidth,18);
  assert.equal(c.validateVisual({scrollbarWidth:-99}).scrollbarWidth,2);
  assert.equal(c.validateVisual({}).showCompletionRarity,true);
  assert.equal(c.validateVisual({}).showReleaseYearLibrary,false);
});

test('per-game artwork and group migrations retain explicit no-fallback and unique membership', () => {
  const s=c.validateCustomizationState({...c.DEFAULT_CUSTOMIZATION_STATE,library:{gameArtwork:{10:{style:'landscape',fallbackOrder:[]},20:{style:'script',fallbackOrder:['icon']}},achievementGroups:{10:[{id:'base',title:' Base Game ',kind:'base',achievementIds:['a','a',null,'b']},{id:'update',title:'Update',kind:'expansion',achievementIds:['b','c']},{id:'base',title:'Duplicate',achievementIds:['z']}]}}});
  assert.deepEqual(s.library.gameArtwork,{10:{style:'landscape',fallbackOrder:[]}});
  assert.equal(s.library.achievementGroups[10].length,2);
  assert.deepEqual(s.library.achievementGroups[10].map(g=>g.achievementIds),[['a','b'],['c']]);
  assert.equal(s.library.achievementGroups[10][0].title,'Base Game');
});

test('all bundled palette identifiers are unique and CSS values remain bounded', () => {
  assert.equal(new Set(c.BUILTIN_THEMES.map(t=>t.id)).size,c.BUILTIN_THEMES.length);
  assert.ok(c.BUILTIN_THEMES.length >= 25);
  for (const t of c.BUILTIN_THEMES) for(const color of t.previewColors ?? []) assert.match(color,/^#[\da-f]{6}$/i);
});
