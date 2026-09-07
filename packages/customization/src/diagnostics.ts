import type { SafeModeStateV1 } from './types';

export const DEFAULT_SAFE_MODE: SafeModeStateV1 = Object.freeze({
  externalPacksDisabled: false,
  themesDisabled: false,
  themeFailureCount: 0,
  lastKnownGoodThemeId: 'builtin.midnight',
});

export function validateSafeModeState(value: unknown): SafeModeStateV1 {
  const raw = value && typeof value === 'object' ? value as Partial<SafeModeStateV1> : {};
  return {
    externalPacksDisabled: raw.externalPacksDisabled === true,
    themesDisabled: raw.themesDisabled === true,
    themeFailureCount: Number.isSafeInteger(raw.themeFailureCount) ? Math.max(0, Math.min(10, raw.themeFailureCount!)) : 0,
    lastKnownGoodThemeId: typeof raw.lastKnownGoodThemeId === 'string' && raw.lastKnownGoodThemeId.length <= 80 ? raw.lastKnownGoodThemeId : 'builtin.midnight',
  };
}

export function recordThemeFailure(state: SafeModeStateV1): SafeModeStateV1 {
  const count = Math.min(10, state.themeFailureCount + 1);
  return { ...state, themeFailureCount: count, themesDisabled: state.themesDisabled || count >= 3 };
}

export function recordThemeSuccess(state: SafeModeStateV1, themeId: string): SafeModeStateV1 {
  return { ...state, themeFailureCount: 0, lastKnownGoodThemeId: themeId };
}
