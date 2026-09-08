# Screenshot QA and data repair — 7 September 2026

## Outcome

PARTIAL. The supplied screenshots prove the installed panel can display a cached library and open Terraria, but they do not match the project's intended data correctness or narrow-screen usability. Fixes were implemented and tested offline. Post-update screenshots and live UX remain the user's responsibility. Layout redesign is deferred until the user's drawing.

Evidence inputs: the user's two screenshots (library and Terraria), README, storage/runtime/responsive documentation, Gamer QA checklist, source inspection, local Steam logs, one read-only Terraria client response, and Valve's public global-achievement response. No screenshot was captured or UI interaction performed by the agent.

## Screenshot-to-requirement matrix

| Requirement / observation | Screenshot and source finding | Disposition |
| --- | --- | --- |
| Rarity-based Bronze/Silver/Gold | Library shows 44,247 Gold, zero Silver/Bronze. Terraria shows 0.0% even for ordinary achievements. Cached counts confirm the screenshot. | Critical defect. The client `flAchieved` field returned placeholder zeroes. Added exact-ID mapping to Valve global percentages; unknown is not treated as zero. |
| Durable, adjustable local data | Ordinary Refresh preserves awarded tiers, including the erroneous Gold values. | Added explicit cached-rarity repair, with revision metadata and tests that keep unlocks/dates/Platinum unchanged. No cache deletion or achievement reimport. |
| Silent initial discovery | User heard repeated sounds. New game imports produce historical unlock events that went directly to notifications. | Initial imports now persist events without emitting live toast/audio callbacks. Repair also emits no notifications. |
| Resumable bounded discovery | Screenshot says 2,439 / 3,342 checked and “Some reads failed” while activity still pulses. Logs repeatedly show `CAPIJobRequestUserStats - Server response failed 2`. | The scheduler had no retry limit. Discovery now uses explicit retries, not indefinite background retries. Known DLC/tools/non-game app types are excluded from new discovery. |
| Honest errors | The result-2 banner is real, not a screenshot-only rendering bug. | Result 2 is a generic Steam failure, not proof of corruption or of no achievements. Failed reads retain cached data and remain eligible for retry. Errors now identify the App ID. Root causes of individual Steam failures remain unverified. |
| Game-card trophy icons/counts | No per-tier counts on Gear Up or Terraria in the narrow library screenshot. | CSS explicitly hid this block at micro width. Removed hiding; all four tiers and counts now render, including zeroes. |
| Game artwork | Library cards are text-only; detail header has no game artwork. | Source never rendered artwork. Added Steam-resolved game icons with a non-broken-image placeholder. These are game icons, not invented cover/capsule URLs. |
| Achievement artwork | Terraria achievement art is visible and distinct. | Present in screenshot. Do not confuse this with missing game artwork. Broken achievement-image fallback remains a separate visual check. |
| Collection totals/progress | 336 games, 44,297 total trophies; Terraria 105/137 and 76.64%. | Counts match stored state, but full-library completeness and every unlock are not independently verified. Rarity repair must not change earned counts. |
| Synthetic Platinum | Summary shows 50 Platinum. | Present, not independently verified across 50 games. Deterministic core tests pass; real completed-game comparison still needed. |
| Narrow responsive UX | Large header/actions consume most of the panel; nested scrollbars leave little library content visible. | Confirmed usability problem. Card essentials restored and virtual row heights adjusted. Full navigation/scroll-layout redesign awaits drawing and user test. |
| Clear navigation | Outer host title/back and inner title/back duplicate navigation in the detail screenshot. | This is the host quick-access surface, not proof of the intended roomy trophy overlay. Redesign pending; header-button placement is outside these cropped screenshots. |
| Theme switching | Both screenshots show one dark appearance. | Cannot verify theme switching or persistence from these images. Token wiring exists; user must supply before/after theme evidence. |
| Custom packs/overrides | “Trophy icons” and per-achievement “Icon” controls are visible. | Presence is confirmed; import, override resolution, persistence and removal are not demonstrated by screenshots. |
| Layout configuration | README advertises per-surface layout customization. | Big Picture consumes order/visibility; desktop list does not. README now states this gap explicitly, and desktop no-op controls show an explanatory notice instead. Saved preferences are retained. |
| Projects, Pin, Hide, filters, search | Controls are visible. | Not live-validated by screenshots alone. Need targeted user checks after correctness repair. |
| Offline, corruption recovery, backups, privacy | Not demonstrated in screenshots. | Automated safeguards exist; no claim of live acceptance. |
| Big Picture / Deck / friends | Not shown. | Not validated in this Mac screenshot pass. |

