import { useDeferredValue, useMemo, useState, type CSSProperties } from 'react';
import { message, type SurfaceKind } from '../../packages/customization/src';
import { useTrophyState } from '../state/hooks';
import { trophyService } from '../state/service';
import { customizationService } from '../state/customization-service';
import { useCustomizationState } from '../state/customization-hooks';
import { GameDetail } from './GameDetail';
import { SummaryBar } from './SummaryBar';
import { VirtualGameList } from './VirtualGameList';
import { CustomizationHub } from './customization/CustomizationHub';
import { ResponsiveBoundary } from './ResponsiveBoundary';

type Collection = 'all' | 'projects' | 'near' | 'complete';

export function TrophyApp({ surface = 'desktop' }: { surface?: SurfaceKind }) {
  const state = useTrophyState();
  const customization = useCustomizationState();
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState<Collection>('all');
  const [showCustomize, setShowCustomize] = useState(false);
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const themeStyle = customizationService.getCssVariables(surface) as CSSProperties;
  const projectIds = new Set(customization.config.projects.entries.map((entry) => entry.appId));
  const pinnedIds = new Set(customization.config.library.pinnedAppIds);
  const hiddenIds = new Set(customization.config.library.hiddenAppIds);

  const games = useMemo(() => {
    let result = state.index.games.filter((game) => !hiddenIds.has(game.appId));
    if (collection === 'projects') result = result.filter((game) => projectIds.has(game.appId));
    else if (collection === 'near') result = result.filter((game) => game.completionPercent >= 70 && game.completionPercent < 100);
    else if (collection === 'complete') result = result.filter((game) => game.platinumEarned);
    if (deferredQuery) result = result.filter((game) => game.name.toLowerCase().includes(deferredQuery));
    return result.slice().sort((a, b) => Number(pinnedIds.has(b.appId)) - Number(pinnedIds.has(a.appId)) || (b.lastUnlockAtUnix ?? 0) - (a.lastUnlockAtUnix ?? 0) || a.name.localeCompare(b.name));
  }, [collection, deferredQuery, hiddenIds, pinnedIds, projectIds, state.index.games]);

  if (state.selectedAppId != null && state.selectedGame) {
    return <ResponsiveBoundary surface={surface} component="game-detail-shell" style={themeStyle}><GameDetail game={state.selectedGame} onBack={() => trophyService.closeGame()} onRefresh={() => trophyService.requestRefresh(state.selectedAppId!)} /></ResponsiveBoundary>;
  }

  return (
    <ResponsiveBoundary surface={surface} className={`st-app st-surface-${surface}`} component="trophy-library" style={themeStyle}>
      <header className="st-app-header"><div><h1>{message('app.title')}</h1><p>{message('app.gamesEarned', { count: state.index.totals.visibleGames.toLocaleString() })}</p></div><div className="st-app-header-actions"><button className="st-refresh-button" onClick={() => setShowCustomize((v) => !v)}>{message(showCustomize ? 'app.customize.close' : 'app.customize')}</button>{state.refreshing && <span className="st-sync-dot" title={message('app.refresh')} />}</div></header>
      {showCustomize && <CustomizationHub surface={surface} />}
      <SummaryBar index={state.index} />
      <div className="st-library-tools" data-stt-component="library-tools">
        <div className="st-collection-tabs" role="tablist" aria-label={message('collection.label')}>
          {([['all','collection.all'],['projects','collection.projects'],['near','collection.near'],['complete','collection.complete']] as const).map(([id, key]) => <button key={id} className={collection === id ? 'is-active' : ''} onClick={() => setCollection(id)}>{message(key)}</button>)}
        </div>
        <div className="st-search-wrap"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={message('search.games')} aria-label={message('search.games')} /></div>
      </div>
      {customization.config.developer.responsiveDebug && <div className="stt-responsive-debug">Responsive debug is enabled. Inspect data-stt-width-band / height-band / aspect-band on the root.</div>}
      {customization.error && <div className="st-error">{customization.error}</div>}
      {state.error && <div className="st-error">{state.error}</div>}
      {!state.ready ? <div className="st-empty">{message('app.loadingCache')}</div> : games.length === 0 ? <div className="st-empty">{message('app.empty')}</div> : <VirtualGameList games={games} onOpen={(appId) => void trophyService.selectGame(appId)} />}
    </ResponsiveBoundary>
  );
}
