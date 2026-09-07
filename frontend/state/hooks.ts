import { useSyncExternalStore } from 'react';
import { trophyService } from './service';

export function useTrophyState() {
  return useSyncExternalStore(trophyService.subscribe, trophyService.getSnapshot, trophyService.getSnapshot);
}
