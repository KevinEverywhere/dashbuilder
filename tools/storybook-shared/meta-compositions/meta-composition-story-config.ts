import type { PlayFunction } from '@storybook/web-components-vite';
import { expect, userEvent, waitFor } from 'storybook/test';

/** Per-component demo overrides keyed by palette/npm type id. */
export type MetaCompositionDemoOverrides = Record<string, Record<string, unknown>>;

export interface MetaCompositionStoryConfig {
  args: Record<string, unknown>;
  argTypes: Record<string, unknown>;
  demoOverrides: (args: Record<string, unknown>) => MetaCompositionDemoOverrides;
  play?: PlayFunction;
}

export const OPERATIONS_KPI_STORY: MetaCompositionStoryConfig = {
  args: {
    kpiTitle: 'Monthly revenue',
    kpiValue: '$128,420',
    kpiDelta: '+12.4%',
    lineChartTitle: 'Sessions over time',
    statusBadgeLabel: 'Active',
    timerIntervalMs: 1200,
  },
  argTypes: {
    kpiTitle: { control: 'text', name: 'KPI title', table: { category: 'Metrics' } },
    kpiValue: { control: 'text', name: 'KPI value', table: { category: 'Metrics' } },
    kpiDelta: { control: 'text', name: 'KPI delta', table: { category: 'Metrics' } },
    lineChartTitle: { control: 'text', name: 'Line chart title', table: { category: 'Metrics' } },
    statusBadgeLabel: { control: 'text', name: 'Status badge', table: { category: 'Filters' } },
    timerIntervalMs: {
      control: { type: 'number', min: 400, max: 5000, step: 100 },
      name: 'Timer interval (ms)',
      table: { category: 'Metrics' },
    },
  },
  demoOverrides: (args) => ({
    'visual.kpi': {
      title: args.kpiTitle,
      value: args.kpiValue,
      delta: args.kpiDelta,
    },
    'visual.chart.line': { chartTitle: args.lineChartTitle },
    'visual.plugin.status-badge': { statusText: args.statusBadgeLabel },
    'logic.timer': { intervalMs: args.timerIntervalMs },
  }),
  play: async ({ canvasElement }) => {
    const presetButtons = canvasElement.querySelectorAll('[data-catalog-time-preset] [data-preset]');
    const inactivePreset = [...presetButtons].find(
      (button) => !button.classList.contains('preview-time-preset__button--active'),
    );
    if (inactivePreset) {
      await userEvent.click(inactivePreset as HTMLElement);
      await waitFor(() => {
        expect(inactivePreset.classList.contains('preview-time-preset__button--active')).toBe(true);
      });
    }

    const row = canvasElement.querySelector('[data-catalog-table] [data-row-id]');
    const detail = canvasElement.querySelector('[data-catalog-detail]');
    if (!row || !detail) {
      throw new Error('Operations KPI table/detail demo not found');
    }

    await userEvent.click(row as HTMLElement);
    await waitFor(() => {
      const fields = detail.querySelector('.preview-detail__fields');
      expect(fields).toBeTruthy();
      expect(fields?.textContent).toContain('Acme Corp');
      expect(fields?.textContent?.toLowerCase()).toContain('status');
    });
  },
};

