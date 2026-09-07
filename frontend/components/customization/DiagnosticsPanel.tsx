import { RESOLUTION_TEST_MATRIX } from '../../../packages/customization/src';
import { useCustomizationState } from '../../state/customization-hooks';
import { customizationService } from '../../state/customization-service';
import { useTrophyState } from '../../state/hooks';

export function DiagnosticsPanel() {
  const customization = useCustomizationState();
  const trophy = useTrophyState();
  const safe = customization.config.safeMode;
  return (
    <section className="stt-settings-section" data-stt-component="diagnostics-panel">
      <header><div><h3>Diagnostics & safe mode</h3><p>Escape hatches stay available even when customization is broken.</p></div></header>
      <div className="stt-diagnostic-grid">
        <span>Cached trophy games<strong>{trophy.index.totals.visibleGames}</strong></span>
        <span>Installed icon packs<strong>{customization.packs.length}</strong></span>
        <span>Resolution fixtures<strong>{RESOLUTION_TEST_MATRIX.length}</strong></span>
        <span>Customization schema<strong>v{customization.config.version}</strong></span>
      </div>
      <div className="stt-customize-actions">
        <button onClick={() => void customizationService.setSafeMode({ externalPacksDisabled: !safe.externalPacksDisabled })}>{safe.externalPacksDisabled ? 'Enable custom packs' : 'Disable custom packs'}</button>
        <button onClick={() => void customizationService.setSafeMode({ themesDisabled: !safe.themesDisabled })}>{safe.themesDisabled ? 'Enable selected theme' : 'Disable selected theme'}</button>
        <button onClick={() => void customizationService.setDeveloper({ responsiveDebug: !customization.config.developer.responsiveDebug })}>{customization.config.developer.responsiveDebug ? 'Hide responsive debug' : 'Show responsive debug'}</button>
        <button onClick={() => void customizationService.setDeveloper({ focusDebug: !customization.config.developer.focusDebug })}>{customization.config.developer.focusDebug ? 'Hide focus debug' : 'Show focus debug'}</button>
      </div>
    </section>
  );
}
