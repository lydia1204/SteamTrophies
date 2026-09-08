import type { GameSnapshot, TierThresholds } from './model';
import { classifyRarity } from './rarity';
import { summarizeGame } from './summary';

/** Correct the legacy zero-filled source once; normal later rarity drift never rewrites awards. */
export function repairRarity(game: GameSnapshot, percentages: ReadonlyMap<string, number>, thresholds?: TierThresholds, reclassifyAwards = false): GameSnapshot {
  const legacy = game.rarityRevision !== 1 && game.achievements.every((row) => row.globalUnlockPercent === 0 || row.globalUnlockPercent == null);
  const achievements = game.achievements.map((row) => {
    const percent = percentages.get(row.id) ?? null;
    const tier = classifyRarity(percent, thresholds);
    const correctAward = legacy || row.awardedGlobalUnlockPercent == null || (reclassifyAwards && percent != null);
    return { ...row, globalUnlockPercent: percent, tier,
      awardedTier: row.achieved && correctAward ? tier : row.awardedTier,
      awardedGlobalUnlockPercent: row.achieved && correctAward ? percent : row.awardedGlobalUnlockPercent };
  });
  const next = { ...game, achievements, rarityRevision: 1 as const };
  return { ...next, summary: summarizeGame(next, game.summary.lastRefreshAtUnix, game.summary.staleAfterUnix, { mode: game.summary.visible ? 'achievement_capable' : 'earned_only' }) };
}

/** Initial history import is durable data, not a live unlock notification. */
export function shouldAnnounceRefresh(previous: GameSnapshot | undefined): boolean { return previous !== undefined; }
