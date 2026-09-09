import { BUILTIN_THEMES } from '../../../packages/customization/src';
import { useCustomizationState } from '../../state/customization-hooks';
import { customizationService } from '../../state/customization-service';
import { SettingHelp, SettingSwitch } from './SettingControls';
import { TrophyGlyph } from '../TrophyGlyph';
import { VisualSettings } from './VisualSettings';
import { AppearancePreview } from './AppearancePreview';

export function ThemeAccessibilityPanel() {
  const state = useCustomizationState();
  const a = state.config.accessibility;
  return (
    <><section className="stt-settings-section" data-stt-component="theme-accessibility-settings">
      <header><div><h3>Appearance & accessibility</h3><p>Choose the cabinet’s theme, text size and trophy size. Changes are saved automatically.</p></div></header>
      <fieldset className="stt-setting-group"><legend>Game artwork</legend><div className="stt-settings-grid">
        <label className="stt-field"><span>Artwork style <SettingHelp text="Choose portrait cards, wide store covers, or square game icons." /></span><select value={state.config.library.artworkStyle} onChange={e => void customizationService.setLibraryAppearance({ artworkStyle: e.target.value as 'capsule' | 'icon' | 'landscape' })}><option value="capsule">Portrait game cards</option><option value="landscape">Landscape store artwork</option><option value="icon">Square game icons</option></select></label>
        <label className="stt-field"><span>Fallback order <SettingHelp text="If your chosen artwork is missing, try these styles in order. Images keep their shape." /></span><select value={state.config.library.artworkFallbackOrder.join(',')} onChange={e => void customizationService.setLibraryAppearance({ artworkFallbackOrder: e.target.value.split(',') as ('capsule' | 'icon' | 'landscape')[] })}>{['landscape,capsule,icon','landscape,icon,capsule','capsule,landscape,icon','capsule,icon,landscape','icon,landscape,capsule','icon,capsule,landscape'].map(order => <option key={order} value={order}>{order.replace(/capsule/g, 'portrait').split(',').join(' → ')}</option>)}</select></label>
      </div></fieldset>
      <SettingSwitch label="Allow fallback shape changes" help="Let missing artwork switch to its fallback’s natural shape. Off keeps your chosen frame. Both keep rows aligned and images uncropped." checked={state.config.library.allowFallbackShapeChange} onChange={checked => void customizationService.setLibraryAppearance({ allowFallbackShapeChange:checked })} />
      <fieldset className="stt-setting-group"><legend>Size & readability</legend><div className="stt-settings-grid">
        <label className="stt-field"><span>Achievement artwork • {state.config.library.achievementSize}px <SettingHelp text="Resize achievement pictures. The library fits as many as your row can hold." /></span><input type="range" min="32" max="72" step="2" value={state.config.library.achievementSize} onChange={e => void customizationService.setLibraryAppearance({ achievementSize: Number(e.target.value) })} /></label>
        <label className="stt-field"><span>Trophy icons • {Math.round(a.iconScale * 100)}% <SettingHelp text="Resize the Bronze, Silver, Gold and Platinum trophy symbols everywhere." /></span><input type="range" min="0.8" max="2" step="0.05" value={a.iconScale} onChange={e => void customizationService.setAccessibility({ iconScale: Number(e.target.value) })} /></label>
        <label className="stt-field"><span>Text size • {Math.round(a.textScale * 100)}% <SettingHelp text="Make text easier to read. Rows grow only enough to fit the larger text." /></span><input type="range" min="0.8" max="2" step="0.05" value={a.textScale} onChange={e => void customizationService.setAccessibility({ textScale: Number(e.target.value) })} /></label>
        <SettingSwitch label="High contrast" help="Increase contrast between text, controls and their backgrounds." checked={a.highContrast} onChange={checked => void customizationService.setAccessibility({ highContrast: checked })} />
      </div><div className="stt-size-preview" aria-label="Live trophy size preview">{(['bronze','silver','gold','platinum'] as const).map(tier => <TrophyGlyph key={tier} tier={tier} size={34} />)}<span>Live size preview</span></div></fieldset>
      <fieldset className="stt-setting-group"><legend>Achievement borders & animation</legend><div className="stt-settings-grid">
        <SettingSwitch label="Bronze achievement borders" help="Add a Bronze outline to earned Bronze achievement pictures." checked={state.config.library.bronzeBorders} onChange={checked => void customizationService.setLibraryAppearance({ bronzeBorders: checked })} />
        <SettingSwitch label="Silver achievement borders" help="Add a Silver outline to earned Silver achievement pictures." checked={state.config.library.silverBorders} onChange={checked => void customizationService.setLibraryAppearance({ silverBorders: checked })} />
        <SettingSwitch label="Achievement animations" help="Animate trophy shines and celebrations. Your system’s reduced-motion setting still takes priority." checked={!a.reducedMotion} onChange={checked => void customizationService.setAccessibility({ reducedMotion: !checked })} />
      </div></fieldset>
      <fieldset className="stt-setting-group"><legend>Library information</legend><div className="stt-settings-grid">
        <SettingSwitch label="Show header total" help="Show the combined earned trophy count beside Bronze in the library header." checked={state.config.library.showHeaderTotal} onChange={checked => void customizationService.setLibraryAppearance({ showHeaderTotal: checked })} />
        <SettingSwitch label="Keep original completion achievement" help="Show both the Platinum row and the original achievement that earned it. Counts and saved unlocks never change." checked={state.config.library.showOriginalPlatinumAchievement} onChange={checked => void customizationService.setLibraryAppearance({ showOriginalPlatinumAchievement: checked })} />
      </div></fieldset>
      <fieldset className="stt-setting-group"><legend>Theme <SettingHelp text="Preview each palette, then choose one to apply its colors throughout Trophies." /></legend>
        <div className="stt-theme-options">{BUILTIN_THEMES.map(theme => <button key={theme.id} className="stt-theme-choice" aria-pressed={state.config.themeId === theme.id} title={`Apply ${theme.name} colors`} onClick={() => void customizationService.setTheme(theme.id)} style={{ background:theme.tokens.color.background, color:theme.tokens.color.text }}><span className="stt-theme-swatches" aria-hidden="true">{(theme.previewColors ?? [theme.tokens.color.surface,theme.tokens.color.surfaceRaised,theme.tokens.color.accent,theme.tokens.color.focus]).map((color,i) => <i key={i} style={{ background:color }} />)}</span>{theme.name}</button>)}</div>
      </fieldset>
    </section><VisualSettings /><AppearancePreview /></>
  );
}
