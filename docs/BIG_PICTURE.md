# Big Picture / GamePad architecture

Big Picture is a first-class SteamTrophies shell, not a scaled desktop overlay.

## Pass 3 behavior

`frontend/components/BigPictureTrophyApp.tsx` consumes the same warm Trophy Core state as Desktop and provides:

- controller-focusable game shelves using Millennium `FocusRing`;
- profile and four-tier totals using active resource packs;
- Trophy Projects;
- Nearly Complete;
- Recent Trophy Activity;
- Completed/Platinum games;
- All Trophy Games;
- per-surface widget order/visibility;
- controller-reachable customization;
- shared game-detail/per-achievement customization;
- responsive layout based on the actual rendered CSS-pixel container.

## Live UI-mode switching

Current `@decky/ui` shared Steam typings define `EUIMode.GamePad = 4` and `EUIMode.Desktop = 7`. Pass 3 isolates this compatibility mapping in `frontend/runtime/steam-ui.ts`.

The normal Millennium plugin content calls `SteamClient.UI.GetUIMode()` and listens to `RegisterForUIModeChanged()`. It switches live between `TrophyApp` and `BigPictureTrophyApp` without rebuilding Trophy Core or rescanning Steam.

Unknown UI modes fail toward the desktop shell. Do not spread raw enum values beyond the compatibility bridge.

## Steam hook boundary

`hookedBigPicture.TrophyApp` and `hookedToolbar.TrophyButton` remain exported for deeper native placement.

Do not scatter compiled Steam selectors or minified chunk assumptions through the Trophy UI. Current Millennium guidance favors server-router Hooking API transforms and deprecates older find-element/window-create patching for this job.

A future verified Steam main-menu/game-page patch should insert a tiny SteamTrophies entry component and fail closed when its anchor disappears. The plugin is already usable in GamePad mode through its normal plugin content even before those optional deep placements are wired.

## Controller requirements

Important Big Picture functionality must never require hover, right-click, a tiny scrollbar, or mouse-only dragging. Layout customization therefore supports focusable move-up/move-down/show/hide actions rather than relying only on drag.

Pass 4 can replace those controls with the most native current Steam `ReorderableList` interaction after testing focus restoration on the target Steam build. Persisted layout state will not change.

## Resolution

See `RESPONSIVE_COMPATIBILITY.md`. Big Picture measures its container with `ResizeObserver`, caps shelf density, maintains TV-safe padding, and avoids CSS features newer than Steam's documented CEF floor.
