import {
  addTrophyProject,
  BUILTIN_PACKS,
  compileThemeCssVariables,
  DEFAULT_CUSTOMIZATION_STATE,
  InstalledTrophyPack,
  listPackTrophyResources,
  mergePackCatalog,
  moveWidgetBy,
  removePackReferences,
  removeTrophyProject,
  resetSurfaceLayout,
  resolveTheme,
  ResolvedTrophyAsset,
  resolveTrophyAsset,
  resolveTrophyAssetCandidates,
  resolveToastSoundCandidates,
  setAchievementOverride,
  setAppHidden,
  setAppPinned,
  setAppTracked,
  setGamePackOverride,
  setGlobalPack,
  setProjectTargets,
  setTierOverride,
  setWidgetVisible,
  SurfaceKind,
  TrophyAssetRef,
  TrophyPackResourceKey,
  validateCustomizationState,
  validateNotificationPreferences,
  validatePackManifest,
} from '../../packages/customization/src';
import type { TrophyTier } from '../../packages/core/src';
import { trophyBackend } from '../runtime/backend';

export interface CustomizationRuntimeState {
  ready: boolean;
  config: typeof DEFAULT_CUSTOMIZATION_STATE;
  packs: InstalledTrophyPack[];
  error: string | null;
}

type Listener = () => void;

export class CustomizationService {
  private state: CustomizationRuntimeState = { ready: false, config: DEFAULT_CUSTOMIZATION_STATE, packs: BUILTIN_PACKS, error: null };
  private readonly listeners = new Set<Listener>();
  private readonly assetCache = new Map<string, Promise<string>>();
  private bootPromise: Promise<void> | null = null;

  getSnapshot = (): CustomizationRuntimeState => this.state;
  subscribe = (listener: Listener): (() => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };

  boot(): Promise<void> { return (this.bootPromise ??= this.bootNow()); }

  dispose(): void {
    this.assetCache.clear();
    this.bootPromise = null;
  }

  private async bootNow(): Promise<void> {
    let config = DEFAULT_CUSTOMIZATION_STATE;
    try {
      const raw = await trophyBackend.readCustomizationJson();
      if (raw) {
        const parsed = JSON.parse(raw) as { version?: unknown };
        config = validateCustomizationState(parsed);
        // Pass 3 migration is intentionally eager and atomic through the existing backend writer.
        if (parsed.version !== config.version) await trophyBackend.writeCustomizationJson(JSON.stringify(config));
      }
    } catch (error) {
      console.warn('[SteamTrophies] invalid customization state; using defaults', error);
    }
    let packs = BUILTIN_PACKS;
    try {
      const raw = await trophyBackend.listInstalledTrophyPacksJson();
      const values = JSON.parse(raw) as InstalledTrophyPack[];
      const sanitized = values.map((pack) => ({ ...pack, source: 'user' as const, manifest: validatePackManifest(pack.manifest, 'user') }));
      packs = mergePackCatalog(sanitized);
    } catch (error) {
      console.warn('[SteamTrophies] user pack catalog unavailable', error);
    }
    this.state = { ready: true, config, packs, error: null };
    this.emit();
  }

  async importPackDirectory(path: string, replaceExisting = true): Promise<InstalledTrophyPack> {
    try {
      const raw = await trophyBackend.importTrophyPackDirectoryJson(path, replaceExisting);
      const imported = JSON.parse(raw) as InstalledTrophyPack;
      imported.manifest = validatePackManifest(imported.manifest, 'user');
      await this.reloadPacks();
      this.assetCache.clear();
      this.state = { ...this.state, error: null };
      this.emit();
      return imported;
    } catch (error) {
      this.setError(error);
      throw error;
    }
  }

  async removePack(packId: string): Promise<void> {
    if (packId.startsWith('builtin.')) throw new Error('Built-in packs cannot be removed.');
    await trophyBackend.removeInstalledTrophyPack(packId);
    await this.commit(removePackReferences(this.state.config, packId));
    await this.reloadPacks();
    this.assetCache.clear();
  }

  async setGlobalPack(packId: string): Promise<void> {
    this.requireKnownPack(packId);
    await this.commit(setGlobalPack(this.state.config, packId));
  }

  async setGamePack(appId: number, packId: string | null): Promise<void> {
    if (packId) this.requireKnownPack(packId);
    await this.commit(setGamePackOverride(this.state.config, appId, packId));
  }

