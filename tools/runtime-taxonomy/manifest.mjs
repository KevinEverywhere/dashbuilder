/**
 * Runtime taxonomy manifest — single source of truth for DAS-116+ framework exports.
 * Import path rule: type dots → slashes, with explicit overrides below.
 */

/** @typedef {'native' | 'ce-host' | 'manual'} RuntimePattern */

/**
 * @typedef {object} RuntimeAtomEntry
 * @property {string} type
 * @property {string} subpath
 * @property {string} exportName
 * @property {RuntimePattern} pattern
 * @property {string} [kind] — template id for native generation
 * @property {string} [testId]
 * @property {string} [wcImport] — @rosettadash/web-components subpath for ce-host
 */

/** Map taxonomy type to BEM root block (matches WC `taxonomyToRdTag`). */
export function taxonomyTypeToBemBlock(type) {
  const stripped = type.replace(/^(visual|domain|layout|logic|infra)\./, '');
  return `rd-${stripped.replace(/\./g, '-')}`;
}

export function getEntryBemBlock(entry) {
  if (entry.type.startsWith('npm.')) {
    return entry.testId ?? `rd-${entry.subpath.split('/').pop()}`;
  }
  return taxonomyTypeToBemBlock(entry.type);
}

/** NPM recipe atoms (not palette rows). */
export const NPM_RECIPE_ENTRIES = [
  {
    type: 'npm.rd-link-list',
    subpath: 'visual/link-list',
    exportName: 'LinkList',
    pattern: 'manual',
    testId: 'rd-link-list',
  },
  {
    type: 'npm.rd-accordion',
    subpath: 'layout/accordion',
    exportName: 'Accordion',
    pattern: 'manual',
    testId: 'rd-accordion',
  },
  {
    type: 'npm.rd-accordion-link-list',
    subpath: 'layout/accordion-link-list',
    exportName: 'AccordionLinkList',
    pattern: 'manual',
    testId: 'rd-accordion-link-list',
  },
];

