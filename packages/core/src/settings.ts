import { DEFAULT_TIER_THRESHOLDS, TierThresholds, VisibilityPolicy } from './model';
import { validateThresholds } from './rarity';

export interface TrophySettings {
  version: 1;
  thresholds: TierThresholds;
  visibility: VisibilityPolicy;
  staleTtlSeconds: number;
  refreshConcurrency: number;
  assetCacheBudgetMiB: number;
  preserveAwardTier: true;
}

export const DEFAULT_SETTINGS: TrophySettings = Object.freeze({
  version: 1,
  thresholds: DEFAULT_TIER_THRESHOLDS,
  visibility: { mode: 'earned_only' as const },
  staleTtlSeconds: 600,
  refreshConcurrency: 4,
  assetCacheBudgetMiB: 512,
  preserveAwardTier: true,
});

export function validateSettings(value: unknown): TrophySettings {
  if (!value || typeof value !== 'object') throw new Error('Settings must be an object.');
  const v = value as Partial<TrophySettings>;
  if (v.version !== 1) throw new Error('Unsupported settings version.');
  if (!v.thresholds || typeof v.thresholds !== 'object') throw new Error('Missing rarity thresholds.');
  validateThresholds(v.thresholds as TierThresholds);
  if (!v.visibility || !['earned_only', 'achievement_capable'].includes(v.visibility.mode ?? '')) {
    throw new Error('Invalid visibility mode.');
  }
  if (!Number.isInteger(v.staleTtlSeconds) || v.staleTtlSeconds! < 30 || v.staleTtlSeconds! > 86_400) {
    throw new Error('Invalid stale TTL.');
  }
  if (!Number.isInteger(v.refreshConcurrency) || v.refreshConcurrency! < 1 || v.refreshConcurrency! > 8) {
    throw new Error('Invalid refresh concurrency.');
  }
  if (!Number.isInteger(v.assetCacheBudgetMiB) || v.assetCacheBudgetMiB! < 64 || v.assetCacheBudgetMiB! > 8192) {
    throw new Error('Invalid asset cache budget.');
  }
  if (v.preserveAwardTier !== true) throw new Error('Award-tier history cannot be disabled in v1.');
  return {
    version: 1,
    thresholds: {
      goldMaxPercent: v.thresholds.goldMaxPercent,
      silverMaxPercent: v.thresholds.silverMaxPercent,
    },
    visibility: { mode: v.visibility.mode },
    staleTtlSeconds: v.staleTtlSeconds!,
    refreshConcurrency: v.refreshConcurrency!,
    assetCacheBudgetMiB: v.assetCacheBudgetMiB!,
    preserveAwardTier: true,
  };
}
