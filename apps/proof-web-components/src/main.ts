import { registerRosettaDashElements } from '@rosettadash/web-components';
import '../../../packages/web-components/src/styles/styles.css';
import {
  buildAtlasLocation,
  DEFAULT_CLIENT_ROUTER_MODE,
  CLIENT_ROUTER_MODE_OPTIONS,
  type ClientRouterMode,
} from '@rosettadash/core';
import {
  DEFAULT_APP_LOCALES,
  fetchNewsAdminStatus,
  refreshNewsCache,
  DEFAULT_WORLD_EQUIRECT_URL,
  DESTINATION_ATLAS_NAV_SCREENS,
  DESTINATION_ATLAS_SCREENS,
  MOCK_DESTINATIONS,
  getDestinationById,
  type DestinationAtlasScreenId,
} from '@destination-atlas';
import { resetAuthoringWiring, wireAuthoringPipeline } from './authoring-wiring.js';
import { destinationListMarkup, scrollDestinationListToSelection } from './geo-explorer.js';
import { createDestinationAtlasState } from './lib/atlas-state.js';
import { ensureIntelFeed } from './lib/intel-feed.js';
import { getConsumerSecrets, subscribeSecrets } from './lib/consumer-secrets.js';
import { formatRegionLabel, localizedDestinationName } from './atlas-utils.js';
import { resolveMapLocationQuery } from './lib/map-location.js';
import { screenAllowedForRole } from './lib/roles.js';
import { subscribeRouter } from './lib/router.js';
import { createThemePreference, type ThemePreference } from './lib/theme.js';
import {
  contextSummaryMarkup,
  globeFooterMarkup,
  mapsExplorerMarkup,
  renderAbout,
  renderAuthoring,
  renderDestinations,
  renderIntel,
  renderMaps,
  renderMapsToolbar,
  renderMedia,
  renderOverview,
  renderPlan,
  renderSettings,
  renderStack,
  renderViews,
  routerModeMarkup,
} from './screens.js';
import { SCREEN_SOURCES } from './screens/sources.js';

registerRosettaDashElements();

const STORAGE_ROUTER = 'rosettadash.clientRouterMode';
const initialDestId = MOCK_DESTINATIONS[0]?.id ?? '';
const atlas = createDestinationAtlasState(initialDestId);
const themeStore = createThemePreference();
let routerMode: ClientRouterMode = (() => {
  const stored = localStorage.getItem(STORAGE_ROUTER);
  if (stored && CLIENT_ROUTER_MODE_OPTIONS.some((option) => option.id === stored)) {
    return stored as ClientRouterMode;
  }
  return DEFAULT_CLIENT_ROUTER_MODE;
})();

const mounted = {
  shell: false,
  screen: '' as DestinationAtlasScreenId | '',
  mapsPanel: '' as 'map' | 'globe' | '',
};

let carouselIndex = 0;
let tripStart = '2026-04-10';
let tripEnd = '2026-04-17';
let tripDuration = 8;

function setRouterMode(mode: ClientRouterMode): void {
  routerMode = mode;
  localStorage.setItem(STORAGE_ROUTER, mode);
  render();
}

function screenHref(screenId: DestinationAtlasScreenId): string {
  const mapsPanel = screenId === 'maps' ? atlas.mapsPanel : 'map';
  const { pathname, search } = buildAtlasLocation(screenId, atlas.atlasQuery(), atlas.urlDefaults, mapsPanel);
  return `${pathname}${search}`;
}

function wireOnce(el: Element | null, event: string, handler: EventListener): void {
  if (!el || el.hasAttribute('data-wired')) {
    return;
  }
  el.setAttribute('data-wired', event);
  el.addEventListener(event, handler);
}

function destinationItems() {
  return MOCK_DESTINATIONS.map((dest) => ({
    id: dest.id,
    label: localizedDestinationName(dest, atlas.locale),
    meta: formatRegionLabel(dest.region),
  }));
}

function buildMapMarkers() {
  return MOCK_DESTINATIONS.map((dest) => ({
    id: dest.id,
    lat: dest.lat,
    lng: dest.lng,
    label: localizedDestinationName(dest, atlas.locale),
  }));
}

