# Gamer QA Top 50

This checklist is the release-candidate sniff test for SteamTrophies. It is intentionally gamer-centric rather than a generic enterprise QA form.

The list was synthesized from current Valve Steam Deck guidance, current Millennium/Steam Homebrew documentation and release history, current Decky guidance/community breakage patterns, and current achievement-tool feature/issue patterns such as Steam Achievement Notifier and Achievement Watcher.

## Status model

- **PASS** means the architecture/code has an offline engineering check, automated regression, or bounded design contract in this repository.
- **RUNTIME GATE** means an offline build is not allowed to pretend success. Codex must produce evidence from the current live Steam/Deck environment before release.

| # | Area | Priority | Gamer concern | RC status | Evidence |
|---:|---|---|---|---|---|
| 1 | Stability | critical | Never crash or hang Steam | RUNTIME GATE | Live Stable Steam soak/failure-containment test |
| 2 | Stability | critical | Survive Steam client updates and fail closed when hooks drift | RUNTIME GATE | Live Steam Beta compatibility pass plus hook transform validation |
| 3 | Performance | critical | Trophy screen opens instantly from warm local state | PASS | bench/library-scale.cjs warm-index budget |
| 4 | Performance | critical | Libraries with 2,000+ games stay responsive | PASS | 2,500-game/100,000-achievement benchmark and virtualized list |
| 5 | Performance | high | No network or full-library scan on the open path | PASS | TrophyService local-first boot and stale-while-revalidate architecture |
| 6 | Integrity | critical | An earned trophy is never silently revoked | PASS | core tests preserve awarded tiers through Steam reset/removal |
| 7 | Integrity | critical | Publisher achievement removals do not erase trophy history | PASS | retired earned-achievement preservation tests |
| 8 | Integrity | high | Rarity-at-award history remains stable | PASS | frozen awardedTier/global rarity tests |
| 9 | Integrity | high | Synthetic Platinum is deterministic and only awarded on true completion | PASS | Platinum unit tests |
| 10 | Library | high | Do not flood users with untouched 0% games | PASS | earned-only default visibility test |
| 11 | Library | high | Users can deliberately track exceptions to the 0% rule | PASS | trackedAppIds presentation state |
| 12 | Library | high | Search, sorting and smart trophy collections are fast and understandable | PASS | TrophyApp collections/search plus compact index |
| 13 | Library | medium | Pin and hide controls respect user intent | PASS | library presentation state and UI controls |
| 14 | Completion | high | Trophy Projects make active completion hunts easy to resume | PASS | projects package and UI integration |
| 15 | Completion | medium | Users can target individual locked trophies | PASS | project targetAchievementIds and game-detail controls |
| 16 | Notifications | high | Unlock notifications are immediate and readable | PASS | event-driven notification queue |
| 17 | Notifications | high | Burst unlocks do not create audio/toast spam | PASS | maxVisible, highest-tier burst sound and audioCooldownMs |
| 18 | Notifications | medium | Notification position, duration, artwork, sound and volume are configurable | PASS | NotificationSettings and validated preferences |
| 19 | Notifications | medium | Quiet hours and reduced-motion behavior are respected | PASS | quiet-hours tests and theme/accessibility compiler |
| 20 | Notifications | medium | Bronze/Silver/Gold/Platinum notification previews are testable without fake unlocks | PASS | notificationService.test and settings UI |
| 21 | Customization | high | Multiple quality trophy icon packs work out of the box | PASS | bundled Classic/Crest/Minimal/Crystal pack catalog |
| 22 | Customization | high | A user can override trophies for one specific game | PASS | GameTrophyOverridePanel and resolver precedence |
| 23 | Customization | medium | A game can mix different packs by trophy tier | PASS | tierOverrides resolver/UI |
| 24 | Customization | medium | One achievement can use a completely bespoke trophy icon | PASS | custom.* resources and achievementOverrides |
| 25 | Customization | high | Custom packs are easy to import, update, locate and remove | RUNTIME GATE | Exercise current Steam native directory picker/explorer workflow end-to-end |
| 26 | Customization | critical | Untrusted packs cannot execute code or escape their sandbox | PASS | runtime importer, static audit and hostile pack corpus |
| 27 | Customization | high | Themes are tokenized instead of hard-coded into components | PASS | ThemeEngine semantic variables and data-stt contract |
| 28 | Customization | medium | Dashboard widgets can be reordered/hidden per surface | PASS | LayoutEngine and LayoutEditor |
| 29 | Input | critical | Every Big Picture feature is usable without a mouse | RUNTIME GATE | Controller-only Big Picture focus walk on live Steam |
| 30 | Input | high | Focus is always visible and predictable | PASS | CEF85-safe focus styles, FocusRing and focus diagnostics |
| 31 | Big Picture | critical | Big Picture feels like a first-class trophy app, not a scaled desktop panel | PASS | separate BigPictureTrophyApp shell and shelves |
| 32 | Big Picture | high | Switching between Desktop and GamePad UI updates the shell cleanly | RUNTIME GATE | Live RegisterForUIModeChanged transition test |
| 33 | Deck | critical | Steam Deck native and docked layouts remain legible | RUNTIME GATE | Physical Deck LCD/OLED plus docked 1080p/4K pass |
| 34 | Display | critical | 720p, 1080p, 1440p and 4K layouts do not clip or overflow | PASS | 21-fixture resolution matrix |
| 35 | Display | high | 21:9 and 32:9 do not stretch content into unusable widths | PASS | ultrawide/super-ultrawide classifier caps |
| 36 | Display | high | Small and vertically cramped Steam windows remain usable | PASS | 360px/480px/min-window resolution fixtures |
| 37 | Accessibility | critical | Text and trophy icons scale to 200% without breaking virtualization | PASS | accessibility bounds plus scale-aware virtual row sizing |
| 38 | Accessibility | high | High contrast and reduced motion are independent of themes | PASS | separate accessibility state and token compiler |
| 39 | Offline | high | Previously loaded trophy data remains useful offline | PASS | local shards/index and network-free recovery path |
| 40 | Recovery | critical | Corrupt local state cannot permanently brick the trophy library | PASS | runtime schema validation, .bak fallback, quarantine and local shard rebuild |
| 41 | Recovery | high | Bad themes/packs have a clear Safe Mode escape hatch | PASS | SafeModeState, diagnostics and fallback behavior |
| 42 | Privacy | critical | No telemetry or unrelated data collection | PASS | static network audit and architecture docs |
| 43 | Privacy | high | Friend comparison uses Steam data without requiring the friend to install the plugin | RUNTIME GATE | Validate live Steam friend APIs/privacy behavior with real accounts |
| 44 | Security | critical | Secrets are not placed in URLs, logs or frontend persistence | PASS | x-webapi-key header tests and static audit |
| 45 | Security | critical | Host integration contains render failures instead of crashing the Steam window | PASS | Steam ErrorBoundary plus tiny compatibility bridges |
| 46 | Updates | high | Volatile Steam private hooks live behind tiny replaceable adapters | PASS | Hooking API architecture and empty-until-verified header transform |
| 47 | Updates | critical | The current Steam header integration is verified against the exact shipping client build | RUNTIME GATE | Codex must inspect and test current served chunk before enabling patch |
| 48 | Support | high | Diagnostics and troubleshooting expose enough information to recover without deleting everything | PASS | DiagnosticsPanel, storage stats, safe mode and troubleshooting docs |
| 49 | Support | high | Install/build/device documentation is understandable to ordinary Steam users and contributors | PASS | README, platform matrix, resource-pack and troubleshooting docs |
| 50 | Release | critical | Release artifacts are reproducible, audited and tested on supported host/device combinations | PASS | release:validate, CI matrix and evidence-bearing runtime release gates |

## Research anchors

- Valve Steam Deck / Steam Machine recommendations: https://partner.steamgames.com/doc/steamhardware/recommendations
- Millennium current plugin documentation and Hooking API: https://docs.steambrew.app/plugins/
- Millennium releases: https://github.com/SteamClientHomebrew/Millennium/releases
- Decky Loader development/readme: https://github.com/SteamDeckHomebrew/decky-loader
- CSS Loader theming/Steam CEF notes: https://docs.deckthemes.com/CSSLoader/theming_step_by_step/
- Steam Achievement Notifier: https://github.com/SteamAchievementNotifier/SteamAchievementNotifier
- Achievement Watcher: https://github.com/xan105/Achievement-Watcher

The community sources are used as experience signals, not as authoritative security or API documentation. Official Valve/Millennium/Decky documentation wins whenever they disagree.
