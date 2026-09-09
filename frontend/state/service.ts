import {
  completionAchievement,
  buildGameSnapshot,
  buildLibraryIndex,
  DEFAULT_SETTINGS,
  deriveEvents,
  DiscoveryLedgerV1,
  emptyDiscoveryLedger,
  GameSnapshot,
  LibraryIndex,
  markAppScanned,
  parseDiscoveryLedger,
  RefreshScheduler,
  shouldProbeApp,
  TrophyEvent,
  TrophySettings,
  validateSettings,
  repairRarity,
  shouldAnnounceRefresh,
} from '../../packages/core/src';
import { SteamAchievementAdapter, resolveSteamClient } from '../../packages/steam-adapter/src';
import { decodeGameSnapshot, decodeLibraryIndex } from '../../packages/storage/src';
import { trophyBackend } from '../runtime/backend';
import { discoverLibraryAppIds, resolveGameName } from '../runtime/library';
import { parseGlobalRarity } from '../../packages/steam-adapter/src/global-rarity';

export interface TrophyState {
  ready: boolean;
  refreshing: boolean;
  index: LibraryIndex;
  selectedAppId: number | null;
  selectedGame: GameSnapshot | null;
  settings: TrophySettings;
  error: string | null;
  discoveryStatus: string;
  discovering: boolean;
  repairing: boolean;
  repairStatus: string | null;
}

type Listener = () => void;
export type TrophyEventListener = (events: readonly TrophyEvent[], game: GameSnapshot) => void;

const EMPTY_INDEX: LibraryIndex = {
  schemaVersion: 1,
  generatedAtUnix: 0,
  games: [],
  totals: { visibleGames: 0, earnedTrophies: 0, bronze: 0, silver: 0, gold: 0, platinum: 0 },
};

export class TrophyService {
  private state: TrophyState = {
    ready: false,
    refreshing: false,
    index: EMPTY_INDEX,
    selectedAppId: null,
    selectedGame: null,
    settings: DEFAULT_SETTINGS,
    error: null,
    discoveryStatus: 'Waiting for Steam’s library…',
    discovering: false,
    repairing: false,
    repairStatus: null,
  };
  private readonly listeners = new Set<Listener>();
  private readonly eventListeners = new Set<TrophyEventListener>();
  private adapter: SteamAchievementAdapter | null = null;
  private stopAchievementEvents: (() => void) | null = null;
  private scheduler: RefreshScheduler | null = null;
  private readonly gameCache = new Map<number, GameSnapshot>();
  private readonly previewReads = new Map<number, Promise<GameSnapshot|null>>();
  private discovery: DiscoveryLedgerV1 = emptyDiscoveryLedger();
  private commitTail: Promise<void> = Promise.resolve();
  private refreshInFlight = 0;
  private generation = 0;
  private discoveryRunning = false;
  private readonly discoveryPending = new Set<number>();
  private discoveryTotal = 0;
  private discoveryChecked = 0;

  getSnapshot = (): TrophyState => this.state;

  subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  subscribeEvents = (listener: TrophyEventListener): (() => void) => {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  };

