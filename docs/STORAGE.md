# Storage, backups, and expected size

## Logical layout

```text
SteamTrophies/
  state/
    index.v1.json
    games/
      <appid>.v1.json
    events/
      YYYY-MM.ndjson
    settings.v1.json
    customization.v1.json   (pack choices, pins, hidden games and preferences)
    discovery.v1.json       (rebuildable first-run/re-probe ledger)
  customization/
    packs/                 (managed imported artwork and sounds)
  cache/
    assets/
      index.v1.json
      <content-hash>.<ext>
```

Millennium backend root:

- Windows: `%LOCALAPPDATA%/SteamTrophies` (fallback `%APPDATA%`).
- Linux: `$XDG_DATA_HOME/SteamTrophies` or `~/.local/share/SteamTrophies`.
- macOS: `~/Library/Application Support/SteamTrophies`. Desktop testing has used an experimental source-built Millennium host; a public production Mac installer is not established. See the current README compatibility section.
- Decky: `<Deck user home>/.local/share/SteamTrophies`, using `decky.DECKY_USER_HOME`, not the loader service's root home. The current Decky adapter does not follow custom `XDG_DATA_HOME` values.

## Why shards instead of one giant JSON file

- opening the library reads one small index;
- selecting a game reads one shard;
- corruption affects one game rather than the entire collection;
- atomic replacement is cheap;
- backups can deduplicate unchanged files;
- Deck and desktop can share the same logical schema.

SQLite remains a valid later optimization, but it is not required to hit the UI target and would make the first Decky/Millennium dual-runtime step heavier.

## Benchmark from this starter

Synthetic workload: 2,500 games, 40 achievements each, 100,000 achievement records total. With 1,625 games visible under the generated scenario:

- compact index: ~438 KB;
- visible game shards: ~29.6 MB before image assets;
- compact index JSON parse: ~2.5 ms in the build environment;
- full synthetic model generation: ~0.20 s.

Real sizes vary with localized achievement descriptions and icon URL lengths. Image files will dominate if duplicated, which is why assets are outside the JSON state and governed by an LRU budget.

## Backups

For a user-managed local backup, stop the active host and copy the **complete SteamTrophies data root**, including `state` and `customization/packs`, to a timestamped location outside the live root. Pair it with the installed plugin/version. A whole-root snapshot may include rebuildable discovery/cache data for convenience; these are not essential durable history. Do not publish these personal snapshots with bug reports.

A future minimal export should include index, trophy-bearing shards, unlock history, customization/settings, managed pack assets and schema metadata; omit disposable caches, logs, temporary refresh state and secrets. An index-only or `state`-only backup does not contain imported artwork/audio packs. Do not merge random files from different snapshots during rollback; restore a coherent schema-compatible snapshot.

Recommended transports later:

- user-selected local folder;
- LAN NAS/SMB mounted by the OS;
- Syncthing/Resilio/etc. pointed at an export folder;
- provider-specific cloud connector.

The plugin should produce atomic timestamped backup bundles. It should not embed its own SMB credentials or mount network shares.
