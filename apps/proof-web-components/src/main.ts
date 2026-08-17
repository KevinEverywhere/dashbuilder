import { registerRosettaDashElements } from '@rosettadash/web-components';
import '../../../packages/web-components/src/styles/styles.css';

import {
  DEFAULT_APP_LOCALES,
  DESTINATION_ATLAS_ABOUT_INTRO,
  DESTINATION_ATLAS_CURRENT_RUNTIME_BADGE,
  DESTINATION_ATLAS_RUNTIME_GUIDES,
  DESTINATION_ATLAS_RUNTIME_MATRIX_COLUMNS,
  DESTINATION_ATLAS_SCREENS,
  DEFAULT_WORLD_EQUIRECT_ATTRIBUTION,
  DEFAULT_WORLD_EQUIRECT_URL,
  GEO_MAP_PROVIDERS,
  MOCK_DESTINATIONS,
  formatVisitorCount,
  type Destination,
  type DestinationAtlasRuntimeId,
  type DestinationAtlasScreenId,
  type GeoMapProvider,
} from '@destination-atlas';

import {
  MOCK_NEWS,
  REGION_OPTIONS,
  TIME_PRESETS,
  aggregateVisitorTrend,
  computeVisitorDelta,
  filterDestinations,
  formatRegionLabel,
  localizedDestinationName,
} from './atlas-utils.js';

const CURRENT_RUNTIME_ID: DestinationAtlasRuntimeId = 'web-components';

type UserRole = 'viewer' | 'editor' | 'admin';

interface AppState {
  screen: DestinationAtlasScreenId;
  mapsPanel: 'map' | 'globe';
  selectedId: string;
  locale: string;
  mapProvider: GeoMapProvider;
  userRole: UserRole;
  destSearch: string;
  destRegion: string;
  timePreset: string;
  visitPeriodStart: string;
  visitPeriodEnd: string;
  newsQuery: string;
  newsRegion: string;
  selectedArticleId: string;
}

const state: AppState = {
  screen: 'overview',
  mapsPanel: 'map',
  selectedId: MOCK_DESTINATIONS[0]?.id ?? '',
  locale: 'en',
  mapProvider: 'leaflet',
  userRole: 'admin',
  destSearch: '',
  destRegion: '',
  timePreset: '5y',
  visitPeriodStart: '2019-01',
  visitPeriodEnd: '2024-12',
  newsQuery: '',
  newsRegion: '',
  selectedArticleId: '',
};

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';

registerRosettaDashElements();

function renderAbout(): string {
  const matrixHead = DESTINATION_ATLAS_RUNTIME_MATRIX_COLUMNS.map(
    (column) => `<span>${column.label}</span>`,
  ).join('');

  const runtimeRows = DESTINATION_ATLAS_RUNTIME_GUIDES.map((runtime) => {
    const isCurrent = runtime.id === CURRENT_RUNTIME_ID;
    return `
      <li class="da-about__runtime-card${isCurrent ? ' da-about__runtime-card--current' : ''}"${isCurrent ? ' aria-current="true"' : ''}>
        <header>
          <h4>${runtime.label}</h4>
          ${isCurrent ? `<span class="da-about__runtime-current-badge">${DESTINATION_ATLAS_CURRENT_RUNTIME_BADGE}</span>` : ''}
        </header>
        <p>${runtime.summary}</p>
        <div class="da-about__runtime-matrix">
          <div class="da-about__runtime-matrix-col"><code>${runtime.npmPackage}</code></div>
          <div class="da-about__runtime-matrix-col"><code>${runtime.proofCommand}</code></div>
          <div class="da-about__runtime-matrix-col"><code>${runtime.storybookCommand}</code></div>
        </div>
      </li>`;
  }).join('');

  return `
    <section class="da-panel da-panel--about">
      <h2>About Destination Atlas</h2>
      <p class="da-about__lead">${DESTINATION_ATLAS_ABOUT_INTRO.lead}</p>
      <div class="da-about__runtime-matrix-wrap">
        <div class="da-about__runtime-matrix-head" aria-hidden="true">${matrixHead}</div>
        <ul class="da-about__runtime-list">${runtimeRows}</ul>
      </div>
    </section>`;
}

