# Contributing to SteamTrophies

SteamTrophies is intentionally opinionated about data integrity, Steam host stability and large-library performance. Contributions are welcome, but new features should preserve those guarantees rather than bypass them.

## Development setup

Recommended release-candidate toolchain:

- Node.js 22 or 24 LTS
- npm
- Python 3 for Decky-side checks
- current Millennium/Starlight tooling for live Steam development
- Lua/LuaJIT parser/compiler for final backend validation

```bash
npm install
npm run prepare
npm run release:validate
```

## Before opening a pull request

Run:

```bash
npm run release:validate
```

If your change touches live Steam/Deck behavior, also update the applicable runtime gate evidence in `docs/runtime-release-gates.json` and run:

```bash
npm run runtime:gates
```

Do not mark a gate `pass` without concrete evidence.

## Architecture rules

### Keep Trophy Core platform-independent

Rarity rules, award history, Platinum semantics and durable event logic belong in shared packages, not Steam React components.

### Keep Steam internals behind bridges

Private Steam selectors, UI mode values, achievement response quirks and host hooks belong in small compatibility adapters. Do not spread minified host implementation details across the app.

### Preserve the instant-open path

Opening the trophy UI should paint from warm local state. Do not add network calls, whole-library scans, archive parsing or theme compilation to the click path.

### Preserve historical trophies

Do not silently recalculate an already-awarded trophy tier from today's global rarity.

### Preserve the earned-only default

Do not change the normal library into a wall of untouched 0% titles. Explicit Projects/tracking are the escape hatch for intentional pre-completion planning.

### Resource packs are data-only

Do not add executable user-pack formats. Extend manifests through versioned, validated capabilities.

### Themes use semantic contracts

Prefer `--stt-*` tokens and `data-stt-*` component/slot/state attributes. Avoid styling contracts based on build-generated class names.

### Controller access is required

Big Picture and Deck features cannot rely on hover, right-click or fine pointer dragging for essential operations.

## Tests

Add or update tests when changing:

- trophy semantics
- persistence schemas/migrations
- responsive behavior
- resource-pack security
- scheduler/concurrency behavior
- notification burst behavior
- Steam response decoding
- backup/import behavior

If you intentionally need CSS newer than the current Steam renderer floor, document the host requirement and update the compatibility policy rather than simply disabling `check:cef85`.

## Documentation

Update community-facing docs when changing user-visible behavior. New setup requirements belong in README and platform docs, not only in commit messages.

## Git hygiene

- Keep commits coherent and reviewable.
- Do not commit secrets, local trophy history, API keys or generated test-state folders.
- Do not force-push shared release branches without explicit project-owner approval.
- Do not rewrite unrelated history while finalizing a feature.
