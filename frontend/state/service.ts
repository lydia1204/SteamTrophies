import {
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
} from '../../packages/core/src';
import { SteamAchievementAdapter, resolveSteamClient } from '../../packages/steam-adapter/src';
import { decodeGameSnapshot, decodeLibraryIndex } from '../../packages/storage/src';
import { trophyBackend } from '../runtime/backend';
import { discoverLibraryAppIds, resolveGameName } from '../runtime/library';

export interface TrophyState {
  ready: boolean;
  refreshing: boolean;
  index: LibraryIndex;
  selectedAppId: number | null;
  selectedGame: GameSnapshot | null;
  settings: TrophySettings;
  error: string | null;
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
  };
  private readonly listeners = new Set<Listener>();
  private readonly eventListeners = new Set<TrophyEventListener>();
  private adapter: SteamAchievementAdapter | null = null;
  private stopAchievementEvents: (() => void) | null = null;
  private scheduler: RefreshScheduler | null = null;
  private readonly gameCache = new Map<number, GameSnapshot>();
  private discovery: DiscoveryLedgerV1 = emptyDiscoveryLedger();
  private commitTail: Promise<void> = Promise.resolve();
  private refreshInFlight = 0;

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

    const steam = resolveSteamClient();
    if (!steam) {
      this.setError('Steam achievement API is not available in this window.');
      return;
    }
    this.adapter = new SteamAchievementAdapter(steam);
    this.scheduler = new RefreshScheduler((appId, signal) => this.refreshGameNow(appId, signal), {
      concurrency: this.state.settings.refreshConcurrency,
      eventDebounceMs: 600,
      minPerAppIntervalMs: 2500,
    });
    this.stopAchievementEvents = this.adapter.onAchievementChanged((appId) => {
      if (appId) this.scheduler?.request(appId, 'event');
      else {
        // If Steam's event payload changes, refresh only a tiny recent set rather than scanning the library.
        for (const game of this.state.index.games.slice(0, 3)) this.scheduler?.request(game.appId, 'event');
      }
    });

    // Stale-while-revalidate: warm visible entries quietly after first paint.
    const now = Math.floor(Date.now() / 1000);
    for (const game of this.state.index.games.slice(0, 40)) {
      if (game.staleAfterUnix <= now) this.scheduler.request(game.appId, 'stale');
    }

    // Discovery is resumable and periodically re-probes hidden apps. It remains off the click path.
    void this.backgroundDiscovery();
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

  private async backgroundDiscovery(): Promise<void> {
    const ids = await discoverLibraryAppIds();
    if (!ids.length || !this.scheduler) return;
    const visible = new Set(this.state.index.games.map((game) => game.appId));
    const now = Math.floor(Date.now() / 1000);
    for (const appId of ids) {
      if (visible.has(appId) || !shouldProbeApp(this.discovery, appId, now)) continue;
      this.scheduler.request(appId, 'background');
      // Prevent a 2k-title burst against Steam's local service. Scheduler concurrency is bounded separately.
      await new Promise((resolve) => setTimeout(resolve, 120));
    }
  }

  dispose(): void {
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

  closeGame(): void {
    this.state = { ...this.state, selectedAppId: null, selectedGame: null };
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
      const next = buildGameSnapshot({
        appId,
        name: previous?.name ?? resolveGameName(appId),
        achievements,
        previous,
        nowUnix: now,
        staleTtlSeconds: this.state.settings.staleTtlSeconds,
        thresholds: this.state.settings.thresholds,
        visibility: this.state.settings.visibility,
      });
      const events = deriveEvents(previous, next);
      if (signal?.aborted) return;
      await this.enqueueCommit(next, events);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.setError(message);
      throw error; // RefreshScheduler owns retry/backoff policy.
    } finally {
      this.refreshInFlight = Math.max(0, this.refreshInFlight - 1);
      if (this.refreshInFlight === 0) {
        this.state = { ...this.state, refreshing: false };
        this.emit();
      }
    }
  }

  /** Serializes all durable state commits so concurrent refresh workers cannot regress the compact index. */
  private enqueueCommit(next: GameSnapshot, events: TrophyEvent[]): Promise<void> {
    const operation = this.commitTail.then(() => this.commitGame(next, events));
    this.commitTail = operation.catch(() => {});
    return operation;
  }

  private async commitGame(next: GameSnapshot, events: TrophyEvent[]): Promise<void> {
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
    if (durableEvents.length) for (const listener of this.eventListeners) { try { listener(durableEvents, next); } catch (error) { console.warn('[SteamTrophies] trophy event listener failed', error); } }

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
