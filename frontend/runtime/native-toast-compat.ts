/** Narrow adapter for the installed Millennium/Steam toast contract. Never claims native toasts. */
export const TROPHY_TOAST_OWNER = 'dev.steamtrophies.client/v1';
export function isTrophyNotification(notification: any): boolean {
  return notification?.data?.sttOwner === TROPHY_TOAST_OWNER && typeof notification?.data?.sttModel?.id === 'string';
}

export function prepareTrophyNotification(args: any[]): void {
  const notification = args[1];
  if (!isTrophyNotification(notification)) return;
  // The installed SDK still sends the old ID field and omits playSound from its info object.
  if (notification.notificationID == null) notification.notificationID = notification.nNotificationID;
  notification.rtCreated = Math.floor(Date.now() / 1000);
  args[0] = { ...args[0], sound: 0, playSound: false };
}

/** Same native entry point as the SDK, without assigning to Steam's bound read-only action. */
export function sendTrophyNotification(store: any, data: any): () => void {
  if (typeof store?.ProcessNotification !== 'function' || !Number.isFinite(store.m_nNextTestNotificationID)) throw new Error('Steam native notification transport unavailable');
  let group: any;
  const entry = { nNotificationID: store.m_nNextTestNotificationID++, eSource: 1, eType: 12, bNewIndicator: false, nToastDurationMS: data.duration, data, millennium: true };
  const info = { showToast: true, bCritical: false, eFeature: 0, toastDurationMS: data.duration, fnTray(notification: any, tray: any[]) { group = { eType: notification.eType, notifications: [notification] }; tray.unshift(group); } };
  const args = [info, entry, 0];
  prepareTrophyNotification(args);
  store.ProcessNotification(...args);
  return () => { if (group && typeof store.RemoveGroupFromTray === 'function') store.RemoveGroupFromTray(group); };
}

/** Use only an overlay queue Steam has already registered; never invent overlay availability. */
export function routeTrophyToOverlay(store: any, id: string, appId: number, preview: boolean): { entry?: any; appId?: number } {
  const desktop = store?.m_rgNotificationToasts;
  const overlays = store?.m_mapAppOverlayToasts;
  if (!Array.isArray(desktop) || typeof overlays?.get !== 'function' || typeof store?.ExpireToast !== 'function') return {};
  const entry = desktop.find((item: any) => isTrophyNotification(item) && item.data.sttModel.id === id);
  if (!entry) return {}; // Steam suppressed it: do not bypass its notification preferences.
  let target = appId;
  if (!target && preview && typeof overlays.keys === 'function') {
    const ids = [...overlays.keys()];
    if (ids.length === 1 && typeof ids[0] === 'number') target = ids[0];
  }
  const queue = overlays.get(target);
  if (!target || !Array.isArray(queue)) return { entry };
  store.ExpireToast(entry);
  queue.push(entry);
  return { entry, appId: target };
}

export function removeTrophyNotification(store: any, entry: any, appId?: number): void {
  if (!isTrophyNotification(entry)) return;
  const queue = appId ? store?.m_mapAppOverlayToasts?.get?.(appId) : store?.m_rgNotificationToasts;
  if (!Array.isArray(queue)) return;
  const index = queue.indexOf(entry);
  if (index < 0) return;
  if (appId) queue.splice(index, 1);
  else store.ExpireToast?.(entry);
}
