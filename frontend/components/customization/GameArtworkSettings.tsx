import { useCustomizationState } from '../../state/customization-hooks';
import { customizationService } from '../../state/customization-service';
import { SettingHelp } from './SettingControls';

export function GameArtworkSettings({ appId }: { appId:number }) {
  const library = useCustomizationState().config.library;
  const entry = library.gameArtwork[String(appId)];
  const save = (style: string, order = entry?.fallbackOrder ?? ['icon']) => {
    const gameArtwork = { ...library.gameArtwork };
    if (style === 'inherit') delete gameArtwork[String(appId)];
    else gameArtwork[String(appId)] = { style:style as 'capsule' | 'icon' | 'landscape', fallbackOrder:order as ('capsule' | 'icon' | 'landscape')[] };
    void customizationService.setLibraryAppearance({ gameArtwork });
  };
  return <fieldset className="stt-setting-group"><legend>This game’s artwork <SettingHelp text="Override artwork for this game only. Follow library removes the override." /></legend><div className="stt-settings-grid">
    <label className="stt-field">Artwork style<SettingHelp text="Choose a cover style for this game only. Follow library removes the override." /><select value={entry?.style ?? 'inherit'} onChange={e => save(e.target.value)}><option value="inherit">Follow library</option><option value="landscape">Landscape</option><option value="capsule">Portrait</option><option value="icon">Square icon</option></select></label>
    {entry && <label className="stt-field">Allowed fallbacks, in order<SettingHelp text="Try these styles only when this game’s selected art is missing. No fallback keeps an empty frame." /><select value={entry.fallbackOrder.join(',')} onChange={e => save(entry.style, e.target.value ? e.target.value.split(',') : [])}>{['','icon','landscape','capsule','landscape,icon','icon,landscape','capsule,icon','icon,capsule','capsule,landscape','landscape,capsule','landscape,capsule,icon','capsule,landscape,icon','icon,landscape,capsule','icon,capsule,landscape','capsule,icon,landscape','landscape,icon,capsule'].map(order => <option key={order} value={order}>{order ? order.replace(/capsule/g,'portrait').split(',').join(' → ') : 'No fallback'}</option>)}</select></label>}
  </div></fieldset>;
}
