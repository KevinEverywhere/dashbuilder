/** Live Storybook meta composition — dashboard or complex recipe layout. */
export interface MetaCompositionSection {
  title: string;
  /** Palette taxonomy types and/or npm atom ids rendered in this section. */
  items: string[];
  layout?: 'grid' | 'split' | 'stack' | 'gallery';
}

export interface MetaCompositionDefinition {
  id: string;
  title: string;
  summary: string;
  /** Builder palette types covered by this composition. */
  componentTypes: string[];
  sections: MetaCompositionSection[];
}

/** Shipped npm atoms included in compositions (not in builder palette rows). */
export const NPM_ATOM_IDS = [
  'npm.rd-accordion',
  'npm.rd-link-list',
  'npm.rd-accordion-link-list',
] as const;

/** All palette taxonomy types (~50). */
export const ALL_PALETTE_TYPES = [
  'visual.input.text',
  'visual.input.select',
  'visual.input.number',
  'visual.input.checkbox',
  'visual.input.textarea',
  'visual.input.date-range',
  'domain.time-preset',
  'visual.table',
  'visual.detail',
  'visual.kpi',
  'visual.skeleton',
  'logic.timer',
  'visual.chart.line',
  'visual.chart.bar',
  'visual.chart.pie',
  'layout.grid',
  'layout.flex',
  'layout.tabs',
  'layout.modal',
  'layout.collapsible',
  'domain.role-gate',
  'domain.person-invite',
  'domain.role-assign',
  'infra.env',
  'infra.postgresql',
  'infra.mongodb',
  'infra.supabase',
  'infra.mysql',
  'infra.server.nest',
  'infra.server.express',
  'infra.server.next',
  'infra.server.nuxt',
  'visual.news.language-select',
  'visual.news.region-select',
  'visual.news.type-select',
  'visual.news.search-box',
  'visual.news.results-table',
  'visual.news.article-detail',
  'visual.plugin.status-badge',
  'visual.plugin.metric-chip',
  'visual.display.3d-bar-chart',
  'visual.display.3d-scatter',
  'visual.display.3d-scene',
  'visual.display.3d-gltf-model',
  'visual.display.3d-geo-globe',
  'visual.svg.inline',
  'visual.svg.icon',
  'visual.media.video-source',
  'visual.media.equirect-viewport',
  'visual.media.equirect-sphere-viewport',
  'visual.media.flat-video-viewport',
  'visual.media.live-capture',
  'infra.wasm.asset',
  'visual.wasm.worker-host',
  'visual.wasm.module',
  'visual.wasm.media',
] as const;

