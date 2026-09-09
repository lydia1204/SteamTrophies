import type { AccessibilityPreferencesV1, SurfaceKind, ThemeTokensV1 } from './types';

export const DEFAULT_THEME: ThemeTokensV1 = Object.freeze({
  version: 1,
  id: 'builtin.midnight',
  name: 'Midnight',
  tokens: {
    color: {
      background: '#10151d', surface: '#19212c', surfaceRaised: '#202b38', text: '#f2f5f7', muted: '#9da9b7', accent: '#67bdf4',
      border: 'rgba(255,255,255,.09)', focus: '#8fd6ff', bronze: '#c88658', silver: '#cbd5df', gold: '#f2c75a', platinum: '#8ad7ff',
    },
    radius: { card: 10, control: 9, overlay: 16 },
    spacing: { compact: 8, normal: 14, roomy: 24 },
    typography: { scale: 1 },
    motion: { enabled: true, durationMs: 180 },
    opacity: { disabled: 0.45, locked: 0.62 },
  },
});

export function compileThemeCssVariables(theme: ThemeTokensV1, surface: SurfaceKind, accessibility: AccessibilityPreferencesV1): Record<string, string> {
  const t = mergeSurfaceTokens(theme, surface);
  const motionEnabled = t.motion.enabled && !accessibility.reducedMotion;
  return {
    '--stt-color-background': accessibility.highContrast ? '#080b10' : t.color.background,
    '--stt-color-surface': accessibility.highContrast ? '#131b24' : t.color.surface,
    '--stt-color-surface-raised': accessibility.highContrast ? '#202b38' : t.color.surfaceRaised,
    '--stt-color-text': accessibility.highContrast ? '#ffffff' : t.color.text,
    '--stt-color-muted': accessibility.highContrast ? '#d6dbe1' : t.color.muted,
    '--stt-color-accent': t.color.accent,
    '--stt-color-border': accessibility.highContrast ? 'rgba(255,255,255,.34)' : t.color.border,
    '--stt-color-focus': t.color.focus,
    '--stt-color-bronze': t.color.bronze,
    '--stt-color-silver': t.color.silver,
    '--stt-color-gold': t.color.gold,
    '--stt-color-platinum': t.color.platinum,
    '--stt-radius-card': `${t.radius.card}px`,
    '--stt-radius-control': `${t.radius.control}px`,
    '--stt-radius-overlay': `${t.radius.overlay}px`,
    '--stt-space-compact': `${t.spacing.compact}px`,
    '--stt-space-normal': `${t.spacing.normal}px`,
    '--stt-space-roomy': `${t.spacing.roomy}px`,
    '--stt-text-scale': String(t.typography.scale * accessibility.textScale),
    '--stt-icon-scale': String(accessibility.iconScale),
    '--stt-motion-duration': motionEnabled ? `${Math.max(0, t.motion.durationMs)}ms` : '0ms',
    '--stt-opacity-disabled': String(t.opacity.disabled),
    '--stt-opacity-locked': String(t.opacity.locked),
  };
}

function mergeSurfaceTokens(theme: ThemeTokensV1, surface: SurfaceKind): ThemeTokensV1['tokens'] {
  const override = theme.surfaceOverrides?.[surface];
  if (!override) return theme.tokens;
  return {
    color: { ...theme.tokens.color, ...override.color },
    radius: { ...theme.tokens.radius, ...override.radius },
    spacing: { ...theme.tokens.spacing, ...override.spacing },
    typography: { ...theme.tokens.typography, ...override.typography },
    motion: { ...theme.tokens.motion, ...override.motion },
    opacity: { ...theme.tokens.opacity, ...override.opacity },
  };
}
