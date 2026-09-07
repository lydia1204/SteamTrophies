import type { InstalledTrophyPack } from '../../../packages/customization/src';
import { TrophyGlyph } from '../TrophyGlyph';

export function TrophyPackCard({ pack, active, appId }: { pack: InstalledTrophyPack; active?: boolean; appId?: number }) {
  return (
    <article className={`stt-pack-card${active ? ' is-active' : ''}`} data-stt-component="pack-card" data-stt-pack={pack.manifest.id}>
      <div className="stt-pack-card-icons">
        {(['bronze', 'silver', 'gold', 'platinum'] as const).map((tier) => <TrophyGlyph key={tier} tier={tier} appId={active ? appId : undefined} size={30} />)}
      </div>
      <div className="stt-pack-card-copy">
        <strong>{pack.manifest.name}</strong>
        <span>{pack.manifest.author} • v{pack.manifest.version}</span>
        {pack.manifest.description && <p>{pack.manifest.description}</p>}
        {pack.manifest.tags?.length ? <div className="stt-pack-tags">{pack.manifest.tags.map((tag) => <em key={tag}>{tag}</em>)}</div> : null}
      </div>
    </article>
  );
}
