# Finalization report — 2026-09-06

Version: `0.4.0-rc.1`

Status: **PARTIAL / not production-ready**. All checks available on the current Apple Silicon macOS host pass, but the required live Steam, Windows, Linux, and physical Steam Deck gates have no genuine evidence and remain pending.

## Source and dependency integrity

- Input ZIP SHA-256 independently matched `fda625720acd0b2c2b31c34bab3e977804d85a961b56bc39844ea83c557cbeb4`.
- The destination was an empty Git checkout with no existing commits, remote, or license.
- npm generated an authentic workspace-aware `package-lock.json`.
- `npm audit` and `npm audit --omit=dev` both reported zero vulnerabilities.
- Current registry versions checked during finalization: Starlight `1.1.4`, `@decky/ui` `4.12.0`, `@decky/api` `1.1.3`, and `@decky/rollup` `1.0.2`.

## Changes completed

- Converted `decky/` from an empty placeholder into a current-template-compatible package with pinned dependencies, Rollup configuration, TypeScript checks, an installable `dist/index.js`, controller-focusable earned-trophy summary/recent-game UI, and bounded storage diagnostics.
- Corrected Decky storage resolution to use the actual Deck user's home rather than the privileged backend process home.
- Added JSON parsing and file-size bounds before Decky state replacement.
- Added workspace-level Decky build/typecheck/Python checks to the umbrella release gate.
- Added a portable real Lua compiler gate. This host used LuaJIT bytecode compilation for every file under `backend/`.
- Made CI's Apple Silicon/macOS limitation explicit: macOS installs the lockfile without lifecycle scripts and runs platform-neutral gates; Windows/Linux run Starlight preparation, while Linux runs the production package and Lua compiler smoke tests.
- Expanded the English string catalog and added a pseudo-localization implementation/test that protects interpolation tokens while expanding text.
- Moved the primary Desktop, Big Picture, game-detail, and diagnostics strings to the catalog.

## Validated commands

The following succeeded on macOS Apple Silicon with Node `v26.4.0`, npm `11.17.0`, Python `3.12.8`, and LuaJIT `2.1.1785763465`:

```text
npm install --ignore-scripts
npm audit
npm audit --omit=dev
npm run lua:validate
npm run release:validate
npm run decky:typecheck
npm run decky:build
python -m compileall -q decky
```

The final umbrella result included 37 behavior/security/storage/localization tests, 21 responsive fixtures, 10/10 deterministic hostile-pack cases plus symlink rejection, 42 offline Top-50 gamer QA items, repository validation, and the permanent 2,500-game/100,000-achievement benchmark.

## Current upstream/runtime facts

- Millennium stable: `3.4.1`; `3.5.0-beta.2` is a prerelease.
- Starlight: `1.1.4` remains the current npm release.
- The installed Starlight package contains Windows x64 and Linux x64 binaries only. Native `npm run prepare` and `npm run build` fail closed on this `darwin/arm64` host with `starlight: no binary for darwin/arm64`.
- Official Millennium public installation/build documentation advertises Windows and Linux. macOS restoration is still represented by upstream development work, not a supported stable release validated here.
- Steam is installed on this Mac, but that does not provide a supported Millennium runtime and was not used to fabricate live-injection evidence.

## Remaining release blockers

- `docs/runtime-release-gates.json`: 0 pass, 20 pending.
- No verified current Steam Stable header chunk was available, so the optional toolbar transform remains intentionally disabled and fail-closed.
- No Steam Stable/Beta account-level achievement adapter validation was possible.
- No Windows or Linux live Millennium run was available.
- No physical Steam Deck was available for controller, display, sleep/resume, offline, or notification evidence.
- Required runtime screenshots do not exist and were not replaced with mockups.
- No license exists. Choosing one remains an owner decision before public distribution.
- No Git remote exists, so nothing can be pushed and no GitHub Release can be created.

`npm run runtime:gates:require-pass` must continue to fail until those evidence-bearing gates are completed. The version remains `0.4.0-rc.1`; this report does not promote it to a stable release.
