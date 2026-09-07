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
    discovery.v1.json       (rebuildable first-run/re-probe ledger)
  cache/
    assets/
      index.v1.json
      <content-hash>.<ext>
```

Millennium backend root:

- Windows: `%LOCALAPPDATA%/SteamTrophies` (fallback `%APPDATA%`).
- Linux: `$XDG_DATA_HOME/SteamTrophies` or `~/.local/share/SteamTrophies`.
- macOS path is reserved conceptually as `~/Library/Application Support/SteamTrophies`, but current Millennium distribution is Windows/Linux, so macOS needs another shell/runtime unless Millennium adds support.

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

Back up **durable state only**: index, trophy-bearing game shards, unlock events, settings, schema/version metadata. Exclude `discovery.v1.json`, asset cache, logs, temporary refresh state, and any Steam Web API secret.

Recommended transports later:

- user-selected local folder;
- LAN NAS/SMB mounted by the OS;
- Syncthing/Resilio/etc. pointed at an export folder;
- provider-specific cloud connector.

The plugin should produce atomic timestamped backup bundles. It should not embed its own SMB credentials or mount network shares.
