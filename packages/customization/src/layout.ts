import type { LayoutStateV1, SurfaceKind, SurfaceLayoutV1, WidgetDefinition } from './types';

export const DEFAULT_WIDGETS: readonly WidgetDefinition[] = Object.freeze([
  { id: 'profileSummary', title: 'Trophy Summary', allowedSurfaces: ['desktop', 'big_picture', 'deck'], defaultVisible: true },
  { id: 'pinnedProjects', title: 'Trophy Projects', allowedSurfaces: ['desktop', 'big_picture', 'deck'], defaultVisible: true },
  { id: 'nearCompletion', title: 'Nearly Complete', allowedSurfaces: ['desktop', 'big_picture', 'deck'], defaultVisible: true },
  { id: 'recentTrophies', title: 'Recent Trophies', allowedSurfaces: ['desktop', 'big_picture', 'deck'], defaultVisible: true },
  { id: 'completedGames', title: 'Completed Games', allowedSurfaces: ['desktop', 'big_picture', 'deck'], defaultVisible: true },
  { id: 'allGames', title: 'All Trophy Games', allowedSurfaces: ['big_picture', 'deck'], defaultVisible: true },
  { id: 'rarestTrophies', title: 'Rarest Trophies', allowedSurfaces: ['desktop', 'big_picture'], defaultVisible: false },
  { id: 'friends', title: 'Friends', allowedSurfaces: ['desktop', 'big_picture'], defaultVisible: false },
]);

function defaultsFor(surface: SurfaceKind): SurfaceLayoutV1 {
  const allowed = DEFAULT_WIDGETS.filter((w) => w.allowedSurfaces.includes(surface));
  return { order: allowed.map((w) => w.id), hidden: allowed.filter((w) => !w.defaultVisible).map((w) => w.id) };
}

export const DEFAULT_LAYOUT_STATE: LayoutStateV1 = Object.freeze({
  version: 1,
  surfaces: {
    desktop: defaultsFor('desktop'),
    big_picture: defaultsFor('big_picture'),
    deck: defaultsFor('deck'),
  },
});

export function validateLayoutState(value: unknown, registry: readonly WidgetDefinition[] = DEFAULT_WIDGETS): LayoutStateV1 {
  if (!value || typeof value !== 'object' || (value as Partial<LayoutStateV1>).version !== 1) return structuredClone(DEFAULT_LAYOUT_STATE);
  const input = value as LayoutStateV1;
  return {
    version: 1,
    surfaces: {
      desktop: validateSurface('desktop', input.surfaces?.desktop, registry),
      big_picture: validateSurface('big_picture', input.surfaces?.big_picture, registry),
      deck: validateSurface('deck', input.surfaces?.deck, registry),
    },
  };
}

function validateSurface(surface: SurfaceKind, value: SurfaceLayoutV1 | undefined, registry: readonly WidgetDefinition[]): SurfaceLayoutV1 {
  const allowed = registry.filter((w) => w.allowedSurfaces.includes(surface)).map((w) => w.id);
  const allowedSet = new Set(allowed);
  const seen = new Set<string>();
  const order: string[] = [];
  for (const id of value?.order ?? []) if (allowedSet.has(id) && !seen.has(id)) { seen.add(id); order.push(id); }
  for (const id of allowed) if (!seen.has(id)) order.push(id);
  const hidden = [...new Set((value?.hidden ?? []).filter((id) => allowedSet.has(id)))];
  return { order, hidden };
}

export function reorderWidget(state: LayoutStateV1, surface: SurfaceKind, widgetId: string, toIndex: number): LayoutStateV1 {
  const current = state.surfaces[surface];
  const from = current.order.indexOf(widgetId);
  if (from < 0) return state;
  const order = current.order.slice();
  order.splice(from, 1);
  order.splice(Math.max(0, Math.min(toIndex, order.length)), 0, widgetId);
  return { ...state, surfaces: { ...state.surfaces, [surface]: { ...current, order } } };
}

export function setWidgetVisible(state: LayoutStateV1, surface: SurfaceKind, widgetId: string, visible: boolean): LayoutStateV1 {
  const current = state.surfaces[surface];
  if (!current.order.includes(widgetId)) return state;
  const hidden = new Set(current.hidden);
  if (visible) hidden.delete(widgetId); else hidden.add(widgetId);
  return { ...state, surfaces: { ...state.surfaces, [surface]: { ...current, hidden: [...hidden] } } };
}

export function moveWidgetBy(state: LayoutStateV1, surface: SurfaceKind, widgetId: string, delta: number): LayoutStateV1 {
  const index = state.surfaces[surface].order.indexOf(widgetId);
  if (index < 0 || !Number.isFinite(delta)) return state;
  return reorderWidget(state, surface, widgetId, index + Math.trunc(delta));
}

export function resetSurfaceLayout(state: LayoutStateV1, surface: SurfaceKind): LayoutStateV1 {
  return { ...state, surfaces: { ...state.surfaces, [surface]: structuredClone(DEFAULT_LAYOUT_STATE.surfaces[surface]) } };
}
