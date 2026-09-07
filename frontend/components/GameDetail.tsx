import { useState } from 'react';
import type { GameSnapshot } from '../../packages/core/src';
import { message } from '../../packages/customization/src';
import { useCustomizationState } from '../state/customization-hooks';
import { customizationService } from '../state/customization-service';
import { AchievementTrophyOverridePanel } from './customization/AchievementTrophyOverridePanel';
import { GameTrophyOverridePanel } from './customization/GameTrophyOverridePanel';
import { TrophyGlyph } from './TrophyGlyph';

function formatDate(unix: number | null): string {
  if (!unix) return '';
  return new Date(unix * 1000).toLocaleString();
}

export function GameDetail({ game, onBack, onRefresh }: { game: GameSnapshot; onBack: () => void; onRefresh: () => void }) {
  const customization = useCustomizationState();
  const [customizing, setCustomizing] = useState(false);
  const [customizingAchievementId, setCustomizingAchievementId] = useState<string | null>(null);
  const project = customization.config.projects.entries.find((entry) => entry.appId === game.appId) ?? null;
  const pinned = customization.config.library.pinnedAppIds.includes(game.appId);
  const hidden = customization.config.library.hiddenAppIds.includes(game.appId);

  return (
    <div className="st-detail" data-stt-component="game-detail" data-stt-appid={game.appId}>
      <div className="st-detail-header" data-stt-slot="header">
        <button className="st-icon-button" onClick={onBack} aria-label={message('app.back')}>‹</button>
        <div className="st-detail-heading"><h2>{game.name}</h2><p>{game.summary.earnedCount}/{game.summary.achievementCount} • {game.summary.completionPercent}%</p></div>
        <div className="st-detail-actions">
          <button className="st-refresh-button" onClick={() => void (project ? customizationService.removeProject(game.appId) : customizationService.addProject(game.appId))}>{message(project ? 'project.remove' : 'project.add')}</button>
          <button className="st-refresh-button" onClick={() => void customizationService.setPinned(game.appId, !pinned)}>{message(pinned ? 'app.unpin' : 'app.pin')}</button>
          <button className="st-refresh-button" onClick={() => void customizationService.setHidden(game.appId, !hidden)}>{message(hidden ? 'app.unhide' : 'app.hide')}</button>
          <button className="st-refresh-button" onClick={() => setCustomizing((v) => !v)}>{message('pack.gameOverride')}</button>
          <button className="st-refresh-button" onClick={onRefresh}>{message('app.refresh')}</button>
        </div>
      </div>

      {project && (
        <div className="stt-project-banner" data-stt-component="trophy-project">
          <TrophyGlyph tier={game.summary.goldCount ? 'gold' : game.summary.silverCount ? 'silver' : 'bronze'} appId={game.appId} size={34} />
          <div><strong>{message('project.active')}</strong><span>{project.targetAchievementIds.length ? message('project.targets', { count: project.targetAchievementIds.length }) : message('project.chooseTargets')}</span></div>
        </div>
      )}

      {customizing && <GameTrophyOverridePanel game={game} onClose={() => setCustomizing(false)} />}
      {game.platinum.achieved && (
        <div className="st-platinum-card" data-stt-component="platinum-card">
          <TrophyGlyph tier="platinum" size={34} appId={game.appId} />
          <div><strong>Platinum</strong><span>{formatDate(game.platinum.unlockedAtUnix)}</span></div>
        </div>
      )}

      <div className="st-achievement-list" data-stt-slot="achievements">
        {game.achievements.map((achievement) => {
          const tier = achievement.achieved ? (achievement.awardedTier ?? achievement.tier) : achievement.tier;
          const targeted = project?.targetAchievementIds.includes(achievement.id) ?? false;
          return (
            <div key={achievement.id}>
              <div className={`st-achievement ${achievement.achieved ? 'is-earned' : 'is-locked'}${targeted ? ' is-targeted' : ''}`} data-stt-component="achievement-card" data-stt-achievement={achievement.id} data-stt-tier={tier} data-stt-state={achievement.achieved ? 'earned' : 'locked'}>
                <div className="st-achievement-icon">{achievement.iconUrl ? <img src={achievement.iconUrl} loading="lazy" alt="" /> : <TrophyGlyph tier={tier} size={26} appId={game.appId} achievementId={achievement.id} />}</div>
                <div className="st-achievement-copy">
                  <strong>{achievement.hidden && !achievement.achieved ? message('achievement.hidden') : achievement.name}</strong>
                  <p>{achievement.hidden && !achievement.achieved ? message('achievement.hiddenDescription') : achievement.description}</p>
                  {achievement.achieved && <small>{formatDate(achievement.unlockedAtUnix)}</small>}
                </div>
                <div className="st-achievement-rarity"><TrophyGlyph tier={tier} size={23} appId={game.appId} achievementId={achievement.id} /><span>{achievement.globalUnlockPercent == null ? '—' : `${achievement.globalUnlockPercent.toFixed(1)}%`}</span></div>
                <div className="st-achievement-actions">
                  {project && !achievement.achieved && <button className="st-mini-button" onClick={() => void customizationService.setProjectTargets(game.appId, targeted ? project.targetAchievementIds.filter((id) => id !== achievement.id) : [...project.targetAchievementIds, achievement.id])}>{message(targeted ? 'project.targeted' : 'project.target')}</button>}
                  <button className="st-mini-button" onClick={() => setCustomizingAchievementId((id) => id === achievement.id ? null : achievement.id)}>{message('app.icon')}</button>
                </div>
              </div>
              {customizingAchievementId === achievement.id && <AchievementTrophyOverridePanel appId={game.appId} achievement={achievement} tier={tier} onClose={() => setCustomizingAchievementId(null)} />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
