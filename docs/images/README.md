# Runtime screenshot capture contract

Do not place concept art, generated mockups or edited marketing composites in the community README as proof of the running plugin.

Before the first public release, capture real screenshots from the exact tested release build:

| File | Required evidence |
| --- | --- |
| `desktop-library.png` | Steam Desktop trophy library with multiple real games visible |
| `game-trophies.png` | Real game detail with earned/locked trophies and totals |
| `game-pack-overrides.png` | Game-specific pack/tier/achievement customization UI |
| `big-picture-home.png` | Big Picture/GamePad trophy home navigable by controller |
| `trophy-toast.png` | Actual SteamTrophies unlock/test notification rendered by the release build |
| `steam-deck-gaming-mode.png` | Physical Steam Deck Gaming Mode, not a resized desktop browser window |

Guidelines:

- Capture from the exact commit used to build the release candidate.
- Do not expose account secrets, API keys, private chats or unrelated personal data.
- Prefer lossless PNG.
- Keep screenshots at native UI resolution when practical.
- Record the Steam channel/build, host version and SteamTrophies commit in runtime gate evidence.
- README image captions should explain the feature, not claim a platform was tested unless the corresponding runtime gate is green.
