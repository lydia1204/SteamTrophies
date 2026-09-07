# Pass 3 research decisions

Research was re-run immediately before the Pass 3 implementation because resolution behavior and Steam GamePad UI are both places where copying historical plugin snippets is dangerous.

## 1. Steam UI renderer compatibility floor

Current DeckThemes/CSS Loader documentation still describes Steam's relevant CEF renderer as Chromium 85-era and documents distinct Steam CEF contexts including Big Picture, menus, Quick Access and notification toasts.

Consequences:

- no CSS container queries;
- no CSS `aspect-ratio` dependency;
- no `:has()` or modern container units;
- responsive components use `ResizeObserver` and semantic data attributes;
- a repository-level CEF85 CSS guard prevents accidental regressions.

See `RESPONSIVE_COMPATIBILITY.md`.

## 2. Steam Deck / docked output is not a fixed layout target

Valve documents 1280×800 native LCD/OLED Deck panels. The official Dock supports up to 4K60 or 1440p120. Valve support also exposes automatic/manual Gaming Mode UI scaling for external displays.

Therefore SteamTrophies never decides its shell layout from physical display resolution. It measures its rendered CSS-pixel container and tests representative output sizes only as regression fixtures.

## 3. Current Steam UI mode values are now verified

Pass 2 intentionally refused to guess `EUIMode` raw values. The current `@decky/ui` Steam client shared typings, read on 2026-09-06, define:

```ts
export enum EUIMode {
  Unknown = -1,
  GamePad = 4,
  Desktop = 7,
}
```

Pass 3 isolates those verified values in `frontend/runtime/steam-ui.ts`, calls `SteamClient.UI.GetUIMode()`, and subscribes with `RegisterForUIModeChanged()`. The normal Millennium plugin panel now switches live between `TrophyApp` and the dedicated `BigPictureTrophyApp` when Steam enters/leaves GamePad UI.

This compatibility mapping stays in one small bridge because Steam internals can change. The latest Decky frontend changelog continues to contain fixes for Steam beta component changes, reinforcing the need for thin volatile adapters.

Reference: https://raw.githubusercontent.com/SteamDeckHomebrew/decky-frontend-lib/main/src/globals/steam-client/shared.ts

## 4. Big Picture remains a distinct shell

The current Decky frontend library is explicitly built around exposing Steam Deck React UI components without clobbering the existing interface. Its July 2026 release also extends `ReorderableList`, while recent releases include fixes for Tabs, ErrorBoundary and fields after Steam beta changes.

Pass 3 therefore keeps Trophy Core and presentation state shared but isolates Steam-native focus/navigation touchpoints. The Big Picture shell consumes warm cached trophy state, `FocusRing`, its own per-surface dashboard order, Trophy Projects and customization view.

References:

- https://github.com/SteamDeckHomebrew/decky-frontend-lib
- https://github.com/SteamDeckHomebrew/decky-frontend-lib/blob/main/CHANGELOG.md
- https://docs.steambrew.app/plugins/ts/components/FocusRing

## 5. Trophy resource packs remain data-only

The final research pass found no reason to weaken Pass 2's security model. Runtime user packs remain validated directories copied into an isolated managed snapshot. Pass 3 extends manifest v1 backward-compatibly with:

- richer metadata;
- optional preview;
- up to 48 declared named `custom.*` trophy icons;
- optional per-tier WAV/OGG toast sounds;
- recommended surfaces.

Every imported regular file must now be declared by the manifest. Symlinks remain forbidden. Image/audio magic bytes are checked instead of trusting extensions. No scripts, CSS, SVG or executable content are accepted from user packs.

`.sttpack` remains the future archive transport for this same directory contract. No shell-based ZIP extraction was added because Millennium's documented Lua API still does not expose a trusted archive module. When an extractor is selected, it must unpack to staging and pass the exact same validator before promotion.

## 6. Theming foundation remains token-first

The first stable Design Tokens Community Group specification was published as 2025.10. Pass 3 continues using a smaller semantic token model inspired by that structure, with accessibility transforms and surface overrides, while postponing the visual editor until Pass 4 refinement.

Reference: https://www.designtokens.org/tr/drafts/format/

## 7. Steam hooks remain intentionally tiny

Millennium's current guidance favors Hooking API/server-router transforms over deprecated window-create/find-element patching. Pass 3 does not manufacture a compiled-Steam header regex from another Steam build. `hookedToolbar.TrophyButton` and `hookedBigPicture.TrophyApp` remain exported injection targets while the normal plugin panel already adapts to GamePad UI without needing a fragile route patch.

Reference: https://docs.steambrew.app/plugins/advanced/hooking