export const ANALYTICS_REPORTING_STORY: MetaCompositionStoryConfig = {
  args: {
    barChartTitle: 'Signups by day',
    lineChartTitle: 'Sessions over time',
    pieChartTitle: 'Traffic mix',
    metricChipLabel: 'Latency',
    metricChipValue: '42ms',
    collapsibleTitle: 'Advanced filters',
  },
  argTypes: {
    barChartTitle: { control: 'text', table: { category: 'Charts' } },
    lineChartTitle: { control: 'text', table: { category: 'Charts' } },
    pieChartTitle: { control: 'text', table: { category: 'Charts' } },
    metricChipLabel: { control: 'text', table: { category: 'Filters' } },
    metricChipValue: { control: 'text', table: { category: 'Filters' } },
    collapsibleTitle: { control: 'text', table: { category: 'Filters' } },
  },
  demoOverrides: (args) => ({
    'visual.chart.bar': { chartTitle: args.barChartTitle },
    'visual.chart.line': { chartTitle: args.lineChartTitle },
    'visual.chart.pie': { chartTitle: args.pieChartTitle },
    'visual.plugin.metric-chip': { chipLabel: args.metricChipLabel, chipValue: args.metricChipValue },
    'layout.collapsible': { title: args.collapsibleTitle },
  }),
  play: async ({ canvasElement }) => {
    const collapsible = canvasElement.querySelector('[data-catalog-collapsible] .preview-collapsible__header');
    if (collapsible) {
      await userEvent.click(collapsible as HTMLElement);
      await waitFor(() => {
        expect(collapsible.getAttribute('aria-expanded')).toBe('true');
      });
    }

    const metricsTab = canvasElement.querySelector('[data-catalog-tabs] [data-tab="1"]');
    if (metricsTab) {
      await userEvent.click(metricsTab as HTMLElement);
      await waitFor(() => {
        expect(metricsTab.classList.contains('preview-tabs__tab--active')).toBe(true);
      });
    }

    const row = canvasElement.querySelector('[data-catalog-table] [data-row-id]');
    const detail = canvasElement.querySelector('[data-catalog-detail]');
    if (!row || !detail) {
      throw new Error('Analytics table/detail demo not found');
    }
    await userEvent.click(row as HTMLElement);
    await waitFor(() => {
      expect(detail.querySelector('.preview-detail__fields')).toBeTruthy();
      expect(detail.textContent).toContain('Acme Corp');
    });
  },
};

export const ADMIN_SETTINGS_STORY: MetaCompositionStoryConfig = {
  args: {
    profilePlaceholder: 'Customer name',
    inviteEmailPlaceholder: 'name@company.com',
    roleGateStatus: 'Visible',
    modalTitle: 'Confirm export',
    modalBody: 'Export 12 composites to NestJS + PostgreSQL?',
    modalConfirmLabel: 'Confirm',
  },
  argTypes: {
    profilePlaceholder: { control: 'text', table: { category: 'Profile' } },
    inviteEmailPlaceholder: { control: 'text', table: { category: 'Access' } },
    roleGateStatus: { control: 'text', table: { category: 'Access' } },
    modalTitle: { control: 'text', table: { category: 'Modal' } },
    modalBody: { control: 'text', table: { category: 'Modal' } },
    modalConfirmLabel: { control: 'text', table: { category: 'Modal' } },
  },
  demoOverrides: (args) => ({
    'visual.input.text': { placeholder: args.profilePlaceholder },
    'domain.person-invite': { emailPlaceholder: args.inviteEmailPlaceholder },
    'domain.role-gate': { statusText: args.roleGateStatus },
    'layout.modal': {
      modalTitle: args.modalTitle,
      modalBody: args.modalBody,
      confirmLabel: args.modalConfirmLabel,
    },
  }),
  play: async ({ canvasElement }) => {
    const profileInput = canvasElement.querySelector('.preview-input[type="text"]');
    if (profileInput) {
      await userEvent.clear(profileInput as HTMLElement);
      await userEvent.type(profileInput as HTMLElement, 'Acme Ops');
      await waitFor(() => {
        expect((profileInput as HTMLInputElement).value).toBe('Acme Ops');
      });
    }

    const inviteButton = canvasElement.querySelector('.preview-onboarding__button');
    if (inviteButton) {
      await userEvent.click(inviteButton as HTMLElement);
    }

    const confirmButton = canvasElement.querySelector('.preview-modal__dialog .preview-onboarding__button');
    if (confirmButton) {
      await userEvent.click(confirmButton as HTMLElement);
    }
  },
};

