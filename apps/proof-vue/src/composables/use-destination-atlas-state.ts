import { computed, ref, watch, type InjectionKey } from 'vue';
import { useRoute, useRouter } from 'vue-router';
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

export interface DestinationAtlasState {
  screen: DestinationAtlasScreenId;
  mapsPanel: MapsPanelId;
  selectedId: string;
  locale: string;
  mapProvider: GeoMapProvider;
  newsQuery: string;
  newsRegion: string;
  selectedArticleId: string;
  mapTabId: 'map' | 'list';
  mapLocationQuery: string;
  mapViewOverride: { lat: number; lng: number; zoom: number; label: string } | null;
  destSearch: string;
  destRegion: string;
  timePreset: string;
  visitPeriodStart: string;
  visitPeriodEnd: string;
  userRole: AtlasUserRole;
  highlightTarget: SettingsHighlightTarget;
  settingsScoutFocus: boolean;
}

export type AtlasContext = ReturnType<typeof useDestinationAtlasState>;

export function useDestinationAtlasState(initialSelectedId: string) {
  const route = useRoute();
  const router = useRouter();

  const urlDefaults = computed<AtlasUrlDefaults>(() => ({
    dest: initialSelectedId,
    locale: 'en',
    provider: 'leaflet',
    role: 'viewer',
  }));

  const routeSearch = computed(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(route.query)) {
      if (typeof value === 'string') {
        params.set(key, value);
      } else if (Array.isArray(value)) {
        for (const entry of value) {
          if (typeof entry === 'string') {
            params.append(key, entry);
          }
        }
      }
    }
    const search = params.toString();
    return search ? `?${search}` : '';
  });

  const urlState = computed(() => parseAtlasUrlState(route.path, routeSearch.value, urlDefaults.value));

  const screen = computed(() => urlState.value.screen);
  const mapsPanel = computed(() => mapsPanelFromPath(route.path));
  const selectedId = computed(() => urlState.value.dest || initialSelectedId);
  const locale = computed(() => urlState.value.locale);
  const mapProvider = computed(() => urlState.value.provider as GeoMapProvider);
  const userRole = computed(() => urlState.value.role as AtlasUserRole);

  const settingsScoutFocus = computed(() => {
    const params = new URLSearchParams(route.fullPath.replace(/^[^?]*/, '').replace(/^\?/, ''));
    return screen.value === 'settings' && params.get('scout') === '1';
  });

  const newsQuery = ref('');
  const newsRegion = ref('');
  const selectedArticleId = ref('');
  const mapTabId = ref<'map' | 'list'>('map');
  const mapLocationQuery = ref('');
  const mapViewOverride = ref<{ lat: number; lng: number; zoom: number; label: string } | null>(null);
  const destSearch = ref('');
  const destRegion = ref('');
  const timePreset = ref('5y');
  const visitPeriodStart = ref('2015-01');
  const visitPeriodEnd = ref('2024-12');
  const highlightTarget = ref<SettingsHighlightTarget>(null);

  const atlasQuery = computed(() => ({
    dest: selectedId.value,
    locale: locale.value,
    provider: mapProvider.value,
    role: userRole.value,
  }));

  function navigateAtlas(
    nextScreen: DestinationAtlasScreenId,
    query = atlasQuery.value,
    replace = false,
    nextMapsPanel: MapsPanelId = mapsPanel.value,
  ) {
    const panel = nextScreen === 'maps' ? nextMapsPanel : 'map';
    const { pathname, search } = buildAtlasLocation(nextScreen, query, urlDefaults.value, panel);
    const location = { path: pathname, query: Object.fromEntries(new URLSearchParams(search.replace(/^\?/, ''))) };
    if (replace) {
      void router.replace(location);
    } else {
      void router.push(location);
    }
  }

  function setScreen(nextScreen: DestinationAtlasScreenId) {
    navigateAtlas(nextScreen);
  }

  function setMapsPanel(panel: MapsPanelId) {
    navigateAtlas('maps', atlasQuery.value, false, panel);
  }

  function setSelectedId(id: string) {
    mapViewOverride.value = null;
    mapLocationQuery.value = '';
    navigateAtlas(screen.value, { ...atlasQuery.value, dest: id });
  }

  function setLocale(nextLocale: string) {
    navigateAtlas(screen.value, { ...atlasQuery.value, locale: nextLocale });
  }

  function setMapProvider(provider: GeoMapProvider) {
    navigateAtlas(screen.value, { ...atlasQuery.value, provider });
  }

  function setUserRole(role: AtlasUserRole) {
    navigateAtlas(screen.value, { ...atlasQuery.value, role });
  }

  function setVisitPeriod(range: { startDate: string; endDate: string }) {
    visitPeriodStart.value = range.startDate;
    visitPeriodEnd.value = range.endDate;
  }

  function focusDestinationOnMap(id: string) {
    mapViewOverride.value = null;
    mapLocationQuery.value = '';
    mapTabId.value = 'map';
    navigateAtlas('maps', { ...atlasQuery.value, dest: id }, false, 'map');
  }

  function goToMapView(view: { lat: number; lng: number; zoom: number; label: string }) {
    mapViewOverride.value = view;
    mapTabId.value = 'map';
    navigateAtlas('maps', atlasQuery.value, false, 'map');
  }

  function openAuthoringForDestination(destinationId: string) {
    navigateAtlas('authoring', { ...atlasQuery.value, dest: destinationId });
  }

  function openScoutSettings() {
    highlightTarget.value = 'ai';
    const { pathname, search } = buildAtlasLocation('settings', atlasQuery.value, urlDefaults.value);
    const params = new URLSearchParams(search.replace(/^\?/, ''));
    params.set('scout', '1');
    const nextSearch = params.toString();
    void router.push({ path: pathname, query: Object.fromEntries(new URLSearchParams(nextSearch)) });
  }

  watch(
    () => route.path,
    (pathname) => {
      const redirect = legacyAtlasPathRedirect(pathname);
      if (redirect) {
        if (pathname.replace(/\/+$/, '') === '/scout') {
          highlightTarget.value = 'ai';
          const searchPart = route.fullPath.includes('?') ? route.fullPath.split('?')[1] : '';
          const params = new URLSearchParams(searchPart);
          params.set('scout', '1');
          const nextSearch = params.toString();
          void router.replace({ path: redirect, query: Object.fromEntries(new URLSearchParams(nextSearch)) });
          return;
        }
        const searchPart = route.fullPath.includes('?') ? `?${route.fullPath.split('?')[1]}` : '';
        void router.replace({ path: redirect, query: Object.fromEntries(new URLSearchParams(searchPart.replace(/^\?/, ''))) });
      }
    },
    { immediate: true },
  );

  watch(
    [() => route.path, atlasQuery],
    () => {
      if (!isKnownDestinationAtlasPath(route.path)) {
        navigateAtlas('about', atlasQuery.value, true);
      }
    },
    { immediate: true },
  );

  watch(
    [screen, userRole, atlasQuery],
    () => {
      if (!screenAllowedForRole(screen.value, userRole.value)) {
        navigateAtlas('about', atlasQuery.value, true);
      }
    },
    { immediate: true },
  );

  return {
    screen,
    mapsPanel,
    selectedId,
    locale,
    mapProvider,
    newsQuery,
    newsRegion,
    selectedArticleId,
    mapTabId,
    mapLocationQuery,
    mapViewOverride,
    destSearch,
    destRegion,
    timePreset,
    visitPeriodStart,
    visitPeriodEnd,
    userRole,
    highlightTarget,
    settingsScoutFocus,
    setScreen,
    setMapsPanel,
    setSelectedId,
    setLocale,
    setMapProvider,
    setNewsQuery: (query: string) => {
      newsQuery.value = query;
    },
    setNewsRegion: (region: string) => {
      newsRegion.value = region;
    },
    setSelectedArticleId: (id: string) => {
      selectedArticleId.value = id;
    },
    setMapTabId: (tabId: 'map' | 'list') => {
      mapTabId.value = tabId;
    },
    setMapLocationQuery: (query: string) => {
      mapLocationQuery.value = query;
    },
    focusDestinationOnMap,
    goToMapView,
    setDestSearch: (query: string) => {
      destSearch.value = query;
    },
    setDestRegion: (region: string) => {
      destRegion.value = region;
    },
    setTimePreset: (preset: string) => {
      timePreset.value = preset;
    },
    setVisitPeriod,
    setUserRole,
    setHighlightTarget: (target: SettingsHighlightTarget) => {
      highlightTarget.value = target;
    },
    openAuthoringForDestination,
    openScoutSettings,
  };
}
