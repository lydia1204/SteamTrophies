# Mac redesign and settings QA

## Confirmed causes

- Mac FFI already parses JSON values. The previous frontend parsed them again and incorrectly quarantined valid index/shards, triggering an empty-library scan. JSON reads now normalize either representation; startup is cache-only. Recovery restored 336 game summaries and the 2,439-app discovery ledger from existing local files/backups.
- Source patch matching did not prove Steam had applied the patch. A native-header mount now creates the real trophy button beside notifications; its loaded image, visibility and hit target were checked in live Steam.
- DOM overlays were underneath native Store/Profile/Community browser views. The cabinet now uses the SDK's managed native popout.
- The popout's transparent `.TitleBar.title-area` covered all three header buttons. Live hit-testing returned `.title-area-children` instead of the buttons. Hiding that title bar in the trophy window made all three real hit targets. The production fix is scoped to `body.st-trophy-popup`; other Steam windows are untouched.
- The saved global trophy pack was `builtin.minimal`. The supplied sheets were available, but honoring that setting kept the old cups. The user explicitly requested switching to the new Signature/base art; game and achievement overrides remain preserved.

## Settings scope reconciliation

| Area | Controls delivered | Boundary |
| --- | --- | --- |
| Trophy packs | Global pack picker, preview, import folder, remove custom pack, reveal original folder | Game/tier/exact-achievement overrides remain in game detail; settings explains their precedence |
| Appearance | Midnight/OLED/Steam Blue/High Contrast themes, text scale, icon scale, high contrast and reduced motion | A full visual theme editor is future scope, not a blank control |
| Notifications | Enable, sound, volume, position, duration, artwork, Platinum celebration, burst limit, audio cooldown, quiet hours and per-tier test buttons | Tests intentionally play sound; imports and rarity refresh do not |
| Library & data | Refresh current rarity/tiers, explicit new-game discovery, progress/errors, restore hidden games, unpin games, remove tracked projects | No destructive reset or automatic all-library reimport |
| Diagnostics | Cached games, installed packs, schema, safe mode for themes/external packs, responsive/focus diagnostics | Device-wide release gates are still pending |
| Big Picture layout | Existing surface-specific shelf visibility/order/reset | Desktop uses the approved fixed base design; no ineffective shelf controls are presented |

## Current behavior

The top refresh arrow now immediately requests global rarity for cached games and reclassifies their earned trophy tiers using current verified percentages. No achievement catalogue reimport, unlock loss, timestamp rewrite or notifications occur. Ordinary background refresh retains historical award classification; explicit user refresh opts into reclassification. Missing metadata does not overwrite a previously verified award tier.

Cards show up to ten latest earned achievement images from local shards. Hover/focus displays requirement text, percentage, trophy tier and earned date. Gold styling is applied only with verified rarity. Unverified legacy percentages display as unknown rather than fake 0% Gold. Hover data never triggers a scan or quarantine.

The header uses a neutral vector matching Steam controls; the cabinet uses original user-supplied PNG sheets through clipped SVG viewports. Custom packs continue to resolve through the existing pack system. The top X shares the same flex row as Refresh and Settings. The old black overlay padding is removed from the managed popup.

## Validation

- Full offline release validation passed (including 55 tests, resolution classifier fixtures, security corpus, repository checks and 2,500-game benchmark).
- SDK popout API checked against upstream source: https://github.com/SteamClientHomebrew/Millennium/blob/main/src/typescript/sdk/src/sharedjscontext/components/Modal.tsx
- Official hooking documentation: https://docs.steambrew.app/plugins/advanced/hooking
- Community platform reports reviewed as context, not Mac implementation proof: https://github.com/SteamClientHomebrew/Millennium/discussions/832
- User screenshots/live input remain the authority for visual acceptance. Cross-platform release gates are not completed by offline tests.

Next screenshot pass: Signature pack appearance; header margins; Store/Profile popup stacking; all three header buttons; settings tabs; hover descriptions and ten-image ordering; gold borders after an explicit rarity refresh; reopening without a scan.

## Installed QA build

Installed package SHA-256: `884847c5bd4716f1b9596f8d1468c010dfeb57d235604e509c9abb0620e4a89f`.

Post-install live DOM checks: one clickable header trophy button; native title bar hidden only in the trophy popup; Refresh, Settings and X all at y=19 with identical 40×40 hit boxes; Settings opened successfully. Saved index still has 336 games and 44,297 trophies. Final visual acceptance and an actual complete user-triggered rarity refresh remain pending.

The user subsequently selected Classic/Signature in the old Settings after the temporary title-bar fix, so the saved default required no forced rewrite. The reported trophy cutout slivers came from SVG letterboxing revealing neighbors beyond the requested viewBox. The current sheet renderer uses a nested clipped SVG viewport and the spaced second sheet row. Original PNG files remain unchanged.

Follow-up: selected/focused buttons now use one inset focus outline instead of a selected border plus an outside ring. Ten achievement images occupy one horizontal row; virtual row height is 104 CSS pixels rather than 128. Verified Gold achievements have a gold rim, glow and periodic sheen, disabled under reduced motion. The 55 tests and frontend/CSS checks passed again. User screenshots confirmed the supplied trophy artwork and Settings now render; the latest one-row/shimmer revision still needs the user's visual pass.
