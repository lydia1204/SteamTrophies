import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { completionAchievement, completionRarityLimit, type GameSnapshot } from '../../packages/core/src';
import { message } from '../../packages/customization/src';
import { useCustomizationState } from '../state/customization-hooks';
import { customizationService } from '../state/customization-service';
import { AchievementTrophyOverridePanel } from './customization/AchievementTrophyOverridePanel';
import { GameTrophyOverridePanel } from './customization/GameTrophyOverridePanel';
import { TrophyGlyph } from './TrophyGlyph';
import { GameArtwork } from './GameArtwork';
import { GameArtworkSettings } from './customization/GameArtworkSettings';
import { SheetIcon } from './SheetIcon';
import { ReleaseYear } from './ReleaseYear';
import { AchievementGroupsSettings } from './customization/AchievementGroupsSettings';
import { AchievementGroup } from './AchievementGroup';

const rememberedDetail = new Map<number, { scroll:number; query:string; earned:'all'|'earned'|'unearned'; tier:'all'|'bronze'|'silver'|'gold' }>();

function formatDate(unix: number | null): string {
  if (!unix) return '';
  return new Date(unix * 1000).toLocaleString();
}

export function GameDetail({ game, onBack, onRefresh, onClose }: { game: GameSnapshot; onBack: () => void; onRefresh: () => void; onClose?: () => void }) {
  const customization = useCustomizationState();
  const saved = customization.config.visual.rememberScreen ? rememberedDetail.get(game.appId) : undefined;
  const scrollRoot = useRef<HTMLDivElement>(null);
  const [customizing, setCustomizing] = useState(false);
  const [customizingAchievementId, setCustomizingAchievementId] = useState<string | null>(null);
  const [query, setQuery] = useState(saved?.query ?? '');
  const [earnedFilter, setEarnedFilter] = useState<'all' | 'earned' | 'unearned'>(saved?.earned ?? 'all');
  const [tierFilter, setTierFilter] = useState<'all' | 'bronze' | 'silver' | 'gold'>(saved?.tier ?? 'all');
  useLayoutEffect(() => { if (scrollRoot.current && saved) scrollRoot.current.scrollTop = saved.scroll; }, [game.appId]);
  const remember = () => { if (customization.config.visual.rememberScreen) { rememberedDetail.set(game.appId,{ scroll:scrollRoot.current?.scrollTop ?? 0,query,earned:earnedFilter,tier:tierFilter }); if (rememberedDetail.size > 100) rememberedDetail.delete(rememberedDetail.keys().next().value!); } };
  useLayoutEffect(remember,[game.appId,query,earnedFilter,tierFilter]);
  const completion = completionAchievement(game.achievements, game.platinum);
  const rows = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    const visible = game.achievements.filter(a => {
      if (earnedFilter === 'earned' && !a.achieved || earnedFilter === 'unearned' && a.achieved) return false;
      if (tierFilter !== 'all' && (a.achieved ? a.awardedTier ?? a.tier : a.tier) !== tierFilter) return false;
      if (needle && (a.hidden && !a.achieved || !`${a.name} ${a.description}`.toLocaleLowerCase().includes(needle))) return false;
      return true;
    }).filter(a => !completion || customization.config.library.showOriginalPlatinumAchievement || a.id !== completion.id).map(achievement => ({ achievement, platinum: false }));
    if (completion && earnedFilter !== 'unearned' && tierFilter === 'all' && (!needle || `${completion.name} ${completion.description}`.toLocaleLowerCase().includes(needle))) visible.unshift({ achievement: completion, platinum: true });
    return visible;
  }, [game.achievements, completion, query, earnedFilter, tierFilter, customization.config.library.showOriginalPlatinumAchievement]);
  const project = customization.config.projects.entries.find((entry) => entry.appId === game.appId) ?? null;
  const pinned = customization.config.library.pinnedAppIds.includes(game.appId);
  const hidden = customization.config.library.hiddenAppIds.includes(game.appId);
  const definitions = customization.config.library.achievementGroups[String(game.appId)] ?? [];
  const assignedIds = new Set(definitions.flatMap(g => g.achievementIds));
  const sections = definitions.length ? [
    ...definitions.map(g => ({ id:g.id,title:g.title,base:g.kind === 'base',achievements:game.achievements.filter(a => g.achievementIds.includes(a.id)),rows:rows.filter(r => g.achievementIds.includes(r.achievement.id)) })),
    { id:'ungrouped',title:'Ungrouped achievements',base:false,achievements:game.achievements.filter(a => !assignedIds.has(a.id)),rows:rows.filter(r => !assignedIds.has(r.achievement.id)) },
  ].filter(g => g.rows.length) : [{ id:'all',title:null,base:true,achievements:game.achievements,rows }];

  return (
    <div ref={scrollRoot} onScroll={remember} className="st-detail" data-stt-component="game-detail" data-stt-appid={game.appId}>
      <div className="st-detail-header" data-stt-slot="header">
        <button title={message('app.back')} className="st-icon-button" onClick={onBack} aria-label={message('app.back')}>‹</button>
        <div className="st-detail-heading"><GameArtwork appId={game.appId} /><h2>{game.name}<ReleaseYear appId={game.appId} detail /></h2><p>{game.summary.earnedCount}/{game.summary.achievementCount} • {game.summary.completionPercent}%</p></div>
        <div className="st-detail-actions">
          <button className="st-icon-button" title={message(project ? 'project.remove' : 'project.add')} aria-label={message(project ? 'project.remove' : 'project.add')} aria-pressed={!!project} onClick={() => void (project ? customizationService.removeProject(game.appId) : customizationService.addProject(game.appId))}><SheetIcon control="project" /></button>
          <button className="st-icon-button" title={message(pinned ? 'app.unpin' : 'app.pin')} aria-label={message(pinned ? 'app.unpin' : 'app.pin')} aria-pressed={pinned} onClick={() => void customizationService.setPinned(game.appId, !pinned)}><SheetIcon control="pin" /></button>
          <button className="st-icon-button" title={message(hidden ? 'app.unhide' : 'app.hide')} aria-label={message(hidden ? 'app.unhide' : 'app.hide')} onClick={() => void customizationService.setHidden(game.appId, !hidden)}><SheetIcon control={hidden ? 'visible' : 'hidden'} /></button>
          <button className="st-icon-button" title="Customize this game’s artwork and trophy pack" aria-label="Customize this game’s artwork and trophy pack" aria-expanded={customizing} onClick={() => setCustomizing(v => !v)}><SheetIcon control="artwork" /></button>
          <button className="st-icon-button" title="Refresh this game’s achievements" aria-label="Refresh this game’s achievements" onClick={onRefresh}><SheetIcon control="refresh" /></button>
          {onClose && <button title="Close trophies" className="st-icon-button" onClick={onClose} aria-label="Close trophies">×</button>}
        </div>
      </div>

      {project && (
        <div className="stt-project-banner" data-stt-component="trophy-project">
          <TrophyGlyph tier={game.summary.goldCount ? 'gold' : game.summary.silverCount ? 'silver' : 'bronze'} appId={game.appId} size={34} />
          <div><strong>{message('project.active')}</strong><span>{project.targetAchievementIds.length ? message('project.targets', { count: project.targetAchievementIds.length }) : message('project.chooseTargets')}</span></div>
        </div>
      )}

      {customizing && <><GameArtworkSettings appId={game.appId} /><AchievementGroupsSettings game={game} /><GameTrophyOverridePanel game={game} onClose={() => setCustomizing(false)} /></>}
      {game.rarityRevision !== 1 && <div className="st-error">Legacy rarity values are unverified. Use Repair cached rarity in the library; no achievement reimport is needed.</div>}
      <div className="st-detail-filters st-library-tools" aria-label="Achievement filters">
        <div className="st-search-wrap"><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search achievements..." aria-label="Search achievement titles and descriptions" /></div>
        <label className="stt-field">Progress<select value={earnedFilter} onChange={e => setEarnedFilter(e.target.value as typeof earnedFilter)}><option value="all">All achievements</option><option value="earned">Earned only</option><option value="unearned">Unearned only</option></select></label>
        <label className="stt-field">Trophy tier<select value={tierFilter} onChange={e => setTierFilter(e.target.value as typeof tierFilter)}><option value="all">All tiers</option><option value="gold">Gold</option><option value="silver">Silver</option><option value="bronze">Bronze</option></select></label>
      </div>
      {game.platinum.achieved && !completion && earnedFilter !== 'unearned' && tierFilter === 'all' && !query.trim() && (
        <div className="st-platinum-card" data-stt-component="platinum-card">
          <TrophyGlyph tier="platinum" size={34} appId={game.appId} />
          <div><strong>Platinum</strong><span>{formatDate(game.platinum.unlockedAtUnix)}</span><small>The exact finishing achievement was not recorded.</small></div>
        </div>
      )}

      <div className="st-achievement-list" data-stt-slot="achievements">
        {!rows.length && <p className="st-empty">No achievements match these filters.</p>}
        {sections.map(section => <AchievementGroup key={section.id} title={section.title} count={section.achievements.filter(a => a.achieved).length} total={section.achievements.length} rarity={completionRarityLimit(section.achievements,game.rarityRevision === 1)} initiallyOpen={customization.config.visual.groupExpansion === 'all' || customization.config.visual.groupExpansion === 'base' && section.base} showRarity={customization.config.visual.showGroupRarity}>{section.rows.map(({ achievement, platinum }) => {
          const tier = platinum ? 'platinum' : achievement.achieved ? (achievement.awardedTier ?? achievement.tier) : achievement.tier;
          const targeted = project?.targetAchievementIds.includes(achievement.id) ?? false;
          return (
            <div key={`${platinum ? 'platinum:' : ''}${achievement.id}`}>
              <div className={`st-achievement ${achievement.achieved ? 'is-earned' : 'is-locked'}${targeted ? ' is-targeted' : ''}`} data-stt-component="achievement-card" data-stt-achievement={achievement.id} data-stt-tier={tier} data-stt-state={achievement.achieved ? 'earned' : 'locked'}>
                <div className={`st-achievement-icon${achievement.achieved && game.rarityRevision === 1 && achievement.globalUnlockPercent != null ? tier === 'gold' ? ' st-rare-gold' : tier === 'bronze' && customization.config.library.bronzeBorders ? ' st-border-bronze' : tier === 'silver' && customization.config.library.silverBorders ? ' st-border-silver' : '' : ''}`} style={{ width: customization.config.library.achievementSize + 12, height: customization.config.library.achievementSize + 12 }}>{achievement.iconUrl ? <img src={achievement.iconUrl} loading="lazy" alt="" /> : <TrophyGlyph tier={tier} size={26} appId={game.appId} achievementId={achievement.id} />}</div>
                <div className="st-achievement-copy">
                  <strong>{achievement.hidden && !achievement.achieved ? message('achievement.hidden') : achievement.name}{platinum && <span className="st-platinum-label"> · Platinum</span>}</strong>
                  <p>{achievement.hidden && !achievement.achieved ? message('achievement.hiddenDescription') : achievement.description}</p>
                  {achievement.achieved && <small>{formatDate(platinum ? game.platinum.unlockedAtUnix : achievement.unlockedAtUnix)}</small>}
                </div>
                <div className="st-achievement-rarity"><span title="Current global unlock percentage">{game.rarityRevision !== 1 || achievement.globalUnlockPercent == null ? 'Rarity unknown' : `${achievement.globalUnlockPercent.toFixed(1)}%`}</span><TrophyGlyph tier={tier} size={Math.max(56, customization.config.library.achievementSize + 12)} appId={game.appId} achievementId={achievement.id} /></div>
                <div className="st-achievement-actions">
                  {project && !achievement.achieved && <button title={message(targeted ? 'project.targeted' : 'project.target')} className="st-mini-button" onClick={() => void customizationService.setProjectTargets(game.appId, targeted ? project.targetAchievementIds.filter((id) => id !== achievement.id) : [...project.targetAchievementIds, achievement.id])}>{message(targeted ? 'project.targeted' : 'project.target')}</button>}
                  {/* Deprecated per-achievement editor entry point; retain implementation and saved overrides. */}
                  <button hidden tabIndex={-1} className="st-deprecated-icon-editor" onClick={() => setCustomizingAchievementId((id) => id === achievement.id ? null : achievement.id)}>{message('app.icon')}</button>
                </div>
              </div>
              {customizingAchievementId === achievement.id && <AchievementTrophyOverridePanel appId={game.appId} achievement={achievement} tier={tier} onClose={() => setCustomizingAchievementId(null)} />}
            </div>
          );
        })}</AchievementGroup>)}
      </div>
    </div>
  );
}
