import { useSyncExternalStore } from 'react';
import { notificationService } from './notification-service';

export function useTrophyToasts() {
  return useSyncExternalStore(notificationService.subscribe, notificationService.getSnapshot, notificationService.getSnapshot);
}
