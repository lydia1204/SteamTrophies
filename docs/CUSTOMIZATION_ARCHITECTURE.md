# Customization architecture

Pass 3 finishes the customization foundations. Pass 4 can focus on visual refinement/editor ergonomics instead of changing persistence or component contracts.

## One rule above all

Trophy/domain code deals in semantics. It never knows theme filenames or arbitrary pack paths.

Components consume:

- semantic trophy resources;
- semantic design tokens;
- stable widget IDs;
- surface capabilities;
- persisted user preferences.

Roots/components expose stable hooks such as:

```html
<div data-stt-root data-stt-surface="big_picture" data-stt-width-band="standard">
<section data-stt-component="dashboard-widget" data-stt-widget="nearCompletion">
<button data-stt-component="game-card" data-stt-appid="105600">
```

These `data-stt-*` attributes plus `--stt-*` variables are the public styling seam for the eventual advanced theme layer/CSS Loader compatibility.

## Themes

Built-ins currently include Midnight, OLED Black, Steam Blue and High Contrast. `theme.ts` compiles semantic tokens to CSS variables and applies accessibility as a separate layer.

Theme identity never owns reduced motion, high contrast, text scale or icon scale. Switching themes cannot silently undo accessibility preferences.

The model is intentionally inspired by the stable DTCG 2025.10 direction without claiming full DTCG conformance. The Pass 4 visual editor can add token import/export/aliases without rewriting components.

Raw arbitrary CSS is not the normal theme format. If an advanced CSS option is added, scope it beneath `[data-stt-root]`, reject remote imports/resources, validate before activation, and retain safe-mode recovery.

## Layouts

`layout.ts` stores stable registered widget IDs, per-surface order and per-surface visibility. Desktop, Big Picture and Deck arrangements are separate.

The editor can move/show/hide/reset widgets now. Big Picture consumes the order directly. Persisted IDs, not React component names or array indexes, define identity.

## Resource overrides

Trophy visuals resolve:

achievement → game tier → game pack → global pack → Classic.

Pack manifests can provide named `custom.*` assets, so one achievement can have bespoke art without saving a raw filesystem path.

See `RESOURCE_PACKS.md`.

## Surface capabilities

Feature code should query capabilities such as controller, hover, touch, quick access and controller reordering rather than growing `if Deck / if BPM / if Windows` branches.

Current Millennium GamePad/Desktop mode values are isolated in `frontend/runtime/steam-ui.ts`; Decky remains a separate future runtime shell over shared semantics.

## Diagnostics and safe mode

Customization state includes:

- disable external packs;
- disable selected themes;
- theme failure counter/last-known-good theme contract;
- focus debug;
- responsive debug.

Pack asset resolution always retains a built-in fallback. External customization should degrade, never make the trophy cabinet inaccessible.
