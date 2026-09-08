export type AppId = number;
export type AchievementId = string;
export type TrophyTier = 'bronze' | 'silver' | 'gold' | 'platinum';
export interface TierThresholds { goldMaxPercent: number; silverMaxPercent: number; }
export const DEFAULT_TIER_THRESHOLDS: TierThresholds = Object.freeze({ goldMaxPercent: 5, silverMaxPercent: 20 });
export interface SteamAchievementInput { id:string; name:string; description:string; hidden:boolean; achieved:boolean; globalUnlockPercent:number|null; unlockedAtUnix:number|null; iconUrl:string|null; currentProgress:number|null; minProgress:number|null; maxProgress:number|null; }
export interface AchievementRecord extends SteamAchievementInput { appId:AppId; tier:Exclude<TrophyTier,'platinum'>; awardedTier:Exclude<TrophyTier,'platinum'>|null; awardedGlobalUnlockPercent:number|null; firstObservedAtUnix:number; lastObservedAtUnix:number; /** True when Steam no longer reports this achievement but it was already earned. Historical trophies are never silently deleted. */ retired:boolean; }
export interface PlatinumRecord { id:'__STEAM_TROPHIES_PLATINUM__'; appId:AppId; tier:'platinum'; achieved:boolean; unlockedAtUnix:number|null; name:string; description:string; completionAchievementId?:string|null; }
export interface GameSummary { appId:AppId; name:string; achievementCount:number; earnedCount:number; bronzeCount:number; silverCount:number; goldCount:number; platinumEarned:boolean; completionPercent:number; lastUnlockAtUnix:number|null; lastRefreshAtUnix:number; staleAfterUnix:number; visible:boolean; }
export interface GameSnapshot { schemaVersion:1; appId:AppId; name:string; achievements:AchievementRecord[]; platinum:PlatinumRecord; summary:GameSummary; rarityRevision?:1; }
export interface LibraryIndex { schemaVersion:1; generatedAtUnix:number; games:GameSummary[]; totals:{visibleGames:number; earnedTrophies:number; bronze:number; silver:number; gold:number; platinum:number}; }
export type TrophyEvent = {version:1;type:'achievement_unlocked';atUnix:number;appId:AppId;achievementId:AchievementId;tier:Exclude<TrophyTier,'platinum'>;globalUnlockPercent:number|null}|{version:1;type:'platinum_unlocked';atUnix:number;appId:AppId}|{version:1;type:'game_refreshed';atUnix:number;appId:AppId;achievementCount:number;earnedCount:number};
export interface VisibilityPolicy { mode:'earned_only'|'achievement_capable'; }
export const DEFAULT_VISIBILITY_POLICY: VisibilityPolicy = Object.freeze({ mode:'earned_only' });
