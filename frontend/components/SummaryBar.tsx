import { LibraryIndex } from '../../packages/core/src';
import { TrophyGlyph } from './TrophyGlyph';

export function SummaryBar({ index }: { index: LibraryIndex }) {
  const t = index.totals;
  return (
    <div className="st-summary-bar">
      <div className="st-summary-main">
        <strong>{t.earnedTrophies.toLocaleString()}</strong>
        <span>Trophies</span>
      </div>
      <div className="st-summary-tier"><TrophyGlyph tier="platinum" size={18} /><b>{t.platinum}</b></div>
      <div className="st-summary-tier"><TrophyGlyph tier="gold" size={18} /><b>{t.gold}</b></div>
      <div className="st-summary-tier"><TrophyGlyph tier="silver" size={18} /><b>{t.silver}</b></div>
      <div className="st-summary-tier"><TrophyGlyph tier="bronze" size={18} /><b>{t.bronze}</b></div>
    </div>
  );
}
