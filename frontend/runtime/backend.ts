declare const backend: {
  readSettingsJson(): Promise<string | null>;
  writeSettingsJson(json: string): Promise<boolean>;
  readCustomizationJson(): Promise<string | null>;
  writeCustomizationJson(json: string): Promise<boolean>;
  readDiscoveryJson(): Promise<string | null>;
  writeDiscoveryJson(json: string): Promise<boolean>;
  readIndexJson(): Promise<string | null>;
  readGameJson(appid: number): Promise<string | null>;
  listGameAppIds(): Promise<number[]>;
  quarantineIndex(): Promise<boolean>;
  quarantineGame(appid: number): Promise<boolean>;
  writeIndexJson(json: string): Promise<boolean>;
  writeGameJson(appid: number, json: string): Promise<boolean>;
  appendEvents(month: string, lines: string): Promise<boolean>;
  getStorageStats(): Promise<{ root: string; files: number; bytes: number; free_bytes?: number }>;
  getTrophyIconResource(): Promise<string>;
  listInstalledTrophyPacksJson(): Promise<string>;
  importTrophyPackDirectoryJson(sourcePath: string, replaceExisting: boolean): Promise<string>;
  readTrophyPackAssetDataUrl(packId: string, relativePath: string): Promise<string>;
  readBundledTrophyAssetDataUrl(relativePath: string): Promise<string>;
  getInstalledTrophyPackDirectory(packId: string): Promise<string>;
  removeInstalledTrophyPack(packId: string): Promise<boolean>;
};

export const trophyBackend = backend;
