import { useTrophyState } from '../../state/hooks';
import { useCustomizationState } from '../../state/customization-hooks';
import { trophyService } from '../../state/service';
import { customizationService } from '../../state/customization-service';

export function LibraryDataSettings() {
  const state = useTrophyState();
  const { config } = useCustomizationState();
  const busy = state.repairing || state.discovering || state.refreshing;
  const name = (id: number) => state.index.games.find(g => g.appId === id)?.name ?? `Steam App ${id}`;
  return <section className="stt-settings-section">
    <header><div><h3>Library & data</h3><p>{state.index.games.length.toLocaleString()} saved games. Startup uses your cache; automatic discovery is off.</p></div></header>
    <div className="stt-customize-actions"><button disabled={busy} onClick={() => void trophyService.repairCachedRarity()}>Refresh rarity and trophy tiers</button><button disabled={busy} onClick={() => trophyService.rescanLibrary()}>Find new games</button></div>
    <p className="st-settings-help">Refresh checks Valve’s global rarity for existing games and reclassifies their trophies. It preserves earned achievements, dates and Platinum, and plays no sounds. Find new games is a separate discovery scan.</p>
    <div role="status">{state.repairStatus ?? state.discoveryStatus}</div>{state.error && <p className="st-error">{state.error}</p>}
    <h3>Hidden games</h3>{!config.library.hiddenAppIds.length && <p>No hidden games.</p>}{config.library.hiddenAppIds.map(id => <div className="st-settings-library-row" key={id}><span>{name(id)}</span><button className="st-mini-button" onClick={() => void customizationService.setHidden(id,false)}>Show again</button></div>)}
    <h3>Pinned games</h3>{!config.library.pinnedAppIds.length && <p>No pinned games. Pin a game from its detail page.</p>}{config.library.pinnedAppIds.map(id => <div className="st-settings-library-row" key={id}><span>{name(id)}</span><button className="st-mini-button" onClick={() => void customizationService.setPinned(id,false)}>Unpin</button></div>)}
    <h3>Trophy Projects</h3>{!config.projects.entries.length && <p>No active projects. Start one from a game’s detail page.</p>}{config.projects.entries.map(project => <div className="st-settings-library-row" key={project.appId}><span>{name(project.appId)}</span><button className="st-mini-button" onClick={() => void customizationService.setTracked(project.appId,false)}>Stop tracking</button></div>)}
  </section>;
}
