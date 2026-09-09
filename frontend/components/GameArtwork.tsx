import { useState } from 'react';
import { resolveGameArtwork, artworkOrder } from '../runtime/library';
import { useCustomizationState } from '../state/customization-hooks';
import { libraryRowMetrics } from '../../packages/customization/src';

export function GameArtwork({ appId }: { appId: number }) {
  const [failedUrls, setFailedUrls] = useState<readonly string[]>([]);
  const { library, accessibility } = useCustomizationState().config;
  const override = library.gameArtwork[String(appId)];
  const style = override?.style ?? library.artworkStyle;
  const order = override ? [style, ...override.fallbackOrder.filter(kind => kind !== style)] : artworkOrder(style, library.artworkFallbackOrder);
  const choice = order.map(kind => ({ kind, url: resolveGameArtwork(appId, kind) })).find(candidate => candidate.url && !failedUrls.includes(candidate.url));
  const shape = library.allowFallbackShapeChange && choice ? choice.kind : style;
  const metrics = libraryRowMetrics(accessibility, { ...library, artworkStyle: shape });
  const url = choice?.url;
  return <span style={{ width:`calc(var(--st-game-art-height,${metrics.artHeight}px) * ${shape === 'landscape' ? 920/430 : shape === 'capsule' ? 2/3 : 1})`, height:`var(--st-game-art-height,${metrics.artHeight}px)` }} className={`st-game-artwork st-game-artwork-${shape}${choice && choice.kind !== style ? ` st-artwork-fallback st-fallback-${choice.kind}` : ''}`} title={choice && choice.kind !== style ? `${style} artwork unavailable; showing ${choice.kind} artwork` : undefined} aria-hidden="true">{url
    ? <img src={url} alt="" loading="lazy" onError={() => setFailedUrls(previous => [...previous, url])} />
    : <span title="Game artwork unavailable">◇</span>}</span>;
}
