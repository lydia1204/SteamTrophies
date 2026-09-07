# Codex finalization prompt

You are taking over the **SteamTrophies 0.4.0-rc.1 release-candidate repository**. Your job is to turn this RC into a complete, testable product and a clean GitHub repository without discarding its existing architecture.

Work autonomously. Do not ask for confirmation for routine engineering choices. Do not claim something was tested unless you actually tested it. Preserve unrelated user work and Git history.

## Product goal

SteamTrophies is a PlayStation-inspired trophy presentation layer for Steam achievements. Steam remains the source of truth. The plugin adds rarity-driven Bronze/Silver/Gold tiers, frozen award history, synthetic Platinum, a fast earned-only trophy library, custom resource packs and per-game/per-achievement overrides, Trophy Projects, themes/accessibility, notifications, movable layouts, Big Picture and a shared-core Steam Deck path.

The final product should feel like a native enthusiast-grade Steam feature, not a fragile injected webpage.

## Read first

Before changing code, read in this order:

1. `README.md`
2. `docs/PASS4_RC_REPORT.md`
3. `docs/GAMER_QA_TOP50.md`
4. `docs/RUNTIME_RELEASE_GATES.md`
5. `docs/SECURITY.md` and root `SECURITY.md`
6. `docs/RESPONSIVE_COMPATIBILITY.md`
7. `docs/RESOURCE_PACKS.md`
8. `docs/CUSTOMIZATION_ARCHITECTURE.md`
9. `docs/BIG_PICTURE.md`
10. `CODEX_START_HERE.md`

Then inspect the actual implementation and Git history before editing.

## Non-negotiable product invariants

Do not rewrite these concepts into alternatives:

- Steam achievements remain authoritative.
- Default trophy tiers remain Gold <=5%, Silver >5% and <=20%, Bronze >20%, unless a user changes configuration.
- `awardedTier` and award-time rarity are durable history and do not drift with today's global percentages.
- Platinum is synthetic and appears only after all real Steam achievements are earned.
- Normal trophy library stays earned-only by default. Do not flood it with untouched 0% games.
- Trophy UI opens from warm local state. No network request, full library scan, archive import or theme compilation on the click path.
- Resource packs remain data-only.
- Resource precedence remains exact achievement -> game tier -> game pack -> global pack -> Classic fallback.
- Desktop, Big Picture and Deck use shared Trophy Core but independent surface layouts.
- Responsive behavior uses measured CSS-pixel container size, not physical-monitor/device-name assumptions.
- Private Steam UI details stay in narrow adapters/hooks, not ordinary components.
- A failed Steam hook must fail closed and leave Steam usable.

## Step 1: inspect repository and destination Git state

Run and record:

```bash
git status
git branch --show-current
git remote -v
git log --oneline --decorate -n 20
node --version
npm --version
python --version
```

If this ZIP was unpacked outside an existing Git checkout, locate or initialize the intended repository only after checking whether the user already has a GitHub remote/project. Never overwrite unrelated history. Never force-push.

Inspect whether the destination repository already has a license. Preserve it. If no license exists, **do not invent one**. Flag it as an owner decision before a public release.

## Step 2: establish the real dependency graph

This RC intentionally contains no fabricated lockfile because its offline authoring environment could not perform a networked npm install.

Use Node 24 LTS unless current official tooling requires otherwise; Node 22 LTS is also part of CI coverage.

Run:

```bash
npm install
npm run prepare
npm audit
npm audit --omit=dev
```

Commit the authentic `package-lock.json` produced by npm.

Review audit results intelligently. Do not run destructive `npm audit fix --force` merely to make a number disappear. Update direct dependencies to current compatible releases only after checking official Millennium/Starlight/Decky documentation and changelogs.

The RC baseline pins `@steambrew/starlight` 1.1.4 because that was current during the 2026-09-06 research pass. Verify it is still appropriate at finalization time before changing it.

## Step 3: compile and validate every language/tool surface

Run the complete offline gate:

```bash
npm run release:validate
```

Then run the checks the RC environment could not perform:

- real `npm run prepare`
- real `npm run build`
- Lua/LuaJIT parser/compiler syntax validation for every file under `backend/`
- Python syntax/compile validation for `decky/`
- GitHub Actions workflow syntax/reasonableness

Fix every genuine error. Do not disable a guard or weaken a test solely to turn the build green.

The current security gates include persisted-state decoding, refresh cancellation, a static dangerous-pattern audit, hostile resource-pack cases, decoded image dimension limits and constrained network/key handling. Preserve or strengthen them.

## Step 4: finish current Millennium live integration using current official docs