function renderOverview(): string {
  const kpiCards = MOCK_DESTINATIONS.map(
    (dest) =>
      `<rd-kpi-card title="${localizedDestinationName(dest, state.locale)}" value="${formatVisitorCount(dest.visitorsCurrent)}" delta="${computeVisitorDelta(dest)}"></rd-kpi-card>`,
  ).join('');

  return `
    <section class="da-panel">
      <h2>Overview</h2>
      <p>Current visitor KPIs and historic trends across sample destinations.</p>
      <div class="da-stack">
        <rd-grid-layout title="Destination KPIs" columns="3" gap="12">${kpiCards}</rd-grid-layout>
        <div class="da-stack da-stack--2">
          <rd-line-chart title="Visitors over time (aggregate trend)"></rd-line-chart>
          <rd-bar-chart title="2024 visitors by destination"></rd-bar-chart>
        </div>
        <rd-role-gate label="Operations metrics" status-text="Admin operations panel" allowed-roles='["admin"]'>
          <rd-metric-chip chip-label="Avg. stay" chip-value="4.2 nights"></rd-metric-chip>
          <rd-status-badge status-text="Data freshness: current" tone="success"></rd-status-badge>
        </rd-role-gate>
      </div>
    </section>`;
}

function renderDestinations(): string {
  const filtered = filterDestinations(state.locale, state.destSearch, state.destRegion);
  const rows = filtered.map((dest) => ({
    id: dest.id,
    name: localizedDestinationName(dest, state.locale),
    status: dest.region,
    amount: dest.visitorsCurrent,
    date: state.timePreset,
  }));
  const selected = MOCK_DESTINATIONS.find((d) => d.id === state.selectedId);

  return `
    <section class="da-panel">
      <h2>Destinations</h2>
      <p>Browse destinations with filters, table selection, and detail panel.</p>
      <div class="da-stack">
        <div class="da-filter-row">
          <rd-input-text label="Search" placeholder="Destination name…" data-ref="dest-search"></rd-input-text>
          <rd-input-select label="Region" placeholder="All regions" data-ref="dest-region"></rd-input-select>
          <rd-input-date-range label="Visit period" start-date="${state.visitPeriodStart}" end-date="${state.visitPeriodEnd}" data-ref="visit-period"></rd-input-date-range>
        </div>
        <rd-time-preset label="Historic window" presets='${JSON.stringify(TIME_PRESETS)}' active-preset-id="${state.timePreset}" data-ref="time-preset"></rd-time-preset>
        <rd-flex-layout direction="row" gap="16">
          <rd-data-table title="Destinations" rows='${JSON.stringify(rows)}' data-ref="dest-table"></rd-data-table>
          <rd-detail-panel title="Destination detail" data-ref="dest-detail">
            ${
              selected
                ? `<div class="da-detail-card">
                    <h3>${localizedDestinationName(selected, state.locale)}</h3>
                    <p>${formatRegionLabel(selected.region)} · ${formatVisitorCount(selected.visitorsCurrent)} visitors</p>
                    <ul>${selected.visitorsHistoric.map((h) => `<li>${h.year}: ${formatVisitorCount(h.visitors)}</li>`).join('')}</ul>
                   </div>`
                : ''
            }
          </rd-detail-panel>
        </rd-flex-layout>
      </div>
    </section>`;
}

function renderMapPanel(): string {
  const active = GEO_MAP_PROVIDERS.find((p) => p.id === state.mapProvider);
  return `
    <p>2D slippy map with developer-selectable provider.</p>
    <div class="da-provider-select">
      <label for="map-provider">Map provider</label>
      <select id="map-provider" data-map-provider>
        ${GEO_MAP_PROVIDERS.map((p) => `<option value="${p.id}" ${p.id === state.mapProvider ? 'selected' : ''}>${p.label}</option>`).join('')}
      </select>
    </div>
    ${active ? `<p class="da-note">${active.notes}</p>` : ''}
    <rd-geo-map class="da-geo-map" data-ref="geo-map"></rd-geo-map>
  `;
}

function renderGlobePanel(): string {
  return `
    <p>Three.js globe with destination markers — click a marker to select.</p>
    <rd-three-geo-globe title="Destination globe (Three.js)" texture-url="${DEFAULT_WORLD_EQUIRECT_URL}" data-ref="geo-globe"></rd-three-geo-globe>
    <p class="da-note">${DEFAULT_WORLD_EQUIRECT_ATTRIBUTION}</p>
  `;
}

function renderMaps(): string {
  return `
    <section class="da-panel">
      <h2>Maps</h2>
      <rd-tabs-layout tabs='[{"id":"map","label":"Map"},{"id":"globe","label":"Globe"}]' active-tab-id="${state.mapsPanel}" data-ref="maps-tabs"></rd-tabs-layout>
      <div class="da-maps-body">${state.mapsPanel === 'map' ? renderMapPanel() : renderGlobePanel()}</div>
    </section>`;
}

