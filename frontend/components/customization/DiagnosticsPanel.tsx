import { message, RESOLUTION_TEST_MATRIX } from '../../../packages/customization/src';
import { useCustomizationState } from '../../state/customization-hooks';
import { customizationService } from '../../state/customization-service';
import { useTrophyState } from '../../state/hooks';

export function DiagnosticsPanel() {
  const customization = useCustomizationState();
  const trophy = useTrophyState();
  const safe = customization.config.safeMode;
  return (
    <section className="stt-settings-section" data-stt-component="diagnostics-panel">
      <header><div><h3>{message('diagnostics.title')}</h3><p>{message('diagnostics.description')}</p></div></header>
      <div className="stt-diagnostic-grid">
        <span>{message('diagnostics.cachedGames')}<strong>{trophy.index.totals.visibleGames}</strong></span>
        <span>{message('diagnostics.installedPacks')}<strong>{customization.packs.length}</strong></span>
        <span>{message('diagnostics.resolutionFixtures')}<strong>{RESOLUTION_TEST_MATRIX.length}</strong></span>
        <span>{message('diagnostics.schema')}<strong>v{customization.config.version}</strong></span>
      </div>
      <div className="stt-customize-actions">
        <button onClick={() => void customizationService.setSafeMode({ externalPacksDisabled: !safe.externalPacksDisabled })}>{message(safe.externalPacksDisabled ? 'diagnostics.enablePacks' : 'diagnostics.disablePacks')}</button>
        <button onClick={() => void customizationService.setSafeMode({ themesDisabled: !safe.themesDisabled })}>{message(safe.themesDisabled ? 'diagnostics.enableTheme' : 'diagnostics.disableTheme')}</button>
        <button onClick={() => void customizationService.setDeveloper({ responsiveDebug: !customization.config.developer.responsiveDebug })}>{message(customization.config.developer.responsiveDebug ? 'diagnostics.hideResponsive' : 'diagnostics.showResponsive')}</button>
        <button onClick={() => void customizationService.setDeveloper({ focusDebug: !customization.config.developer.focusDebug })}>{message(customization.config.developer.focusDebug ? 'diagnostics.hideFocus' : 'diagnostics.showFocus')}</button>
      </div>
    </section>
  );
}
