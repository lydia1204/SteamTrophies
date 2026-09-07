import { useSyncExternalStore } from 'react';
import { customizationService } from './customization-service';

export function useCustomizationState() {
  return useSyncExternalStore(customizationService.subscribe, customizationService.getSnapshot, customizationService.getSnapshot);
}
