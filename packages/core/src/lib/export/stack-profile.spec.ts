import {
  createEmptyStylingProfile,
  getCompatibleDatabaseStackOptions,
  getCompatibleServerStackOptions,
  getCompatibleStackDefaults,
  getCompatibleStylingAuthoring,
  getCompatibleStylingOptions,
  getDefaultStyling,
  getDefaultStylingProfile,
  getStylingAuthoringStackOptions,
  getStylingFoundationStackOptions,
  isDatabaseCompatibleWithUi,
  isEmptyStylingProfile,
  isServerCompatibleWithUi,
  normalizeStackProfile,
  normalizeStackStyling,
  normalizeUiFrameworkChoice,
  resolveEffectiveExportTargets,
  resolveEffectiveStyling,
  resolveEffectiveStylingProfile,
  resolveStackDatabaseChoiceForUi,
  resolveStackServerChoiceForUi,
  stackProfileToExportTargets,
} from './stack-profile';

describe('stack profile', () => {
  it('returns partner defaults for a concrete UI framework', () => {
    expect(getCompatibleStackDefaults('react')).toEqual({
      ui: 'react',
      server: 'next',
      database: 'postgresql',
      styling: createEmptyStylingProfile(),
    });
    expect(getCompatibleStackDefaults('vue')).toEqual({
      ui: 'vue',
      server: 'nuxt',
      database: 'postgresql',
      styling: createEmptyStylingProfile(),
    });
    expect(getCompatibleStackDefaults('angular')).toEqual({
      ui: 'angular',
      server: 'nest',
      database: 'postgresql',
      styling: createEmptyStylingProfile(),
    });
  });

  it('returns web components profile defaults', () => {
    expect(getCompatibleStackDefaults('web-components')).toEqual({
      ui: 'web-components',
      server: 'none',
      database: 'none',
      styling: createEmptyStylingProfile(),
    });
    expect(stackProfileToExportTargets({ ui: 'web-components', styling: 'tailwind' })).toEqual({
      ui: 'web-components',
    });
  });

  it('migrates legacy scratch-pad any to web-components', () => {
    expect(normalizeUiFrameworkChoice('any')).toBe('web-components');
    expect(
      normalizeStackProfile({
        ui: 'any' as never,
        server: 'nest',
        database: 'mongodb',
        styling: 'tailwind',
      }),
    ).toEqual({
      ui: 'web-components',
      server: 'nest',
      database: 'mongodb',
      styling: normalizeStackStyling('web-components', 'tailwind'),
    });
  });

  it('includes None chips in styling stack options', () => {
    expect(getStylingFoundationStackOptions('react').map((option) => option.id)).toEqual([
      'none',
      'neutral-tokens',
      'tailwind',
    ]);
    expect(getStylingAuthoringStackOptions('web-components').map((option) => option.id)).toEqual([
      'none',
      'css-modules',
      'plain-css',
    ]);
  });

  it('preserves empty styling selections during normalization', () => {
    expect(normalizeStackStyling('react', createEmptyStylingProfile())).toEqual(
      createEmptyStylingProfile(),
    );
    expect(
      normalizeStackStyling('react', {
        foundation: ['neutral-tokens'],
        authoring: [],
        inlineStyles: false,
      }),
    ).toEqual({
      foundation: ['neutral-tokens'],
      authoring: [],
      inlineStyles: false,
    });
  });

  it('filters styling options by UI framework', () => {
    expect(getCompatibleStylingOptions('react').map((option) => option.id)).toEqual([
      'neutral',
      'tailwind',
      'mui',
      'plain-css',
    ]);
    expect(getCompatibleStylingOptions('web-components').map((option) => option.id)).toEqual([
      'neutral',
      'tailwind',
    ]);
    expect(getCompatibleStylingAuthoring('react').map((option) => option.id)).toEqual([
      'css-modules',
      'styled-components',
      'plain-css',
    ]);
  });

  it('filters server and database options by UI framework', () => {
    expect(getCompatibleServerStackOptions('react').map((option) => option.id)).toEqual([
      'none',
      'next',
      'nest',
      'express',
    ]);
    expect(getCompatibleServerStackOptions('vue').map((option) => option.id)).toEqual([
      'none',
      'nuxt',
      'nest',
      'express',
    ]);
    expect(getCompatibleServerStackOptions('angular').map((option) => option.id)).toEqual([
      'none',
      'nest',
      'express',
    ]);
    expect(getCompatibleServerStackOptions('web-components').map((option) => option.id)).toEqual([
      'none',
      'next',
      'nuxt',
      'nest',
      'express',
    ]);

    expect(getCompatibleDatabaseStackOptions('react').map((option) => option.id)).toEqual([
      'none',
      'postgresql',
      'mongodb',
      'supabase',
      'mysql',
    ]);
  });

  it('checks server and database compatibility', () => {
    expect(isServerCompatibleWithUi('react', 'next')).toBe(true);
    expect(isServerCompatibleWithUi('react', 'nuxt')).toBe(false);
    expect(isServerCompatibleWithUi('vue', 'next')).toBe(false);
    expect(isServerCompatibleWithUi('angular', 'nest')).toBe(true);
    expect(isDatabaseCompatibleWithUi('react', 'postgresql')).toBe(true);
    expect(isDatabaseCompatibleWithUi('react', 'invalid' as never)).toBe(false);
  });

  it('resolves server and database choices for UI framework', () => {
    expect(resolveStackServerChoiceForUi('react', null)).toBe('next');
    expect(resolveStackServerChoiceForUi('react', 'none')).toBe('none');
    expect(resolveStackServerChoiceForUi('react', 'nuxt')).toBe('next');
    expect(resolveStackServerChoiceForUi('vue', 'next')).toBe('nuxt');
    expect(resolveStackDatabaseChoiceForUi('react', 'none')).toBe('none');
    expect(resolveStackDatabaseChoiceForUi('react', null)).toBe('postgresql');
  });

  it('resolves server and database choices for web components', () => {
    expect(resolveStackServerChoiceForUi('web-components', null)).toBe('none');
    expect(resolveStackServerChoiceForUi('web-components', 'none')).toBe('none');
    expect(resolveStackServerChoiceForUi('web-components', 'nuxt')).toBe('nuxt');
    expect(resolveStackDatabaseChoiceForUi('web-components', 'mongodb')).toBe('mongodb');
  });

  it('preserves server and database on web components profiles during normalization', () => {
    expect(
      normalizeStackProfile({
        ui: 'web-components',
        server: 'nest',
        database: 'mongodb',
        styling: 'tailwind',
      }),
    ).toEqual({
      ui: 'web-components',
      server: 'nest',
      database: 'mongodb',
      styling: normalizeStackStyling('web-components', 'tailwind'),
    });
  });

  it('strips incompatible server choices during normalization', () => {
    expect(normalizeStackProfile({ ui: 'react', server: 'nuxt' })).toEqual({
      ui: 'react',
      server: 'next',
      database: 'postgresql',
      styling: createEmptyStylingProfile(),
    });

    expect(normalizeStackProfile({ ui: 'vue', server: 'next' })).toEqual({
      ui: 'vue',
      server: 'nuxt',
      database: 'postgresql',
      styling: createEmptyStylingProfile(),
    });

    expect(normalizeStackProfile({ ui: 'angular', server: 'next' })).toEqual({
      ui: 'angular',
      server: 'nest',
      database: 'postgresql',
      styling: createEmptyStylingProfile(),
    });
  });

  it('normalizes partial profiles and styling compatibility', () => {
    expect(normalizeStackProfile({ ui: 'angular', server: 'express' })).toEqual({
      ui: 'angular',
      server: 'express',
      database: 'postgresql',
      styling: createEmptyStylingProfile(),
    });

    expect(normalizeStackProfile({ ui: 'react', server: 'none', database: 'none' })).toEqual({
      ui: 'react',
      server: 'none',
      database: 'none',
      styling: createEmptyStylingProfile(),
    });

    expect(
      normalizeStackProfile({ ui: 'react', styling: 'mui' as const, server: 'next', database: 'postgresql' }),
    ).toEqual({
      ui: 'react',
      server: 'next',
      database: 'postgresql',
      styling: normalizeStackStyling('react', 'mui'),
    });

    expect(normalizeStackProfile({ ui: 'react', styling: 'vuetify' as never })).toEqual({
      ui: 'react',
      server: 'next',
      database: 'postgresql',
      styling: normalizeStackStyling('react', 'vuetify'),
    });
  });

  it('maps none server/database choices to UI-only export targets', () => {
    expect(stackProfileToExportTargets({ ui: 'react', server: 'none', database: 'none' })).toEqual({
      ui: 'react',
    });

    expect(
      stackProfileToExportTargets({ ui: 'vue', server: 'nuxt', database: 'none', styling: 'tailwind' }),
    ).toEqual({
      ui: 'vue',
      server: 'nuxt',
    });
  });

  it('resolves export targets from composite then project profile', () => {
    expect(
      resolveEffectiveExportTargets(
        { ui: 'svelte', server: 'nest', database: 'mongodb' },
        { ui: 'react', server: 'next', database: 'postgresql', styling: 'mui' },
      ),
    ).toEqual({ ui: 'svelte', server: 'nest', database: 'mongodb' });

    expect(
      resolveEffectiveExportTargets(undefined, {
        ui: 'vue',
        server: 'nuxt',
        database: 'postgresql',
        styling: 'vuetify',
      }),
    ).toEqual({ ui: 'vue', server: 'nuxt', database: 'postgresql' });

    expect(resolveEffectiveExportTargets(undefined, { ui: 'web-components', styling: 'tailwind' })).toEqual(
      {
        ui: 'web-components',
      },
    );

    expect(
      resolveEffectiveExportTargets(undefined, { ui: 'react', server: 'none', database: 'none' }),
    ).toEqual({ ui: 'react' });
  });

  it('resolves styling from project profile for export UI target', () => {
    expect(
      resolveEffectiveStyling({ ui: 'react', styling: 'mui' }, 'react'),
    ).toBe('mui');
    expect(
      resolveEffectiveStyling({ ui: 'react', styling: 'mui' }, 'vue'),
    ).toBe(getDefaultStyling('vue'));
  });

  it('falls back to UI defaults when styling profile is empty at export time', () => {
    expect(
      resolveEffectiveStylingProfile({ ui: 'react', styling: createEmptyStylingProfile() }, 'react'),
    ).toEqual(getDefaultStylingProfile('react'));
    expect(isEmptyStylingProfile(createEmptyStylingProfile())).toBe(true);
  });
});
