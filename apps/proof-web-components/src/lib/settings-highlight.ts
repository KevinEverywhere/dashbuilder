export type SettingsHighlightTarget =
  | 'role'
  | 'locale'
  | 'map'
  | 'selected'
  | 'theme'
  | 'integrations'
  | 'ai'
  | 'feedback'
  | null;

export const SETTING_FIELD_TARGETS = ['role', 'locale', 'map', 'selected'] as const;
export type SettingFieldTarget = (typeof SETTING_FIELD_TARGETS)[number];

export function isSettingFieldTarget(value: SettingsHighlightTarget): value is SettingFieldTarget {
  return SETTING_FIELD_TARGETS.includes(value as SettingFieldTarget);
}
