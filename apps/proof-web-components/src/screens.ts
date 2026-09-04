import {
  DEFAULT_APP_LOCALES,
  DESTINATION_ATLAS_ABOUT_INTRO,
  DESTINATION_ATLAS_CROSS_FRAMEWORK_SHOWCASES,
  DESTINATION_ATLAS_CURRENT_RUNTIME_BADGE,
  DESTINATION_ATLAS_RUNTIME_GUIDES,
  DESTINATION_ATLAS_RUNTIME_MATRIX_COLUMNS,
  EQUIRECT_VIDEO_DESTINATIONS,
  FLAT_VIDEO_DESTINATIONS,
  GEO_MAP_PROVIDERS,
  GLOBE_TEXTURE_SOURCE_OPTIONS,
  MOCK_DESTINATIONS,
  TRAVEL_INTEREST_VENN,
  TRAVEL_JOURNEY_SANKEY,
  destinationHasFlatVideo,
  destinationThumbnailUrl,
  formatVisitorCount,
  getDestinationById,
  isEquirectDestination,
  AUTHORING_360_DISPLAY_CATALOG,
  authoring360CatalogJson,
  authoring360Attribution,
  attributionNoticeJson,
  FFMPEG_WASM_ATTRIBUTION,
  GLOBE_EQUIRECT_ATTRIBUTION,
  mapProviderAttribution,
  THREE_JS_ATTRIBUTION,
  youtubeVideoAttribution,
  type DestinationAtlasRuntimeId,
  type AttributionNotice,
} from '@destination-atlas';
import {
  AUTHORING_OUTPUT_CUSTOM_ID,
  AUTHORING_OUTPUT_PRESETS,
  CLIENT_ROUTER_MODE_OPTIONS,
  type ClientRouterMode,
} from '@rosettadash/core';
import { renderAuthoringCameraControlsMarkup } from './authoring-camera-controls.js';
import { renderAuthoringPlaybackBarMarkup } from './authoring-playback-bar.js';
import { sankeyChartMarkup, vennChartMarkup } from './charts.js';
import { geoExplorerMarkup } from './geo-explorer.js';
import {
  MOCK_NEWS,
  REGION_OPTIONS,
  TIME_PRESETS,
  aggregateVisitorTrend,
  computeVisitorDelta,
  destinationBarSeries,
  filterHistoricByPreset,
  formatRegionLabel,
  formatVisitPeriod,
  historicWindowLabel,
  localizedDestinationName,
  periodColumnLabel,
} from './atlas-utils.js';
import type { AtlasState } from './lib/atlas-state.js';
import { getConsumerSecrets } from './lib/consumer-secrets.js';
import { ariaCurrentPage, attr, escapeHtml, jsonAttr } from './lib/html.js';
import { destinationMapView } from './lib/map-location.js';
import { ATLAS_USER_ROLES, roleLabel, type AtlasUserRole } from './lib/roles.js';
import { isSettingFieldTarget } from './lib/settings-highlight.js';
import { themeLabel, type ThemePreference } from './lib/theme.js';

const CURRENT_RUNTIME_ID: DestinationAtlasRuntimeId = 'web-components';

function attributionNoticeEl(notice: AttributionNotice): string {
  return `<rd-attribution-notice notice='${jsonAttr(notice)}'></rd-attribution-notice>`;
}

export function renderAbout(): string {
  const matrixHead = DESTINATION_ATLAS_RUNTIME_MATRIX_COLUMNS.map(
    (column) => `<span>${escapeHtml(column.label)}</span>`,
  ).join('');
  const runtimeRows = DESTINATION_ATLAS_RUNTIME_GUIDES.map((runtime) => {
    const isCurrent = runtime.id === CURRENT_RUNTIME_ID;
    return `
      <li class="da-about__runtime-card${isCurrent ? ' da-about__runtime-card--current' : ''}"${isCurrent ? ' aria-current="true"' : ''}>
        <header>
          <h4>${escapeHtml(runtime.label)}</h4>
          <span class="da-about__ticket">${escapeHtml(runtime.ticket)}</span>
          ${isCurrent ? `<span class="da-about__runtime-current-badge">${escapeHtml(DESTINATION_ATLAS_CURRENT_RUNTIME_BADGE)}</span>` : ''}
        </header>
        <p>${escapeHtml(runtime.summary)}</p>
        <div class="da-about__runtime-matrix">
          <div class="da-about__runtime-matrix-col">
            <span class="da-about__runtime-matrix-label">${escapeHtml(DESTINATION_ATLAS_RUNTIME_MATRIX_COLUMNS[0].label)}</span>
            <code>${escapeHtml(runtime.npmPackage)}</code>
          </div>
          <div class="da-about__runtime-matrix-col">
            <span class="da-about__runtime-matrix-label">${escapeHtml(DESTINATION_ATLAS_RUNTIME_MATRIX_COLUMNS[1].label)}</span>
            <code>${escapeHtml(runtime.proofCommand)}</code>
            <span class="da-about__port">localhost:${runtime.proofPort}</span>
            <span class="da-about__path">${escapeHtml(runtime.proofPath)}</span>
          </div>
          <div class="da-about__runtime-matrix-col">
            <span class="da-about__runtime-matrix-label">${escapeHtml(DESTINATION_ATLAS_RUNTIME_MATRIX_COLUMNS[2].label)}</span>
            <code>${escapeHtml(runtime.storybookCommand)}</code>
            <span class="da-about__port">localhost:${runtime.storybookPort}</span>
          </div>
        </div>
      </li>`;
  }).join('');
  const showcases = DESTINATION_ATLAS_CROSS_FRAMEWORK_SHOWCASES.map((showcase) => {
    const current = showcase.hostRuntime === 'Web Components';
    return `
      <li class="da-about__interop-card${showcase.planned ? ' da-about__interop-card--planned' : ''}${current ? ' da-about__runtime-card--current' : ''}">
        <header>
          <h4>${escapeHtml(showcase.hostRuntime)} + ${escapeHtml(showcase.embeddedRuntime)}${showcase.planned ? '<span class="da-about__interop-planned">planned</span>' : ''}</h4>
          <span class="da-about__ticket">${escapeHtml(showcase.hostTicket)}</span>
        </header>
        <p class="da-about__interop-meta"><strong>${escapeHtml(showcase.screen)}</strong> — ${escapeHtml(showcase.feature)}</p>
        <p>${escapeHtml(showcase.summary)}</p>
        <p class="da-about__interop-bridge">Bridge: <code>${escapeHtml(showcase.bridge)}</code></p>
      </li>`;
  }).join('');

  return `
    <section class="da-panel da-panel--about">
      <h2>About Destination Atlas</h2>
      <div class="da-about">
        <p class="da-about__lead">${escapeHtml(DESTINATION_ATLAS_ABOUT_INTRO.lead)}</p>
        <section class="da-about__section">
          <h3>${escapeHtml(DESTINATION_ATLAS_ABOUT_INTRO.title)}</h3>
          <p>${escapeHtml(DESTINATION_ATLAS_ABOUT_INTRO.proofPurpose)}</p>
          <p>${escapeHtml(DESTINATION_ATLAS_ABOUT_INTRO.consumerInstall)}</p>
        </section>
        <section class="da-about__section">
          <h3>Runtimes — proof apps &amp; Storybook</h3>
          <p>Each runtime ships a <strong>proof app</strong> (full Destination Atlas UX) and a <strong>Storybook catalog</strong> (isolated component review). Use the same npm package in your consumer project.</p>
          <p class="da-about__note">${escapeHtml(DESTINATION_ATLAS_ABOUT_INTRO.runtimeCardsNote)}</p>
          <div class="da-about__runtime-matrix-wrap">
            <div class="da-about__runtime-matrix-head" aria-hidden="true">${matrixHead}</div>
            <ul class="da-about__runtime-list">${runtimeRows}</ul>
          </div>
        </section>
        <section class="da-about__section">
          <h3>Cross-framework composition</h3>
          <p>Proof apps are mostly native to their runtime. When a feature is ahead in another package — or you are migrating incrementally — you can embed a subtree from another framework instead of rewriting it.</p>
          <ul class="da-about__interop-list">${showcases}</ul>
          <p class="da-about__note">This custom-elements app is the <code>rd-*</code> host. Map, Globe, Media, and Authoring stay on native custom elements. Cross-framework mixing is demonstrated on the Svelte proof — see About → Cross-framework composition.</p>
        </section>
        <section class="da-about__section">
          <h3>${escapeHtml(DESTINATION_ATLAS_ABOUT_INTRO.componentSourceTitle)}</h3>
          <p>${escapeHtml(DESTINATION_ATLAS_ABOUT_INTRO.componentSourceBody)}</p>
        </section>
        <section class="da-about__section">
          <h3>How to work with components</h3>
          <ol class="da-about__steps">
            <li>Open <strong>Storybook</strong> for your runtime — browse palette groups, preview bindings, and copy import paths from the catalog.</li>
            <li>Run the matching <strong>proof app</strong> — see components composed into real screens (this custom-elements app is the DAS-121 host).</li>
            <li>On any other tab, read the <strong>Component source</strong> panel — inspect markup, prop names, and how RosettaDash custom elements nest together.</li>
            <li>Install packages in your app via npm; wire developer-owned i18n, data, and providers (map tiles, API keys) at the component prop level.</li>
          </ol>
        </section>
        <section class="da-about__section da-about__section--muted da-about__section--last">
          <h3>Documentation</h3>
          <ul class="da-about__doc-links">
            <li><code>docs/43-destination-atlas-proof-apps.md</code> — screen map and mock data</li>
            <li><code>docs/38-storybook-component-catalog.md</code> — Storybook ports and sidebar taxonomy</li>
            <li><code>docs/34-public-component-api.md</code> — import paths and recipes</li>
          </ul>
        </section>
      </div>
    </section>`;
}

