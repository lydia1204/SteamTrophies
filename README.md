# SteamTrophies

**A trophy cabinet for Steam that treats achievements like achievements deserve to be treated.**

SteamTrophies is an open-source Steam client plugin project that layers a fast, controller-friendly trophy experience over Steam achievements without replacing Steam as the source of truth. It assigns rarity-driven Bronze, Silver and Gold trophies, creates a synthetic Platinum for true game completion, preserves the rarity a trophy had when you earned it, and presents the result through Desktop, Big Picture and future Steam Deck surfaces.

Current repository state: **0.4.0-rc.1 release candidate**.

> [!IMPORTANT]
> This repository is intentionally at release-candidate stage. The offline engineering gates are automated, but several live Steam and physical-device release gates still require evidence on the exact current Steam/Millennium/Decky builds. See [Runtime Release Gates](docs/RUNTIME_RELEASE_GATES.md).

## Why SteamTrophies exists

Steam achievements are excellent game data, but the default Steam client does not provide the kind of persistent trophy-cabinet experience many completionists enjoy on console platforms. SteamTrophies keeps Steam achievements intact and adds a presentation layer focused on rarity, completion, history, customization and large-library usability.

The project is built around a few hard rules:

- **Steam remains authoritative.** SteamTrophies never invents a real game achievement.
- **Your trophy history is durable.** A trophy's awarded tier and award-time rarity do not silently change because global percentages drift later.
- **Completion feels special.** Platinum is synthetic and appears only after every real Steam achievement in a game is earned.
- **Your library stays clean.** Ordinary 0% games do not flood the trophy cabinet.
- **Opening the UI is local-first.** Network calls and full library scans do not sit on the trophy-button critical path.
- **Customization is data, not executable code.** User trophy packs cannot smuggle JavaScript, Lua or arbitrary programs into Steam.
- **Controller use is first-class.** Big Picture is a dedicated surface, not a stretched desktop panel.
- **Steam must survive plugin failure.** Host integration is isolated and designed to fail closed.

## Gallery

Real runtime screenshots are a release gate, not marketing mockups. Before the first public release, the finalizer must capture the following from the actual plugin running in Steam and place them in `docs/images/`:

1. `desktop-library.png` - Desktop trophy library
2. `game-trophies.png` - Game trophy detail page
3. `game-pack-overrides.png` - Game-specific trophy pack customization
4. `big-picture-home.png` - Big Picture trophy home
5. `trophy-toast.png` - Real trophy notification
6. `steam-deck-gaming-mode.png` - Physical Steam Deck Gaming Mode

See [`docs/images/README.md`](docs/images/README.md) for the capture contract. The public README should show those images only after they exist and correspond to a tested build.

## Trophy system

SteamTrophies classifies each real Steam achievement by global unlock percentage. Defaults are configurable but intentionally conservative:

| Trophy | Default global unlock rate |
| --- | ---: |
| Gold | 5% or lower |
| Silver | More than 5%, up to 20% |
| Bronze | More than 20% |
| Platinum | Synthetic, all real achievements earned |

When an achievement is earned, SteamTrophies freezes both the awarded tier and the global rarity seen at award time. If a game's global statistics later drift, the historical trophy does not quietly change from Gold to Silver.

If a developer later removes an achievement from Steam, previously earned trophy history is retained as retired history. Removed locked achievements are not fossilized into the library.

## Major features

### Fast large-library browsing

- Compact warm library index for instant UI paint.
- Per-game shards so one giant JSON document is never required.
- Resumable background discovery for libraries with thousands of titles.
- Bounded refresh concurrency, retry backoff and cancellation.
- Local corruption recovery from validated shards before any network access.
- Virtualized game lists with accessibility-aware row sizing.
- Normal library hides untouched 0% games by default.

The permanent benchmark fixture uses **2,500 games and 100,000 achievements** and is enforced by `npm run bench`.

### Trophy Projects

Keep up to three current completion projects and optionally target exact locked trophies. Projects can appear as their own shelf or collection without filling the normal cabinet with every untouched game in your Steam library.

### Custom trophy resource packs

SteamTrophies ships with several built-in visual packs and supports user-created data-only packs.

Override precedence is:

```text
Exact achievement
  -> game tier override
  -> game pack
  -> global pack
  -> built-in Classic fallback
```

A user can therefore make one game use a completely different trophy style, override only its Gold trophies, or assign a one-off custom emblem to one specific achievement.

Custom packs can provide:

- Bronze, Silver, Gold and Platinum icons
- Named one-off trophy assets
- Per-tier WAV or OGG trophy sounds
- Preview and attribution metadata
- Recommended surfaces and tags

User packs are validated before installation. They reject traversal, symlinks, undeclared files, executable masquerading, oversized payloads and absurd decoded image dimensions.

