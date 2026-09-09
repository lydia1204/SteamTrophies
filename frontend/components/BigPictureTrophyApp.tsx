import { FocusRing } from 'millennium';
import { useState, type CSSProperties } from 'react';
import type { GameSummary } from '../../packages/core/src';
import { message } from '../../packages/customization/src';
import { useTrophyState } from '../state/hooks';
import { trophyService } from '../state/service';
import { customizationService } from '../state/customization-service';
import { useCustomizationState } from '../state/customization-hooks';
import { TrophyGlyph } from './TrophyGlyph';
import { GameDetail } from './GameDetail';
import { ResponsiveBoundary } from './ResponsiveBoundary';
import { CustomizationHub } from './customization/CustomizationHub';

export function BigPictureTrophyApp() {
  const state = useTrophyState();
  const customization = useCustomizationState();
  const [showCustomization, setShowCustomization] = useState(false);
  const style = customizationService.getCssVariables('big_picture') as CSSProperties;

  if (state.selectedAppId != null && state.selectedGame) {
    return (
      <ResponsiveBoundary surface="big_picture" className="stt-bp-root" component="big-picture-game" style={style}>
        <GameDetail game={state.selectedGame} onBack={() => trophyService.closeGame()} onRefresh={() => trophyService.requestRefresh(state.selectedAppId!)} />
        <ControllerLegend />
      </ResponsiveBoundary>
    );
  }

  const visible = state.index.games.filter((game) => !customization.config.library.hiddenAppIds.includes(game.appId));
  const projectIds = new Set(customization.config.projects.entries.map((entry) => entry.appId));
  const pinnedIds = new Set(customization.config.library.pinnedAppIds);
  const recent = visible.filter((game) => game.lastUnlockAtUnix != null).slice().sort((a, b) => (b.lastUnlockAtUnix ?? 0) - (a.lastUnlockAtUnix ?? 0)).slice(0, 12);
  const nearCompletion = visible.filter((game) => game.completionPercent >= 70 && game.completionPercent < 100).slice().sort((a, b) => b.completionPercent - a.completionPercent || b.earnedCount - a.earnedCount).slice(0, 12);
  const projects = visible.filter((game) => projectIds.has(game.appId)).sort((a, b) => Number(pinnedIds.has(b.appId)) - Number(pinnedIds.has(a.appId))).slice(0, 12);
  const completed = visible.filter((game) => game.platinumEarned).slice().sort((a, b) => (b.lastUnlockAtUnix ?? 0) - (a.lastUnlockAtUnix ?? 0)).slice(0, 12);
  const all = visible.slice().sort((a, b) => Number(pinnedIds.has(b.appId)) - Number(pinnedIds.has(a.appId)) || (b.lastUnlockAtUnix ?? 0) - (a.lastUnlockAtUnix ?? 0)).slice(0, 24);
  const fallback = visible.slice(0, 12);
  const layout = customization.config.layout.surfaces.big_picture;
  const active = layout.order.filter((id) => !layout.hidden.includes(id));

  return (
    <ResponsiveBoundary surface="big_picture" className="stt-bp-root" component="big-picture-home" style={style}>
      {active.includes('profileSummary') && (
        <header className="stt-bp-hero" data-stt-component="profile-summary">
          <div>
            <span className="stt-bp-kicker">{message('bp.kicker')}</span>
            <h1>{message('bp.title')}</h1>
            <p>{state.index.totals.earnedTrophies.toLocaleString()} earned across {state.index.totals.visibleGames.toLocaleString()} trophy games</p>
          </div>
          <div>
            <div className="stt-bp-tier-totals" aria-label={message('bp.totals')}>
              <TierTotal tier="bronze" count={state.index.totals.bronze} />
              <TierTotal tier="silver" count={state.index.totals.silver} />
              <TierTotal tier="gold" count={state.index.totals.gold} />
              <TierTotal tier="platinum" count={state.index.totals.platinum} />
            </div>
            <FocusRing>
              <button title={message(showCustomization ? 'app.customize.close' : 'bp.customize')} className="stt-bp-customize-button" onClick={() => setShowCustomization((value) => !value)}>
                {message(showCustomization ? 'app.customize.close' : 'bp.customize')}
              </button>
            </FocusRing>
          </div>
        </header>
      )}

      {showCustomization && (
        <section className="stt-bp-section" data-stt-component="big-picture-customization">
          <CustomizationHub surface="big_picture" />
        </section>
      )}

      {!showCustomization && active.map((widgetId) => {
        if (widgetId === 'profileSummary') return null;
        if (widgetId === 'pinnedProjects') return <GameShelf key={widgetId} id={widgetId} title={message('bp.projects.title')} subtitle={message('bp.projects.subtitle')} games={projects} emptyText={message('bp.projects.empty')} />;
        if (widgetId === 'nearCompletion') return <GameShelf key={widgetId} id={widgetId} title={message('bp.near.title')} subtitle={message('bp.near.subtitle')} games={nearCompletion.length ? nearCompletion : fallback} />;
        if (widgetId === 'recentTrophies') return <GameShelf key={widgetId} id={widgetId} title={message('bp.recent.title')} subtitle={message('bp.recent.subtitle')} games={recent.length ? recent : fallback} />;
        if (widgetId === 'completedGames') return <GameShelf key={widgetId} id={widgetId} title={message('bp.completed.title')} subtitle={message('bp.completed.subtitle')} games={completed} emptyText={message('bp.completed.empty')} />;
        if (widgetId === 'allGames') return <GameShelf key={widgetId} id={widgetId} title={message('bp.all.title')} subtitle={message('bp.all.subtitle')} games={all} />;
        return null;
      })}
      <ControllerLegend />
    </ResponsiveBoundary>
  );
}

function TierTotal({ tier, count }: { tier: 'bronze' | 'silver' | 'gold' | 'platinum'; count: number }) {
  return <div className="stt-bp-tier-total" data-stt-tier={tier}><TrophyGlyph tier={tier} size={34} /><strong>{count.toLocaleString()}</strong></div>;
}

function GameShelf({ id, title, subtitle, games, emptyText }: { id: string; title: string; subtitle: string; games: GameSummary[]; emptyText?: string }) {
  return (
    <section className="stt-bp-section" data-stt-component="dashboard-widget" data-stt-widget={id}>
      <div className="stt-bp-section-title"><h2>{title}</h2><span>{subtitle}</span></div>
      {games.length ? (
        <div className="stt-bp-carousel">
          {games.map((game) => (
            <FocusRing key={game.appId}>
              <button className="stt-bp-game-card" onClick={() => void trophyService.selectGame(game.appId)} data-stt-component="game-card" data-stt-appid={game.appId}>
                <strong>{game.name}</strong>
                <div className="stt-bp-progress"><span style={{ width: `${game.completionPercent}%` }} /></div>
                <footer>
                  <span>{game.completionPercent.toFixed(0)}%</span>
                  <span><TrophyGlyph tier={game.platinumEarned ? 'platinum' : game.goldCount ? 'gold' : game.silverCount ? 'silver' : 'bronze'} size={24} appId={game.appId} /> {game.earnedCount}/{game.achievementCount}</span>
                </footer>
              </button>
            </FocusRing>
          ))}
        </div>
      ) : <div className="stt-bp-empty">{emptyText ?? message('bp.empty')}</div>}
    </section>
  );
}

function ControllerLegend() {
  return <footer className="stt-controller-legend" data-stt-component="controller-legend"><span><b>A</b> {message('controller.select')}</span><span><b>B</b> {message('controller.back')}</span></footer>;
}
