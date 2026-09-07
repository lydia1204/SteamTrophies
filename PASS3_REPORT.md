# SteamTrophies Pass 3 report

Version: `0.3.0-alpha.1`

Pass 3 finishes the feature surface identified at the end of Pass 2 and adds explicit resolution/rendering compatibility engineering before further visual refinement.

## Implemented

### Resource packs and overrides

- manifest-v1 richer metadata: homepage, tags, accent, attribution, recommended surfaces;
- up to 48 declared `custom.*` one-off trophy images per pack;
- optional Bronze/Silver/Gold/Platinum WAV/OGG toast sounds;
- every imported regular file must be declared;
- source/staging/managed-copy symlink rejection and existing size/path/magic-byte protections retained;
- global pack selection;
- per-game whole-pack overrides;
- per-game per-tier pack overrides;
- per-achievement resource overrides, including named one-off icons;
- original source folder + isolated managed-copy locations exposed in game UI;
- safe cleanup when a pack is uninstalled;
- example pack upgraded to exercise custom icon + sound + metadata;
- schema and CLI validator updated.

### Trophy Projects and library QoL

- up to three active completion projects;
- optional explicit target achievements inside a project;
- pinned games;
- hidden games;
- tracked-game persistence foundation;
- All / Projects / Nearly Complete / Platinum collections;
- pin/project/hidden state affects Desktop and Big Picture presentation.

### Movable dashboards

- stable widget registry;
- per-surface visibility/order;
- move up/down/show/hide/reset UI;
- Big Picture home consumes the persisted ordering directly.

### Notifications

- Trophy Core unlock events feed a dedicated toast queue;
- per-tier custom pack sounds;
- position, duration, volume and artwork controls;
- quiet hours including overnight ranges;
- Platinum celebration toggle;
- Bronze/Silver/Gold/Platinum preview buttons;
- theme-aware toast host;
- notification subsystem does not replace Steam's global notification implementation.

### Theme/accessibility foundation

- built-in Midnight, OLED Black, Steam Blue and High Contrast themes;
- semantic theme variables and stable `data-stt-*` styling contract;
- per-surface token compilation;
- text and trophy icon scaling to 200%;
- reduced motion and high contrast independent from selected theme;
- safe-mode state and developer focus/responsive diagnostics.

### Big Picture / GamePad

- dedicated Big Picture shell rather than desktop scaling;
- controller-focusable game shelves;
- Trophy Projects, Nearly Complete, Recent, Completed and All Trophy Games shelves;
- active resource packs throughout;
- controller-reachable customization view;
- current `EUIMode.GamePad=4`, `Desktop=7` mapping isolated in one compatibility bridge;
- live shell switching through `GetUIMode()` and `RegisterForUIModeChanged()`.

### Resolution compatibility

- `ResizeObserver` container measurement;
- semantic width/height/aspect bands;
- no CSS container-query dependency;
- no CSS `aspect-ratio` dependency;
- variable-height-aware virtualized list at enlarged text sizes;
- 720p, Deck 1280×800, 1080p, 1440p, 21:9, 4K and 32:9 fixtures;
- Deck three-column cap;
- global six-column cap;
- 32:9 content restraint;
- `npm run check:cef85` compatibility guard;
- `npm run resolution:test` regression matrix.

## Deliberately still runtime-verified rather than fabricated

- Exact compiled-Steam desktop header patch. The export is ready, but the target chunk must be inspected on the live Steam build.
- Optional deep Big Picture main-menu/game-page insertion. The plugin panel itself now switches to the Big Picture shell in GamePad mode, so core BPM usability does not depend on this hook.
- Real-world first-import timing/tuning against a large Steam account.
- Steam achievement icon normalization on any live build that returns a non-URL token.
- `.sttpack` archive extraction. Directory packs are complete; unsafe shell extraction remains prohibited.

These are external-runtime integration checks, not missing Trophy Core/customization architecture.

## Verification

Final verification run on 2026-09-06:

- core TypeScript typecheck: passed;
- offline frontend TypeScript typecheck: passed;
- CEF85 CSS compatibility guard: passed;
- test suite: **33/33 passed**;
- responsive resolution matrix: **8/8 passed**;
- example trophy pack validator: passed, 7/7 declared resources verified;
- Decky Python modules: `py_compile` passed;
- Lua source: reviewed, but this build environment does not contain `lua`, `luac`, or LuaJIT, so no claim of bytecode compilation is made.

Final synthetic scale benchmark:

- 2,500 generated games;
- 40 achievements per game / 100,000 achievement inputs;
- 1,625 visible trophy games;
- full synthetic state construction: **245.09 ms**;
- compact warm index: **438,301 bytes**;
- visible game shards: **29,592,916 bytes**;
- simulated warm-index parse: **3.517 ms**.

The full state-construction benchmark is deliberately off the trophy-button critical path. Normal opening consumes the already-written compact index.