  async boot(): Promise<void> {
    const generation = ++this.generation;
    // Critical UX rule: hydrate the compact local index before any network/library work.
    try {
      const raw = await trophyBackend.readIndexJson();
      if (raw) this.state = { ...this.state, index: decodeLibraryIndex(raw, 'state/index.v1.json') };
    } catch (error) {
      console.warn('[SteamTrophies] cached index unavailable; attempting local recovery', error);
      this.state = { ...this.state, index: await this.recoverLocalIndex() };
    }
    this.state = { ...this.state, ready: true };
    this.emit();

    await this.loadSmallLocalState();

    let steam = resolveSteamClient();
    for (let attempt = 0; !steam && attempt < 30 && generation === this.generation; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      steam = resolveSteamClient();
    }
    if (generation !== this.generation) return;
    if (!steam) {
      this.setError('Steam achievement API is unavailable. Restart Steam using Steam Millennium, then open Library.');
      return;
    }
    this.adapter = new SteamAchievementAdapter(steam);
    this.scheduler = new RefreshScheduler((appId, signal) => this.refreshGameNow(appId, signal), {
      concurrency: this.state.settings.refreshConcurrency,
      eventDebounceMs: 600,
      minPerAppIntervalMs: 2500,
      maxRetries: 0, // Failed library reads stay visible and require explicit retry; no endless background loop.
    });
    this.stopAchievementEvents = this.adapter.onAchievementChanged((appId) => {
      if (appId) this.scheduler?.request(appId, 'event');
      else {
        // If Steam's event payload changes, refresh only a tiny recent set rather than scanning the library.
        for (const game of this.state.index.games.slice(0, 3)) this.scheduler?.request(game.appId, 'event');
      }
    });

    // Startup is strictly cache-only. Discovery is an explicit user action, never a restart side effect.
    this.state = { ...this.state, discoveryStatus: 'Saved library loaded · Automatic discovery is off', discovering: false };
    this.emit();
  }

  private async loadSmallLocalState(): Promise<void> {
    try {
      const raw = await trophyBackend.readSettingsJson();
      if (raw) this.state = { ...this.state, settings: validateSettings(JSON.parse(raw)) };
    } catch (error) {
      console.warn('[SteamTrophies] invalid settings; using safe defaults', error);
    }
    try {
      this.discovery = parseDiscoveryLedger(await trophyBackend.readDiscoveryJson());
    } catch (error) {
      console.warn('[SteamTrophies] discovery ledger unavailable; rebuilding lazily', error);
      this.discovery = emptyDiscoveryLedger();
    }
    this.emit();
  }

  rescanLibrary(): void {
    if (this.state.repairing) return;
    if (!this.scheduler) {
      this.setError('Steam achievement API is unavailable. Restart using Steam Millennium.');
      return;
    }
    void this.backgroundDiscovery();
  }

