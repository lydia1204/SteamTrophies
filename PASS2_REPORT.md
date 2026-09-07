# Pass 2 report: customization + Big Picture foundations

Version: `0.2.0-alpha.1`

Pass 2 extends Pass 1 without replacing Trophy Core or persistence architecture.

## Implemented

### Trophy resource packs

- Four bundled packs: Classic, Crest, Minimal, Crystal.
- Versioned `manifestVersion: 1` user-pack contract.
- Global default pack selection.
- Per-game whole-pack override UI directly on the game's Trophy page.
- Persisted foundations for per-tier and per-achievement overrides.
- Resolution precedence: achievement > game tier > game pack > global > Classic.
- Candidate fallback chain prevents missing/corrupt custom art from blanking trophy icons.
- Managed user-pack catalog and bounded data-URL asset cache.
- Original source path + managed-copy path surfaced in UI.
- Safe removal scrubs global/game/tier/achievement references.
- Import/update, reveal source folder, reveal managed copy, remove/reset controls.

### Hardened importer

- Directory picker frontend bridge.
- Canonicalization and traversal rejection.
- Symlink rejection at source, manifest and recursive-entry levels.
- Numeric/file/count/size bounds.
- PNG/JPEG/WebP-only user art with magic-byte verification.
- Staged copy + atomic promotion + replacement rollback.
- No shell execution, scripts, CSS, SVG or executable user content.
- Standalone `npm run pack:validate -- <folder>` validator.
- JSON Schema and directly importable example pack.
- `.sttpack` archive contract reserved for later; no unsafe fake extractor added.

### Theming/layout foundations

- Semantic theme-token compiler to `--stt-*` variables.
- Surface overrides for Desktop/Big Picture/Deck.
- Accessibility layer for reduced motion/high contrast/text/icon scale.
- Stable `data-stt-*` styling hooks.
- Widget registry concepts and per-surface layout order/visibility state.
- Surface capability model.

### Big Picture

- Separate Big Picture shell exported for runtime hook integration.
- FocusRing-backed controller game cards.
- Four-tier summary.
- Nearly Complete and Recent Trophy Activity shelves from warm cache.
- Shared game details and trophy resource resolver.
- Per-surface layout ordering.

## Intentionally not faked

- Exact live Steam Big Picture/main-menu route injection. Verify current client chunks/routes first and keep the hook tiny.
- Numeric/raw `EUIMode` mapping. Public runtime methods are bridged, but raw enum values are not guessed.
- `.sttpack` archive extraction. Current documented Millennium Lua APIs do not supply an archive extractor; directory packs are fully usable now and the archive seam is reserved.
- Full theme editor and arbitrary custom CSS. Foundation is present; polish belongs near the end as requested.
- Arbitrary per-achievement standalone file picker. The persistence/resolution schema supports achievement overrides, but a future manifest version should add declared named assets before the UI permits arbitrary individual images. Never persist unchecked raw paths as achievement art.

## Verification

Final pre-package verification on 2026-09-06:

- `npm run verify`: PASS
- TypeScript core typecheck: PASS
- Offline frontend TypeScript typecheck: PASS
- Node test suite: **27/27 PASS**
- `npm run pack:validate -- ./examples/trophy-pack-template`: PASS
- `python3 -m py_compile decky/main.py`: PASS
- Synthetic scale benchmark: 2,500 games × 40 achievements = 100,000 achievement inputs; 1,625 visible trophy games; 438,301-byte compact index; 29,592,916 bytes of visible game shards; ~365.85 ms build; ~2.892 ms compact-index parse on this run. Full synthetic construction is not on the trophy-button click path.

No Lua/LuaJIT/`luac` executable is installed in the packaging container, so `backend/lib/packs.lua` received source review but could not be bytecode-compiled here. Verify it with the actual Millennium LuaJIT runtime during the first live install test.
