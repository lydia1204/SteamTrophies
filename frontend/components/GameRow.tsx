import { GameSummary } from '../../packages/core/src';
import { TrophyGlyph } from './TrophyGlyph';

export function GameRow({ game, onOpen }: { game: GameSummary; onOpen: () => void }) {
  return (
    <button className="st-game-row" onClick={onOpen} data-stt-component="game-card" data-stt-appid={game.appId} data-stt-state={game.platinumEarned ? 'complete' : 'in-progress'}>
      <div className="st-game-row-main" data-stt-slot="summary">
        <div className="st-game-title">{game.name}</div>
        <div className="st-game-progress-line">
          <div className="st-progress-track"><span style={{ width: `${game.completionPercent}%` }} /></div>
          <span>{game.completionPercent.toFixed(game.completionPercent % 1 ? 1 : 0)}%</span>
        </div>
      </div>
      <div className="st-game-tier-counts" data-stt-slot="trophy-summary">
        {game.platinumEarned && <span><TrophyGlyph tier="platinum" size={17} appId={game.appId} />1</span>}
        {game.goldCount > 0 && <span><TrophyGlyph tier="gold" size={17} appId={game.appId} />{game.goldCount}</span>}
        {game.silverCount > 0 && <span><TrophyGlyph tier="silver" size={17} appId={game.appId} />{game.silverCount}</span>}
        {game.bronzeCount > 0 && <span><TrophyGlyph tier="bronze" size={17} appId={game.appId} />{game.bronzeCount}</span>}
      </div>
      <div className="st-game-earned">{game.earnedCount}/{game.achievementCount}</div>
    </button>
  );
}