  async repairCachedRarity(): Promise<void> {
    if (this.state.repairing || this.state.discovering || this.state.refreshing) return;
    const generation = this.generation;
    const ids = this.state.index.games.map((game) => game.appId);
    this.state = { ...this.state, repairing: true, repairStatus: 'Repairing cached rarity without reimporting achievements…' };
    this.emit();
    let repaired = 0, failed = 0;
    try {
      for (const id of ids) {
        if (generation !== this.generation) return;
        try {
          const raw = await trophyBackend.readGlobalRarityJson(id);
          if (!raw) throw new Error('Global rarity unavailable');
          const percentages = parseGlobalRarity(raw);
          const operation = this.commitTail.then(async () => {
            if (generation !== this.generation) return;
            const latest = this.gameCache.get(id) ?? await this.readCachedGame(id);
            if (!latest) throw new Error('Cached game unavailable');
            if (generation !== this.generation) return;
            await this.commitGame(repairRarity(latest, percentages, this.state.settings.thresholds, true), [], false);
          });
          this.commitTail = operation.catch(() => {});
          await operation;
          repaired++;
        } catch { failed++; }
        if (generation !== this.generation) return;
        this.state = { ...this.state, repairStatus: `${repaired} / ${ids.length} games repaired · ${failed} unavailable` };
        this.emit();
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    } finally {
      if (generation === this.generation) {
        this.state = { ...this.state, repairing: false, repairStatus: `Rarity repair finished: ${repaired} games corrected, ${failed} unavailable. Unlocks and customizations retained.` };
        this.emit();
      }
    }
  }

  private async backgroundDiscovery(): Promise<void> {
    if (this.discoveryRunning || this.discoveryPending.size || !this.scheduler) return;
    this.discoveryRunning = true;
    const generation = this.generation;
    this.state = { ...this.state, discovering: true, discoveryStatus: 'Waiting for Steam’s library…' };
    this.emit();
    let ids = await discoverLibraryAppIds();
    for (let attempt = 0; !ids.length && attempt < 30 && generation === this.generation; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      ids = await discoverLibraryAppIds();
    }
    if (generation !== this.generation) return;
    if (!ids.length || !this.scheduler) {
      this.discoveryRunning = false;
      this.state = { ...this.state, discovering: false, discoveryStatus: 'Library not available yet. Open Steam’s Library, then select Retry discovery.' };
      this.emit();
      return;
    }
    const visible = new Set(this.state.index.games.map((game) => game.appId));
    const now = Math.floor(Date.now() / 1000);
    const candidates = ids.filter((appId) => !visible.has(appId) && shouldProbeApp(this.discovery, appId, now));
    this.discoveryTotal = candidates.length;
    this.discoveryChecked = 0;
    for (const id of candidates) this.discoveryPending.add(id);
    this.state = { ...this.state, discoveryStatus: `${ids.length.toLocaleString()} library apps detected · ${candidates.length.toLocaleString()} to check` };
    this.emit();
    for (const appId of candidates) {
      if (generation !== this.generation || !this.scheduler) return;
      this.scheduler.request(appId, 'background');
      // Prevent a 2k-title burst against Steam's local service. Scheduler concurrency is bounded separately.
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
    if (generation !== this.generation) return;
    this.discoveryRunning = false;
    this.updateDiscoveryStatus();
  }

  private updateDiscoveryStatus(): void {
    const discovering = this.discoveryRunning || this.discoveryPending.size > 0;
    this.state = { ...this.state, discovering, discoveryStatus: this.discoveryTotal
      ? `${this.discoveryChecked.toLocaleString()} / ${this.discoveryTotal.toLocaleString()} apps checked${discovering ? ' · Discovering trophies…' : this.discoveryChecked < this.discoveryTotal ? ' · Some reads failed; retry discovery' : ' · Scan finished'}`
      : 'Library detected · No apps due for discovery' };
    this.emit();
  }

  dispose(): void {
    this.generation++;
    this.discoveryRunning = false;
    this.discoveryPending.clear();
    this.stopAchievementEvents?.();
    this.stopAchievementEvents = null;
    this.scheduler?.stop();
    this.scheduler = null;
    this.adapter = null;
  }

  async selectGame(appId: number): Promise<void> {
    this.state = { ...this.state, selectedAppId: appId, selectedGame: this.gameCache.get(appId) ?? null };
    this.emit();
    if (!this.state.selectedGame) {
      try {
        const raw = await trophyBackend.readGameJson(appId);
        if (raw) {
          const game = decodeGameSnapshot(raw, `state/games/${appId}.v1.json`);
          this.gameCache.set(appId, game);
          if (this.state.selectedAppId === appId) {
            this.state = { ...this.state, selectedGame: game };
            this.emit();
          }
        }
      } catch (error) {
        console.warn('[SteamTrophies] failed reading game shard', error);
      }
    }
    const summary = this.state.index.games.find((game) => game.appId === appId);
    if (!summary || summary.staleAfterUnix <= Math.floor(Date.now() / 1000)) this.scheduler?.request(appId, 'visible');
  }

  /** Card previews read only an existing shard: never select, refresh, scan, or emit an event. */
  async getCachedCompletion(appId: number) {
    const game = await this.getCachedSnapshot(appId);
    return game ? { achievement: completionAchievement(game.achievements, game.platinum), unlockedAtUnix: game.platinum.unlockedAtUnix } : { achievement: null, unlockedAtUnix: null };
  }

  async getCachedSnapshot(appId:number):Promise<GameSnapshot|null> {
    const cached = this.gameCache.get(appId);
    if (cached) return cached;
    const pending = this.previewReads.get(appId);
    if (pending) return pending;
    const read = (async () => {
      try {
        const raw = await trophyBackend.readGameJson(appId);
        if (!raw) return null;
        const game = decodeGameSnapshot(raw, `state/games/${appId}.v1.json`);
        // A live update may have arrived while disk was being read.
        if (!this.gameCache.has(appId)) this.gameCache.set(appId, game);
        return this.gameCache.get(appId)!;
      } catch { return null; } // Preview failures never quarantine, refresh or rewrite saved data.
    })();
    this.previewReads.set(appId, read);
    try { return await read; } finally { this.previewReads.delete(appId); }
  }

  async getCachedPreview(appId: number): Promise<GameSnapshot['achievements']> {
    const game = await this.getCachedSnapshot(appId);
    return (game?.achievements ?? []).filter(a => a.achieved)
      .sort((a, b) => (b.unlockedAtUnix ?? 0) - (a.unlockedAtUnix ?? 0))
      .map(a => ({ ...a, globalUnlockPercent: game?.rarityRevision === 1 ? a.globalUnlockPercent : null }));
  }

  closeGame(): void {
    this.state = { ...this.state, selectedAppId: null, selectedGame: null };
    this.emit();
  }

  dismissRepairStatus(): void {
    if (this.state.repairing) return;
    this.state = { ...this.state, repairStatus: null };
    this.emit();
  }

  requestRefresh(appId: number): void {
    this.scheduler?.request(appId, 'visible');
  }

  private async refreshGameNow(appId: number, signal?: AbortSignal): Promise<void> {
    if (!this.adapter) return;
    this.refreshInFlight += 1;
    if (this.refreshInFlight === 1) {
      this.state = { ...this.state, refreshing: true, error: null };
      this.emit();
    }

    try {
      if (signal?.aborted) return;
      const previous = this.gameCache.get(appId) ?? (await this.readCachedGame(appId));
      if (signal?.aborted) return;
      const achievements = await this.adapter.getMyAchievements(appId);
      if (signal?.aborted) return;
      const now = Math.floor(Date.now() / 1000);
      let next = buildGameSnapshot({
        appId,
        name: previous?.name ?? resolveGameName(appId),
        achievements,
        previous,
        nowUnix: now,
        staleTtlSeconds: this.state.settings.staleTtlSeconds,
        thresholds: this.state.settings.thresholds,
        visibility: this.state.settings.visibility,
      });
      if (achievements.length && achievements.some((a) => a.achieved)) {
        try {
          const raw = await trophyBackend.readGlobalRarityJson(appId);
          if (!raw) throw new Error('Global rarity unavailable');
          next = repairRarity(next, parseGlobalRarity(raw), this.state.settings.thresholds);
        } catch {
          // Unknown is not zero. Preserve previously verified data if Steam is unavailable.
          const known = new Map(previous?.rarityRevision === 1 ? previous.achievements.flatMap((a) => a.globalUnlockPercent == null ? [] : [[a.id, a.globalUnlockPercent] as const]) : []);
          next = repairRarity(next, known, this.state.settings.thresholds);
        }
      }
      const events = deriveEvents(previous, next);
      if (signal?.aborted) return;
      await this.enqueueCommit(next, events, shouldAnnounceRefresh(previous));
      if (this.discoveryPending.has(appId)) this.discoveryChecked++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.setError(`App ${appId}: ${message}`);
      throw error; // RefreshScheduler owns retry/backoff policy.
    } finally {
      if (this.discoveryPending.delete(appId)) this.updateDiscoveryStatus();
      this.refreshInFlight = Math.max(0, this.refreshInFlight - 1);
      if (this.refreshInFlight === 0) {
        this.state = { ...this.state, refreshing: false };
        this.emit();
      }
    }
  }

  /** Serializes all durable state commits so concurrent refresh workers cannot regress the compact index. */
  private enqueueCommit(next: GameSnapshot, events: TrophyEvent[], announce = true): Promise<void> {
    const operation = this.commitTail.then(() => this.commitGame(next, events, announce));
    this.commitTail = operation.catch(() => {});
    return operation;
  }

  private async commitGame(next: GameSnapshot, events: TrophyEvent[], announce = true): Promise<void> {
    this.gameCache.set(next.appId, next);

    const summaries = new Map(this.state.index.games.map((game) => [game.appId, game]));
    const hadVisibleEntry = summaries.has(next.appId);
    if (next.summary.visible) summaries.set(next.appId, next.summary);
    else summaries.delete(next.appId);
    const changesVisibleIndex = next.summary.visible || hadVisibleEntry;

    // Only trophy-bearing games need durable game shards under the default product model.
    // 0% discovery results are represented by the small discovery ledger instead.
    if (next.summary.visible) await trophyBackend.writeGameJson(next.appId, JSON.stringify(next));

    let index = this.state.index;
    if (changesVisibleIndex) {
      index = buildLibraryIndex([...summaries.values()], next.summary.lastRefreshAtUnix);
      await trophyBackend.writeIndexJson(JSON.stringify(index));
    }

    // Refresh telemetry is rebuildable noise. Only append irreversible trophy events.
    const durableEvents = events.filter((event) => event.type !== 'game_refreshed');
    await this.persistEvents(durableEvents);
    if (announce && durableEvents.length) for (const listener of this.eventListeners) { try { listener(durableEvents, next); } catch (error) { console.warn('[SteamTrophies] trophy event listener failed', error); } }

    this.discovery = markAppScanned(this.discovery, next.appId, next.summary.lastRefreshAtUnix);
    await trophyBackend.writeDiscoveryJson(JSON.stringify(this.discovery));

    this.state = {
      ...this.state,
      index,
      selectedGame: this.state.selectedAppId === next.appId ? next : this.state.selectedGame,
    };
    this.emit();
  }

  private async readCachedGame(appId: number): Promise<GameSnapshot | undefined> {
    try {
      const raw = await trophyBackend.readGameJson(appId);
      if (!raw) return undefined;
      const game = decodeGameSnapshot(raw, `state/games/${appId}.v1.json`);
      this.gameCache.set(appId, game);
      return game;
    } catch (error) {
      console.warn('[SteamTrophies] cached game shard invalid; quarantining', appId, error);
      try { await trophyBackend.quarantineGame(appId); } catch {}
      return undefined;
    }
  }

  private async recoverLocalIndex(): Promise<LibraryIndex> {
    try { await trophyBackend.quarantineIndex(); } catch {}

    // The backend will fall back to a .bak file after the corrupt primary is quarantined.
    try {
      const backup = await trophyBackend.readIndexJson();
      if (backup) return decodeLibraryIndex(backup, 'state/index.v1.json.bak');
    } catch (error) {
      console.warn('[SteamTrophies] backup index also invalid; rebuilding from local shards', error);
    }

    const games: GameSnapshot[] = [];
    try {
      const ids = await trophyBackend.listGameAppIds();
      for (const appId of ids.slice(0, 100000)) {
        try {
          const raw = await trophyBackend.readGameJson(appId);
          if (!raw) continue;
          const game = decodeGameSnapshot(raw, `state/games/${appId}.v1.json`);
          games.push(game);
          this.gameCache.set(appId, game);
        } catch (error) {
          console.warn('[SteamTrophies] skipping corrupt game shard during index recovery', appId, error);
          try { await trophyBackend.quarantineGame(appId); } catch {}
        }
      }
    } catch (error) {
      console.warn('[SteamTrophies] local index recovery unavailable', error);
    }
    const recovered = buildLibraryIndex(games.filter((game) => game.summary.visible).map((game) => game.summary), Math.floor(Date.now() / 1000));
    try { await trophyBackend.writeIndexJson(JSON.stringify(recovered)); } catch (error) { console.warn('[SteamTrophies] failed persisting recovered index', error); }
    return recovered;
  }

  private async persistEvents(events: TrophyEvent[]): Promise<void> {
    if (events.length === 0) return;
    const byMonth = new Map<string, string[]>();
    for (const event of events) {
      const date = new Date(event.atUnix * 1000);
      const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      const lines = byMonth.get(month) ?? [];
      lines.push(JSON.stringify(event));
      byMonth.set(month, lines);
    }
    for (const [month, lines] of byMonth) await trophyBackend.appendEvents(month, `${lines.join('\n')}\n`);
  }

  private setError(error: string): void {
    this.state = { ...this.state, error };
    this.emit();
  }

  private emit(): void {
    for (const listener of this.listeners) listener();
  }
}

export const trophyService = new TrophyService();
