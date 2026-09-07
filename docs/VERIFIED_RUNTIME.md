# Documented runtime surfaces and live-validation boundary

Research baseline: 2026-09-06.

This file records APIs/surfaces that were checked against current documentation/community typings during the engineering passes. It is **not evidence that the release candidate was live-tested inside the current Steam client**. Live proof belongs in `runtime-release-gates.json`.

## Millennium project shape

The current project architecture follows the modern Millennium plugin model used by the official template/docs:

- `millennium.toml`
- Lua backend entry under `backend/`
- React/TypeScript frontend
- Starlight tooling
- backend readiness/lifecycle integration
- documented `fs` module primitives rather than shell commands

## Steam achievement surfaces represented in adapters

The current adapter layer is designed around client surfaces documented/represented during research including:

- `GetMyAchievementsForApp(appId)`
- achievement responses containing `data.rgAchievements`
- `RegisterForAchievementChanges(callback)`
- protobuf `CMsgAchievementChange` App ID decoding
- `GetFriendAchievementsForApp(appId, steamId64)`
- `GetFriendsWhoPlay(appId)`

Response data is decoded defensively. Unknown shapes fail instead of masquerading as an empty achievement list.

## UI-mode surface

The frontend isolates Steam UI-mode values/subscription behind `frontend/runtime/steam-ui.ts`. If the live host changes enum values or callback behavior, update that bridge rather than scattering new host assumptions across components.

## Intentionally live-unverified in this RC

- exact current compiled Steam header anchor/transform
- current Stability/Beta behavior of that transform
- exact lifecycle behavior of the real large-library bootstrap source
- real first-import performance through Steam IPC
- real friend privacy/error behavior
- physical Steam Deck Gaming Mode package/focus behavior

These are explicit runtime release gates. The RC should fail closed instead of fabricating private Steam selectors or runtime evidence.