export const META_COMPOSITIONS: MetaCompositionDefinition[] = [
  {
    id: 'operations-kpi',
    title: 'Operations KPI dashboard',
    summary:
      'Monitoring at a glance — time filters drive KPIs, line trend, and a drill-down table with detail panel.',
    componentTypes: [
      'domain.time-preset',
      'visual.input.date-range',
      'visual.kpi',
      'visual.chart.line',
      'visual.table',
      'visual.detail',
      'visual.skeleton',
      'logic.timer',
      'visual.plugin.status-badge',
    ],
    sections: [
      {
        title: 'Filters & status',
        layout: 'grid',
        items: ['domain.time-preset', 'visual.input.date-range', 'visual.plugin.status-badge'],
      },
      {
        title: 'Metrics & trend',
        layout: 'split',
        items: ['visual.kpi', 'visual.chart.line', 'logic.timer'],
      },
      {
        title: 'Incidents table → detail',
        layout: 'split',
        items: ['visual.table', 'visual.detail'],
      },
      {
        title: 'Loading state',
        layout: 'stack',
        items: ['visual.skeleton'],
      },
    ],
  },
  {
    id: 'analytics-reporting',
    title: 'Analytics & reporting dashboard',
    summary:
      'BI-style layout — date range, tabbed regions, collapsible filters, charts, and row drill-down.',
    componentTypes: [
      'visual.input.date-range',
      'layout.tabs',
      'layout.collapsible',
      'visual.chart.bar',
      'visual.chart.line',
      'visual.chart.pie',
      'visual.table',
      'visual.detail',
      'visual.plugin.metric-chip',
    ],
    sections: [
      {
        title: 'Global filters',
        layout: 'grid',
        items: ['visual.input.date-range', 'layout.collapsible', 'visual.plugin.metric-chip'],
      },
      {
        title: 'Tabbed analytics',
        layout: 'stack',
        items: ['layout.tabs'],
      },
      {
        title: 'Charts',
        layout: 'grid',
        items: ['visual.chart.bar', 'visual.chart.line', 'visual.chart.pie'],
      },
      {
        title: 'Breakdown table → detail',
        layout: 'split',
        items: ['visual.table', 'visual.detail'],
      },
    ],
  },
  {
    id: 'admin-settings',
    title: 'Admin & settings dashboard',
    summary:
      'Form-heavy configuration with role gates, invites, and modal confirmation — typical settings page.',
    componentTypes: [
      'visual.input.text',
      'visual.input.select',
      'visual.input.number',
      'visual.input.checkbox',
      'visual.input.textarea',
      'domain.role-gate',
      'domain.person-invite',
      'domain.role-assign',
      'layout.grid',
      'layout.flex',
      'layout.modal',
    ],
    sections: [
      {
        title: 'Profile & preferences',
        layout: 'grid',
        items: [
          'visual.input.text',
          'visual.input.select',
          'visual.input.number',
          'visual.input.checkbox',
          'visual.input.textarea',
        ],
      },
      {
        title: 'Access control',
        layout: 'grid',
        items: ['domain.role-gate', 'domain.person-invite', 'domain.role-assign'],
      },
      {
        title: 'Layout shell',
        layout: 'stack',
        items: ['layout.grid', 'layout.flex', 'layout.modal'],
      },
    ],
  },
  {
    id: 'news-discovery',
    title: 'News discovery flow',
    summary: 'End-to-end news search — language/region/type filters, search box, results, article detail.',
    componentTypes: [
      'visual.news.language-select',
      'visual.news.region-select',
      'visual.news.type-select',
      'visual.news.search-box',
      'visual.news.results-table',
      'visual.news.article-detail',
    ],
    sections: [
      {
        title: 'Discovery filters',
        layout: 'grid',
        items: [
          'visual.news.language-select',
          'visual.news.region-select',
          'visual.news.type-select',
          'visual.news.search-box',
        ],
      },
      {
        title: 'Results → article',
        layout: 'split',
        items: ['visual.news.results-table', 'visual.news.article-detail'],
      },
    ],
  },
  {
    id: 'media-authoring',
    title: 'Media authoring pipeline',
    summary:
      '360° authoring — program source, sphere/flat viewports, live capture stub, and browser WASM extract.',
    componentTypes: [
      'visual.media.video-source',
      'visual.media.equirect-sphere-viewport',
      'visual.media.flat-video-viewport',
      'visual.media.equirect-viewport',
      'visual.media.live-capture',
      'visual.wasm.media',
    ],
    sections: [
      {
        title: 'Capture & crop',
        layout: 'grid',
        items: [
          'visual.media.video-source',
          'visual.media.equirect-sphere-viewport',
          'visual.media.flat-video-viewport',
          'visual.media.live-capture',
        ],
      },
      {
        title: 'Metadata & extract',
        layout: 'stack',
        items: ['visual.media.equirect-viewport', 'visual.wasm.media'],
      },
    ],
  },
  {
    id: 'wasm-compute-lab',
    title: 'WASM compute lab',
    summary:
      'Asset bundle, worker host, module entry, and media transcode — scroll down for live Rust WASM, Node React authoring, and preview frame.',
    componentTypes: [
      'infra.wasm.asset',
      'visual.wasm.worker-host',
      'visual.wasm.module',
      'visual.wasm.media',
    ],
    sections: [
      {
        title: 'WASM stack',
        layout: 'grid',
        items: ['infra.wasm.asset', 'visual.wasm.worker-host', 'visual.wasm.module', 'visual.wasm.media'],
      },
    ],
  },
  {
    id: 'vr-3d-gallery',
    title: 'VR & 3D gallery',
    summary: 'All Three.js palette visuals plus inline SVG assets in one immersive review page.',
    componentTypes: [
      'visual.display.3d-bar-chart',
      'visual.display.3d-scatter',
      'visual.display.3d-scene',
      'visual.display.3d-gltf-model',
      'visual.display.3d-geo-globe',
      'visual.svg.inline',
      'visual.svg.icon',
    ],
    sections: [
      {
        title: '3D hosts',
        layout: 'gallery',
        items: [
          'visual.display.3d-bar-chart',
          'visual.display.3d-scatter',
          'visual.display.3d-scene',
          'visual.display.3d-gltf-model',
          'visual.display.3d-geo-globe',
        ],
      },
      {
        title: 'SVG assets',
        layout: 'grid',
        items: ['visual.svg.inline', 'visual.svg.icon'],
      },
    ],
  },
  {
    id: 'data-platform',
    title: 'Data platform panel',
    summary: 'Environment secrets plus database and API server targets — export wizard context.',
    componentTypes: [
      'infra.env',
      'infra.postgresql',
      'infra.mongodb',
      'infra.supabase',
      'infra.mysql',
      'infra.server.nest',
      'infra.server.express',
      'infra.server.next',
      'infra.server.nuxt',
    ],
    sections: [
      {
        title: 'Environment',
        layout: 'stack',
        items: ['infra.env'],
      },
      {
        title: 'Databases',
        layout: 'grid',
        items: ['infra.postgresql', 'infra.mongodb', 'infra.supabase', 'infra.mysql'],
      },
      {
        title: 'API servers',
        layout: 'grid',
        items: ['infra.server.nest', 'infra.server.express', 'infra.server.next', 'infra.server.nuxt'],
      },
    ],
  },
  {
    id: 'navigation-shell',
    title: 'Navigation & layout shell',
    summary:
      'Sidebar TOC, external links, and layout primitives — shipped npm accordion/link-list recipes in context.',
    componentTypes: ['layout.grid', 'layout.flex', 'layout.collapsible'],
    sections: [
      {
        title: 'NPM navigation recipes',
        layout: 'split',
        items: ['npm.rd-accordion-link-list', 'npm.rd-link-list'],
      },
      {
        title: 'Accordion + slots',
        layout: 'stack',
        items: ['npm.rd-accordion'],
      },
      {
        title: 'Layout primitives',
        layout: 'grid',
        items: ['layout.grid', 'layout.flex', 'layout.collapsible'],
      },
    ],
  },
];

/** Union of all types covered by meta compositions (palette + npm). */
export function allCoveredTypes(): Set<string> {
  const covered = new Set<string>();
  for (const composition of META_COMPOSITIONS) {
    for (const type of composition.componentTypes) {
      covered.add(type);
    }
    for (const section of composition.sections) {
      for (const item of section.items) {
        covered.add(item);
      }
    }
  }
  return covered;
}

/** Types not yet assigned to any meta composition. */
export function uncoveredPaletteTypes(): string[] {
  const covered = allCoveredTypes();
  return ALL_PALETTE_TYPES.filter((type) => !covered.has(type));
}
