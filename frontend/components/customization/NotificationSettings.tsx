import type { TrophyTier } from '../../../packages/core/src';
import { useCustomizationState } from '../../state/customization-hooks';
import { customizationService } from '../../state/customization-service';
import { notificationService } from '../../state/notification-service';
import { useSyncExternalStore } from 'react';

export function NotificationSettings() {
  const state = useCustomizationState();
  const n = state.config.notifications;
  const delivery = useSyncExternalStore(notificationService.subscribe, notificationService.getDeliveryHistory, notificationService.getDeliveryHistory);
  return (
    <section className="stt-settings-section" data-stt-component="notification-settings">
      <header><div><h3>Trophy notifications</h3><p>SteamTrophies owns its toast presentation and sounds without replacing Steam's global notification system.</p></div></header>
      <div className="stt-settings-grid">
        <label className="stt-field"><span>Sound pack (independent of trophy artwork)</span><select value={n.soundPackId ?? ''} onChange={e => void customizationService.setNotifications({ soundPackId: e.target.value || null })}><option value="">Follow trophy pack</option>{state.packs.filter(pack => Object.keys(pack.manifest.sounds ?? {}).length).map(pack => <option key={pack.manifest.id} value={pack.manifest.id}>{pack.manifest.name}</option>)}</select></label>
        <label className="stt-field"><span>Toast animation</span><select value={n.animation} onChange={e => void customizationService.setNotifications({ animation: e.target.value as typeof n.animation })}>{(['slide','fade','rise','zoom','bounce','flip','none'] as const).map(value => <option key={value} value={value}>{value[0].toUpperCase() + value.slice(1)}</option>)}</select></label>
        <p className="st-settings-help">Position applies inside the trophy window. Outside it, Steam places native notifications using its own notification settings. Packs support WAV, OGG and MP3 sounds.</p>
        <label className="stt-toggle"><input type="checkbox" checked={n.enabled} onChange={(e) => void customizationService.setNotifications({ enabled: e.currentTarget.checked })} /><span>Show trophy toasts</span></label>
        <label className="stt-toggle"><input type="checkbox" checked={n.soundEnabled} onChange={(e) => void customizationService.setNotifications({ soundEnabled: e.currentTarget.checked })} /><span>Play pack sounds</span></label>
        <label className="stt-toggle"><input type="checkbox" checked={n.platinumCelebration} onChange={(e) => void customizationService.setNotifications({ platinumCelebration: e.currentTarget.checked })} /><span>Platinum celebration</span></label>
        <label className="stt-toggle"><input type="checkbox" checked={n.showAchievementArtwork} onChange={(e) => void customizationService.setNotifications({ showAchievementArtwork: e.currentTarget.checked })} /><span>Show achievement artwork</span></label>
        <label className="stt-field"><span>Toast position</span><select value={n.position} onChange={(e) => void customizationService.setNotifications({ position: e.currentTarget.value as typeof n.position })}><option value="bottom_right">Bottom right</option><option value="bottom_left">Bottom left</option><option value="top_right">Top right</option><option value="top_left">Top left</option></select></label>
        <label className="stt-field"><span>Duration • {(n.durationMs / 1000).toFixed(1)}s</span><input type="range" min="1500" max="15000" step="250" value={n.durationMs} onChange={(e) => void customizationService.setNotifications({ durationMs: Number(e.currentTarget.value) })} /></label>
        <label className="stt-field"><span>Sound volume • {Math.round(n.volume * 100)}%</span><input type="range" min="0" max="1" step="0.05" value={n.volume} onChange={(e) => void customizationService.setNotifications({ volume: Number(e.currentTarget.value) })} /></label>
        <label className="stt-field"><span>Maximum visible toasts • {n.maxVisible}</span><input type="range" min="1" max="6" step="1" value={n.maxVisible} onChange={(e) => void customizationService.setNotifications({ maxVisible: Number(e.currentTarget.value) })} /></label>
        <label className="stt-field"><span>Sound burst cooldown • {n.audioCooldownMs} ms</span><input type="range" min="0" max="3000" step="50" value={n.audioCooldownMs} onChange={(e) => void customizationService.setNotifications({ audioCooldownMs: Number(e.currentTarget.value) })} /></label>
        <label className="stt-toggle"><input type="checkbox" checked={n.quietHours.enabled} onChange={(e) => void customizationService.setNotifications({ quietHours: { ...n.quietHours, enabled: e.currentTarget.checked } })} /><span>Quiet hours</span></label>
        {n.quietHours.enabled && <>
          <label className="stt-field"><span>Quiet from</span><input type="time" value={minuteToTime(n.quietHours.startMinute)} onChange={(e) => void customizationService.setNotifications({ quietHours: { ...n.quietHours, startMinute: timeToMinute(e.currentTarget.value) } })} /></label>
          <label className="stt-field"><span>Quiet until</span><input type="time" value={minuteToTime(n.quietHours.endMinute)} onChange={(e) => void customizationService.setNotifications({ quietHours: { ...n.quietHours, endMinute: timeToMinute(e.currentTarget.value) } })} /></label>
        </>}
      </div>
      <div className="stt-test-toast-row">{(['bronze','silver','gold','platinum'] as TrophyTier[]).map((tier) => <button key={tier} className="st-mini-button" onClick={() => void notificationService.test(tier)}>Test {tier}</button>)}</div>
      <button className="st-mini-button" onClick={() => notificationService.scheduleNativeTest()}>Test outside window in 10 seconds</button>
      <p className="st-settings-help">Use the delayed test, close Trophies, and return to your game. This changes no achievements. In-game visuals require a working Steam overlay.</p>
      <details className="st-delivery-diagnostics"><summary>Recent notification delivery</summary>{delivery.length ? delivery.map((line, index) => <p key={`${index}-${line}`}>{line}</p>) : <p>No delivery attempts since this startup.</p>}</details>
    </section>
  );
}

function minuteToTime(minute: number): string {
  const value = Math.max(0, Math.min(1439, Math.floor(minute)));
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`;
}

function timeToMinute(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return 0;
  return Math.max(0, Math.min(1439, Number(match[1]) * 60 + Number(match[2])));
}
