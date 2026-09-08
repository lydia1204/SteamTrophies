# Desktop QA update — September 8, 2026

## Earlier installation and evidence

Installed local unsigned RC package SHA-256: `5309dea56f3d54315479f0fba6f4628b95b9e955960027fffb85558150ada1f0`.

Rollback backup: `~/Library/Application Support/Millennium/backups/qa-2026-09-08-fyqT6u/` contains the previous plugin and a complete state archive. Installation copies only the plugin. No refresh, reimport, achievement reset, or data migration script was run.

Before installation: 336 indexed games; the current saved hidden-ID list was empty. Aggregate hash of index, preferences, discovery ledger and all game-directory files: `9e3fdbaeaa79ffede00c983f9448bd604a0287b5f067b07fcf37284b6ea0b535` (675 files).

Validation: 58 tests passed; 21 responsive-metrics fixtures passed; 15 deterministic pack-security cases passed, plus symlink rejection; frontend/core/Decky type checks and build passed; Lua syntax validation passed; CEF85 CSS guard, repository checks and 2,500-game performance budget passed. Starlight verified all five package sections. Its repository-wide LSP scan still reports four unrelated Decky snake-case FFI diagnostics; the scoped Millennium package compiled and verified successfully.

Live read-only evidence before installation: Steam's native toaster exists and its renderer patch is active. Steam's app store resolves rectangular vertical capsule URLs. These checks are not proof of visual notification delivery. New UI behavior remains user-validated, not screenshot-automated. General release gates remain 20 pending.

After installation, Steam loaded the plugin and exposed exactly one header trophy button. When the user opened Terraria, the detail scroller measured 844 px high with 12,600 px of content and `overflow-y: auto`. The index remained 336 games; only Terraria's index entry and discovery-ledger timestamp changed through its normal detail-page refresh. Preferences and Gear Up's shard remained byte-identical to the backup. These measurements establish scroll capacity, not user-confirmed wheel behavior or visual polish.

## Changes and user acceptance checks

| Area | Implemented change | Live check |
|---|---|---|
| Refresh status | Completed results have a Dismiss button; progress remains visible while busy | Dismiss a completed refresh without restarting |
| Artwork | Rectangular library capsules by default; square icons selectable in Appearance | Confirm cards and switch styles |
| Borders | Gold shimmer/pulse; optional bronze/silver borders default off | Confirm motion and optional borders |
| Tooltips | Trophy and title first, description next, date and rarity inline; no redundant tier word | Hover a recent achievement |
| Tooltip effects | Gold ray/glow border; blue completion tooltip | Hover Gold and an earned Platinum |
| Completion detail | Latest earned achievement shown only if all achievement dates are known | Unknown-date completions do not fabricate a final achievement |
| Preview strip | Width-based capacity, no fixed ten-achievement limit; one line | Resize and adjust artwork size |
| Pins | Accent-blue pin above count; right-click menu offers pin/unpin | Right-click anywhere on a game row |
| Hidden games | Funnel option shows only hidden games; right-click Restore; existing Settings recovery retained | Hide a game, find it, restore it |
| Labels | Platinums; Search games... | Confirm text |
| Detail page | Explicit bounded scrolling; close button joins action row | Scroll through a long achievement list |
| Detail trophies | Larger trophy, rarity on its left, tier-colored right-to-middle gradient | Check Gold/Silver/Bronze rows |
| Legacy editor | Per-achievement Icon button hidden/deprecated; code and saved overrides retained | No Icon buttons in normal achievement rows |
| Density | Reduced library row height; achievement artwork size setting (32–72 px) | Check compactness without overlap |
| Diagnostics | Label/value flex gap | Confirm numbers no longer touch labels |
| Popup focus | Blur closes popup after 250 ms; header focus is cleared; native folder picker guarded | Click Steam, reopen, import a pack folder |
| Toasts | Local renderer in trophy popup; native Steam toaster outside it | Test each tier, then verify a real subsequent unlock |
| Animations | Slide, Fade, Rise, Zoom, Bounce, Flip, None; reduced-motion support | Change selection and test |
| Sound packs | Independent sound-pack selection; MP3 support alongside WAV/OGG | Import a pack with MP3 files and select it for sounds |

Position selection applies to the local popup renderer. Outside the trophy popup, Steam owns placement of its native notification window. MP3 files use the existing data-only directory-pack contract (four trophy images plus optional tier sounds); see RESOURCE_PACKS.md. No audio-only archive importer was added.

## Gear Up date investigation

The live, read-only `SteamClient.Apps.GetMyAchievementsForApp('214420')` call returned success and `NEW_NEPTUNES_DISCIPLE` achieved with `rtUnlocked = 1788775114`. That exactly matches the cached timestamp. The plugin cannot reconstruct an earlier date from that response; no date or Steam achievement was altered. Keep the game hidden if this record resulted from an old test.

