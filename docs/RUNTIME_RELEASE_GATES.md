# Runtime release gates

Offline tests can validate trophy semantics, persistence, security boundaries, responsive classification and performance budgets. They **cannot** prove that Valve's current private Steam UI still exposes the same anchors or that a physical Steam Deck focus walk behaves correctly.

For that reason SteamTrophies keeps a separate evidence file at:

`docs/runtime-release-gates.json`

## Commands

Validate the gate file structure without requiring completion:

```bash
npm run runtime:gates
```

Require every required gate to be passed with evidence:

```bash
npm run runtime:gates:require-pass
```

The second command is a **public-release gate**. It should remain red in an offline RC until real runtime testing is complete.

## Evidence rules

A gate marked `pass` must have at least one evidence entry. Good evidence includes:

- date
- Steam channel and client build
- operating system/device
- Millennium/Decky version
- SteamTrophies commit SHA
- concise measured result
- screenshot/video/log path when useful

Example evidence string:

```text
2026-09-08 | Steam Stable build ... | Windows 11 | Millennium 3.4.1 | commit abc1234 | warm library visible in 42 ms | docs/runtime-evidence/R06-windows-stable.md
```

Do not use evidence such as `looks fine`, `should work` or an offline unit test for a gate explicitly requiring live Steam.

## Required gates

The canonical list is machine-readable in `runtime-release-gates.json`. It currently covers:

- Stable cold start/reload
- Steam Beta smoke compatibility
- current header integration and fail-closed behavior
- large real-library discovery
- real warm-open measurement
- real unlock events and burst notifications
- offline cache behavior and corruption recovery
- controller-only Big Picture navigation
- live UI-mode switching
- pack import/game/achievement overrides
- real friend comparison
- physical Deck native/docked/sleep-resume
- Windows and Linux live package validation

## macOS

macOS is intentionally not listed as a required live injection gate in this RC because the public project host support must first be verified at finalization time. macOS **development/build/test** validation still belongs in CI. If upstream live macOS support becomes available and is actually tested, add a required runtime gate and update the platform documentation before claiming support.
