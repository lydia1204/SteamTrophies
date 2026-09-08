import { useState } from 'react';
import { resolveGameArtwork, artworkOrder } from '../runtime/library';
import { useCustomizationState } from '../state/customization-hooks';

export function GameArtwork({ appId }: { appId: number }) {
  const [failedUrls, setFailedUrls] = useState<readonly string[]>([]);
  const { artworkStyle: style, artworkFallbackOrder } = useCustomizationState().config.library;
  const choice = artworkOrder(style, artworkFallbackOrder).map(kind => ({ kind, url: resolveGameArtwork(appId, kind) })).find(candidate => candidate.url && !failedUrls.includes(candidate.url));
  const url = choice?.url;
  return <span className={`st-game-artwork st-game-artwork-${style}${choice && choice.kind !== style ? ` st-artwork-fallback st-fallback-${choice.kind}` : ''}`} title={choice && choice.kind !== style ? `${style} artwork unavailable; showing ${choice.kind} artwork` : undefined} aria-hidden="true">{url
    ? <img src={url} alt="" loading="lazy" onError={() => setFailedUrls(previous => [...previous, url])} />
    : <span title="Game artwork unavailable">◇</span>}</span>;
}
