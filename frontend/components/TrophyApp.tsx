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
import { SheetIcon } from './SheetIcon';

type Collection = 'all' | 'projects' | 'near' | 'complete';

export function TrophyApp({ surface = 'desktop', onClose }: { surface?: SurfaceKind; onClose?: () => void }) {
  const state = useTrophyState();
  const customization = useCustomizationState();
  const [query, setQuery] = useState('');
  const [collection, setCollection] = useState<Collection>('all');
  const [showCustomize, setShowCustomize] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [sort, setSort] = useState<'recent' | 'name' | 'completion'>('recent');
  const deferredQuery = useDeferredValue(query.trim().toLowerCase());
  const themeStyle = customizationService.getCssVariables(surface) as CSSProperties;
  const projectIds = new Set(customization.config.projects.entries.map((entry) => entry.appId));
  const pinnedIds = new Set(customization.config.library.pinnedAppIds);
  const hiddenIds = new Set(customization.config.library.hiddenAppIds);

  const games = useMemo(() => {
    let result = state.index.games.filter((game) => showHidden ? hiddenIds.has(game.appId) : !hiddenIds.has(game.appId));
    if (collection === 'projects') result = result.filter((game) => projectIds.has(game.appId));
    else if (collection === 'near') result = result.filter((game) => game.completionPercent >= 70 && game.completionPercent < 100);
    else if (collection === 'complete') result = result.filter((game) => game.platinumEarned);
    if (deferredQuery) result = result.filter((game) => game.name.toLowerCase().includes(deferredQuery));
    return result.slice().sort((a, b) => Number(pinnedIds.has(b.appId)) - Number(pinnedIds.has(a.appId)) || (sort === 'name' ? a.name.localeCompare(b.name) : sort === 'completion' ? b.completionPercent - a.completionPercent : (b.lastUnlockAtUnix ?? 0) - (a.lastUnlockAtUnix ?? 0)) || a.name.localeCompare(b.name));
  }, [collection, deferredQuery, hiddenIds, pinnedIds, projectIds, sort, state.index.games, showHidden]);

  if (state.selectedAppId != null && state.selectedGame) {
    return <ResponsiveBoundary surface={surface} className="st-game-detail-shell" component="game-detail-shell" style={themeStyle}><GameDetail game={state.selectedGame} onClose={onClose} onBack={() => trophyService.closeGame()} onRefresh={() => trophyService.requestRefresh(state.selectedAppId!)} /></ResponsiveBoundary>;
  }

  if (showCustomize) return <ResponsiveBoundary surface={surface} className="st-app st-settings-app" component="trophy-settings" style={themeStyle}>
    <header className="st-redesign-header st-app-header"><div className="st-app-header-actions"><button className="st-icon-button" aria-label="Back to trophies" onClick={() => setShowCustomize(false)}>‹</button><h1>Settings</h1></div>{onClose && <button className="st-icon-button" onClick={onClose} aria-label="Close trophies">×</button>}</header>
    <CustomizationHub surface={surface} />
  </ResponsiveBoundary>;

  return (
    <ResponsiveBoundary surface={surface} className={`st-app st-surface-${surface}`} component="trophy-library" style={themeStyle}>
      <header className="st-app-header st-redesign-header"><SummaryBar index={state.index} hero /><div className="st-app-header-actions">
        <button className="st-icon-button" disabled={state.repairing || state.discovering || state.refreshing} title="Refresh real rarity and trophy tiers without reimporting" aria-label="Refresh trophy rarity" onClick={() => void trophyService.repairCachedRarity()}><SheetIcon control="refresh" /></button>
        <button className="st-icon-button" title="Settings and customization" aria-label="Settings and customization" aria-expanded={showCustomize} onClick={() => setShowCustomize(v => !v)}><SheetIcon control="settings" /></button>
        {(state.refreshing || state.repairing || state.discovering) && <span className="st-sync-dot" title={message('app.refresh')} />}
        {onClose && <button className="st-icon-button" onClick={onClose} aria-label="Close trophies">×</button>}
      </div></header>
      <div className="st-library-tools" data-stt-component="library-tools">
        <button className="st-icon-button" title="Sort games" aria-label="Sort games" aria-expanded={showFilters} onClick={() => setShowFilters(v => !v)}><SheetIcon control="filter" /></button>
        <div className="st-collection-tabs" role="tablist" aria-label={message('collection.label')}>
          {([['all','collection.all'],['projects','collection.projects'],['near','collection.near'],['complete','collection.complete']] as const).map(([id, key]) => <button key={id} role="tab" aria-selected={collection === id} className={collection === id ? 'is-active' : ''} onClick={() => setCollection(id)}>{message(key)}</button>)}
        </div>
        <div className="st-search-wrap"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={message('search.games')} aria-label={message('search.games')} /></div>
      </div>
      {showFilters && <div className="st-discovery-status"><label>Sort by <select value={sort} onChange={e => setSort(e.target.value as typeof sort)}><option value="recent">Recently earned</option><option value="name">Game name</option><option value="completion">Completion</option></select></label><span>{games.length.toLocaleString()} games · Pinned games stay first</span></div>}
      {(state.discovering || state.index.games.length === 0) && <div className="st-discovery-status"><span role="status">{state.discoveryStatus}</span><button className="st-mini-button" disabled={state.discovering || state.repairing} onClick={() => trophyService.rescanLibrary()}>{state.discovering ? 'Discovering…' : 'Find new games'}</button></div>}
      {showFilters && <label className="stt-toggle"><input type="checkbox" checked={showHidden} onChange={e => setShowHidden(e.target.checked)} /><span>Hidden games ({hiddenIds.size}) · right-click a game to restore it</span></label>}
      {state.repairStatus && <div className="st-discovery-status" role="status"><span>{state.repairStatus}</span>{!state.repairing && <button className="st-mini-button" onClick={() => trophyService.dismissRepairStatus()} aria-label="Dismiss refresh status">Dismiss</button>}</div>}
      {customization.config.developer.responsiveDebug && <div className="stt-responsive-debug">Responsive debug is enabled. Inspect data-stt-width-band / height-band / aspect-band on the root.</div>}
      {customization.error && <div className="st-error">{customization.error}</div>}
      {state.error && <div className="st-error">{state.error}</div>}
      {!state.ready ? <div className="st-empty">{message('app.loadingCache')}</div> : games.length === 0 ? <div className="st-empty"><strong>{state.discovering ? 'Building your trophy collection' : state.index.games.length ? 'No matching games' : 'Your trophy collection starts here'}</strong>{state.discovering ? 'Games appear as Steam returns earned achievements. Large libraries may take several minutes.' : state.index.games.length ? 'Try another collection or clear your search.' : 'Only games with earned achievements appear here. Check discovery status above to distinguish an empty collection from a connection problem.'}</div> : <VirtualGameList games={games} onOpen={(appId) => void trophyService.selectGame(appId)} />}
    </ResponsiveBoundary>
  );
}