Start with [`examples/trophy-pack-template`](examples/trophy-pack-template) and read [Resource Packs](docs/RESOURCE_PACKS.md).

### Game-specific override UI

Each game can expose a Trophy Icons panel where users can:

- select a pack only for that game
- override Bronze, Silver, Gold or Platinum individually
- select named one-off icons for exact achievements
- preview resolved tier art
- reset back to inherited defaults
- reveal the original authoring folder
- reveal SteamTrophies' managed copy
- re-import an updated source pack

### Themes and accessibility

The UI uses semantic `--stt-*` variables and stable `data-stt-*` hooks rather than hard-coded appearance assumptions. Built-in foundations currently include Midnight, OLED Black, Steam Blue and High Contrast.

Accessibility state is separate from theme state and includes:

- text scaling up to 200%
- trophy/icon scaling up to 200%
- reduced motion
- high-contrast override
- focus diagnostics

A future visual theme editor can therefore manipulate an existing token system instead of rewriting finished components.

### Big Picture and controller use

Big Picture has a dedicated shell with controller-focusable shelves rather than a scaled desktop overlay. Current architecture includes:

- Trophy Projects
- Nearly Complete
- Recent Trophy Activity
- Completed Games
- All Trophy Games
- trophy totals
- active resource packs
- per-surface layout order
- GamePad/Desktop UI-mode switching through one isolated compatibility bridge

No important Big Picture interaction should depend on hover, right-click or precise pointer dragging.

### Trophy notifications

Unlock notifications support:

- Bronze, Silver, Gold and Platinum presentations
- positions and duration
- pack-provided sounds
- volume
- quiet hours, including overnight ranges
- reduced-motion behavior
- Platinum celebration behavior
- preview/test buttons
- bounded simultaneous toasts
- audio cooldown and burst coalescing

Every trophy event is retained even when a burst is visually or audibly condensed.

### Layout customization

Desktop, Big Picture and Deck surfaces maintain independent layout state over stable widget IDs. Widgets can be shown, hidden and reordered without changing Trophy Core semantics.

## Platform status

| Platform | Development / tests | Live plugin target | Status at this RC |
| --- | --- | --- | --- |
| Windows 10/11 | Yes | Millennium | Primary live target, runtime gates pending |
| Desktop Linux | Yes | Millennium | Primary live target, runtime gates pending |
| Steam Deck Desktop Mode | Yes | Millennium/Linux | Same underlying Linux constraints |
| Steam Deck Gaming Mode | Yes | Decky shell over shared core | Final live Decky packaging and physical-device gates pending |
| macOS | Yes | Upstream-dependent | Build/test/storage-path compatible; do not claim current Millennium injection support until upstream supports it and it is tested |

See [Platform Matrix](docs/PLATFORM_MATRIX.md) for the detailed device/runtime matrix.

## Installation

### End users

**Do not treat this RC source tree as a signed public release yet.** The finalizer should produce the exact release artifact after the live runtime gates pass.

Once released, prefer the supported plugin manager/database path for the host rather than downloading random repackaged binaries from third-party mirrors.

### Windows with Millennium

1. Install a current supported Millennium release for Steam.
2. Fully restart Steam after Millennium installation if required by Millennium.
3. Install the published SteamTrophies package through its supported plugin installation flow.
4. Open SteamTrophies once and allow first-run discovery to proceed in the background.
5. Open **SteamTrophies -> Diagnostics** if the trophy entry does not appear.