/** @type {RuntimeAtomEntry[]} */
export const PALETTE_RUNTIME_ENTRIES = [
  // Form inputs
  { type: 'visual.input.text', subpath: 'visual/input/text', exportName: 'TextInput', pattern: 'native', kind: 'text-input', testId: 'rd-text-input' },
  { type: 'visual.input.select', subpath: 'visual/input/select', exportName: 'SelectInput', pattern: 'native', kind: 'select-input', testId: 'rd-select-input' },
  { type: 'visual.input.number', subpath: 'visual/input/number', exportName: 'NumberInput', pattern: 'native', kind: 'number-input', testId: 'rd-number-input' },
  { type: 'visual.input.checkbox', subpath: 'visual/input/checkbox', exportName: 'CheckboxInput', pattern: 'native', kind: 'checkbox-input', testId: 'rd-checkbox-input' },
  { type: 'visual.input.textarea', subpath: 'visual/input/textarea', exportName: 'TextareaInput', pattern: 'native', kind: 'textarea-input', testId: 'rd-textarea-input' },
  { type: 'visual.input.date-range', subpath: 'visual/input/date-range', exportName: 'DateRangeFilter', pattern: 'native', kind: 'date-range', testId: 'rd-date-range' },
  { type: 'domain.time-preset', subpath: 'domain/time-preset', exportName: 'TimePreset', pattern: 'native', kind: 'time-preset', testId: 'rd-time-preset' },
  // Data display
  { type: 'visual.table', subpath: 'visual/table', exportName: 'DataTable', pattern: 'native', kind: 'data-table', testId: 'rd-data-table' },
  { type: 'visual.detail', subpath: 'visual/detail', exportName: 'DetailPanel', pattern: 'native', kind: 'detail-panel', testId: 'rd-detail-panel' },
  { type: 'visual.kpi', subpath: 'visual/kpi', exportName: 'KpiCard', pattern: 'native', kind: 'kpi-card', testId: 'rd-kpi-card' },
  { type: 'visual.skeleton', subpath: 'visual/skeleton', exportName: 'LoadingSkeleton', pattern: 'native', kind: 'loading-skeleton', testId: 'rd-loading-skeleton' },
  { type: 'logic.timer', subpath: 'logic/timer', exportName: 'Timer', pattern: 'native', kind: 'timer', testId: 'rd-timer' },
  // Charts
  { type: 'visual.chart.line', subpath: 'visual/chart/line', exportName: 'LineChart', pattern: 'native', kind: 'line-chart', testId: 'rd-line-chart' },
  { type: 'visual.chart.bar', subpath: 'visual/chart/bar', exportName: 'BarChart', pattern: 'native', kind: 'bar-chart', testId: 'rd-bar-chart' },
  { type: 'visual.chart.pie', subpath: 'visual/chart/pie', exportName: 'PieChart', pattern: 'native', kind: 'pie-chart', testId: 'rd-pie-chart' },
  // Layout
  { type: 'layout.grid', subpath: 'layout/grid', exportName: 'GridLayout', pattern: 'native', kind: 'layout-grid', testId: 'rd-grid-layout' },
  { type: 'layout.flex', subpath: 'layout/flex', exportName: 'FlexLayout', pattern: 'native', kind: 'layout-flex', testId: 'rd-flex-layout' },
  { type: 'layout.tabs', subpath: 'layout/tabs', exportName: 'TabsLayout', pattern: 'native', kind: 'layout-tabs', testId: 'rd-tabs-layout' },
  { type: 'layout.modal', subpath: 'layout/modal', exportName: 'ModalLayout', pattern: 'native', kind: 'layout-modal', testId: 'rd-modal-layout' },
  { type: 'layout.collapsible', subpath: 'layout/collapsible', exportName: 'Collapsible', pattern: 'native', kind: 'layout-collapsible', testId: 'rd-collapsible' },
  { type: 'layout.scroll-region', subpath: 'layout/scroll-region', exportName: 'ScrollRegion', pattern: 'native', kind: 'layout-scroll-region', testId: 'rd-scroll-region' },
  // Domain
  { type: 'domain.role-gate', subpath: 'domain/role-gate', exportName: 'RoleGate', pattern: 'native', kind: 'role-gate', testId: 'rd-role-gate' },
  { type: 'domain.person-invite', subpath: 'domain/person-invite', exportName: 'PersonInvite', pattern: 'native', kind: 'person-invite', testId: 'rd-person-invite' },
  { type: 'domain.role-assign', subpath: 'domain/role-assign', exportName: 'RoleAssign', pattern: 'native', kind: 'role-assign', testId: 'rd-role-assign' },
  {
    type: 'domain.i18n.app-language-select',
    subpath: 'domain/i18n/app-language-select',
    exportName: 'AppLanguageSelect',
    pattern: 'manual',
    testId: 'rd-i18n-app-language-select',
    wcImport: 'domain/i18n/app-language-select',
  },
  // Infra
  { type: 'infra.env', subpath: 'infra/env', exportName: 'EnvConfig', pattern: 'native', kind: 'infra-env', testId: 'rd-env-config' },
  { type: 'infra.postgresql', subpath: 'infra/postgresql', exportName: 'PostgresqlInfra', pattern: 'native', kind: 'infra-db', testId: 'rd-postgresql-infra' },
  { type: 'infra.mongodb', subpath: 'infra/mongodb', exportName: 'MongodbInfra', pattern: 'native', kind: 'infra-db', testId: 'rd-mongodb-infra' },
  { type: 'infra.supabase', subpath: 'infra/supabase', exportName: 'SupabaseInfra', pattern: 'native', kind: 'infra-db', testId: 'rd-supabase-infra' },
  { type: 'infra.mysql', subpath: 'infra/mysql', exportName: 'MysqlInfra', pattern: 'native', kind: 'infra-db', testId: 'rd-mysql-infra' },
  { type: 'infra.server.nest', subpath: 'infra/server/nest', exportName: 'NestServerInfra', pattern: 'native', kind: 'infra-server', testId: 'rd-nest-server-infra' },
  { type: 'infra.server.express', subpath: 'infra/server/express', exportName: 'ExpressServerInfra', pattern: 'native', kind: 'infra-server', testId: 'rd-express-server-infra' },
  { type: 'infra.server.next', subpath: 'infra/server/next', exportName: 'NextServerInfra', pattern: 'native', kind: 'infra-server', testId: 'rd-next-server-infra' },
  { type: 'infra.server.nuxt', subpath: 'infra/server/nuxt', exportName: 'NuxtServerInfra', pattern: 'native', kind: 'infra-server', testId: 'rd-nuxt-server-infra' },
  // News
  { type: 'visual.news.language-select', subpath: 'visual/news/language-select', exportName: 'NewsLanguageSelect', pattern: 'native', kind: 'news-select', testId: 'rd-news-language-select' },
  { type: 'visual.news.region-select', subpath: 'visual/news/region-select', exportName: 'NewsRegionSelect', pattern: 'native', kind: 'news-select', testId: 'rd-news-region-select' },
  { type: 'visual.news.type-select', subpath: 'visual/news/type-select', exportName: 'NewsTypeSelect', pattern: 'native', kind: 'news-select', testId: 'rd-news-type-select' },
  { type: 'visual.news.search-box', subpath: 'visual/news/search-box', exportName: 'NewsSearchBox', pattern: 'native', kind: 'news-search-box', testId: 'rd-news-search-box' },
  { type: 'visual.news.results-table', subpath: 'visual/news/results-table', exportName: 'NewsResultsTable', pattern: 'native', kind: 'news-results-table', testId: 'rd-news-results-table' },
  { type: 'visual.news.article-detail', subpath: 'visual/news/article-detail', exportName: 'NewsArticleDetail', pattern: 'native', kind: 'news-article-detail', testId: 'rd-news-article-detail' },
  // Plugins
  { type: 'visual.plugin.status-badge', subpath: 'visual/plugin/status-badge', exportName: 'StatusBadge', pattern: 'native', kind: 'status-badge', testId: 'rd-status-badge' },
  { type: 'visual.plugin.metric-chip', subpath: 'visual/plugin/metric-chip', exportName: 'MetricChip', pattern: 'native', kind: 'metric-chip', testId: 'rd-metric-chip' },
  // 3D
  { type: 'visual.display.3d-bar-chart', subpath: 'visual/display/3d-bar-chart', exportName: 'ThreeBarChart', pattern: 'native', kind: 'three-host', testId: 'rd-three-bar-chart' },
  { type: 'visual.display.3d-scatter', subpath: 'visual/display/3d-scatter', exportName: 'ThreeScatterPlot', pattern: 'native', kind: 'three-host', testId: 'rd-three-scatter' },
  { type: 'visual.display.3d-scene', subpath: 'visual/display/3d-scene', exportName: 'ThreeScenePointCloud', pattern: 'native', kind: 'three-host', testId: 'rd-three-scene' },
  { type: 'visual.display.3d-gltf-model', subpath: 'visual/display/3d-gltf-model', exportName: 'ThreeGltfModel', pattern: 'native', kind: 'three-host', testId: 'rd-three-gltf-model' },
  { type: 'visual.display.3d-geo-globe', subpath: 'visual/display/3d-geo-globe', exportName: 'ThreeGeoGlobe', pattern: 'native', kind: 'three-host', testId: 'rd-three-geo-globe' },
  {
    type: 'visual.display.geo-map',
    subpath: 'visual/display/geo-map',
    exportName: 'GeoMap',
    pattern: 'manual',
    testId: 'rd-display-geo-map',
    wcImport: 'visual/display/geo-map',
  },
  // SVG
  { type: 'visual.svg.inline', subpath: 'visual/svg/inline', exportName: 'SvgInline', pattern: 'native', kind: 'svg-inline', testId: 'rd-svg-inline' },
  { type: 'visual.svg.icon', subpath: 'visual/svg/icon', exportName: 'SvgIcon', pattern: 'native', kind: 'svg-icon', testId: 'rd-svg-icon' },
  // Media — CE-host where WC exists
  {
    type: 'visual.media.video-source',
    subpath: 'visual/media/video-source',
    exportName: 'VideoSource',
    pattern: 'manual',
    testId: 'rd-video-source',
    wcImport: 'visual/media/video-source',
  },
  {
    type: 'visual.media.equirect-viewport',
    subpath: 'visual/media/equirect-viewport',
    exportName: 'EquirectViewport',
    pattern: 'manual',
    testId: 'rd-equirect-viewport',
    wcImport: 'visual/media/equirect-viewport',
  },
  {
    type: 'visual.media.youtube-embed',
    subpath: 'visual/media/youtube-embed',
    exportName: 'YoutubeEmbed',
    pattern: 'manual',
    testId: 'rd-media-youtube-embed',
    wcImport: 'visual/media/youtube-embed',
  },
  { type: 'visual.media.live-capture', subpath: 'visual/media/live-capture', exportName: 'LiveCapture', pattern: 'native', kind: 'live-capture', testId: 'rd-live-capture' },
  // WASM
  { type: 'infra.wasm.asset', subpath: 'infra/wasm/asset', exportName: 'WasmAsset', pattern: 'native', kind: 'wasm-asset', testId: 'rd-wasm-asset' },
  { type: 'visual.wasm.worker-host', subpath: 'visual/wasm/worker-host', exportName: 'WasmWorkerHost', pattern: 'native', kind: 'wasm-worker-host', testId: 'rd-wasm-worker-host' },
  { type: 'visual.wasm.module', subpath: 'visual/wasm/module', exportName: 'WasmModule', pattern: 'native', kind: 'wasm-module', testId: 'rd-wasm-module' },
  {
    type: 'visual.wasm.media',
    subpath: 'visual/wasm/media',
    exportName: 'WasmMedia',
    pattern: 'manual',
    testId: 'rd-wasm-media',
    wcImport: 'visual/wasm/media',
  },
];

/** Legacy alias — deprecated in favor of visual/wasm/media */
export const LEGACY_ALIASES = [
  { subpath: 'wasm/wasm-media', targetSubpath: 'visual/wasm/media', exportName: 'WasmMedia' },
];

export function allRuntimeEntries() {
  return [...NPM_RECIPE_ENTRIES, ...PALETTE_RUNTIME_ENTRIES];
}

export function typeToSubpath(type) {
  const entry = PALETTE_RUNTIME_ENTRIES.find((e) => e.type === type);
  if (entry) return entry.subpath;
  return type.replace(/\./g, '/');
}