export function renderOverview(atlas: AtlasState): string {
  const kpiCards = MOCK_DESTINATIONS.map(
    (dest) =>
      `<rd-kpi-card title="${attr(localizedDestinationName(dest, atlas.locale))}" value="${attr(formatVisitorCount(dest.visitorsCurrent))}" delta="${attr(computeVisitorDelta(dest))}" format="number"></rd-kpi-card>`,
  ).join('');
  return `
    <section class="da-panel">
      <h2>Overview</h2>
      <p>Current visitor KPIs and historic trends across 30 sample destinations (10-year guesstimates).</p>
      <div class="da-stack">
        <rd-scroll-region title="Destination KPIs" max-height="22rem">
          <rd-grid-layout columns="3" gap="12">${kpiCards}</rd-grid-layout>
        </rd-scroll-region>
        <div class="da-stack da-stack--2">
          <rd-line-chart title="Visitors over time (aggregate trend)" points='${jsonAttr(aggregateVisitorTrend())}' x-axis-label="Year" y-axis-label="Total visitors"></rd-line-chart>
          <rd-bar-chart title="2024 visitors by destination" bars='${jsonAttr(destinationBarSeries(atlas.locale, localizedDestinationName))}' y-axis-label="Visitors"></rd-bar-chart>
        </div>
        <rd-role-gate label="Operations metrics" status-text="Admin operations panel" hidden-status-text="Operations metrics are hidden for Viewer and Editor roles." allowed-roles='["admin"]' current-role="${attr(atlas.userRole)}">
          <div class="da-stack da-stack--2 da-stack--metrics">
            <rd-metric-chip chip-label="Avg. stay" chip-value="4.2 nights"></rd-metric-chip>
            <rd-status-badge status-text="Data freshness: current" tone="success"></rd-status-badge>
          </div>
        </rd-role-gate>
      </div>
    </section>`;
}

