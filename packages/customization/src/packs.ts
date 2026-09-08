import type {
  CustomizationState,
  InstalledTrophyPack,
  ResolvedTrophyAsset,
  ResolveTrophyAssetInput,
  TrophyAssetRef,
  TrophyPackManifestV1,
  TrophyResourceKey,
  TrophyPackResourceKey,
  PackSoundResourceKey,
} from './types';

export const DEFAULT_TROPHY_PACK_ID = 'builtin.classic';
const PACK_ID_RE = /^[a-z0-9][a-z0-9._-]{2,63}$/;
const SEMVERISH_RE = /^v?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;
const USER_ASSET_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const USER_AUDIO_EXTENSIONS = new Set(['.wav', '.ogg', '.mp3']);
const BUILTIN_ASSET_EXTENSIONS = new Set([...USER_ASSET_EXTENSIONS, '.svg']);
const REQUIRED_KEYS: TrophyResourceKey[] = ['trophy.bronze', 'trophy.silver', 'trophy.gold', 'trophy.platinum'];

export const BUILTIN_PACKS: InstalledTrophyPack[] = [
  builtin('builtin.classic', 'Signature · New trophy artwork', 'User-supplied metallic trophy collection for the base design.', 'classic'),
  builtin('builtin.crest', 'Crest', 'Shield-like award crests with tier-specific silhouettes.', 'crest'),
  builtin('builtin.minimal', 'Minimal', 'Tiny high-legibility glyphs for dense interfaces and handhelds.', 'minimal'),
  builtin('builtin.crystal', 'Crystal', 'Faceted trophy crystals designed for larger TV and desktop UI.', 'crystal'),
];

function builtin(id: string, name: string, description: string, folder: string): InstalledTrophyPack {
  return {
    source: 'builtin',
    manifest: {
      manifestVersion: 1,
      id,
      name,
      version: '1.0.0',
      author: 'SteamTrophies',
      description,
      license: 'Bundled with SteamTrophies',
      type: 'trophy-icon-pack',
      assets: {
        'trophy.bronze': `resources/packs/${folder}/trophies/bronze.svg`,
        'trophy.silver': `resources/packs/${folder}/trophies/silver.svg`,
        'trophy.gold': `resources/packs/${folder}/trophies/gold.svg`,
        'trophy.platinum': `resources/packs/${folder}/trophies/platinum.svg`,
      },
      sounds: {
        'toast.bronze': `resources/packs/${folder}/sounds/bronze.wav`,
        'toast.silver': `resources/packs/${folder}/sounds/silver.wav`,
        'toast.gold': `resources/packs/${folder}/sounds/gold.wav`,
        'toast.platinum': `resources/packs/${folder}/sounds/platinum.wav`,
      },
    },
  };
}

export function resourceKeyForTier(tier: ResolveTrophyAssetInput['tier']): TrophyResourceKey {
  return `trophy.${tier}`;
}

