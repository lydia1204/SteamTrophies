import type { CSSProperties } from 'react';
import { buildGameSnapshot } from '../../../packages/core/src';
import { libraryRowMetrics } from '../../../packages/customization/src';
import { useCustomizationState } from '../../state/customization-hooks';
import { useTrophyState } from '../../state/hooks';
import { GameArtwork } from '../GameArtwork';
import { TrophyGlyph } from '../TrophyGlyph';
import { RecentAchievement } from '../RecentAchievement';

// Presentation-only fixtures: never passed to the service, event queue or storage.
const samples = buildGameSnapshot({ appId:1,name:'Appearance preview',nowUnix:1700000000,staleTtlSeconds:600,achievements:[70,15,3].map((rarity,i) => ({id:`preview-${i}`,name:['First steps','One more quest','Legendary finish'][i],description:'An example achievement. Your saved library is unchanged.',hidden:false,achieved:true,globalUnlockPercent:rarity,unlockedAtUnix:1700000000,iconUrl:null,currentProgress:null,minProgress:null,maxProgress:null})) }).achievements;

export function AppearancePreview() {
  const { config } = useCustomizationState();
  const game = useTrophyState().index.games[0];
  const metrics = libraryRowMetrics(config.accessibility,config.library);
  return <fieldset className="stt-setting-group stt-appearance-preview"><legend>Live appearance preview</legend>
    <p className="st-settings-help">Hover or focus a sample achievement to preview its tooltip. These samples never add trophies or play sounds.</p>
    <div className="stt-preview-card" style={{ minHeight:metrics.artHeight+18 } as CSSProperties}>
      {game && <GameArtwork appId={game.appId} />}
      <div><strong>Example game{config.visual.showReleaseYearLibrary && <span className="st-release-year"> (2013)</span>}</strong><div className="st-progress-track"><span style={{width:'60%'}} /></div><div className="st-game-tier-counts">{(['platinum','gold','silver','bronze'] as const).map(tier => <span key={tier}><TrophyGlyph tier={tier} size={17} />1</span>)}</div></div>
      <span>3/5{config.visual.showCompletionRarity && <small className="stt-preview-muted">≤3.0%</small>}</span>
    </div>
    <div className="stt-size-preview" style={{ '--st-achievement-size':`${config.library.achievementSize}px` } as CSSProperties}>{samples.map(a => <span key={a.id} className="st-game-recent"><RecentAchievement achievement={a} appId={0} /></span>)}<span className="st-game-recent"><RecentAchievement achievement={samples[2]} appId={0} platinum /></span>{config.library.showHeaderTotal && <span>Total: 4</span>}</div>
  </fieldset>;
}
