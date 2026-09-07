export interface StorageEntry {
  path: string;
  bytes: number;
  modifiedAtUnix: number;
}

/**
 * Capability-based storage boundary. Runtime implementations must remain inside
 * the plugin's data root. The repository never receives absolute filesystem paths.
 */
export interface StorageDriver {
  readText(relativePath: string): Promise<string | null>;
  writeTextAtomic(relativePath: string, text: string): Promise<void>;
  appendText(relativePath: string, text: string): Promise<void>;
  remove(relativePath: string): Promise<void>;
  list(prefix: string): Promise<StorageEntry[]>;
}
