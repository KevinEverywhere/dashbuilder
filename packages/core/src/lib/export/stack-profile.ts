import type {
  ExportTargetConfig,
  StackDatabaseChoice,
  StackProfile,
  StackServerChoice,
  StackStylingProfile,
  StylingAuthoring,
  StylingComponentLibrary,
  StylingFoundation,
  StylingFrameworkChoice,
} from '../model/types';

export type UiFrameworkChoice = StackProfile['ui'];
export type ServerTargetChoice = NonNullable<ExportTargetConfig['server']>;
export type DatabaseTargetChoice = NonNullable<ExportTargetConfig['database']>;

export type {
  StackProfile,
  StackStylingProfile,
  StylingFrameworkChoice,
  StackServerChoice,
  StackDatabaseChoice,
  StylingFoundation,
  StylingComponentLibrary,
  StylingAuthoring,
};

export const SERVER_STACK_ECOSYSTEM_NOTE =
  'v1 server exporters cover Node.js stacks below. Python (FastAPI, Django), Java (Spring), and Azure Functions are planned — pick None if you are UI-only for now.';

export type UiTargetOption = { id: UiFrameworkChoice; label: string; description: string };

export type UiTargetGroup = {
  id: 'framework-based' | 'web-components';
  label: string;
  description: string;
  options: UiTargetOption[];
};

export const FRAMEWORK_UI_OPTIONS: UiTargetOption[] = [
  { id: 'react', label: 'React', description: 'TSX components and hooks' },
  { id: 'angular', label: 'Angular', description: 'Standalone components' },
  { id: 'vue', label: 'Vue', description: 'Composition API SFCs' },
  { id: 'svelte', label: 'Svelte', description: 'Svelte 5 runes + SFCs' },
];

export const WEB_COMPONENTS_UI_OPTION: UiTargetOption = {
  id: 'web-components',
  label: 'Web Components',
  description: 'W3C Custom Elements — standards-based components for any browser or host framework',
};

export const UI_TARGET_GROUPS: UiTargetGroup[] = [
  {
    id: 'framework-based',
    label: 'Framework-based',
    description:
      'Build dashboards and components native to React, Angular, Vue, or Svelte — exported in that framework’s idioms.',
    options: FRAMEWORK_UI_OPTIONS,
  },
  {
    id: 'web-components',
    label: 'W3C Web Components',
    description:
      'Build Custom Elements on the web platform — embed the same dashboard or component in any framework or plain HTML.',
    options: [WEB_COMPONENTS_UI_OPTION],
  },
];

/** Flat list of all UI targets (framework-based + Web Components). */
export const UI_FRAMEWORK_OPTIONS: UiTargetOption[] = UI_TARGET_GROUPS.flatMap((group) => group.options);

/** Maps legacy scratch-pad `any` to W3C Web Components. */
export function normalizeUiFrameworkChoice(ui: string | UiFrameworkChoice): UiFrameworkChoice {
  if (ui === 'any') {
    return 'web-components';
  }
  return ui as UiFrameworkChoice;
}

export function isWebComponentsUi(ui: UiFrameworkChoice): ui is 'web-components' {
  return ui === 'web-components';
}

export function isFrameworkBasedUi(ui: UiFrameworkChoice): ui is Exclude<UiFrameworkChoice, 'web-components'> {
  return ui !== 'web-components';
}

export const SERVER_TARGET_OPTIONS: Array<{ id: ServerTargetChoice; label: string }> = [
  { id: 'nest', label: 'NestJS' },
  { id: 'express', label: 'Express' },
  { id: 'next', label: 'Next.js' },
  { id: 'nuxt', label: 'Nuxt' },
];

export const SERVER_STACK_OPTIONS: Array<{
  id: StackServerChoice;
  label: string;
  description?: string;
}> = [
  { id: 'none', label: 'None', description: 'UI components only — pick a server in export later' },
  { id: 'next', label: 'Next.js', description: 'React full-stack (Node.js)' },
  { id: 'nuxt', label: 'Nuxt', description: 'Vue full-stack (Node.js / Nitro)' },
  { id: 'nest', label: 'NestJS', description: 'TypeScript API framework (Node.js)' },
  { id: 'express', label: 'Express', description: 'Minimal Node.js HTTP server' },
];

