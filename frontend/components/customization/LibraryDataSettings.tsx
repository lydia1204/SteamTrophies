import { useTrophyState } from '../../state/hooks';
import { useCustomizationState } from '../../state/customization-hooks';
import { trophyService } from '../../state/service';
import { customizationService } from '../../state/customization-service';
import { SettingHelp } from './SettingControls';

export function LibraryDataSettings() {
  const state = useTrophyState();
  const { config } = useCustomizationState();
  const busy = state.repairing || state.discovering || state.refreshing;
  const name = (id: number) => state.index.games.find(g => g.appId === id)?.name ?? `Steam App ${id}`;
  return <section className="stt-settings-section">
    <header><div><h3>Library & data</h3><p>{state.index.games.length.toLocaleString()} saved games. Startup uses your cache; automatic discovery is off.</p></div></header>
    <fieldset className="stt-setting-group"><legend>Library maintenance <SettingHelp text="Update rarity or discover new games. These are separate actions; opening Trophies does neither." /></legend>
    <div className="stt-customize-actions"><button title="Update global rarity and tiers; preserve earned dates, Platinum and customizations" disabled={busy} onClick={() => void trophyService.repairCachedRarity()}>Refresh rarity and trophy tiers</button><button title="Scan your Steam library for games not yet saved in Trophies" disabled={busy} onClick={() => trophyService.rescanLibrary()}>Find new games</button></div>
    <p className="st-settings-help">Refresh checks Valve’s global rarity for existing games and reclassifies their trophies. It preserves earned achievements, dates and Platinum, and plays no sounds. Find new games is a separate discovery scan.</p>
    <div role="status">{state.repairStatus ?? state.discoveryStatus}</div>{state.error && <p className="st-error">{state.error}</p>}
    </fieldset>
    <fieldset className="stt-setting-group"><legend>Hidden games <SettingHelp text="Hidden games remain saved. Restore one here or through the library’s hidden-games filter." /></legend>{!config.library.hiddenAppIds.length && <p>No hidden games.</p>}{config.library.hiddenAppIds.map(id => <div className="st-settings-library-row" key={id}><span>{name(id)}</span><button title={`Restore ${name(id)} to the library`} className="st-mini-button" onClick={() => void customizationService.setHidden(id,false)}>Show again</button></div>)}</fieldset>
    <fieldset className="stt-setting-group"><legend>Pinned games <SettingHelp text="Pinned games stay first in the library. Pinning a hidden game also restores it." /></legend>{!config.library.pinnedAppIds.length && <p>No pinned games. Right-click a game to pin it.</p>}{config.library.pinnedAppIds.map(id => <div className="st-settings-library-row" key={id}><span>{name(id)}</span><button title={`Return ${name(id)} to normal sorting`} className="st-mini-button" onClick={() => void customizationService.setPinned(id,false)}>Unpin</button></div>)}</fieldset>
    <fieldset className="stt-setting-group"><legend>Trophy Projects <SettingHelp text="Keep a shortlist of games you’re working on. Stopping a project never removes achievements." /></legend>{!config.projects.entries.length && <p>No active projects. Start one from a game’s detail page.</p>}{config.projects.entries.map(project => <div className="st-settings-library-row" key={project.appId}><span>{name(project.appId)}</span><button title={`Stop the trophy project for ${name(project.appId)}`} className="st-mini-button" onClick={() => void customizationService.removeProject(project.appId)}>Stop tracking</button></div>)}</fieldset>
  </section>;
}
