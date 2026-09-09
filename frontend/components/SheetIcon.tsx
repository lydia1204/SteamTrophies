import { useEffect, useState } from 'react';
import { trophyBackend } from '../runtime/backend';
import type { TrophyTier } from '../../packages/core/src';

// Render a clipped viewport of the supplied originals; never resample or rewrite their pixels.
const sheets = new Map<string, Promise<string>>();
function loadSheet(name: string): Promise<string> {
  let request = sheets.get(name);
  if (!request) {
    request = trophyBackend.readBundledTrophyAssetDataUrl(`resources/ui/${name}-sheet.png`);
    sheets.set(name, request);
    void request.catch(() => sheets.delete(name));
  }
  return request;
}
const trophies: Record<TrophyTier, string> = {
  platinum: '65 447 272 328', gold: '362 447 260 328', silver: '649 447 264 328', bronze: '935 447 264 328',
};
const controls = { refresh: '547 1039 94 84', settings: '151 133 104 95', filter: '675 135 100 91', pin:'551 550 86 86', hidden:'414 552 97 83', visible:'286 559 96 68', project:'808 548 97 88', recap:'944 657 85 85', artwork:'290 765 87 73', down:'809 256 89 56', back:'419 249 65 76' };
let nextFilter = 0;
export function SheetIcon({ tier, control, size = 24, tint = false }: { tier?: TrophyTier; control?: keyof typeof controls; size?: number; tint?: boolean }) {
  const name = tier ? 'trophy' : 'control';
  const [src, setSrc] = useState<string | null>(null);
  const [filterId] = useState(() => `st-sheet-tint-${++nextFilter}`);
  const bounds = tier ? trophies[tier] : controls[control!];
  const [x, y, width, height] = bounds.split(' ').map(Number);
  useEffect(() => { let alive = true; void loadSheet(name).then(url => { if (alive) setSrc(url); }).catch(() => {}); return () => { alive = false; }; }, [name]);
  return <svg className={`st-sheet-icon ${control ? 'st-sheet-control' : ''}`} width={size} height={size} viewBox={bounds} aria-hidden="true" style={{ overflow: 'hidden' }}>
    {tint && <defs><filter id={filterId} colorInterpolationFilters="sRGB"><feFlood floodColor="currentColor" /><feComposite in2="SourceAlpha" operator="in" /></filter></defs>}
    <svg x={x} y={y} width={width} height={height} viewBox={bounds} overflow="hidden" filter={tint ? `url(#${filterId})` : undefined}>
      {src && <image href={src} width={tier ? 1254 : 1330} height={tier ? 1254 : 1182} />}
    </svg>
  </svg>;
}
