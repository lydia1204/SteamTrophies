import { DEFAULT_TIER_THRESHOLDS, TierThresholds } from './model';
export function validateThresholds(t:TierThresholds):TierThresholds { if(!Number.isFinite(t.goldMaxPercent)||!Number.isFinite(t.silverMaxPercent)||t.goldMaxPercent<0||t.silverMaxPercent>100||t.goldMaxPercent>=t.silverMaxPercent) throw new Error('Expected 0 <= goldMaxPercent < silverMaxPercent <= 100.'); return t; }
export function clampPercent(v:number):number { return !Number.isFinite(v)?100:Math.max(0,Math.min(100,v)); }
export function classifyRarity(p:number|null,t:TierThresholds=DEFAULT_TIER_THRESHOLDS):'bronze'|'silver'|'gold' { validateThresholds(t); if(p==null)return'bronze'; const v=clampPercent(p); if(v<=t.goldMaxPercent)return'gold'; if(v<=t.silverMaxPercent)return'silver'; return'bronze'; }