export const DATABASE_TARGET_OPTIONS: Array<{ id: DatabaseTargetChoice; label: string }> = [
  { id: 'postgresql', label: 'PostgreSQL' },
  { id: 'mongodb', label: 'MongoDB' },
  { id: 'supabase', label: 'Supabase' },
  { id: 'mysql', label: 'MySQL' },
];

export const DATABASE_STACK_OPTIONS: Array<{
  id: StackDatabaseChoice;
  label: string;
  description?: string;
}> = [
  { id: 'none', label: 'None', description: 'Skip database export for now' },
  { id: 'postgresql', label: 'PostgreSQL' },
  { id: 'mongodb', label: 'MongoDB' },
  { id: 'supabase', label: 'Supabase' },
  { id: 'mysql', label: 'MySQL' },
];

export const STYLING_FRAMEWORK_OPTIONS: Array<{
  id: StylingFrameworkChoice;
  label: string;
  description: string;
}> = [
  {
    id: 'neutral',
    label: 'Neutral tokens',
    description: 'RosettaDash CSS variables and semantic classes (current default export)',
  },
  {
    id: 'tailwind',
    label: 'Tailwind CSS',
    description: 'Utility-first CSS shared across React, Vue, Svelte, and Angular',
  },
  {
    id: 'mui',
    label: 'MUI (Material UI)',
    description: 'Material Design component library for React',
  },
  {
    id: 'angular-material',
    label: 'Angular Material',
    description: 'Material Design components for Angular',
  },
  {
    id: 'vuetify',
    label: 'Vuetify',
    description: 'Material Design component library for Vue',
  },
  {
    id: 'plain-css',
    label: 'Plain CSS',
    description: 'Minimal custom stylesheet without a utility framework',
  },
  {
    id: 'plain-scss',
    label: 'Plain SCSS',
    description: 'SCSS variables and component styles (typical for Angular)',
  },
];

const STYLING_BY_UI: Record<UiFrameworkChoice, StylingFrameworkChoice[]> = {
  'web-components': ['neutral', 'tailwind'],
  react: ['neutral', 'tailwind', 'mui', 'plain-css'],
  angular: ['neutral', 'angular-material', 'tailwind', 'plain-scss'],
  vue: ['neutral', 'tailwind', 'vuetify', 'plain-css'],
  svelte: ['neutral', 'tailwind', 'plain-css'],
};

export const STYLING_FOUNDATION_OPTIONS: Array<{
  id: StylingFoundation;
  label: string;
  description: string;
}> = [
  {
    id: 'neutral-tokens',
    label: 'Neutral tokens',
    description: 'RosettaDash CSS variables and semantic classes',
  },
  {
    id: 'tailwind',
    label: 'Tailwind CSS',
    description: 'Utility-first CSS layer shared across frameworks',
  },
];

export const STYLING_COMPONENT_LIBRARY_OPTIONS: Array<{
  id: StylingComponentLibrary;
  label: string;
  description: string;
}> = [
  { id: 'mui', label: 'MUI (Material UI)', description: 'Material Design components for React' },
  {
    id: 'angular-material',
    label: 'Angular Material',
    description: 'Material Design components for Angular',
  },
  { id: 'vuetify', label: 'Vuetify', description: 'Material Design components for Vue' },
];

export const STYLING_AUTHORING_OPTIONS: Array<{
  id: StylingAuthoring;
  label: string;
  description: string;
}> = [
  {
    id: 'css-modules',
    label: 'CSS Modules',
    description: 'Scoped .module.css classes colocated with components',
  },
  {
    id: 'styled-components',
    label: 'styled-components',
    description: 'CSS-in-JS styled primitives (React)',
  },
  { id: 'plain-css', label: 'Plain CSS', description: 'Standard stylesheets without a preprocessor' },
  { id: 'plain-scss', label: 'Plain SCSS', description: 'SCSS variables and component styles' },
];

