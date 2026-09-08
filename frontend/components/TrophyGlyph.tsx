import { useEffect, useState, type CSSProperties } from 'react';
import type { TrophyTier } from '../../packages/core/src';
import { customizationService } from '../state/customization-service';
import { useCustomizationState } from '../state/customization-hooks';
import { SheetIcon } from './SheetIcon';

export function TrophyGlyph({ tier, size = 22, appId, achievementId }: { tier: TrophyTier; size?: number; appId?: number; achievementId?: string }) {
  useCustomizationState(); // Re-resolve when pack/override state changes.
  const [src, setSrc] = useState<string | null>(null);
  const style = { width: size, height: size } satisfies CSSProperties;
  const useBaseSheet = customizationService.resolve(tier, appId, achievementId).packId === 'builtin.classic';

  useEffect(() => {
    let alive = true;
    setSrc(null);
    if (useBaseSheet) return () => { alive = false; };
    void customizationService.resolveTrophyIconDataUrl(tier, appId, achievementId)
      .then((url) => { if (alive) setSrc(url); })
      .catch(() => {});
    return () => { alive = false; };
  }, [tier, appId, achievementId, useBaseSheet, customizationService.getSnapshot().config]);

  return (
    <span className={`st-trophy-glyph st-tier-${tier}`} style={style} aria-label={`${tier} trophy`} data-stt-component="trophy-glyph" data-stt-tier={tier}>
      {useBaseSheet ? <SheetIcon tier={tier} size={size} /> : src ? <img src={src} alt="" aria-hidden="true" /> : (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8 3h8v3.1c0 3.1-1.6 5.6-4 6.5-2.4-.9-4-3.4-4-6.5V3Z" />
          <path d="M8 5H4.5v1.2c0 2.3 1.5 4 3.8 4.4M16 5h3.5v1.2c0 2.3-1.5 4-3.8 4.4M12 12.7V17m-3 4h6m-4-4h2c1.1 0 2 .9 2 2v2H9v-2c0-1.1.9-2 2-2Z" />
        </svg>
      )}
    </span>
  );
}