function applyGeoMap(geoMap: Element): void {
  const secrets = getConsumerSecrets();
  const selected = getDestinationById(atlas.selectedId);
  const view = atlas.mapViewOverride ?? (selected
    ? { lat: selected.lat, lng: selected.lng, zoom: 10 }
    : { lat: 20, lng: 0, zoom: 2 });
  geoMap.setAttribute('provider', atlas.mapProvider);
  geoMap.setAttribute('center', JSON.stringify({ lat: view.lat, lng: view.lng }));
  geoMap.setAttribute('zoom', String(view.zoom));
  geoMap.setAttribute('selected-id', atlas.selectedId);
  const setProperty = (geoMap as { setProperty?: (name: string, value: unknown) => void }).setProperty;
  if (typeof setProperty === 'function') {
    setProperty.call(geoMap, 'markers', buildMapMarkers());
  } else {
    geoMap.setAttribute('markers', JSON.stringify(buildMapMarkers()));
  }
  if (atlas.mapProvider === 'google-maps' && secrets.googleMapsApiKey) {
    geoMap.setAttribute('api-key', secrets.googleMapsApiKey);
  } else {
    geoMap.removeAttribute('api-key');
  }
  if (atlas.mapProvider === 'maplibre' && secrets.maplibreTileUrl) {
    geoMap.setAttribute('tile-url', secrets.maplibreTileUrl);
  } else {
    geoMap.removeAttribute('tile-url');
  }
}

function applyGlobe(globe: Element): void {
  const setProperty = (globe as { setProperty?: (name: string, value: unknown) => void }).setProperty;
  globe.setAttribute('texture-url', DEFAULT_WORLD_EQUIRECT_URL);
  globe.setAttribute('selected-id', atlas.selectedId);
  if (typeof setProperty === 'function') {
    setProperty.call(globe, 'markers', buildMapMarkers());
  } else {
    globe.setAttribute('markers', JSON.stringify(buildMapMarkers()));
  }
}

function wireDestinationList(root: HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement>('[data-dest-id]').forEach((button) => {
    if (button.hasAttribute('data-wired')) {
      return;
    }
    button.setAttribute('data-wired', 'click');
    button.addEventListener('click', () => {
      const id = button.dataset.destId;
      if (id) {
        atlas.setSelectedId(id);
      }
    });
  });
  requestAnimationFrame(() => {
    scrollDestinationListToSelection(root, destinationItems(), atlas.selectedId);
  });
}

function wireGeoMap(root: HTMLElement): void {
  const geoMap = root.querySelector('[data-ref="geo-map"]');
  if (!geoMap) {
    return;
  }
  applyGeoMap(geoMap);
  wireOnce(geoMap, 'marker-select', (event) => {
    const id = (event as CustomEvent<{ id?: string }>).detail?.id;
    if (id) {
      atlas.setSelectedId(id);
    }
  });
}

function wireGlobe(root: HTMLElement): void {
  const globe = root.querySelector('[data-ref="geo-globe"]');
  if (!globe) {
    return;
  }
  applyGlobe(globe);
  wireOnce(globe, 'marker-select', (event) => {
    const id = (event as CustomEvent<{ id?: string }>).detail?.id;
    if (id) {
      atlas.setSelectedId(id);
    }
  });
}

