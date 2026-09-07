import { GameSnapshot, LibraryIndex, TrophyEvent } from '../../core/src/model';

export interface BackupBundleV1 {
  format: 'steam-trophies-backup';
  version: 1;
  createdAtUnix: number;
  appVersion: string;
  index: LibraryIndex;
  games: GameSnapshot[];
  events: TrophyEvent[];
  /** Disposable image/cache data is deliberately excluded. */
  excludes: ['asset-cache', 'temporary-refresh-state', 'logs'];
}

export function createBackupBundle(input: Omit<BackupBundleV1, 'format' | 'version' | 'excludes'>): BackupBundleV1 {
  return {
    format: 'steam-trophies-backup',
    version: 1,
    ...input,
    excludes: ['asset-cache', 'temporary-refresh-state', 'logs'],
  };
}

export function validateBackupBundle(value: unknown): BackupBundleV1 {
  if (!value || typeof value !== 'object') throw new Error('Backup must be an object.');
  const v = value as Partial<BackupBundleV1>;
  if (v.format !== 'steam-trophies-backup' || v.version !== 1) throw new Error('Unsupported backup format.');
  if (!v.index || !Array.isArray(v.games) || !Array.isArray(v.events)) throw new Error('Incomplete backup.');
  if (v.games.length > 100_000 || v.events.length > 5_000_000) throw new Error('Backup exceeds safety limits.');
  return v as BackupBundleV1;
}