const STYLING_FOUNDATION_BY_UI: Record<UiFrameworkChoice, StylingFoundation[]> = {
  'web-components': ['neutral-tokens', 'tailwind'],
  react: ['neutral-tokens', 'tailwind'],
  angular: ['neutral-tokens', 'tailwind'],
  vue: ['neutral-tokens', 'tailwind'],
  svelte: ['neutral-tokens', 'tailwind'],
};

const STYLING_COMPONENT_LIBRARY_BY_UI: Record<UiFrameworkChoice, StylingComponentLibrary[]> = {
  'web-components': [],
  react: ['mui'],
  angular: ['angular-material'],
  vue: ['vuetify'],
  svelte: [],
};

const STYLING_AUTHORING_BY_UI: Record<UiFrameworkChoice, StylingAuthoring[]> = {
  'web-components': ['css-modules', 'plain-css'],
  react: ['css-modules', 'styled-components', 'plain-css'],
  angular: ['plain-scss', 'plain-css'],
  vue: ['css-modules', 'plain-css'],
  svelte: ['plain-css'],
};

const DEFAULT_STYLING_PROFILE_BY_UI: Record<UiFrameworkChoice, StackStylingProfile> = {
  'web-components': { foundation: ['neutral-tokens'], authoring: ['plain-css'], inlineStyles: true },
  react: { foundation: ['tailwind'], authoring: ['css-modules'], inlineStyles: true },
  angular: {
    foundation: ['neutral-tokens'],
    componentLibrary: 'angular-material',
    authoring: ['plain-scss'],
    inlineStyles: true,
  },
  vue: { foundation: ['tailwind'], authoring: ['css-modules'], inlineStyles: true },
  svelte: { foundation: ['tailwind'], authoring: ['plain-css'], inlineStyles: true },
};

const LEGACY_STYLING_TO_PROFILE: Record<StylingFrameworkChoice, StackStylingProfile> = {
  neutral: { foundation: ['neutral-tokens'], authoring: ['plain-css'], inlineStyles: true },
  tailwind: { foundation: ['tailwind'], authoring: ['css-modules'], inlineStyles: true },
  mui: {
    foundation: ['neutral-tokens'],
    componentLibrary: 'mui',
    authoring: ['css-modules'],
    inlineStyles: true,
  },
  'angular-material': {
    foundation: ['neutral-tokens'],
    componentLibrary: 'angular-material',
    authoring: ['plain-scss'],
    inlineStyles: true,
  },
  vuetify: {
    foundation: ['neutral-tokens'],
    componentLibrary: 'vuetify',
    authoring: ['css-modules'],
    inlineStyles: true,
  },
  'plain-css': { foundation: ['neutral-tokens'], authoring: ['plain-css'], inlineStyles: true },
  'plain-scss': { foundation: ['neutral-tokens'], authoring: ['plain-scss'], inlineStyles: true },
};

const DEFAULT_STYLING_BY_UI: Record<UiFrameworkChoice, StylingFrameworkChoice> = {
  'web-components': 'neutral',
  react: 'tailwind',
  angular: 'angular-material',
  vue: 'tailwind',
  svelte: 'tailwind',
};

/** Idiomatic default partners per UI framework. */
const UI_PARTNER_DEFAULTS: Record<
  Exclude<UiFrameworkChoice, 'web-components'>,
  { server: ServerTargetChoice; database: DatabaseTargetChoice; styling: StylingFrameworkChoice }
> = {
  react: { server: 'next', database: 'postgresql', styling: 'tailwind' },
  angular: { server: 'nest', database: 'postgresql', styling: 'angular-material' },
  vue: { server: 'nuxt', database: 'postgresql', styling: 'tailwind' },
  svelte: { server: 'nest', database: 'postgresql', styling: 'tailwind' },
};

const SERVER_BY_UI: Record<UiFrameworkChoice, StackServerChoice[]> = {
  'web-components': ['none', 'next', 'nuxt', 'nest', 'express'],
  react: ['none', 'next', 'nest', 'express'],
  vue: ['none', 'nuxt', 'nest', 'express'],
  angular: ['none', 'nest', 'express'],
  svelte: ['none', 'nest', 'express'],
};

