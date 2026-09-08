import { BUILTIN_THEMES } from '../../../packages/customization/src';
import { useCustomizationState } from '../../state/customization-hooks';
import { customizationService } from '../../state/customization-service';

export function ThemeAccessibilityPanel() {
  const state = useCustomizationState();
  const a = state.config.accessibility;
  return (
    <section className="stt-settings-section" data-stt-component="theme-accessibility-settings">
      <header><div><h3>Appearance & accessibility</h3><p>Choose the cabinet’s theme, text size and trophy size. Changes are saved automatically.</p></div></header>
      <div className="stt-settings-grid">
        <label className="stt-field"><span>Game artwork</span><select value={state.config.library.artworkStyle} onChange={e => void customizationService.setLibraryAppearance({ artworkStyle: e.target.value as 'capsule' | 'icon' | 'landscape' })}><option value="capsule">Portrait game cards</option><option value="landscape">Landscape store artwork</option><option value="icon">Square game icons</option></select></label>
        <label className="stt-field"><span>Missing artwork fallback order</span><select value={state.config.library.artworkFallbackOrder.join(',')} onChange={e => void customizationService.setLibraryAppearance({ artworkFallbackOrder: e.target.value.split(',') as ('capsule' | 'icon' | 'landscape')[] })}>{['landscape,capsule,icon','landscape,icon,capsule','capsule,landscape,icon','capsule,icon,landscape','icon,landscape,capsule','icon,capsule,landscape'].map(order => <option key={order} value={order}>{order.replace(/capsule/g, 'portrait').split(',').join(' → ')}</option>)}</select><small>Your selected style is tried first, then this order. Unavailable images are skipped.</small></label>
        <label className="stt-field"><span>Achievement artwork size • {state.config.library.achievementSize}px</span><input type="range" min="32" max="72" step="2" value={state.config.library.achievementSize} onChange={e => void customizationService.setLibraryAppearance({ achievementSize: Number(e.target.value) })} /></label>
        <label className="stt-toggle"><input type="checkbox" checked={state.config.library.bronzeBorders} onChange={e => void customizationService.setLibraryAppearance({ bronzeBorders: e.target.checked })} /><span>Bronze achievement borders</span></label>
        <label className="stt-toggle"><input type="checkbox" checked={state.config.library.silverBorders} onChange={e => void customizationService.setLibraryAppearance({ silverBorders: e.target.checked })} /><span>Silver achievement borders</span></label>
        <label className="stt-field"><span>Built-in theme</span><select value={state.config.themeId} onChange={(e) => void customizationService.setTheme(e.currentTarget.value)}>{BUILTIN_THEMES.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select></label>
        <label className="stt-toggle"><input type="checkbox" checked={a.reducedMotion} onChange={(e) => void customizationService.setAccessibility({ reducedMotion: e.currentTarget.checked })} /><span>Reduced motion</span></label>
        <label className="stt-toggle"><input type="checkbox" checked={a.highContrast} onChange={(e) => void customizationService.setAccessibility({ highContrast: e.currentTarget.checked })} /><span>High contrast</span></label>
        <label className="stt-field"><span>Text scale • {Math.round(a.textScale * 100)}%</span><input type="range" min="0.8" max="2" step="0.05" value={a.textScale} onChange={(e) => void customizationService.setAccessibility({ textScale: Number(e.currentTarget.value) })} /></label>
        <label className="stt-field"><span>Trophy icon scale • {Math.round(a.iconScale * 100)}%</span><input type="range" min="0.8" max="2" step="0.05" value={a.iconScale} onChange={(e) => void customizationService.setAccessibility({ iconScale: Number(e.currentTarget.value) })} /></label>
      </div>
    </section>
  );
}