function wireMapsChrome(root: HTMLElement): void {
  root.querySelectorAll<HTMLButtonElement>('[data-maps-panel]').forEach((button) => {
    wireOnce(button, 'click', () => {
      const panel = button.dataset.mapsPanel as 'map' | 'globe';
      atlas.setMapsPanel(panel);
    });
  });
  root.querySelector('[data-ref="map-provider"]')?.addEventListener('value-change', (event) => {
    atlas.setMapProvider((event as CustomEvent<{ value: string }>).detail.value as typeof atlas.mapProvider);
  });
  root.querySelector('[data-ref="list-placement"]')?.addEventListener('value-change', (event) => {
    atlas.setListPlacement((event as CustomEvent<{ value: string }>).detail.value as typeof atlas.listPlacement);
    render();
  });
  root.querySelector('[data-ref="map-location"]')?.addEventListener('value-change', (event) => {
    atlas.setMapLocationQuery((event as CustomEvent<{ value: string }>).detail.value);
  });
  root.querySelector('[data-ref="go-location"]')?.addEventListener('click', () => {
    const resolved = resolveMapLocationQuery(atlas.mapLocationQuery, atlas.locale);
    if (!resolved) {
      atlas.setLocationError(
        'No match — try a dataset destination (Tokyo, Paris, New York City…) or lat, lng (40.71, -74.01).',
      );
      render();
      return;
    }
    atlas.setLocationError('');
    const matched = MOCK_DESTINATIONS.find(
      (dest) => localizedDestinationName(dest, atlas.locale).toLowerCase() === resolved.label.toLowerCase(),
    );
    if (matched) {
      atlas.focusDestinationOnMap(matched.id);
      return;
    }
    atlas.goToMapView(resolved);
  });
  root.querySelectorAll('[data-ref="open-integrations"]').forEach((el) => {
    el.addEventListener('click', () => atlas.openSetting('integrations'));
  });
}

function syncMaps(root: HTMLElement): void {
  const explorer = root.querySelector('[data-ref="maps-explorer"]');
  const toolbar = root.querySelector('[data-ref="maps-toolbar"]');
  if (toolbar) {
    toolbar.innerHTML = renderMapsToolbar(atlas);
    wireMapsChrome(root);
  }
  if (!explorer) {
    return;
  }
  if (mounted.mapsPanel !== atlas.mapsPanel) {
    explorer.innerHTML = mapsExplorerMarkup(atlas);
    mounted.mapsPanel = atlas.mapsPanel;
    const footerHost = root.querySelector('.da-maps-panel__body');
    footerHost?.querySelector('.da-maps-footer')?.remove();
    if (atlas.mapsPanel === 'globe' && footerHost) {
      footerHost.insertAdjacentHTML('beforeend', globeFooterMarkup());
    }
    wireDestinationList(root);
    if (atlas.mapsPanel === 'map') {
      wireGeoMap(root);
    } else {
      wireGlobe(root);
    }
    root.querySelectorAll<HTMLButtonElement>('[data-maps-panel]').forEach((button) => {
      if (button.dataset.mapsPanel === atlas.mapsPanel) {
        button.setAttribute('aria-current', 'page');
      } else {
        button.removeAttribute('aria-current');
      }
    });
    return;
  }
  const list = root.querySelector('.rd-geo-explorer__list');
  if (list) {
    list.innerHTML = destinationListMarkup(destinationItems(), atlas.selectedId);
    wireDestinationList(root);
  }
  const body = root.querySelector('.rd-geo-explorer__body');
  body?.classList.toggle('rd-geo-explorer__body--list-left', atlas.listPlacement === 'left');
  body?.classList.toggle('rd-geo-explorer__body--list-right', atlas.listPlacement === 'right');
  const geoMap = root.querySelector('[data-ref="geo-map"]');
  if (geoMap) {
    applyGeoMap(geoMap);
  }
  const globe = root.querySelector('[data-ref="geo-globe"]');
  if (globe) {
    applyGlobe(globe);
  }
}

function wireMaps(root: HTMLElement): void {
  wireMapsChrome(root);
  wireDestinationList(root);
  if (atlas.mapsPanel === 'map') {
    wireGeoMap(root);
  } else {
    wireGlobe(root);
  }
  mounted.mapsPanel = atlas.mapsPanel;
}

function wireDestinations(root: HTMLElement): void {
  root.querySelector('[data-ref="dest-search"]')?.addEventListener('value-change', (event) => {
    atlas.setDestSearch((event as CustomEvent<{ value: string }>).detail.value);
    render();
  });
  root.querySelector('[data-ref="dest-region"]')?.addEventListener('value-change', (event) => {
    atlas.setDestRegion((event as CustomEvent<{ value: string }>).detail.value);
    render();
  });
  root.querySelector('[data-ref="visit-period"]')?.addEventListener('range-change', (event) => {
    const detail = (event as CustomEvent<{ startDate: string; endDate: string }>).detail;
    atlas.setVisitPeriod(detail);
    render();
  });
  root.querySelector('[data-ref="time-preset"]')?.addEventListener('preset-change', (event) => {
    atlas.setTimePreset((event as CustomEvent<{ presetId: string }>).detail.presetId);
    render();
  });
  root.querySelector('[data-ref="dest-table"]')?.addEventListener('row-select', (event) => {
    if (atlas.userRole === 'viewer') {
      return;
    }
    atlas.setSelectedId((event as CustomEvent<{ id: string }>).detail.id);
  });
  root.querySelector('[data-ref="view-on-map"]')?.addEventListener('click', () => {
    atlas.focusDestinationOnMap(atlas.selectedId);
  });
}

