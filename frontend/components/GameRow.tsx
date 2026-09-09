import { completionRarityLimit, GameSummary, type GameSnapshot } from '../../packages/core/src';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useCustomizationState } from '../state/customization-hooks';
import { customizationService } from '../state/customization-service';
import { trophyService } from '../state/service';
import { RecentAchievement, PlatinumPreview } from './RecentAchievement';
import { TrophyGlyph } from './TrophyGlyph';
import { GameArtwork } from './GameArtwork';
import { SheetIcon } from './SheetIcon';
import { ReleaseYear } from './ReleaseYear';

export function GameRow({ game, onOpen }: { game: GameSummary; onOpen: () => void }) {
  const [recent, setRecent] = useState<GameSnapshot['achievements']>([]);
  const [completion, setCompletion] = useState<Awaited<ReturnType<typeof trophyService.getCachedCompletion>>>({ achievement: null, unlockedAtUnix: null });
  const { library, visual } = useCustomizationState().config;
  const [rarityLimit,setRarityLimit] = useState<number|null>(null);
  const pinned = library.pinnedAppIds.includes(game.appId), hidden = library.hiddenAppIds.includes(game.appId);
  const strip = useRef<HTMLDivElement>(null);
  const [capacity, setCapacity] = useState(0);
  const [menu, setMenu] = useState<{ x: number; y: number; doc: Document } | null>(null);
  useEffect(() => {
    const node = strip.current;
    if (!node) return undefined;
    const update = () => setCapacity(Math.max(0, Math.floor((node.clientWidth + 5) / (library.achievementSize + 5))));
    const observer = new ResizeObserver(update); observer.observe(node); update();
    return () => observer.disconnect();
  }, [library.achievementSize]);
  useEffect(() => {
    if (!menu) return undefined;
    const dismiss = (e: Event) => { if (!(e.target as Element)?.closest?.('.st-game-context-menu')) setMenu(null); };
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setMenu(null); };
    menu.doc.addEventListener('pointerdown', dismiss); menu.doc.addEventListener('keydown', key); menu.doc.addEventListener('scroll', dismiss, true);
    return () => { menu.doc.removeEventListener('pointerdown', dismiss); menu.doc.removeEventListener('keydown', key); menu.doc.removeEventListener('scroll', dismiss, true); };
  }, [menu]);
  useEffect(() => { let alive = true; void trophyService.getCachedPreview(game.appId).then(async items => { if (alive) setRecent(items); const value = await trophyService.getCachedCompletion(game.appId); const snapshot = await trophyService.getCachedSnapshot(game.appId); if (alive) { setCompletion(value); setRarityLimit(snapshot ? completionRarityLimit(snapshot.achievements,snapshot.rarityRevision === 1) : null); } }); return () => { alive = false; }; }, [game]);
  return (
    <div className="st-game-row" style={{ '--st-achievement-size': `${library.achievementSize}px` } as CSSProperties} onContextMenu={e => { e.preventDefault(); const doc = e.currentTarget.ownerDocument; setMenu({ x: Math.max(8, Math.min(e.clientX, (doc.defaultView?.innerWidth ?? 1144) - 210)), y: Math.max(8, Math.min(e.clientY, (doc.defaultView?.innerHeight ?? 844) - 110)), doc }); }} data-stt-component="game-card" data-stt-appid={game.appId} data-stt-state={game.platinumEarned ? 'complete' : 'in-progress'}>
      <button title={`Open ${game.name}, ${game.earnedCount} of ${game.achievementCount} achievements`} className="st-game-row-hitbox" onClick={onOpen} aria-label={`Open ${game.name}, ${game.earnedCount} of ${game.achievementCount} achievements`} />
      <GameArtwork appId={game.appId} />
      <div className="st-game-row-main" data-stt-slot="summary">
        <div className="st-game-title">{game.name}<ReleaseYear appId={game.appId} /></div>
        <div className="st-game-progress-line">
          <div className="st-progress-track"><span style={{ width: `${game.completionPercent}%` }} /></div>
          <span>{game.completionPercent.toFixed(game.completionPercent % 1 ? 1 : 0)}%</span>
        </div>
      </div>
      <div className="st-game-tier-counts" data-stt-slot="trophy-summary">
        <span>{game.platinumEarned ? <PlatinumPreview achievement={completion.achievement} unlockedAtUnix={completion.unlockedAtUnix} appId={game.appId} /> : <TrophyGlyph tier="platinum" size={17} appId={game.appId} />}{Number(game.platinumEarned)}</span>
        <span><TrophyGlyph tier="gold" size={17} appId={game.appId} />{game.goldCount}</span>
        <span><TrophyGlyph tier="silver" size={17} appId={game.appId} />{game.silverCount}</span>
        <span><TrophyGlyph tier="bronze" size={17} appId={game.appId} />{game.bronzeCount}</span>
      </div>
      {(pinned || hidden) && <span className="st-pin-marker" aria-label={hidden ? 'Hidden game' : 'Pinned game'} title={hidden ? 'Hidden game' : 'Pinned game'}><SheetIcon control={hidden ? 'hidden' : 'pin'} size={15} tint /></span>}
      <div className="st-game-earned"><span>{game.earnedCount}/{game.achievementCount}</span></div>
      {visual.showCompletionRarity && <small className="st-completion-rarity" title={rarityLimit == null ? 'Completion rarity unavailable: one or more achievements lack verified rarity.' : 'Completion rarity upper bound, based on the rarest achievement. The exact percentage earning every achievement is not supplied by Steam.'}>{rarityLimit == null ? '—' : `≤${rarityLimit.toFixed(1)}%`}</small>}
      <div className="st-game-recent" ref={strip} aria-label="Most recent earned achievements">{recent.slice(0, capacity).map(a => <RecentAchievement key={a.id} achievement={a} appId={game.appId} />)}</div>
      {menu && createPortal(<div className="st-game-context-menu" role="menu" style={{ left: menu.x, top: menu.y, ...customizationService.getCssVariables('desktop') } as CSSProperties}>
        <button title={pinned ? 'Unpin game' : 'Pin game'} role="menuitem" autoFocus onClick={() => { void customizationService.setPinned(game.appId, !pinned); setMenu(null); }}>{pinned ? 'Unpin game' : 'Pin game'}</button>
        <button title={hidden ? 'Restore game' : 'Hide game'} role="menuitem" onClick={() => { void customizationService.setHidden(game.appId, !hidden); setMenu(null); }}>{hidden ? 'Restore game' : 'Hide game'}</button>
      </div>, menu.doc.body)}
    </div>
  );
}
