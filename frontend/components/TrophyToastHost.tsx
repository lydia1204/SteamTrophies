import type { CSSProperties } from 'react';
import { useCustomizationState } from '../state/customization-hooks';
import { useTrophyToasts } from '../state/notification-hooks';
import { notificationService } from '../state/notification-service';
import { customizationService } from '../state/customization-service';
import { useMillenniumSurfaceMode } from '../state/surface-hooks';
import { TrophyGlyph } from './TrophyGlyph';

export function TrophyToastHost() {
  const toasts = useTrophyToasts();
  const customization = useCustomizationState();
  const mode = useMillenniumSurfaceMode();
  if (!toasts.length) return null;
  const surface = mode === 'big_picture' ? 'big_picture' : 'desktop';
  const style = customizationService.getCssVariables(surface) as CSSProperties;
  return (
    <div
      className="stt-toast-host"
      data-stt-root=""
      data-stt-surface={surface}
      data-stt-component="toast-host"
      data-position={customization.config.notifications.position}
      style={style}
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <button key={toast.id} className={`stt-toast stt-toast-${toast.tier}`} data-stt-component="trophy-toast" data-stt-tier={toast.tier} onClick={() => notificationService.dismiss(toast.id)}>
          <div className="stt-toast-icon">
            {toast.iconUrl ? <img src={toast.iconUrl} alt="" /> : <TrophyGlyph tier={toast.tier} appId={toast.appId || undefined} achievementId={toast.achievementId} size={44} />}
          </div>
          <div className="stt-toast-copy"><span>{toast.gameName}</span><strong>{toast.title}</strong><small>{toast.description}</small></div>
          <TrophyGlyph tier={toast.tier} appId={toast.appId || undefined} achievementId={toast.achievementId} size={30} />
        </button>
      ))}
    </div>
  );
}
