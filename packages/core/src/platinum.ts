import { AchievementRecord, AppId, PlatinumRecord } from './model';
export const PLATINUM_ID = '__STEAM_TROPHIES_PLATINUM__' as const;
// Explicit identity verified from Forager's Steam schema: Completionist, "Achieve every other feat".
// Never infer completion from arbitrary achievement names.
const COMPLETION_MILESTONES: Readonly<Record<number, string>> = { 751780: 'feat83' };
export function completionAchievement(achievements: readonly AchievementRecord[], platinum: PlatinumRecord): AchievementRecord | null {
  if (!platinum.achieved) return null;
  if (platinum.completionAchievementId) return achievements.find(a => a.id === platinum.completionAchievementId && a.achieved) ?? null;
  if (platinum.unlockedAtUnix == null) return null;
  const candidates = achievements.filter(a => a.achieved && a.unlockedAtUnix === platinum.unlockedAtUnix);
  return candidates.length === 1 ? candidates[0] : null;
}
export function computePlatinum(appId: AppId, achievements: readonly AchievementRecord[], previous?: PlatinumRecord, _nowUnix = Math.floor(Date.now()/1000)): PlatinumRecord {
  const all = achievements.length > 0 && achievements.every(a => a.achieved);
  const milestone = achievements.find(a => a.id === COMPLETION_MILESTONES[appId] && a.achieved);
  const known = achievements.every(a => a.unlockedAtUnix != null);
  const achieved = all || !!previous?.achieved || !!milestone;
  const unlockedAtUnix = previous?.achieved ? previous.unlockedAtUnix : milestone ? milestone.unlockedAtUnix : all && known ? Math.max(...achievements.map(a => a.unlockedAtUnix!)) : null;
  const result: PlatinumRecord = { id: PLATINUM_ID, appId, tier: 'platinum', achieved, unlockedAtUnix, name: 'Platinum', description: 'Earn every Steam achievement in this game.', completionAchievementId: previous?.completionAchievementId ?? null };
  if (!result.completionAchievementId) result.completionAchievementId = (previous?.achieved ? completionAchievement(achievements, result) : milestone ?? completionAchievement(achievements, result))?.id ?? null;
  return result;
}
