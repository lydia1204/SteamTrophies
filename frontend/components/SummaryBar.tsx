import { LibraryIndex } from '../../packages/core/src';
import { TrophyGlyph } from './TrophyGlyph';
import { useCustomizationState } from '../state/customization-hooks';

export function SummaryBar({ index, hero = false }: { index: LibraryIndex; hero?: boolean }) {
  const t = index.totals;
  const showTotal = useCustomizationState().config.library.showHeaderTotal;
  return (
    <div className={`st-summary-bar${hero ? ' st-summary-hero' : ''}`} aria-label={`${t.visibleGames} games, ${t.earnedTrophies.toLocaleString()} trophies`}>
      {!hero && <div className="st-summary-main">
        <strong>{t.earnedTrophies.toLocaleString()}</strong>
        <span>Trophies</span>
      </div>}
      {(['platinum', 'gold', 'silver', 'bronze'] as const).map(tier => <div key={tier} className="st-summary-tier"><TrophyGlyph tier={tier} size={hero ? 46 : 18} /><b>{t[tier].toLocaleString()}</b></div>)}
      {hero && showTotal && <span className="st-summary-total" title="Earned Bronze, Silver, Gold and Platinum trophies combined">Total: {t.earnedTrophies.toLocaleString()}</span>}
    </div>
  );
}
