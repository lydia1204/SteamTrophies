import { toaster, replacePatch, callOriginal, ErrorBoundary } from 'millennium';
import { notificationService, type TrophyToastModel } from '../state/notification-service';
import { customizationService } from '../state/customization-service';
import { TrophyGlyph } from '../components/TrophyGlyph';
import { trophyStyles } from '../styles/trophies.generated';
import { isTrophyPopupOpen } from './popup-focus';
import { useEffect, type CSSProperties } from 'react';
import { TROPHY_TOAST_OWNER, isTrophyNotification, sendTrophyNotification, routeTrophyToOverlay, removeTrophyNotification } from './native-toast-compat';

function NativeTrophyToast({ toast, location }: { toast: TrophyToastModel; location: number }) {
  const config = customizationService.getSnapshot().config;
  useEffect(() => { notificationService.markPresented(toast.id); notificationService.recordDelivery(`${toast.title}: renderer mounted (Steam location ${location})`); }, [toast.id, location]);
  return <div data-stt-root="" data-stt-component="native-trophy-toast" data-animation={config.notifications.animation} data-stt-reduced-motion={config.accessibility.reducedMotion} style={customizationService.getCssVariables('desktop') as CSSProperties}>
    <style>{trophyStyles}</style>
    <div className={`stt-toast stt-toast-${toast.tier}`} role="status" onClick={() => notificationService.dismiss(toast.id)}>
      <div className="stt-toast-icon">{toast.iconUrl ? <img src={toast.iconUrl} alt="" /> : <TrophyGlyph tier={toast.tier} size={44} appId={toast.appId || undefined} achievementId={toast.achievementId} />}</div>
      <div className="stt-toast-copy"><span>{toast.gameName}</span><strong>{toast.title}</strong><small>{toast.description}</small></div>
      <TrophyGlyph tier={toast.tier} size={30} appId={toast.appId || undefined} achievementId={toast.achievementId} />
    </div>
  </div>;
}

/** Native Steam notifications stay above Store/Community BrowserViews. Popup previews render locally. */
export function installNativeToasts(): () => void {
  const patches: { unpatch(): void }[] = [];
  // Reuse the SDK's existing trampoline. Injecting another would replace other plugins' renderer.
  const renderer = (toaster as unknown as { toastPatch?: { object?: { component?: unknown } } }).toastPatch?.object;
  const store = (window as unknown as { NotificationStore?: any }).NotificationStore;
  if (typeof renderer?.component === 'function') {
    patches.push(replacePatch(renderer, 'component', (args: any[]) => {
      const notifications = args[0]?.group?.notifications;
      if (!Array.isArray(notifications) || !notifications.length || !notifications.every(isTrophyNotification)) return callOriginal;
      return notifications.map(notification => <ErrorBoundary key={notification.data.sttModel.id}><NativeTrophyToast toast={notification.data.sttModel} location={args[0].location} /></ErrorBoundary>);
    }));
  } else notificationService.recordDelivery('Native renderer unavailable in this Steam/Millennium build');
  // The SDK's playSound:false is not forwarded by this version. Suppress only our duplicate native cue.
  if (typeof store?.PlayNotificationSound === 'function') {
    try { patches.push(replacePatch(store, 'PlayNotificationSound', (args: any[]) => isTrophyNotification(args[0]) ? undefined : callOriginal)); }
    catch { notificationService.recordDelivery('Steam native sound method is protected; custom sound remains enabled'); }
  }
  notificationService.setPresenter(toast => {
    if (isTrophyPopupOpen() && !toast.nativePreview) { notificationService.recordDelivery(`${toast.title}: trophy-window preview`); return undefined; }
    const config = customizationService.getSnapshot().config;
    const data = {
      sttOwner: TROPHY_TOAST_OWNER, sttModel: toast,
      title: toast.gameName,
      body: <NativeTrophyToast toast={toast} location={-1} />,
      duration: config.notifications.durationMs, sound: 0, playSound: false, showToast: true, showNewIndicator: false,
      onClick: () => notificationService.dismiss(toast.id),
    };
    const dismissTray = sendTrophyNotification(store, data);
    const route = routeTrophyToOverlay(store, toast.id, toast.appId, !!toast.nativePreview);
    notificationService.recordDelivery(route.appId ? `${toast.title}: queued for game overlay ${route.appId}` : route.entry ? `${toast.title}: queued for native desktop window (no matching game overlay)` : `${toast.title}: native request sent; Steam did not expose a queued toast`);
    return () => { removeTrophyNotification(store, route.entry, route.appId); dismissTray(); };
  });
  return () => { notificationService.setPresenter(null); for (const patch of patches.reverse()) patch.unpatch(); };
}
