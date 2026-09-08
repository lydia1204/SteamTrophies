# Threat model and security rules

## Trust boundaries

- Steam/SteamClient data is external input even when delivered through local IPC.
- Achievement names, descriptions, icons and response shapes can contain unexpected values.
- Backend filesystem capability is privileged relative to the renderer.
- Friend/Web API responses are remote input.
- Persisted JSON and backup files are untrusted on read/import.
- User trophy-pack folders are untrusted input even when chosen through a native picker.
- Private Steam UI chunks are untrusted compatibility targets and can change between builds.

## Implemented controls

### Data and persistence

- strict positive uint32 App ID validation
- bounded achievement IDs/text fields
- structural runtime validation for persisted compact index and game shards
- atomic state replacement
- constrained `.bak` last-known-good copies for critical JSON
- corruption quarantine
- local compact-index rebuild from validated game shards before network recovery
- append-only durable event logs

### Renderer/backend boundary

- no generic arbitrary-path read/write RPC
- backend payload size limits
- numeric/known-root game storage operations
- no shell execution in normal Millennium backend code
- no remote code evaluation
- plugin surface wrapped in an error boundary
- dismount cleanup cancels refresh/timers/caches rather than relying on context destruction

### Refresh/event handling

- scheduler deduplicates work
- bounded concurrency and retry backoff
- `stop()` aborts in-flight work and clears retries/timers
- achievement protobuf decoder returns `null` rather than crashing on malformed input
- stale async work checks cancellation before durable commit

### URLs/network/secrets

- HTTP(S)-only remote asset handling where applicable
- credential-bearing asset URLs rejected
- hard-coded runtime network host audit
- Steam Web API fallback keeps key out of URL query strings
- keyed fallback is backend-only by design
- API keys must not enter renderer state, logs or backups

### User resource packs

- canonical path checks
- traversal/absolute path rejection
- symlink rejection
- reserved built-in namespace rejection
- every ordinary payload file must be manifest-declared
- bounded file count, individual size and total size
- PNG/JPEG/WebP image signature validation
- WAV/OGG/MP3 sound signature validation where enabled, including bounded ID3 tag parsing
- decoded image dimensions capped at 8192 per axis
- decoded image pixel count capped at 16,777,216
- executable/script masquerading rejected
- staged import followed by atomic promotion
- no arbitrary renderer filesystem path persistence for achievement overrides
- pack removal scrubs global/game/tier/achievement references and retains built-in fallback

## Automated release security gates

```bash
npm run security:audit
npm run security:pack-corpus
npm run release:validate
```

The static audit rejects dangerous runtime patterns such as evaluation, child processes, raw HTML injection, raw `file://` construction, cookie access and unexpected hard-coded network hosts.

The hostile-pack corpus exercises deterministic attacks including traversal, reserved namespace, executable masquerading, excessive bytes, decoder-bomb image dimensions, undeclared payloads and malformed manifests.

## Final live security requirements

Before public release, the networked/live finalizer must also:

- run real dependency audits against the installed lockfile
- parse/compile every Lua backend file with a real Lua/LuaJIT tool
- inspect every renderer-to-backend RPC
- validate current Steam hook anchors against the exact target build and fail closed on mismatch
- verify diagnostic/log redaction with real data
- stage/validate backup imports before replacing durable state
- publish checksum(s) for release artifacts
- ensure update/distribution paths point only to trusted project releases

See root `SECURITY.md` for responsible disclosure guidance.