export function renderDestinations(atlas: AtlasState): string {
  const filtered = MOCK_DESTINATIONS.filter((dest) => {
    const name = localizedDestinationName(dest, atlas.locale).toLowerCase();
    const matchesSearch = !atlas.destSearch || name.includes(atlas.destSearch.toLowerCase());
    const matchesRegion = !atlas.destRegion || dest.region === atlas.destRegion;
    return matchesSearch && matchesRegion;
  });
  const periodLabel = periodColumnLabel(atlas.timePreset);
  const rows = filtered.map((dest) => ({
    id: dest.id,
    name: localizedDestinationName(dest, atlas.locale),
    status: dest.region,
    amount: formatVisitorCount(dest.visitorsCurrent),
    date: periodLabel,
  }));
  const selected = getDestinationById(atlas.selectedId);
  const selectedHistoric = selected ? filterHistoricByPreset(selected, atlas.timePreset) : [];
  const chips = [
    ...(atlas.destSearch ? [{ label: 'Search', value: atlas.destSearch }] : []),
    ...(atlas.destRegion ? [{ label: 'Region', value: formatRegionLabel(atlas.destRegion) }] : []),
    { label: 'Visit period', value: formatVisitPeriod(atlas.visitPeriodStart, atlas.visitPeriodEnd) },
    { label: 'Historic window', value: historicWindowLabel(atlas.timePreset) },
  ];
  const regionOptions = REGION_OPTIONS;
  let detail = `<p class="da-detail-body">Select a destination row to view details.</p>`;
  if (atlas.userRole === 'viewer') {
    detail = `<p class="da-detail-body">Switch to Editor or Admin to select rows and view destination details.</p>`;
  } else if (selected) {
    detail = `
      <p class="rd-detail-card__title">${escapeHtml(localizedDestinationName(selected, atlas.locale))}</p>
      <p class="rd-detail-card__meta">${escapeHtml(formatRegionLabel(selected.region))}</p>
      <dl class="rd-detail-stats rd-detail-stats--compact">
        <div><dt>Current visitors</dt><dd>${escapeHtml(formatVisitorCount(selected.visitorsCurrent))} (2024)</dd></div>
        <div><dt>Coordinates</dt><dd>${selected.lat.toFixed(4)}, ${selected.lng.toFixed(4)}</dd></div>
      </dl>
      <section class="rd-detail-historic rd-detail-historic--compact">
        <h4>Historic visitors (${escapeHtml(historicWindowLabel(atlas.timePreset))})</h4>
        <ul>${selectedHistoric.map((row) => `<li><span>${row.year}</span><strong>${escapeHtml(formatVisitorCount(row.visitors))}</strong></li>`).join('')}</ul>
      </section>
      <p class="da-detail-actions">
        <button type="button" class="rd-button" data-ref="view-on-map">View on map</button>
      </p>`;
  }

  return `
    <section class="da-panel">
      <h2>Destinations</h2>
      <p>Browse and filter mock destination records.</p>
      <div class="da-stack">
        <rd-role-gate label="Destination filters" current-role="${attr(atlas.userRole)}" allowed-roles='["editor","admin"]' status-text="Editor filters active" hidden-status-text="Filters are available to Editor and Admin roles. Viewer sees the full list.">
          <div class="rd-filter-grid">
            <rd-text-input label="Search" placeholder="Destination name…" value="${attr(atlas.destSearch)}" data-ref="dest-search"></rd-text-input>
            <rd-select-input label="Region" placeholder="All regions" options='${jsonAttr(regionOptions)}' value="${attr(atlas.destRegion)}" data-ref="dest-region"></rd-select-input>
            <rd-date-range label="Visit period" granularity="month" start-date="${attr(atlas.visitPeriodStart)}" end-date="${attr(atlas.visitPeriodEnd)}" data-ref="visit-period"></rd-date-range>
            <rd-time-preset label="Historic window" presets='${jsonAttr(TIME_PRESETS)}' active-preset-id="${attr(atlas.timePreset)}" data-ref="time-preset"></rd-time-preset>
          </div>
        </rd-role-gate>
        <section class="rd-filter-summary" data-testid="rd-filter-summary" aria-live="polite">
          <div class="rd-filter-summary__header">
            <strong>Filter results</strong>
            <span class="rd-filter-summary__count">${filtered.length} destination${filtered.length === 1 ? '' : 's'}</span>
          </div>
          <dl class="rd-filter-summary__chips">${chips.map((chip) => `<div><dt>${escapeHtml(chip.label)}</dt><dd>${escapeHtml(chip.value)}</dd></div>`).join('')}</dl>
          <p class="rd-filter-summary__hint">Historic window: ${escapeHtml(historicWindowLabel(atlas.timePreset))} (${escapeHtml(periodLabel)}).</p>
        </section>
        <rd-flex-layout direction="row" gap="16" title="Browse destinations">
          <rd-data-table title="Destinations" rows='${jsonAttr(rows)}' selected-row-id="${attr(atlas.selectedId)}" data-ref="dest-table"></rd-data-table>
          <rd-detail-panel title="Destination detail">${detail}</rd-detail-panel>
        </rd-flex-layout>
      </div>
    </section>`;
}

export function renderMapsToolbar(atlas: AtlasState): string {
  const secrets = getConsumerSecrets();
  const active = GEO_MAP_PROVIDERS.find((p) => p.id === atlas.mapProvider);
  const selected = getDestinationById(atlas.selectedId);
  const view = atlas.mapViewOverride ?? (selected ? destinationMapView(selected, atlas.locale) : { lat: 20, lng: 0, zoom: 2, label: 'World' });
  const googleNote =
    atlas.mapProvider === 'google-maps' && !secrets.googleMapsApiKey
      ? `<p class="da-note da-byok-cta">Google Maps requires an API key. <button type="button" class="da-locale-link" data-ref="open-integrations">Configure in Settings → Integrations</button> or set <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>.env.local</code>.</p>`
      : '';
  const maplibreNote =
    atlas.mapsPanel === 'map' && atlas.mapProvider === 'maplibre' && !secrets.maplibreTileUrl
      ? `<p class="da-note">Using demo MapLibre tiles. Add a MapTiler key in <button type="button" class="da-locale-link" data-ref="open-integrations">Settings → Integrations</button> for hosted vector tiles.</p>`
      : '';
  return `
    <div class="da-maps-toolbar__map-fields">
      <div class="rd-map-location">
        <rd-text-input label="Request location" placeholder="Destination name or lat, lng…" value="${attr(atlas.mapLocationQuery)}" data-ref="map-location"></rd-text-input>
        <button type="button" class="rd-button" data-ref="go-location">Go to location</button>
      </div>
      ${atlas.locationError ? `<p class="da-map-location-error">${escapeHtml(atlas.locationError)}</p>` : ''}
      <p class="da-note da-maps-toolbar__view-label">Map view: <strong>${escapeHtml(view.label)}</strong>${atlas.mapViewOverride ? ' <span>(custom coordinates)</span>' : ''}</p>
      <rd-select-input label="Map provider" options='${jsonAttr(GEO_MAP_PROVIDERS.map((p) => ({ value: p.id, label: p.label })))}' value="${attr(atlas.mapProvider)}" data-ref="map-provider"></rd-select-input>
      ${
        active
          ? `<dl class="da-provider-meta"><dt>Cost</dt><dd>${escapeHtml(active.costSummary)}</dd><dt>API key</dt><dd>${active.apiKeyRequired ? 'Required' : 'Optional'}</dd><dt>Notes</dt><dd>${escapeHtml(active.notes)}</dd></dl>`
          : ''
      }
      ${googleNote}${maplibreNote}
      <rd-select-input label="Destination list placement" options='${jsonAttr([{ value: 'right', label: 'List on right' }, { value: 'left', label: 'List on left' }])}' value="${attr(atlas.listPlacement)}" data-ref="list-placement"></rd-select-input>
    </div>`;
}

