import { definePlugin, ErrorBoundary } from 'millennium';
import { useEffect } from 'react';
import { BigPictureTrophyApp } from './components/BigPictureTrophyApp';
import { TrophyApp } from './components/TrophyApp';
import { TrophyGlyph } from './components/TrophyGlyph';
import { TrophyToolbarButton } from './components/ToolbarButton';
import { installNativeToasts } from './runtime/native-toasts';
import { customizationService } from './state/customization-service';
import { trophyService } from './state/service';
import { notificationService } from './state/notification-service';
import { useMillenniumSurfaceMode } from './state/surface-hooks';
import { trophyStyles } from './styles/trophies.generated';
import { closeTrophyOverlay, closeFromOutsidePointer } from './components/Overlay';
import { installHeaderButton } from './runtime/header';

let bootPromise: Promise<void> | null = null;
let removeNativeToasts: (() => void) | null = null;
function ensureBooted(): Promise<void> {
  return (bootPromise ??= Promise.all([trophyService.boot(), customizationService.boot()]).then(() => {
    try { removeNativeToasts = installNativeToasts(); }
    catch (error) { notificationService.recordDelivery(`Native notification setup failed: ${String(error)}`); }
    notificationService.boot();
  }));
}

function PluginPanel() {
  useEffect(() => { void ensureBooted(); return () => {}; }, []);
  const mode = useMillenniumSurfaceMode();
  return mode === 'big_picture' ? <BigPictureTrophyApp /> : <TrophyApp />;
}

/** @ffi */
export const hookedToolbar = { TrophyButton: TrophyToolbarButton };

/** Big Picture insertion target. Keep Steam hook code tiny: mount this shell and nothing else. */
export const hookedBigPicture = { TrophyApp: () => <BigPictureTrophyApp /> };

/** @ffi */
export function achievementEventHint(appId: number): boolean {
  if (!Number.isSafeInteger(appId) || appId <= 0) return false;
  trophyService.requestRefresh(appId);
  return true;
}

/** @ffi */
export function outsideSteamPointerDown(): boolean { closeFromOutsidePointer(); return true; }

void ensureBooted();
const removeHeaderButton = installHeaderButton();

export default definePlugin(() => ({
  title: 'Steam Trophies',
  icon: <TrophyGlyph tier="platinum" size={18} />,
  content: <ErrorBoundary><style>{trophyStyles}</style><PluginPanel /></ErrorBoundary>,
  onDismount() {
    removeHeaderButton();
    closeTrophyOverlay();
    notificationService.dispose();
    removeNativeToasts?.(); removeNativeToasts = null;
    trophyService.dispose();
    customizationService.dispose?.();
    bootPromise = null;
  },
}));
