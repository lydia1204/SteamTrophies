# Trophy pack examples

`trophy-pack-template/` is intentionally a directly importable SteamTrophies Pass 3 pack. Copy the folder elsewhere, edit its `manifest.json`, give it a unique `id`, and replace the example resources.

It demonstrates all currently supported resource classes:

- four normal Bronze/Silver/Gold/Platinum PNGs;
- one named one-off `custom.special-gold` trophy image;
- one custom Gold notification WAV;
- preview, tags, accent and recommended-surface metadata.

SteamTrophies rejects undeclared files, so keep authoring notes/source PSDs/etc. **outside** the importable pack folder.

Validate before importing:

```bash
npm run pack:validate -- ./path/to/your-pack
```
