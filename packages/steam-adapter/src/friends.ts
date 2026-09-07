import { SteamAchievementInput } from '../../core/src/model';
import { extractAchievementArray, mapSteamAchievement } from './achievements';
import { SteamClientLike } from './steam-types';

export class SteamFriendAchievementAdapter {
  constructor(private readonly steam: SteamClientLike) {}

  async getFriendsWhoPlay(appId: number): Promise<string[]> {
    if (!Number.isSafeInteger(appId) || appId <= 0) throw new Error('Invalid app id.');
    const ids = await this.steam.Apps.GetFriendsWhoPlay(appId);
    return ids.filter((id) => /^\d{17}$/.test(id));
  }

  async getFriendAchievements(appId: number, steamId64: string): Promise<SteamAchievementInput[]> {
    if (!Number.isSafeInteger(appId) || appId <= 0) throw new Error('Invalid app id.');
    if (!/^\d{17}$/.test(steamId64)) throw new Error('Invalid SteamID64.');
    const response = await this.steam.Apps.GetFriendAchievementsForApp(String(appId), steamId64);
    return extractAchievementArray(response).map(mapSteamAchievement);
  }
}