export function mapsExplorerMarkup(atlas: AtlasState): string {
  const items = MOCK_DESTINATIONS.map((dest) => ({
    id: dest.id,
    label: localizedDestinationName(dest, atlas.locale),
    meta: formatRegionLabel(dest.region),
  }));
  if (atlas.mapsPanel === 'globe') {
    return `
      <div class="da-interop-callout" role="note">
        <strong>Native custom element.</strong>
        Globe is <code>rd-three-geo-globe</code> — kept mounted while you change destinations so first-visit facing and the 180° seam stay intact.
      </div>
      ${geoExplorerMarkup(`<div class="da-globe-stage"><rd-three-geo-globe class="da-globe-stage__globe" data-ref="geo-globe"></rd-three-geo-globe></div>`, items, atlas.selectedId, atlas.listPlacement)}`;
  }
  return `
    <div class="da-interop-callout" role="note">
      <strong>Native custom element.</strong>
      Map is <code>rd-geo-map</code> hosted directly. Marker select and <code>selected-id</code> stay bound to the destination list and Settings.
    </div>
    ${geoExplorerMarkup(`<div class="da-map-stage"><rd-geo-map class="da-map-stage__map" data-ref="geo-map"></rd-geo-map>${attributionNoticeEl(mapProviderAttribution(atlas.mapProvider))}</div>`, items, atlas.selectedId, atlas.listPlacement)}`;
}

export function globeFooterMarkup(): string {
  const sources = GLOBE_TEXTURE_SOURCE_OPTIONS.map(
    (source) =>
      `<li><strong>${escapeHtml(source.label)}</strong> — ${escapeHtml(source.license)}. ${escapeHtml(source.notes)}${source.apiKeyRequired ? ' API key required.' : ''}</li>`,
  ).join('');
  return `
    <div class="da-maps-footer">
      ${attributionNoticeEl(GLOBE_EQUIRECT_ATTRIBUTION)}
      ${attributionNoticeEl(THREE_JS_ATTRIBUTION)}
      <details class="da-globe-sources">
        <summary>Future globe texture sources</summary>
        <ul>${sources}</ul>
      </details>
    </div>`;
}

export function renderMaps(atlas: AtlasState): string {
  return `
    <section class="da-panel da-maps-panel da-maps-panel--${atlas.mapsPanel} da-panel--with-tabbar">
      <div class="da-maps-panel__body">
        <div class="da-maps-toolbar" data-ref="maps-toolbar">${renderMapsToolbar(atlas)}</div>
        <nav class="da-tabbar da-maps-tabbar" aria-label="Map views">
          <button type="button" class="da-tabbar__tab da-tabbar__tab--left" data-maps-panel="map"${ariaCurrentPage(atlas.mapsPanel === 'map')}>Map</button>
          <button type="button" class="da-tabbar__tab da-tabbar__tab--right" data-maps-panel="globe"${ariaCurrentPage(atlas.mapsPanel === 'globe')}>Globe</button>
        </nav>
        <div class="da-maps-explorer" data-ref="maps-explorer">${mapsExplorerMarkup(atlas)}</div>
        ${atlas.mapsPanel === 'globe' ? globeFooterMarkup() : `<div class="da-maps-footer">${attributionNoticeEl(mapProviderAttribution(atlas.mapProvider))}</div>`}
      </div>
    </section>`;
}

export function renderMedia(atlas: AtlasState): string {
  const selected = getDestinationById(atlas.selectedId);
  const flatSelected = selected && destinationHasFlatVideo(selected) ? selected : undefined;
  const equirectSelected = selected && isEquirectDestination(selected) ? selected : undefined;
  const metadata = flatSelected
    ? [
        { label: 'Destination', value: localizedDestinationName(flatSelected, atlas.locale) },
        { label: 'Source', value: 'YouTube embed (rd-youtube-embed)' },
        { label: 'Projection', value: 'Flat / standard' },
        { label: 'Video id', value: flatSelected.youtubeId ?? '—' },
        { label: 'Region', value: flatSelected.region },
      ]
    : [];
  return `
    <section class="da-panel">
      <h2>Media</h2>
      <p>Watch flat destination videos here (YouTube). Authoring autoloads 360° library clips for twenty-six cities; upload flat or 360° sources anytime for extract.</p>
      <div class="rd-media-layout">
        <div class="rd-media-primary">
          <rd-select-input label="Destination video (YouTube)" options='${jsonAttr(FLAT_VIDEO_DESTINATIONS.map((d) => ({ value: d.id, label: localizedDestinationName(d, atlas.locale) })))}' value="${attr(flatSelected?.id ?? '')}" data-ref="media-flat"></rd-select-input>
          ${
            flatSelected?.youtubeId
              ? `<div class="da-interop-callout" role="note"><strong>Native custom element.</strong> This embed is <code>rd-youtube-embed</code> hosted directly — the same element Svelte mounts via Angular and React wraps natively.</div>
                 <rd-youtube-embed class="da-youtube rd-youtube-embed-host" video-id="${attr(flatSelected.youtubeId)}" embed-title="${attr(`${localizedDestinationName(flatSelected, atlas.locale)} — destination video`)}"></rd-youtube-embed>`
              : `<p class="da-note">Select a destination video to play the YouTube embed.</p>`
          }
          ${
            EQUIRECT_VIDEO_DESTINATIONS.length > 0
              ? `<rd-select-input label="360° video (Authoring)" options='${jsonAttr(EQUIRECT_VIDEO_DESTINATIONS.map((d) => ({ value: d.id, label: `${localizedDestinationName(d, atlas.locale)} · 360°` })))}' value="${attr(equirectSelected?.id ?? '')}" data-ref="media-360"></rd-select-input>
                 <p class="da-note">Choosing a 360° destination switches to Authoring and autoloads the library clip when available.</p>`
              : ''
          }
        </div>
        <div class="rd-media-tools">
          <section class="rd-video-metadata" aria-label="Video metadata">
            <header>Video metadata</header>
            ${
              metadata.length
                ? `<dl>${metadata.map((item) => `<div><dt>${escapeHtml(item.label)}</dt><dd>${escapeHtml(item.value)}</dd></div>`).join('')}</dl>`
                : `<p class="da-note">Select a flat video to inspect metadata.</p>`
            }
            ${
              flatSelected?.youtubeId
                ? attributionNoticeEl(youtubeVideoAttribution(flatSelected.youtubeId))
                : ''
            }
          </section>
        </div>
      </div>
    </section>`;
}

