# SteamTrophies 0.4.0-rc.3 — controls and accessibility

Experimental prerelease, not a stable release. This remains a Millennium `.star` add-on, not a standalone application or Windows `.exe` installer. The package is unsigned; use only an appropriate compatible development/test host. Do not bypass security protections.

## Included

Compact switches and color swatches, working question-mark tooltips, right-aligned Settings Back/Close, visible pin/unpin state, a smaller Steam toolbar trophy, the trophy-refresh sheet icon with its activity dot contained inside the button, short pack/theme names, optional checkboxes and sidebar navigation, custom trophy artwork tints, color-blind palettes with tier letters, animation-speed controls, and a silent toast appearance/glow preview. New-user Bronze/Silver borders default on; existing explicit preferences are preserved.

[Detailed guide](https://github.com/lydia1204/SteamTrophies/blob/main/docs/CONTROLS_0.4.0-rc.3.md) · [Installation: Windows, Linux, experimental macOS and Decky](https://github.com/lydia1204/SteamTrophies#compatibility)

## Validation

Source: `58f60e9585d40ed3f75cbf6f469ddb8686e2855c`.

[All six OS/Node CI jobs and production packaging passed](https://github.com/lydia1204/SteamTrophies/actions/runs/34407428513). Local checks passed 85 tests, full release validation, 135 CSS layout cases and nine interactive isolated React scenarios. The downloaded CI package was independently verified with Starlight on macOS. These are engineering/package checks, not live Steam, physical Deck or gameplay validation. Broad runtime gates remain pending.

Desktop artifact: `dev.steamtrophies.client.star`, 3,205,874 bytes.

SHA-256: `96d87abeadd8a0922fd45db06587f90823e5e72d8a7abec5e567d27d5d281de8`

The read-only Decky adapter is unchanged at rc.1; its existing ZIP is included for convenience, not desktop feature parity.

SHA-256: `6e9a9c25f261e73b9d91960eab9c7cdf7faffa982ed5d34f8b9066518ed4478d`

## Update safely

Fully quit Steam. Back up the complete SteamTrophies data directory and previous plugin. Verify `SHA256SUMS.txt`, replace only this plugin package using a compatible host's documented flow, and relaunch. Do not refresh, discover or reimport just to update. Check your saved pins, hidden games and settings afterward.

## Still deferred

Steam overlay/in-game toast delivery; a no-injection standalone edition for Windows/macOS/Linux; signed `.exe` installation and automatic updates; expanded original sound packs/ElevenLabs. Existing MP3/WAV/OGG pack imports remain supported. [Required edition and updater milestone](https://github.com/lydia1204/SteamTrophies/blob/main/docs/EDITIONS_AND_UPDATES.md).
