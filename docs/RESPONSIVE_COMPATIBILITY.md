# Responsive and resolution compatibility

Pass 3 treats display compatibility as a runtime layout problem, not as a list of hard-coded monitor resolutions.

## Core rule: measure the actual CSS-pixel container

Steam can independently scale GamePad/Big Picture UI, especially when Steam Deck is docked. The physical panel mode is therefore not a reliable input for layout. `frontend/components/ResponsiveBoundary.tsx` observes the rendered SteamTrophies root with `ResizeObserver` and feeds the measured CSS-pixel width/height into `packages/customization/src/responsive.ts`.

The responsive classifier emits stable semantic bands:

- width: `micro`, `compact`, `narrow`, `standard`, `wide`, `ultrawide`;
- height: `cramped`, `short`, `standard`, `tall`;
- aspect: `portrait`, `squareish`, `landscape`, `cinematic`, `super_ultrawide`;
- capped shelf column count;
- safe inline/block padding;
- conservative density hints.

React exposes these as `data-stt-width-band`, `data-stt-height-band`, `data-stt-aspect-band`, and CSS variables. CSS reacts to those attributes. This gives SteamTrophies container-responsive behavior without CSS container queries.

## Why no CSS container queries or `aspect-ratio`

The DeckThemes/CSS Loader documentation currently describes Steam's embedded CEF renderer as Chromium 85-era. Container queries arrived in Chromium 105 and the CSS `aspect-ratio` property in Chromium 88. Pass 3 therefore avoids both on purpose.

The CEF85-safe styling subset used here favors:

- CSS custom properties;
- Grid/Flexbox;
- `minmax()`;
- `min()`/`max()`/`clamp()`;
- traditional media queries for the outer browser window;
- `ResizeObserver` for component/container measurement;
- ordinary `:focus` as the controller/keyboard focus fallback.

`scripts/check-cef85-css.cjs` fails verification if future changes introduce known-incompatible constructs such as `@container`, the `aspect-ratio` property, `:has()`, container-query units, dynamic viewport units, subgrid, `color-mix()`, or `:focus-visible` as a required selector.

## Permanent regression matrix

`RESOLUTION_TEST_MATRIX` and `npm run resolution:test` cover these CSS-pixel layouts:

| Fixture | Size | Surface | Purpose |
| --- | ---: | --- | --- |
| Minimum desktop | 520×560 | Desktop | Resized Steam window, no horizontal overflow |
| 720p TV | 1280×720 | Big Picture | Low-height living-room target |
| Steam Deck | 1280×800 | Deck | Native LCD/OLED panel reference |
| 1080p TV | 1920×1080 | Big Picture | Primary TV layout |
| 1440p | 2560×1440 | Desktop | High-resolution desktop |
| 21:9 | 3440×1440 | Desktop | Ultrawide restraint |
| 4K | 3840×2160 | Big Picture | Dock/TV maximum reference |
| 32:9 | 5120×1440 | Desktop | Super-ultrawide, capped content density |

The 32:9 case deliberately tops out at six shelf columns. SteamTrophies should gain breathing room on very wide displays, not keep adding ever-smaller cards.

Steam Deck is capped at three shelf columns even when a large measured width is reported by a wrapper. The separate Deck shell can tighten this further when implemented with Decky.

## Text and icon scaling

Accessibility text and icon scale are independent of display classification and may reach 200%. Virtualized desktop rows derive their height from text scale and the list observes its real viewport height, preventing the classic fixed-row virtualization bug where enlarged text overlaps neighboring rows.

Big Picture headings/cards use bounded `clamp()` sizing rather than scaling every pixel linearly with 4K output. Steam/SteamOS may already scale the UI before SteamTrophies sees it.

## Safe areas and TVs

The outer overlay and Big Picture footer account for CSS `env(safe-area-inset-*)` where exposed by the renderer. Big Picture also maintains its own safe padding derived from the measured viewport instead of placing interaction targets flush against television edges.

Valve's official Dock documentation supports up to 4K60 / 1440p120, and Valve's docking support explicitly documents automatic/manual Gaming Mode UI scaling. Those are the reasons physical display resolution is treated as a test fixture rather than a layout switch.

## Research references, verified 2026-09-06

- Steam Deck technical specifications: https://www.steamdeck.com/en/tech
- Steam Deck Docking Station: https://www.steamdeck.com/en/dock
- Valve Steam Deck docking/display support: https://help.steampowered.com/
- CSS Loader theming docs / Steam CEF contexts: https://docs.deckthemes.com/CSSLoader/theming_step_by_step/
- MDN `ResizeObserver`: https://developer.mozilla.org/docs/Web/API/ResizeObserver
- Chrome platform support references used to establish the CEF85 floor: Chrome 79 `clamp()`, Chrome 84 flex gap, Chrome 88 `aspect-ratio`, Chrome 105 container queries.
