const test = require('node:test');
const assert = require('node:assert/strict');
const { TROPHY_TOAST_OWNER, isTrophyNotification, prepareTrophyNotification, sendTrophyNotification, routeTrophyToOverlay, removeTrophyNotification } = require('../../../.test-build/frontend/runtime/native-toast-compat.js');
const own = (id = 'test') => ({ nNotificationID: 123, rtCreated: Date.now(), data: { sttOwner: TROPHY_TOAST_OWNER, sttModel: { id } } });
function fixture(entries, queues = new Map()) {
  return { m_rgNotificationToasts: entries, m_mapAppOverlayToasts: queues, ExpireToast(entry) { this.m_rgNotificationToasts.splice(this.m_rgNotificationToasts.indexOf(entry), 1); } };
}
test('compatibility only normalizes explicitly owned notifications, preserving Steam and other plugins', () => {
  for (const foreign of [{}, { millennium: true, data: {} }, { data: { sttModel: { id: 'other' } } }]) {
    const args = [{ sound: 6 }, foreign]; const copy = structuredClone(args);
    prepareTrophyNotification(args); assert.deepEqual(args, copy); assert.equal(isTrophyNotification(foreign), false);
  }
  const entry = own(); const args = [{ sound: 6, showToast: true }, entry]; prepareTrophyNotification(args);
  assert.equal(entry.notificationID, 123); assert.ok(entry.rtCreated < 1e11);
  assert.equal(args[0].sound, 0); assert.equal(args[0].playSound, false); assert.equal(args[0].showToast, true);
});
test('only the matching trophy moves into an already registered game overlay', () => {
  const foreign = { notificationID: 1 }; const entry = own(); const queue = [foreign]; const store = fixture([foreign, entry], new Map([[105600, queue]]));
  assert.deepEqual(routeTrophyToOverlay(store, 'test', 105600, false), { entry, appId: 105600 });
  assert.deepEqual(store.m_rgNotificationToasts, [foreign]); assert.deepEqual(queue, [foreign, entry]);
  removeTrophyNotification(store, entry, 105600); assert.deepEqual(queue, [foreign]);
});
test('no overlay or suppressed toast does not create a queue or bypass Steam notification settings', () => {
  const entry = own(); const store = fixture([entry]);
  assert.deepEqual(routeTrophyToOverlay(store, 'test', 105600, false), { entry });
  assert.equal(store.m_mapAppOverlayToasts.size, 0); assert.deepEqual(store.m_rgNotificationToasts, [entry]);
  assert.deepEqual(routeTrophyToOverlay(fixture([]), 'test', 105600, false), {});
  assert.deepEqual(routeTrophyToOverlay(undefined, 'test', 105600, false), {});
});
test('delayed preview selects a single active overlay but never guesses between two', () => {
  const entry = own(); const store = fixture([entry], new Map([[105600, []]]));
  assert.equal(routeTrophyToOverlay(store, 'test', 0, true).appId, 105600);
  const another = fixture([own()], new Map([[105600, []], [10, []]]));
  assert.equal(routeTrophyToOverlay(another, 'test', 0, true).appId, undefined);
  assert.equal(another.m_rgNotificationToasts.length, 1);
});
test('dismissal cannot remove foreign notifications or an expired trophy by a colliding ID', () => {
  const foreign = { notificationID: 123 }; const entry = own(); const store = fixture([foreign]);
  removeTrophyNotification(store, foreign); removeTrophyNotification(store, entry);
  assert.deepEqual(store.m_rgNotificationToasts, [foreign]);
});
test('native transport calls a read-only Steam action without replacing it', () => {
  const tray = []; let received; const store = { m_nNextTestNotificationID: 501, RemoveGroupFromTray(group) { tray.splice(tray.indexOf(group), 1); } };
  Object.defineProperty(store, 'ProcessNotification', { writable: false, value(info, entry, kind) { received = { info, entry, kind }; info.fnTray(entry, tray); } });
  const original = store.ProcessNotification;
  const dispose = sendTrophyNotification(store, { sttOwner: TROPHY_TOAST_OWNER, sttModel: { id: 'owned' }, duration: 5200 });
  assert.equal(store.ProcessNotification, original); assert.equal(received.entry.notificationID, 501);
  assert.equal(received.info.playSound, false); assert.equal(received.kind, 0); assert.equal(tray.length, 1);
  dispose(); assert.equal(tray.length, 0);
});
