import { SteamAchievementInput } from '../../core/src/model';
import { assertAppId } from '../../core/src/security';
import { SteamAchievementResponse, SteamClientAchievement, SteamClientLike, Unregisterable } from './steam-types';
import { decodeAchievementChangeAppId } from './protobuf';

export class SteamAchievementAdapter {
  constructor(private readonly steam: SteamClientLike) {}

  async getMyAchievements(appId: number): Promise<SteamAchievementInput[]> {
    assertAppId(appId);
    const response = await this.steam.Apps.GetMyAchievementsForApp(String(appId));
    return extractAchievementArray(response).map(mapSteamAchievement);
  }

  onAchievementChanged(callback: (appId: number | null) => void): () => void {
    const handle = this.steam.Apps.RegisterForAchievementChanges((data) => {
      callback(decodeAchievementChangeAppId(data));
    });
    return () => safelyUnregister(handle);
  }
}

/**
 * Extracts a recognized Steam achievement array. An explicitly present empty array is valid.
 * An unknown response shape throws so schema drift can never be mistaken for "this game has 0 achievements".
 */
export function extractAchievementArray(response: unknown): SteamClientAchievement[] {
  if (Array.isArray(response)) return response.filter(isAchievementLike);
  if (!response || typeof response !== 'object') throw new Error('Unrecognized Steam achievement response.');
  const record = response as SteamAchievementResponse;
  if (record.result !== undefined && record.result !== 1) {
    throw new Error(`Steam could not read achievements (result ${record.result}). Cached trophies have been preserved.`);
  }

  const directCandidates: unknown[] = [record.achievements, record.vecAchievements, record.rgAchievements];
  for (const value of directCandidates) {
    if (Array.isArray(value)) return value.filter(isAchievementLike);
  }
  if (record.data && typeof record.data === 'object' && Array.isArray(record.data.rgAchievements)) {
    return record.data.rgAchievements.filter(isAchievementLike);
  }

  // Steam's shape can drift. Search at most two object levels and only accept a non-empty
  // array if it contains recognizable achievement fields. Empty unknown arrays are ambiguous.
  for (const value of Object.values(record)) {
    if (Array.isArray(value) && value.some(isAchievementLike)) return value.filter(isAchievementLike);
    if (value && typeof value === 'object') {
      for (const nested of Object.values(value)) {
        if (Array.isArray(nested) && nested.some(isAchievementLike)) return nested.filter(isAchievementLike);
      }
    }
  }
  throw new Error('Steam achievement response shape changed; refusing destructive empty refresh.');
}

function isAchievementLike(value: unknown): value is SteamClientAchievement {
  if (!value || typeof value !== 'object') return false;
  const v = value as Partial<SteamClientAchievement>;
  return typeof v.strID === 'string' && typeof v.bAchieved === 'boolean';
}

export function mapSteamAchievement(value: SteamClientAchievement): SteamAchievementInput {
  return {
    id: value.strID,
    name: value.strName ?? value.strID,
    description: value.strDescription ?? '',
    hidden: Boolean(value.bHidden),
    achieved: Boolean(value.bAchieved),
    // Local macOS responses contain placeholder zeroes here. Never infer rarity from them.
    globalUnlockPercent: null,
    unlockedAtUnix: Number.isFinite(value.rtUnlocked) && value.rtUnlocked > 0 ? value.rtUnlocked : null,
    iconUrl: value.strImage || null,
    currentProgress: Number.isFinite(value.flCurrentProgress) ? value.flCurrentProgress : null,
    minProgress: Number.isFinite(value.flMinProgress) ? value.flMinProgress : null,
    maxProgress: Number.isFinite(value.flMaxProgress) ? value.flMaxProgress : null,
  };
}

function safelyUnregister(handle: Unregisterable | undefined): void {
  try {
    if (typeof handle?.unregister === 'function') handle.unregister();
    else if (typeof handle?.Unregister === 'function') handle.Unregister();
  } catch {
    // Best-effort cleanup only.
  }
}
