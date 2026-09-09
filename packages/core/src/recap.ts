import type { AchievementRecord, GameSnapshot, TrophyTier } from './model';

export type RecapPeriod = 'week' | 'month' | 'year';
export function recapStart(period:RecapPeriod, now:Date):number {
  const start = new Date(now.getFullYear(), period === 'year' ? 0 : now.getMonth(), period === 'week' ? now.getDate()-6 : 1);
  return Math.floor(start.getTime()/1000);
}
/** A bound, not a joint probability. Unlock percentages alone cannot tell us exact completion rarity. */
export function completionRarityLimit(achievements:readonly AchievementRecord[], verified:boolean):number|null {
  if (!verified || !achievements.length || achievements.some(a => a.globalUnlockPercent == null || !Number.isFinite(a.globalUnlockPercent) || a.globalUnlockPercent < 0 || a.globalUnlockPercent > 100)) return null;
  return Math.min(...achievements.map(a => a.globalUnlockPercent!));
}
export function buildRecap(games:readonly GameSnapshot[], period:RecapPeriod, now = new Date()) {
  const start = recapStart(period,now), end = Math.floor(now.getTime()/1000);
  const tiers:Record<TrophyTier,number> = { bronze:0,silver:0,gold:0,platinum:0 };
  const byGame:{ appId:number;name:string;achievements:number;platinums:number }[] = [];
  const days = new Set<number>();
  let unknownDates = 0;
  let rarest:{ game:string; name:string; percent:number }|null = null;
  const seen = new Set<number>();
  for (const game of games) {
    if (seen.has(game.appId)) continue; seen.add(game.appId);
    const entry = { appId:game.appId,name:game.name,achievements:0,platinums:0 };
    for (const a of game.achievements) {
      if (!a.achieved) continue;
      if (!a.unlockedAtUnix) { unknownDates++; continue; }
      if (a.unlockedAtUnix < start || a.unlockedAtUnix > end) continue;
      tiers[a.awardedTier ?? a.tier]++; entry.achievements++;
      const date = new Date(a.unlockedAtUnix*1000);
      days.add(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate())/86400000);
      if (game.rarityRevision === 1 && a.globalUnlockPercent != null && (!rarest || a.globalUnlockPercent < rarest.percent)) rarest = { game:game.name,name:a.name,percent:a.globalUnlockPercent };
    }
    const plat = game.platinum;
    if (plat.achieved && plat.unlockedAtUnix != null && plat.unlockedAtUnix >= start && plat.unlockedAtUnix <= end) { tiers.platinum++; entry.platinums++; }
    if (entry.achievements || entry.platinums) byGame.push(entry);
  }
  let longestStreak = 0, current = 0, previous = -Infinity;
  for (const day of [...days].sort((a,b) => a-b)) { current = day === previous+1 ? current+1 : 1; longestStreak = Math.max(longestStreak,current); previous = day; }
  byGame.sort((a,b) => b.achievements-a.achievements || a.name.localeCompare(b.name));
  return { start,end,tiers,total:Object.values(tiers).reduce((a,b) => a+b,0),games:byGame,activeAchievementDays:days.size,longestAchievementStreak:longestStreak,unknownDates,rarest };
}
