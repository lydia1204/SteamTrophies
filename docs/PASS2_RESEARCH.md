# Pass 2 research decisions

Checked against current public documentation on 2026-09-06 before freezing Pass 2.

## Millennium / Steam UI

- Steam Homebrew documents `SteamClient.System.OpenFileDialog(FileDialog)` and `FileDialog.bChooseDirectory`, so the custom-pack UX uses Steam's own directory chooser instead of manual path entry.
- `OpenLocalDirectoryInSystemExplorer` is documented, so the game override UI can reveal both the author's original source and the managed installed copy.
- Millennium's Lua `fs` module documents `is_symlink`, `list_recursive`, `canonical`, `relative`, `copy`, `rename`, `remove_all`, `file_size`, and related primitives. The importer is built only from those documented filesystem capabilities and normal bounded file reads, with no shell execution.
- Millennium's current Hooking API operates through Steam's server router and is the recommended path for modifying served Steam JavaScript. Legacy `findElement`/window-create patching is explicitly deprecated. Big Picture and toolbar insertion therefore remain tiny hook adapters rather than DOM-wait logic spread through Trophy components.
- `FocusRing` is documented as especially useful in BPM, so the first Big Picture shell uses it around controller-selectable game cards.
- `SteamClient.UI.GetUIMode()` and `RegisterForUIModeChanged()` are documented. Pass 2 exposes a raw bridge, but deliberately leaves the runtime enum mapping for generated/live typings rather than hard-coding guessed numeric values.

References:

- https://docs.steambrew.app/plugins/ts/client/src/interfaces/System
- https://docs.steambrew.app/plugins/ts/client/src/interfaces/FileDialog
- https://docs.steambrew.app/plugins/lua/fs
- https://docs.steambrew.app/plugins/advanced/hooking
- https://docs.steambrew.app/plugins/ts/Millennium
- https://docs.steambrew.app/plugins/ts/components/FocusRing
- https://docs.steambrew.app/plugins/ts/client/src/interfaces/UI

## Theme foundation

The Design Tokens Community Group published its first stable specification, 2025.10, on 2025-10-28. It explicitly addresses theming, token relationships/aliases, and cross-platform resolution. SteamTrophies Pass 2 does not pretend to fully implement the DTCG format yet; it uses a smaller semantic token schema and a compiler seam so the final theme pass can move toward interoperable import/export without rewriting every component.

References:

- https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/
- https://www.designtokens.org/tr/2025.10/

## Resource archive decision

The current documented Millennium Lua module index exposes filesystem, HTTP, JSON, regex, datetime, logger and utility surfaces, but no documented ZIP/archive extraction module was found. Pass 2 therefore makes pack **directories** fully functional now and reserves `.sttpack` as the future archive form of the same manifest/directory contract.

Do not bridge this gap by shelling to a platform-specific archive executable. When an approved extractor is selected later, it must extract to staging and then pass the same path/link/type/size/magic-byte validation before promotion.

## Browser/CSS compatibility decision

Steam theming documentation in the ecosystem is not consistent enough to justify baking one claimed CEF version into SteamTrophies. Theme output therefore stays conservative: semantic CSS variables, flex/grid, stable attributes, and ordinary selectors. Do runtime capability testing before adopting newer CSS features in the final theme editor.
