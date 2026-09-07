export interface SteamClientAchievement {
  bAchieved: boolean;
  bHidden: boolean;
  flMinProgress: number;
  flCurrentProgress: number;
  flMaxProgress: number;
  flAchieved: number;
  rtUnlocked: number;
  strDescription: string;
  strID: string;
  strImage: string;
  strName: string;
}
export interface SteamAchievementResponse {
  result?: unknown;
  data?: { rgAchievements?: SteamClientAchievement[]; [key:string]:unknown };
  achievements?: SteamClientAchievement[];
  vecAchievements?: SteamClientAchievement[];
  rgAchievements?: SteamClientAchievement[];
  [key:string]: unknown;
}
export interface Unregisterable { unregister?:()=>void; Unregister?:()=>void; }
export interface SteamAppsApi {
  GetMyAchievementsForApp(appId:string):Promise<SteamAchievementResponse|unknown>;
  GetFriendAchievementsForApp(appId:string,friendSteam64Id:string):Promise<SteamAchievementResponse|unknown>;
  GetFriendsWhoPlay(appId:number):Promise<string[]>;
  RegisterForAchievementChanges(callback:(data:ArrayBuffer)=>void):Unregisterable;
}
export interface SteamClientLike { Apps:SteamAppsApi; }