const DATABASE_BY_UI: Record<UiFrameworkChoice, StackDatabaseChoice[]> = {
  'web-components': ['none', 'postgresql', 'mongodb', 'supabase', 'mysql'],
  react: ['none', 'postgresql', 'mongodb', 'supabase', 'mysql'],
  angular: ['none', 'postgresql', 'mongodb', 'supabase', 'mysql'],
  vue: ['none', 'postgresql', 'mongodb', 'supabase', 'mysql'],
  svelte: ['none', 'postgresql', 'mongodb', 'supabase', 'mysql'],
};

function isExportServerChoice(server: StackServerChoice | undefined): server is ServerTargetChoice {
  return !!server && server !== 'none';
}

function isExportDatabaseChoice(
  database: StackDatabaseChoice | undefined,
): database is DatabaseTargetChoice {
  return !!database && database !== 'none';
}

export function isServerCompatibleWithUi(
  ui: UiFrameworkChoice,
  server: StackServerChoice | undefined,
): boolean {
  if (isWebComponentsUi(ui) || server === undefined) {
    return true;
  }
  return SERVER_BY_UI[ui].includes(server);
}

export function isDatabaseCompatibleWithUi(
  ui: UiFrameworkChoice,
  database: StackDatabaseChoice | undefined,
): boolean {
  if (isWebComponentsUi(ui) || database === undefined) {
    return true;
  }
  return DATABASE_BY_UI[ui].includes(database);
}

export function getCompatibleServerStackOptions(
  ui: UiFrameworkChoice,
): Array<{ id: StackServerChoice; label: string; description?: string }> {
  const allowed = new Set(SERVER_BY_UI[ui]);
  return SERVER_STACK_OPTIONS.filter((option) => allowed.has(option.id));
}

export function getCompatibleDatabaseStackOptions(
  ui: UiFrameworkChoice,
): Array<{ id: StackDatabaseChoice; label: string; description?: string }> {
  const allowed = new Set(DATABASE_BY_UI[ui]);
  return DATABASE_STACK_OPTIONS.filter((option) => allowed.has(option.id));
}

export function resolveStackServerChoiceForUi(
  ui: UiFrameworkChoice,
  server: StackServerChoice | null | undefined,
): StackServerChoice {
  if (isWebComponentsUi(ui)) {
    if (server === 'none') {
      return 'none';
    }
    if (server && isServerCompatibleWithUi(ui, server)) {
      return server;
    }
    return 'none';
  }

  const partner = UI_PARTNER_DEFAULTS[ui].server;
  if (server === 'none') {
    return 'none';
  }
  if (server && isServerCompatibleWithUi(ui, server)) {
    return server;
  }
  return partner;
}

export function resolveStackDatabaseChoiceForUi(
  ui: UiFrameworkChoice,
  database: StackDatabaseChoice | null | undefined,
): StackDatabaseChoice {
  if (isWebComponentsUi(ui)) {
    if (database === 'none') {
      return 'none';
    }
    if (database && isDatabaseCompatibleWithUi(ui, database)) {
      return database;
    }
    return 'none';
  }

  const partner = UI_PARTNER_DEFAULTS[ui].database;
  if (database === 'none') {
    return 'none';
  }
  if (database && isDatabaseCompatibleWithUi(ui, database)) {
    return database;
  }
  return partner;
}

function normalizeStackServerChoice(
  ui: UiFrameworkChoice,
  server: StackServerChoice | undefined,
): StackServerChoice {
  if (isWebComponentsUi(ui)) {
    return resolveStackServerChoiceForUi('web-components', server ?? 'none');
  }
  return resolveStackServerChoiceForUi(ui, server ?? UI_PARTNER_DEFAULTS[ui].server);
}

function normalizeStackDatabaseChoice(
  ui: UiFrameworkChoice,
  database: StackDatabaseChoice | undefined,
): StackDatabaseChoice {
  if (isWebComponentsUi(ui)) {
    return resolveStackDatabaseChoiceForUi('web-components', database ?? 'none');
  }
  return resolveStackDatabaseChoiceForUi(ui, database ?? UI_PARTNER_DEFAULTS[ui].database);
}