export function renderAuthoring(atlas: AtlasState): string {
  const presetOptions = [
    ...AUTHORING_OUTPUT_PRESETS.map((entry) => ({ value: entry.id, label: entry.label })),
    { value: AUTHORING_OUTPUT_CUSTOM_ID, label: 'Custom' },
  ];
  const destinationOptions = MOCK_DESTINATIONS.map((dest) => ({
    value: dest.id,
    label: `${localizedDestinationName(dest, atlas.locale)} · 360°`,
  }));
  const authoring360ShippedCount = AUTHORING_360_DISPLAY_CATALOG.filter(
    (entry) => entry.status === 'shipped',
  ).length;
  const authoring360CatalogBlock = `
    <section class="da-authoring-catalog" aria-label="360° library catalog">
      <details open>
        <summary>360° library — ${authoring360ShippedCount} shipped clips (JSON)</summary>
        <p class="da-note da-authoring-catalog__hint">
          Autoload uses <code>clipPath</code> for the selected destination.
          Run <code>npm run authoring:fetch-360</code> to generate local MP4s.
        </p>
        <pre class="da-authoring-catalog__json">${escapeHtml(authoring360CatalogJson())}</pre>
      </details>
    </section>`;
  return `
    <section class="da-panel da-panel--authoring">
      <h2>Authoring</h2>
      <rd-select-input
        label="360° destination"
        options='${jsonAttr(destinationOptions)}'
        value="${attr(atlas.selectedId)}"
        data-ref="auth-dest"
      ></rd-select-input>
      <p class="da-note da-authoring-dest-hint">
        Syncs with the header selection and autoloads the library clip when available.
        You can still click the source viewport to upload your own video.
      </p>
      ${
        authoring360Attribution(atlas.selectedId)
          ? attributionNoticeEl(authoring360Attribution(atlas.selectedId)!)
          : ''
      }
      ${authoring360CatalogBlock}
      <div class="da-authoring-workspace">
        <header class="da-authoring-workspace__headers">
          <h3 class="da-authoring-pane__title">Source</h3>
          <h3 class="da-authoring-pane__title">Output</h3>
        </header>
        <div class="da-authoring-workspace__videos">
          <div class="da-authoring-workspace__video-col da-authoring-workspace__video-col--source">
            <div class="da-authoring-source-toolbar" data-ref="auth-source-toolbar" hidden>
              <label class="da-authoring-change-file">
                <input
                  type="file"
                  class="da-authoring-choose-file__input"
                  accept="video/*"
                  data-ref="auth-file-input"
                />
                Change video file
              </label>
            </div>
          <div class="da-authoring-viewport-stage">
            <div class="da-authoring-sphere-viewport da-authoring-sphere-viewport--placeholder" data-ref="auth-pick-source">
              <label class="da-authoring-choose-file">
                <input
                  type="file"
                  class="da-authoring-choose-file__input"
                  accept="video/*"
                  data-ref="auth-file-input-initial"
                />
                Choose video file
              </label>
            </div>
            <div
              class="da-authoring-sphere-viewport da-authoring-sphere-viewport--placeholder"
              data-ref="auth-missing-source"
              hidden
            >
              <p class="da-authoring-missing-content" data-ref="auth-missing-message"></p>
            </div>
            <rd-flat-video-viewport
              class="da-authoring-flat-viewport"
              hidden
              output-width="720"
              output-height="480"
              data-ref="auth-flat-viewport"
            ></rd-flat-video-viewport>
            <rd-equirect-sphere-viewport
              class="da-authoring-sphere-viewport"
              hidden
              flip-interior
              yaw="25"
              pitch="-8"
              horizontal-fov="75"
              output-width="720"
              output-height="480"
              data-ref="auth-sphere-viewport"
            ></rd-equirect-sphere-viewport>
          </div>
          </div>
          <div class="da-authoring-workspace__video-col">
            <div
              class="da-authoring-program-preview-host da-authoring-program-preview-host--placeholder"
              data-ref="auth-output-preview"
            >
              <p class="da-authoring-output-placeholder">Choose source file to create output</p>
            </div>
          </div>
        </div>
        <div class="da-authoring-workspace__footers">
          <div class="da-authoring-pane da-authoring-pane--source" aria-label="Authoring source controls">
            <p class="da-note da-authoring-controls-placeholder" data-ref="auth-source-placeholder">
              Choose a source video to show playback and framing controls.
            </p>
            <div data-ref="auth-source-controls" hidden>
              <p class="da-note da-authoring-source-mode" data-ref="auth-mode-note"></p>
              ${renderAuthoringPlaybackBarMarkup()}
              ${renderAuthoringCameraControlsMarkup()}
              <div class="da-authoring-crop-controls" data-ref="auth-flat-controls" hidden aria-label="Crop region controls">
                <h4 class="da-authoring-crop-controls__title">Crop region</h4>
                <p class="da-note da-authoring-crop-controls__hint">
                  Drag corners for any output size (updates export dimensions live). Pick a preset to snap to
                  320×240, 640×360, or 720×480.
                </p>
                <div class="da-authoring-crop-controls__grid">
                  <rd-number-input label="Crop X" value="0" min="0" step="1" data-ref="auth-crop-x"></rd-number-input>
                  <rd-number-input label="Crop Y" value="0" min="0" step="1" data-ref="auth-crop-y"></rd-number-input>
                  <rd-number-input label="Crop width" value="640" min="2" step="2" data-ref="auth-crop-w"></rd-number-input>
                  <rd-number-input label="Crop height" value="360" min="2" step="2" data-ref="auth-crop-h"></rd-number-input>
                </div>
              </div>
            </div>
          </div>
          <div class="da-authoring-pane da-authoring-pane--output" aria-label="Authoring output controls">
            <p class="da-note da-authoring-controls-placeholder" data-ref="auth-output-placeholder">
              Output and export settings appear after you load a source video.
            </p>
            <div data-ref="auth-output-controls" hidden>
              <p class="da-note">Same view as source — live mirror scaled to export dimensions.</p>
              <p class="da-note" data-ref="auth-source-dims" hidden></p>
              <div class="da-media-extract-controls">
                <div class="da-media-extract-size-row">
                  <rd-select-input
                    class="da-media-extract-size-row__preset"
                    label="Export rectangle size"
                    value="720x480"
                    options='${jsonAttr(presetOptions)}'
                    data-ref="auth-output-preset"
                  ></rd-select-input>
                  <rd-number-input
                    class="da-media-extract-size-row__dim"
                    label="W"
                    value="720"
                    min="160"
                    max="3840"
                    step="2"
                    disabled
                    data-ref="auth-output-width"
                  ></rd-number-input>
                  <span class="da-media-extract-size-row__sep" aria-hidden="true">×</span>
                  <rd-number-input
                    class="da-media-extract-size-row__dim"
                    label="H"
                    value="480"
                    min="120"
                    max="2160"
                    step="2"
                    disabled
                    data-ref="auth-output-height"
                  ></rd-number-input>
                  <button
                    type="button"
                    class="da-media-extract-size-row__reverse"
                    data-ref="auth-reverse"
                    aria-label="Reverse playback"
                    aria-pressed="false"
                  >
                    <svg class="da-authoring-playback__icon da-authoring-playback__icon--reverse" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M7 7v10M7 17l-4-4 4-4M17 7v10M17 7l4 4-4 4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </button>
                </div>
                <div class="da-media-extract-controls__camera" data-ref="auth-out-camera" hidden>
                  <rd-number-input label="Yaw (°)" value="25" min="-180" max="180" step="0.5" data-ref="auth-out-yaw"></rd-number-input>
                  <rd-number-input label="Pitch (°)" value="-8" min="-85" max="85" step="0.5" data-ref="auth-out-pitch"></rd-number-input>
                  <rd-number-input label="Horizontal FOV (°)" value="75" min="30" max="360" step="1" data-ref="auth-out-fov"></rd-number-input>
                </div>
              </div>
              <p class="da-note da-note--filter" data-ref="auth-filter-note" hidden></p>
              <p class="da-note" data-ref="auth-range-note" hidden></p>
              <p class="da-note" data-ref="auth-record-hint">
                Waiting for source duration… extract will enable once the clip is ready.
              </p>
              <rd-select-input
                label="Extract format"
                value="mp4"
                options='[{"value":"mp4","label":"MP4 (H.264 transcode)"},{"value":"webm","label":"WebM (mirror copy)"}]'
                data-ref="auth-extract-format"
              ></rd-select-input>
              ${attributionNoticeEl(FFMPEG_WASM_ATTRIBUTION)}
              <rd-wasm-media
                label="Extract preview recording"
                operation="equirect-extract"
                extraction-mode="rectilinear"
                output-format="mp4"
                show-progress="true"
                output-width="720"
                output-height="480"
                data-ref="auth-wasm"
              ></rd-wasm-media>
              <p class="da-note" data-ref="auth-extract-busy" hidden aria-live="polite"></p>
              <div data-ref="auth-extract-result" class="da-note" hidden></div>
            </div>
          </div>
        </div>
      </div>
    </section>`;
}

