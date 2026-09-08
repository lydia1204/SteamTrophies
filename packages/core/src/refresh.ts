export interface RefreshRequest {
  appId: number;
  priority: 'event' | 'visible' | 'stale' | 'background';
  requestedAtMs: number;
}

export interface RefreshSchedulerOptions {
  concurrency?: number;
  eventDebounceMs?: number;
  minPerAppIntervalMs?: number;
  maxBackoffMs?: number;
  maxRetries?: number;
}

const RANK = { event: 4, visible: 3, stale: 2, background: 1 } as const;

export class RefreshScheduler {
  private queue = new Map<number, RefreshRequest>();
  private inFlight = new Map<number, AbortController>();
  private lastStarted = new Map<number, number>();
  private failures = new Map<number, number>();
  private retryTimers = new Map<number, ReturnType<typeof setTimeout>>();
  private timer: ReturnType<typeof setTimeout> | undefined;
  private stopped = false;
  private readonly concurrency: number;
  private readonly eventDebounceMs: number;
  private readonly minPerAppIntervalMs: number;
  private readonly maxBackoffMs: number;
  private readonly maxRetries: number;

  constructor(
    private readonly refresh: (appId: number, signal: AbortSignal) => Promise<void>,
    options: RefreshSchedulerOptions = {},
  ) {
    this.concurrency = Math.max(1, Math.min(16, options.concurrency ?? 4));
    this.eventDebounceMs = Math.max(0, options.eventDebounceMs ?? 600);
    this.minPerAppIntervalMs = Math.max(0, options.minPerAppIntervalMs ?? 2500);
    this.maxBackoffMs = Math.max(1000, options.maxBackoffMs ?? 300000);
    this.maxRetries = Math.max(0, Math.min(5, options.maxRetries ?? 2));
  }

  request(appId: number, priority: RefreshRequest['priority'] = 'background', nowMs = Date.now()): void {
    if (this.stopped || !Number.isSafeInteger(appId) || appId <= 0) return;
    const existing = this.queue.get(appId);
    if (!existing || RANK[priority] >= RANK[existing.priority]) {
      this.queue.set(appId, {
        appId,
        priority,
        requestedAtMs: Math.min(existing?.requestedAtMs ?? nowMs, nowMs),
      });
    }
    this.kick(priority === 'event' ? this.eventDebounceMs : 0);
  }

  stop(): void {
    if (this.stopped) return;
    this.stopped = true;
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.queue.clear();
    for (const timer of this.retryTimers.values()) clearTimeout(timer);
    this.retryTimers.clear();
    for (const controller of this.inFlight.values()) controller.abort();
  }

  pendingCount(): number {
    return this.queue.size + this.inFlight.size + this.retryTimers.size;
  }

  private kick(delay: number): void {
    if (this.timer || this.stopped) return;
    this.timer = setTimeout(() => {
      this.timer = undefined;
      void this.drain();
    }, delay);
  }

  private async drain(): Promise<void> {
    if (this.stopped) return;
    while (!this.stopped && this.inFlight.size < this.concurrency && this.queue.size > 0) {
      const now = Date.now();
      const request = this.pickNext(now);
      if (!request) {
        this.kick(250);
        return;
      }

      this.queue.delete(request.appId);
      const controller = new AbortController();
      this.inFlight.set(request.appId, controller);
      this.lastStarted.set(request.appId, now);

      void this.refresh(request.appId, controller.signal)
        .then(() => {
          if (!controller.signal.aborted) this.failures.delete(request.appId);
        })
        .catch((error) => {
          if (controller.signal.aborted || this.stopped) return;
          const failures = (this.failures.get(request.appId) ?? 0) + 1;
          this.failures.set(request.appId, failures);
          if (failures > this.maxRetries) return;
          const delay = Math.min(this.maxBackoffMs, 1000 * 2 ** Math.min(8, failures));
          const oldTimer = this.retryTimers.get(request.appId);
          if (oldTimer) clearTimeout(oldTimer);
          const retry = setTimeout(() => {
            this.retryTimers.delete(request.appId);
            this.request(request.appId, 'background');
          }, delay);
          this.retryTimers.set(request.appId, retry);
          void error;
        })
        .finally(() => {
          this.inFlight.delete(request.appId);
          this.kick(0);
        });
    }
  }

  private pickNext(now: number): RefreshRequest | undefined {
    return [...this.queue.values()]
      .filter((request) => now - (this.lastStarted.get(request.appId) ?? 0) >= this.minPerAppIntervalMs)
      .sort((a, b) => RANK[b.priority] - RANK[a.priority] || a.requestedAtMs - b.requestedAtMs)[0];
  }
}