  async setTierAsset(appId: number, tier: TrophyTier, ref: TrophyAssetRef | null): Promise<void> {
    if (ref) this.requirePackResource(ref.packId, ref.resourceKey);
    await this.commit(setTierOverride(this.state.config, appId, tier, ref));
  }

  async setAchievementAsset(appId: number, achievementId: string, ref: TrophyAssetRef | null): Promise<void> {
    if (ref) this.requirePackResource(ref.packId, ref.resourceKey);
    await this.commit(setAchievementOverride(this.state.config, appId, achievementId, ref));
  }

  async addProject(appId: number): Promise<void> {
    await this.commit({ ...this.state.config, projects: addTrophyProject(this.state.config.projects, appId, Math.floor(Date.now() / 1000)) });
  }

  async removeProject(appId: number): Promise<void> {
    await this.commit({ ...this.state.config, projects: removeTrophyProject(this.state.config.projects, appId) });
  }

  async setProjectTargets(appId: number, achievementIds: readonly string[]): Promise<void> {
    await this.commit({ ...this.state.config, projects: setProjectTargets(this.state.config.projects, appId, achievementIds) });
  }

  isProject(appId: number): boolean { return this.state.config.projects.entries.some((entry) => entry.appId === appId); }

  async setPinned(appId: number, enabled?: boolean): Promise<void> { await this.commit(setAppPinned(this.state.config, appId, enabled)); }
  async setHidden(appId: number, enabled?: boolean): Promise<void> { await this.commit(setAppHidden(this.state.config, appId, enabled)); }
  async setTracked(appId: number, enabled?: boolean): Promise<void> { await this.commit(setAppTracked(this.state.config, appId, enabled)); }

  async moveWidget(surface: SurfaceKind, widgetId: string, delta: number): Promise<void> {
    await this.commit({ ...this.state.config, layout: moveWidgetBy(this.state.config.layout, surface, widgetId, delta) });
  }

  async setWidgetVisible(surface: SurfaceKind, widgetId: string, visible: boolean): Promise<void> {
    await this.commit({ ...this.state.config, layout: setWidgetVisible(this.state.config.layout, surface, widgetId, visible) });
  }

  async resetLayout(surface: SurfaceKind): Promise<void> {
    await this.commit({ ...this.state.config, layout: resetSurfaceLayout(this.state.config.layout, surface) });
  }

  async setAccessibility(patch: Partial<typeof DEFAULT_CUSTOMIZATION_STATE.accessibility>): Promise<void> {
    const next = { ...this.state.config, accessibility: { ...this.state.config.accessibility, ...patch } };
    await this.commit(validateCustomizationState(next));
  }

  async setNotifications(patch: Partial<typeof DEFAULT_CUSTOMIZATION_STATE.notifications>): Promise<void> {
    const notifications = validateNotificationPreferences({ ...this.state.config.notifications, ...patch });
    await this.commit({ ...this.state.config, notifications });
  }

  async setLibraryAppearance(patch: Partial<Pick<typeof DEFAULT_CUSTOMIZATION_STATE.library, 'artworkStyle' | 'artworkFallbackOrder' | 'bronzeBorders' | 'silverBorders' | 'achievementSize'>>): Promise<void> {
    await this.commit({ ...this.state.config, library: { ...this.state.config.library, ...patch } });
  }

  async setTheme(themeId: string): Promise<void> {
    const theme = resolveTheme(themeId);
    await this.commit({ ...this.state.config, themeId: theme.id, safeMode: { ...this.state.config.safeMode, themesDisabled: false, themeFailureCount: 0, lastKnownGoodThemeId: theme.id } });
  }

  async setSafeMode(patch: Partial<typeof DEFAULT_CUSTOMIZATION_STATE.safeMode>): Promise<void> {
    await this.commit({ ...this.state.config, safeMode: { ...this.state.config.safeMode, ...patch } });
  }

  async setDeveloper(patch: Partial<typeof DEFAULT_CUSTOMIZATION_STATE.developer>): Promise<void> {
    await this.commit({ ...this.state.config, developer: { ...this.state.config.developer, ...patch } });
  }

  getGamePackOverride(appId: number): string | null { return this.state.config.trophies.games[String(appId)]?.packId ?? null; }

  getPackResources(packId: string): TrophyPackResourceKey[] {
    const pack = this.state.packs.find((candidate) => candidate.manifest.id === packId);
    return pack ? listPackTrophyResources(pack.manifest) : [];
  }