function wireMedia(root: HTMLElement): void {
  root.querySelector('[data-ref="media-flat"]')?.addEventListener('value-change', (event) => {
    atlas.setSelectedId((event as CustomEvent<{ value: string }>).detail.value);
  });
  root.querySelector('[data-ref="media-360"]')?.addEventListener('value-change', (event) => {
    atlas.openAuthoringForDestination((event as CustomEvent<{ value: string }>).detail.value);
  });
}

function wireIntel(root: HTMLElement): void {
  root.querySelector('[data-ref="news-search"]')?.addEventListener('search', (event) => {
    atlas.setNewsQuery((event as CustomEvent<{ query: string }>).detail.query);
    render();
  });
  root.querySelector('[data-ref="news-region"]')?.addEventListener('value-change', (event) => {
    atlas.setNewsRegion((event as CustomEvent<{ value: string }>).detail.value);
    render();
  });
  root.querySelector('[data-ref="news-table"]')?.addEventListener('row-select', (event) => {
    atlas.setSelectedArticleId((event as CustomEvent<{ id: string }>).detail.id);
    render();
  });
}

function wireViews(root: HTMLElement): void {
  const slidesCount = MOCK_DESTINATIONS.length;
  root.querySelectorAll<HTMLButtonElement>('[data-carousel-dir]').forEach((button) => {
    button.addEventListener('click', () => {
      const dir = Number(button.dataset.carouselDir);
      carouselIndex = (carouselIndex + dir + slidesCount) % slidesCount;
      atlas.setSelectedId(MOCK_DESTINATIONS[carouselIndex]?.id ?? atlas.selectedId);
    });
  });
  root.querySelectorAll<HTMLButtonElement>('[data-carousel-index]').forEach((button) => {
    button.addEventListener('click', () => {
      carouselIndex = Number(button.dataset.carouselIndex);
      atlas.setSelectedId(MOCK_DESTINATIONS[carouselIndex]?.id ?? atlas.selectedId);
    });
  });
}

function bindLocaleSelect(root: ParentNode): void {
  root.querySelectorAll('[data-ref="app-language-select"]').forEach((el) => {
    el.setAttribute('locales', JSON.stringify(DEFAULT_APP_LOCALES));
    el.setAttribute('value', atlas.locale);
    el.setAttribute('label', 'App locale');
    wireOnce(el, 'locale-change', (event) => {
      const locale = (event as CustomEvent<{ locale: string }>).detail.locale;
      if (locale) {
        atlas.setLocale(locale);
      }
    });
  });
}