export function renderIntel(atlas: AtlasState): string {
  const filtered = MOCK_NEWS.filter((article) => {
    const q = atlas.newsQuery.toLowerCase();
    const matchesQuery = !q || article.headline.toLowerCase().includes(q) || article.summary.toLowerCase().includes(q);
    const matchesRegion = !atlas.newsRegion || article.region === atlas.newsRegion;
    return matchesQuery && matchesRegion;
  });
  const selected = filtered.find((a) => a.id === atlas.selectedArticleId) ?? filtered[0];
  const regionOptions = [{ value: '', label: 'All regions' }, ...REGION_OPTIONS];
  return `
    <section class="da-panel">
      <h2>Intel</h2>
      <p>Hidden route — not in Destination Atlas nav. Palette news-discovery demo for source parity.</p>
      <div class="da-stack">
        <rd-role-gate label="Palette demo tools" status-text="Editor access" hidden-status-text="Filters require Editor or Admin." allowed-roles='["editor","admin"]' current-role="${attr(atlas.userRole)}">
          <rd-news-search-box label="Search" placeholder="Search news…" value="${attr(atlas.newsQuery)}" data-ref="news-search"></rd-news-search-box>
          <rd-news-region-select label="Region" placeholder="All regions" options='${jsonAttr(regionOptions)}' value="${attr(atlas.newsRegion)}" data-ref="news-region"></rd-news-region-select>
        </rd-role-gate>
        <rd-flex-layout direction="row" gap="16">
          <rd-news-results-table title="News results" rows='${jsonAttr(filtered)}' data-ref="news-table"></rd-news-results-table>
          <rd-news-article-detail title="${attr(selected?.headline ?? 'Article')}">
            ${selected ? `<p>${escapeHtml(selected.summary)}</p><p><em>${escapeHtml(selected.source)} · ${escapeHtml(selected.published)}</em></p>` : ''}
          </rd-news-article-detail>
        </rd-flex-layout>
      </div>
    </section>`;
}

export function renderPlan(
  atlas: AtlasState,
  trip: { start: string; end: string; duration: number },
): string {
  const destOptions = MOCK_DESTINATIONS.map((d) => ({
    value: d.id,
    label: localizedDestinationName(d, atlas.locale),
  }));
  return `
    <section class="da-panel">
      <h2>Plan</h2>
      <p>Trip planning demo — forms, invites, and timers behind role gates.</p>
      <rd-role-gate label="Trip editor" status-text="Trip editor unlocked" hidden-status-text="Plan tools require Editor or Admin role." allowed-roles='["editor","admin"]' current-role="${attr(atlas.userRole)}">
        <div class="da-stack da-stack--2">
          <rd-text-input label="Trip name" placeholder="Spring getaway"></rd-text-input>
          <rd-select-input label="Primary destination" placeholder="Select destination…" options='${jsonAttr(destOptions)}' value="${attr(atlas.selectedId)}" data-ref="trip-dest"></rd-select-input>
          <rd-date-range label="Trip dates" start-date="${attr(trip.start)}" end-date="${attr(trip.end)}" data-ref="trip-dates"></rd-date-range>
          <rd-number-input label="Trip duration (days)" value="${attr(trip.duration)}" min="1" data-ref="trip-duration"></rd-number-input>
          <rd-checkbox-input label="Share itinerary with team" default-checked></rd-checkbox-input>
          <rd-textarea-input label="Notes" placeholder="Packing list, reservations…"></rd-textarea-input>
          <rd-person-invite email-placeholder="planner@company.com"></rd-person-invite>
          <rd-role-assign summary="Confirm collaborator access for this itinerary." role-options='${jsonAttr([{ value: 'viewer', label: 'Viewer' }, { value: 'editor', label: 'Editor' }, { value: 'admin', label: 'Admin' }])}'></rd-role-assign>
          <rd-timer label="Booking countdown" interval-ms="1000"></rd-timer>
        </div>
      </rd-role-gate>
    </section>`;
}

