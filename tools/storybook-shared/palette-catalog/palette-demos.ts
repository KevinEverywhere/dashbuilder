/**
 * HTML demos for every builder palette component type.
 * Mirrors apps/client preview-node + preview-plugin markup.
 */
import { buildEquirectExtractFilter, DEFAULT_EQUIRECT_FLAT_CROP } from '@rosettadash/core';
import type { ComponentDefinition } from '@rosettadash/core';
import {
  chartPoints,
  DEFAULT_ICON_SVG,
  DEFAULT_INLINE_SVG,
  lineChartPoints,
  newsRows,
  pieSlices,
  roleOptions,
  selectOptions,
  tableRows,
  timePresetOptions,
} from './palette-demo-data.js';
import { PREVIEW_TABLE_NUMERIC_CLASS } from '../preview-numeric.js';

function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function selectHtml(id: string, placeholder: string, options = selectOptions): string {
  const opts = options
    .map((o) => `<option value="${esc(o.value)}">${esc(o.label)}</option>`)
    .join('');
  return `<select class="preview-input" id="${id}" aria-label="${esc(placeholder)}"><option value="">${esc(placeholder)}</option>${opts}</select>`;
}

function tableRowsHtml(rows: typeof tableRows, testId: string): string {
  return rows
    .map(
      (row) =>
        `<tr class="preview-table__row" data-row-id="${esc(row.id)}" tabindex="0"><td>${esc(row.name)}</td><td>${esc(row.status)}</td><td class="${PREVIEW_TABLE_NUMERIC_CLASS}">$${row.amount.toLocaleString()}</td><td>${esc(row.date)}</td></tr>`,
    )
    .join('');
}

function newsRowsHtml(): string {
  return newsRows
    .map(
      (row) =>
        `<tr class="preview-table__row" data-news-id="${esc(row.id)}" tabindex="0"><td>${esc(row.headline)}</td><td>${esc(row.source)}</td><td>${esc(row.region)}</td><td>${esc(row.publishedAt)}</td></tr>`,
    )
    .join('');
}

function pieGradient(): string {
  let acc = 0;
  const parts = pieSlices.map((slice) => {
    const start = acc;
    acc += slice.value;
    return `${slice.color} ${start}% ${acc}%`;
  });
  return `conic-gradient(${parts.join(', ')})`;
}

const wasmFilter = buildEquirectExtractFilter('flat-crop', DEFAULT_EQUIRECT_FLAT_CROP);