function wireSettings(root: HTMLElement): void {
  bindLocaleSelect(root);
  void fetchNewsAdminStatus().then((status) => {
    const statusEl = root.querySelector<HTMLElement>('[data-ref="news-admin-status"]');
    if (!statusEl) {
      return;
    }
    if (!status) {
      statusEl.textContent = 'Could not read news admin status — is the builder API running?';
      return;
    }
    statusEl.textContent = `Cached articles: ${status.articleCount} · Last fetch: ${
      status.fetchedAt ? new Date(status.fetchedAt).toLocaleString() : 'never'
    } · TTL: ${Math.round(status.cacheTtlMs / 3_600_000)}h · Feeds: ${status.feeds.length}`;
  });
  root.querySelector('[data-ref="news-admin-refresh"]')?.addEventListener('click', () => {
    const messageEl = root.querySelector<HTMLElement>('[data-ref="news-admin-message"]');
    void refreshNewsCache().then((status) => {
      if (messageEl) {
        messageEl.hidden = false;
        messageEl.textContent = status
          ? 'News cache refreshed from RSS feeds.'
          : 'Could not refresh news cache.';
      }
      render();
    });
  });
  root.querySelector('[data-ref="settings-role"]')?.addEventListener('value-change', (event) => {
    atlas.setUserRole((event as CustomEvent<{ value: string }>).detail.value as typeof atlas.userRole);
  });
  root.querySelector('[data-ref="settings-map-provider"]')?.addEventListener('value-change', (event) => {
    atlas.setMapProvider((event as CustomEvent<{ value: string }>).detail.value as typeof atlas.mapProvider);
  });
  root.querySelector('[data-ref="settings-selected"]')?.addEventListener('value-change', (event) => {
    atlas.setSelectedId((event as CustomEvent<{ value: string }>).detail.value);
  });
  root.querySelector('[data-ref="theme-select"]')?.addEventListener('change', (event) => {
    themeStore.setTheme((event.target as HTMLSelectElement).value as ThemePreference);
    render();
  });
  const secrets = getConsumerSecrets();
  root.querySelector('[data-ref="integrations"] rd-collapsible')?.addEventListener('open-change', (event) => {
    atlas.setIntegrationsOpen((event as CustomEvent<{ open: boolean }>).detail.open);
  });
  root.querySelector('[data-ref="ai-settings"] rd-collapsible')?.addEventListener('open-change', (event) => {
    atlas.setAiOpen((event as CustomEvent<{ open: boolean }>).detail.open);
  });
  root.querySelectorAll('[data-byok-key]').forEach((el) => {
    el.addEventListener('value-change', (event) => {
      const key = (el as HTMLElement).dataset.byokKey;
      if (key) {
        secrets.setDraftValue(key, (event as CustomEvent<{ value: string }>).detail.value);
      }
    });
  });
  root.querySelectorAll('[data-ref="remember-keys"]').forEach((el) => {
    el.addEventListener('change', (event) => {
      secrets.setRememberKeys((event.target as HTMLInputElement).checked);
    });
  });
  root.querySelectorAll('[data-ref="save-keys"]').forEach((el) => {
    el.addEventListener('click', () => {
      void secrets.save();
    });
  });
  root.querySelectorAll('[data-ref="clear-keys"]').forEach((el) => {
    el.addEventListener('click', () => {
      void secrets.clearAll();
    });
  });
  root.querySelector('[data-ref="feedback-draft"]')?.addEventListener('value-change', (event) => {
    atlas.setFeedbackDraft((event as CustomEvent<{ value: string }>).detail.value);
  });
  root.querySelector('[data-ref="send-feedback"]')?.addEventListener('click', () => {
    atlas.setFeedbackDraft('');
    atlas.setFeedbackSent(true);
    render();
  });

  if (atlas.highlightTarget) {
    const target =
      atlas.highlightTarget === 'theme'
        ? root.querySelector('[data-ref="theme-toggle"]')
        : atlas.highlightTarget === 'integrations'
          ? root.querySelector('[data-ref="integrations"]')
          : atlas.highlightTarget === 'ai'
            ? root.querySelector('[data-ref="ai-settings"]')
            : atlas.highlightTarget === 'feedback'
              ? root.querySelector('[data-ref="feedback"]')
              : root.querySelector(`[data-setting="${atlas.highlightTarget}"]`);
    target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    window.setTimeout(() => {
      atlas.setHighlightTarget(null);
      render();
    }, 2400);
  }
}

function wireAuthoring(root: HTMLElement): void {
  wireAuthoringPipeline(
    root.querySelector('[data-ref="screen-root"]') ?? root,
    atlas.selectedId,
    atlas.locale,
  );
}

function renderScreenHtml(): string {
  switch (atlas.screen) {
    case 'about':
      return renderAbout();
    case 'overview':
      return renderOverview(atlas);
    case 'destinations':
      return renderDestinations(atlas);
    case 'maps':
      return renderMaps(atlas);
    case 'media':
      return renderMedia(atlas);
    case 'authoring':
      return renderAuthoring(atlas);
    case 'intel':
      return renderIntel(atlas);
    case 'plan':
      return renderPlan(atlas, { start: tripStart, end: tripEnd, duration: tripDuration });
    case 'views': {
      const selectedIndex = MOCK_DESTINATIONS.findIndex((dest) => dest.id === atlas.selectedId);
      if (selectedIndex >= 0) {
        carouselIndex = selectedIndex;
      }
      return renderViews(atlas, carouselIndex);
    }
    case 'stack':
      return renderStack(atlas);
    case 'settings':
      return renderSettings(atlas, themeStore.theme);
    default:
      return renderAbout();
  }
}

