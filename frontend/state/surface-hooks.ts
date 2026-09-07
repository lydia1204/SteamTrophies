import { useEffect, useState } from 'react';
import { onSteamSurfaceModeChanged, readSteamSurfaceMode, type MillenniumSurfaceMode } from '../runtime/steam-ui';

export function useMillenniumSurfaceMode(): MillenniumSurfaceMode {
  const [mode, setMode] = useState<MillenniumSurfaceMode>('unknown');
  useEffect(() => {
    let active = true;
    void readSteamSurfaceMode().then((next) => { if (active) setMode(next); }).catch(() => {});
    const unregister = onSteamSurfaceModeChanged((next) => { if (active) setMode(next); });
    return () => { active = false; unregister(); };
  }, []);
  return mode;
}
