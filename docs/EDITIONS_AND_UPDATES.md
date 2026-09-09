# Required editions and distribution milestone

Status: **planned, not implemented or shipped**. The current UI patch is still an experimental Millennium add-on. No standalone executable, Windows installer or automatic updater is included. Users uncomfortable modifying Steam should wait for the standalone edition, not install Millennium under a different label.

## Two clearly separate editions

1. **Add-on**: retain the existing Millennium integration and its Steam UI entry point. Keep host compatibility explicit. Decky remains a separate adapter with its own feature matrix.
2. **Standalone**: a separate application for Windows, macOS and Linux. It must not inject into Steam, patch Steam files, attach to its browser/debugging interfaces or require Millennium. Reuse the trophy rules, storage, validation and presentation packages through a new host adapter—not through hidden Steam-client automation. First validate an explicit import path and an authorized, rate-limited Steam Web API reader; unavailable/private data must remain unavailable rather than bypassing privacy restrictions. No shared API secret embedded in downloads, and any personal credentials belong in OS-protected storage.

Steam's [ISteamUserStats Web API](https://partner.steamgames.com/doc/webapi/ISteamUserStats) is the initial authoritative capability reference. Availability, permissions, account setup and polling behavior must be established with tests before promising parity with the add-on. Standalone notifications may be desktop notifications; a reliable fullscreen game overlay is not implied by a separate application.

## Installation and updating acceptance criteria

- Windows: a signed `.exe` installer, proposed NSIS/Tauri, with a normal uninstall entry, clear edition/version, user-level installation where possible and no silent Steam modification. Validate WebView2/prerequisites and install paths on a clean Windows machine.
- macOS: signed/notarized application and DMG; test on supported Intel/Apple Silicon targets. No advice to turn off Gatekeeper or SIP.
- Linux: explicitly supported distributions/architectures, proposed AppImage plus a distro package where justified. Test prerequisites and permissions; no root service just to display trophies.
- In-app update checks with a stable/prerelease channel choice, release notes, download progress and user-controlled restart. Users should not need to manually uninstall/reinstall to update.
- HTTPS delivery, cryptographically verified update artifacts, platform/architecture checks, protected signing keys, interruption recovery and backups before data migrations. Test tampered artifacts, invalid signatures, wrong architectures, unavailable network, disk-full failures and migration recovery.
- Keep the application updater separate from Millennium's plugin lifecycle; do not claim an app updater automatically updates `.star` packages. An add-on install/update manager must validate the host and touch only the authorized plugin file while Steam is stopped.
- Preserve local data on updates and ordinary uninstallation; make data deletion a separate explicit user action.
- Release gates: Windows/macOS signing identities, update-key custody, licensing/asset redistribution approval, clean-machine install/uninstall, and an actual N → N+1 update tested on every supported platform. Do not publish a misleading shell `.exe` that merely opens installation instructions.

## Research and design direction

[Tauri Windows installer documentation](https://v2.tauri.app/distribute/windows-installer/) documents NSIS setup executables and MSI packaging. [Tauri's updater](https://v2.tauri.app/plugin/updater/) supports a signed update flow; OS code signing and updater signatures are distinct responsibilities. Tauri is a proposed implementation direction, not an adopted dependency in this repository yet.

A [Tauri community issue about signing order](https://github.com/tauri-apps/tauri/issues/15842) highlights that changing the Windows binary after creating its updater signature invalidates the signature. The release pipeline must therefore verify and updater-sign the final distributed bytes after platform code signing. Treat this discussion as a reported integration pitfall, not evidence that an updater is already implemented here.

The future README must give separate, verified install/update/uninstall instructions for each edition and platform. The current README remains explicit about the actual `.star` and read-only Decky artifacts.