function renderMedia(): string {
  return `
    <section class="da-panel">
      <h2>Media</h2>
      <p>YouTube embed and local video source for destination highlights.</p>
      <rd-input-select label="Destination video" data-ref="media-dest"></rd-input-select>
      <rd-youtube-embed class="da-youtube" data-ref="youtube-embed"></rd-youtube-embed>
      <rd-video-source label="Local / file video source" data-ref="video-source"></rd-video-source>
    </section>`;
}

function renderAuthoring(): string {
  return `
    <section class="da-panel">
      <h2>Authoring</h2>
      <p>Upload source video, preview equirect crop, and extract with ffmpeg.wasm.</p>
      <div class="da-stack">
        <rd-video-source label="Upload source video" data-ref="authoring-source"></rd-video-source>
        <rd-equirect-viewport label="Equirect preview" data-ref="equirect-viewport"></rd-equirect-viewport>
        <rd-wasm-media label="Extract output" data-ref="wasm-media"></rd-wasm-media>
      </div>
    </section>`;
}

function renderIntel(): string {
  const filtered = MOCK_NEWS.filter((article) => {
    const q = state.newsQuery.toLowerCase();
    const matchesQuery =
      !q ||
      article.headline.toLowerCase().includes(q) ||
      article.summary.toLowerCase().includes(q);
    const matchesRegion = !state.newsRegion || article.region === state.newsRegion;
    return matchesQuery && matchesRegion;
  });
  const selected = filtered.find((a) => a.id === state.selectedArticleId) ?? filtered[0];

  return `
    <section class="da-panel">
      <h2>Intel</h2>
      <p>Regional news discovery with mock headlines.</p>
      <div class="da-stack">
        <rd-role-gate label="News editor tools" status-text="Editor access" allowed-roles='["editor","admin"]'>
          <rd-news-search-box label="Search" placeholder="Search news…" value="${state.newsQuery}" data-ref="news-search"></rd-news-search-box>
          <rd-news-region-select label="Region" placeholder="All regions" data-ref="news-region"></rd-news-region-select>
        </rd-role-gate>
        <rd-flex-layout direction="row" gap="16">
          <rd-news-results-table title="News results" rows='${JSON.stringify(filtered)}' data-ref="news-table"></rd-news-results-table>
          <rd-news-article-detail title="${selected?.headline ?? 'Article'}" data-ref="news-detail">
            ${selected ? `<p>${selected.summary}</p><p><em>${selected.source} · ${selected.published}</em></p>` : ''}
          </rd-news-article-detail>
        </rd-flex-layout>
      </div>
    </section>`;
}

function renderPlan(): string {
  const destOptions = MOCK_DESTINATIONS.map((d) => ({
    value: d.id,
    label: localizedDestinationName(d, state.locale),
  }));

  return `
    <section class="da-panel">
      <h2>Plan trip</h2>
      <p>Trip planning, collaboration, and role-gated editor access.</p>
      <div class="da-stack">
        <rd-role-gate label="Trip editor" status-text="Editor workspace unlocked" allowed-roles='["editor","admin"]'>
          <rd-person-invite email-placeholder="planner@company.com"></rd-person-invite>
          <rd-role-assign summary="Confirm collaborator access for this itinerary." role-options='[{"value":"viewer","label":"Viewer"},{"value":"editor","label":"Editor"},{"value":"admin","label":"Admin"}]'></rd-role-assign>
          <rd-input-text label="Trip name" placeholder="Spring heritage tour" data-ref="trip-name"></rd-input-text>
          <rd-input-select label="Primary destination" placeholder="Select destination…" options='${JSON.stringify(destOptions)}' data-ref="trip-dest"></rd-input-select>
          <rd-input-date-range label="Trip dates" start-date="${state.visitPeriodStart}" end-date="${state.visitPeriodEnd}"></rd-input-date-range>
          <rd-input-number label="Travelers" value="2" min="1"></rd-input-number>
          <rd-input-checkbox label="Share itinerary with team" default-checked></rd-input-checkbox>
          <rd-input-textarea label="Notes" placeholder="Visa requirements, rail passes…"></rd-input-textarea>
        </rd-role-gate>
        <rd-timer label="Itinerary refresh" tick-count="3"></rd-timer>
      </div>
    </section>`;
}

function renderViews(): string {
  return `
    <section class="da-panel">
      <h2>Views</h2>
      <p>Chart placeholders for journey and distribution views.</p>
      <div class="da-stack da-stack--2">
        <rd-pie-chart title="Visitor share by region"></rd-pie-chart>
        <rd-line-chart title="Seasonal trend"></rd-line-chart>
      </div>
    </section>`;
}

