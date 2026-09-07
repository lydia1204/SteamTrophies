import { SteamClientLike } from './steam-types';

declare global {
  interface Window {
    SteamClient?: SteamClientLike;
  }
}

export function resolveSteamClient(globalObject: typeof globalThis = globalThis): SteamClientLike | null {
  const maybe = (globalObject as typeof globalThis & { SteamClient?: SteamClientLike }).SteamClient;
  if (!maybe?.Apps || typeof maybe.Apps.GetMyAchievementsForApp !== 'function') return null;
  return maybe;
}
