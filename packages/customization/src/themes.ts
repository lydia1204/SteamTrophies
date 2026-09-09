import type { ThemeTokensV1 } from './types';
import { DEFAULT_THEME } from './theme';

function palette(id:string, name:string, colors:string[]):ThemeTokensV1 {
  return { ...DEFAULT_THEME, id:`builtin.${id}`, name, previewColors:colors, tokens:{ ...DEFAULT_THEME.tokens, color:{ ...DEFAULT_THEME.tokens.color, accent:colors[0], focus:colors[colors.length-1], bronze:colors[0], silver:colors[1 % colors.length], gold:colors[2 % colors.length], platinum:colors[colors.length-1] } } };
}

export const BUILTIN_THEMES: readonly ThemeTokensV1[] = Object.freeze([
  DEFAULT_THEME,
  ...[
    ['portal','Portal Ice',['#65cbff','#ffad65']], ['lambda','Lambda Amber',['#ffb454','#e8ddbf']],
    ['retro-steam','Classic Green',['#b3bb87','#90a090']], ['neon-arcade','Neon Arcade',['#fa80da','#73edfa','#a69aff']],
    ['synthwave','Synthwave',['#ff83c9','#b093ff','#75d9ff']], ['forest','Forest Quest',['#9fdda4','#d4c58d']],
    ['crimson','Crimson Citadel',['#ff8e9c','#c5accf']], ['ocean','Ocean Depths',['#69e3e0','#8bb5ff']],
    ['pride-rainbow','Rainbow Pride',['#ff7878','#ffb66b','#ffed87','#83d89c','#85b4ff','#c49df1']],
    ['pride-progress','Progress Pride',['#70cef0','#f2afd0','#ffffff','#bd8a64','#5e535c','#ff7878','#ffb66b','#ffed87','#83d89c','#85b4ff','#c49df1']],
    ['pride-trans','Trans Pride',['#70cef0','#f2afd0','#ffffff','#f2afd0','#70cef0']],
    ['pride-bi','Bi Pride',['#eb7aad','#b68ad1','#8caff2']], ['pride-lesbian','Lesbian Pride',['#ee9178','#ffb67d','#ffffff','#e79bb7','#d980b3']],
    ['pride-gay','Gay Pride',['#70d7b7','#adeaca','#ffffff','#96bcf1','#af95eb']],
    ['pride-pan','Pan Pride',['#ff83bf','#ffe880','#80caff']], ['pride-nonbinary','Nonbinary Pride',['#fff18b','#ffffff','#c697df','#65606c']],
    ['pride-ace','Asexual Pride',['#a5a5a5','#eeeeee','#bd8ddf','#68616e']], ['pride-aro','Aromantic Pride',['#83cb8b','#bbdf9f','#ffffff','#b5b5b5','#68686a']],
    ['pride-agender','Agender Pride',['#b5b5b5','#ffffff','#b9e791','#ffffff','#68686a']], ['pride-genderfluid','Genderfluid Pride',['#ef9fc1','#ffffff','#d28ade','#787079','#8ca0e6']],
    ['pride-genderqueer','Genderqueer Pride',['#c5a0da','#ffffff','#acd080']], ['pride-intersex','Intersex Pride',['#ffe575','#b386d7']],
    ['pride-demiboy','Demiboy Pride',['#9fcdf1','#ffffff','#a1a1a1']], ['pride-demigirl','Demigirl Pride',['#f3b6d1','#ffffff','#a1a1a1']],
  ].map(([id,name,colors]) => palette(id as string,name as string,colors as string[])),
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
