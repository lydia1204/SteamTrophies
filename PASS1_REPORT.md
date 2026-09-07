# Pass 1 handoff report

Generated 2026-09-06 as a substantial pre-Codex implementation pass.

## Implemented

- Shared TypeScript Trophy Core with rarity tiers, permanent award-tier history, permanent unlock semantics, synthetic Platinum, game summaries, library aggregation, discovery ledger, settings validation, event derivation, scheduler, and input hardening.
- Current-Steam adapter boundary for own achievements, achievement-change protobuf hint, friends-who-play, and friend achievements.
- Millennium Lua persistence with fixed capability RPCs, bounded reads/writes, validated app/month keys, unique atomic temp files, and no arbitrary path/shell RPC.
- Compact visible library index, trophy-bearing per-game shards, append-only unlock event history, settings file, and resumable discovery ledger.
- Warm-cache React overlay, search, summary counts, lazy images, fixed-row virtualization, detail view, refresh action, and exported toolbar button component.
- Serialized durable commits so concurrent refresh workers cannot regress the index.
- Strict Steam response-shape handling: recognized empty arrays are accepted; unknown shapes fail closed and enter scheduler backoff.
- 0% titles are not written into the normal trophy index or durable game shards under the default earned-only policy.
- Friend Web API fallback kept backend-only with key in `x-webapi-key`, never in the request URL.
- Backup bundle model excludes caches/logs/transient state/secrets.
- Future Decky shell boundary.

## Local verification performed

- Core/storage/Steam-adapter/friends/backup TypeScript typecheck: pass.
- Offline frontend TypeScript sanity check: pass.
- Node tests: run through `npm test` source targets after compilation.
- Decky Python skeleton: `python3 -m py_compile decky/main.py` pass.
- Synthetic benchmark: 2,500 games × 40 achievements = 100,000 achievement records.

Latest benchmark on the authoring container:

```json
{
  "generatedGames": 2500,
  "achievementsPerGame": 40,
  "visibleGames": 1625,
  "buildMs": 202.38,
  "compactIndexBytes": 438301,
  "visibleGameShardBytes": 29592916,
  "simulatedIndexParseMs": 2.484
}
```

## Intentionally not fabricated

The exact compiled Steam desktop header patch remains disabled (`backend/main.lua` returns no transforms) until Codex inspects the target live Steam build. The guarded `appStore.m_mapApps` discovery source also still needs live verification. Those are volatile internal Steam UI surfaces and guessing them would make the starter less safe, not more complete.

The execution container could not reach/install npm dependencies in time, so no `package-lock.json` is fabricated. Top-level development dependency versions are pinned exactly. On the first networked checkout, run `npm install`, commit the generated lockfile, run `npm run prepare`, then `npm run verify` and `npm run build`.
