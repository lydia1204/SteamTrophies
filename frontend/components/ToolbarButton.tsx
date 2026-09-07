import { openTrophyOverlay } from './Overlay';
import { TrophyGlyph } from './TrophyGlyph';

export function TrophyToolbarButton() {
  return (
    <button className="st-toolbar-button" onClick={openTrophyOverlay} title="Trophies" aria-label="Open Trophies">
      <TrophyGlyph tier="platinum" size={18} />
    </button>
  );
}