export function renderViews(atlas: AtlasState, carouselIndex: number): string {
  const slides = MOCK_DESTINATIONS.map((dest) => ({
    id: dest.id,
    title: localizedDestinationName(dest, atlas.locale),
    subtitle: `${formatVisitorCount(dest.visitorsCurrent)} visitors · ★ ${dest.travelRating?.toFixed(1) ?? '—'}`,
    imageUrl: destinationThumbnailUrl(dest),
  }));
  const active = slides[carouselIndex] ?? slides[0];
  const dots = slides
    .map(
      (slide, index) =>
        `<button type="button" role="tab" class="rd-media-carousel__dot${index === carouselIndex ? ' rd-media-carousel__dot--active' : ''}" data-carousel-index="${index}" aria-selected="${index === carouselIndex ? 'true' : 'false'}" aria-label="${attr(slide.title)}"></button>`,
    )
    .join('');
  return `
    <section class="da-panel">
      <h2>Views</h2>
      <p>Advanced charting and media navigation — journey flows, audience overlap, 3D scatter, and destination carousel.</p>
      <div class="da-views-grid">
        ${sankeyChartMarkup('Travel journey flow', TRAVEL_JOURNEY_SANKEY.nodes, TRAVEL_JOURNEY_SANKEY.links)}
        ${vennChartMarkup('Traveler interest overlap', TRAVEL_INTEREST_VENN.sets, TRAVEL_INTEREST_VENN.overlaps)}
        <rd-three-scatter title="Destination value space (3D)" selected-id="${attr(atlas.selectedId)}"></rd-three-scatter>
        <p class="da-note">Three.js scatter stub — ${MOCK_DESTINATIONS.length} destinations (selected: ${escapeHtml(atlas.selectedId)}).</p>
        <section class="rd-media-carousel" data-testid="rd-media-carousel" aria-roledescription="carousel" aria-label="Destination highlights">
          <header class="rd-media-carousel__header">Destination highlights</header>
          <div class="rd-media-carousel__viewport">
            <button type="button" class="rd-media-carousel__nav" data-carousel-dir="-1" aria-label="Previous slide">‹</button>
            <figure class="rd-media-carousel__slide">
              <img src="${attr(active?.imageUrl ?? '')}" alt="${attr(active?.title ?? '')}" class="rd-media-carousel__image" />
              <figcaption class="rd-media-carousel__caption"><strong>${escapeHtml(active?.title ?? '')}</strong>${active?.subtitle ? `<span>${escapeHtml(active.subtitle)}</span>` : ''}</figcaption>
            </figure>
            <button type="button" class="rd-media-carousel__nav" data-carousel-dir="1" aria-label="Next slide">›</button>
          </div>
          <div class="rd-media-carousel__dots" role="tablist" aria-label="Carousel slides">${dots}</div>
        </section>
      </div>
    </section>`;
}

export function renderStack(atlas: AtlasState): string {
  const secrets = getConsumerSecrets();
  const STACK_ENV_KEYS = ['DATABASE_URL', 'GOOGLE_MAPS_KEY', 'FEATURE_FLAGS'];
  const keyStatus = secrets.stackKeyStatus(STACK_ENV_KEYS);
  const infra = [
    { label: 'Analytics DB', kind: 'PostgreSQL', envKey: 'DATABASE_URL', table: 'destinations' },
    { label: 'Sessions', kind: 'MongoDB', envKey: 'MONGODB_URI', table: 'sessions' },
    { label: 'Legacy CRM', kind: 'MySQL', envKey: 'MYSQL_URL', table: 'contacts' },
    { label: 'Supabase', kind: 'Supabase', envKey: 'SUPABASE_URL', table: 'profiles' },
    { label: 'API (Nest)', kind: 'Nest', envKey: '', table: 'api' },
    { label: 'API (Express)', kind: 'Express', envKey: '', table: 'api' },
    { label: 'Web (Next.js)', kind: 'Next', envKey: '', table: '' },
    { label: 'Web (Nuxt)', kind: 'Nuxt', envKey: '', table: '' },
  ];
  return `
    <section class="da-panel">
      <h2>Stack</h2>
      <p>Read-only infra configuration demo for export wizard nodes. Integration keys reflect BYOK status from Settings.</p>
      <rd-role-gate label="Infrastructure stack" current-role="${attr(atlas.userRole)}" allowed-roles='["admin"]' status-text="Admin infrastructure panel" hidden-status-text="Stack configuration is restricted to Admin. Switch role in the header to inspect infra nodes.">
        <div class="da-infra-grid">
          <section class="rd-env">
            <header>EnvConfig</header>
            <ul class="rd-env__keys">${keyStatus.map((entry) => `<li class="rd-env__key-row"><code>${escapeHtml(entry.envKey)}</code><span class="rd-env__key-state${entry.configured ? ' rd-env__key-state--configured' : ' rd-env__key-state--missing'}">${entry.configured ? 'configured' : 'not set'}</span></li>`).join('')}</ul>
          </section>
          ${infra
            .map(
              (node) => `
            <article class="rd-infra">
              <h3>${escapeHtml(node.label)}</h3>
              <p>${escapeHtml(node.kind)}${node.table ? ` · ${escapeHtml(node.table)}` : ''}</p>
              ${node.envKey ? `<p class="da-note"><code>${escapeHtml(node.envKey)}</code></p>` : ''}
            </article>`,
            )
            .join('')}
        </div>
      </rd-role-gate>
    </section>`;
}

function byokFields(fields: ReturnType<typeof getConsumerSecrets>['integrationFields']): string {
  const secrets = getConsumerSecrets();
  return fields
    .map((field) => {
      const status = secrets.hasConfiguredKey(field.envKey)
        ? '<span class="da-byok-field__status da-byok-field__status--ok">configured</span>'
        : field.sensitive
          ? '<span class="da-byok-field__status">not set</span>'
          : '';
      return `
        <div class="da-byok-field">
          <rd-text-input id="byok-${attr(field.envKey)}" label="${attr(field.label)}" placeholder="${attr(field.placeholder ?? '')}" input-type="${field.sensitive ? 'password' : 'text'}" value="${attr(secrets.getDraftValue(field.envKey))}" data-byok-key="${attr(field.envKey)}"></rd-text-input>
          <p class="da-byok-field__desc">${escapeHtml(field.description)}</p>
          <p class="da-byok-field__meta">Env key: <code>${escapeHtml(field.envKey)}</code>
            ${field.optional ? '<span class="da-byok-field__optional">optional</span>' : ''}
            ${status}
          </p>
        </div>`;
    })
    .join('');
}

function byokVaultActions(secrets: ReturnType<typeof getConsumerSecrets>): string {
  return `
    ${!secrets.loaded ? '<p class="da-note">Loading encrypted key vault…</p>' : ''}
    <label class="da-byok-remember"><input type="checkbox" data-ref="remember-keys"${secrets.rememberKeys ? ' checked' : ''} /> Remember keys in this browser (localStorage + encryption)</label>
    <div class="da-byok-actions">
      <button type="button" class="rd-button" data-ref="save-keys"${secrets.loaded ? '' : ' disabled'}>Save keys</button>
      <button type="button" class="rd-button rd-button--ghost" data-ref="clear-keys">Clear keys</button>
    </div>
    ${secrets.saveMessage ? `<p class="da-byok-save-msg">${escapeHtml(secrets.saveMessage)}</p>` : ''}`;
}

