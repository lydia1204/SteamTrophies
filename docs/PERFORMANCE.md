# Performance plan

## Desktop targets

- trophy-button interaction -> first meaningful paint: target <100 ms from warm state;
- compact index parse: target <15 ms on typical desktop hardware;
- scrolling: render only viewport rows + small overscan;
- selected game: read/render one shard;
- icon images: browser lazy-loading first, disk asset LRU later;
- background refresh concurrency: default 4 desktop, reduce on Deck.

## First-run import

First run is the only intentionally expensive path. It enumerates the already-loaded Steam app map in the background and slowly probes achievement data. Current starter enqueue cadence is 120 ms/app with the scheduler applying additional per-app/concurrency limits. A persistent discovery ledger makes this resumable after restart and re-probes hidden apps after 30 days. For 2,000 entries, initial scheduling is spread across roughly four minutes rather than producing an IPC burst.

This is a bootstrap fallback, not the final optimization. If a stable Steam achievement-progress cache or decoded library bootstrap supplies `nAchieved/nTotal` per app, use that to probe only apps with earned achievements.

## Steam Deck

- lower refresh concurrency to 1-2;
- pause first-run discovery while a game is active if profiling shows frame-time impact;
- cap asset cache more aggressively (suggested 256 MiB default for Deck, configurable);
- avoid decoding/downscaling huge images in the renderer;
- keep the UI list virtualized and controller focusable;
- no polling loops faster than needed; rely on achievement-change hints.
