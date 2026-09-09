# Changelog

All notable project changes should be recorded here once public releases begin.

## 0.4.0-rc.2 desktop - 2026-09-09

- Actual trophy scaling, responsive row metrics, per-game artwork/fallbacks and live appearance previews.
- Pill switches, hover help, grouped settings, expanded gaming/pride palette gallery and safe custom gradients/colors.
- Independent border/tooltip overrides, tooltip layouts, remembered navigation, optional blur, scrollbars, header totals and release years.
- Local weekly/monthly/yearly trophy recap with explicit data coverage and honest completion-rarity upper bounds.
- Custom Base Game/expansion membership, collapsible counts, achievement search/progress/tier filters and historical Platinum presentation.
- Exclusive hidden/pinned states, compact game-header actions, serial settings saves and deduplicated cached reads.
- 83 automated tests and 135 isolated browser layout fixtures; live runtime release gates remain pending.
- Toast/overlay work intentionally deferred. Decky remains the separate read-only rc.1 adapter. See [details](docs/SETTINGS_RECAP_0.4.0-rc.2.md).

## 0.4.0-rc.1 - 2026-09-06

### Release-candidate hardening

- Added structural runtime validation for persisted library and game state.
- Added local-first compact-index recovery from validated per-game shards.
- Added last-known-good backup and corruption quarantine foundations.
- Refactored refresh shutdown so in-flight work, retries and timers are cancelled cleanly.
- Added frontend dismount lifecycle cleanup and Steam-surface ErrorBoundary containment.
- Hardened resource-pack validation with decoded PNG/JPEG/WebP dimension and pixel-count limits.
- Added deterministic hostile-pack security corpus.
- Added static runtime security audit.
- Added Top 50 gamer/Steam QA gate with explicit live-runtime evidence items.
- Expanded responsive/device matrix to 21 viewport/device scenarios.
- Bounded simultaneous trophy notifications and added burst audio cooldown/coalescing.
- Updated Starlight pin to 1.1.4 for this RC.
- Added release-validation umbrella scripts and repository consistency checks.
- Added community-facing setup, platform, security, contribution and release-gate documentation.

## 0.3.0-alpha.1 - Pass 3

- Added responsive Desktop/Big Picture/Deck foundations.
- Added exact achievement trophy overrides and named custom pack resources.
- Added Trophy Projects, pin/hide state and smart collections.
- Added notification/toast subsystem.
- Added independent surface layouts and accessibility scaling.
- Added dedicated Big Picture trophy shell and UI-mode bridge.
- Added CEF renderer compatibility guard and expanded resource-pack authoring tools.

## 0.2.0-alpha.1 - Pass 2

- Added versioned resource-pack system and secure managed directory imports.
- Added built-in packs and game/per-tier override UI.
- Added theme token and layout foundations.
- Added initial controller-native Big Picture presentation.

## 0.1.0-alpha.1 - Pass 1

- Added shared Trophy Core, rarity tiers, frozen award history and synthetic Platinum.
- Added earned-only large-library architecture, persistence, event history and scheduler.
- Added Millennium frontend/backend skeleton, Steam achievement adapters and benchmark fixtures.