  resolve(tier: TrophyTier, appId?: number, achievementId?: string): ResolvedTrophyAsset {
    return resolveTrophyAsset(this.state.config, this.state.packs, { tier, appId, achievementId });
  }

  async resolveTrophyIconDataUrl(tier: TrophyTier, appId?: number, achievementId?: string): Promise<string> {
    const candidates = resolveTrophyAssetCandidates(this.state.config, this.state.packs, { tier, appId, achievementId });
    let lastError: unknown = null;
    for (const asset of candidates) {
      try { return await this.resolveAssetDataUrl(asset); } catch (error) { lastError = error; }
    }
    throw lastError instanceof Error ? lastError : new Error('No readable trophy asset is available.');
  }


  async resolveToastSoundDataUrl(tier: TrophyTier, appId?: number): Promise<string | null> {
    const candidates = resolveToastSoundCandidates(this.state.config, this.state.packs, tier, appId);
    for (const asset of candidates) {
      try {
        const key = `sound:${asset.source}:${asset.packId}:${asset.relativePath}`;
        let cached = this.assetCache.get(key);
        if (!cached) {
          cached = asset.source === 'builtin' ? trophyBackend.readBundledTrophyAssetDataUrl(asset.relativePath) : trophyBackend.readTrophyPackAssetDataUrl(asset.packId, asset.relativePath);
          this.assetCache.set(key, cached);
        }
        return await cached;
      } catch { /* fall through */ }
    }
    return null;
  }

  resolveAssetDataUrl(asset: ResolvedTrophyAsset): Promise<string> {
    const key = `${asset.source}:${asset.packId}:${asset.relativePath}`;
    let cached = this.assetCache.get(key);
    if (!cached) {
      cached = asset.source === 'builtin'
        ? trophyBackend.readBundledTrophyAssetDataUrl(asset.relativePath)
        : trophyBackend.readTrophyPackAssetDataUrl(asset.packId, asset.relativePath);
      this.assetCache.set(key, cached);
      cached.catch(() => this.assetCache.delete(key));
      if (this.assetCache.size > 192) {
        const oldest = this.assetCache.keys().next().value as string | undefined;
        if (oldest) this.assetCache.delete(oldest);
      }
    }
    return cached;
  }

  async getInstalledDirectory(packId: string): Promise<string | null> {
    const pack = this.state.packs.find((candidate) => candidate.manifest.id === packId);
    if (!pack || pack.source !== 'user') return null;
    return trophyBackend.getInstalledTrophyPackDirectory(packId);
  }

  getCssVariables(surface: SurfaceKind): Record<string, string> {
    const configured = this.state.config.safeMode.themesDisabled ? resolveTheme(this.state.config.safeMode.lastKnownGoodThemeId) : resolveTheme(this.state.config.themeId);
    return compileThemeCssVariables(configured, surface, this.state.config.accessibility);
  }

  private async reloadPacks(): Promise<void> {
    const raw = await trophyBackend.listInstalledTrophyPacksJson();
    const values = JSON.parse(raw) as InstalledTrophyPack[];
    const sanitized = values.map((pack) => ({ ...pack, source: 'user' as const, manifest: validatePackManifest(pack.manifest, 'user') }));
    this.state = { ...this.state, packs: mergePackCatalog(sanitized), error: null };
    this.emit();
  }

  private async commit(config: typeof DEFAULT_CUSTOMIZATION_STATE): Promise<void> {
    const validated = validateCustomizationState(config);
    await trophyBackend.writeCustomizationJson(JSON.stringify(validated));
    this.state = { ...this.state, config: validated, error: null };
    this.assetCache.clear();
    this.emit();
  }

  private requireKnownPack(packId: string): void {
    if (!this.state.packs.some((pack) => pack.manifest.id === packId)) throw new Error(`Unknown trophy pack: ${packId}`);
  }

  private requirePackResource(packId: string, resourceKey: TrophyPackResourceKey): void {
    this.requireKnownPack(packId);
    if (!this.getPackResources(packId).includes(resourceKey)) throw new Error(`Pack ${packId} does not declare ${resourceKey}.`);
  }

  private setError(error: unknown): void {
    this.state = { ...this.state, error: error instanceof Error ? error.message : String(error) };
    this.emit();
  }

  private emit(): void { for (const listener of this.listeners) listener(); }
}

export const customizationService = new CustomizationService();
