import type { TrophyProjectStateV1, TrophyProjectV1 } from './types';

export const MAX_TROPHY_PROJECTS = 3;
export const DEFAULT_PROJECT_STATE: TrophyProjectStateV1 = Object.freeze({ maxActive: MAX_TROPHY_PROJECTS, entries: [] });

export function validateProjectState(value: unknown): TrophyProjectStateV1 {
  if (!value || typeof value !== 'object') return structuredClone(DEFAULT_PROJECT_STATE);
  const raw = value as Partial<TrophyProjectStateV1>;
  const maxActive = Number.isSafeInteger(raw.maxActive) ? Math.max(1, Math.min(6, raw.maxActive!)) : MAX_TROPHY_PROJECTS;
  const entries: TrophyProjectV1[] = [];
  const seen = new Set<number>();
  for (const candidate of Array.isArray(raw.entries) ? raw.entries : []) {
    if (!candidate || typeof candidate !== 'object') continue;
    const appId = Number((candidate as TrophyProjectV1).appId);
    if (!Number.isSafeInteger(appId) || appId <= 0 || seen.has(appId)) continue;
    const createdAtUnix = Number((candidate as TrophyProjectV1).createdAtUnix);
    const rawTargets = Array.isArray((candidate as TrophyProjectV1).targetAchievementIds) ? (candidate as TrophyProjectV1).targetAchievementIds : [];
    const targetAchievementIds = [...new Set(rawTargets.filter((id) => typeof id === 'string' && id.length > 0 && id.length <= 256))].slice(0, 20);
    const note = typeof (candidate as TrophyProjectV1).note === 'string' ? (candidate as TrophyProjectV1).note!.slice(0, 280) : undefined;
    entries.push({ appId, createdAtUnix: Number.isFinite(createdAtUnix) && createdAtUnix > 0 ? Math.floor(createdAtUnix) : 0, targetAchievementIds, note });
    seen.add(appId);
    if (entries.length >= maxActive) break;
  }
  return { maxActive, entries };
}

export function addTrophyProject(state: TrophyProjectStateV1, appId: number, nowUnix: number): TrophyProjectStateV1 {
  if (!Number.isSafeInteger(appId) || appId <= 0) throw new Error('Invalid trophy project app id.');
  const entries = state.entries.filter((entry) => entry.appId !== appId);
  entries.unshift({ appId, createdAtUnix: Math.max(0, Math.floor(nowUnix)), targetAchievementIds: [] });
  return { ...state, entries: entries.slice(0, state.maxActive) };
}

export function removeTrophyProject(state: TrophyProjectStateV1, appId: number): TrophyProjectStateV1 {
  return { ...state, entries: state.entries.filter((entry) => entry.appId !== appId) };
}

export function setProjectTargets(state: TrophyProjectStateV1, appId: number, achievementIds: readonly string[]): TrophyProjectStateV1 {
  const ids = [...new Set(achievementIds.filter((id) => id.length > 0 && id.length <= 256))].slice(0, 20);
  return { ...state, entries: state.entries.map((entry) => entry.appId === appId ? { ...entry, targetAchievementIds: ids } : entry) };
}
