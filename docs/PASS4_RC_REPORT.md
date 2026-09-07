# Pass 4 release-candidate hardening report

Version: `0.4.0-rc.1`

This pass is intended to finish the offline engineering foundation and hand the repository to a live-runtime finalizer. It does not fabricate private Steam integration evidence that cannot be produced offline.

## Product QA

A Top 50 gamer/Steam QA model now lives in `docs/gamer-qa-top50.json` and is validated by `npm run gamer:qa`.

The checklist emphasizes:

- host stability
- instant/local-first opening
- trophy history integrity
- large libraries
- controller access
- offline behavior
- notification quality
- customization
- accessibility
- display scaling
- privacy/security
- update resilience
- diagnostics/recovery
- community documentation

Items requiring real Steam/device evidence remain runtime gates rather than being mislabeled as offline passes.

## Security hardening

Pass 4 adds or strengthens:

- structural runtime decoding for persisted library/game state
- local-first compact-index reconstruction from valid shards
- constrained last-known-good backup files
- corruption quarantine
- refresh cancellation on shutdown
- retry/timer cleanup
- frontend lifecycle cleanup on plugin dismount
- React error containment at the plugin surface
- static runtime security audit
- hostile resource-pack attack corpus
- PNG/JPEG/WebP decoded dimension/pixel validation
- continued data-only custom pack policy
- continued API-key isolation and network allowlisting

## Device compatibility

Responsive tests expanded to 21 fixtures including:

- emergency narrow and short-height windows
- handheld-class layouts
- Steam Deck 1280x800
- 720p/1080p/4K Big Picture
- common desktop/laptop sizes
- 21:9
- 32:9 / 5120x1440
- 5K2K
- 5K Retina-class stress
- docked Deck 1080p and 4K

Layout is based on measured CSS-pixel container dimensions, not a hard-coded device name.

## Notification refinement

Notification behavior now supports bounded visible toast count and audio cooldown. Burst unlocks preserve every event while reducing audio spam by choosing the highest-tier sound for the burst window.

## Lifecycle refinement

The frontend provides dismount cleanup so scheduler work, notification timers and customization caches do not rely solely on the Steam JS context disappearing cleanly.

Refresh stop now aborts in-flight work and clears scheduled retries.

## Repository/release tooling

Added or expanded:

- `npm run release:validate`
- `npm run security:audit`
- `npm run security:pack-corpus`
- `npm run gamer:qa`
- `npm run repo:validate`
- `npm run runtime:gates`
- `npm run runtime:gates:require-pass`
- performance budgets
- CI matrix groundwork
- community README
- security policy
- contribution guide
- changelog
- platform matrix
- runtime evidence contract
- screenshot capture contract
- Codex finalization brief

## Known environment limitations of this pass

The offline build environment does not provide a Lua/LuaJIT compiler and cannot complete a networked npm install. Therefore this pass must not claim:

- bytecode/parser-level Lua validation
- a fresh npm dependency audit
- a newly generated authentic `package-lock.json`
- a real Starlight production package from installed dependencies
- live Steam Stable/Beta hook validation
- physical Steam Deck validation

Those are explicit tasks in `CODEX_FINALIZE_PROMPT.md`.

## Release rule

The project is ready for final live integration work only when:

1. `npm run release:validate` is green on the final dependency graph.
2. a real lockfile is committed.
3. Lua/backend syntax is checked by an actual Lua/LuaJIT parser/compiler.
4. Starlight production packaging succeeds.
5. `npm run runtime:gates:require-pass` is green with genuine evidence.
6. README runtime screenshots are captured from the tested build.
7. Git history and the release artifact are built from the same final commit.

## Final sealed offline validation results

The exact final-tree umbrella run completed successfully after the final test-harness correction:

- 36 / 36 automated behavior/storage/security tests passed
- 21 / 21 responsive/device fixtures passed
- CEF compatibility guard passed
- static security audit passed across 82 runtime source files
- hostile resource-pack corpus passed 10 / 10 deterministic cases, plus symlink rejection on the current platform
- Gamer QA Top 50 structure passed with 42 engineering items complete and 8 items requiring live evidence
- runtime release-gate schema passed with 0 / 20 falsely pre-approved
- example resource pack passed 7 / 7 declared resources
- repository structure/syntax validator passed across 186 files on the final run
- Python Decky syntax/compile check passed

Final synthetic scale benchmark:

```text
2,500 games
40 achievements/game
100,000 achievement inputs
1,625 visible trophy games
186.38 ms complete synthetic reconstruction
438,301-byte compact warm index
29,592,916 bytes visible game shards
2.322 ms compact-index parse
```

The public runtime gate was also tested for the correct failure mode: `npm run runtime:gates:require-pass` exits non-zero while the 20 live gates remain pending. This is intentional.

`npm run prepare` and `npm run build` could not execute in the offline authoring container because installed Starlight dependencies are absent. They fail with `starlight: not found`, which is why the final Codex pass explicitly begins with a real networked `npm install`, authentic lockfile generation and production build.

No Lua/LuaJIT compiler is available in the authoring container. Backend Lua is covered by static/security inspection here but requires parser/compiler validation during finalization.
