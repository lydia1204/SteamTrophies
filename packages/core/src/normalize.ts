import { AchievementRecord, AppId, SteamAchievementInput, TierThresholds } from './model';
import { classifyRarity } from './rarity';
import { assertAchievementId, boundedText, safeAssetUrl } from './security';
export interface MergeAchievementOptions { appId:AppId; nowUnix:number; thresholds?:TierThresholds; previous?:ReadonlyMap<string,AchievementRecord>; }
export function normalizeAchievementInput(raw:SteamAchievementInput):SteamAchievementInput { assertAchievementId(raw.id); const progress=(n:number|null)=>n==null||!Number.isFinite(n)?null:n; const rarity=raw.globalUnlockPercent==null||!Number.isFinite(raw.globalUnlockPercent)?null:Math.max(0,Math.min(100,raw.globalUnlockPercent)); return {...raw,name:boundedText(raw.name,raw.id),description:boundedText(raw.description),hidden:Boolean(raw.hidden),achieved:Boolean(raw.achieved),globalUnlockPercent:rarity,unlockedAtUnix:raw.unlockedAtUnix==null||!Number.isFinite(raw.unlockedAtUnix)||raw.unlockedAtUnix<=0?null:Math.floor(raw.unlockedAtUnix),iconUrl:safeAssetUrl(raw.iconUrl),currentProgress:progress(raw.currentProgress),minProgress:progress(raw.minProgress),maxProgress:progress(raw.maxProgress)}; }
export function mergeAchievement(rawInput: SteamAchievementInput, o: MergeAchievementOptions): AchievementRecord {
  const raw = normalizeAchievementInput(rawInput);
  const prev = o.previous?.get(raw.id);
  const tier = classifyRarity(raw.globalUnlockPercent, o.thresholds);
  const newly = raw.achieved && !prev?.achieved;
  // Trophy unlocks are append-only. Steam can reset achievement state, but a PlayStation-style
  // trophy cabinet must not revoke something that was already awarded locally.
  const achieved = raw.achieved || Boolean(prev?.achieved);
  const unlockedAtUnix = raw.achieved
    ? (raw.unlockedAtUnix ?? prev?.unlockedAtUnix ?? null)
    : (prev?.unlockedAtUnix ?? null);
  return {
    ...raw,
    achieved,
    unlockedAtUnix,
    appId: o.appId,
    tier,
    awardedTier: newly ? tier : (prev?.awardedTier ?? (achieved ? tier : null)),
    awardedGlobalUnlockPercent: newly
      ? raw.globalUnlockPercent
      : (prev?.awardedGlobalUnlockPercent ?? (achieved ? raw.globalUnlockPercent : null)),
    firstObservedAtUnix: prev?.firstObservedAtUnix ?? o.nowUnix,
    lastObservedAtUnix: o.nowUnix,
    retired: false,
  };
}
