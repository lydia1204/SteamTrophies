export type MessageKey =
  | 'app.title'
  | 'app.customize'
  | 'app.refresh'
  | 'app.back'
  | 'project.add'
  | 'project.remove'
  | 'pack.gameOverride'
  | 'pack.achievementOverride'
  | 'layout.customize'
  | 'notifications.test';

const EN_US: Readonly<Record<MessageKey, string>> = Object.freeze({
  'app.title': 'Trophies',
  'app.customize': 'Customize',
  'app.refresh': 'Refresh',
  'app.back': 'Back',
  'project.add': 'Add to Trophy Projects',
  'project.remove': 'Remove Trophy Project',
  'pack.gameOverride': 'Trophy icons',
  'pack.achievementOverride': 'Customize trophy',
  'layout.customize': 'Customize layout',
  'notifications.test': 'Test trophy toast',
});

export function message(key: MessageKey, locale = 'en-US'): string {
  // Locale registry intentionally starts with en-US; consumers never hard-code visible strings in new feature surfaces.
  void locale;
  return EN_US[key];
}
