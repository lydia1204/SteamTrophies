# Trophy resource packs

SteamTrophies resource packs are versioned, data-only visual/audio bundles. Trophy Core decides which award is Bronze/Silver/Gold/Platinum; the resource resolver decides which declared asset represents that award for a global profile, a game, a tier within a game, or one exact achievement.

## Resolution order

Highest precedence wins:

1. exact achievement override;
2. per-tier override for that game;
3. whole-pack override for that game;
4. global selected pack;
5. `builtin.classic` hard fallback.

The resolver returns a fallback candidate chain. If a custom pack disappears or an asset read fails, the frontend falls through rather than rendering a broken trophy.

## Built-ins

Four original packs ship in the plugin bundle:

- `builtin.classic`
- `builtin.crest`
- `builtin.minimal`
- `builtin.crystal`

Each includes Bronze/Silver/Gold/Platinum artwork and local tier notification sounds. Built-ins may use bundled SVG because they are trusted build inputs. User packs may not.

## Manifest v1

Pass 3 keeps manifest version 1 but extends its optional backward-compatible fields. A pack can contain:

- four required tier images;
- an optional preview image;
- up to 48 named one-off trophy images using `custom.*` keys;
- optional `toast.bronze|silver|gold|platinum` WAV/OGG/MP3 files;
- metadata such as homepage, tags, accent, attribution and recommended surfaces.

Example:

```json
{
  "manifestVersion": 1,
  "id": "example.my-pack",
  "name": "My Pack",
  "version": "1.0.0",
  "author": "Your Name",
  "type": "trophy-icon-pack",
  "homepage": "https://example.com/my-pack",
  "tags": ["pixel", "dark"],
  "accentColor": "#F2C75A",
  "recommendedFor": ["desktop", "big_picture", "deck"],
  "assets": {
    "trophy.bronze": "trophies/bronze.png",
    "trophy.silver": "trophies/silver.png",
    "trophy.gold": "trophies/gold.png",
    "trophy.platinum": "trophies/platinum.png"
  },
  "customTrophies": {
    "custom.slime-crown": "custom/slime-crown.png"
  },
  "sounds": {
    "toast.gold": "sounds/gold.wav"
  },
  "preview": "trophies/platinum.png"
}
```

See `examples/trophy-pack-template/` and `schemas/trophy-pack-v1.schema.json`.

Validate without Steam:

```bash
npm run pack:validate -- ./path/to/pack
```

## Game override UI

On a game trophy page, **Trophy icons** opens the game-specific editor. It provides:

- whole-pack override;
- independent Bronze/Silver/Gold/Platinum pack overrides;
- live tier preview;
- import/update pack folder;
- original source path;
- isolated managed-copy path;
- reveal-source/reveal-managed-copy actions;
- reset to inherited global behavior.

The per-achievement **Icon** editor entry point is deprecated and hidden in desktop detail rows. Its implementation and existing overrides remain intact; saved tier/named `custom.*` resources continue to resolve.

Saved customization stores only `packId` + semantic resource key. It never stores an arbitrary achievement filesystem path.

## Import safety

The backend:

1. canonicalizes the selected folder;
2. rejects a symlinked root, manifest, or nested entry;
3. validates the manifest and reserved IDs;
4. recursively enumerates with a 96-entry limit;
5. requires every regular file to be declared by the manifest;
6. rejects absolute/traversal/UNC/drive paths;
7. accepts user images only as PNG/JPEG/WebP;
8. accepts sounds only as WAV/OGG/MP3 (MP3 requires a valid MPEG frame header after any bounded ID3 tag);
9. verifies file magic bytes instead of trusting extensions;
10. caps individual assets at 4 MiB and total unpacked pack content at 64 MiB;
11. copies to private staging without following links;
12. validates the staged copy again;
13. records the original source folder;
14. atomically promotes the managed copy and rolls back a failed replacement.

No JavaScript, Lua, CSS, SVG, executable, shell or arbitrary undeclared content is accepted from user packs.

## Directory packs now, `.sttpack` archive later

`.sttpack` is reserved as a ZIP-compatible distribution wrapper around this exact directory contract. Millennium's documented Lua module surface still does not expose a trusted archive extractor, so the plugin does not shell out to 7-Zip/PowerShell/unzip or accept an unverified extractor.

When archive support is added, extraction must go to staging and the result must pass this same validator before promotion. Archive transport must never become a bypass around pack security.

## Asset transport

The frontend never guesses a `file://` or undocumented Steam loopback URL. The backend exposes only manifest-declared bounded assets as `data:` URLs and the frontend keeps a small promise cache. That is intentionally boring and reliable for trophy emblems/sounds.

A future documented virtual-resource transport can replace the data-URL provider without changing resource resolution or customization state.