export const DEFAULT_EXPORT_TARGETS: Required<ExportTargetConfig> = {
  ui: 'react',
  server: 'nest',
  database: 'postgresql',
};

export function getCompatibleStylingFoundations(
  ui: UiFrameworkChoice,
): Array<{ id: StylingFoundation; label: string; description: string }> {
  const allowed = new Set(STYLING_FOUNDATION_BY_UI[ui]);
  return STYLING_FOUNDATION_OPTIONS.filter((option) => allowed.has(option.id));
}

export function getCompatibleStylingComponentLibraries(
  ui: UiFrameworkChoice,
): Array<{ id: StylingComponentLibrary; label: string; description: string }> {
  const allowed = new Set(STYLING_COMPONENT_LIBRARY_BY_UI[ui]);
  return STYLING_COMPONENT_LIBRARY_OPTIONS.filter((option) => allowed.has(option.id));
}

export function getCompatibleStylingAuthoring(
  ui: UiFrameworkChoice,
): Array<{ id: StylingAuthoring; label: string; description: string }> {
  const allowed = new Set(STYLING_AUTHORING_BY_UI[ui]);
  return STYLING_AUTHORING_OPTIONS.filter((option) => allowed.has(option.id));
}

const STYLING_NONE_CHIP = {
  id: 'none' as const,
  label: 'None',
};

export type StylingFoundationStackChoice = StylingFoundation | 'none';
export type StylingAuthoringStackChoice = StylingAuthoring | 'none';
export type StylingComponentLibraryStackChoice = StylingComponentLibrary | 'none';

export function createEmptyStylingProfile(): StackStylingProfile {
  return { foundation: [], authoring: [], inlineStyles: false };
}

export function isEmptyStylingProfile(profile: StackStylingProfile): boolean {
  return (
    profile.foundation.length === 0 &&
    profile.authoring.length === 0 &&
    !profile.componentLibrary &&
    !profile.inlineStyles
  );
}

export function getStylingFoundationStackOptions(
  ui: UiFrameworkChoice,
): Array<{ id: StylingFoundationStackChoice; label: string; description: string }> {
  return [
    {
      ...STYLING_NONE_CHIP,
      description: 'No foundation layer — choose at export',
    },
    ...getCompatibleStylingFoundations(ui),
  ];
}

export function getStylingComponentLibraryStackOptions(
  ui: UiFrameworkChoice,
): Array<{ id: StylingComponentLibraryStackChoice; label: string; description: string }> {
  return [
    {
      ...STYLING_NONE_CHIP,
      description: 'No component library — use primitives or pick at export',
    },
    ...getCompatibleStylingComponentLibraries(ui),
  ];
}

export function getStylingAuthoringStackOptions(
  ui: UiFrameworkChoice,
): Array<{ id: StylingAuthoringStackChoice; label: string; description: string }> {
  return [
    {
      ...STYLING_NONE_CHIP,
      description: 'No authoring preference — choose at export',
    },
    ...getCompatibleStylingAuthoring(ui),
  ];
}

export function getDefaultStylingProfile(ui: UiFrameworkChoice): StackStylingProfile {
  return cloneStylingProfile(DEFAULT_STYLING_PROFILE_BY_UI[ui]);
}

export function getCompatibleStylingOptions(
  ui: UiFrameworkChoice,
): Array<{ id: StylingFrameworkChoice; label: string; description: string }> {
  const allowed = new Set(STYLING_BY_UI[ui]);
  return STYLING_FRAMEWORK_OPTIONS.filter((option) => allowed.has(option.id));
}

export function getDefaultStyling(ui: UiFrameworkChoice): StylingFrameworkChoice {
  return DEFAULT_STYLING_BY_UI[ui];
}

export function isStylingCompatible(
  ui: UiFrameworkChoice,
  styling: StylingFrameworkChoice,
): boolean {
  return STYLING_BY_UI[ui].includes(styling);
}

