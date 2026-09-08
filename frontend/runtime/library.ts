import { safeAssetUrl } from '../../packages/core/src/security';

export interface SteamAppOverview {
  appid?: number | string;
  appid_num?: number;
  display_name?: string;
  sort_as?: string;
  app_type?: number;
}

declare const appStore: {
  m_mapApps?: { keys(): IterableIterator<unknown>; get(id: number): SteamAppOverview | undefined };
  GetAppOverviewByAppID?: (appId: number) => SteamAppOverview | null | undefined;
  GetIconURLForApp?: (app: SteamAppOverview) => string;
  GetVerticalCapsuleURLForApp?: (app: SteamAppOverview) => string;
} | undefined;

export function resolveGameName(appId: number): string {
  try {
    if (typeof appStore === 'undefined') return `Steam App ${appId}`;
    const overview = appStore.GetAppOverviewByAppID?.(appId) ?? appStore.m_mapApps?.get(appId);
    return overview?.display_name?.trim() || overview?.sort_as?.trim() || `Steam App ${appId}`;
  } catch {
    return `Steam App ${appId}`;
  }
}

/**
 * Enumerates Steam's already-loaded in-memory library map. This is intentionally called only
 * for background first-run discovery, never from the trophy-button click path.
 */
export function libraryAppIds(store: { m_mapApps?: { keys(): Iterable<unknown>; get?(id: number): SteamAppOverview | undefined } } | undefined): number[] {
  try {
    if (typeof store?.m_mapApps?.keys !== 'function') return [];
    return [...new Set([...store.m_mapApps.keys()]
      .filter((id) => typeof id === 'number' || (typeof id === 'string' && /^\d+$/.test(id)))
      .map(Number))]
      .filter((id) => Number.isSafeInteger(id) && id > 0 && id <= 0xffffffff)
      .filter((id) => { const type = store.m_mapApps?.get?.(id)?.app_type; return type === undefined || type === 1; })
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}

/** Uses Steam's resolved artwork URL; does not guess CDN paths or game identity. */
export type GameArtworkStyle = 'capsule' | 'icon' | 'landscape';
export function artworkOrder(preferred: GameArtworkStyle, fallback: readonly GameArtworkStyle[]): GameArtworkStyle[] { return [...new Set([preferred, ...fallback])]; }
export function resolveGameArtwork(appId: number, style: GameArtworkStyle = 'icon'): string | null {
  try {
    if (!Number.isSafeInteger(appId) || appId <= 0) return null;
    // Valve's store header capsule, verified on the installed app ID and public CDN.
    if (style === 'landscape') return safeAssetUrl(`https://shared.steamstatic.com/store_item_assets/steam/apps/${appId}/header.jpg`);
    if (typeof appStore === 'undefined') return null;
    const app = appStore.GetAppOverviewByAppID?.(appId);
    return app ? safeAssetUrl((style === 'capsule' ? appStore.GetVerticalCapsuleURLForApp?.(app) : appStore.GetIconURLForApp?.(app)) || null) : null;
  } catch { return null; }
}

export async function discoverLibraryAppIds(): Promise<number[]> {
  return libraryAppIds(typeof appStore === 'undefined' ? undefined : appStore);
}
