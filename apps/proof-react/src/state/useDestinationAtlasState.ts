import { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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

export function useDestinationAtlasState(initialSelectedId: string): DestinationAtlasState & {
  setScreen: (screen: DestinationAtlasScreenId) => void;
  setMapsPanel: (panel: MapsPanelId) => void;
  setSelectedId: (id: string) => void;
  setLocale: (locale: string) => void;
  setMapProvider: (provider: GeoMapProvider) => void;
  setNewsQuery: (query: string) => void;
  setNewsRegion: (region: string) => void;
  setSelectedArticleId: (id: string) => void;
  setMapTabId: (tabId: 'map' | 'list') => void;
  setMapLocationQuery: (query: string) => void;
  focusDestinationOnMap: (id: string) => void;
  goToMapView: (view: { lat: number; lng: number; zoom: number; label: string }) => void;
  setDestSearch: (query: string) => void;
  setDestRegion: (region: string) => void;
  setTimePreset: (preset: string) => void;
  setVisitPeriod: (range: { startDate: string; endDate: string }) => void;
  setUserRole: (role: AtlasUserRole) => void;
  setHighlightTarget: (target: SettingsHighlightTarget) => void;
  openAuthoringForDestination: (destinationId: string) => void;
  openScoutSettings: () => void;
  settingsScoutFocus: boolean;
} {
  const location = useLocation();
  const navigate = useNavigate();

  const urlDefaults = useMemo<AtlasUrlDefaults>(
    () => ({
      dest: initialSelectedId,
      locale: 'en',
      provider: 'leaflet',
      role: 'viewer',
    }),
    [initialSelectedId],
  );

  const urlState = useMemo(
    () => parseAtlasUrlState(location.pathname, location.search, urlDefaults),
    [location.pathname, location.search, urlDefaults],
  );

  const screen = urlState.screen;
  const mapsPanel = mapsPanelFromPath(location.pathname);
  const selectedId = urlState.dest || initialSelectedId;
  const locale = urlState.locale;
  const mapProvider = urlState.provider as GeoMapProvider;
  const userRole = urlState.role as AtlasUserRole;

  const settingsScoutFocus = useMemo(() => {
    const params = new URLSearchParams(location.search.replace(/^\?/, ''));
    return screen === 'settings' && params.get('scout') === '1';
  }, [location.search, screen]);

  const [newsQuery, setNewsQuery] = useState('');
  const [newsRegion, setNewsRegion] = useState('');
  const [selectedArticleId, setSelectedArticleId] = useState('');
  const [mapTabId, setMapTabId] = useState<'map' | 'list'>('map');
  const [mapLocationQuery, setMapLocationQuery] = useState('');
  const [mapViewOverride, setMapViewOverride] = useState<{
    lat: number;
    lng: number;
    zoom: number;
    label: string;
  } | null>(null);
  const [destSearch, setDestSearch] = useState('');
  const [destRegion, setDestRegion] = useState('');
  const [timePreset, setTimePreset] = useState('5y');
  const [visitPeriodStart, setVisitPeriodStart] = useState('2015-01');
  const [visitPeriodEnd, setVisitPeriodEnd] = useState('2024-12');
  const [highlightTarget, setHighlightTarget] = useState<SettingsHighlightTarget>(null);

  const atlasQuery = useMemo(
    () => ({
      dest: selectedId,
      locale,
      provider: mapProvider,
      role: userRole,
    }),
    [selectedId, locale, mapProvider, userRole],
  );

  const navigateAtlas = useCallback(
    (
      nextScreen: DestinationAtlasScreenId,
      query = atlasQuery,
      replace = false,
      nextMapsPanel: MapsPanelId = mapsPanel,
    ) => {
      const panel = nextScreen === 'maps' ? nextMapsPanel : 'map';
      const { pathname, search } = buildAtlasLocation(nextScreen, query, urlDefaults, panel);
      navigate({ pathname, search }, { replace });
    },
    [atlasQuery, mapsPanel, navigate, urlDefaults],
  );

  const setScreen = useCallback(
    (nextScreen: DestinationAtlasScreenId) => {
      navigateAtlas(nextScreen);
    },
    [navigateAtlas],
  );

  const setMapsPanel = useCallback(
    (panel: MapsPanelId) => {
      navigateAtlas('maps', atlasQuery, false, panel);
    },
    [atlasQuery, navigateAtlas],
  );

  const setSelectedId = useCallback(
    (id: string) => {
      setMapViewOverride(null);
      setMapLocationQuery('');
      navigateAtlas(screen, { ...atlasQuery, dest: id });
    },
    [atlasQuery, navigateAtlas, screen],
  );

  const setLocale = useCallback(
    (nextLocale: string) => {
      navigateAtlas(screen, { ...atlasQuery, locale: nextLocale });
    },
    [atlasQuery, navigateAtlas, screen],
  );

  const setMapProvider = useCallback(
    (provider: GeoMapProvider) => {
      navigateAtlas(screen, { ...atlasQuery, provider });
    },
    [atlasQuery, navigateAtlas, screen],
  );

  const setUserRole = useCallback(
    (role: AtlasUserRole) => {
      navigateAtlas(screen, { ...atlasQuery, role });
    },
    [atlasQuery, navigateAtlas, screen],
  );

  const setVisitPeriod = (range: { startDate: string; endDate: string }) => {
    setVisitPeriodStart(range.startDate);
    setVisitPeriodEnd(range.endDate);
  };

  const focusDestinationOnMap = useCallback(
    (id: string) => {
      setMapViewOverride(null);
      setMapLocationQuery('');
      setMapTabId('map');
      navigateAtlas('maps', { ...atlasQuery, dest: id }, false, 'map');
    },
    [atlasQuery, navigateAtlas],
  );

  const goToMapView = useCallback(
    (view: { lat: number; lng: number; zoom: number; label: string }) => {
      setMapViewOverride(view);
      setMapTabId('map');
      navigateAtlas('maps', atlasQuery, false, 'map');
    },
    [atlasQuery, navigateAtlas],
  );

  const openAuthoringForDestination = useCallback(
    (destinationId: string) => {
      navigateAtlas('authoring', { ...atlasQuery, dest: destinationId });
    },
    [atlasQuery, navigateAtlas],
  );

  const openScoutSettings = useCallback(() => {
    setHighlightTarget('ai');
    const { pathname, search } = buildAtlasLocation('settings', atlasQuery, urlDefaults);
    const params = new URLSearchParams(search.replace(/^\?/, ''));
    params.set('scout', '1');
    const nextSearch = params.toString();
    navigate({ pathname, search: nextSearch ? `?${nextSearch}` : '' });
  }, [atlasQuery, navigate, urlDefaults]);

  useEffect(() => {
    const redirect = legacyAtlasPathRedirect(location.pathname);
    if (redirect) {
      if (location.pathname.replace(/\/+$/, '') === '/scout') {
        setHighlightTarget('ai');
        const params = new URLSearchParams(location.search.replace(/^\?/, ''));
        params.set('scout', '1');
        const nextSearch = params.toString();
        navigate({ pathname: redirect, search: nextSearch ? `?${nextSearch}` : '' }, { replace: true });
        return;
      }
      navigate({ pathname: redirect, search: location.search }, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!isKnownDestinationAtlasPath(location.pathname)) {
      navigateAtlas('about', atlasQuery, true);
    }
  }, [atlasQuery, location.pathname, navigateAtlas]);

  useEffect(() => {
    if (!screenAllowedForRole(screen, userRole)) {
      navigateAtlas('about', atlasQuery, true);
    }
  }, [atlasQuery, navigateAtlas, screen, userRole]);

  return useMemo(
    () => ({
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
      setNewsQuery,
      setNewsRegion,
      setSelectedArticleId,
      setMapTabId,
      setMapLocationQuery,
      focusDestinationOnMap,
      goToMapView,
      setDestSearch,
      setDestRegion,
      setTimePreset,
      setVisitPeriod,
      setUserRole,
      setHighlightTarget,
      openAuthoringForDestination,
      openScoutSettings,
    }),
    [
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
      setUserRole,
      focusDestinationOnMap,
      goToMapView,
      openAuthoringForDestination,
      openScoutSettings,
    ],
  );
}

export type AtlasContext = ReturnType<typeof useDestinationAtlasState>;
