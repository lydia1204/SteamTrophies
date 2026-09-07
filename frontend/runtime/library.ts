export interface SteamAppOverview {
  appid?: number | string;
  appid_num?: number;
  display_name?: string;
  sort_as?: string;
}

declare const appStore: {
  m_mapApps?: Map<number, SteamAppOverview>;
  GetAppOverviewByAppID?: (appId: number) => SteamAppOverview | null | undefined;
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
export async function discoverLibraryAppIds(): Promise<number[]> {
  try {
    if (typeof appStore === 'undefined' || !(appStore.m_mapApps instanceof Map)) return [];
    return [...appStore.m_mapApps.keys()]
      .map(Number)
      .filter((id) => Number.isSafeInteger(id) && id > 0 && id <= 0xffffffff)
      .sort((a, b) => a - b);
  } catch {
    return [];
  }
}
