# SteamTrophies

A customizable trophy cabinet for Steam: rarity-based Bronze, Silver and Gold awards, a synthetic Platinum for completion, and a fast, local-first library.

**0.4.0-rc.3 desktop — experimental release candidate, not a stable release.** SteamTrophies presents Steam achievements; it does not unlock, relock or modify achievements on Steam. It is not affiliated with Valve, Sony, PlayStation or Millennium. The separate read-only Decky adapter remains at 0.4.0-rc.1.

The September 9 update focuses on presentation, settings, recap and achievement browsing. **Toast delivery and the Steam overlay investigation are deferred**, not fixed by this update. See the [new settings guide and validation record](docs/SETTINGS_RECAP_0.4.0-rc.2.md).

The **rc.3 follow-up** adds compact controls, real help tooltips, trophy tints, color-blind support, animation speed and pin/refresh feedback. [Download rc.3](https://github.com/lydia1204/SteamTrophies/releases/tag/v0.4.0-rc.3) · [Changes and validation](docs/CONTROLS_0.4.0-rc.3.md). A **standalone no-injection edition, signed Windows `.exe` installer and in-app updates are required future work, not available in this patch**; [edition plan](docs/EDITIONS_AND_UPDATES.md).

[Downloads and release notes](https://github.com/lydia1204/SteamTrophies/releases) · [Issues](https://github.com/lydia1204/SteamTrophies/issues) · [Security policy](SECURITY.md)

> [!IMPORTANT]
> This plugin requires Millennium's modern Lua/Starlight **`.star`** format. An older host is not sufficient merely because it loads legacy plugins. SteamTrophies is **not listed in the Millennium or Decky plugin stores**. The `.star` candidate is unsigned and intended for compatible test/development hosts. Do not bypass signature verification or operating-system protections to install it.
>
> The repository is public, but these builds are experimental prereleases. A project license has not yet been selected; public source availability is not a redistribution license.

## Contents

- [Compatibility](#compatibility)
- [Windows PC installation](#windows-pc-installation)
- [Linux installation](#linux-installation)
- [macOS installation](#macos-installation)
- [Install the SteamTrophies package](#install-the-steamtrophies-package)
- [Steam Deck and Decky setup](#steam-deck-and-decky-setup)
- [First launch and everyday use](#first-launch-and-everyday-use)
- [Trophy rules and historical completion](#trophy-rules-and-historical-completion)
- [Settings reference](#settings-reference)
- [Trophy artwork and sound packs](#trophy-artwork-and-sound-packs)
- [Notifications and the Steam overlay](#notifications-and-the-steam-overlay)
- [Backups, updates, rollback and removal](#backups-updates-rollback-and-removal)
- [Troubleshooting](#troubleshooting)
- [Privacy and security](#privacy-and-security)
- [Build from source](#build-from-source)
- [Validation, contributing and license](#validation-contributing-and-license)

## Compatibility

| Environment | Status for this candidate |
| --- | --- |
| Windows / native desktop Linux + modern Millennium | Intended targets. Automated checks exist; current live host/device acceptance remains pending. |
| macOS + experimental modern Millennium | Desktop plugin has run on a locally built experimental host. This does not establish support in a public Millennium installer. |
| Big Picture | Dedicated controller-oriented implementation; current-host and controller acceptance remain pending. |
| Steam Deck Desktop Mode | Depends on a compatible native Linux Millennium host; not physically certified for this RC. |
| Steam Deck Gaming Mode | Separate Decky adapter builds. It currently reads a saved cabinet; it is not the full desktop plugin or a standalone achievement scanner. Physical-device gates remain pending. |

The September 8 engineering pass passed **70 automated tests**, 21 resolution fixtures, hostile-pack tests, Lua validation and the local five-section `.star` verification. **20 live runtime release gates remain pending.** A green source build is not proof of a working overlay, controller UI or physical Deck install. See [runtime gates](docs/RUNTIME_RELEASE_GATES.md) and [latest desktop QA](docs/DESKTOP_QA_2026-09-08.md).

Known limits:

- On the tested Mac, Terraria's own Shift+Tab overlay did not open. A delayed trophy notification was audible and rendered on the desktop, but **no in-game visual was confirmed**. The overlay-injection failure remains unresolved.
- Fresh imports cannot reconstruct old global rarity or missing unlock dates. Past completion of an expanded achievement catalogue requires evidence, not guesswork.
- Desktop dashboard shelf rearrangement, polished backup/import UI, friends-comparison acceptance and physical Deck validation remain unfinished. The desktop now has a safe custom palette/gradient editor, not an arbitrary CSS or script editor.
- Steam updates may break private UI integration. Keep backups and expect compatibility fixes.

Running a prebuilt plugin on a compatible host does **not** require Node, Python, a Steam Web API key or a separate SteamTrophies account. Development tools are needed only for source builds. Never enter Steam credentials into a pack or issue report.

## Windows PC installation

1. Close games and fully exit Steam, including its notification-area process.
2. Follow the [official Millennium installation guide](https://docs.steambrew.app/users/getting-started/installation), using its signed Windows installer. Avoid third-party mirrors.
3. Complete the installer for your actual Steam installation, then start Steam.
4. Confirm **Steam → Millennium → Plugins** is available.
5. Check the host release notes for modern Lua/Starlight `.star` support. This RC cannot be installed into an incompatible legacy runtime.
6. Follow [Install the SteamTrophies package](#install-the-steamtrophies-package) below, using the `plugins` folder under your actual **modern Millennium installation root**. Do not assume an older `%STEAM%/plugin` directory applies.

If the Millennium menu is missing, fix the host first using its [troubleshooting guide](https://docs.steambrew.app/users/getting-started/troubleshooting). Do not delete game or trophy data to repair host installation.

## Linux installation

1. Use a native Steam installation supported by Millennium. Its public installation guide excludes Flatpak, Snap and ARM Linux installations.
2. Exit games and Steam. Follow the current [official Linux instructions](https://docs.steambrew.app/users/getting-started/installation): Arch and NixOS have distribution-specific routes; other supported distributions use the upstream installer. Inspect downloaded scripts before executing them. Do not run Steam as root.
3. Start Steam and verify **Steam → Millennium → Plugins**, then confirm modern `.star` support.
4. Follow the package instructions below. The modern Linux plugin directory is `${XDG_DATA_HOME:-~/.local/share}/millennium/plugins/` unless your host overrides it.

For packaging-specific trouble, consult [upstream discussions](https://github.com/SteamClientHomebrew/Millennium/discussions). The [NixOS community thread](https://github.com/SteamClientHomebrew/Millennium/discussions/832) illustrates changing packaging/maintenance; old forum commands are not guaranteed installation recipes for today's host.

## macOS installation

### Experimental host prerequisite

As checked September 8, 2026, the public Millennium installation guide documents Windows and Linux, **not a production Mac installer**. Local SteamTrophies testing used a source-built experimental Millennium host and a dedicated **Steam Millennium.app** launcher. The host, launcher and their local compatibility changes are **not bundled in this repository**.

If you do not already have a compatible experimental host, the `.star` file alone cannot add Mac support. Advanced developers must first follow the [upstream project](https://github.com/SteamClientHomebrew/Millennium) and its [platform build instructions](https://github.com/SteamClientHomebrew/Millennium/blob/main/.github/docs/BUILDING.md), recording the exact revision tested. There is no verified one-click stock-Mac install to promise here. Do not disable SIP, Gatekeeper, antivirus or signature verification to make it load.

### Install on an existing compatible Mac host

1. Fully quit games and Steam, not just its window.
2. Back up an existing installation as described below.
3. Download and verify the `.star` using the next section.
4. In Finder, choose **Go → Go to Folder…**, then enter `~/Library/Application Support/Millennium/plugins/`.
5. Copy `dev.steamtrophies.client.star` directly into that directory.
6. Start Steam through the launcher required by your host. On the tested setup this is **Steam Millennium.app**, not the ordinary Steam launcher.
7. Enable **Steam Trophies** in **Steam → Millennium → Plugins**; restart if requested.
8. Open the trophy button beside your profile, check the gear/settings screen, then follow first-run discovery below.

Mac trophy data lives separately at `~/Library/Application Support/SteamTrophies/`. Replacing the plugin is not an instruction to reset that directory.

## Install the SteamTrophies package

These steps apply to a compatible modern Millennium host on Windows, Linux or experimental macOS.

### Download and verify

Open this repository's [Releases](https://github.com/lydia1204/SteamTrophies/releases), choose the explicitly marked prerelease, and read its limitations. Download **`dev.steamtrophies.client.star`** and **`SHA256SUMS.txt`** from the same release.

GitHub's automatic **Source code (zip/tar.gz)** downloads are not installable plugins. Do not rename a ZIP to `.star`, unzip the `.star`, install it as a theme, or put it in Decky.

Calculate the SHA-256 in the download folder and compare the entire value with `SHA256SUMS.txt`:

```powershell
# Windows PowerShell
Get-FileHash .\dev.steamtrophies.client.star -Algorithm SHA256
```

```bash
# macOS
shasum -a 256 dev.steamtrophies.client.star
```

```bash
# Linux
sha256sum dev.steamtrophies.client.star
```

A matching hash detects corruption/changes; it is **not a publisher signature or a safety guarantee**. This candidate is unsigned. If the host requires signed packages, wait for an approved distribution rather than bypassing that policy.

### Copy and enable

1. Fully exit Steam. For an update, back up the current plugin and data first. Keep backups outside the active plugin folder to avoid duplicate plugin IDs.
2. Copy the single `.star` directly into your host's confirmed plugins directory:

| Modern host | Plugin destination |
| --- | --- |
| Windows | `plugins` beneath the actual Millennium installation root; consult your host's configured location. |
| Linux | `${XDG_DATA_HOME:-~/.local/share}/millennium/plugins/` |
| Experimental macOS | `~/Library/Application Support/Millennium/plugins/` |

These paths follow [upstream environment configuration](https://github.com/SteamClientHomebrew/Millennium/blob/main/src/system/environment.cc); the [modern loader](https://github.com/SteamClientHomebrew/Millennium/blob/main/src/engine/plugin_manager.cc) discovers `.star` files directly. Older [filesystem documentation](https://docs.steambrew.app/users/getting-started/structure) describes a different host generation. Custom locations override the examples.

3. Start Steam using the host's required launch path.
4. Enable **Steam Trophies** / `dev.steamtrophies.client` in Millennium's Plugins screen and restart if requested.
5. Verify the trophy button near your Steam profile and its gear/settings screen.

The [official addon manager guide](https://docs.steambrew.app/users/guides/installing-addons) describes directory-ID installs for **published** plugins. SteamTrophies is not published there yet; entering its ID into that installer is not a working shortcut for this RC. If the file is not listed, check format, path and host compatibility before copying it into unrelated folders.

## Steam Deck and Decky setup

**Choose the correct adapter.** Millennium serves Steam Desktop / its own Big Picture surface; Decky Loader serves Gaming Mode. Their packages are not interchangeable. This RC's Decky panel displays totals, up to eight recent games, a local-state refresh and storage health. It does **not** implement the desktop settings/customization UI, game-detail navigation, discovery or real-time trophy toasts. Do not expect those features just because the shared project contains them.

### 1. Install Decky Loader

1. On the Deck, open **Steam → Power → Switch to Desktop**.
2. Open the [official Decky Loader repository](https://github.com/SteamDeckHomebrew/decky-loader#installation) and download its linked installer. Use the official file, not a repackaged mirror.
3. Move it to the desktop, ensure it has the `.desktop` filename (not an added `.download` suffix), then run it and follow the installer's administrator prompts.
4. Choose the stable loader unless a documented compatibility requirement calls for prerelease.
5. Return to Gaming Mode and open the **… Quick Access** menu. Confirm the Decky plug icon appears.

Follow [Decky's current installation guide](https://wiki.deckbrew.xyz/en/user-guide/install) if prompts differ. Do not disable SteamOS filesystem protections or change permissions recursively to install this plugin.

### 2. Obtain or build a Decky-format package

SteamTrophies is not in the Decky store. The candidate provides **`SteamTrophies-Decky-0.4.0-rc.1.zip`** on the Releases page; verify its entry in `SHA256SUMS.txt` using the same hash commands as above, substituting the ZIP filename. Read its device limitations. To build your own, use the commands below and [the Decky template conventions](https://github.com/SteamDeckHomebrew/decky-plugin-template). Node/npm are needed on the **build machine**, not for loading the finished ZIP.

From a checked-out repository, after `npm ci --ignore-scripts`:

```bash
npm run decky:typecheck
npm run decky:build
python -m compileall -q decky
```

Create a ZIP with **one top-level directory**, containing only these release files (do not zip the whole repository or `node_modules`):

```text
SteamTrophies/
  plugin.json        from decky/plugin.json
  package.json       from decky/package.json
  main.py            from decky/main.py
  dist/
    index.js         from decky/dist/index.js
```

The package includes its version metadata and does not require a pip dependency install. This layout/build is not physical-device acceptance; the [Deck runtime gates](docs/RUNTIME_RELEASE_GATES.md) still apply.

### 3. Install the experimental adapter

In Gaming Mode, open Decky's gear/settings and its developer/local-plugin installation controls. Enable Developer Mode if your current loader requires it to expose **Install Plugin from ZIP**, then select the ZIP transferred to the Deck. Wording can vary by loader version; consult [Decky's developer guide](https://wiki.deckbrew.xyz/en/plugin-dev/getting-started). The current loader's [developer settings implementation](https://github.com/SteamDeckHomebrew/decky-loader/blob/main/frontend/src/components/settings/pages/developer/index.tsx) provides local ZIP selection. Review the plugin name/source before confirming. Do not use the `.star` file here.

Decky also documents installation from a URL in Settings. A private GitHub release link is **not** an unauthenticated download URL for the Deck; prefer the local ZIP. Never paste a GitHub access token into a plugin URL or make the repository public just to bypass download authentication. If your loader exposes only URL installation, use its current documented developer deployment workflow instead of guessing a system folder or weakening permissions.

### 4. Supply the saved cabinet

This adapter reads the Deck user's **`~/.local/share/SteamTrophies/state/index.v1.json`** and game shards. It uses the actual Deck user home even if the loader service runs as root. Unlike the desktop Linux adapter, its current path does not follow a custom `XDG_DATA_HOME`.

- Preferred same-device workflow: on a supported Desktop Mode Millennium host, run SteamTrophies discovery, exit Steam cleanly, then return to Gaming Mode. The default data path is shared.
- Alternatively, transfer a verified, same-schema snapshot from your own desktop account using the backup/restore precautions below. Stop the plugin/loader and Steam during replacement, preserve any existing Deck data, and copy the `state` folder with its index and shards intact into the data root—not into Decky's plugin files. Use the Deck user as owner; do not run broad ownership/permission changes. This is a manual snapshot, **not automatic sync**.
- Keep different Steam accounts' snapshots separate. Do not overwrite a populated cabinet with an empty template.

Open **Steam Trophies** in Decky and choose **Refresh local trophy state**. Check totals, recent games and index/shard diagnostics. This reads saved data; it does not contact Steam to discover new achievements. **No trophy index exists yet** means desktop discovery or a valid snapshot is still required.

### 5. Verify, update or remove

Check controller navigation, 1280×800 layout, docked resolution, offline access and sleep/resume on the actual Deck. Report failures with SteamOS/Steam/Decky versions. Use Decky's plugin management to reload/update/uninstall this adapter; uninstalling plugin files does not automatically erase the separate trophy data. Back up first. To remove Decky itself, use its official installer/uninstall flow.

## First launch and everyday use

### Populate the desktop cabinet

Open the trophy button → gear → **Library & data → Find new games**. Discovery can take time with large libraries and records old achievements **silently**. An empty cabinet before discovery is not necessarily broken. Later startups use the saved index; **automatic discovery is off**. Use Find new games when you want to discover more titles. Opening the menu does not start a full scan.

Normal browsing omits untouched 0% games. Use **All**, **Projects**, **Nearly complete**, **Platinums** and **Search games…** to narrow the cabinet. The funnel expands sorting and **Show hidden games**.

- Right-click any game row to pin/unpin or hide/restore. Pins appear blue in the top-right corner and pinned games stay first; the count remains centered.
- To recover a hidden game, enable Show hidden games and right-click → restore, or use **Settings → Library & data → Hidden games → Show again**.
- Click a game for its scrollable achievement list. Game actions include projects, pins, hiding, **Trophy icons** and per-game refresh. Up to three Trophy Projects can be tracked.
- Recent artwork fills available row width, rather than stopping at ten. Larger artwork means fewer tiles fit; a game with few earned achievements naturally leaves some space.
- Hover an achievement for trophy, name, requirement, earned date and rarity. Hover an earned Platinum for its completion evidence and blue-bordered tooltip.
- X closes the popup. Actual clicks on surrounding Steam pages dismiss it; merely hovering Store should not. Clicking another OS application is not a guaranteed global dismissal mechanism.
- Pointer focus should not leave keyboard outlines behind. Keyboard navigation still shows focus; selected filters intentionally retain selected styling.

### Refresh is not discovery

| Action | Effect |
| --- | --- |
| Open cabinet / restart Steam | Read cached state; no full discovery. |
| Header refresh / **Refresh rarity and trophy tiers** | Explicitly fetch current rarity and reclassify cached trophies; preserve unlocks, dates, Platinum and customization; no unlock sounds. |
| **Find new games** | Explicit library discovery. |
| Refresh inside one game | Request current achievement data for that game through the adapter. |

Completed status messages are dismissible/temporary. Do not start repeated scans merely because a result banner is visible. Rarity refresh cannot repair an old test's incorrect unlock date; that requires trustworthy Steam data or a reviewed backup, not an invented replacement.

## Trophy rules and historical completion

| Trophy | Default rule |
| --- | --- |
| Gold | Global unlock percentage ≤5% |
| Silver | >5% and ≤20% |
| Bronze | >20% |
| Platinum | Synthetic game-completion award; not an additional Steam achievement |

Unknown rarity stays unknown, with provisional Bronze presentation, **never invented 0%**. The Gold border follows this plugin's tier, not a separate rule that every achievement below 10% must be Gold. Bronze/Silver borders are optional and off by default. Reduced motion intentionally stops animated effects.

Normal award handling retains the recorded tier/rarity. **Explicit rarity repair is the exception:** it recalculates cached tiers from today's verified percentages. Neither fresh import nor repair can reconstruct global rarity at an old unlock date. Unknown dates stay unknown; the import time is not substituted. Removed earned achievements may remain retired history, while removed locked achievements do not become fake permanent entries.

### Platinum when a game's achievement catalogue expands

Normally, earning all real achievements in the observed catalogue grants Platinum. Its original completion date and, when known, completing achievement ID are retained. Later additions do not revoke that saved award or switch its tooltip to a newer unrelated unlock. Missing or ambiguous same-second history is explained rather than guessed.

For **Forager, App 751780**, the exact **`feat83` / Completionist** milestone is a reviewed historical-completion exception. An earned record can establish earlier completion even if later-added feats remain locked. It is not a name-matching heuristic applied to other games. Incomplete catalogues first imported after expansion may have no evidence of previous 100%. Opening Forager detail allows normal per-game refresh to update derived completion evidence without replaying a historical toast.

## Settings reference

Use the cabinet's gear. Changes save automatically; there is no Apply button.

| Section | Controls |
| --- | --- |
| Trophy packs | Default visual pack, previews, folder import and management. Game overrides take precedence. |
| Appearance | Artwork and fallback shapes; achievement size 32–72 px; actual text/trophy scales 80–200%; pill switches and help; theme gallery/custom colors; independent tier borders; achievement animations; live preview; header total; window memory/blur; scrollbar; release years; recap defaults; tooltip layout and group preferences. |
| Notifications | Independent sound pack; toast/sound toggles; Platinum celebration; artwork; animation; local position; duration 1.5–15 s; volume; 1–6 visible toasts; audio cooldown; quiet hours; tier previews; delayed outside-window test; delivery diagnostics. |
| Library & data | Rarity repair, explicit discovery, hidden-game restoration, pins and project tracking. |
| Diagnostics | Counts/schema; temporarily disable external packs/themes; responsive/focus debugging. These are troubleshooting aids, not full host health certification. |
| Layout, Big Picture only | Shelf visibility/order. Unfinished desktop dashboard layout controls are not exposed. |

Artwork tries the selected style first, then your fallback order, skipping missing candidates without cycling. Missing portraits can fall back to landscape or a **contained** square icon instead of stretching it. Landscape uses Valve's store-header proportions, not a forced 16:9 crop. Some games lack art; offline/CDN failures can also trigger fallback.

Themes include Midnight, OLED Black, Steam Blue and High Contrast, plus gaming- and pride-inspired palettes with swatch previews. Custom colors and optional slow gradients layer over the selected theme. System reduced motion takes priority over animations. Text scale, trophy scale and achievement-art size are independent. Adjust them before changing system display scaling.

Open the artwork button in a game’s header for per-game artwork/fallback choices, trophy overrides and custom Base Game/expansion groups. Group membership is configured explicitly: the plugin does not invent DLC boundaries from achievement names or dates. Pinning a hidden game restores it automatically; hiding a pinned game removes its pin.

The recap button beside Settings opens weekly, monthly and yearly **achievement-history** statistics. It does not estimate play hours or pretend to reproduce data unavailable to the plugin. Completion rarity is displayed as `≤x%`, an upper bound from the rarest achievement—not the exact percentage completing the entire game. [Read the detailed explanations and controls](docs/SETTINGS_RECAP_0.4.0-rc.2.md).

The per-achievement **Icon** editor button is deliberately hidden/deprecated in desktop rows; its code and existing saved overrides remain supported. Use the game's **Trophy icons** page for exposed game/pack/tier controls. This is not a reason to delete customization.

## Trophy artwork and sound packs

Built-ins: `builtin.classic`, `builtin.crest`, `builtin.minimal`, `builtin.crystal`. Classic uses the supplied trophy art. Packs affect presentation, not achievement state or rarity calculations.

1. Obtain a trusted pack. If distributed as ZIP, extract it to a normal folder first. Direct `.sttpack` archive import is not implemented.
2. Choose **Settings → Trophy packs → Import pack folder** and select the folder containing `manifest.json`.
3. Fix validation errors rather than bypassing them. Choose the installed pack globally or on a game's Trophy icons page.
4. Keep your authoring folder. The plugin uses a managed copy; re-import to apply source edits.

Priority: **exact achievement → game tier → game pack → global pack → built-in Classic**. Missing/removed packs fall through to valid candidates.

For your own pack, start with [the template](examples/trophy-pack-template) and [complete specification](docs/RESOURCE_PACKS.md). V1 requires four tier images and optionally declares `toast.bronze`, `toast.silver`, `toast.gold`, `toast.platinum` sounds.

- Images: PNG/JPEG/WebP; user SVG/code/CSS is rejected.
- Sounds: valid WAV/OGG/MP3. Renaming a file does not convert it.
- To keep different sound and artwork packs, import a valid pack containing sounds and choose it under **Notifications → Sound pack**. There is no arbitrary-MP3-folder importer: audio must be declared in a valid pack manifest.
- Individual assets: up to 4 MiB; total content: up to 64 MiB; decoded image dimensions/pixels and file counts are also bounded.
- Symlinks, traversal, reserved built-in IDs, undeclared files and executable masquerading are rejected. Exclude `.DS_Store`, authoring files and unrelated exports.
- Include attribution and distribute only art/audio you have rights to use.

Developer validation:

```bash
npm run pack:validate -- /absolute/path/to/pack-folder
```

## Notifications and the Steam overlay

Local previews and native Steam delivery are separate. A local preview succeeding does not prove that a game can display overlays.

1. Enable toasts/sound, check volume and quiet hours, then test each tier inside the cabinet. Tests change no achievements.
2. Choose **Test outside window in 10 seconds**, close Trophies and check the Steam desktop for both visual and audio.
3. Repeat and return to a game. Independently confirm Steam's own overlay opens with its configured shortcut, usually Shift+Tab.
4. Read **Recent notification delivery**. Queued events or a desktop renderer are not proof of in-game visuals.
5. Finally test a genuinely new achievement during normal play. First import and metadata repair are silent; do not fabricate unlocks for testing.

Animations: **Slide, Fade, Rise, Zoom, Bounce, Flip, None**. Reduced motion overrides animation. Position applies inside the trophy window; **Steam owns native placement outside it**. The plugin does not globally mute Steam achievement sounds, so cues can overlap.

If audio works but in-game visuals do not, check both global **Steam Settings → In Game** and the game's **Properties → General** overlay switch. Restart the game after changes and verify the shortcut. Consult [Valve's overlay requirements](https://partner.steamgames.com/doc/features/overlay) and [troubleshooting](https://help.steampowered.com/en/faqs/view/3978-072C-18DF-FBF9). A checked global setting alone does not establish successful overlay injection.

If Steam's own overlay fails, compare another game and record OS/game/renderer details before changing launch options. The known Mac/Terraria case is in [Desktop QA](docs/DESKTOP_QA_2026-09-08.md). A [Terraria community discussion](https://steamcommunity.com/app/105600/discussions/0/3823033617223453459/?l=english) reports similar symptoms, not a confirmed diagnosis for every Mac. Do not disable OS security, override Steam's disabled-overlay policy or delete trophy data to troubleshoot it.

## Backups, updates, rollback and removal

### Data roots

| OS | Trophy data, separate from the plugin file |
| --- | --- |
| Windows | `%LOCALAPPDATA%\SteamTrophies\`, fallback `%APPDATA%\SteamTrophies\` |
| Desktop Linux | `${XDG_DATA_HOME:-~/.local/share}/SteamTrophies/` |
| macOS | `~/Library/Application Support/SteamTrophies/` |
| Decky | `<Deck user home>/.local/share/SteamTrophies/` |

```text
SteamTrophies/
  state/
    index.v1.json             compact cabinet
    games/                   achievement/award records
    events/                  trophy history
    customization.v1.json    packs, pins, hidden games and preferences
    discovery.v1.json        discovery progress
    quarantine/              invalid state preserved for investigation
  customization/packs/       managed imported artwork/audio
  cache/                     rebuildable assets
```

Other metadata/settings and `.bak` files may exist. Back up the whole root, not only selected filenames from this example.

### Back up before an update

Fully quit Steam (and stop the Decky plugin/loader for a Deck snapshot). Copy the **entire data root** into a timestamped backup outside the live data/plugin directories. Keep `state` and `customization/packs` together. Also copy the installed plugin and record its version/hash. Inspect the backup before replacing anything. Caches are disposable, but a complete local snapshot can include them for convenience.

An index or `.bak` alone is not a full backup of custom packs and historical evidence. Do not upload personal state with normal bug reports. Prefer syncing a closed-app snapshot/export over two clients writing to one live folder. Automatic multi-device synchronization and multi-account migration/isolation are not certified; preserve separate account snapshots.

### Update or roll back

For updates: read release notes, verify hash, exit Steam, back up, replace **only** this plugin file, and relaunch through the correct host. Verify saved pins/hidden games/packs. Updating is not a request to refresh or reimport the library.

For rollback: preserve the current state first. Restore the previous plugin without changing data if it supports the current schema. If schemas differ, restore the **matching complete snapshot and plugin together**. Move current data aside recoverably before restoring; do not merge arbitrary shards from different snapshots or delete the only copy.

`scripts/recover-local-state.cjs` is an advanced macOS discovery/index recovery tool requiring an explicit reviewed backup archive. It is not an installer, complete restore utility, or speculative fix for a wrong achievement date. Ask a maintainer before using it on historical test damage.

### Disable or uninstall

Disable Steam Trophies in Millennium, fully exit Steam, and move **only its `.star`** outside the active plugins folder. Keep the separate data root for later reinstall. For Decky use its plugin management. To intentionally erase local history too, first verify a backup, then move the exact SteamTrophies data root to OS trash. Historical rarity/completion evidence may not be recoverable from Steam.

Never remove Steam libraries, userdata, other plugins or whole host directories as a SteamTrophies uninstall step. Remove Millennium using [upstream uninstall instructions](https://docs.steambrew.app/users/parting-ways/uninstall), or Decky through its official installer, only if you also want to remove that host.

## Troubleshooting

| Symptom | Safe checks |
| --- | --- |
| No host menu | Fix Millennium/Decky installation or launcher first; follow upstream troubleshooting. |
| Plugin not listed | Correct package format, compatible host/signature policy, actual plugin directory, no nested source ZIP? |
| Enabled but no trophy button | Record Steam build/channel and host version/error. Private header integration can change; preserve trophy data. |
| Steam fails after enabling | Quit Steam, move only this plugin out, retain data, retry. If host still fails, use upstream recovery. |
| Empty/missing games | Explicit discovery, then clear search/filters and check hidden games. Normal untouched 0% games are omitted. Decky only reads an existing index. |
| Hidden game missing | Funnel → Show hidden games → restore; alternatively Library & data → Show again. |
| Refresh banner remains | Dismiss the completed result; distinguish it from a running scan. Report stuck status rather than repeatedly scanning. |
| Old imports all Gold / wrong tiers | Back up, then explicitly refresh rarity/tiers. This preserves unlock dates, including incorrect dates already in source data. |
| Old game has implausible recent date | Compare trustworthy Steam history/backup. Rarity repair is not date repair; never guess replacement timestamps. |
| Gold shimmer is static | Check reduced motion and actual tier; Gold threshold is ≤5%, not every achievement below 10%. Report if Gold remains static with motion enabled. |
| Platinum lacks exact achievement | Missing/ambiguous historical evidence is stated honestly. See retained completion and Forager rules. |
| Artwork looks wrong | Change style/fallback, check asset availability/network. Missing art should contain fallback icons, not stretch them. |
| Refresh/funnel stays outlined | Distinguish selected filters from keyboard focus; report pointer/Tab sequence, theme and expanded/collapsed state. |
| Hovering Store closes popup | Regression: actual clicks, not hover, should dismiss. Record exact host/Steam versions. |
| Scrolling/overlap problems | Test normal text/art scales and external themes disabled; record window dimensions/display scaling. |
| Pack rejected | Check manifest, signatures, undeclared files, symlinks and size limits; run validator. |
| Audio but no toast | Use local/desktop/in-game tests separately; verify actual Steam overlay and delivery diagnostics. |
| Corrupt state | Preserve data/quarantine. Local validated shards/backups support recovery; seek review before resets or manual edits. |

### Report a useful bug

Include plugin version/commit, OS/architecture, Steam build and Stable/Beta channel, host version/revision, exact steps, expected/actual results and relevant screenshots. For UI add window size/scaling, theme, artwork settings and input method. For notifications add game App ID, whether Steam's own overlay works, and Recent notification delivery output.

Modern Millennium logs normally live under its install root's `logs` on Windows, `${XDG_STATE_HOME:-~/.local/state}/millennium/logs` on Linux, or `~/Library/Logs/Millennium/logs` on Mac; confirm your host's configured location. Share **small redacted excerpts**, not complete Steam logs, personal data roots or account/session secrets. Use [Issues](https://github.com/lydia1204/SteamTrophies/issues) for ordinary bugs and [SECURITY.md](SECURITY.md) for vulnerabilities.

## Privacy and security

Opening the cabinet uses local cached state. Discovery/refresh reads Steam achievement data; rarity and artwork may contact Valve services. This does not imply Steam itself is offline. No project-owned server/account is required to render the cabinet.

The **plugin** contains executable code and runs in a sensitive host: install trusted releases only. **User trophy packs** are different—bounded, validated data bundles, not executable plugins. A checksum or validator is not a guarantee against every vulnerability.

Protections include bounded input/RPC validation, numeric game IDs, atomic writes, constrained backup/quarantine handling, owned host hooks with cleanup, network host checks and hostile-pack rejection. Review [the threat model](docs/SECURITY.md). Never expose Steam's remote-debugging endpoint to a network, bypass protections to load an unsigned package, or commit personal history/API keys.

No Valve endorsement, anti-cheat approval, universal compatibility or guarantee against account consequences is claimed. Respect Steam/game policies and do not use unsupported injected clients with games that prohibit them.

## Build from source

Requirements: Git; Node **22 or 24** recommended (declared `>=22 <27`); npm; Python 3 available as `python`; a Lua/LuaJIT parser for backend validation; compatible Millennium/Starlight for actual packaging/runtime. Starlight is pinned to **1.1.4** and the real lockfile is committed.

```bash
git clone https://github.com/lydia1204/SteamTrophies.git
cd SteamTrophies
npm ci --ignore-scripts
npm run release:validate
```

This runs platform-neutral checks without an unsupported host-tool lifecycle. If `python` is missing, configure your Python environment before retrying; that is not a plugin runtime failure.

### Millennium packaging

Close Steam before building against an installed development host: this project enables reload behavior, and Starlight may contact a running host even with a separate output folder.

```bash
npm run prepare
npm run lua:validate
npm run build
```

`millennium.toml` uses `output_path = "auto"`. Read the reported destination; it may be the detected host's plugins folder, not `dist`. The checked toolchain also supports explicit staging:

```bash
npm run styles:generate
mkdir -p dist
npx starlight --release --of ./dist pack
npx starlight verify ./dist/dev.steamtrophies.client.star
```

Unsigned package verification is not an official distribution signature. See [Millennium configuration](https://docs.steambrew.app/plugins/structure/config). `npm run dev` starts the intentional live-development watcher; end users do not need it.

### Mac compiler caveat

The pinned npm Starlight 1.1.4 package supplies Windows/Linux compilers, not a native Apple Silicon executable. `npm ci --ignore-scripts` and offline checks work independently; `prepare`/`build` need a separately built compatible native compiler on Mac. The local candidate used one with matching SDK types. That toolchain/experimental host is not made reproducible simply by cloning this plugin. A successful Mac offline test does not prove a stock-Mac install works.

For Decky builds and package layout, use [Steam Deck and Decky setup](#steam-deck-and-decky-setup), not the Starlight commands.

## Validation, contributing and license

`release:validate` includes core/frontend checks, Decky checks/build, CEF compatibility, automated tests, resolution fixtures, security/hostile-pack gates, QA ledgers, repository checks and a **2,500-game / 100,000-achievement** benchmark. Lua and actual host SDK/runtime checks are separate.

```bash
npm test
npm run lua:validate
npm run security:audit
npm run security:pack-corpus
npm run resolution:test
npm run pack:validate -- examples/trophy-pack-template
npm run repo:validate
npm run bench
npm run runtime:gates
npm run runtime:gates:require-pass
```

**`runtime:gates:require-pass` should fail while evidence is pending.** The ordinary report succeeding only means the ledger is well-formed, not that live tests passed. Do not weaken this distinction to get a green release badge.

CI is configured for Windows, Linux and macOS on Node 22/24 with a Linux package job. Check [actual Actions results](https://github.com/lydia1204/SteamTrophies/actions) for the revision; configured jobs are not proof of passing runs.

Read [CONTRIBUTING.md](CONTRIBUTING.md). Keep shared trophy semantics independent from host integration; preserve existing history; avoid scanning on menu open; never weaken pack validation or claim unobserved live results. Screenshots are not fabricated—see [gallery requirements](docs/images/README.md).

Further documentation:

- [Architecture](docs/ARCHITECTURE.md), [customization architecture](docs/CUSTOMIZATION_ARCHITECTURE.md)
- [Storage](docs/STORAGE.md), [security](docs/SECURITY.md), [packs](docs/RESOURCE_PACKS.md)
- [Platform matrix](docs/PLATFORM_MATRIX.md), [Big Picture](docs/BIG_PICTURE.md), [responsive compatibility](docs/RESPONSIVE_COMPATIBILITY.md), [performance](docs/PERFORMANCE.md)
- [Latest desktop QA](docs/DESKTOP_QA_2026-09-08.md), [settings QA](docs/SETTINGS_QA_2026-09-07.md), [runtime release gates](docs/RUNTIME_RELEASE_GATES.md)
- [Current candidate release notes and artifact hashes](docs/RELEASE_NOTES_0.4.0-rc.3.md)
- [Previous rc.2 candidate](docs/RELEASE_NOTES_0.4.0-rc.2.md)
- [Previous rc.1 candidate](docs/RELEASE_NOTES_0.4.0-rc.1.md)

Older pass reports describe dated snapshots, not a promise that every roadmap feature is shipped. This README and the latest QA report clarify current behavior.

**No project license has been selected.** Access does not grant an open-source license or redistribution rights. The owner must select a license and verify artwork/audio redistribution rights before a public release. Dependencies retain their own licenses; game imagery and trademarks belong to their owners.
