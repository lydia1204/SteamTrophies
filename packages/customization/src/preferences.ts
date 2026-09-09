import type { LibraryPresentationStateV1, NotificationPreferencesV1, QuietHoursV1 } from './types';

export const DEFAULT_LIBRARY_PRESENTATION: LibraryPresentationStateV1 = Object.freeze({ pinnedAppIds: [], hiddenAppIds: [], trackedAppIds: [], artworkStyle: 'capsule', artworkFallbackOrder: ['landscape', 'capsule', 'icon'] as LibraryPresentationStateV1['artworkFallbackOrder'], bronzeBorders: false, silverBorders: false, achievementSize: 44, showHeaderTotal: false, showOriginalPlatinumAchievement: false, allowFallbackShapeChange: false, gameArtwork: {}, achievementGroups:{} });
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferencesV1 = Object.freeze({
  animation: 'slide',
  soundPackId: null,
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
  const artworkFallbackOrder = [...new Set([...(Array.isArray(raw.artworkFallbackOrder) ? raw.artworkFallbackOrder : []), ...DEFAULT_LIBRARY_PRESENTATION.artworkFallbackOrder])].filter((v): v is 'capsule' | 'icon' | 'landscape' => ['capsule','icon','landscape'].includes(v));
  const hiddenAppIds = sanitizeAppIds(raw.hiddenAppIds);
  const gameArtwork: LibraryPresentationStateV1['gameArtwork'] = {};
  const achievementGroups: LibraryPresentationStateV1['achievementGroups'] = {};
  if (raw.achievementGroups && typeof raw.achievementGroups === 'object') for (const [appId,groups] of Object.entries(raw.achievementGroups).slice(0,10000)) {
    if (!/^[1-9]\d{0,9}$/.test(appId) || !Array.isArray(groups)) continue;
    const seen = new Set<string>(), groupIds = new Set<string>();
    achievementGroups[appId] = [];
    for (const group of groups.slice(0,64)) {
      if (!group || typeof group !== 'object' || typeof group.id !== 'string' || !/^[a-z0-9-]{1,64}$/.test(group.id) || groupIds.has(group.id) || typeof group.title !== 'string' || !group.title.trim()) continue;
      groupIds.add(group.id);
      const achievementIds = (Array.isArray(group.achievementIds) ? group.achievementIds : []).slice(0,10000).filter(id => {
        if (typeof id !== 'string' || !id.length || id.length > 256 || seen.has(id)) return false; seen.add(id); return true;
      });
      achievementGroups[appId].push({ id:group.id,title:group.title.trim().slice(0,80),kind:group.kind === 'base' ? 'base' : 'expansion',achievementIds });
    }
  }
  if (raw.gameArtwork && typeof raw.gameArtwork === 'object') for (const [id, entry] of Object.entries(raw.gameArtwork).slice(0,10000)) {
    if (!/^[1-9]\d{0,9}$/.test(id) || !entry || !['capsule','icon','landscape'].includes(entry.style)) continue;
    const fallbackOrder = Array.isArray(entry.fallbackOrder) ? [...new Set(entry.fallbackOrder)].filter(v => ['capsule','icon','landscape'].includes(v)) : [];
    gameArtwork[id] = { style:entry.style, fallbackOrder };
  }
  return { pinnedAppIds: sanitizeAppIds(raw.pinnedAppIds).filter(id => !hiddenAppIds.includes(id)), hiddenAppIds, trackedAppIds: sanitizeAppIds(raw.trackedAppIds), artworkStyle: raw.artworkStyle === 'icon' || raw.artworkStyle === 'landscape' ? raw.artworkStyle : 'capsule', artworkFallbackOrder, bronzeBorders: raw.bronzeBorders === true, silverBorders: raw.silverBorders === true, achievementSize: Number.isFinite(raw.achievementSize) ? Math.max(32, Math.min(72, Math.round(raw.achievementSize!))) : 44, showHeaderTotal: raw.showHeaderTotal === true, showOriginalPlatinumAchievement: raw.showOriginalPlatinumAchievement === true, allowFallbackShapeChange: raw.allowFallbackShapeChange === true, gameArtwork, achievementGroups };
}

export function toggleAppPreference(state: LibraryPresentationStateV1, key: 'pinnedAppIds' | 'hiddenAppIds' | 'trackedAppIds', appId: number, enabled?: boolean): LibraryPresentationStateV1 {
  if (!Number.isSafeInteger(appId) || appId <= 0) throw new Error('Invalid app id.');
  const current = new Set(state[key]);
  const shouldEnable = enabled ?? !current.has(appId);
  if (shouldEnable) current.add(appId); else current.delete(appId);
  const next = { ...state, [key]: [...current] };
  if (shouldEnable && key === 'pinnedAppIds') next.hiddenAppIds = state.hiddenAppIds.filter(id => id !== appId);
  if (shouldEnable && key === 'hiddenAppIds') next.pinnedAppIds = state.pinnedAppIds.filter(id => id !== appId);
  return next;
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
    animation: ['slide', 'fade', 'rise', 'zoom', 'bounce', 'flip', 'none'].includes(String(raw.animation)) ? raw.animation! : 'slide',
    soundPackId: typeof raw.soundPackId === 'string' && /^[a-z0-9][a-z0-9._-]{2,63}$/.test(raw.soundPackId) ? raw.soundPackId : null,
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
