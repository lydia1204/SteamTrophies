const test = require('node:test');
const assert = require('node:assert/strict');
const { watchOutsideClicks } = require('../../../.test-build/frontend/runtime/outside-click.js');
const { watchInputModality } = require('../../../.test-build/frontend/runtime/input-modality.js');
test('initial and pointer focus stay neutral, keyboard focus is visible, and cleanup restores the document', () => {
  const attrs=new Map(),handlers=new Map(); const doc={documentElement:{getAttribute:k=>attrs.get(k)??null,setAttribute:(k,v)=>attrs.set(k,v),removeAttribute:k=>attrs.delete(k)},addEventListener:(k,h)=>handlers.set(k,h),removeEventListener:k=>handlers.delete(k)};
  const stop=watchInputModality(doc); assert.equal(attrs.get('data-st-input-modality'),'pointer');
  handlers.get('keydown')({key:'Tab'}); assert.equal(attrs.get('data-st-input-modality'),'keyboard');
  handlers.get('pointerdown')({}); assert.equal(attrs.get('data-st-input-modality'),'pointer');
  stop(); assert.equal(handlers.size,0); assert.equal(attrs.size,0);
});
test('hover/focus never dismiss; only a trusted press in another Steam document dismisses', () => {
  const handlers = new Map();
  const outside = { addEventListener(type, handler) { handlers.set(type, handler); }, removeEventListener(type, handler) { assert.equal(handlers.get(type), handler); handlers.delete(type); } };
  const inside = { addEventListener() { assert.fail('inside document must not be watched'); } };
  global.g_PopupManager = { GetPopups: () => [{ m_popup: { document: inside } }, { m_popup: { document: outside } }] };
  let closes = 0; const stop = watchOutsideClicks(inside, () => closes++);
  try {
    assert.deepEqual([...handlers.keys()], ['pointerdown']);
    handlers.get('pointerdown')({ isTrusted: false, currentTarget: outside }); assert.equal(closes, 0);
    handlers.get('pointerdown')({ isTrusted: true, currentTarget: inside }); assert.equal(closes, 0);
    handlers.get('pointerdown')({ isTrusted: true, currentTarget: outside }); assert.equal(closes, 1);
  } finally { stop(); delete global.g_PopupManager; }
  assert.equal(handlers.size, 0);
});