export function normalizeStackStyling(
  ui: UiFrameworkChoice,
  styling: StackStylingProfile | StylingFrameworkChoice | undefined,
): StackStylingProfile {
  const base =
    styling === undefined
      ? createEmptyStylingProfile()
      : typeof styling === 'string'
        ? cloneStylingProfile(LEGACY_STYLING_TO_PROFILE[styling])
        : cloneStylingProfile(styling);

  const foundation = base.foundation.filter((item) => STYLING_FOUNDATION_BY_UI[ui].includes(item));
  const authoring = base.authoring.filter((item) => STYLING_AUTHORING_BY_UI[ui].includes(item));
  const componentLibrary =
    base.componentLibrary && STYLING_COMPONENT_LIBRARY_BY_UI[ui].includes(base.componentLibrary)
      ? base.componentLibrary
      : undefined;

  return {
    foundation,
    authoring,
    ...(componentLibrary ? { componentLibrary } : {}),
    inlineStyles: base.inlineStyles ?? false,
  };
}

export function stylingProfilePrimaryFramework(profile: StackStylingProfile): StylingFrameworkChoice {
  if (profile.componentLibrary === 'mui') {
    return 'mui';
  }
  if (profile.componentLibrary === 'angular-material') {
    return 'angular-material';
  }
  if (profile.componentLibrary === 'vuetify') {
    return 'vuetify';
  }
  if (profile.foundation.includes('tailwind')) {
    return 'tailwind';
  }
  return 'neutral';
}

export function formatStylingProfileSummary(profile: StackStylingProfile): string {
  const parts: string[] = [];
  if (profile.foundation.length > 0) {
    parts.push(
      profile.foundation
        .map((item) => STYLING_FOUNDATION_OPTIONS.find((option) => option.id === item)?.label ?? item)
        .join(' + '),
    );
  }
  if (profile.componentLibrary) {
    parts.push(
      STYLING_COMPONENT_LIBRARY_OPTIONS.find((option) => option.id === profile.componentLibrary)?.label ??
        profile.componentLibrary,
    );
  }
  if (profile.authoring.length > 0) {
    parts.push(
      profile.authoring
        .map((item) => STYLING_AUTHORING_OPTIONS.find((option) => option.id === item)?.label ?? item)
        .join(' + '),
    );
  }
  if (profile.inlineStyles) {
    parts.push('inline styles');
  }
  return parts.join(' · ');
}

function cloneStylingProfile(profile: StackStylingProfile): StackStylingProfile {
  return {
    foundation: [...profile.foundation],
    authoring: [...profile.authoring],
    inlineStyles: profile.inlineStyles,
    ...(profile.componentLibrary ? { componentLibrary: profile.componentLibrary } : {}),
  };
}

export function normalizeStyling(
  ui: UiFrameworkChoice,
  styling: StylingFrameworkChoice | undefined,
): StylingFrameworkChoice {
  if (styling && isStylingCompatible(ui, styling)) {
    return styling;
  }

  return getDefaultStyling(ui);
}

export function resolveEffectiveStylingProfile(
  projectProfile: StackProfile | undefined,
  uiTarget: NonNullable<ExportTargetConfig['ui']>,
): StackStylingProfile {
  const normalized = normalizeStackProfile(projectProfile);
  if (!normalized?.styling) {
    return getDefaultStylingProfile(uiTarget);
  }

  if (isFrameworkBasedUi(normalized.ui) && normalized.ui !== uiTarget) {
    return getDefaultStylingProfile(uiTarget);
  }

  const styling = normalizeStackStyling(uiTarget, normalized.styling);
  return isEmptyStylingProfile(styling) ? getDefaultStylingProfile(uiTarget) : styling;
}

export function getCompatibleStackDefaults(ui: UiFrameworkChoice): StackProfile {
  if (isWebComponentsUi(ui)) {
    return {
      ui: 'web-components',
      server: 'none',
      database: 'none',
      styling: createEmptyStylingProfile(),
    };
  }

  const partners = UI_PARTNER_DEFAULTS[ui];
  return {
    ui,
    server: partners.server,
    database: partners.database,
    styling: createEmptyStylingProfile(),
  };
}

