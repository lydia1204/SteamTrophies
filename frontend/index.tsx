import { definePlugin, ErrorBoundary } from 'millennium';
import { useEffect } from 'react';
import { BigPictureTrophyApp } from './components/BigPictureTrophyApp';
import { TrophyApp } from './components/TrophyApp';
import { TrophyGlyph } from './components/TrophyGlyph';
import { TrophyToolbarButton } from './components/ToolbarButton';
import { TrophyToastHost } from './components/TrophyToastHost';
import { customizationService } from './state/customization-service';
import { trophyService } from './state/service';
import { notificationService } from './state/notification-service';
import { useMillenniumSurfaceMode } from './state/surface-hooks';
import './styles/trophies.css';

let bootPromise: Promise<void> | null = null;
function ensureBooted(): Promise<void> {
  return (bootPromise ??= Promise.all([trophyService.boot(), customizationService.boot()]).then(() => { notificationService.boot(); }));
}

function PluginPanel() {
  useEffect(() => { void ensureBooted(); return () => {}; }, []);
  const mode = useMillenniumSurfaceMode();
  return mode === 'big_picture' ? <BigPictureTrophyApp /> : <TrophyApp />;
}

/** Patch target exported for the Lua hooking layer once the current Steam header chunk is verified. */
export const hookedToolbar = { TrophyButton: () => <TrophyToolbarButton /> };

/** Big Picture insertion target. Keep Steam hook code tiny: mount this shell and nothing else. */
export const hookedBigPicture = { TrophyApp: () => <BigPictureTrophyApp /> };

/** @ffi */
export function achievementEventHint(appId: number): boolean {
  if (!Number.isSafeInteger(appId) || appId <= 0) return false;
  trophyService.requestRefresh(appId);
  return true;
}

void ensureBooted();

export default definePlugin(() => ({
  title: 'Steam Trophies',
  icon: <TrophyGlyph tier="platinum" size={18} />,
  content: <ErrorBoundary><PluginPanel /><TrophyToastHost /></ErrorBoundary>,
  onDismount() {
    notificationService.dispose();
    trophyService.dispose();
    customizationService.dispose?.();
    bootPromise = null;
  },
}));