function renderStack(): string {
  return `
    <section class="da-panel">
      <h2>Stack</h2>
      <p class="da-note">Infra panels (EnvConfig, database nodes, server scaffolds) ship in framework runtimes — out of scope for Web Components proof.</p>
    </section>`;
}

function renderSettings(): string {
  return `
    <section class="da-panel">
      <h2>Settings</h2>
      <p>App base locale for developer i18n (<code>domain.i18n.app-language-select</code>).</p>
      <rd-app-language-select data-ref="app-language-select"></rd-app-language-select>
      <p class="da-note">Demo: destination names use <code>labels[locale]</code> from mock data when available.</p>
    </section>`;
}

const SCREEN_RENDERERS: Record<DestinationAtlasScreenId, () => string> = {
  about: renderAbout,
  overview: renderOverview,
  destinations: renderDestinations,
  maps: renderMaps,
  media: renderMedia,
  authoring: renderAuthoring,
  intel: renderIntel,
  plan: renderPlan,
  views: renderViews,
  stack: renderStack,
  settings: renderSettings,
};

function buildMapMarkers(): Array<{ id: string; lat: number; lng: number; label: string }> {
  return MOCK_DESTINATIONS.map((dest) => ({
    id: dest.id,
    lat: dest.lat,
    lng: dest.lng,
    label: localizedDestinationName(dest, state.locale),
  }));
}

function mapView(): { lat: number; lng: number; zoom: number } {
  const selected = MOCK_DESTINATIONS.find((dest) => dest.id === state.selectedId);
  if (selected) {
    return { lat: selected.lat, lng: selected.lng, zoom: 5 };
  }
  return { lat: 20, lng: 0, zoom: 2 };
}

function wireGeoMap(root: HTMLElement): void {
  const geoMap = root.querySelector('[data-ref="geo-map"]');
  if (!geoMap) return;
  const view = mapView();
  geoMap.setAttribute('provider', state.mapProvider);
  geoMap.setAttribute('center', JSON.stringify({ lat: view.lat, lng: view.lng }));
  geoMap.setAttribute('zoom', String(view.zoom));
  geoMap.setAttribute('markers', JSON.stringify(buildMapMarkers()));
  geoMap.setAttribute('selected-id', state.selectedId);
  if (state.mapProvider === 'google-maps' && GOOGLE_MAPS_API_KEY) {
    geoMap.setAttribute('api-key', GOOGLE_MAPS_API_KEY);
  }
  geoMap.addEventListener('marker-select', (event) => {
    state.selectedId = (event as CustomEvent<{ id: string }>).detail.id;
    render();
  });
}

function wireGlobe(root: HTMLElement): void {
  const globe = root.querySelector('[data-ref="geo-globe"]');
  if (!globe) return;
  globe.setAttribute('markers', JSON.stringify(buildMapMarkers()));
  globe.setAttribute('selected-id', state.selectedId);
  globe.addEventListener('marker-select', (event) => {
    state.selectedId = (event as CustomEvent<{ id: string }>).detail.id;
    render();
  });
}

function wireMapsTabs(root: HTMLElement): void {
  root.querySelector('[data-ref="maps-tabs"]')?.addEventListener('tab-change', (event) => {
    state.mapsPanel = (event as CustomEvent<{ tabId: 'map' | 'globe' }>).detail.tabId;
    render();
  });
}

function wireDestinations(root: HTMLElement): void {
  const search = root.querySelector('[data-ref="dest-search"]');
  search?.addEventListener('value-change', (event) => {
    state.destSearch = (event as CustomEvent<{ value: string }>).detail.value;
    render();
  });

  const region = root.querySelector('[data-ref="dest-region"]');
  region?.setAttribute('options', JSON.stringify([{ value: '', label: 'All regions' }, ...REGION_OPTIONS]));
  region?.setAttribute('value', state.destRegion);
  region?.addEventListener('value-change', (event) => {
    state.destRegion = (event as CustomEvent<{ value: string }>).detail.value;
    render();
  });

  root.querySelector('[data-ref="time-preset"]')?.addEventListener('preset-change', (event) => {
    state.timePreset = (event as CustomEvent<{ presetId: string }>).detail.presetId;
    render();
  });

  root.querySelector('[data-ref="dest-table"]')?.addEventListener('row-select', (event) => {
    state.selectedId = (event as CustomEvent<{ id: string }>).detail.id;
    render();
  });
}

