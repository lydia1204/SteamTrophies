import {
  AchievementRecord,
  GameSnapshot,
  GameSummary,
  LibraryIndex,
  PlatinumRecord,
  TrophyEvent,
  TrophyTier,
} from '../../core/src/model';

export class CorruptDataError extends Error {
  constructor(public readonly logicalPath: string, cause?: unknown) {
    super(`Corrupt SteamTrophies data at ${logicalPath}.`);
    this.name = 'CorruptDataError';
    if (cause !== undefined) (this as Error & { cause?: unknown }).cause = cause;
  }
}

export function encodeJson(value: unknown): string {
  return `${JSON.stringify(value)}\n`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function integer(value: unknown): value is number {
  return finite(value) && Number.isSafeInteger(value);
}

function nullableFinite(value: unknown): value is number | null {
  return value === null || finite(value);
}

function nullableInteger(value: unknown): value is number | null {
  return value === null || integer(value);
}

function stringOrNull(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}

function validTier(value: unknown): value is TrophyTier {
  return value === 'bronze' || value === 'silver' || value === 'gold' || value === 'platinum';
}

function validAwardedTier(value: unknown): value is AchievementRecord['awardedTier'] {
  return value === null || value === 'bronze' || value === 'silver' || value === 'gold';
}

function validateAchievement(value: unknown, appId: number): value is AchievementRecord {
  if (!isRecord(value)) return false;
  return value.appId === appId
    && typeof value.id === 'string' && value.id.length > 0 && value.id.length <= 512
    && typeof value.name === 'string' && value.name.length <= 4096
    && typeof value.description === 'string' && value.description.length <= 16384
    && typeof value.hidden === 'boolean'
    && typeof value.achieved === 'boolean'
    && nullableFinite(value.globalUnlockPercent)
    && (value.globalUnlockPercent === null || (value.globalUnlockPercent >= 0 && value.globalUnlockPercent <= 100))
    && nullableInteger(value.unlockedAtUnix)
    && stringOrNull(value.iconUrl)
    && nullableFinite(value.currentProgress)
    && nullableFinite(value.minProgress)
    && nullableFinite(value.maxProgress)
    && (value.tier === 'bronze' || value.tier === 'silver' || value.tier === 'gold')
    && validAwardedTier(value.awardedTier)
    && nullableFinite(value.awardedGlobalUnlockPercent)
    && integer(value.firstObservedAtUnix) && value.firstObservedAtUnix >= 0
    && integer(value.lastObservedAtUnix) && value.lastObservedAtUnix >= 0
    && typeof value.retired === 'boolean';
}

function validatePlatinum(value: unknown, appId: number): value is PlatinumRecord {
  if (!isRecord(value)) return false;
  return value.id === '__STEAM_TROPHIES_PLATINUM__'
    && value.appId === appId
    && value.tier === 'platinum'
    && typeof value.achieved === 'boolean'
    && nullableInteger(value.unlockedAtUnix)
    && typeof value.name === 'string' && value.name.length <= 4096
    && typeof value.description === 'string' && value.description.length <= 16384;
}

function validateSummary(value: unknown, expectedAppId?: number): value is GameSummary {
  if (!isRecord(value)) return false;
  if (!integer(value.appId) || value.appId <= 0 || (expectedAppId !== undefined && value.appId !== expectedAppId)) return false;
  const counts = ['achievementCount', 'earnedCount', 'bronzeCount', 'silverCount', 'goldCount'] as const;
  for (const key of counts) if (!integer(value[key]) || value[key] < 0) return false;
  return typeof value.name === 'string' && value.name.length > 0 && value.name.length <= 4096
    && typeof value.platinumEarned === 'boolean'
    && finite(value.completionPercent) && value.completionPercent >= 0 && value.completionPercent <= 100
    && nullableInteger(value.lastUnlockAtUnix)
    && integer(value.lastRefreshAtUnix) && value.lastRefreshAtUnix >= 0
    && integer(value.staleAfterUnix) && value.staleAfterUnix >= 0
    && typeof value.visible === 'boolean'
    && Number(value.earnedCount) <= Number(value.achievementCount);
}

function validateTotals(value: unknown): value is LibraryIndex['totals'] {
  if (!isRecord(value)) return false;
  for (const key of ['visibleGames', 'earnedTrophies', 'bronze', 'silver', 'gold', 'platinum'] as const) {
    if (!integer(value[key]) || value[key] < 0) return false;
  }
  return true;
}

export function parseGameSnapshot(value: unknown): GameSnapshot {
  if (!isRecord(value) || value.schemaVersion !== 1 || !integer(value.appId) || value.appId <= 0 || typeof value.name !== 'string') {
    throw new Error('Unexpected game snapshot schema.');
  }
  if (!Array.isArray(value.achievements) || value.achievements.length > 10000) throw new Error('Invalid achievement collection.');
  if (!value.achievements.every((row) => validateAchievement(row, value.appId as number))) throw new Error('Invalid achievement row.');
  if (!validatePlatinum(value.platinum, value.appId)) throw new Error('Invalid Platinum state.');
  if (!validateSummary(value.summary, value.appId)) throw new Error('Invalid game summary.');

  const ids = new Set<string>();
  for (const achievement of value.achievements as AchievementRecord[]) {
    if (ids.has(achievement.id)) throw new Error('Duplicate achievement id.');
    ids.add(achievement.id);
  }
  return value as unknown as GameSnapshot;
}

export function parseLibraryIndex(value: unknown): LibraryIndex {
  if (!isRecord(value) || value.schemaVersion !== 1 || !integer(value.generatedAtUnix) || value.generatedAtUnix < 0) {
    throw new Error('Unexpected library index schema.');
  }
  if (!Array.isArray(value.games) || value.games.length > 100000 || !value.games.every((game) => validateSummary(game))) {
    throw new Error('Invalid library index games.');
  }
  if (!validateTotals(value.totals)) throw new Error('Invalid library totals.');

  const ids = new Set<number>();
  for (const game of value.games as GameSummary[]) {
    if (ids.has(game.appId)) throw new Error('Duplicate app id in library index.');
    ids.add(game.appId);
  }
  return value as unknown as LibraryIndex;
}

export function decodeGameSnapshot(text: string, logicalPath: string): GameSnapshot {
  try {
    return parseGameSnapshot(JSON.parse(text) as unknown);
  } catch (error) {
    throw new CorruptDataError(logicalPath, error);
  }
}

export function decodeLibraryIndex(text: string, logicalPath: string): LibraryIndex {
  try {
    return parseLibraryIndex(JSON.parse(text) as unknown);
  } catch (error) {
    throw new CorruptDataError(logicalPath, error);
  }
}

export function encodeEvent(event: TrophyEvent): string {
  return `${JSON.stringify(event)}\n`;
}

export function isTrophyTier(value: unknown): value is TrophyTier {
  return validTier(value);
}
