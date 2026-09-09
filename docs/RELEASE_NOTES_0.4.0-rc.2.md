# SteamTrophies 0.4.0-rc.2 — desktop presentation candidate

Experimental prerelease, not a stable release. [Installation for Windows, Linux, experimental macOS and Decky](../README.md). [Detailed settings guide, data limits and validation](SETTINGS_RECAP_0.4.0-rc.2.md).

## Download integrity

| Artifact | SHA-256 |
| --- | --- |
| `dev.steamtrophies.client.star` | `1faeb158ed3fd94de752d29897cb024e9b07f29e7e909638a8107178bcd7d974` |
| `SteamTrophies-Decky-0.4.0-rc.1.zip` (unchanged adapter) | `6e9a9c25f261e73b9d91960eab9c7cdf7faffa982ed5d34f8b9066518ed4478d` |

The desktop package is unsigned, 3,200,369 bytes. All five Starlight sections verified. Do not bypass host or OS signature/security requirements. The separate Decky ZIP is the unchanged read-only adapter, not a port of the new desktop UI.

## Highlights

- Actual glyph scaling, compact aligned artwork, per-game fallback rules and responsive narrow-window layouts.
- Pill switches, hover help, reorganized settings, live appearance previews, gaming/pride theme gallery and safe custom palette/gradient editor.
- Independent tier borders and tooltip glows, tooltip layouts, optional total/release years/scrollbars/blur and remembered screen/scroll position.
- Local weekly/monthly/yearly trophy recap, explicit data coverage and completion-rarity upper bounds.
- Custom Base Game/expansion groups, collapse preferences, achievement title/description search and earned/tier filters.
- Historical completion achievement shown as Platinum, optional original duplicate, pin/hidden-state exclusivity and compact header icons.
- Serialized settings saves, visible save errors/retry and shared cached reads.

## Validation and rollout

83 automated tests, 21 responsive-classification fixtures, 135 isolated browser layout fixtures, Lua syntax, CEF85 CSS checks, hostile-pack/security checks, zero reported dependency vulnerabilities at the September 9 audit, and the 2,500-game benchmark passed locally.

[CI run 34380007794](https://github.com/lydia1204/SteamTrophies/actions/runs/34380007794) passed all six Windows/Linux/macOS Node 22/24 jobs and the verified production-package job. An earlier attempt failed because the staged output directory was missing; the workflow now creates it explicitly.

The matching native-compiled artifact was installed on the development Mac after Steam exited. The previous package and trophy-data tree were backed up; all trophy-data file checksums matched before and after replacement. No refresh, discovery, reimport or data repair ran during installation.

These checks are not live-host certification. The broad release ledger still has 20 pending runtime gates, including physical Deck/controller and cross-platform UI checks. The new desktop screen/hover interactions need user verification on the actual host.

## Quick acceptance check after restart

1. Open Trophies → Settings → Appearance. Compare 80%, 100% and 200% text/trophy sizes; the actual glyph should resize and rows should stay aligned. Hover the sample awards to inspect borders and tooltip layouts.
2. In a game, choose artwork/fallbacks, search by title or description and try earned/tier filters. Scroll to the bottom. Verify Forager’s recorded Completionist Platinum and the duplicate-original preference.
3. Pin/hide/restore a game and confirm mutually exclusive corner markers. Toggle scrollbar and release-year options.
4. Choose a theme/custom palette, then close/reopen with window memory on and off. Check the recap’s period labels and hidden-game inclusion.

Report a screenshot and the relevant appearance settings if a layout differs. Do not delete or reimport trophy history to diagnose UI problems. Roll back by closing Steam and restoring the previous `.star`; retain current trophy data unless intentionally restoring a separate data backup.

## Intentionally deferred or unavailable

Toast delivery, audio/visual notification expansion, custom toast layouts and Millennium/Steam overlay diagnosis are deferred. No host library, Vulkan option or system security setting was changed. Automatic DLC membership is not inferred. Exact joint completion rarity and playtime-based recap statistics remain unavailable, with clearly labeled alternatives rather than invented data.
