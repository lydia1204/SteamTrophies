# Mac UI update — 7 September 2026

Status: updated plugin installed; visual acceptance and real library results await user testing. macOS Millennium remains an experimental locally built host, not a stable supported release.

## Changes

- Added the missing header hook, immediately after Notifications. Verified against installed Steam build 1788652215 and chunk~2dcc5aaf7.js. The transform preserves every native control and deliberately does not match unknown builds. No Steam source files are modified on disk.
- The trophy component is now a frontend FFI export, inherits the native header button class, and includes its styles without requiring the quick-access panel to be opened first.
- Overlay mounts into the button's owning Steam document, supplies its own stylesheet, follows selected theme variables, supports Escape, traps Tab focus, and restores previous focus when closed.
- Scoped the previous global stylesheet reset to trophy surfaces. Applied theme colors to the overlay/detail background, fixed selected collection styling, improved typography/header separation, and allowed customization content to scroll. Reduced-motion settings disable the discovery pulse.
- Replaced native Map identity checks with a map-like interface compatible with Steam's observable map and cross-window maps. Added bounded startup waiting, discovery status, retries, disposal guards, and background progress. Earned-only visibility remains unchanged.
- Steam error responses no longer become successful empty achievement reads. Cached trophies are preserved on those errors.
- Styles are regenerated before offline frontend checks. Corrected two strict typecheck return-path issues in layout effects and made resize handling use the owning window.

## Evidence

- 41 automated tests pass, including observable/cross-window map cases and Steam failure preservation.
- Full offline release validation passed: frontend/core/Decky checks, 21 resolution fixtures, security checks, pack checks, repository checks, and 2,500-game benchmark. These do not prove visual layout.
- Strict generated-SDK TypeScript check passed after layout fixes.
- Four Lua backend files passed syntax/bytecode checks; CEF85 stylesheet compatibility passed.
- `scripts/verify-steam-header.cjs` against the installed chunk found exactly one insertion, preserved the native controls, and parsed the entire patched chunk without executing it.
- Final unsigned package passed Starlight section integrity verification. Installed and staged package SHA-256: `8326a45a6da809cf920e69200851a2884b0b76d09978251f2232c4c566f03b2d`.
- The upstream local packer's LSP prepass still prints unrelated Decky FFI warnings; the scoped plugin build succeeds. No fake backend functions were added to silence those warnings.
- Runtime release gates remain pending. No screenshots or live UX tests were performed in this update, at the user's request.

## User test sequence

1. Fully quit Steam. Open `~/Applications/Steam Millennium.app`, not ordinary Steam. At the time of this update, the running Steam process had no Millennium library loaded.
2. Open Library. Look for the trophy immediately to the right of Notifications. Send the header screenshot if it is missing; include whether Millennium settings/quick access are available.
3. Click the trophy. Send a full-window screenshot with discovery status visible. A large library can take several minutes; the first-run queue is deliberately throttled. Only games with earned achievements appear.
4. If discovery says the library is unavailable, open Steam Library and click Retry discovery. Send any error text unchanged.
5. Open Customize, switch theme and trophy pack, and send a second screenshot. Check overlay background, text, selected tab, trophy artwork, and scroll access to settings. Then close/reopen to test persistence.
6. Try a narrower window, Escape to close, and Tab/Shift-Tab within the dialog. Finally open a known game and compare its earned achievements against Steam.

Do not count any of these as passed until the user provides results. A successful build is not proof of working live discovery or polished visual layout.

## Installation and recovery

Installed: `~/Library/Application Support/Millennium/plugins/dev.steamtrophies.client.star`.

Previous package preserved at `~/Library/Application Support/Millennium/backups/steamtrophies-2026-09-07-header-fix/dev.steamtrophies.client.star`. To roll back, quit Steam and restore that file to the installed path. Trophy state and preferences were not deleted or reset.

## References consulted

### Follow-up: Finder launcher repair

The user reported Steam Millennium immediately exiting. macOS launch logs showed exit status 1 before Steam started. Executing the resolved runtime launcher reproduced `[Millennium] Failed to prepare macOS bootstrap assets.` Its asset search supported `Contents/Resources` but not the adjacent `millennium-assets` folder in the versioned runtime; Finder can resolve the executable symlink to that runtime before launching.

Updated the local Millennium host's `src/bootstrap/macos/steam_launcher.cc` to search both layouts and the resolved executable's sibling assets. Rebuilt only `SteamWrapper` and installed its launcher. A compiled read-only test of the actual lookup function passed for app-bundle and runtime paths and rejected missing assets. The installed launcher's code signature verified. Steam was not launched for visual testing; user confirmation remains required.

Original launcher backup: `~/Library/Application Support/Millennium/backups/launcher-2026-09-07/steam_osx`. No Steam binary, plugin settings, or trophy state was reset.

- Official hooking contract: https://docs.steambrew.app/plugins/advanced/hooking
- Official legacy API/deprecation notes: https://docs.steambrew.app/plugins/ts/Millennium
- Community startup troubleshooting: https://github.com/SteamClientHomebrew/Millennium/issues/550
- Local installed Steam JavaScript was the authority for the actual header target and observable library map; community reports were context, not evidence that this Mac runtime works.
