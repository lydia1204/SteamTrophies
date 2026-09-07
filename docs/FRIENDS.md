# Friend statistics without requiring the friend to install the plugin

Current Steam client typings expose two useful calls:

- `SteamClient.Apps.GetFriendsWhoPlay(appId)`
- `SteamClient.Apps.GetFriendAchievementsForApp(appId, friendSteam64Id)`

That is the preferred in-client path. A friend only needs to be visible to Steam under the relevant privacy rules; SteamTrophies does not need to run on their machine.

The public/partner Steam Web API also exposes `ISteamUserStats/GetPlayerAchievements` and `IPlayerService/GetOwnedGames`. The latter returns owned games only when the target user's game details are visible. A backend-only client scaffold lives in `packages/friends`, primarily as a fallback or for future cross-device services.

## Privacy behavior

Treat private/denied data as a normal state, not an error toast storm. Cache the denial briefly, show “private/unavailable,” and never attempt to bypass Steam privacy settings.

## Comparison model

Friend comparisons should be computed from the same current rarity thresholds but must not pretend the friend had SteamTrophies installed at unlock time. Unless a historical rarity snapshot is available, label friend tiering as **current rarity classification**, while the local user's own trophies can display frozen `awardedTier` history.
