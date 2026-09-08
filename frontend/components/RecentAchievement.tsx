import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import type { AchievementRecord } from '../../packages/core/src';
import { safeAssetUrl } from '../../packages/core/src/security';
import { useCustomizationState } from '../state/customization-hooks';
import { TrophyGlyph } from './TrophyGlyph';

function AchievementTooltip({ anchor, achievement: a, appId, platinum, platinumDate }: { anchor: HTMLButtonElement; achievement: AchievementRecord | null; appId: number; platinum?: boolean; platinumDate?: number | null }) {
  const element = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 8, top: 8 });
  const customization = useCustomizationState();
  const doc = anchor.ownerDocument, view = doc.defaultView!;
  const tier = platinum ? 'platinum' : a?.globalUnlockPercent != null ? (a.awardedTier ?? a.tier) : 'bronze';
  const earnedDate = platinum ? platinumDate ?? a?.unlockedAtUnix : a?.unlockedAtUnix;
  useLayoutEffect(() => {
    const rect = anchor.getBoundingClientRect(), box = element.current?.getBoundingClientRect();
    const width = box?.width ?? 320, height = box?.height ?? 180;
    setPosition({ left: Math.max(8, Math.min(rect.left, view.innerWidth - width - 8)), top: Math.max(8, Math.min(view.innerHeight - height - 8, rect.bottom + height + 12 < view.innerHeight ? rect.bottom + 8 : rect.top - height - 8)) });
  }, [anchor, a, view]);
  const root = anchor.closest('[data-stt-root]');
  const tokens = root ? Object.fromEntries(['background','surface','text','muted','border'].map(key => [`--stt-color-${key}`, view.getComputedStyle(root).getPropertyValue(`--stt-color-${key}`)])) : {};
  return createPortal(<div ref={element} className={`st-achievement-tooltip${tier === 'gold' || platinum ? ` st-aura st-aura-${tier}` : ''}`} data-stt-reduced-motion={customization.config.accessibility.reducedMotion} role="tooltip" style={{ ...position, ...tokens } as CSSProperties}>
    <div className="st-tooltip-heading"><TrophyGlyph tier={tier} size={36} appId={appId} achievementId={platinum ? undefined : a?.id} /><strong>{a?.name ?? 'Platinum earned'}</strong></div>
    {platinum && a && <small>Original completion achievement · later additions do not revoke Platinum</small>}
    <p>{a ? a.description || 'No description supplied by this game.' : 'The original completion achievement cannot be identified from the saved history. Your Platinum remains earned.'}</p>
    <small>{earnedDate ? `Earned ${new Date(earnedDate * 1000).toLocaleDateString()}` : 'Earned date unavailable'}{a && <> · {a.globalUnlockPercent == null ? 'Rarity unverified' : `${a.globalUnlockPercent.toFixed(2)}% of players`}</>}</small>
  </div>, doc.body);
}

export function PlatinumPreview({ achievement, appId, unlockedAtUnix }: { achievement: AchievementRecord | null; appId: number; unlockedAtUnix: number | null }) {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  return <><button className="st-platinum-preview" aria-label={`Platinum earned. ${achievement?.name ?? 'Original completion achievement unavailable'}`} onMouseEnter={e => setAnchor(e.currentTarget)} onMouseLeave={() => setAnchor(null)} onFocus={e => setAnchor(e.currentTarget)} onBlur={() => setAnchor(null)} onKeyDown={e => { if (e.key === 'Escape') setAnchor(null); }} onClick={e => setAnchor(e.currentTarget)}><TrophyGlyph tier="platinum" size={17} appId={appId} /></button>{anchor && <AchievementTooltip anchor={anchor} achievement={achievement} appId={appId} platinum platinumDate={unlockedAtUnix} />}</>;
}

export function RecentAchievement({ achievement: a, appId, platinum = false }: { achievement: AchievementRecord; appId: number; platinum?: boolean }) {
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const { library } = useCustomizationState().config;
  const url = safeAssetUrl(a.iconUrl);
  const verified = a.globalUnlockPercent != null;
  const tier = platinum ? 'platinum' : verified ? (a.awardedTier ?? a.tier) : 'bronze';
  const border = verified && (tier === 'gold' || (tier === 'silver' && library.silverBorders) || (tier === 'bronze' && library.bronzeBorders));
  return <><button className={platinum ? 'st-platinum-preview' : `st-recent-achievement${border ? ` st-border-${tier}` : ''}${verified && tier === 'gold' ? ' st-rare-gold' : ''}`} aria-label={`${platinum ? 'Game completion: ' : ''}${a.name}. ${a.description}. ${verified ? `${a.globalUnlockPercent}% rarity` : 'Rarity not verified'}`} onMouseEnter={e => setAnchor(e.currentTarget)} onMouseLeave={() => setAnchor(null)} onFocus={e => setAnchor(e.currentTarget)} onBlur={() => setAnchor(null)} onKeyDown={e => { if (e.key === 'Escape') setAnchor(null); }} onClick={e => setAnchor(e.currentTarget)}>
    {platinum ? <TrophyGlyph tier="platinum" size={17} appId={appId} /> : url ? <img src={url} alt="" loading="lazy" onError={e => { e.currentTarget.style.visibility = 'hidden'; }} /> : <TrophyGlyph tier={tier} size={library.achievementSize - 6} appId={appId} achievementId={a.id} />}
  </button>{anchor && <AchievementTooltip anchor={anchor} achievement={a} appId={appId} platinum={platinum} />}</>;
}
