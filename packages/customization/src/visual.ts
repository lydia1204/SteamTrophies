import type { VisualPreferencesV1 } from './types';

export const DEFAULT_VISUAL: VisualPreferencesV1 = {
  recapPeriod:'week', recapIncludeHidden:false,
  rememberScreen:false, blurBackground:false, showScrollbar:true, scrollbarColor:'#56616e', scrollbarWidth:6,
  showReleaseYearLibrary:false, showReleaseYearDetail:false, showCompletionRarity:true, showGroupRarity:true,
  groupExpansion:'base', tooltipLayout:'standard', allTierEffects:false, themeBorderColors:false,
  tileColors:{}, tooltipColors:{}, customThemeEnabled:false, customColors:{}, gradient:'none', gradientColor:'#202b38', backgroundAnimation:'none',
};
const color = (v:unknown): v is string => typeof v === 'string' && /^#[\da-f]{6}$/i.test(v);
function colors(value:unknown, allowed:readonly string[]) {
  const result:Record<string,string> = {};
  if (value && typeof value === 'object') for (const key of allowed) { const v = (value as Record<string,unknown>)[key]; if (color(v)) result[key] = v; }
  return result;
}
export function validateVisual(value:unknown): VisualPreferencesV1 {
  const raw = value && typeof value === 'object' ? value as Partial<VisualPreferencesV1> : {};
  return {
    recapPeriod:raw.recapPeriod === 'month' || raw.recapPeriod === 'year' ? raw.recapPeriod : 'week', recapIncludeHidden:raw.recapIncludeHidden === true,
    rememberScreen:raw.rememberScreen === true, blurBackground:raw.blurBackground === true, showScrollbar:raw.showScrollbar !== false,
    scrollbarColor:color(raw.scrollbarColor) ? raw.scrollbarColor : DEFAULT_VISUAL.scrollbarColor,
    scrollbarWidth:Number.isFinite(raw.scrollbarWidth) ? Math.max(2,Math.min(18,Math.round(raw.scrollbarWidth!))) : 6,
    showReleaseYearLibrary:raw.showReleaseYearLibrary === true, showReleaseYearDetail:raw.showReleaseYearDetail === true,
    showCompletionRarity:raw.showCompletionRarity !== false, showGroupRarity:raw.showGroupRarity !== false,
    groupExpansion:raw.groupExpansion === 'all' || raw.groupExpansion === 'none' ? raw.groupExpansion : 'base',
    tooltipLayout:raw.tooltipLayout === 'description-first' || raw.tooltipLayout === 'compact' ? raw.tooltipLayout : 'standard',
    allTierEffects:raw.allTierEffects === true, themeBorderColors:raw.themeBorderColors === true,
    tileColors:colors(raw.tileColors,['bronze','silver','gold','platinum']), tooltipColors:colors(raw.tooltipColors,['bronze','silver','gold','platinum']),
    customThemeEnabled:raw.customThemeEnabled === true,
    customColors:colors(raw.customColors,['background','surface','surfaceRaised','text','muted','accent','border','focus','bronze','silver','gold','platinum']),
    gradient:raw.gradient === 'diagonal' || raw.gradient === 'horizontal' ? raw.gradient : 'none',
    gradientColor:color(raw.gradientColor) ? raw.gradientColor : DEFAULT_VISUAL.gradientColor,
    backgroundAnimation:raw.backgroundAnimation === 'drift' ? 'drift' : 'none',
  };
}