For source development, see [Build from source](#build-from-source).

### Linux with Millennium

1. Use a Millennium-supported native Steam installation.
2. Install the current supported Millennium release.
3. Install the published SteamTrophies package through the normal plugin flow.
4. Restart Steam if requested.
5. Let first-run achievement discovery run in the background.

Avoid claiming support for a Steam packaging format that Millennium itself does not currently support. If Steam or Millennium is installed through an unusual containerized distribution, verify upstream support first.

### Steam Deck Gaming Mode

The architecture contains a separate Decky shell that shares Trophy Core and persisted data shapes. Before the public release, the finalizer must:

1. package the Decky plugin using the then-current Decky template and `@decky/ui`
2. test installation through a current Decky Loader build
3. complete the controller-only runtime gates
4. test native 1280x800 plus docked external-display layouts on physical hardware
5. verify sleep/resume and offline behavior

Until those gates are complete, the Decky package should be described as release-candidate functionality rather than a finished public binary.

### macOS

The repository supports macOS development and uses:

```text
~/Library/Application Support/SteamTrophies/
```

for local data when running on macOS.

However, live Steam client injection depends on the current host project's macOS support. Building or testing the source on a Mac does **not** by itself prove that the released Millennium runtime can load it into Steam. The final public documentation must reflect the actual upstream state at release time.

## Build from source

### Prerequisites

- Git
- Node.js 22 or 24 LTS recommended for this RC
- npm
- a current TypeScript-compatible development environment
- current Steam/Millennium tooling for real runtime integration
- Python 3 for the Decky-side syntax/build workflow
- a Lua/LuaJIT parser or compiler for final backend validation

Clone the repository and install the exact dependency graph:

```bash
git clone <your-fork-or-project-url>
cd SteamTrophies
npm install
```

The release repository should commit the real generated `package-lock.json`. Do not manufacture one by hand.

Prepare Starlight language/tooling support:

```bash
npm run prepare
```

Run the full offline engineering gate:

```bash
npm run release:validate
```

Build the Millennium package:

```bash
npm run build
```

During development:

```bash
npm run dev
```

## Validation commands

```bash
npm run typecheck:core
npm run typecheck:frontend:offline
npm run check:cef85
npm test
npm run resolution:test
npm run security:audit
npm run security:pack-corpus
npm run gamer:qa
npm run pack:validate -- examples/trophy-pack-template
npm run repo:validate
npm run bench
npm run release:validate
```

Runtime release gates are separate by design:

```bash
npm run runtime:gates
npm run runtime:gates:require-pass
```

The second command must not pass before public release unless every required live gate contains real evidence.

## Device and resolution compatibility

SteamTrophies lays out against its **actual measured CSS-pixel container**, not a guessed monitor resolution. The automated matrix currently includes 21 environments from a 360px emergency-narrow viewport through handheld-class layouts, Deck, 720p/1080p/4K Big Picture, common laptops, 21:9, 32:9, 5K2K and Retina-class stress cases.

A G9-class 5120x1440 display deliberately caps useful content columns rather than stretching trophy cards across the entire horizon.

The CSS compatibility gate also protects the renderer floor used by Steam's current embedded UI. See [Responsive Compatibility](docs/RESPONSIVE_COMPATIBILITY.md).

## Data and privacy

SteamTrophies is designed local-first.

Primary data locations:

```text
Windows: %LOCALAPPDATA%\SteamTrophies\
         fallback %APPDATA%\SteamTrophies\

Linux:   ${XDG_DATA_HOME:-~/.local/share}/SteamTrophies/

macOS:   ~/Library/Application Support/SteamTrophies/
```

Durable data includes trophy award history and user customization. Disposable caches are designed to be rebuildable.

Friend comparison should prefer permitted in-client Steam data. If a Steam Web API fallback is used, API keys must stay out of renderer state, URLs, logs, backups and resource packs.

SteamTrophies should not upload trophy history to a project-owned server merely to render the local UI.

## Backups

The storage architecture separates durable trophy history/customization from rebuildable caches so backups can target the data users actually care about.

The repository includes backup/export scaffolding. Final polished backup UI is part of finalization if not already complete on the target branch.

## Troubleshooting

### SteamTrophies does not appear

1. Confirm Steam and the plugin host are on supported builds.
2. Restart Steam completely.
3. Confirm SteamTrophies is enabled in the host plugin settings.
4. Open SteamTrophies Diagnostics if the panel itself is available.
5. If the header integration is missing but the plugin surface works, treat it as a host compatibility issue rather than deleting trophy data.
6. Test with Steam Stable if you are currently on Steam Beta.

The plugin is intentionally designed so a missing private-Steam anchor should fail closed rather than patching an unknown location.

### Trophy screen opens but a game is missing

By default, untouched 0% games are deliberately hidden.

A game should normally appear after it has at least one earned/historical trophy. Use Trophy Projects/tracking for titles you intentionally want to surface before earning anything.

### A trophy tier changed globally but mine did not

That is expected. SteamTrophies freezes the tier and rarity recorded when the trophy was awarded. Current global rarity can still be displayed separately.

### A custom trophy pack will not import

Run:

```bash
npm run pack:validate -- /path/to/pack-folder
```

Common rejection causes include:

- undeclared files
- symlinks
- unsupported formats
- path traversal
- files that have the wrong real signature for their extension
- excessive file size
- excessive decoded image dimensions
- use of a reserved built-in pack ID

### Steam updated and the trophy button disappeared

Do not delete your trophy data. Steam's private UI can move between client builds. The header integration is intentionally isolated so the plugin can fail closed while the cached trophy cabinet remains intact.

Check project releases/issues for compatibility status, and include your Steam channel/build in bug reports.

### Big Picture focus is stuck or skips a control

Record:

- Steam Stable/Beta channel
- operating system
- controller type
- exact screen and control
- whether mouse input behaves correctly
- a short video if possible

Use the project's focus diagnostics if available.

### The UI looks too large or too small

Check SteamTrophies accessibility scale before changing operating-system DPI settings. SteamTrophies measures its rendered container and should adapt to Steam/Deck UI scaling.

### The local index is corrupt

The current storage layer validates persisted structures, keeps constrained last-known-good backups and can rebuild the compact index from valid local game shards before resorting to Steam/network work.

If recovery repeatedly fails, use Diagnostics/Safe Mode and preserve the quarantine files when filing an issue.

## FAQ

### Does SteamTrophies replace Steam achievements?

No. Steam achievements remain authoritative. SteamTrophies presents them through an additional trophy model.

### Is Platinum a real Steam achievement?

No. It is a synthetic SteamTrophies completion award created only when all real achievements for the game are earned.

### Will Gold trophies turn into Silver later?

Not after award. Historical tier and award-time rarity are frozen.

### Why are most of my 0% games hidden?

A 2,000-game Steam library becomes unusable if the trophy cabinet begins with 1,500 empty entries. SteamTrophies defaults to showing meaningful trophy history instead.

### Can I use different trophy icons for one game?

Yes. Game-level pack, per-tier and exact per-achievement overrides are part of the customization model.

### Can I create my own trophy pack?

Yes. Start from `examples/trophy-pack-template`, read `docs/RESOURCE_PACKS.md`, and run the validator before importing it.

### Can packs execute code?

No. User packs are intentionally data-only.

### Do friends need SteamTrophies installed for comparison?

The architecture is designed to use permitted Steam friend achievement data where available, so the long-term comparison model does not require another user to install the plugin merely to expose ordinary Steam achievement state. Live privacy/runtime behavior is still a release gate.

### Does it work offline?

The cabinet is local-first. Already cached trophy data, layouts, themes and customization should remain browsable offline. Refreshes naturally require Steam data when new state is needed.

### Does it work on Steam Deck?

The shared core and dedicated Decky/Big Picture architecture are present. Physical Gaming Mode and docked-device runtime gates must be completed before the project labels the Deck build production-ready.

### Does it work on macOS?

The source tree builds/tests with macOS in mind and uses the correct macOS data path. Live Steam injection depends on current upstream plugin-host support and must be stated accurately at release time.

### Why not just use raw CSS for every theme?

Stable semantic tokens and slots are easier to migrate, validate and keep controller-safe. Advanced styling can be layered on later without making brittle generated class names the public API.

### Where should I report a security issue?

Read [`SECURITY.md`](SECURITY.md). Please do not publish an exploit in a normal issue before maintainers have had an opportunity to investigate.

## Architecture

High-level flow:

```text
Steam achievement sources
        |
        v
Steam adapters / runtime bridges
        |
        v
Trophy Core
  rarity + history + Platinum + events
        |
        +-------------------+
        |                   |
        v                   v
Storage / recovery     Presentation models
                            |
             +--------------+--------------+
             |              |              |
          Desktop       Big Picture       Deck
             |              |              |
             +------ Resource / Theme / Layout ------+
```

Start with:

- [Architecture](docs/ARCHITECTURE.md)
- [Storage](docs/STORAGE.md)
- [Security](docs/SECURITY.md)
- [Resource Packs](docs/RESOURCE_PACKS.md)
- [Customization Architecture](docs/CUSTOMIZATION_ARCHITECTURE.md)
- [Big Picture](docs/BIG_PICTURE.md)
- [Responsive Compatibility](docs/RESPONSIVE_COMPATIBILITY.md)
- [Gamer QA Top 50](docs/GAMER_QA_TOP50.md)
- [Runtime Release Gates](docs/RUNTIME_RELEASE_GATES.md)

## Contributing

Read [`CONTRIBUTING.md`](CONTRIBUTING.md) before sending a pull request. In particular:

- do not put Steam private-UI selectors throughout ordinary components
- do not move network/library work onto UI-open paths
- do not weaken pack validation to make a sample import
- do not replace semantic theme/layout contracts with one-off component settings
- do not mark a live-runtime gate green without evidence

## Security

Security-sensitive design includes:

- strict renderer/backend boundaries
- no arbitrary shell execution for normal plugin work
- constrained filesystem RPC
- structural persisted-data validation
- atomic writes and corruption quarantine
- last-known-good local fallback
- hostile pack validation
- no executable user packs
- API-key isolation
- bounded refresh/background work
- host-surface ErrorBoundary containment

See [`SECURITY.md`](SECURITY.md) and [`docs/SECURITY.md`](docs/SECURITY.md).

## Release status

`npm run release:validate` is the offline engineering gate.

`npm run runtime:gates:require-pass` is the live evidence gate.

A release should not be described as production-ready until **both** are green against the intended host/device matrix and the real screenshots in the Gallery were captured from that tested build.

## License

No license is selected in this RC source tree. Before publishing, preserve any license already established in the destination GitHub repository. If none exists, the project owner must make that publication/licensing decision explicitly rather than having tooling silently invent one.
