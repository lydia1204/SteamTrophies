import { BUILTIN_THEMES } from '../../../packages/customization/src';
import { useCustomizationState } from '../../state/customization-hooks';
import { customizationService } from '../../state/customization-service';

export function ThemeAccessibilityPanel() {
  const state = useCustomizationState();
  const a = state.config.accessibility;
  return (
    <section className="stt-settings-section" data-stt-component="theme-accessibility-settings">
      <header><div><h3>Appearance foundation</h3><p>The full theme editor comes later; every component already consumes these semantic tokens.</p></div></header>
      <div className="stt-settings-grid">
        <label className="stt-field"><span>Built-in theme</span><select value={state.config.themeId} onChange={(e) => void customizationService.setTheme(e.currentTarget.value)}>{BUILTIN_THEMES.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select></label>
        <label className="stt-toggle"><input type="checkbox" checked={a.reducedMotion} onChange={(e) => void customizationService.setAccessibility({ reducedMotion: e.currentTarget.checked })} /><span>Reduced motion</span></label>
        <label className="stt-toggle"><input type="checkbox" checked={a.highContrast} onChange={(e) => void customizationService.setAccessibility({ highContrast: e.currentTarget.checked })} /><span>High contrast</span></label>
        <label className="stt-field"><span>Text scale • {Math.round(a.textScale * 100)}%</span><input type="range" min="0.8" max="2" step="0.05" value={a.textScale} onChange={(e) => void customizationService.setAccessibility({ textScale: Number(e.currentTarget.value) })} /></label>
        <label className="stt-field"><span>Trophy icon scale • {Math.round(a.iconScale * 100)}%</span><input type="range" min="0.8" max="2" step="0.05" value={a.iconScale} onChange={(e) => void customizationService.setAccessibility({ iconScale: Number(e.currentTarget.value) })} /></label>
      </div>
    </section>
  );
}