Separately fixed a real normalization flaw: a newly imported achievement with no unlock timestamp no longer receives the import time as its earned date. Synthetic Platinum also remains undated when completion dates are incomplete. Existing known dates are preserved. Regression tests cover both cases.

## Sources reviewed

- [Valve achievement/unlock-time contract](https://partner.steamgames.com/doc/api/ISteamUserStats#GetAchievementAndUnlockTime): achievement state and unlock timestamps are distinct; unknown dates must not be replaced with import time.
- [Millennium native toaster implementation](https://github.com/SteamClientHomebrew/Millennium/blob/main/src/typescript/sdk/src/sharedjscontext/hooks/toaster-hook.tsx): React toast content, duration, sound suppression and dismissal.
- [Millennium plugin configuration](https://docs.steambrew.app/plugins/structure/config): scoped frontend/backend packaging and reload behavior.
- Community compatibility context: [startup regression discussion](https://github.com/SteamClientHomebrew/Millennium/issues/837), [platform packaging discussion](https://github.com/SteamClientHomebrew/Millennium/discussions/832). These are contextual reports, not evidence of this Mac's specific defect.

## Follow-up: hover dismissal, missing portraits, real notifications

Installed follow-up package SHA-256: `60fac0421303d096575d8f4528192a8f7c20d7d857131ba2d5c73386d32c6ea4`. Steam reopened successfully at 13:04 EDT on September 8. All 945 saved-state files were unchanged across both installation steps, aggregate SHA-256 `3c16e030a6ceba7b7bcb11d408729181c04a880afe3b273a392370975e88c4c2`.

Rollback to the preceding working build: `~/Library/Application Support/Millennium/backups/notification-fix-2026-09-08-XICeIy/` contains the `5309dea…` plugin and a complete state archive. `~/Library/Application Support/Millennium/backups/native-compat-2026-09-08-ci8YND/` additionally preserves the intermediate package and state. Installation copied only the plugin; no refresh or reimport was run.

The intermediate `9356da…` build exposed a live-only issue: Steam's bound `ProcessNotification` action is read-only. The final transport calls that action rather than replacing it, and a regression fixture now reproduces the protected property. The Webkit entry also now exports its installer as required by the installed loader, fixing its previous `exports is not defined` startup error. The build tool emits HMR requests even with a separate output directory and auto_restart false; do not mistake those messages for installation verification.

### Observed evidence

- User confirmed local notification previews produce both sound and visuals.
- Gear Up's Steam-resolved vertical capsule URL returned HTTP 404. Its square icon was being cropped to fill the portrait slot, producing the oversized G. Missing artwork is not a missing game or failed achievement import.
- Two real Terraria unlocks reached the event log within about one second: `DEFEAT_OLD_ONES_ARMY_TIER3` at September 8, 03:41:17 EDT; `GET_GOLDEN_DELIGHT` at 05:45:24 EDT. Terraria now has 107 earned achievements. No synthetic unlocks were made for this investigation.
- At both event times, retained Steam console output reported the Millennium toast renderer did not implement location 2 and fell back to a Gamepad QAM toast. Steam's global and in-game toast-disable settings were both false. This establishes a delivery/rendering defect, not missing achievement callbacks; it does not prove whether the custom audio played.

### Changes

- Removed focus/blur dismissal entirely. Only trusted pointer presses in other Steam documents or Store/Community BrowserViews dismiss the popup. Webview relay sends a no-argument signal, never page content or URLs. Native folder-picker protection remains. Clicking another macOS application is not yet covered by this pointer-only implementation; do not reintroduce blur as a proxy for a click.
- Failed portraits use a centered, uncropped square icon. Failed URLs are retained for the component lifetime so a missing fallback does not cycle between failed image sources.
- Added an ownership-guarded native toast renderer on the SDK's existing trampoline; Steam and other plugins continue through the original renderer. Normalizes our SDK notification ID and timestamp to the current Steam contract. Suppresses only the extra native cue attached to our toast; Steam's achievement sound and notification preferences are unchanged.
- Routes only our already-accepted queued toast into a matching game-overlay queue that Steam has actually registered. Never invents an overlay registration or resurrects a toast suppressed by Steam. A delayed preview uses a game overlay only when exactly one exists. Otherwise the desktop delivery path is retained.
- Native delivery gets a bounded 60-second queue wait; its configured visible duration begins when our renderer mounts. Dismissal removes only the exact owned entry and its SDK tray item. Hooks are removed on plugin unload.
- Added a 10-second outside-window preview and recent delivery diagnostics (event received, route, renderer mounted, audio started/failed/suppressed). These are diagnostic stages, not claims of user-visible success.

### Validation and next user tests

65 tests passed, including seven new ownership/routing/dismissal, protected-Steam-method, and pointer-only regression cases. Full release validation, actual SDK typecheck, Lua validation, and all five unsigned package sections passed. Existing broad release status remains 20 pending runtime gates. The package scanner still emits the four known unrelated Decky FFI diagnostics.

Read-only startup checks on the final installed build confirmed exactly one header trophy button, the frontend pointer relay, the ownership-scoped renderer hook and sound guard, and Steam's unchanged read-only ProcessNotification action. The Store BrowserView's Millennium isolated execution context contains the pointer relay and default installer; its ordinary webpage context intentionally does not. No new plugin setup or webview export error was found. The Steam log still contains an unrelated generic rejected object without a plugin-specific stack; this is not declared a globally error-free Steam session.

After installation, the user should hover STORE without clicking, then click outside; inspect a missing portrait; test a native desktop preview; and run the delayed preview while Terraria is active. Also confirm whether Shift+Tab opens Steam's own overlay in Terraria. If visuals fail, report the recent delivery lines and whether audio played. A successful local test alone does not complete in-game acceptance.

References: [Valve overlay requirements and IsOverlayEnabled](https://partner.steamgames.com/doc/features/overlay), [Millennium call_frontend_method](https://docs.steambrew.app/plugins/lua/millennium), and [community Mac overlay report](https://steamcommunity.com/discussions/forum/2/601900047372715021/). Community reports informed the separate overlay-availability test, not a diagnosis of this Mac or permission changes. No system permissions were changed.

## Focus, historical completion and landscape artwork follow-up

Installed package SHA-256: `03840caa54e56ee8d372ce5e535b41336ef090d1d165b3a6f67177eb4931972c`. Rollback plugin and verified state archive: `~/Library/Application Support/Millennium/backups/focus-platinum-2026-09-08-rEfsLB/`. All 945 state files were byte-identical before/after installation (aggregate SHA-256 `210d64e2e4a090617ed48445c67e5c4e9d0a8db90f0e7d7bf9d462db2310813f`). Steam was reopened through Steam Millennium. No library refresh, reimport, launch-option change or achievement mutation was run by the installer.

Validation: 70 automated tests passed; full release-validation command, actual SDK typecheck, Lua validation and all five package sections passed. A source-tree credential-pattern scan found no candidate secrets in 220 reviewed paths. Personal home-directory names were removed from the publishable QA notes, and the offline recovery tool now requires an explicit backup archive rather than a developer-specific path. It remains dry-run by default. This is still an RC with the documented live gates pending, not a completed multi-platform release.

Implemented pointer/keyboard modality scoped to the trophy popup. Initial Steam auto-focus and mouse-click focus no longer paint a blue ring; Tab/keyboard focus remains visible. Selected filters retain their separate selected-state styling. The pin is absolutely positioned in the row corner, independent of the centered earned/total count.

The Platinum hover target now explicitly accepts pointer events despite its noninteractive parent. Every earned Platinum has a blue-aura tooltip, including an honest unavailable-history message when its original achievement is unknown. The completion resolver uses the retained achievement ID or the saved Platinum timestamp, never the latest subsequently earned achievement or current catalogue size. Ambiguous same-second timestamps do not fabricate an identity. Future refreshes retain the completion ID. Forager's exact app/achievement mapping (`751780` / `feat83`, Completionist) recognizes historical completion even when later feats remain locked; opening that game's detail page allows the normal per-game refresh to update its derived cached Platinum. Existing achievement records and dates are not modified. Recognition of a previously earned completion milestone does not replay a new unlock notification.

Appearance settings now include landscape store artwork and six ordered fallback permutations. The selected style is tried first, then the remaining hierarchy. Failed fallback images are not retried cyclically; fallback art uses contain sizing. Landscape cards use Valve's header-capsule proportions (920:430), matching the supplied reference rather than cropping to literal 16:9. Added a narrowly scoped security-audit exception for the reviewed public Valve image host in the artwork resolver only.

The user's delayed Terraria test was audible but not visible. Retained diagnostics confirmed a desktop toast was queued and its location-2 renderer mounted, with no matching game overlay registered. The user also confirmed Shift+Tab did not open Steam's own overlay. Steam's launch log and per-game settings show `/gldevice:Vulkan`; both the game binary and Steam overlay renderer contain arm64 and x86_64 slices. No missing overlay binary or simple architecture mismatch was established. The exact overlay-injection failure remains unresolved. No launch options, game files, macOS permissions or global Steam notification settings were changed.

Next user checks: open Trophies (Refresh should be neutral), restore a hidden game and collapse the funnel (neutral), keyboard-Tab between controls (visible focus), hover an earned Platinum, compare pinned/unpinned count alignment, and switch artwork styles/fallback order. For Terraria, confirm the per-game overlay checkbox and compare Shift+Tab in another game before changing the renderer launch option. [Valve overlay troubleshooting](https://help.steampowered.com/en/faqs/view/3978-072C-18DF-FBF9), [Valve artwork dimensions](https://partner.steamgames.com/doc/store/assets), [Terraria community overlay report](https://steamcommunity.com/app/105600/discussions/0/3823033617223453459/?l=english).
