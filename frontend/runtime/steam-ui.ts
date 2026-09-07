type Unregisterable = { unregister(): void };

/**
 * Verified against @decky/ui current Steam client shared enum on 2026-09-06.
 * Keep these values isolated here because Steam UI internals can change independently of Trophy Core.
 */
export const VERIFIED_STEAM_UI_MODE = Object.freeze({ GamePad: 4, Desktop: 7 } as const);
export type MillenniumSurfaceMode = 'desktop' | 'big_picture' | 'unknown';

type SteamClientShape = {
  System?: {
    OpenFileDialog?: (prefs: {
      bChooseDirectory?: boolean;
      rgFilters?: Array<{ strFileTypeName: string; rFilePatterns: string[]; bUseAsDefault?: boolean }>;
      strInitialFile?: string;
      strTitle?: string;
    }) => Promise<string | { result?: number; message?: string }>;
    OpenLocalDirectoryInSystemExplorer?: (directory: string) => void;
  };
  UI?: {
    GetUIMode?: () => Promise<unknown>;
    RegisterForUIModeChanged?: (callback: (mode: unknown) => void) => Unregisterable;
  };
};

const steamUiClient = (): SteamClientShape | undefined => (globalThis as typeof globalThis & { SteamClient?: SteamClientShape }).SteamClient;

export async function pickTrophyPackDirectory(): Promise<string | null> {
  const open = steamUiClient()?.System?.OpenFileDialog;
  if (!open) throw new Error('Steam file picker is unavailable in this UI context.');
  const result = await open({
    bChooseDirectory: true,
    strTitle: 'Select SteamTrophies pack folder',
    rgFilters: [{ strFileTypeName: 'SteamTrophies trophy pack folder', rFilePatterns: ['*'], bUseAsDefault: true }],
  });
  return typeof result === 'string' && result.length > 0 ? result : null;
}

export function revealLocalDirectory(path: string): void {
  const open = steamUiClient()?.System?.OpenLocalDirectoryInSystemExplorer;
  if (!open) throw new Error('Open folder is unavailable in this UI context.');
  open(path);
}

export function classifySteamUiMode(raw: unknown): MillenniumSurfaceMode {
  if (raw === VERIFIED_STEAM_UI_MODE.GamePad) return 'big_picture';
  if (raw === VERIFIED_STEAM_UI_MODE.Desktop) return 'desktop';
  // Tolerate symbolic values from development mocks/generated wrappers without broad coercion.
  if (raw === 'GamePad' || raw === 'gamepad' || raw === 'BigPicture' || raw === 'big_picture') return 'big_picture';
  if (raw === 'Desktop' || raw === 'desktop') return 'desktop';
  return 'unknown';
}

export async function readRawSteamUiMode(): Promise<unknown> {
  return steamUiClient()?.UI?.GetUIMode?.();
}

export async function readSteamSurfaceMode(): Promise<MillenniumSurfaceMode> {
  return classifySteamUiMode(await readRawSteamUiMode());
}

export function onRawSteamUiModeChanged(callback: (mode: unknown) => void): () => void {
  const registration = steamUiClient()?.UI?.RegisterForUIModeChanged?.(callback);
  return () => registration?.unregister();
}

export function onSteamSurfaceModeChanged(callback: (mode: MillenniumSurfaceMode) => void): () => void {
  return onRawSteamUiModeChanged((raw) => callback(classifySteamUiMode(raw)));
}
