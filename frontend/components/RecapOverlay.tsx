import { useEffect, useMemo, useRef, useState } from 'react';
import { buildRecap, type GameSnapshot, type RecapPeriod } from '../../packages/core/src';
import { trophyService } from '../state/service';
import { useCustomizationState } from '../state/customization-hooks';
import { TrophyGlyph } from './TrophyGlyph';
import { SettingSwitch } from './customization/SettingControls';
import { customizationService } from '../state/customization-service';

export function RecapOverlay({ onClose }: { onClose:()=>void }) {
  const { config } = useCustomizationState();
  const period = config.visual.recapPeriod;
  const includeHidden = config.visual.recapIncludeHidden;
  const setPeriod = (recapPeriod:RecapPeriod) => void customizationService.setVisual({recapPeriod});
  const setIncludeHidden = (recapIncludeHidden:boolean) => void customizationService.setVisual({recapIncludeHidden});
  const [games,setGames] = useState<GameSnapshot[]>([]);
  const [loading,setLoading] = useState(true);
  const [missing,setMissing] = useState(0);
  const closeButton = useRef<HTMLButtonElement>(null);
  const hidden = config.library.hiddenAppIds;
  useEffect(() => {
    const previousFocus = closeButton.current?.ownerDocument.activeElement as HTMLElement|null;
    closeButton.current?.focus();
    let cancelled = false, cursor = 0, unavailable = 0;
    const ids = trophyService.getSnapshot().index.games.map(g => g.appId), loaded:GameSnapshot[] = [];
    const worker = async () => { while (!cancelled && cursor < ids.length) { const id = ids[cursor++]; const game = await trophyService.getCachedSnapshot(id); if (game) loaded.push(game); else unavailable++; } };
    void Promise.all(Array.from({ length:4 },worker)).then(() => { if (!cancelled) { setGames(loaded); setMissing(unavailable); setLoading(false); } });
    return () => { cancelled = true; if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);
  const recap = useMemo(() => buildRecap(games.filter(g => includeHidden || !hidden.includes(g.appId)),period), [games,period,includeHidden,hidden]);
  return <div className="st-recap-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}><section className="st-recap-panel" role="dialog" aria-modal="true" aria-label="Trophy recap" onKeyDown={e => {
    if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    if (e.key === 'Tab') { e.stopPropagation(); const container = e.currentTarget as HTMLElement; const controls = Array.from(container.querySelectorAll<HTMLElement>('button:not(:disabled),input,summary,[tabindex="0"]')); const first = controls[0],last = controls[controls.length-1],active = container.ownerDocument.activeElement; if (e.shiftKey && active === first) { e.preventDefault(); last?.focus(); } else if (!e.shiftKey && active === last) { e.preventDefault(); first?.focus(); } }
  }}>
    <header className="st-app-header"><h2>Your trophy recap</h2><button ref={closeButton} className="st-icon-button" title="Close recap" aria-label="Close recap" onClick={onClose}>×</button></header>
    <nav className="st-settings-tabs" aria-label="Recap period">{([['week','Weekly · last 7 days'],['month','Monthly · this month'],['year','Yearly · this year']] as const).map(([value,label]) => <button key={value} className="st-mini-button" aria-pressed={period === value} title={`Show ${label.toLowerCase()}`} onClick={() => setPeriod(value)}>{label}</button>)}</nav>
    <SettingSwitch label="Include hidden games" help="Include your hidden games in this local recap. Nothing is shared online." checked={includeHidden} onChange={setIncludeHidden} />
    {loading ? <p role="status">Reading saved trophy history… No library refresh is running.</p> : <>
      <p>{new Date(recap.start*1000).toLocaleDateString()} – {new Date(recap.end*1000).toLocaleDateString()} · local calendar dates</p>
      <div className="st-recap-stats"><div><strong>{recap.total.toLocaleString()}</strong><span>Trophies earned</span></div><div><strong>{recap.games.length}</strong><span>Games with earned trophies</span></div><div><strong>{recap.activeAchievementDays}</strong><span>Days with achievements</span></div><div><strong>{recap.longestAchievementStreak}</strong><span>Longest achievement-day streak</span></div></div>
      <div className="stt-size-preview">{(['platinum','gold','silver','bronze'] as const).map(tier => <span key={tier}><TrophyGlyph tier={tier} size={34} /> {recap.tiers[tier].toLocaleString()}</span>)}</div>
      <h3>Top games by achievements earned</h3>{recap.games.length ? recap.games.slice(0,10).map(g => <div className="st-settings-library-row" key={g.appId}><span>{g.name}</span><span>{g.achievements} achievements{g.platinums ? ` · ${g.platinums} Platinum` : ''}</span></div>) : <p>No dated unlocks in this period.</p>}
      {recap.rarest && <p><strong>Rarest dated achievement:</strong> {recap.rarest.name} · {recap.rarest.game} · {recap.rarest.percent}% current global rarity</p>}
      <details><summary>Coverage & unavailable statistics</summary><p>Based on saved unlock dates, not playtime. {missing} game records could not be read. {recap.unknownDates} earned achievements have no date and cannot be assigned to a period.</p><p>Play hours, sessions, single/multiplayer splits, controller/device splits, genre playtime, subscription activity and community comparisons are not available from this trophy history. Achievement streaks are not gaming streaks. These figures are not a replacement for Steam Replay or PlayStation Wrap-Up.</p></details>
    </>}
  </section></div>;
}
