import { DEFAULT_TROPHY_PACK_ID } from './packs';
import type { TrophyTier } from '../../core/src/model';
import type { CustomizationState, CustomizationStateV1, GameTrophyOverrideV1, TrophyAssetRef } from './types';
import { DEFAULT_LAYOUT_STATE, validateLayoutState } from './layout';
import { DEFAULT_PROJECT_STATE, validateProjectState } from './projects';
import { DEFAULT_LIBRARY_PRESENTATION, DEFAULT_NOTIFICATION_PREFERENCES, toggleAppPreference, validateLibraryPresentation, validateNotificationPreferences } from './preferences';
import { DEFAULT_SAFE_MODE, validateSafeModeState } from './diagnostics';

export const DEFAULT_CUSTOMIZATION_STATE: CustomizationState = Object.freeze({
  version: 2,
  trophies: { version: 1 as const, globalPackId: DEFAULT_TROPHY_PACK_ID, games: {} },
  themeId: 'builtin.midnight',
  layout: DEFAULT_LAYOUT_STATE,
  accessibility: { reducedMotion: false, highContrast: false, textScale: 1, iconScale: 1 },
  projects: DEFAULT_PROJECT_STATE,
  library: DEFAULT_LIBRARY_PRESENTATION,
  notifications: DEFAULT_NOTIFICATION_PREFERENCES,
  safeMode: DEFAULT_SAFE_MODE,
  developer: { focusDebug: false, responsiveDebug: false },
});

export function validateCustomizationState(value: unknown): CustomizationState {
  if (!value || typeof value !== 'object') throw new Error('Customization state must be an object.');
  const version = (value as { version?: unknown }).version;
  if (version === 1) return migrateV1(value as CustomizationStateV1);
  if (version !== 2) throw new Error('Unsupported customization state version.');
  const v = value as Partial<CustomizationState>;
  const base = validateCommon(v);
  return {
    version: 2,
    ...base,
    projects: validateProjectState(v.projects),
    library: validateLibraryPresentation(v.library),
    notifications: validateNotificationPreferences(v.notifications),
    safeMode: validateSafeModeState(v.safeMode),
    developer: {
      focusDebug: v.developer?.focusDebug === true,
      responsiveDebug: v.developer?.responsiveDebug === true,
    },
  };
}

function migrateV1(v: CustomizationStateV1): CustomizationState {
  const base = validateCommon(v);
  return {
    version: 2,
    ...base,
    projects: structuredClone(DEFAULT_PROJECT_STATE),
    library: structuredClone(DEFAULT_LIBRARY_PRESENTATION),
    notifications: structuredClone(DEFAULT_NOTIFICATION_PREFERENCES),
    safeMode: structuredClone(DEFAULT_SAFE_MODE),
    developer: { focusDebug: false, responsiveDebug: false },
  };
}

function validateCommon(v: Partial<CustomizationStateV1 | CustomizationState>) {
  if (!v.trophies || v.trophies.version !== 1 || typeof v.trophies.globalPackId !== 'string' || !v.trophies.games || typeof v.trophies.games !== 'object') {
    throw new Error('Invalid trophy customization state.');
  }
  const games: Record<string, GameTrophyOverrideV1> = {};
  for (const [appId, raw] of Object.entries(v.trophies.games)) {
    if (!/^\d{1,10}$/.test(appId)) throw new Error('Invalid game override app id.');
    if (!raw || typeof raw !== 'object') throw new Error('Invalid game override.');
    games[appId] = sanitizeGameOverride(raw);
  }
  if (typeof v.themeId !== 'string' || v.themeId.length > 80) throw new Error('Invalid theme id.');
  if (!v.accessibility || typeof v.accessibility !== 'object') throw new Error('Invalid accessibility preferences.');
  const { reducedMotion, highContrast, textScale, iconScale } = v.accessibility;
  if (typeof reducedMotion !== 'boolean' || typeof highContrast !== 'boolean') throw new Error('Invalid accessibility flags.');
  if (!Number.isFinite(textScale) || textScale! < 0.8 || textScale! > 2) throw new Error('Invalid text scale.');
  if (!Number.isFinite(iconScale) || iconScale! < 0.8 || iconScale! > 2) throw new Error('Invalid icon scale.');
  return {
    trophies: { version: 1 as const, globalPackId: v.trophies.globalPackId, games },
    themeId: v.themeId!,
    layout: validateLayoutState(v.layout),
    accessibility: { reducedMotion, highContrast, textScale: textScale!, iconScale: iconScale! },
  };
}

function sanitizeGameOverride(raw: GameTrophyOverrideV1): GameTrophyOverrideV1 {
  const result: GameTrophyOverrideV1 = {};
  if (raw.packId != null) {
    if (typeof raw.packId !== 'string' || raw.packId.length > 80) throw new Error('Invalid game pack override.');
    result.packId = raw.packId;
  }
  if (raw.tierOverrides) {
    result.tierOverrides = {};
    for (const tier of ['bronze', 'silver', 'gold', 'platinum'] as TrophyTier[]) {
      const ref = raw.tierOverrides[tier];
      if (ref) result.tierOverrides[tier] = validateAssetRef(ref);
    }
  }
  if (raw.achievementOverrides) {
    result.achievementOverrides = {};
    for (const [id, ref] of Object.entries(raw.achievementOverrides)) {
      if (id.length < 1 || id.length > 256) throw new Error('Invalid achievement override id.');
      result.achievementOverrides[id] = validateAssetRef(ref);
    }
  }
  return result;
}

