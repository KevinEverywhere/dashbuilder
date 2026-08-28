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
import type { AtlasUserRole } from './roles';
import { screenAllowedForRole } from './roles';
import type { SettingsHighlightTarget } from './settings-highlight';
import {
  getRouterFullPath,
  getRouterPath,
  getRouterSearch,
  routerPush,
  routerReplace,
} from './router';

export type GeoExplorerListPlacement = 'left' | 'right';

export function createDestinationAtlasState(initialSelectedId: string) {
  const urlDefaults: AtlasUrlDefaults = {
    dest: initialSelectedId,
    locale: 'en',
    provider: 'leaflet',
    role: 'viewer',
  };

  let newsQuery = '';
  let newsRegion = '';
  let selectedArticleId = '';
  let mapLocationQuery = '';
  let mapViewOverride: { lat: number; lng: number; zoom: number; label: string } | null = null;
  let destSearch = '';
  let destRegion = '';
  let timePreset = '5y';
  let visitPeriodStart = '2015-01';
  let visitPeriodEnd = '2024-12';
  let highlightTarget: SettingsHighlightTarget = null;
  let listPlacement: GeoExplorerListPlacement = 'right';
  let locationError = '';
  let feedbackDraft = '';
  let feedbackSent = false;
  let integrationsOpen = false;
  let aiOpen = false;
  let mobileView: 'preview' | 'source' = 'preview';

  function urlState() {
    return parseAtlasUrlState(getRouterPath(), getRouterSearch(), urlDefaults);
  }

  function atlasQuery() {
    const state = urlState();
    return {
      dest: state.dest || initialSelectedId,
      locale: state.locale,
      provider: state.provider,
      role: state.role,
    };
  }

  function navigateAtlas(
    nextScreen: DestinationAtlasScreenId,
    query = atlasQuery(),
    replace = false,
    nextMapsPanel: MapsPanelId = mapsPanelFromPath(getRouterPath()),
  ): void {
    const panel = nextScreen === 'maps' ? nextMapsPanel : 'map';
    const { pathname, search } = buildAtlasLocation(nextScreen, query, urlDefaults, panel);
    const locationQuery = Object.fromEntries(new URLSearchParams(search.replace(/^\?/, '')));
    if (replace) {
      routerReplace(pathname, locationQuery);
    } else {
      routerPush(pathname, locationQuery);
    }
  }

  function reconcileRoute(): void {
    const pathname = getRouterPath();
    const redirect = legacyAtlasPathRedirect(pathname);
    if (redirect) {
      if (pathname.replace(/\/+$/, '') === '/scout') {
        highlightTarget = 'ai';
        const searchPart = getRouterFullPath().includes('?') ? getRouterFullPath().split('?')[1] : '';
        const params = new URLSearchParams(searchPart);
        params.set('scout', '1');
        routerReplace(redirect, Object.fromEntries(params));
        return;
      }
      const searchPart = getRouterFullPath().includes('?') ? getRouterFullPath().split('?')[1] : '';
      routerReplace(redirect, Object.fromEntries(new URLSearchParams(searchPart)));
      return;
    }
    if (!isKnownDestinationAtlasPath(pathname)) {
      navigateAtlas('about', atlasQuery(), true);
      return;
    }
    const state = urlState();
    if (!screenAllowedForRole(state.screen, state.role as AtlasUserRole)) {
      navigateAtlas('about', atlasQuery(), true);
    }
  }

  return {
    urlDefaults,
    get screen() {
      return urlState().screen;
    },
    get mapsPanel() {
      return mapsPanelFromPath(getRouterPath());
    },
    get selectedId() {
      return urlState().dest || initialSelectedId;
    },
    get locale() {
      return urlState().locale;
    },
    get mapProvider() {
      return urlState().provider as GeoMapProvider;
    },
    get userRole() {
      return urlState().role as AtlasUserRole;
    },
    get settingsScoutFocus() {
      const params = new URLSearchParams(getRouterSearch().replace(/^\?/, ''));
      return urlState().screen === 'settings' && params.get('scout') === '1';
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
    get highlightTarget() {
      return highlightTarget;
    },
    get listPlacement() {
      return listPlacement;
    },
    get locationError() {
      return locationError;
    },
    get feedbackDraft() {
      return feedbackDraft;
    },
    get feedbackSent() {
      return feedbackSent;
    },
    get integrationsOpen() {
      return integrationsOpen;
    },
    get aiOpen() {
      return aiOpen;
    },
    get mobileView() {
      return mobileView;
    },
    atlasQuery,
    navigateAtlas,
    reconcileRoute,
    setScreen: (screen: DestinationAtlasScreenId) => navigateAtlas(screen),
    setMapsPanel: (panel: MapsPanelId) => navigateAtlas('maps', atlasQuery(), false, panel),
    setSelectedId: (id: string) => {
      mapViewOverride = null;
      mapLocationQuery = '';
      locationError = '';
      navigateAtlas(urlState().screen, { ...atlasQuery(), dest: id });
    },
    setLocale: (locale: string) => navigateAtlas(urlState().screen, { ...atlasQuery(), locale }),
    setMapProvider: (provider: GeoMapProvider) =>
      navigateAtlas(urlState().screen, { ...atlasQuery(), provider }),
    setUserRole: (role: AtlasUserRole) => navigateAtlas(urlState().screen, { ...atlasQuery(), role }),
    setNewsQuery: (query: string) => {
      newsQuery = query;
    },
    setNewsRegion: (region: string) => {
      newsRegion = region;
    },
    setSelectedArticleId: (id: string) => {
      selectedArticleId = id;
    },
    setMapLocationQuery: (query: string) => {
      mapLocationQuery = query;
    },
    setLocationError: (message: string) => {
      locationError = message;
    },
    setDestSearch: (query: string) => {
      destSearch = query;
    },
    setDestRegion: (region: string) => {
      destRegion = region;
    },
    setTimePreset: (preset: string) => {
      timePreset = preset;
    },
    setVisitPeriod: (range: { startDate: string; endDate: string }) => {
      visitPeriodStart = range.startDate;
      visitPeriodEnd = range.endDate;
    },
    setHighlightTarget: (target: SettingsHighlightTarget) => {
      highlightTarget = target;
    },
    setListPlacement: (placement: GeoExplorerListPlacement) => {
      listPlacement = placement;
    },
    setFeedbackDraft: (value: string) => {
      feedbackDraft = value;
    },
    setFeedbackSent: (value: boolean) => {
      feedbackSent = value;
    },
    setIntegrationsOpen: (open: boolean) => {
      integrationsOpen = open;
    },
    setAiOpen: (open: boolean) => {
      aiOpen = open;
    },
    setMobileView: (view: 'preview' | 'source') => {
      mobileView = view;
    },
    focusDestinationOnMap: (id: string) => {
      mapViewOverride = null;
      mapLocationQuery = '';
      locationError = '';
      navigateAtlas('maps', { ...atlasQuery(), dest: id }, false, 'map');
    },
    goToMapView: (view: { lat: number; lng: number; zoom: number; label: string }) => {
      mapViewOverride = view;
      navigateAtlas('maps', atlasQuery(), false, 'map');
    },
    openAuthoringForDestination: (destinationId: string) => {
      navigateAtlas('authoring', { ...atlasQuery(), dest: destinationId });
    },
    openScoutSettings: () => {
      highlightTarget = 'ai';
      aiOpen = true;
      const { pathname, search } = buildAtlasLocation('settings', atlasQuery(), urlDefaults);
      const params = new URLSearchParams(search.replace(/^\?/, ''));
      params.set('scout', '1');
      routerPush(pathname, Object.fromEntries(params));
    },
    openSetting: (field: SettingsHighlightTarget) => {
      highlightTarget = field;
      if (field === 'integrations') {
        integrationsOpen = true;
      }
      if (field === 'ai') {
        aiOpen = true;
      }
      navigateAtlas('settings');
    },
  };
}

export type AtlasState = ReturnType<typeof createDestinationAtlasState>;
