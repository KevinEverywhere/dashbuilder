export type ThemePreference = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'destination-atlas-theme';

function readStoredTheme(): ThemePreference {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

function applyTheme(theme: ThemePreference): void {
  localStorage.setItem(STORAGE_KEY, theme);
  if (theme === 'system') {
    document.documentElement.removeAttribute('data-theme');
  } else {
    document.documentElement.setAttribute('data-theme', theme);
  }
}

export function createThemePreference() {
  let theme = readStoredTheme();
  applyTheme(theme);

  return {
    get theme() {
      return theme;
    },
    setTheme(next: ThemePreference) {
      theme = next;
      applyTheme(theme);
    },
  };
}

export function themeLabel(theme: ThemePreference): string {
  switch (theme) {
    case 'light':
      return 'Light';
    case 'dark':
      return 'Dark';
    default:
      return 'System';
  }
}
