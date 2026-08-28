import {
  buildAtlasLocation,
  isKnownDestinationAtlasPath,
  legacyAtlasPathRedirect,
  mapsPanelFromPath,
  parseAtlasUrlState,
  type AtlasUrlDefaults,
  type DestinationAtlasScreenId,
  type MapsPanelId,
} from '@rosettadash/core';
import type { GeoMapProvider } from '@destination-atlas';
import type { AtlasUserRole } from '../lib/roles';
import { screenAllowedForRole } from '../lib/roles';
import type { SettingsHighlightTarget } from '../lib/settings-highlight';
import {
  getRouterFullPath,
  getRouterPath,
  getRouterQuery,
  getRouterSearch,
  routerPush,
  routerReplace,
} from './router.svelte';

export function createDestinationAtlasState(initialSelectedId: string) {
  const urlDefaults: AtlasUrlDefaults = {
    dest: initialSelectedId,
    locale: 'en',
    provider: 'leaflet',
    role: 'viewer',
  };

  const routeSearch = $derived.by(() => {
    void getRouterSearch();
    const params = new URLSearchParams(getRouterSearch().replace(/^\?/, ''));
    const search = params.toString();
    return search ? `?${search}` : '';
  });

  const urlState = $derived.by(() => {
    void getRouterPath();
    void routeSearch;
    return parseAtlasUrlState(getRouterPath(), routeSearch, urlDefaults);
  });

  const screen = $derived(urlState.screen);
  const mapsPanel = $derived.by(() => mapsPanelFromPath(getRouterPath()));
  const selectedId = $derived(urlState.dest || initialSelectedId);
  const locale = $derived(urlState.locale);
  const mapProvider = $derived(urlState.provider as GeoMapProvider);
  const userRole = $derived(urlState.role as AtlasUserRole);

  const settingsScoutFocus = $derived.by(() => {
    void getRouterFullPath();
    const params = new URLSearchParams(getRouterFullPath().replace(/^[^?]*/, '').replace(/^\?/, ''));
    return screen === 'settings' && params.get('scout') === '1';
  });

  let newsQuery = $state('');
  let newsRegion = $state('');
  let selectedArticleId = $state('');
  let mapTabId = $state<'map' | 'list'>('map');
  let mapLocationQuery = $state('');
  let mapViewOverride = $state<{ lat: number; lng: number; zoom: number; label: string } | null>(null);
  let destSearch = $state('');
  let destRegion = $state('');
  let timePreset = $state('5y');
  let visitPeriodStart = $state('2015-01');
  let visitPeriodEnd = $state('2024-12');
  let highlightTarget = $state<SettingsHighlightTarget>(null);

  const atlasQuery = $derived({
    dest: selectedId,
    locale,
    provider: mapProvider,
    role: userRole,
  });

  function navigateAtlas(
    nextScreen: DestinationAtlasScreenId,
    query = atlasQuery,
    replace = false,
    nextMapsPanel: MapsPanelId = mapsPanel,
  ) {
    const panel = nextScreen === 'maps' ? nextMapsPanel : 'map';
    const { pathname, search } = buildAtlasLocation(nextScreen, query, urlDefaults, panel);
    const locationQuery = Object.fromEntries(new URLSearchParams(search.replace(/^\?/, '')));
    if (replace) {
      routerReplace(pathname, locationQuery);
    } else {
      routerPush(pathname, locationQuery);
    }
  }

  function setScreen(nextScreen: DestinationAtlasScreenId) {
    navigateAtlas(nextScreen);
  }

  function setMapsPanel(panel: MapsPanelId) {
    navigateAtlas('maps', atlasQuery, false, panel);
  }

  function setSelectedId(id: string) {
    mapViewOverride = null;
    mapLocationQuery = '';
    navigateAtlas(screen, { ...atlasQuery, dest: id });
  }

  function setLocale(nextLocale: string) {
    navigateAtlas(screen, { ...atlasQuery, locale: nextLocale });
  }

  function setMapProvider(provider: GeoMapProvider) {
    navigateAtlas(screen, { ...atlasQuery, provider });
  }

  function setUserRole(role: AtlasUserRole) {
    navigateAtlas(screen, { ...atlasQuery, role });
  }

  function setVisitPeriod(range: { startDate: string; endDate: string }) {
    visitPeriodStart = range.startDate;
    visitPeriodEnd = range.endDate;
  }

  function focusDestinationOnMap(id: string) {
    mapViewOverride = null;
    mapLocationQuery = '';
    mapTabId = 'map';
    navigateAtlas('maps', { ...atlasQuery, dest: id }, false, 'map');
  }

  function goToMapView(view: { lat: number; lng: number; zoom: number; label: string }) {
    mapViewOverride = view;
    mapTabId = 'map';
    navigateAtlas('maps', atlasQuery, false, 'map');
  }

  function openAuthoringForDestination(destinationId: string) {
    navigateAtlas('authoring', { ...atlasQuery, dest: destinationId });
  }

  function openScoutSettings() {
    highlightTarget = 'ai';
    const { pathname, search } = buildAtlasLocation('settings', atlasQuery, urlDefaults);
    const params = new URLSearchParams(search.replace(/^\?/, ''));
    params.set('scout', '1');
    routerPush(pathname, Object.fromEntries(new URLSearchParams(params.toString())));
  }

  $effect(() => {
    const pathname = getRouterPath();
    const redirect = legacyAtlasPathRedirect(pathname);
    if (!redirect) {
      return;
    }
    if (pathname.replace(/\/+$/, '') === '/scout') {
      highlightTarget = 'ai';
      const searchPart = getRouterFullPath().includes('?') ? getRouterFullPath().split('?')[1] : '';
      const params = new URLSearchParams(searchPart);
      params.set('scout', '1');
      routerReplace(redirect, Object.fromEntries(new URLSearchParams(params.toString())));
      return;
    }
    const searchPart = getRouterFullPath().includes('?') ? getRouterFullPath().split('?')[1] : '';
    routerReplace(redirect, Object.fromEntries(new URLSearchParams(searchPart)));
  });

  $effect(() => {
    void getRouterPath();
    void atlasQuery;
    if (!isKnownDestinationAtlasPath(getRouterPath())) {
      navigateAtlas('about', atlasQuery, true);
    }
  });

  $effect(() => {
    void screen;
    void userRole;
    void atlasQuery;
    if (!screenAllowedForRole(screen, userRole)) {
      navigateAtlas('about', atlasQuery, true);
    }
  });

  return {
    get screen() {
      return screen;
    },
    get mapsPanel() {
      return mapsPanel;
    },
    get selectedId() {
      return selectedId;
    },
    get locale() {
      return locale;
    },
    get mapProvider() {
      return mapProvider;
    },
    get newsQuery() {
      return newsQuery;
    },
    get newsRegion() {
      return newsRegion;
    },
    get selectedArticleId() {
      return selectedArticleId;
    },
    get mapTabId() {
      return mapTabId;
    },
    get mapLocationQuery() {
      return mapLocationQuery;
    },
    get mapViewOverride() {
      return mapViewOverride;
    },
    get destSearch() {
      return destSearch;
    },
    get destRegion() {
      return destRegion;
    },
    get timePreset() {
      return timePreset;
    },
    get visitPeriodStart() {
      return visitPeriodStart;
    },
    get visitPeriodEnd() {
      return visitPeriodEnd;
    },
    get userRole() {
      return userRole;
    },
    get highlightTarget() {
      return highlightTarget;
    },
    get settingsScoutFocus() {
      return settingsScoutFocus;
    },
    setScreen,
    setMapsPanel,
    setSelectedId,
    setLocale,
    setMapProvider,
    setNewsQuery: (query: string) => {
      newsQuery = query;
    },
    setNewsRegion: (region: string) => {
      newsRegion = region;
    },
    setSelectedArticleId: (id: string) => {
      selectedArticleId = id;
    },
    setMapTabId: (tabId: 'map' | 'list') => {
      mapTabId = tabId;
    },
    setMapLocationQuery: (query: string) => {
      mapLocationQuery = query;
    },
    focusDestinationOnMap,
    goToMapView,
    setDestSearch: (query: string) => {
      destSearch = query;
    },
    setDestRegion: (region: string) => {
      destRegion = region;
    },
    setTimePreset: (preset: string) => {
      timePreset = preset;
    },
    setVisitPeriod,
    setUserRole,
    setHighlightTarget: (target: SettingsHighlightTarget) => {
      highlightTarget = target;
    },
    openAuthoringForDestination,
    openScoutSettings,
  };
}

export type AtlasContext = ReturnType<typeof createDestinationAtlasState>;