export function validatePackManifest(value: unknown, source: 'builtin' | 'user' = 'user'): TrophyPackManifestV1 {
  if (!value || typeof value !== 'object') throw new Error('Pack manifest must be an object.');
  const v = value as Partial<TrophyPackManifestV1>;
  const allowedTopLevel = new Set(['manifestVersion', 'id', 'name', 'version', 'author', 'description', 'license', 'homepage', 'tags', 'accentColor', 'attribution', 'type', 'minSteamTrophiesVersion', 'assets', 'preview', 'recommendedFor', 'customTrophies', 'sounds']);
  for (const key of Object.keys(value as Record<string, unknown>)) if (!allowedTopLevel.has(key)) throw new Error(`Unknown pack manifest field: ${key}`);
  if (v.manifestVersion !== 1) throw new Error('Unsupported pack manifest version.');
  if (v.type !== 'trophy-icon-pack') throw new Error('Unsupported pack type.');
  if (typeof v.id !== 'string' || !PACK_ID_RE.test(v.id)) throw new Error('Invalid pack id.');
  if (source === 'user' && v.id.startsWith('builtin.')) throw new Error('User packs cannot use the builtin.* namespace.');
  for (const [field, text, max] of [
    ['name', v.name, 80],
    ['version', v.version, 40],
    ['author', v.author, 80],
  ] as const) {
    if (typeof text !== 'string' || text.trim().length < 1 || text.length > max) throw new Error(`Invalid pack ${field}.`);
  }
  if (!SEMVERISH_RE.test(v.version!)) throw new Error('Pack version should use semantic versioning.');
  if (v.description != null && (typeof v.description !== 'string' || v.description.length > 500)) throw new Error('Invalid pack description.');
  if (v.homepage != null && (typeof v.homepage !== 'string' || v.homepage.length > 300 || !/^https:\/\//i.test(v.homepage))) throw new Error('Pack homepage must be an https URL.');
  if (v.tags != null && (!Array.isArray(v.tags) || v.tags.length > 12 || v.tags.some((tag) => typeof tag !== 'string' || tag.length < 1 || tag.length > 32))) throw new Error('Invalid pack tags.');
  if (v.accentColor != null && (typeof v.accentColor !== 'string' || !/^#[0-9a-fA-F]{6}$/.test(v.accentColor))) throw new Error('Invalid pack accent color.');
  if (v.attribution != null && (typeof v.attribution !== 'string' || v.attribution.length > 300)) throw new Error('Invalid pack attribution.');
  if (v.recommendedFor != null && (!Array.isArray(v.recommendedFor) || v.recommendedFor.some((surface) => !['desktop','big_picture','deck'].includes(surface)))) throw new Error('Invalid recommendedFor list.');
  if (!v.assets || typeof v.assets !== 'object') throw new Error('Pack assets must be an object.');
  if (v.customTrophies != null) {
    if (!v.customTrophies || typeof v.customTrophies !== 'object' || Array.isArray(v.customTrophies)) throw new Error('customTrophies must be an object.');
    const entries = Object.entries(v.customTrophies);
    if (entries.length > 48) throw new Error('Pack contains too many custom trophy icons.');
    for (const [key, path] of entries) {
      if (!/^custom\.[a-z0-9][a-z0-9._-]{0,63}$/.test(key)) throw new Error(`Invalid custom trophy key: ${key}`);
      if (typeof path !== 'string') throw new Error(`Invalid custom trophy path: ${key}`);
      validateRelativeAssetPath(path, source === 'builtin' ? BUILTIN_ASSET_EXTENSIONS : USER_ASSET_EXTENSIONS, source === 'builtin');
    }
  }
  if (v.sounds != null) {
    if (!v.sounds || typeof v.sounds !== 'object' || Array.isArray(v.sounds)) throw new Error('sounds must be an object.');
    for (const [key, path] of Object.entries(v.sounds)) {
      if (!['toast.bronze','toast.silver','toast.gold','toast.platinum'].includes(key)) throw new Error(`Unknown pack sound key: ${key}`);
      if (typeof path !== 'string') throw new Error(`Invalid sound path: ${key}`);
      validateRelativeAssetPath(path, USER_AUDIO_EXTENSIONS, false);
    }
  }
  for (const key of Object.keys(v.assets)) if (!REQUIRED_KEYS.includes(key as TrophyResourceKey)) throw new Error(`Unknown pack asset key: ${key}`);
  const allowed = source === 'builtin' ? BUILTIN_ASSET_EXTENSIONS : USER_ASSET_EXTENSIONS;
  for (const key of REQUIRED_KEYS) {
    const path = (v.assets as Record<string, unknown>)[key];
    if (typeof path !== 'string') throw new Error(`Pack is missing ${key}.`);
    validateRelativeAssetPath(path, allowed, source === 'builtin');
  }
  if (v.preview != null) validateRelativeAssetPath(v.preview, allowed, source === 'builtin');
  return {
    manifestVersion: 1,
    id: v.id!,
    name: v.name!.trim(),
    version: v.version!,
    author: v.author!.trim(),
    description: v.description,
    license: typeof v.license === 'string' ? v.license.slice(0, 120) : undefined,
    homepage: v.homepage,
    tags: v.tags ? [...new Set(v.tags)].slice(0, 12) : undefined,
    accentColor: v.accentColor,
    attribution: v.attribution,
    type: 'trophy-icon-pack',
    minSteamTrophiesVersion: typeof v.minSteamTrophiesVersion === 'string' ? v.minSteamTrophiesVersion : undefined,
    assets: Object.fromEntries(REQUIRED_KEYS.map((key) => [key, (v.assets as Record<string, string>)[key]])) as Record<TrophyResourceKey, string>,
    customTrophies: v.customTrophies ? Object.fromEntries(Object.entries(v.customTrophies).sort(([a],[b]) => a.localeCompare(b))) as Record<`custom.${string}`, string> : undefined,
    sounds: v.sounds ? Object.fromEntries(Object.entries(v.sounds).sort(([a],[b]) => a.localeCompare(b))) as Partial<Record<PackSoundResourceKey, string>> : undefined,
    preview: v.preview,
    recommendedFor: v.recommendedFor ? [...new Set(v.recommendedFor)] : undefined,
  };
}

export function validateRelativeAssetPath(path: string, allowedExtensions = USER_ASSET_EXTENSIONS, allowBundledPrefix = false): string {
  if (path.length < 1 || path.length > 240) throw new Error('Asset path length is invalid.');
  const normalized = path.replace(/\\/g, '/');
  if (/^[a-zA-Z]:/.test(normalized) || normalized.startsWith('/') || normalized.startsWith('//')) throw new Error('Absolute asset paths are forbidden.');
  if (normalized.split('/').some((part) => part === '..' || part === '' || part === '.')) throw new Error('Unsafe asset path.');
  if (normalized.includes('\0') || /[<>:"|?*]/.test(normalized)) throw new Error('Unsafe asset filename.');
  if (!allowBundledPrefix && normalized.startsWith('resources/')) throw new Error('User packs cannot reference bundled plugin resources.');
  const dot = normalized.lastIndexOf('.');
  const ext = dot >= 0 ? normalized.slice(dot).toLowerCase() : '';
  if (!allowedExtensions.has(ext)) throw new Error(`Unsupported trophy asset type: ${ext || '(none)'}`);
  return normalized;
}

export function mergePackCatalog(userPacks: InstalledTrophyPack[]): InstalledTrophyPack[] {
  const result = new Map(BUILTIN_PACKS.map((pack) => [pack.manifest.id, pack]));
  for (const raw of userPacks) {
    const manifest = validatePackManifest(raw.manifest, 'user');
    result.set(manifest.id, { ...raw, source: 'user', manifest });
  }
  return [...result.values()].sort((a, b) => a.manifest.name.localeCompare(b.manifest.name));
}

export function resolveTrophyAssetCandidates(
  state: CustomizationState,
  packs: readonly InstalledTrophyPack[],
  input: ResolveTrophyAssetInput,
): ResolvedTrophyAsset[] {
  const catalog = new Map(packs.filter((pack) => !(state.safeMode?.externalPacksDisabled && pack.source === 'user')).map((pack) => [pack.manifest.id, pack]));
  const game = input.appId == null ? undefined : state.trophies.games[String(input.appId)];
  const key = resourceKeyForTier(input.tier);
  const refs: TrophyAssetRef[] = [];
  if (input.achievementId && game?.achievementOverrides?.[input.achievementId]) refs.push(game.achievementOverrides[input.achievementId]);
  if (game?.tierOverrides?.[input.tier]) refs.push(game.tierOverrides[input.tier]!);
  if (game?.packId) refs.push({ packId: game.packId, resourceKey: key });
  refs.push({ packId: state.trophies.globalPackId, resourceKey: key });
  refs.push({ packId: DEFAULT_TROPHY_PACK_ID, resourceKey: key });

  const seen = new Set<string>();
  const resolved: ResolvedTrophyAsset[] = [];
  for (let depth = 0; depth < refs.length; depth += 1) {
    const candidate = refs[depth];
    const dedupe = `${candidate.packId}:${candidate.resourceKey}`;
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);
    const pack = catalog.get(candidate.packId);
    const path = pack ? resourcePath(pack.manifest, candidate.resourceKey) : undefined;
    if (!pack || !path) continue;
    resolved.push({ packId: pack.manifest.id, resourceKey: candidate.resourceKey, relativePath: path, source: pack.source, fallbackDepth: depth });
  }
  return resolved;
}

export function resolveTrophyAsset(
  state: CustomizationState,
  packs: readonly InstalledTrophyPack[],
  input: ResolveTrophyAssetInput,
): ResolvedTrophyAsset {
  const first = resolveTrophyAssetCandidates(state, packs, input)[0];
  if (!first) throw new Error('Built-in trophy resource catalog is corrupt.');
  return first;
}

export function resourcePath(manifest: TrophyPackManifestV1, key: TrophyPackResourceKey): string | undefined {
  if (key.startsWith('custom.')) return manifest.customTrophies?.[key as `custom.${string}`];
  return manifest.assets[key as TrophyResourceKey];
}

export function listPackTrophyResources(manifest: TrophyPackManifestV1): TrophyPackResourceKey[] {
  return [...REQUIRED_KEYS, ...Object.keys(manifest.customTrophies ?? {}).sort()] as TrophyPackResourceKey[];
}


export function resolveToastSoundCandidates(
  state: CustomizationState,
  packs: readonly InstalledTrophyPack[],
  tier: ResolveTrophyAssetInput['tier'],
  appId?: number,
): import('./types').ResolvedPackSound[] {
  const catalog = new Map(packs.filter((pack) => !(state.safeMode.externalPacksDisabled && pack.source === 'user')).map((pack) => [pack.manifest.id, pack]));
  const gamePackId = appId == null ? undefined : state.trophies.games[String(appId)]?.packId;
  const ids = [state.notifications.soundPackId, gamePackId, state.trophies.globalPackId, DEFAULT_TROPHY_PACK_ID].filter((id): id is string => !!id);
  const key = `toast.${tier}` as PackSoundResourceKey;
  const seen = new Set<string>();
  const result: import('./types').ResolvedPackSound[] = [];
  ids.forEach((id, depth) => {
    if (seen.has(id)) return;
    seen.add(id);
    const pack = catalog.get(id);
    const relativePath = pack?.manifest.sounds?.[key];
    if (pack && relativePath) result.push({ packId: id, resourceKey: key, relativePath, source: pack.source, fallbackDepth: depth });
  });
  return result;
}

export function resolveToastSound(
  state: CustomizationState,
  packs: readonly InstalledTrophyPack[],
  input: { tier: ResolveTrophyAssetInput['tier']; appId?: number },
): import('./types').ResolvedPackSound {
  const first = resolveToastSoundCandidates(state, packs, input.tier, input.appId)[0];
  if (!first) throw new Error('No trophy toast sound is available for the requested tier.');
  return first;
}
