import type { ThemeTokensV1 } from './types';
import { DEFAULT_THEME } from './theme';

export const BUILTIN_THEMES: readonly ThemeTokensV1[] = Object.freeze([
  DEFAULT_THEME,
  {
    ...DEFAULT_THEME,
    id: 'builtin.oled-black',
    name: 'OLED Black',
    tokens: {
      ...DEFAULT_THEME.tokens,
      color: { ...DEFAULT_THEME.tokens.color, background: '#000000', surface: '#0c0f13', surfaceRaised: '#151a20', accent: '#76c9ff' },
      radius: { card: 12, control: 10, overlay: 18 },
    },
  },
  {
    ...DEFAULT_THEME,
    id: 'builtin.steam-blue',
    name: 'Steam Blue',
    tokens: {
      ...DEFAULT_THEME.tokens,
      color: { ...DEFAULT_THEME.tokens.color, background: '#171d25', surface: '#1b2838', surfaceRaised: '#22374d', accent: '#66c0f4', focus: '#a4dfff' },
    },
  },
  {
    ...DEFAULT_THEME,
    id: 'builtin.high-contrast',
    name: 'High Contrast',
    tokens: {
      ...DEFAULT_THEME.tokens,
      color: { ...DEFAULT_THEME.tokens.color, background: '#000000', surface: '#0a0a0a', surfaceRaised: '#171717', text: '#ffffff', muted: '#e2e2e2', border: '#ffffff', focus: '#00d9ff' },
      motion: { enabled: false, durationMs: 0 },
    },
  },
]);

export function resolveTheme(themeId: string): ThemeTokensV1 {
  return BUILTIN_THEMES.find((theme) => theme.id === themeId) ?? DEFAULT_THEME;
}
