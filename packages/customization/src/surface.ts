import type { SurfaceKind } from './types';

export interface SurfaceCapabilities {
  surface: SurfaceKind;
  mouse: boolean;
  touch: boolean;
  controller: boolean;
  hover: boolean;
  nativeModal: boolean;
  filePicker: boolean;
  quickAccess: boolean;
  dragLayout: boolean;
  controllerReorder: boolean;
  animatedBackgrounds: boolean;
}

export const SURFACE_CAPABILITIES: Readonly<Record<SurfaceKind, SurfaceCapabilities>> = Object.freeze({
  desktop: { surface: 'desktop', mouse: true, touch: false, controller: false, hover: true, nativeModal: true, filePicker: true, quickAccess: false, dragLayout: true, controllerReorder: false, animatedBackgrounds: true },
  big_picture: { surface: 'big_picture', mouse: true, touch: false, controller: true, hover: false, nativeModal: true, filePicker: true, quickAccess: true, dragLayout: false, controllerReorder: true, animatedBackgrounds: true },
  deck: { surface: 'deck', mouse: false, touch: true, controller: true, hover: false, nativeModal: true, filePicker: false, quickAccess: true, dragLayout: false, controllerReorder: true, animatedBackgrounds: false },
});

/**
 * Intentionally keeps raw Steam EUIMode values out of shared code. The current public docs expose
 * GetUIMode/RegisterForUIModeChanged but do not document enum member values. Runtime shells must map
 * the verified enum they import from their own Millennium/Decky SDK to one of these stable surfaces.
 */
export interface SurfaceClassifier<TRuntimeMode> {
  classify(mode: TRuntimeMode): SurfaceKind;
}