export const MEDIA_AUTHORING_STORY: MetaCompositionStoryConfig = {
  args: {
    equirectLabel: 'Crop metadata',
    equirectYaw: 25,
    equirectPitch: -8,
    equirectFov: 75,
    videoLabel: 'Program source',
    flatCropX: 320,
    flatCropY: 180,
  },
  argTypes: {
    videoLabel: { control: 'text', name: 'Video source label', table: { category: 'Capture' } },
    equirectLabel: { control: 'text', name: 'Metadata viewport label', table: { category: 'Capture' } },
    equirectYaw: {
      control: { type: 'number', min: -180, max: 180, step: 1 },
      name: 'Sphere yaw (°)',
      table: { category: 'Capture' },
    },
    equirectPitch: {
      control: { type: 'number', min: -90, max: 90, step: 1 },
      name: 'Sphere pitch (°)',
      table: { category: 'Capture' },
    },
    equirectFov: {
      control: { type: 'number', min: 30, max: 120, step: 1 },
      name: 'Sphere horizontal FOV (°)',
      table: { category: 'Capture' },
    },
    flatCropX: {
      control: { type: 'number', min: 0, max: 960, step: 8 },
      name: 'Flat crop X',
      table: { category: 'Capture' },
    },
    flatCropY: {
      control: { type: 'number', min: 0, max: 540, step: 8 },
      name: 'Flat crop Y',
      table: { category: 'Capture' },
    },
  },
  demoOverrides: (args) => ({
    'visual.media.video-source': { label: args.videoLabel },
    'visual.media.equirect-viewport': {
      label: args.equirectLabel,
      yaw: args.equirectYaw,
      pitch: args.equirectPitch,
      horizontalFov: args.equirectFov,
    },
    'visual.media.equirect-sphere-viewport': {
      yaw: args.equirectYaw,
      pitch: args.equirectPitch,
      horizontalFov: args.equirectFov,
    },
    'visual.media.flat-video-viewport': {
      cropX: args.flatCropX,
      cropY: args.flatCropY,
    },
  }),
  play: async ({ canvasElement }) => {
    const sphere = canvasElement.querySelector('rd-equirect-sphere-viewport');
    if (sphere) {
      await customElements.whenDefined('rd-equirect-sphere-viewport');
      await waitFor(() => {
        expect(sphere.getAttribute('yaw')).toBeTruthy();
      });
      return;
    }
    const viewport = canvasElement.querySelector('rd-equirect-viewport');
    if (!viewport) {
      return;
    }
    await customElements.whenDefined('rd-equirect-viewport');
    await waitFor(() => {
      expect(viewport.getAttribute('yaw')).toBeTruthy();
    });
  },
};

export const NEWS_DISCOVERY_STORY: MetaCompositionStoryConfig = {
  args: {
    searchPlaceholder: 'Search headlines…',
    resultsTableTitle: 'News results',
  },
  argTypes: {
    searchPlaceholder: { control: 'text', table: { category: 'Discovery' } },
    resultsTableTitle: { control: 'text', table: { category: 'Results' } },
  },
  demoOverrides: (args) => ({
    'visual.news.search-box': { placeholder: args.searchPlaceholder },
    'visual.news.results-table': { tableTitle: args.resultsTableTitle },
  }),
  play: async ({ canvasElement }) => {
    const row = canvasElement.querySelector('[data-catalog-news-table] [data-news-id]');
    const detail = canvasElement.querySelector('[data-catalog-news-detail]');
    if (!row || !detail) {
      throw new Error('News discovery table/detail demo not found');
    }
    await userEvent.click(row as HTMLElement);
    await waitFor(() => {
      expect(detail.querySelector('.preview-detail__fields')).toBeTruthy();
      expect(detail.textContent).not.toContain('Select a headline');
    });
  },
};

export const WASM_COMPUTE_LAB_STORY: MetaCompositionStoryConfig = {
  args: {
    wasmAssetPath: 'wasm/modules/example.wasm',
    workerLabel: 'dash-wasm-worker',
    workerStatus: 'Worker idle',
    moduleLabel: 'WASM Module',
    wasmMediaLabel: 'Equirect extract',
  },
  argTypes: {
    wasmAssetPath: { control: 'text', table: { category: 'WASM stack' } },
    workerLabel: { control: 'text', table: { category: 'WASM stack' } },
    workerStatus: { control: 'text', table: { category: 'WASM stack' } },
    moduleLabel: { control: 'text', table: { category: 'WASM stack' } },
    wasmMediaLabel: { control: 'text', table: { category: 'WASM stack' } },
  },
  demoOverrides: (args) => ({
    'infra.wasm.asset': { assetPath: args.wasmAssetPath },
    'visual.wasm.worker-host': { workerLabel: args.workerLabel, workerStatus: args.workerStatus },
    'visual.wasm.module': { moduleLabel: args.moduleLabel },
    'visual.wasm.media': { label: args.wasmMediaLabel },
  }),
  play: async ({ canvasElement }) => {
    const rustRun = canvasElement.querySelector('.rd-wasm-lab__run');
    const rustOut = canvasElement.querySelector('.rd-wasm-lab__rust-out');
    if (!rustRun || !rustOut) {
      throw new Error('WASM compute lab sandbox not found');
    }
    await userEvent.click(rustRun as HTMLElement);
    await waitFor(() => {
      expect(rustOut.textContent).toContain('42');
    });
  },
};

