export const EN_US_CATALOG = Object.freeze({
  'app.title': 'Trophies',
  'app.name': 'Steam Trophies',
  'app.customize': 'Customize',
  'app.customize.close': 'Close customization',
  'app.refresh': 'Refresh',
  'app.back': 'Back',
  'app.close': 'Close',
  'app.done': 'Done',
  'app.pin': 'Pin',
  'app.unpin': 'Unpin',
  'app.hide': 'Hide',
  'app.unhide': 'Unhide',
  'app.icon': 'Icon',
  'app.gamesEarned': '{count} games with earned trophies',
  'app.loadingCache': 'Loading cached trophy index…',
  'app.empty': 'Nothing matches this view. Games at 0% stay hidden unless explicitly tracked.',
  'collection.label': 'Trophy collections',
  'collection.all': 'All',
  'collection.projects': 'Projects',
  'collection.near': 'Nearly complete',
  'collection.complete': 'Platinum',
  'search.games': 'Search trophy games',
  'project.add': 'Trophy Project',
  'project.remove': 'Untrack project',
  'project.active': 'Active Trophy Project',
  'project.targets': '{count} targeted trophies',
  'project.chooseTargets': 'Choose locked trophies below as your next targets.',
  'project.target': 'Target',
  'project.targeted': 'Targeted',
  'achievement.hidden': 'Hidden Trophy',
  'achievement.hiddenDescription': 'Unlock this trophy to reveal its details.',
  'pack.gameOverride': 'Trophy icons',
  'pack.achievementOverride': 'Customize trophy',
  'layout.customize': 'Customize layout',
  'notifications.test': 'Test trophy toast',
  'bp.kicker': 'STEAMTROPHIES',
  'bp.title': 'Your Trophy Cabinet',
  'bp.customize': 'Customize trophies',
  'bp.totals': 'Trophy totals',
  'bp.projects.title': 'Trophy Projects',
  'bp.projects.subtitle': 'Your active completion hunts',
  'bp.projects.empty': 'Open a trophy game and mark it as a Trophy Project.',
  'bp.near.title': 'Nearly Complete',
  'bp.near.subtitle': 'Close enough to taste the Platinum',
  'bp.recent.title': 'Recent Trophy Activity',
  'bp.recent.subtitle': 'Your latest trophy games',
  'bp.completed.title': 'Completed',
  'bp.completed.subtitle': 'Platinum cabinet',
  'bp.completed.empty': 'No Platinums yet. The cabinet is waiting.',
  'bp.all.title': 'All Trophy Games',
  'bp.all.subtitle': 'Everything with at least one earned trophy',
  'bp.empty': 'Nothing to show here yet.',
  'controller.select': 'Select',
  'controller.back': 'Back',
  'diagnostics.title': 'Diagnostics & safe mode',
  'diagnostics.description': 'Escape hatches stay available even when customization is broken.',
  'diagnostics.cachedGames': 'Cached trophy games',
  'diagnostics.installedPacks': 'Installed icon packs',
  'diagnostics.resolutionFixtures': 'Resolution fixtures',
  'diagnostics.schema': 'Customization schema',
  'diagnostics.enablePacks': 'Enable custom packs',
  'diagnostics.disablePacks': 'Disable custom packs',
  'diagnostics.enableTheme': 'Enable selected theme',
  'diagnostics.disableTheme': 'Disable selected theme',
  'diagnostics.showResponsive': 'Show responsive debug',
  'diagnostics.hideResponsive': 'Hide responsive debug',
  'diagnostics.showFocus': 'Show focus debug',
  'diagnostics.hideFocus': 'Hide focus debug',
} as const);

export type MessageKey = keyof typeof EN_US_CATALOG;
export type MessageValues = Readonly<Record<string, string | number>>;
export type SupportedLocale = 'en-US' | 'qps-ploc';

const ACCENTS: Readonly<Record<string, string>> = Object.freeze({
  a: 'à', e: 'ë', i: 'ï', o: 'ô', u: 'ü', A: 'À', E: 'Ë', I: 'Ï', O: 'Ô', U: 'Ü',
});

export function pseudoLocalize(input: string): string {
  const protectedTokens: string[] = [];
  const tokenized = input.replace(/\{[^}]+\}/g, (token) => `\u0000${protectedTokens.push(token) - 1}\u0000`);
  const accented = tokenized.replace(/[aeiouAEIOU]/g, (character) => ACCENTS[character] ?? character);
  const expanded = accented.replace(/\b([A-Za-zÀ-ÿ]{4,})\b/g, '$1~');
  return `⟦${expanded.replace(/\u0000(\d+)\u0000/g, (_match, index) => protectedTokens[Number(index)])}⟧`;
}

export function message(key: MessageKey, values: MessageValues = {}, locale: SupportedLocale = 'en-US'): string {
  const template = EN_US_CATALOG[key];
  const localized = locale === 'qps-ploc' ? pseudoLocalize(template) : template;
  return localized.replace(/\{([A-Za-z0-9_]+)\}/g, (_match, name) => String(values[name] ?? `{${name}}`));
}