export function stackProfileToExportTargets(profile: StackProfile): ExportTargetConfig | undefined {
  if (isWebComponentsUi(profile.ui)) {
    const targets: ExportTargetConfig = { ui: 'web-components' };
    if (isExportServerChoice(profile.server)) {
      targets.server = profile.server;
    }
    if (isExportDatabaseChoice(profile.database)) {
      targets.database = profile.database;
    }
    return targets;
  }

  const targets: ExportTargetConfig = { ui: profile.ui };

  if (isExportServerChoice(profile.server)) {
    targets.server = profile.server;
  } else if (profile.server === undefined) {
    targets.server = UI_PARTNER_DEFAULTS[profile.ui].server;
  }

  if (isExportDatabaseChoice(profile.database)) {
    targets.database = profile.database;
  } else if (profile.database === undefined) {
    targets.database = UI_PARTNER_DEFAULTS[profile.ui].database;
  }

  return targets;
}

export function normalizeStackProfile(profile: StackProfile | undefined): StackProfile | undefined {
  if (!profile) {
    return undefined;
  }

  const ui = normalizeUiFrameworkChoice(profile.ui as string);
  const styling = normalizeStackStyling(ui, profile.styling);

  if (isWebComponentsUi(ui)) {
    return {
      ui: 'web-components',
      server: normalizeStackServerChoice('web-components', profile.server),
      database: normalizeStackDatabaseChoice('web-components', profile.database),
      styling,
    };
  }

  const defaults = getCompatibleStackDefaults(ui);
  return {
    ui,
    server: normalizeStackServerChoice(ui, profile.server ?? defaults.server),
    database: normalizeStackDatabaseChoice(ui, profile.database ?? defaults.database),
    styling,
  };
}

export type ResolvedExportTargets = {
  ui: NonNullable<ExportTargetConfig['ui']>;
  server?: ExportTargetConfig['server'];
  database?: ExportTargetConfig['database'];
};

function withOptionalInfra(
  ui: NonNullable<ExportTargetConfig['ui']>,
  server?: ExportTargetConfig['server'],
  database?: ExportTargetConfig['database'],
): ResolvedExportTargets {
  return {
    ui,
    ...(server ? { server } : {}),
    ...(database ? { database } : {}),
  };
}

export function resolveEffectiveExportTargets(
  compositeTargets: ExportTargetConfig | undefined,
  projectProfile: StackProfile | undefined,
): ResolvedExportTargets {
  if (compositeTargets?.ui) {
    return withOptionalInfra(compositeTargets.ui, compositeTargets.server, compositeTargets.database);
  }

  const fromProfile = stackProfileToExportTargets(
    normalizeStackProfile(projectProfile) ?? { ui: 'web-components' },
  );
  if (fromProfile?.ui) {
    return withOptionalInfra(fromProfile.ui, fromProfile.server, fromProfile.database);
  }

  return { ui: DEFAULT_EXPORT_TARGETS.ui };
}

export function resolveEffectiveStyling(
  projectProfile: StackProfile | undefined,
  uiTarget: NonNullable<ExportTargetConfig['ui']>,
): StylingFrameworkChoice {
  return stylingProfilePrimaryFramework(resolveEffectiveStylingProfile(projectProfile, uiTarget));
}

export function stylingFrameworkLabel(styling: StylingFrameworkChoice): string {
  return STYLING_FRAMEWORK_OPTIONS.find((option) => option.id === styling)?.label ?? styling;
}

export function serverStackLabel(server: StackServerChoice | undefined): string {
  return SERVER_STACK_OPTIONS.find((option) => option.id === server)?.label ?? server ?? 'None';
}

export function databaseStackLabel(database: StackDatabaseChoice | undefined): string {
  return DATABASE_STACK_OPTIONS.find((option) => option.id === database)?.label ?? database ?? 'None';
}

export function isWebComponentsStack(profile: StackProfile | undefined): boolean {
  if (!profile) {
    return true;
  }
  return isWebComponentsUi(normalizeUiFrameworkChoice(profile.ui as string));
}
