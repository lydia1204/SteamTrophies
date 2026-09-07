export interface FriendProfile { steamId: string; personaName: string; avatarUrl?: string; }
export interface FriendGameAchievement { apiName: string; achieved: boolean; unlockTimeUnix: number | null; }
export interface FriendGameProgress { steamId: string; appId: number; achievements: FriendGameAchievement[]; earnedCount: number; totalCount: number; completionPercent: number; }
export type FriendDataAvailability = 'available' | 'private' | 'not_owned' | 'api_error';
