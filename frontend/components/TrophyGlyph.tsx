import { useEffect, useState, type CSSProperties } from 'react';
import type { TrophyTier } from '../../packages/core/src';
import { customizationService } from '../state/customization-service';
import { useCustomizationState } from '../state/customization-hooks';
import { SheetIcon } from './SheetIcon';
import { ACCESSIBLE_TIER_PALETTES } from '../../packages/customization/src/visual';

let nextTint = 0;

export function TrophyGlyph({ tier, size = 22, appId, achievementId }: { tier: TrophyTier; size?: number; appId?: number; achievementId?: string }) {
  const customization = useCustomizationState();
  const [tintId] = useState(() => `stt-glyph-tint-${++nextTint}`);
  const visual = customization.config.visual;
  const tint = visual.trophyColors[tier] ?? (visual.colorBlindMode !== 'off' ? ACCESSIBLE_TIER_PALETTES[visual.colorBlindMode][tier] : undefined);
  const channels = tint ? [1,3,5].map(start => parseInt(tint.slice(start,start+2),16)/255) : [];
  const [src, setSrc] = useState<string | null>(null);
  const scaledSize = size * customization.config.accessibility.iconScale;
  const style = { width: scaledSize, height: scaledSize } satisfies CSSProperties;
  const asset = customizationService.resolve(tier, appId, achievementId);
  const useBaseSheet = asset.packId === 'builtin.classic';

  useEffect(() => {
    let alive = true;
    setSrc(null);
    if (useBaseSheet) return () => { alive = false; };
    void customizationService.resolveTrophyIconDataUrl(tier, appId, achievementId)
      .then((url) => { if (alive) setSrc(url); })
      .catch(() => {});
    return () => { alive = false; };
  }, [tier, appId, achievementId, useBaseSheet, asset.packId, asset.relativePath, customization.packs, customization.config.trophies.globalPackId, customization.config.safeMode.externalPacksDisabled]);

  return (
    <span className={`st-trophy-glyph st-tier-${tier}`} style={style} aria-label={`${tier} trophy`} data-stt-component="trophy-glyph" data-stt-tier={tier}>
      {tint && <svg className="stt-glyph-filter" width="0" height="0" aria-hidden="true"><defs><filter id={tintId} colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values={`${channels.map(c => `${.2126*c*1.5} ${.7152*c*1.5} ${.0722*c*1.5} 0 0`).join(' ')} 0 0 0 1 0`} /></filter></defs></svg>}
      <span className="stt-glyph-art" style={{filter:tint ? `url(#${tintId})` : undefined}}>{useBaseSheet ? <SheetIcon tier={tier} size={scaledSize} /> : src ? <img src={src} alt="" aria-hidden="true" /> : (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M8 3h8v3.1c0 3.1-1.6 5.6-4 6.5-2.4-.9-4-3.4-4-6.5V3Z" />
          <path d="M8 5H4.5v1.2c0 2.3 1.5 4 3.8 4.4M16 5h3.5v1.2c0 2.3-1.5 4-3.8 4.4M12 12.7V17m-3 4h6m-4-4h2c1.1 0 2 .9 2 2v2H9v-2c0-1.1.9-2 2-2Z" />
        </svg>
      )}</span>
      {visual.colorBlindMode !== 'off' && <small className="stt-tier-letter" aria-hidden="true">{tier[0].toUpperCase()}</small>}
    </span>
  );
}