export const VR_3D_GALLERY_STORY: MetaCompositionStoryConfig = {
  args: {
    barChartTitle: '3D Bar Chart',
    globeTitle: 'Geo Globe',
    sceneTitle: '3D Scene',
  },
  argTypes: {
    barChartTitle: { control: 'text', table: { category: '3D hosts' } },
    globeTitle: { control: 'text', table: { category: '3D hosts' } },
    sceneTitle: { control: 'text', table: { category: '3D hosts' } },
  },
  demoOverrides: (args) => ({
    'visual.display.3d-bar-chart': { threeTitle: args.barChartTitle },
    'visual.display.3d-geo-globe': { threeTitle: args.globeTitle },
    'visual.display.3d-scene': { threeTitle: args.sceneTitle },
  }),
  play: async ({ canvasElement }) => {
    await waitFor(
      () => {
        const host = canvasElement.querySelector('.preview-three-host');
        expect(host?.querySelector('canvas')).toBeTruthy();
      },
      { timeout: 8000 },
    );
  },
};

export const DATA_PLATFORM_STORY: MetaCompositionStoryConfig = {
  args: {
    envKeys: 'DATABASE_URL, API_KEY, FEATURE_FLAGS',
    postgresTable: 'analytics_events',
    nestGlobalPrefix: 'api',
  },
  argTypes: {
    envKeys: { control: 'text', table: { category: 'Environment' } },
    postgresTable: { control: 'text', table: { category: 'Databases' } },
    nestGlobalPrefix: { control: 'text', table: { category: 'API servers' } },
  },
  demoOverrides: (args) => ({
    'infra.env': { envKeys: args.envKeys },
    'infra.postgresql': { tableName: args.postgresTable },
    'infra.server.nest': { globalPrefix: args.nestGlobalPrefix },
  }),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('.preview-infra')).toBeTruthy();
      expect(canvasElement.textContent).toContain('DATABASE_URL');
    });
  },
};

export const NAVIGATION_SHELL_STORY: MetaCompositionStoryConfig = {
  args: {
    tocHeading: 'On this page',
    accordionHeading: 'Resources',
  },
  argTypes: {
    tocHeading: { control: 'text', table: { category: 'Navigation' } },
    accordionHeading: { control: 'text', table: { category: 'Navigation' } },
  },
  demoOverrides: (args) => ({
    'npm.rd-accordion-link-list': { heading: args.tocHeading },
    'npm.rd-accordion': { heading: args.accordionHeading },
  }),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      expect(canvasElement.querySelector('rd-accordion-link-list')).toBeTruthy();
      expect(canvasElement.querySelector('rd-link-list')).toBeTruthy();
      expect(canvasElement.querySelector('rd-accordion')).toBeTruthy();
    });
  },
};

const EMPTY_CONFIG: MetaCompositionStoryConfig = {
  args: {},
  argTypes: {},
  demoOverrides: () => ({}),
};

export const META_COMPOSITION_STORY_CONFIG: Record<string, MetaCompositionStoryConfig> = {
  'operations-kpi': OPERATIONS_KPI_STORY,
  'analytics-reporting': ANALYTICS_REPORTING_STORY,
  'admin-settings': ADMIN_SETTINGS_STORY,
  'news-discovery': NEWS_DISCOVERY_STORY,
  'media-authoring': MEDIA_AUTHORING_STORY,
  'wasm-compute-lab': WASM_COMPUTE_LAB_STORY,
  'vr-3d-gallery': VR_3D_GALLERY_STORY,
  'data-platform': DATA_PLATFORM_STORY,
  'navigation-shell': NAVIGATION_SHELL_STORY,
};

export function metaCompositionStoryConfig(compositionId: string): MetaCompositionStoryConfig {
  return META_COMPOSITION_STORY_CONFIG[compositionId] ?? EMPTY_CONFIG;
}
