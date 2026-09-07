import { safeRelativeSegment } from '../../core/src/security';

export const STORAGE_SCHEMA_VERSION = 1;
export const INDEX_PATH = 'state/index.v1.json';
export const SETTINGS_PATH = 'state/settings.v1.json';
export const ASSET_INDEX_PATH = 'cache/assets/index.v1.json';

export function gamePath(appId: number): string {
  if (!Number.isSafeInteger(appId) || appId <= 0) throw new Error('Invalid app id.');
  return `state/games/${appId}.v1.json`;
}

export function monthlyEventPath(unix: number): string {
  const date = new Date(unix * 1000);
  if (!Number.isFinite(date.getTime())) throw new Error('Invalid event timestamp.');
  return `state/events/${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}.ndjson`;
}

export function assetPath(contentHash: string, extension = 'bin'): string {
  return `cache/assets/${safeRelativeSegment(contentHash)}.${safeRelativeSegment(extension)}`;
}