Research the **current exact** Millennium stable release, current Starlight documentation and current Steam client before implementing private-Steam transforms.

The RC deliberately does not fabricate an old header regex.

### Desktop trophy entry

- Inspect the actual JavaScript/chunk served by the target current Steam Stable client.
- Use Millennium's current recommended Hooking API/server-router transform approach.
- Add the narrowest possible transform that inserts only the SteamTrophies entry component at a verified stable anchor.
- Add an anchor/self-check.
- If the anchor is absent, fail closed and log a concise compatibility diagnostic.
- Never patch a random near-match.
- Never copy an obsolete selector/regex from an old plugin tutorial without validating it against the exact build.

Test both Steam Stable and Steam Beta. A Beta failure may be documented as a compatibility warning if Stable is healthy, but it must never crash or black-screen Steam.

### Achievement/library adapter verification

Verify on a real account:

- library enumeration source
- current `GetMyAchievementsForApp` response shape
- achievement-change event shape
- icon URL normalization
- hidden/progress data
- current global rarity values
- interrupted first-run discovery and resume
- background refresh while a game is running

Keep all shape quirks inside adapters/decoders.

## Step 5: finish Big Picture as a complete controller product

Use current official/community host APIs, not browser-only assumptions.

Complete a **controller-only** focus walk across every reachable Big Picture feature:

- trophy home
- library/search/filtering
- game detail
- Trophy Projects
- game-specific pack overrides
- achievement-specific override UI where practical
- settings/customization
- layout customization
- notification settings/test toasts
- diagnostics/safe mode
- back navigation and focus restoration after dialogs

No essential action may require hover, right-click or precise mouse dragging.

Verify live Desktop <-> GamePad mode switching through the isolated compatibility bridge. If current enum values changed, update only the bridge and associated tests/docs.

## Step 6: finish the Decky Gaming Mode package

Research the current Decky Loader plugin template and current `@decky/ui` package at finalization time.

The RC's Decky directory is a shared-core shell/foundation, not permission to pretend a physical Deck build is finished.

Create/finish the actual installable Decky package while preserving Trophy Core semantics and storage migrations.

On a **physical Steam Deck**, test:

- native 1280x800 Gaming Mode
- controller-only navigation
- on-screen keyboard for text/search if needed
- notifications
- resource-pack/settings UI that is exposed there
- sleep/resume
- offline start
- reconnect
- external display at 1080p
- external display at 4K when available
- switching between handheld and docked display
- reduced motion and large text

Do not mark Deck support production-ready until the applicable runtime gates contain evidence.

## Step 7: macOS validation without false claims

The RC intentionally supports macOS source development, CI and the correct data path:

```text
~/Library/Application Support/SteamTrophies/
```

Use the user's macOS machine to run:

```bash
npm ci
npm run prepare
npm run release:validate
npm run build
```

Also exercise pack authoring/validation and any local preview/development surface available without Steam injection.

Then re-check the **current upstream Millennium macOS support at that exact date**. At RC research time, public Millennium support was Windows/Linux and macOS restoration work was not yet a released supported target.

Only claim live macOS Steam support if:

1. a current released host supports it, and
2. SteamTrophies is actually loaded and runtime-tested there.

Otherwise keep the README distinction between macOS development compatibility and live injection support.

## Step 8: localization and gamer-facing polish

Audit all visible strings. Move remaining hard-coded product text into a localization/catalog layer suitable for later translations.

Add at least:

- complete English catalog
- pseudo-localization mode/test that expands strings and exposes clipping
- safe handling of long game/achievement names

Do not use tiny fixed-width UI that only works for English.

Perform a gamer UX sniff test against `docs/gamer-qa-top50.json`. Fix anything that feels:

- slow
- spammy
- mouse-only
- visually cramped
- too dense on 32:9
- oversized on Deck
- confusing about 0% games
- destructive to trophy history
- fragile after plugin reload
- noisy while a game is running
- invasive of Steam itself

## Step 9: complete backup/recovery and diagnostics UX

The storage/backend foundations already include validation, backups, quarantine and local index rebuild capability.

Make sure the user-facing diagnostics/recovery flow can clearly report:

- plugin/version/host state
- compact index health
- game-shard health
- pack/theme safe mode
- current surface/UI mode
- cache/storage size
- last discovery/refresh state
- hook compatibility status

If backup export/import UI is incomplete, finish it over the existing `packages/backup` contracts. Back up durable trophy history/customization, not disposable caches by default.

## Step 10: runtime security pass

Run:

```bash
npm run security:audit
npm run security:pack-corpus
```

Then manually inspect:

- every renderer-to-backend RPC
- every filesystem operation
- every network call
- API key lifecycle
- resource-pack import/update/uninstall
- backup import/export
- corruption recovery
- logs and diagnostics
- URLs opened in the system/browser
- current Steam hook code

Confirm:

- no arbitrary-path renderer RPC
- no shell execution/eval for normal operation
- no raw user HTML/script execution
- no secret in renderer/query string/log/backup
- no resource-pack symlink/traversal/archive escape
- no unbounded refresh/timer loop
- no stale async commit after dismount
- no hook that can patch an unexpected Steam chunk

Run dependency audits after the real install and document any accepted advisories with justification.

## Step 11: complete every runtime release gate with evidence

Open `docs/runtime-release-gates.json`.

There are 20 required live gates. For each one:

- actually perform it
- set `status` to `pass` only after success
- add concrete evidence containing date, Steam channel/build, OS/device, host version, SteamTrophies commit and measured result
- add a small evidence document/log/screenshot reference when useful

Run:

```bash
npm run runtime:gates
npm run runtime:gates:require-pass
```

**Do not edit the gate script or lower requirements merely to make `require-pass` green.**

If a gate is genuinely blocked by upstream software or unavailable hardware, leave it blocked/pending, explain the blocker and do not call the product production-ready.

## Step 12: capture real screenshots for the GitHub README

Follow `docs/images/README.md`.

Capture actual runtime screenshots from the same tested build:

- `desktop-library.png`
- `game-trophies.png`
- `game-pack-overrides.png`
- `big-picture-home.png`
- `trophy-toast.png`
- `steam-deck-gaming-mode.png`

Never substitute generated concept images or browser mockups.

After the files exist, update the README Gallery to display them with concise community-facing captions.

## Step 13: finish community documentation

Read the README as if you are a Steam achievement hunter who has never seen the project.

Verify that it accurately explains:

- what SteamTrophies does
- trophy rarity/Platinum behavior
- Windows installation
- Linux installation
- Steam Deck installation/status
- macOS reality
- source development
- resource-pack creation
- customization
- data paths/privacy
- backup/recovery
- troubleshooting
- FAQ
- security reporting
- contribution expectations

Update version numbers and host requirements from the actually tested final build.

Do not write documentation to Scarlett/Lydia personally. It is public community documentation.

## Step 14: CI and reproducibility

After the authentic lockfile exists, ensure GitHub Actions uses `npm ci`, not `npm install`, for normal CI.

The intended matrix is:

- Ubuntu + Node 22
- Ubuntu + Node 24
- Windows + Node 22
- Windows + Node 24
- macOS + Node 22
- macOS + Node 24

Run the offline engineering gate on all of them. Keep a production package smoke test as well, adjusting Starlight output configuration only according to current documented behavior.

Do not disable macOS CI merely because live Steam injection is upstream-limited. Source/build/test portability is still valuable.

## Step 15: final repository and release artifact

Before committing final release state:

```bash
npm run release:validate
npm run runtime:gates:require-pass
npm run prepare
npm run build
npm audit
python -m compileall -q decky
```

Also run the chosen real Lua syntax/compiler check.

Clean generated test state and verify `git status` contains only intentional files.

Create coherent commits. Suggested sequence, adjusted to actual work:

1. `build: lock release dependencies and update host tooling`
2. `feat: finish current Steam and Big Picture integration`
3. `feat: complete Steam Deck Gaming Mode package`
4. `fix: runtime QA security and device compatibility`
5. `docs: complete community setup gallery and release evidence`
6. `release: prepare SteamTrophies <version>`

Do not squash away useful existing history unless the project owner explicitly asks.

If the GitHub remote and intended branch are unambiguous and all applicable required gates are green, push the commits normally. **Never force-push. Never push secrets. Never replace an unrelated remote.**

Create the final distributable artifact from the tested release commit. Record its SHA-256 and exact commit SHA.

If the project uses GitHub Releases, create/update the release only after the owner-selected license/publication state is appropriate and the runtime gates permit a production claim.

## Final response back to the user

Report:

- final product version
- Git branch and remote pushed
- commit SHAs/titles
- exact commands/tests passed
- Steam Stable/Beta versions tested
- Millennium/Starlight/Decky versions tested
- Windows/Linux/Deck/macOS results separately
- Top 50 gamer QA result
- 20/20 runtime gate status
- npm audit result
- Lua validation method/result
- performance benchmark numbers
- final package path/name
- SHA-256
- GitHub release/link if created
- any remaining blocker, without softening it

If any required runtime gate is not actually green, say so and stop short of calling the build production-ready.

The goal is a repository that an achievement/trophy community can clone, understand, trust, install and contribute to without needing the original design conversation.
