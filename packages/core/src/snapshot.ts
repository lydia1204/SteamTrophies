import { AchievementRecord, AppId, GameSnapshot, SteamAchievementInput, TierThresholds, VisibilityPolicy } from './model';
import { mergeAchievement } from './normalize';
import { computePlatinum } from './platinum';
import { summarizeGame } from './summary';
import { assertAppId, boundedText } from './security';

export interface BuildSnapshotInput {
  appId: AppId;
  name: string;
  achievements: SteamAchievementInput[];
  nowUnix: number;
  staleTtlSeconds: number;
  previous?: GameSnapshot;
  thresholds?: TierThresholds;
  visibility?: VisibilityPolicy;
}

export function buildGameSnapshot(i: BuildSnapshotInput): GameSnapshot {
  assertAppId(i.appId);
  const previousById = new Map<string, AchievementRecord>(
    i.previous?.achievements.map((achievement) => [achievement.id, achievement]) ?? [],
  );
  const deduped = new Map<string, SteamAchievementInput>();
  for (const achievement of i.achievements) deduped.set(achievement.id, achievement);

  const achievements = [...deduped.values()].map((raw) =>
    mergeAchievement(raw, {
      appId: i.appId,
      nowUnix: i.nowUnix,
      thresholds: i.thresholds,
      previous: previousById,
    }),
  );

  // A publisher can remove/rename an achievement after somebody earned it. The durable
  // trophy history wins over today's mutable Steam schema, so keep earned missing records.
  // Never retain missing *locked* records because those are merely stale catalogue data.
  for (const previous of previousById.values()) {
    if (deduped.has(previous.id) || !previous.achieved) continue;
    achievements.push({ ...previous, retired: true, lastObservedAtUnix: i.nowUnix });
  }

  achievements.sort((a, b) =>
    a.achieved !== b.achieved
      ? a.achieved
        ? -1
        : 1
      : a.achieved
        ? (b.unlockedAtUnix ?? 0) - (a.unlockedAtUnix ?? 0)
        : a.name.localeCompare(b.name),
  );

  const platinum = computePlatinum(i.appId, achievements, i.previous?.platinum, i.nowUnix);
  const base = {
    rarityRevision: i.previous?.rarityRevision,
    schemaVersion: 1 as const,
    appId: i.appId,
    name: boundedText(i.name, `App ${i.appId}`),
    achievements,
    platinum,
  };
  const summary = summarizeGame(
    base,
    i.nowUnix,
    i.nowUnix + Math.max(30, Math.floor(i.staleTtlSeconds)),
    i.visibility,
  );
  return { ...base, summary };
}
