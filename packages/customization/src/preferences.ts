import type { LibraryPresentationStateV1, NotificationPreferencesV1, QuietHoursV1 } from './types';

export const DEFAULT_LIBRARY_PRESENTATION: LibraryPresentationStateV1 = Object.freeze({ pinnedAppIds: [], hiddenAppIds: [], trackedAppIds: [] });
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferencesV1 = Object.freeze({
  enabled: true,
  durationMs: 5200,
  position: 'bottom_right',
  soundEnabled: true,
  volume: 0.75,
  showAchievementArtwork: true,
  platinumCelebration: true,
  maxVisible: 4,
  audioCooldownMs: 850,
  quietHours: { enabled: false, startMinute: 0, endMinute: 0 },
});

function sanitizeAppIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map(Number).filter((id) => Number.isSafeInteger(id) && id > 0))].slice(0, 10000);
}

export function validateLibraryPresentation(value: unknown): LibraryPresentationStateV1 {
  const raw = value && typeof value === 'object' ? value as Partial<LibraryPresentationStateV1> : {};
  return { pinnedAppIds: sanitizeAppIds(raw.pinnedAppIds), hiddenAppIds: sanitizeAppIds(raw.hiddenAppIds), trackedAppIds: sanitizeAppIds(raw.trackedAppIds) };
}

export function toggleAppPreference(state: LibraryPresentationStateV1, key: keyof LibraryPresentationStateV1, appId: number, enabled?: boolean): LibraryPresentationStateV1 {
  if (!Number.isSafeInteger(appId) || appId <= 0) throw new Error('Invalid app id.');
  const current = new Set(state[key]);
  const shouldEnable = enabled ?? !current.has(appId);
  if (shouldEnable) current.add(appId); else current.delete(appId);
  return { ...state, [key]: [...current] };
}

function validateQuietHours(value: unknown): QuietHoursV1 {
  const raw = value && typeof value === 'object' ? value as Partial<QuietHoursV1> : {};
  const clampMinute = (n: unknown) => Number.isFinite(n) ? Math.max(0, Math.min(1439, Math.floor(Number(n)))) : 0;
  return { enabled: raw.enabled === true, startMinute: clampMinute(raw.startMinute), endMinute: clampMinute(raw.endMinute) };
}

export function validateNotificationPreferences(value: unknown): NotificationPreferencesV1 {
  const raw = value && typeof value === 'object' ? value as Partial<NotificationPreferencesV1> : {};
  const positions = new Set(['top_left', 'top_right', 'bottom_left', 'bottom_right']);
  return {
    enabled: raw.enabled !== false,
    durationMs: Number.isFinite(raw.durationMs) ? Math.max(1500, Math.min(15000, Math.floor(raw.durationMs!))) : DEFAULT_NOTIFICATION_PREFERENCES.durationMs,
    position: positions.has(String(raw.position)) ? raw.position! : DEFAULT_NOTIFICATION_PREFERENCES.position,
    soundEnabled: raw.soundEnabled !== false,
    volume: Number.isFinite(raw.volume) ? Math.max(0, Math.min(1, raw.volume!)) : DEFAULT_NOTIFICATION_PREFERENCES.volume,
    showAchievementArtwork: raw.showAchievementArtwork !== false,
    platinumCelebration: raw.platinumCelebration !== false,
    maxVisible: Number.isFinite(raw.maxVisible) ? Math.max(1, Math.min(6, Math.floor(raw.maxVisible!))) : DEFAULT_NOTIFICATION_PREFERENCES.maxVisible,
    audioCooldownMs: Number.isFinite(raw.audioCooldownMs) ? Math.max(0, Math.min(5000, Math.floor(raw.audioCooldownMs!))) : DEFAULT_NOTIFICATION_PREFERENCES.audioCooldownMs,
    quietHours: validateQuietHours(raw.quietHours),
  };
}

export function isQuietNow(preferences: NotificationPreferencesV1, date = new Date()): boolean {
  if (!preferences.quietHours.enabled) return false;
  const minute = date.getHours() * 60 + date.getMinutes();
  const { startMinute: start, endMinute: end } = preferences.quietHours;
  if (start === end) return true;
  return start < end ? minute >= start && minute < end : minute >= start || minute < end;
}
