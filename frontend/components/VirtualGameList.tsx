import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { GameSummary } from '../../packages/core/src';
import { libraryRowMetrics } from '../../packages/customization/src';
import { useCustomizationState } from '../state/customization-hooks';
import { GameRow } from './GameRow';

const OVERSCAN = 6;
let rememberedScroll = { collection:'', offset:0 };

export function VirtualGameList({ games, onOpen }: { games: GameSummary[]; onOpen: (appId: number) => void }) {
  const customization = useCustomizationState();
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(520);
  const [viewportWidth, setViewportWidth] = useState(1280);
  const ref = useRef<HTMLDivElement>(null);
  const { rowHeight, artHeight, artWidth, tierHeight, summaryWidth } = libraryRowMetrics(customization.config.accessibility, customization.config.library,viewportWidth);
  const collectionKey = games.map(game => game.appId).join(',');
  useLayoutEffect(() => {
    const offset = customization.config.visual.rememberScreen && rememberedScroll.collection === collectionKey ? rememberedScroll.offset : 0;
    setScrollTop(offset); if (ref.current) ref.current.scrollTop = offset;
  }, [collectionKey]);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const view = element.ownerDocument.defaultView ?? window;
    const measure = () => { setViewportHeight(Math.max(160, element.clientHeight)); setViewportWidth(element.closest('[data-stt-root]')?.clientWidth ?? element.clientWidth); };
    measure();
    if (typeof ResizeObserver === 'undefined') { view.addEventListener('resize', measure, { passive: true }); return () => view.removeEventListener('resize', measure); }
    const observer = new ResizeObserver(measure); observer.observe(element); return () => observer.disconnect();
  }, []);

  const range = useMemo(() => {
    const first = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
    const count = Math.ceil(viewportHeight / rowHeight) + OVERSCAN * 2;
    return { first, last: Math.min(games.length, first + count) };
  }, [games.length, rowHeight, scrollTop, viewportHeight]);

  return (
    <div ref={ref} className="st-virtual-list" style={{ '--st-game-summary-width':`${summaryWidth}px`, '--st-game-art-width': `${artWidth}px`, '--st-game-art-height': `${artHeight}px`, '--st-game-tier-height': `${tierHeight}px` } as import('react').CSSProperties} onScroll={(e) => { setScrollTop(e.currentTarget.scrollTop); rememberedScroll = customization.config.visual.rememberScreen ? { collection:collectionKey,offset:e.currentTarget.scrollTop } : { collection:'',offset:0 }; }} data-stt-component="virtual-game-list">
      <div className="st-virtual-spacer" style={{ height: games.length * rowHeight, '--stt-game-row-height': `${rowHeight}px` } as import('react').CSSProperties}>
        <div style={{ transform: `translateY(${range.first * rowHeight}px)` }}>
          {games.slice(range.first, range.last).map((game) => <div key={game.appId} style={{ height: rowHeight, display:'flow-root' }}><GameRow game={game} onOpen={() => onOpen(game.appId)} /></div>)}
        </div>
      </div>
    </div>
  );
}
