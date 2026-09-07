import type { SurfaceKind } from './types';

export type ResponsiveWidthBand = 'micro' | 'compact' | 'narrow' | 'standard' | 'wide' | 'ultrawide';
export type ResponsiveHeightBand = 'cramped' | 'short' | 'standard' | 'tall';
export type ResponsiveAspectBand = 'portrait' | 'squareish' | 'landscape' | 'cinematic' | 'super_ultrawide';

export interface ResponsiveMetrics {
  width: number;
  height: number;
  widthBand: ResponsiveWidthBand;
  heightBand: ResponsiveHeightBand;
  aspectBand: ResponsiveAspectBand;
  aspectRatio: number;
  /** Conservative density multiplier for layout chrome. Text scaling remains an accessibility concern. */
  density: number;
  columns: number;
  safeInlinePx: number;
  safeBlockPx: number;
}

export interface ResolutionFixture {
  name: string;
  width: number;
  height: number;
  surface: SurfaceKind;
  note: string;
}

/**
 * Breakpoints are expressed in CSS pixels, not physical display pixels.
 * Steam/SteamOS can scale the UI independently of the panel resolution, especially on docked Decks.
 * This classifier therefore consumes the actual rendered container size reported by ResizeObserver.
 */
export function classifyResponsiveMetrics(width: number, height: number, surface: SurfaceKind): ResponsiveMetrics {
  const w = Number.isFinite(width) ? Math.max(1, Math.round(width)) : 1;
  const h = Number.isFinite(height) ? Math.max(1, Math.round(height)) : 1;
  const ratio = w / h;
  const widthBand: ResponsiveWidthBand = w < 520 ? 'micro' : w < 720 ? 'compact' : w < 1024 ? 'narrow' : w < 1600 ? 'standard' : w < 2560 ? 'wide' : 'ultrawide';
  const heightBand: ResponsiveHeightBand = h < 560 ? 'cramped' : h < 720 ? 'short' : h < 1200 ? 'standard' : 'tall';
  const aspectBand: ResponsiveAspectBand = ratio < 0.9 ? 'portrait' : ratio < 1.25 ? 'squareish' : ratio < 2 ? 'landscape' : ratio < 2.65 ? 'cinematic' : 'super_ultrawide';

  // Do not fill a 32:9 viewport with twelve tiny cards. Readability beats raw column count.
  const baseColumns = widthBand === 'micro' ? 1 : widthBand === 'compact' ? 2 : widthBand === 'narrow' ? 2 : widthBand === 'standard' ? 4 : widthBand === 'wide' ? 5 : 6;
  const columns = surface === 'deck' ? Math.min(baseColumns, 3) : surface === 'big_picture' ? Math.min(baseColumns, 6) : Math.min(baseColumns, 6);
  const density = heightBand === 'cramped' ? 0.84 : heightBand === 'short' ? 0.92 : widthBand === 'ultrawide' ? 1.05 : 1;
  const safeInlinePx = surface === 'big_picture' ? Math.max(24, Math.min(72, Math.round(w * 0.028))) : Math.max(12, Math.min(36, Math.round(w * 0.015)));
  const safeBlockPx = surface === 'big_picture' ? Math.max(22, Math.min(58, Math.round(h * 0.035))) : Math.max(12, Math.min(30, Math.round(h * 0.02)));

  return { width: w, height: h, widthBand, heightBand, aspectBand, aspectRatio: ratio, density, columns, safeInlinePx, safeBlockPx };
}

export function responsiveCssVariables(metrics: ResponsiveMetrics): Record<string, string> {
  return {
    '--stt-root-width': `${metrics.width}px`,
    '--stt-root-height': `${metrics.height}px`,
    '--stt-layout-density': String(metrics.density),
    '--stt-grid-columns': String(metrics.columns),
    '--stt-safe-inline': `${metrics.safeInlinePx}px`,
    '--stt-safe-block': `${metrics.safeBlockPx}px`,
  };
}

export const RESOLUTION_TEST_MATRIX: readonly ResolutionFixture[] = Object.freeze([
  { name: 'Emergency narrow', width: 360, height: 640, surface: 'desktop', note: 'Smallest survivable layout without horizontal overflow.' },
  { name: 'Portrait utility window', width: 480, height: 800, surface: 'desktop', note: 'Tall/narrow stress case.' },
  { name: 'Short desktop window', width: 720, height: 480, surface: 'desktop', note: 'Cramped vertical chrome and scrolling.' },
  { name: 'Minimum desktop window', width: 520, height: 560, surface: 'desktop', note: 'Narrow resizable Steam window; no horizontal overflow.' },
  { name: '1024x600 handheld', width: 1024, height: 600, surface: 'deck', note: 'Lower-resolution handheld-class compatibility target.' },
  { name: '720p TV', width: 1280, height: 720, surface: 'big_picture', note: 'Common lower-resolution TV/BPM target.' },
  { name: 'Steam Deck LCD/OLED', width: 1280, height: 800, surface: 'deck', note: 'Official native panel resolution.' },
  { name: '1366x768 laptop', width: 1366, height: 768, surface: 'desktop', note: 'Very common laptop CSS-pixel target.' },
  { name: '1600x900 desktop', width: 1600, height: 900, surface: 'desktop', note: 'Mid-density desktop.' },
  { name: '1080p TV', width: 1920, height: 1080, surface: 'big_picture', note: 'Primary living-room reference.' },
  { name: '1920x1200 desktop', width: 1920, height: 1200, surface: 'desktop', note: '16:10 desktop target.' },
  { name: '2560x1080 ultrawide', width: 2560, height: 1080, surface: 'desktop', note: 'Common 21:9 width.' },
  { name: '1440p desktop', width: 2560, height: 1440, surface: 'desktop', note: 'High-density desktop reference.' },
  { name: '21:9 ultrawide', width: 3440, height: 1440, surface: 'desktop', note: 'Do not over-stretch shelves or copy.' },
  { name: '3840x1080 dual-wide', width: 3840, height: 1080, surface: 'desktop', note: 'Very wide but vertically constrained.' },
  { name: '4K Big Picture', width: 3840, height: 2160, surface: 'big_picture', note: 'Large living-room output with independent Steam UI scaling.' },
  { name: '32:9 super-ultrawide', width: 5120, height: 1440, surface: 'desktop', note: 'G9-class display; cap columns and preserve readable line length.' },
  { name: '5K2K ultrawide', width: 5120, height: 2160, surface: 'desktop', note: 'High-resolution wide desktop stress target.' },
  { name: '5K Retina stress', width: 5120, height: 2880, surface: 'desktop', note: 'High-DPI stress case when UI scaling presents large CSS dimensions.' },
  { name: 'Docked Deck 1080p', width: 1920, height: 1080, surface: 'deck', note: 'Deck shell on an external 1080p display.' },
  { name: 'Docked Deck 4K', width: 3840, height: 2160, surface: 'deck', note: 'Deck shell on a 4K external display; handheld affordances remain capped.' },
]);