function wireScreen(root: HTMLElement): void {
  if (atlas.screen === 'maps') {
    wireMaps(root);
  }
  if (atlas.screen === 'destinations') {
    wireDestinations(root);
  }
  if (atlas.screen === 'media') {
    wireMedia(root);
  }
  if (atlas.screen === 'intel') {
    wireIntel(root);
  }
  if (atlas.screen === 'views') {
    wireViews(root);
  }
  if (atlas.screen === 'settings') {
    wireSettings(root);
  }
  if (atlas.screen === 'authoring') {
    root.querySelector('[data-ref="auth-dest"]')?.addEventListener('value-change', (event) => {
      atlas.setSelectedId((event as CustomEvent<{ value: string }>).detail.value);
    });
    wireAuthoring(root);
  }
  if (atlas.screen === 'plan') {
    root.querySelector('[data-ref="trip-dest"]')?.addEventListener('value-change', (event) => {
      atlas.setSelectedId((event as CustomEvent<{ value: string }>).detail.value);
    });
    root.querySelector('[data-ref="trip-dates"]')?.addEventListener('range-change', (event) => {
      const detail = (event as CustomEvent<{ startDate: string; endDate: string }>).detail;
      tripStart = detail.startDate;
      tripEnd = detail.endDate;
      const start = Date.parse(`${tripStart}T12:00:00`);
      const end = Date.parse(`${tripEnd}T12:00:00`);
      if (Number.isFinite(start) && Number.isFinite(end) && end >= start) {
        tripDuration = Math.round((end - start) / 86_400_000) + 1;
        root.querySelector('[data-ref="trip-duration"]')?.setAttribute('value', String(tripDuration));
      }
    });
    root.querySelector('[data-ref="trip-duration"]')?.addEventListener('value-change', (event) => {
      const value = Number((event as CustomEvent<{ value: string | number }>).detail.value);
      if (Number.isFinite(value) && value >= 1) {
        tripDuration = value;
      }
    });
  }
}

function updateChrome(root: HTMLElement): void {
  const summary = root.querySelector('[data-ref="context-summary"]');
  if (summary) {
    summary.innerHTML = contextSummaryMarkup(atlas, themeStore.theme);
    summary.querySelectorAll<HTMLButtonElement>('[data-setting-chip]').forEach((button) => {
      button.addEventListener('click', () => {
        const key = button.dataset.settingChip;
        if (key === 'theme' || key === 'role' || key === 'locale' || key === 'map' || key === 'selected') {
          atlas.openSetting(key);
        }
      });
    });
  }
  const routerSelect = root.querySelector<HTMLSelectElement>('[data-ref="router-mode"]');
  if (routerSelect) {
    routerSelect.value = routerMode;
  }
  const visibleScreens = DESTINATION_ATLAS_NAV_SCREENS.filter((screen) =>
    screenAllowedForRole(screen.id, atlas.userRole),
  );
  const nav = root.querySelector('[data-ref="screen-nav"]');
  if (nav) {
    nav.innerHTML = visibleScreens
      .map(
        (screen) =>
          `<a href="${screenHref(screen.id)}" class="da-tabbar__tab" data-screen="${screen.id}"${atlas.screen === screen.id ? ' aria-current="page"' : ''}>${screen.label}</a>`,
      )
      .join('');
    nav.querySelectorAll<HTMLAnchorElement>('[data-screen]').forEach((link) => {
      link.addEventListener('click', (event) => {
        event.preventDefault();
        atlas.setScreen(link.dataset.screen as DestinationAtlasScreenId);
      });
    });
  }
  const source = root.querySelector('[data-ref="source-code"]');
  if (source) {
    source.textContent = SCREEN_SOURCES[atlas.screen] ?? '';
  }
  root.querySelector('[data-ref="source-blurb"]')?.replaceChildren(
    document.createTextNode(
      'Custom elements, props, and nested structure for this screen.',
    ),
  );
  root.querySelectorAll('[data-mobile-view]').forEach((el) => {
    const view = (el as HTMLElement).dataset.mobileView;
    el.classList.toggle('is-active', view === atlas.mobileView);
    el.setAttribute('aria-selected', view === atlas.mobileView ? 'true' : 'false');
  });
  root.querySelector('[data-ref="preview-pane"]')?.classList.toggle(
    'da-workbench__pane--hidden-mobile',
    atlas.mobileView === 'source',
  );
  root.querySelector('[data-ref="source-pane"]')?.classList.toggle(
    'da-workbench__pane--hidden-mobile',
    atlas.mobileView === 'preview',
  );
}

