# Desktop settings and recap — 0.4.0-rc.2

This is an experimental desktop presentation update. Windows, Linux and experimental macOS installation instructions remain in the [README](../README.md). The Decky adapter remains a separate, read-only 0.4.0-rc.1 package; these desktop features do not imply Decky feature parity.

## What changed and how to use it

- **Actual trophy scaling:** Appearance → Size & readability changes the glyph itself, including the default sprite-sheet artwork. Achievement picture size and text size are independent. Larger fonts and glyphs receive the space they need; narrow windows put counts below the artwork instead of clipping them.
- **Artwork:** portrait, landscape and square icons retain their aspect ratios. Open a game’s artwork button to override its style and permitted fallback order, including no fallback. “Allow fallback shape changes” changes the frame width to the fallback’s natural proportions; off retains the selected frame with contained artwork. Rows remain aligned at a common height. Missing art is never stretched or cropped to impersonate another shape.
- **Controls:** binary checkbox controls are pill switches with stable accessible labels and keyboard activation. Click a switch or its label. Help question marks explain settings; header and action buttons have hover hints. Sliders no longer receive a full-field focus rectangle; their thumbs retain keyboard focus feedback.
- **Settings organization:** Appearance uses labeled groups for art, sizing, borders, library information, themes, window behavior, recap, tooltip colors and custom colors. Library & data separates maintenance, hidden games, pins and projects. Stopping a project removes that project, not an unrelated tracking preference.
- **Live previews:** settings apply immediately; the Appearance sample card and sample achievements show current artwork, sizes, borders and tooltip layouts. Hover/focus sample awards to inspect the tooltip. These are presentation-only fixtures: no saved trophies, events, sounds or library imports are produced.
- **Themes:** gaming and pride-inspired palettes join Midnight/OLED/Steam Blue/High Contrast. Swatches show the palette. The custom editor supports semantic colors, a second gradient color, two gradient directions and optional slow drift. It does not accept raw CSS, scripts, URLs or flashing animation presets. Pride palettes are design interpretations, not an exhaustive identity catalogue or official flags.
- **Border overrides:** Bronze/Silver picture outlines remain optional and off by default. Picture-border and tooltip-glow overrides are independent. Manual colors win over theme border colors; the theme-border switch lets you keep conventional trophy colors. Optional Bronze/Silver shines follow the animation settings. System reduced motion still wins.
- **Tooltips:** title-first, description-first and compact layouts. Platinum uses the recorded original finishing achievement rather than the latest unlock after a catalogue expansion. The separate original achievement row can be shown or hidden without changing counts or unlock history.
- **Window behavior:** remember the screen, settings tab, search and library/detail scroll position for this Steam session, or reopen the main library. Optional blur affects the originating Steam DOM page; separate native Store/browser views may not blur. No global host settings are changed.
- **Library details:** optional earned-trophy header total, independently optional release years in the library and game detail, and scrollbar visibility/color/thickness. Hidden scrollbars consume no gutter; scrolling remains available. The scrollbar’s thumb length still represents visible content, rather than a misleading fixed length.
- **Pins and hidden games:** corner icons indicate either state. Pinning a hidden game restores and pins it. Hiding a pinned game unpins it. The earned/total count remains centered vertically.
- **Achievement browsing:** search titles and descriptions, filter earned/unearned, and filter Bronze/Silver/Gold. Hidden locked descriptions are not exposed through search. Header actions are compact icons with descriptive hints.

## Base Game / expansion groups

In a game, open the artwork/settings button and create groups. Give each a name, choose Base Game or expansion, and assign achievements. Membership is exclusive; moving an achievement does not duplicate it. Unassigned achievements remain under “Ungrouped achievements.” Delete a group without deleting any achievements. Appearance controls whether all groups, only base groups or no groups start expanded. Each heading shows real earned/total counts and an optional rarity bound.

**No automatic or fabricated DLC split is shipped.** The available achievement records do not provide verified DLC membership. Free updates must not silently be labeled paid DLC. Forager’s known Completionist achievement can prove an older Platinum even when newer achievements remain locked; it does not establish the membership or release dates of every later group. A verified mapping can be added later through this explicit grouping foundation.

## Completion rarity: why the ≤ symbol matters

The percentage earning every achievement cannot exceed the percentage earning the rarest individual achievement. Marginal percentages do not tell us the overlap between players, so multiplying them would produce a misleading answer. This release therefore shows an **upper bound**, not exact joint completion rarity. If any achievement lacks verified rarity, the bound is unknown. The same rule applies to groups. Both displays default on and have explanatory tooltips.

## Recap coverage

Use the recap icon beside Settings. Weekly means the last seven local calendar days including today; monthly/yearly mean the current calendar month/year through now. Your chosen period and hidden-game inclusion preference are saved, and can also be set in Appearance.

Included: trophy tier counts, recorded Platinum awards, games with awards, achievement-active days, longest achievement-day streak, top games by achievement unlocks, and the rarest dated achievement using current verified rarity. Duplicate game snapshots are counted once; future dates and locked achievements are excluded; undated achievements are reported as unavailable for period attribution. Saved game records load with four bounded concurrent readers and no discovery or refresh.

Unavailable: play hours, sessions, single/multiplayer split, device/controller split, genre playtime, subscription activity and community comparisons. Achievement-day streaks are not gaming streaks. These distinctions avoid implying parity with Steam Replay or PlayStation Wrap-Up.

## Safety and performance

Preferences are backward-compatible additions. Existing game shards, overrides, pins and hidden games are preserved. Colors and enums are allowlisted, group IDs and membership are validated, and settings use the existing bounded atomic backend writer. Rapid slider changes publish instantly and disk writes serialize complete snapshots, preventing stale writes from dropping another preference. Preview, Platinum and recap readers share an in-flight read for the same game. Visual-only settings no longer discard trophy-asset caches.

The full local engineering suite passed: **83 tests**, 21 responsive-classification fixtures, CEF85 CSS guard, Decky TypeScript/build/Python checks, security scan, hostile-pack corpus, repository checks and the 2,500-game benchmark. A separate **135-case isolated Chrome layout test** covers 360–1920 CSS-pixel widths, three artwork modes and 80/100/200% font/icon combinations. These tests do **not** certify live Steam interaction, Windows/Linux host behavior or physical Deck/controller behavior. Broad runtime release gates remain pending.

For the isolated layout test, build test output, install/provide Playwright separately, then run `node scripts/presentation-layout-qa.cjs`. Set `STT_PLAYWRIGHT_MODULE` to an available module path if needed; `STT_QA_CHROME=1` uses installed Chrome in a new isolated headless profile. It does not control Steam, connect to personal browser profiles, or take screenshots.

## Deferred work

Toast delivery, custom toast layouts, audio/visual notification preview expansion and the macOS Steam overlay investigation are deliberately deferred at the user’s request. Existing notification controls remain available; common switch/hint styling does not change delivery behavior. No Millennium host patch, Vulkan-option change or overlay repair is claimed.

## Sources informing the design

- [WAI switch pattern](https://www.w3.org/WAI/ARIA/apg/patterns/switch/): stable labels, state semantics and keyboard interaction.
- [PlayStation 2025 Wrap-Up](https://blog.playstation.com/2025/12/09/playstation-2025-wrap-up-launches-starting-today-explore-your-personalized-gaming-recap-for-2025/): comparison of recap categories, without claiming access to PlayStation data.
- [Steam community discussion of recap streak interpretation](https://steamcommunity.com/discussions/forum/0/685240596077497240/): user confusion informed explicit local date boundaries and the achievement-day label; community speculation is not treated as technical authority.
