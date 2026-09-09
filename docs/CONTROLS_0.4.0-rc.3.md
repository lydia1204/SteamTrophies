# Controls and accessibility — 0.4.0-rc.3

Experimental desktop UI follow-up. The separate Decky adapter is unchanged. This does not repair Steam overlay or in-game toast delivery.

Published: [rc.3 prerelease and checksums](https://github.com/lydia1204/SteamTrophies/releases/tag/v0.4.0-rc.3). [Cross-platform CI and package build passed](https://github.com/lydia1204/SteamTrophies/actions/runs/34407428513). The downloaded artifact passed local Starlight verification, and GitHub's published SHA-256 matches it. Local installation remains pending until Steam is fully closed; this pass did not refresh/reimport or modify the live trophy data.

## Changes

- Settings navigation: Back now sits beside Close on the right. Back returns to your trophy library; Close closes the whole trophy window.
- Compact switches: 38 × 22 CSS pixels with contained thumbs, even inside settings panels whose general button rules previously made them oversized.
- Appearance → Controls & accessibility: choose switches (default) or checkboxes, top tabs or a left sidebar, and a help cursor or ordinary cursor. Narrow windows fall back to top tabs.
- Real help popups: every existing question-mark hint opens a themed tooltip on hover or keyboard focus, supports Escape, and stays open while you move onto it. Tooltips render outside the scrolling panel so they are not clipped by its edges. Hint markers sit beside their labels.
- Color pickers: compact 44 × 34 swatches rather than stretched lines. Custom trophy artwork tints are independent of picture-border and tooltip colors and preserve the source's shading/alpha. Reset artwork tints restores original pack art or the active accessibility palette; it does not reset your other colors.
- Color-blind support: alternative red–green, blue–yellow and grayscale palettes with B/S/G/P markers. These are readability choices, not a promise that one palette suits everyone. Manual trophy/border colors override the presets. High contrast still controls surface/text contrast and disables decorative toast glow.
- Animation speed: 0.25×–3× for trophy shine, tooltip auras, toast entrances and gradient drift. It does not change audio pitch/speed, toast lifetime or refresh timing. Animation-off/system reduced-motion preferences still win.
- Toast appearance: Off/Soft/Bright glow and a silent inline preview that replays when animation, glow or speed changes. Existing seven entrance choices remain. Native Steam placement and delivery are unchanged.
- Pin feedback: a pinned game’s header button turns blue and gains a minus/unpin marker; its accessible label and pressed state update too.
- Steam toolbar: trophy symbol reduced from 20 to 16 CSS pixels; the button retains its click target.
- Refresh: uses the trophy-with-refresh-arrows icon from the supplied sheet. Its activity indicator is anchored inside that button instead of floating beside Settings.
- Minimal names: Signature, Crest, Minimal, Crystal; Classic Green replaces Classic Steam Green. Pack/theme IDs and imported pack names are unchanged.
- New-user Bronze/Silver picture frames default on. Saved explicit off choices are preserved.

## Audio and editions: not delivered by this patch

Custom WAV/OGG/MP3 sounds already work through an imported, validated trophy pack manifest. Choose its audio independently under Notifications → Sound pack; the existing Test buttons preview cues without awarding trophies. A loose MP3 folder is not a pack. See [pack instructions](RESOURCE_PACKS.md).

The four bundled artwork packs currently share their corresponding tier sounds; they are not four distinct sound libraries. New professionally designed sound collections and ElevenLabs integration are deferred. No voice/audio service has been connected or charged.

The required no-injection standalone edition and signed Windows installer/updater are a separate delivery milestone, **not implemented here**. See [edition and distribution requirements](EDITIONS_AND_UPDATES.md). The current `.star` remains a Millennium add-on, not a standalone app or Windows `.exe`.

## Validation and remaining checks

Local automated coverage: 85 unit/integration tests; full release validation (TypeScript, Decky build/Python, CEF85 guard, security/hostile-pack tests, responsive matrix, repository checks, 2,500-game benchmark); 135 isolated CSS layout fixtures; nine isolated React control scenarios at 360/800/1280-pixel widths and 80/100/200% scaling. The React scenarios cover switch/checkbox changes, thumb bounds, color swatches, hint placement, hover/focus/Escape/unmount behavior, tint filter creation, tier labels and glyph sizing.

These checks do not constitute live Steam UI validation or Windows/Linux/Deck hardware validation. After installation, check Settings Back/Close, hint hover, toggle style, sidebar, tint reset, pin/unpin, toolbar alignment and a normal explicit refresh when you actually want one. Confirm existing pins, hidden games and saved settings survived. Do not refresh merely to install this build.

Optional browser QA: install React 19.1.1, React DOM 19.1.1, esbuild 0.25.9 and Playwright into a separate test directory, then run `npm run build:test` and `node scripts/controls-browser-qa.cjs`. `STT_QA_NODE_MODULES` points at that directory’s node_modules; `STT_PLAYWRIGHT_MODULE` selects Playwright; `STT_QA_CHROME=1` uses installed Chrome in a new headless profile. Tests do not connect to Steam, use personal browser profiles or read trophy data.

## Design sources

- [WAI tooltip pattern](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) informed hover/focus, Escape and hoverable popup behavior; the APG notes this pattern is still in progress.
- [WCAG use of color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) informed visible tier letters rather than relying on recoloring alone. This is not a claim of whole-app WCAG certification.