/** Render interactive demo markup for a component type. */
export function renderPaletteDemo(
  type: string,
  definition: ComponentDefinition,
  overrides: Record<string, unknown> = {},
): string {
  const label = esc(definition.label);

  switch (type) {
    case 'visual.input.text':
      return `<label class="preview-field"><span class="preview-field__label">${label}</span><input type="text" class="preview-input" placeholder="${esc(String(overrides.placeholder ?? 'Customer name'))}" /></label>`;

    case 'visual.input.select':
      return `<div class="preview-field"><span class="preview-field__label">${label}</span>${selectHtml('demo-select', 'Select region…')}</div>`;

    case 'visual.input.number':
      return `<label class="preview-field"><span class="preview-field__label">${label}</span><input type="number" class="preview-input" min="0" max="100" step="1" value="42" /></label>`;

    case 'visual.input.checkbox':
      return `<label class="preview-field preview-field--checkbox"><input type="checkbox" class="preview-checkbox" checked /><span class="preview-field__label">Include archived records</span></label>`;

    case 'visual.input.textarea':
      return `<label class="preview-field"><span class="preview-field__label">${label}</span><textarea class="preview-input preview-textarea" rows="4" placeholder="Notes for the operator…"></textarea></label>`;

    case 'visual.input.date-range':
      return `<div class="preview-date-range"><span class="preview-field__label">${label}</span><div class="preview-date-range__controls"><input type="date" class="preview-input" value="2026-08-01" /><span class="preview-date-range__sep">to</span><input type="date" class="preview-input" value="2026-08-08" /></div><span class="preview-date-range__preset">Preset: Last 7 days</span></div>`;

    case 'domain.time-preset':
      return `<div class="preview-time-preset" data-catalog-time-preset><span class="preview-field__label">${label}</span><div class="preview-time-preset__buttons">${timePresetOptions
        .map(
          (o, i) =>
            `<button type="button" class="preview-time-preset__button${i === 0 ? ' preview-time-preset__button--active' : ''}" data-preset="${esc(o.id)}">${esc(o.label)}</button>`,
        )
        .join('')}</div></div>`;

    case 'visual.table':
      return `<div class="preview-table" data-catalog-table><div class="preview-table__header"><span>${label}</span><span class="preview-chip">Filterable</span></div><table><thead><tr><th>Name</th><th>Status</th><th class="${PREVIEW_TABLE_NUMERIC_CLASS}">Amount</th><th>Date</th></tr></thead><tbody>${tableRowsHtml(tableRows, 'demo-table')}</tbody></table></div>`;

    case 'visual.detail':
      return `<div class="preview-detail" data-catalog-detail><div class="preview-detail__header"><span class="preview-detail__title">Details</span><span class="preview-chip">Table row selection</span></div><p class="preview-detail__empty">Select a row in the Data Table demo</p></div>`;

    case 'visual.kpi':
      return `<div class="preview-kpi"><span class="preview-kpi__title">${esc(String(overrides.title ?? 'Monthly revenue'))}</span><span class="preview-kpi__value">${esc(String(overrides.value ?? '$128,420'))}</span><span class="preview-kpi__delta">${esc(String(overrides.delta ?? '+12.4%'))}</span></div>`;

    case 'visual.skeleton':
      return `<div class="preview-skeleton" data-catalog-skeleton><span class="preview-skeleton__line"></span><span class="preview-skeleton__line"></span><span class="preview-skeleton__line preview-skeleton__line--short"></span><span class="preview-skeleton__line"></span></div>`;

    case 'logic.timer': {
      const intervalMs = Number(overrides.intervalMs ?? 1200);
      return `<div class="preview-timer" data-catalog-timer data-mode="interval" data-interval-ms="${intervalMs}"><div class="preview-timer__header"><span class="preview-field__label">${label}</span><span class="preview-chip">interval</span></div><span class="preview-timer__value" data-timer-display>0 ticks</span></div>`;
    }

    case 'visual.chart.line':
      return `<div class="preview-chart"><div class="preview-chart__header"><span class="preview-chart__title">${esc(String(overrides.chartTitle ?? 'Sessions over time'))}</span><span class="preview-chip">Date range bound</span></div><svg viewBox="0 0 240 96" class="preview-chart__svg"><polyline class="preview-chart__line" points="${lineChartPoints}" /></svg></div>`;

    case 'visual.chart.bar':
      return `<div class="preview-chart"><div class="preview-chart__header"><span class="preview-chart__title">${esc(String(overrides.chartTitle ?? 'Signups by day'))}</span></div><div class="preview-chart__bars">${chartPoints
        .map(
          (p) =>
            `<div class="preview-chart__bar-wrap"><div class="preview-chart__bar" style="height:${Math.round((p.value / 73) * 100)}%"></div><span>${esc(p.label)}</span></div>`,
        )
        .join('')}</div></div>`;

    case 'visual.chart.pie':
      return `<div class="preview-chart"><div class="preview-chart__header"><span class="preview-chart__title">${esc(String(overrides.chartTitle ?? 'Traffic mix'))}</span></div><div class="preview-chart__pie" style="background:${pieGradient()}"></div><ul class="preview-chart__pie-legend">${pieSlices
        .map(
          (s) =>
            `<li><span class="preview-chart__pie-swatch" style="background:${s.color}"></span>${esc(s.label)}</li>`,
        )
        .join('')}</ul></div>`;

    case 'layout.grid':
      return `<div class="preview-layout"><span class="preview-layout__title">${label}</span><div class="preview-layout__grid" style="grid-template-columns:repeat(3,1fr);gap:12px"><div class="preview-layout__slot">Slot 1</div><div class="preview-layout__slot">Slot 2</div><div class="preview-layout__slot">Slot 3</div></div></div>`;

    case 'layout.flex':
      return `<div class="preview-layout"><span class="preview-layout__title">${label}</span><div class="preview-layout__flex" style="gap:12px"><div class="preview-layout__slot">Item 1</div><div class="preview-layout__slot">Item 2</div><div class="preview-layout__slot">Item 3</div></div></div>`;

    case 'layout.tabs':
      return `<div class="preview-layout" data-catalog-tabs><span class="preview-layout__title">${label}</span><div class="preview-tabs"><button type="button" class="preview-tabs__tab preview-tabs__tab--active" data-tab="0">Overview</button><button type="button" class="preview-tabs__tab" data-tab="1">Metrics</button><button type="button" class="preview-tabs__tab" data-tab="2">Settings</button></div><div class="preview-layout__slot" data-tab-panel>Overview panel — summary KPIs and filters</div></div>`;

    case 'layout.modal':
      return `<div class="preview-modal"><div class="preview-modal__dialog"><span class="preview-modal__title">${esc(String(overrides.modalTitle ?? 'Confirm export'))}</span><p class="preview-modal__body">${esc(String(overrides.modalBody ?? 'Export 12 composites to NestJS + PostgreSQL?'))}</p><button type="button" class="preview-onboarding__button">${esc(String(overrides.confirmLabel ?? 'Confirm'))}</button></div></div>`;

    case 'layout.collapsible':
      return `<div class="preview-layout preview-collapsible" data-catalog-collapsible><button type="button" class="preview-collapsible__header" aria-expanded="false"><span>${esc(String(overrides.title ?? 'Advanced filters'))}</span><span aria-hidden="true">›</span></button><div class="preview-collapsible__panel" hidden><div class="preview-layout__slot">Hidden slot — bind filters here</div></div></div>`;

    case 'domain.role-gate':
      return `<div class="preview-role-gate"><span class="preview-field__label">${label}</span><p class="preview-role-gate__status">${esc(String(overrides.statusText ?? 'Visible'))}</p><p class="preview-role-gate__hint">Allowed roles:</p><code>["editor","admin"]</code></div>`;

    case 'domain.person-invite':
      return `<div class="preview-onboarding"><span class="preview-field__label">Invite team member</span><input type="email" class="preview-input" placeholder="${esc(String(overrides.emailPlaceholder ?? 'name@company.com'))}" /><button type="button" class="preview-onboarding__button">Send invite</button></div>`;

    case 'domain.role-assign':
      return `<div class="preview-onboarding"><span class="preview-field__label">Assign role</span><p class="preview-onboarding__summary">Review access before confirming</p>${selectHtml('demo-role', 'Choose role…', roleOptions)}<button type="button" class="preview-onboarding__button">Confirm access</button></div>`;

    case 'infra.env':
      return `<div class="preview-infra"><span class="preview-infra__badge">INFRA</span><span class="preview-field__label">Environment config</span><code>${esc(String(overrides.envKeys ?? 'DATABASE_URL, API_KEY, FEATURE_FLAGS'))}</code></div>`;

    case 'infra.postgresql':
      return `<div class="preview-infra"><span class="preview-infra__badge">INFRA</span><span class="preview-field__label">PostgreSQL</span><code>DATABASE_URL</code><span class="preview-infra__meta">table: ${esc(String(overrides.tableName ?? 'analytics_events'))}</span></div>`;

    case 'infra.mongodb':
      return `<div class="preview-infra"><span class="preview-infra__badge">INFRA</span><span class="preview-field__label">MongoDB</span><code>MONGODB_URI</code><span class="preview-infra__meta">collection: sessions</span></div>`;

    case 'infra.supabase':
      return `<div class="preview-infra"><span class="preview-infra__badge">INFRA</span><span class="preview-field__label">Supabase</span><code>SUPABASE_URL · SUPABASE_ANON_KEY</code><span class="preview-infra__meta">table: profiles</span></div>`;

    case 'infra.mysql':
      return `<div class="preview-infra"><span class="preview-infra__badge">INFRA</span><span class="preview-field__label">MySQL</span><code>MYSQL_URL</code><span class="preview-infra__meta">table: orders</span></div>`;

    case 'infra.server.nest':
      return `<div class="preview-infra"><span class="preview-infra__badge">INFRA</span><span class="preview-field__label">NestJS Server</span><code>globalPrefix: ${esc(String(overrides.globalPrefix ?? 'api'))}</code></div>`;

    case 'infra.server.express':
      return `<div class="preview-infra"><span class="preview-infra__badge">INFRA</span><span class="preview-field__label">Express Server</span><code>globalPrefix: api</code></div>`;

    case 'infra.server.next':
      return `<div class="preview-infra"><span class="preview-infra__badge">INFRA</span><span class="preview-field__label">Next.js Server</span><code>app/api routes</code></div>`;

    case 'infra.server.nuxt':
      return `<div class="preview-infra"><span class="preview-infra__badge">INFRA</span><span class="preview-field__label">Nuxt Server</span><code>server/api routes</code></div>`;

    case 'visual.news.language-select':
      return `<div class="preview-field"><span class="preview-field__label">${label}</span>${selectHtml('news-lang', 'Language')}</div>`;

    case 'visual.news.region-select':
      return `<div class="preview-field"><span class="preview-field__label">${label}</span>${selectHtml('news-region', 'Region')}</div>`;

    case 'visual.news.type-select':
      return `<div class="preview-field"><span class="preview-field__label">${label}</span>${selectHtml('news-type', 'News type')}</div>`;

    case 'visual.news.search-box':
      return `<div class="preview-field preview-search"><span class="preview-field__label">${label}</span><div class="preview-search__row"><input type="search" class="preview-input preview-search__input" placeholder="${esc(String(overrides.placeholder ?? 'Search news…'))}" value="equirect pipeline" /><button type="button" class="preview-search__button">Search</button></div></div>`;

    case 'visual.news.results-table':
      return `<div class="preview-table" data-catalog-news-table><div class="preview-table__header"><span>${esc(String(overrides.tableTitle ?? label))}</span></div><table><thead><tr><th>Headline</th><th>Source</th><th>Region</th><th>Published</th></tr></thead><tbody>${newsRowsHtml()}</tbody></table></div>`;

    case 'visual.news.article-detail':
      return `<div class="preview-detail" data-catalog-news-detail><div class="preview-detail__header"><span class="preview-detail__title">Article</span><span class="preview-chip">Results row selection</span></div><p class="preview-detail__empty">Select a headline in News Results</p></div>`;

    case 'visual.plugin.status-badge':
      return `<div class="preview-plugin preview-plugin--badge preview-plugin--success">${esc(String(overrides.statusText ?? 'Active'))}</div>`;

    case 'visual.plugin.metric-chip':
      return `<div class="preview-plugin preview-plugin--chip"><span class="preview-plugin__chip-label">${esc(String(overrides.chipLabel ?? 'Latency'))}</span><span class="preview-plugin__chip-value">${esc(String(overrides.chipValue ?? '42ms'))}</span></div>`;

    case 'visual.display.3d-bar-chart':
      return `<div class="preview-three-host" data-three-mode="bar-chart" data-three-title="${esc(String(overrides.threeTitle ?? '3D Bar Chart'))}"></div>`;

    case 'visual.display.3d-scatter':
      return `<div class="preview-three-host" data-three-mode="scatter" data-three-title="${esc(String(overrides.threeTitle ?? '3D Scatter'))}"></div>`;

    case 'visual.display.3d-scene':
      return `<div class="preview-three-host" data-three-mode="scene" data-three-title="${esc(String(overrides.threeTitle ?? '3D Scene'))}"></div>`;

    case 'visual.display.3d-gltf-model':
      return `<div class="preview-three-host" data-three-mode="gltf-model" data-three-title="${esc(String(overrides.threeTitle ?? 'GLTF Model'))}"></div>`;

    case 'visual.display.3d-geo-globe':
      return `<div class="preview-three-host" data-three-mode="geo-globe" data-three-title="${esc(String(overrides.threeTitle ?? 'Geo Globe'))}"></div>`;

    case 'visual.svg.inline':
      return `<div class="preview-svg preview-svg--inline" style="width:96px;height:96px">${DEFAULT_INLINE_SVG}</div>`;

    case 'visual.svg.icon':
      return `<div class="preview-svg preview-svg--icon" style="width:28px;height:28px;color:#2563eb" title="Star">${DEFAULT_ICON_SVG}</div>`;

    case 'visual.media.video-source':
      return `<rd-video-source label="${esc(String(overrides.label ?? 'Program source'))}" accept="video/*" source-width="3840" source-height="1920"></rd-video-source>`;

    case 'visual.media.equirect-viewport':
      return `<rd-equirect-viewport label="${esc(String(overrides.label ?? 'Crop metadata'))}" preview-mode="rectilinear" yaw="${Number(overrides.yaw ?? 25)}" pitch="${Number(overrides.pitch ?? -8)}" horizontal-fov="${Number(overrides.horizontalFov ?? 75)}" output-width="1280" output-height="720" style="display:block;max-width:100%"></rd-equirect-viewport>`;

    case 'visual.media.equirect-sphere-viewport':
      return `<rd-equirect-sphere-viewport flip-interior yaw="${Number(overrides.yaw ?? 25)}" pitch="${Number(overrides.pitch ?? -8)}" horizontal-fov="${Number(overrides.horizontalFov ?? 75)}" output-width="1280" output-height="720" style="display:block;max-width:100%"></rd-equirect-sphere-viewport>`;

    case 'visual.media.flat-video-viewport':
      return `<rd-flat-video-viewport source-width="1920" source-height="1080" crop-x="${Number(overrides.cropX ?? 320)}" crop-y="${Number(overrides.cropY ?? 180)}" crop-width="${Number(overrides.cropWidth ?? 1280)}" crop-height="${Number(overrides.cropHeight ?? 720)}" output-width="1280" output-height="720" style="display:block;max-width:100%"></rd-flat-video-viewport>`;

    case 'visual.media.live-capture':
      return `<div class="preview-media preview-media--capture"><span class="preview-media__label">Live capture</span><button type="button" class="preview-media__capture-btn">Start camera</button><span class="preview-media__meta">Authoring only</span></div>`;

    case 'infra.wasm.asset':
      return `<div class="preview-wasm preview-wasm--asset"><span class="preview-wasm__badge">WASM</span><code>${esc(String(overrides.assetPath ?? 'wasm/modules/example.wasm'))}</code><span class="preview-wasm__glue">+ wasm/glue/example.js</span></div>`;

    case 'visual.wasm.worker-host':
      return `<div class="preview-wasm preview-wasm--worker"><span class="preview-wasm__label">${esc(String(overrides.workerLabel ?? 'dash-wasm-worker'))}</span><span class="preview-wasm__status">${esc(String(overrides.workerStatus ?? 'Worker idle'))}</span></div>`;

    case 'visual.wasm.module':
      return `<div class="preview-wasm preview-wasm--module"><span class="preview-wasm__label">${esc(String(overrides.moduleLabel ?? 'WASM Module'))}</span><code>run()</code></div>`;

    case 'visual.wasm.media':
      return `<rd-wasm-media label="${esc(String(overrides.label ?? 'Equirect extract'))}" operation="equirect-extract" extraction-mode="flat-crop" output-format="mp4"></rd-wasm-media>`;

    default:
      return `<div class="preview-fallback"><span>${label}</span><code>${esc(type)}</code></div>`;
  }
}

export function catalogItemFooter(definition: ComponentDefinition): string {
  return `<footer class="rd-catalog-item__footer"><span class="rd-catalog-item__type">${esc(definition.type)}</span><span>${definition.category}${definition.isVisual ? '' : ' · non-visual'}</span></footer>`;
}

export function wasmFilterPreview(): string {
  return wasmFilter;
}
