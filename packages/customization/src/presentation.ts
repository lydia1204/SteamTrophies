import type { AccessibilityPreferencesV1, LibraryPresentationStateV1 } from './types';

/** Shared pixel metrics for the virtualizer and its cards. Scale content, not empty space. */
export function libraryRowMetrics(accessibility: Pick<AccessibilityPreferencesV1, 'textScale' | 'iconScale'>, library: Pick<LibraryPresentationStateV1, 'achievementSize' | 'artworkStyle'>, width = 1280) {
  const textScale = Number.isFinite(accessibility.textScale) ? Math.max(.8, Math.min(2, accessibility.textScale)) : 1;
  const iconScale = Number.isFinite(accessibility.iconScale) ? Math.max(.8, Math.min(2, accessibility.iconScale)) : 1;
  const achievementSize = Number.isFinite(library.achievementSize) ? Math.max(32, Math.min(72, library.achievementSize)) : 44;
  const glyphHeight = Math.ceil(Math.max(17 * iconScale, 10.5 * textScale * 1.45));
  const tierHeight = width < 520 ? glyphHeight*2+6 : glyphHeight;
  const textHeight = Math.ceil(14 * textScale * 1.45) + 8 + Math.ceil(10.5 * textScale * 1.45) + 5 + tierHeight;
  // 8px card separation, 16px padding and two 1px borders.
  const stacked = width < 1024;
  const artHeight = stacked ? Math.max(56,textHeight-5-tierHeight) : Math.ceil(Math.max(70,textHeight,achievementSize));
  const rowHeight = artHeight + 26 + (stacked ? tierHeight+5 : 0);
  const artWidth = Math.round(artHeight * (library.artworkStyle === 'landscape' ? 920 / 430 : library.artworkStyle === 'capsule' ? 2 / 3 : 1));
  const summaryWidth = Math.ceil(68*iconScale + 126*textScale + 38);
  return { rowHeight, artHeight, artWidth, tierHeight, summaryWidth };
}
