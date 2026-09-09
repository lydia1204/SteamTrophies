# Codex: start here

Current repository state: **SteamTrophies 0.4.0-rc.2 desktop release candidate**; Decky remains the separate rc.1 read-only adapter.

Read [the rc.2 settings/recap guide](docs/SETTINGS_RECAP_0.4.0-rc.2.md) and [rollout/validation notes](docs/RELEASE_NOTES_0.4.0-rc.2.md) before resuming older checklists. Toast notifications and the Steam/Millennium overlay investigation are explicitly deferred by the user. Do not resume them or change the Vulkan launch option without a new request. Non-toast code is implemented, packaged and installed; live UI acceptance remains distinct from passing automated checks.

The broad architecture and offline hardening passes are complete. Do not restart the project from scratch.

For the final live/product pass, use:

**[`CODEX_FINALIZE_PROMPT.md`](CODEX_FINALIZE_PROMPT.md)**

That file is the authoritative finalization brief and includes:

- dependency locking/auditing
- real Starlight/Lua/package validation
- current Millennium Hooking API integration
- Steam Stable and Beta tests
- large real-library validation
- controller-only Big Picture QA
- physical Steam Deck/Decky finalization
- macOS development validation without false live-support claims
- localization/pseudo-localization
- security review
- 20 evidence-bearing runtime gates
- real README screenshot capture
- CI/reproducibility
- coherent commits and safe final GitHub push

## Preserve these product invariants

- Steam achievements are authoritative.
- Awarded trophy tier and award-time rarity are permanent history.
- Platinum is synthetic and requires all real achievements.
- Normal library remains earned-only by default.
- UI opening stays local/warm-cache only.
- Resource packs stay data-only.
- Asset precedence stays achievement -> game tier -> game pack -> global -> Classic.
- Private Steam UI details remain isolated in compatibility bridges.
- Desktop, Big Picture and Deck share Trophy Core without sharing one rigid layout.
- Responsive logic uses measured CSS-pixel container size.
- Host integration fails closed instead of risking Steam stability.

## Offline release gate

```bash
npm run release:validate
```

## Live public-release gate

```bash
npm run runtime:gates:require-pass
```

The second command is intentionally red until real Steam/device evidence is recorded. Never weaken it to manufacture a green release.