export function renderSettings(atlas: AtlasState, theme: ThemePreference): string {
  const secrets = getConsumerSecrets();
  const highlight = isSettingFieldTarget(atlas.highlightTarget) ? atlas.highlightTarget : null;
  const cellClass = (key: string) =>
    `da-context-grid__cell${highlight === key ? ' rd-highlight-target' : ''}`;
  const destOptions = MOCK_DESTINATIONS.map((dest) => ({
    value: dest.id,
    label: localizedDestinationName(dest, atlas.locale),
  }));
  return `
    <section class="da-panel da-settings-panel">
      <div class="da-settings-head">
        <h2>Settings</h2>
        <label class="da-theme-toggle${atlas.highlightTarget === 'theme' ? ' rd-highlight-target' : ''}" data-ref="theme-toggle">
          <span>Theme</span>
          <select data-ref="theme-select" aria-label="Color theme">
            <option value="system"${theme === 'system' ? ' selected' : ''}>System</option>
            <option value="light"${theme === 'light' ? ' selected' : ''}>Light</option>
            <option value="dark"${theme === 'dark' ? ' selected' : ''}>Dark</option>
          </select>
        </label>
      </div>
      <div class="da-settings-preferences" data-ref="settings-preferences">
        <div class="da-context-grid">
          <div data-setting="role" class="${cellClass('role')}">
            <rd-select-input label="Role" options='${jsonAttr(ATLAS_USER_ROLES.map((r) => ({ value: r.id, label: r.label })))}' value="${attr(atlas.userRole)}" data-ref="settings-role"></rd-select-input>
            <p class="da-context-grid__hint">Preview permissions for gated screens.</p>
          </div>
          <div data-setting="locale" class="${cellClass('locale')}">
            <rd-app-language-select data-ref="app-language-select"></rd-app-language-select>
            <p class="da-context-grid__hint">Base locale for developer-owned destination labels.</p>
          </div>
          <div data-setting="map" class="${cellClass('map')}">
            <rd-select-input label="Map provider" options='${jsonAttr(GEO_MAP_PROVIDERS.map((p) => ({ value: p.id, label: p.label })))}' value="${attr(atlas.mapProvider)}" data-ref="settings-map-provider"></rd-select-input>
            <p class="da-context-grid__hint">Default 2D map engine for the Map screen.</p>
          </div>
          <div data-setting="selected" class="${cellClass('selected')}">
            <rd-select-input label="Selected" options='${jsonAttr(destOptions)}' value="${attr(atlas.selectedId)}" data-ref="settings-selected"></rd-select-input>
            <p class="da-context-grid__hint">Active destination across tabs and URL state.</p>
          </div>
        </div>
      </div>
      <div data-ref="integrations" class="${atlas.highlightTarget === 'integrations' ? 'rd-highlight-target' : ''}">
        <rd-collapsible class="da-byok-collapsible" title="Integration keys (BYOK)" summary="Google Maps, MapTiler, optional keys"${atlas.integrationsOpen ? ' open' : ''}>
          <rd-role-gate label="Integration keys (BYOK)" current-role="${attr(atlas.userRole)}" allowed-roles='["admin"]' status-text="Admin can manage API keys for maps, integrations, and Stack" hidden-status-text="Integration keys are read-only for ${attr(roleLabel(atlas.userRole as AtlasUserRole))}. Switch to Admin to configure BYOK.">
            <div class="da-byok-fields">${byokFields(secrets.integrationFields)}</div>
            ${byokVaultActions(secrets)}
          </rd-role-gate>
        </rd-collapsible>
      </div>
      <div data-ref="ai-settings" class="${atlas.highlightTarget === 'ai' ? 'rd-highlight-target' : ''}">
        <rd-collapsible class="da-byok-collapsible" title="AI providers (BYOK)" summary="OpenAI, Anthropic, Gemini, Azure, Ollama"${atlas.aiOpen ? ' open' : ''}>
          <rd-role-gate label="AI providers (BYOK)" current-role="${attr(atlas.userRole)}" allowed-roles='["admin"]' status-text="Admin can manage AI provider keys" hidden-status-text="AI keys are read-only for ${attr(roleLabel(atlas.userRole as AtlasUserRole))}. Switch to Admin to configure BYOK.">
            <div class="da-byok-fields">${byokFields(secrets.aiFields)}</div>
            ${byokVaultActions(secrets)}
          </rd-role-gate>
        </rd-collapsible>
      </div>
      <div class="da-settings-feedback" data-ref="feedback">
        <rd-textarea-input label="Feedback" placeholder="This is a demonstration, and feedback is not functional here." value="${attr(atlas.feedbackDraft)}" data-ref="feedback-draft"></rd-textarea-input>
        <div class="da-settings-feedback__actions">
          <button type="button" class="rd-button" data-ref="send-feedback">Submit feedback</button>
        </div>
        ${atlas.feedbackSent ? '<p class="da-settings-feedback__msg">Hope you like the app, please leave comments on github.</p>' : ''}
      </div>
    </section>`;
}

export function contextSummaryMarkup(
  atlas: AtlasState,
  theme: ThemePreference,
): string {
  const selected = getDestinationById(atlas.selectedId);
  const mapLabel = GEO_MAP_PROVIDERS.find((entry) => entry.id === atlas.mapProvider)?.label ?? atlas.mapProvider;
  const selectedLabel = selected ? localizedDestinationName(selected, atlas.locale) : 'None';
  const localeEntry = DEFAULT_APP_LOCALES.find((entry) => entry.code === atlas.locale);
  const localeLabel = localeEntry
    ? localeEntry.nativeLabel
      ? `${localeEntry.label} (${localeEntry.nativeLabel})`
      : localeEntry.label
    : atlas.locale;
  const chips = [
    { key: 'role', label: 'Role', value: roleLabel(atlas.userRole) },
    { key: 'locale', label: 'App locale', value: localeLabel },
    { key: 'map', label: 'Map provider', value: mapLabel },
    { key: 'selected', label: 'Selected', value: selectedLabel },
    { key: 'theme', label: 'Theme', value: themeLabel(theme) },
  ];
  return chips
    .map(
      (chip) => `
      <button type="button" class="da-context-chip" data-setting-chip="${chip.key}">
        <span class="da-context-chip__label">${escapeHtml(chip.label)}</span>
        <strong class="da-context-chip__value">${escapeHtml(chip.value)}</strong>
      </button>`,
    )
    .join('');
}

export function routerModeMarkup(mode: ClientRouterMode): string {
  const options = CLIENT_ROUTER_MODE_OPTIONS.map(
    (option) => `<option value="${attr(option.id)}"${option.id === mode ? ' selected' : ''}>${escapeHtml(option.label)}</option>`,
  ).join('');
  return `
    <label class="da-router-mode">
      <span>Router</span>
      <select data-ref="router-mode" aria-label="Client router mode">${options}</select>
    </label>`;
}