function ensureShell(root: HTMLElement): void {
  if (mounted.shell) {
    return;
  }
  root.innerHTML = `
    <div class="da-shell">
      <header class="da-header">
        <h1>Destination Atlas</h1>
        <p>Current and historic information about world locations — Web Components proof (DAS-121)</p>
      </header>
      <div class="da-body-row">
        <div class="da-preview-column">
          <div class="da-context-strip">
            ${routerModeMarkup(routerMode)}
            <div class="da-context-summary" role="group" aria-label="Current app context" data-ref="context-summary"></div>
          </div>
          <nav class="da-nav da-tabbar" aria-label="Screens" data-ref="screen-nav"></nav>
          <div class="da-workbench-host">
            <div class="da-workbench__mobile-toggle" role="tablist" aria-label="Preview or source">
              <button type="button" role="tab" data-mobile-view="preview">Atlas preview</button>
              <button type="button" role="tab" data-mobile-view="source">Component source</button>
            </div>
            <div class="da-workbench__preview" data-ref="preview-pane">
              <div data-ref="screen-root"></div>
            </div>
          </div>
        </div>
        <aside class="da-workbench__source" data-ref="source-pane" aria-label="Component source">
          <header class="da-workbench__source-header">
            <h3>Component source</h3>
            <p data-ref="source-blurb"></p>
          </header>
          <pre class="da-workbench__code"><code data-ref="source-code"></code></pre>
        </aside>
      </div>
    </div>
  `;
  root.querySelector('[data-ref="router-mode"]')?.addEventListener('change', (event) => {
    setRouterMode((event.target as HTMLSelectElement).value as ClientRouterMode);
  });
  root.querySelectorAll('[data-mobile-view]').forEach((el) => {
    el.addEventListener('click', () => {
      atlas.setMobileView((el as HTMLElement).dataset.mobileView as 'preview' | 'source');
      render();
    });
  });
  mounted.shell = true;
}

function render(): void {
  const root = document.getElementById('app');
  if (!root) {
    return;
  }
  atlas.reconcileRoute();
  if (atlas.screen === 'intel') {
    ensureIntelFeed(
      {
        q: atlas.newsQuery,
        region: atlas.newsRegion,
        destinationId: atlas.selectedId,
      },
      () => render(),
    );
  }
  ensureShell(root);
  updateChrome(root);

  const screenRoot = root.querySelector<HTMLElement>('[data-ref="screen-root"]');
  if (!screenRoot) {
    return;
  }

  const screenChanged = mounted.screen !== atlas.screen;
  if (screenChanged) {
    if (mounted.screen === 'authoring' && atlas.screen !== 'authoring') {
      resetAuthoringWiring();
    }
    if (atlas.screen === 'authoring' && mounted.screen !== 'authoring') {
      resetAuthoringWiring();
    }
    screenRoot.innerHTML = renderScreenHtml();
    mounted.screen = atlas.screen;
    mounted.mapsPanel = atlas.screen === 'maps' ? atlas.mapsPanel : '';
    wireScreen(root);
    return;
  }

  if (atlas.screen === 'maps') {
    syncMaps(root);
    return;
  }
  if (atlas.screen === 'authoring') {
    wireAuthoring(root);
    return;
  }

  screenRoot.innerHTML = renderScreenHtml();
  wireScreen(root);
}

subscribeRouter(render);
subscribeSecrets(render);
atlas.reconcileRoute();
render();
