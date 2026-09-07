import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { GameSummary } from '../../packages/core/src';
import { useCustomizationState } from '../state/customization-hooks';
import { GameRow } from './GameRow';

const OVERSCAN = 6;

export function VirtualGameList({ games, onOpen }: { games: GameSummary[]; onOpen: (appId: number) => void }) {
  const customization = useCustomizationState();
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(520);
  const ref = useRef<HTMLDivElement>(null);
  const scale = Math.max(1, customization.config.accessibility.textScale, customization.config.accessibility.iconScale);
  const rowHeight = Math.max(88, Math.min(168, Math.ceil(88 * scale)));

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setViewportHeight(Math.max(160, element.clientHeight));
    measure();
    if (typeof ResizeObserver === 'undefined') { window.addEventListener('resize', measure, { passive: true }); return () => window.removeEventListener('resize', measure); }
    const observer = new ResizeObserver(measure); observer.observe(element); return () => observer.disconnect();
  }, []);

  const range = useMemo(() => {
    const first = Math.max(0, Math.floor(scrollTop / rowHeight) - OVERSCAN);
    const count = Math.ceil(viewportHeight / rowHeight) + OVERSCAN * 2;
    return { first, last: Math.min(games.length, first + count) };
  }, [games.length, rowHeight, scrollTop, viewportHeight]);

  return (
    <div ref={ref} className="st-virtual-list" onScroll={(e) => setScrollTop(e.currentTarget.scrollTop)} data-stt-component="virtual-game-list">
      <div className="st-virtual-spacer" style={{ height: games.length * rowHeight }}>
        <div style={{ transform: `translateY(${range.first * rowHeight}px)` }}>
          {games.slice(range.first, range.last).map((game) => <div key={game.appId} style={{ minHeight: rowHeight }}><GameRow game={game} onOpen={() => onOpen(game.appId)} /></div>)}
        </div>
      </div>
    </div>
  );
}
