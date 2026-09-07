# Platform and device matrix

This document separates **code/build compatibility** from **verified live host support**. A green TypeScript build on an operating system does not prove that the current Steam plugin host injects there.

## Runtime families

| Target | Shell | Shared systems | Release expectation |
| --- | --- | --- | --- |
| Steam Desktop, Windows | Millennium | Trophy Core, storage, packs, themes, layouts | Primary |
| Steam Desktop, Linux | Millennium | Same | Primary |
| Steam Big Picture | Millennium GamePad shell | Same | Primary |
| Steam Deck Desktop Mode | Millennium/Linux | Same | Supported when host stack is supported |
| Steam Deck Gaming Mode | Decky shell | Same Trophy Core/contracts | Requires physical-device validation |
| macOS development | Local Node/TS/Python tooling | Shared packages | Supported for development/testing |
| macOS live Steam | Depends on current upstream host | Same intended contracts | Do not claim until upstream support and live validation exist |

## Automated viewport matrix

The release candidate currently exercises 21 measured CSS-pixel layouts:

| # | Fixture | Width | Height | Intent |
| ---: | --- | ---: | ---: | --- |
| 1 | Emergency narrow | 360 | 640 | Extreme narrow fallback |
| 2 | Portrait compact | 480 | 800 | Portrait/resized stress |
| 3 | Short desktop | 720 | 480 | Height-constrained fallback |
| 4 | Minimum desktop | 520 | 560 | Minimum supported desktop test |
| 5 | Handheld class | 1024 | 600 | Small landscape handheld |
| 6 | 720p Big Picture | 1280 | 720 | TV/GamePad |
| 7 | Steam Deck native | 1280 | 800 | Deck native panel |
| 8 | Common laptop | 1366 | 768 | Legacy/common laptop |
| 9 | 900p desktop | 1600 | 900 | Mid-size desktop |
| 10 | 1080p Big Picture | 1920 | 1080 | TV/GamePad |
| 11 | 16:10 desktop | 1920 | 1200 | Taller desktop |
| 12 | 21:9 compact | 2560 | 1080 | Ultrawide |
| 13 | 1440p desktop | 2560 | 1440 | High-DPI/common gaming display |
| 14 | 3440 ultrawide | 3440 | 1440 | 21:9 |
| 15 | Dual-wide | 3840 | 1080 | Extreme horizontal stress |
| 16 | 4K Big Picture | 3840 | 2160 | Docked/TV |
| 17 | G9 / 32:9 | 5120 | 1440 | Super-ultrawide |
| 18 | 5K2K | 5120 | 2160 | High-resolution ultrawide |
| 19 | 5K Retina stress | 5120 | 2880 | High-density layout stress |
| 20 | Docked Deck 1080p | 1920 | 1080 | Deck external display |
| 21 | Docked Deck 4K | 3840 | 2160 | Deck external display |

The UI intentionally caps useful content density. Wider monitors gain breathing room and larger presentation space rather than an unbounded number of tiny trophy cards.

## Input matrix

Public release validation should cover:

- mouse
- keyboard-only navigation
- Xbox-style controller
- PlayStation-style controller where Steam Input exposes ordinary gamepad navigation
- Steam Deck built-in controls
- touch where available, without making touch the only way to reach a function

## Lifecycle matrix

Runtime validation should include:

- cold Steam start
- plugin reload/unload
- Steam client restart
- first-run discovery
- interrupted discovery then restart
- game running while background refresh operates
- offline start with existing cache
- network reconnect
- sleep/resume on Deck
- external display connect/disconnect on Deck
- Steam Stable
- Steam Beta compatibility check

## Renderer compatibility

Responsive layout uses measured container size through `ResizeObserver` plus conservative Flex/Grid/CSS variables rather than assuming physical display resolution.

`npm run check:cef85` protects the current renderer compatibility policy from accidentally adopting CSS features outside the intended Steam CEF floor without an explicit project decision.
