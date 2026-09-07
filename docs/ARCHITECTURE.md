# Architecture

## Layers

1. **Trophy Core** (`packages/core`) contains the product rules. It knows nothing about Millennium, Decky, React, filesystem APIs, Steam UI globals, or HTTP.
2. **Steam adapter** (`packages/steam-adapter`) translates current `SteamClient.Apps` achievement objects/events into core inputs.
3. **Storage** (`packages/storage`) defines a capability-based storage driver and shard repository. The driver sees only relative logical paths.
4. **Millennium backend** (`backend`) supplies the actual filesystem capability via narrow Lua FFI methods.
5. **Frontend service** (`frontend/state/service.ts`) orchestrates warm-cache hydration, refresh scheduling, Steam adapter calls, event persistence, and UI state.
6. **React UI** renders a compact index first, then lazy-loads one selected game shard.

## Critical path

Toolbar click -> already-running frontend service -> in-memory `LibraryIndex` -> overlay render.

No filesystem read is required if the service is warm. Even on plugin boot, the one compact index read happens before background Steam calls. App enumeration, achievement refresh, friend queries, icon download, backup, and NAS/cloud work are explicitly off-path.

## Stale-while-revalidate

- Index/shards are immediately usable while stale.
- Visible stale games receive higher refresh priority than background discovery.
- Achievement-change events receive the highest priority and are debounced.
- Per-app minimum intervals suppress duplicate event storms.
- Failure backoff tops out at five minutes.

## Event sourcing, lightly

The monthly NDJSON log is not intended to rebuild every field forever. It preserves user-meaningful award history and gives migrations/recovery a durable audit trail. Current per-game snapshots remain the efficient read model.

## Visibility

Discovery may inspect/probe thousands of apps, but `LibraryIndex` includes only `GameSummary.visible === true`. With the default policy this means at least one earned/historical trophy. A 2,000-game Steam library can therefore have a trophy index containing only the few hundred games the user has actually started earning trophies in.