## Confirmed rarity evidence

The live local Terraria response had `result: 1`, `data.rgAchievements`, real IDs/unlock flags/images, and `flAchieved: 0` for the sampled rows. Valve's global endpoint returned ordinary values (for example `TIMBER: 87.0`). Thus the local success response does not establish that its rarity field is usable.

Read-only repair preview on the user's cached Terraria shard:

| | Before | Corrected preview |
| --- | ---: | ---: |
| Earned | 105 | 105 |
| Total achievements | 137 | 137 |
| Bronze | 0 | 80 |
| Silver | 0 | 23 |
| Gold | 105 | 2 |
| Completion | 76.64% | 76.64% |

IDs, achieved flags and unlock timestamps compared equal before/after. This was an in-memory preview, not a write to the user's Terraria data. Percentages can change after this observation.

## Repair semantics

- Fixed backend request to Valve's public global-achievement endpoint, using only a validated numeric App ID. No account ID, cookies, API key or trophy history is sent. TLS verification is enabled, redirects disabled, timeout 10 seconds, returned-body acceptance bounded to 2 MiB, memory cache bounded to 512 apps with six-hour success TTL and one-minute failure cooldown.
- `rarityRevision: 1` marks the corrected source contract. Legacy all-zero-source awards and provisional unknown awards can be corrected. Ordinary later drift cannot rewrite verified award tiers. Nonzero legacy history is not automatically classified as the all-zero bug.
- Metadata-only repair uses cached shards and serializes writes through the existing commit queue. Atomic storage preserves per-file backups. Missing global data counts as unavailable, not a destructive empty achievement result.
- “Repair cached rarity” waits until discovery is idle, processes existing visible game shards, updates their summaries/index, and preserves customizations. It does not reset discovery or create new unlock notifications.
- The event log retains historical imported records; this repair does not rewrite the old event log's erroneous tier fields. The cabinet/shards are corrected. An explicit append-only correction-event format remains a follow-up if historical event consumers are added.
- Current global rarity is not historical rarity at the real unlock date. The UI must not imply that past percentages have been recovered.

## Validation and remaining limits

50 tests pass, including cached repair through the service, silent-import event delivery, nonzero-history preservation, unknown-to-known metadata, observable maps, app-type filtering, and bounded retry behavior. Backend tests verify fixed endpoint, TLS/redirect settings, ID validation, success cache and failure cooldown without network calls. Full offline release validation passes, including the 21-fixture resolution classifier and 2,500-game benchmark; these are not rendered visual tests.

Native Lua HTTP request/response contracts were checked against the installed host source and official docs. Actual new backend transport inside the restarted plugin still needs runtime validation. Existing live release gates remain pending. The old process keeps running its old package until the user restarts; installing the new file does not prove it is active.

## Next user checks

Installed package SHA-256: `a07790cf53074a0717f386c5aa26d5a469aabde0d95dd2b9299c47bc05356ab0`; staged and installed hashes match. Starlight verified all sections of the unsigned package. Its known LSP prepass still warns about unrelated Decky exports; the scoped plugin pack succeeds.

Previous package and pre-repair state archive are under `~/Library/Application Support/Millennium/backups/qa-rarity-2026-09-07/`. The archive passed listing/read verification (443 entries). It is a pre-repair filesystem snapshot, not a guarantee of transactional consistency across a running host. No user trophy shards were manually migrated in this pass; the user's repair action will perform the metadata update after restart.

1. Fully quit Steam and launch Steam Millennium after the updated package is installed.
2. Open trophies. Confirm startup discovery is silent, game icons appear, and narrow cards retain all four tier counts.
3. After discovery stops, click **Repair cached rarity**. Let it finish; do not delete/reimport the library. Send the resulting status and totals screenshot. If some games remain unavailable, report that count.
4. Open Terraria and compare with the preview above. Verify 105 earned remains unchanged and ordinary achievements no longer all show 0.0% Gold.
5. Switch theme/pack and close/reopen; send before/after screenshots. Test search, filters, Pin/Hide, and Projects individually.
6. Supply the layout drawing. Nested scrolling, duplicate navigation and action density are recorded as redesign work, not passed off as polished UX.

## Sources

- Valve global percentages: https://partner.steamgames.com/doc/webapi/ISteamUserStats#GetGlobalAchievementPercentagesForApp
- Millennium HTTP contract: https://docs.steambrew.app/plugins/lua/http
- Community context on duplicate notifications and source tracking: https://github.com/xan105/Achievement-Watcher/releases (not authority for this plugin's runtime behavior).
- Local Steam build 1788652215 and the user's own provided screenshots/logs are the authority for the observed failures.