function wireIntel(root: HTMLElement): void {
  root.querySelector('[data-ref="news-search"]')?.addEventListener('search', (event) => {
    state.newsQuery = (event as CustomEvent<{ query: string }>).detail.query;
    render();
  });

  const region = root.querySelector('[data-ref="news-region"]');
  region?.setAttribute('options', JSON.stringify([{ value: '', label: 'All regions' }, ...REGION_OPTIONS]));
  region?.setAttribute('value', state.newsRegion);
  region?.addEventListener('value-change', (event) => {
    state.newsRegion = (event as CustomEvent<{ value: string }>).detail.value;
    render();
  });

  root.querySelector('[data-ref="news-table"]')?.addEventListener('row-select', (event) => {
    state.selectedArticleId = (event as CustomEvent<{ id: string }>).detail.id;
    render();
  });
}

function wireMedia(root: HTMLElement): void {
  const select = root.querySelector('[data-ref="media-dest"]');
  const withVideo = MOCK_DESTINATIONS.filter((d) => d.youtubeId);
  select?.setAttribute(
    'options',
    JSON.stringify(withVideo.map((d) => ({ value: d.id, label: localizedDestinationName(d, state.locale) }))),
  );
  select?.setAttribute('value', state.selectedId);
  select?.addEventListener('value-change', (event) => {
    state.selectedId = (event as CustomEvent<{ value: string }>).detail.value;
    render();
  });

  const embed = root.querySelector('[data-ref="youtube-embed"]');
  const selected = MOCK_DESTINATIONS.find((d) => d.id === state.selectedId);
  if (embed && selected?.youtubeId) {
    embed.setAttribute('video-id', selected.youtubeId);
    embed.setAttribute('embed-title', `${localizedDestinationName(selected, state.locale)} — destination video`);
  }
}

function wireSettings(root: HTMLElement): void {
  const languageSelect = root.querySelector('[data-ref="app-language-select"]');
  if (!languageSelect) return;
  languageSelect.setAttribute('locales', JSON.stringify(DEFAULT_APP_LOCALES));
  languageSelect.setAttribute('value', state.locale);
  languageSelect.setAttribute('label', 'App language');
  languageSelect.setAttribute('placeholder', 'Select language…');
  languageSelect.addEventListener('locale-change', (event) => {
    state.locale = (event as CustomEvent<{ locale: string }>).detail.locale;
    render();
  });
}

function render(): void {
  const root = document.getElementById('app');
  if (!root) return;

  const nav = DESTINATION_ATLAS_SCREENS.flatMap((s) => {
    if (s.id === 'settings') {
      return [
        `<button type="button" data-screen="settings">Settings</button>`,
        `<select data-role aria-label="User role">
          <option value="viewer" ${state.userRole === 'viewer' ? 'selected' : ''}>Viewer</option>
          <option value="editor" ${state.userRole === 'editor' ? 'selected' : ''}>Editor</option>
          <option value="admin" ${state.userRole === 'admin' ? 'selected' : ''}>Admin</option>
        </select>`,
      ];
    }
    return [
      `<button type="button" data-screen="${s.id}" aria-current="${state.screen === s.id ? 'page' : 'false'}">${s.label}</button>`,
    ];
  }).join('');

  root.innerHTML = `
    <div class="da-shell">
      <header class="da-header">
        <h1>Destination Atlas</h1>
        <p>Web Components proof — full Destination Atlas UX with <code>&lt;rd-*&gt;</code> custom elements</p>
        <div class="da-locale-bar">
          <span>Locale: <strong>${state.locale}</strong></span>
          <span>Role: <strong>${state.userRole}</strong></span>
          <span>Selected: <strong>${state.selectedId || 'none'}</strong></span>
        </div>
      </header>
      <nav class="da-nav" aria-label="Screens">${nav}</nav>
      ${SCREEN_RENDERERS[state.screen]()}
    </div>
  `;

  root.querySelectorAll('[data-screen]').forEach((el) => {
    el.addEventListener('click', () => {
      state.screen = (el as HTMLElement).dataset.screen as DestinationAtlasScreenId;
      render();
    });
  });

  root.querySelector('[data-role]')?.addEventListener('change', (event) => {
    state.userRole = (event.target as HTMLSelectElement).value as UserRole;
    render();
  });

  root.querySelector('[data-map-provider]')?.addEventListener('change', (event) => {
    state.mapProvider = (event.target as HTMLSelectElement).value as GeoMapProvider;
    render();
  });

  if (state.screen === 'maps') {
    wireMapsTabs(root);
    if (state.mapsPanel === 'map') wireGeoMap(root);
    else wireGlobe(root);
  }
  if (state.screen === 'destinations') wireDestinations(root);
  if (state.screen === 'intel') wireIntel(root);
  if (state.screen === 'media') wireMedia(root);
  if (state.screen === 'settings') wireSettings(root);
}

render();
