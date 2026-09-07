import type { AppId, AchievementId, TrophyTier } from '../../core/src/model';

export type SurfaceKind = 'desktop' | 'big_picture' | 'deck';
export type TrophyResourceKey = `trophy.${TrophyTier}`;
export type CustomTrophyResourceKey = `custom.${string}`;
export type TrophyPackResourceKey = TrophyResourceKey | CustomTrophyResourceKey;
export type PackSoundResourceKey = `toast.${TrophyTier}`;
export type ResourceKey = TrophyPackResourceKey | PackSoundResourceKey | `navigation.${string}` | `surface.${string}`;
export type PackSource = 'builtin' | 'user';

export interface TrophyPackManifestV1 {
  manifestVersion: 1;
  id: string;
  name: string;
  version: string;
  author: string;
  description?: string;
  license?: string;
  homepage?: string;
  tags?: string[];
  accentColor?: string;
  attribution?: string;
  type: 'trophy-icon-pack';
  minSteamTrophiesVersion?: string;
  assets: Record<TrophyResourceKey, string>;
  /** Optional named one-off icons used by per-achievement overrides, e.g. custom.slime-crown. */
  customTrophies?: Record<CustomTrophyResourceKey, string>;
  sounds?: Partial<Record<PackSoundResourceKey, string>>;
  preview?: string;
  recommendedFor?: SurfaceKind[];
}

export interface InstalledTrophyPack {
  manifest: TrophyPackManifestV1;
  source: PackSource;
  installedPath?: string;
  originalSourcePath?: string;
  importedAtUnix?: number;
  contentHash?: string;
}

export interface TrophyAssetRef {
  packId: string;
  resourceKey: TrophyPackResourceKey;
}

export interface GameTrophyOverrideV1 {
  /** Use this entire pack for the game. Missing resources fall back to lower-precedence layers. */
  packId?: string;
  /** Per-tier overrides let one game use mixed trophy families without changing the global pack. */
  tierOverrides?: Partial<Record<TrophyTier, TrophyAssetRef>>;
  /** Per-achievement trophy emblem override. */
  achievementOverrides?: Record<AchievementId, TrophyAssetRef>;
}

export interface TrophyOverrideStateV1 {
  version: 1;
  globalPackId: string;
  games: Record<string, GameTrophyOverrideV1>;
}

export interface ThemeTokensV1 {
  version: 1;
  id: string;
  name: string;
  tokens: {
    color: {
      background: string;
      surface: string;
      surfaceRaised: string;
      text: string;
      muted: string;
      accent: string;
      border: string;
      focus: string;
      bronze: string;
      silver: string;
      gold: string;
      platinum: string;
    };
    radius: { card: number; control: number; overlay: number };
    spacing: { compact: number; normal: number; roomy: number };
    typography: { scale: number };
    motion: { enabled: boolean; durationMs: number };
    opacity: { disabled: number; locked: number };
  };
  surfaceOverrides?: Partial<Record<SurfaceKind, Partial<ThemeTokensV1['tokens']>>>;
}

export interface WidgetDefinition {
  id: string;
  title: string;
  allowedSurfaces: SurfaceKind[];
  defaultVisible: boolean;
}

export interface SurfaceLayoutV1 {
  order: string[];
  hidden: string[];
}

export interface LayoutStateV1 {
  version: 1;
  surfaces: Record<SurfaceKind, SurfaceLayoutV1>;
}

export interface AccessibilityPreferencesV1 {
  reducedMotion: boolean;
  highContrast: boolean;
  textScale: number;
  iconScale: number;
}

export interface TrophyProjectV1 {
  appId: AppId;
  createdAtUnix: number;
  targetAchievementIds: AchievementId[];
  note?: string;
}

export interface TrophyProjectStateV1 {
  maxActive: number;
  entries: TrophyProjectV1[];
}

export interface LibraryPresentationStateV1 {
  /** Visible trophy games manually floated to the top. */
  pinnedAppIds: AppId[];
  /** Visible trophy games explicitly hidden from normal shelves. */
  hiddenAppIds: AppId[];
  /** Explicit 0%-game tracking exception. Runtime may probe/persist these even under earned-only policy. */
  trackedAppIds: AppId[];
}

export type TrophyToastPosition = 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';

export interface QuietHoursV1 {
  enabled: boolean;
  /** Local wall-clock minute [0, 1439]. */
  startMinute: number;
  /** Local wall-clock minute [0, 1439]. */
  endMinute: number;
}

export interface NotificationPreferencesV1 {
  enabled: boolean;
  durationMs: number;
  position: TrophyToastPosition;
  soundEnabled: boolean;
  volume: number;
  showAchievementArtwork: boolean;
  platinumCelebration: boolean;
  /** Maximum number of trophy cards visible at once during unlock bursts. */
  maxVisible: number;
  /** Minimum gap between non-test trophy sounds. Prevents burst unlocks becoming audio spam. */
  audioCooldownMs: number;
  quietHours: QuietHoursV1;
}

export interface SafeModeStateV1 {
  externalPacksDisabled: boolean;
  themesDisabled: boolean;
  themeFailureCount: number;
  lastKnownGoodThemeId: string;
}

/** Pass 2 persisted shape. Kept only so Pass 3 can migrate existing installs without data loss. */
export interface CustomizationStateV1 {
  version: 1;
  trophies: TrophyOverrideStateV1;
  themeId: string;
  layout: LayoutStateV1;
  accessibility: AccessibilityPreferencesV1;
}

export interface CustomizationStateV2 {
  version: 2;
  trophies: TrophyOverrideStateV1;
  themeId: string;
  layout: LayoutStateV1;
  accessibility: AccessibilityPreferencesV1;
  projects: TrophyProjectStateV1;
  library: LibraryPresentationStateV1;
  notifications: NotificationPreferencesV1;
  safeMode: SafeModeStateV1;
  developer: {
    focusDebug: boolean;
    responsiveDebug: boolean;
  };
}

export type CustomizationState = CustomizationStateV2;

export interface ResolveTrophyAssetInput {
  tier: TrophyTier;
  appId?: AppId;
  achievementId?: AchievementId;
}


export interface ResolvedPackSound {
  packId: string;
  resourceKey: PackSoundResourceKey;
  relativePath: string;
  source: PackSource;
  fallbackDepth: number;
}

export interface ResolvedTrophyAsset {
  packId: string;
  resourceKey: TrophyPackResourceKey;
  relativePath: string;
  source: PackSource;
  fallbackDepth: number;
}
