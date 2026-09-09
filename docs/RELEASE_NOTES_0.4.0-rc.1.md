# SteamTrophies 0.4.0-rc.1 — experimental candidate

This is a private testing prerelease, **not a production-ready public release**. Installation, platform prerequisites, backup instructions and troubleshooting are in the [README](../README.md).

## Downloads

- `dev.steamtrophies.client.star`: unsigned modern Millennium plugin. Requires a compatible Lua/Starlight host. It is not a Millennium installer, legacy plugin folder or Decky package.
- `SteamTrophies-Decky-0.4.0-rc.1.zip`: experimental Decky adapter, packaged with one top-level directory and four release files. It reads an existing saved trophy cabinet; it does not implement independent discovery, the full desktop UI or live unlock notifications.
- `SHA256SUMS.txt`: integrity hashes for both files. Hashes are not publisher signatures.

The `.star` is byte-identical to the locally installed September 8 candidate, with runtime source at commit `9280245`. Subsequent documentation changes do not change that runtime. The Decky ZIP was built from the same runtime source. Neither package includes the locally built experimental Mac host/launcher/compiler.

| Artifact | SHA-256 |
| --- | --- |
| `.star` | `03840caa54e56ee8d372ce5e535b41336ef090d1d165b3a6f67177eb4931972c` |
| Decky ZIP | `6e9a9c25f261e73b9d91960eab9c7cdf7faffa982ed5d34f8b9066518ed4478d` |

## Included desktop work

- Corrected trophy artwork and selectable visual/sound packs, including MP3 support.
- Working settings sections, compact adaptive achievement strips, gold effects and optional Bronze/Silver borders.
- Achievement tooltips, retained Platinum completion evidence and blue Platinum tooltips; reviewed Forager historical-completion handling.
- Portrait, landscape and icon game art with ordered fallbacks.
- Pointer-aware focus, corner pin markers, hidden-game recovery, click-only Steam-page dismissal and scrollable game detail.
- Explicit rarity repair separate from discovery, with preserved achievement records/customizations and silent historical import/repair.
- Local notification previews, native delivery compatibility, delayed outside-window tests and bounded delivery diagnostics.

## Validation

The full local `release:validate` suite and Lua validation passed again for this publication. There are 70 passing automated tests, 21 resolution fixtures, 15 hostile-pack cases plus a platform-supported symlink test, and a passing 2,500-game/100,000-achievement benchmark. `npm audit --audit-level=high` reported zero vulnerabilities on September 8, 2026; this is a point-in-time dependency result, not a security guarantee. All five `.star` sections verified. The Decky ZIP passed archive integrity checks and matches the expected loader layout.

GitHub Actions results are separate from these local checks. Runtime evidence remains **0 pass / 20 pending** in the broad release ledger. The gamer QA ledger contains 42 engineering passes and eight live checks still needing evidence.

The first clean Windows/Linux CI runs exposed Starlight 1.1.4 treating Decky's `callable` API as Millennium Lua FFI across the repository. A follow-up names that import `deckyCallable`, preserving the Python protocol and avoiding fabricated Lua exports or disabled validation. This is a source-tooling correction; the candidate's existing runtime packages retain the hashes above. Consult Actions for the follow-up result.

## Known limitations and next tests

- macOS uses an experimental source-built host; a supported stock installer path is not established.
- Terraria's own overlay failed on the tested Mac. Trophy audio/desktop delivery worked, but no in-game visual was confirmed. The exact injection failure remains unresolved; no game launch options, permissions or global Steam notification settings were changed.
- Retest pointer focus, hidden-game restoration/funnel collapse, Platinum hover, pin/count alignment and artwork fallbacks on the current live host.
- Physical Steam Deck installation, controller navigation, sleep/resume and docked layouts remain unverified. The Decky adapter is a limited saved-cabinet viewer, not feature parity.
- Historical rarity/dates/completion evidence cannot be invented when unavailable. Explicit rarity repair deliberately recalculates tiers from current percentages.

## Safe upgrade

Quit the active host, back up the complete data root (including managed packs) and existing plugin, then replace only the correct plugin artifact. Restart through the required host launcher. **Do not refresh, reimport or reset the library merely to install an update.** Keep matching plugin/data snapshots for rollback.

No project license or general redistribution permission has been selected. Public distribution still requires the owner's licensing decision, asset-rights review and honest runtime acceptance status.