function validateAssetRef(ref: TrophyAssetRef): TrophyAssetRef {
  if (!ref || typeof ref !== 'object' || typeof ref.packId !== 'string' || ref.packId.length > 80) throw new Error('Invalid trophy asset override.');
  if (!['trophy.bronze', 'trophy.silver', 'trophy.gold', 'trophy.platinum'].includes(ref.resourceKey) && !/^custom\.[a-z0-9][a-z0-9._-]{0,63}$/.test(ref.resourceKey)) throw new Error('Invalid trophy resource key.');
  return { packId: ref.packId, resourceKey: ref.resourceKey };
}

export function setGlobalPack(state: CustomizationState, packId: string): CustomizationState {
  return { ...state, trophies: { ...state.trophies, globalPackId: packId } };
}

export function setGamePackOverride(state: CustomizationState, appId: number, packId: string | null): CustomizationState {
  return updateGameOverride(state, appId, (next) => { if (packId == null) delete next.packId; else next.packId = packId; });
}

export function setTierOverride(state: CustomizationState, appId: number, tier: TrophyTier, ref: TrophyAssetRef | null): CustomizationState {
  return updateGameOverride(state, appId, (next) => {
    const tierOverrides = { ...(next.tierOverrides ?? {}) };
    if (ref) tierOverrides[tier] = validateAssetRef(ref); else delete tierOverrides[tier];
    if (Object.keys(tierOverrides).length) next.tierOverrides = tierOverrides; else delete next.tierOverrides;
  });
}

export function setAchievementOverride(state: CustomizationState, appId: number, achievementId: string, ref: TrophyAssetRef | null): CustomizationState {
  if (!achievementId || achievementId.length > 256) throw new Error('Invalid achievement id.');
  return updateGameOverride(state, appId, (next) => {
    const achievementOverrides = { ...(next.achievementOverrides ?? {}) };
    if (ref) achievementOverrides[achievementId] = validateAssetRef(ref); else delete achievementOverrides[achievementId];
    if (Object.keys(achievementOverrides).length) next.achievementOverrides = achievementOverrides; else delete next.achievementOverrides;
  });
}

function updateGameOverride(state: CustomizationState, appId: number, mutate: (next: GameTrophyOverrideV1) => void): CustomizationState {
  if (!Number.isSafeInteger(appId) || appId <= 0) throw new Error('Invalid app id.');
  const games = { ...state.trophies.games };
  const key = String(appId);
  const next = { ...(games[key] ?? {}) };
  mutate(next);
  if (Object.keys(next).length === 0) delete games[key]; else games[key] = next;
  return { ...state, trophies: { ...state.trophies, games } };
}

export function setAppPinned(state: CustomizationState, appId: number, enabled?: boolean): CustomizationState {
  return { ...state, library: toggleAppPreference(state.library, 'pinnedAppIds', appId, enabled) };
}
export function setAppHidden(state: CustomizationState, appId: number, enabled?: boolean): CustomizationState {
  return { ...state, library: toggleAppPreference(state.library, 'hiddenAppIds', appId, enabled) };
}
export function setAppTracked(state: CustomizationState, appId: number, enabled?: boolean): CustomizationState {
  return { ...state, library: toggleAppPreference(state.library, 'trackedAppIds', appId, enabled) };
}

export function removePackReferences(state: CustomizationState, packId: string): CustomizationState {
  if (!packId || packId.startsWith('builtin.')) return state;
  const games: Record<string, GameTrophyOverrideV1> = {};
  for (const [appId, raw] of Object.entries(state.trophies.games)) {
    const next: GameTrophyOverrideV1 = { ...raw };
    if (next.packId === packId) delete next.packId;
    if (next.tierOverrides) {
      const tierOverrides = { ...next.tierOverrides };
      for (const tier of ['bronze', 'silver', 'gold', 'platinum'] as TrophyTier[]) if (tierOverrides[tier]?.packId === packId) delete tierOverrides[tier];
      if (Object.keys(tierOverrides).length === 0) delete next.tierOverrides; else next.tierOverrides = tierOverrides;
    }
    if (next.achievementOverrides) {
      const achievementOverrides = Object.fromEntries(Object.entries(next.achievementOverrides).filter(([, ref]) => ref.packId !== packId)) as GameTrophyOverrideV1['achievementOverrides'];
      if (Object.keys(achievementOverrides ?? {}).length === 0) delete next.achievementOverrides; else next.achievementOverrides = achievementOverrides;
    }
    if (Object.keys(next).length > 0) games[appId] = next;
  }
  return { ...state, trophies: { ...state.trophies, globalPackId: state.trophies.globalPackId === packId ? DEFAULT_TROPHY_PACK_ID : state.trophies.globalPackId, games } };
}
