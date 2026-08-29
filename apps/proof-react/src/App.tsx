import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { buildAtlasLocation } from '@rosettadash/core';
import { DESTINATION_ATLAS_NAV_SCREENS, DESTINATION_ATLAS_SCREENS, MOCK_DESTINATIONS } from '@destination-atlas';
import { screenAllowedForRole } from './lib/roles';
import { useClientRouterMode } from './lib/client-router';
import { useDestinationAtlasState } from './state/useDestinationAtlasState';
import { AboutScreen, ABOUT_SOURCE } from './screens/AboutScreen';
import { OverviewScreen, OVERVIEW_SOURCE } from './screens/OverviewScreen';
import { DestinationsScreen, DESTINATIONS_SOURCE } from './screens/DestinationsScreen';
import { MapsScreen, MAPS_SOURCE } from './screens/MapsScreen';
import { MediaScreen, MEDIA_SOURCE } from './screens/MediaScreen';
import { AuthoringScreen, AUTHORING_SOURCE } from './screens/AuthoringScreen';
import { IntelScreen, INTEL_SOURCE } from './screens/IntelScreen';
import { PlanScreen, PLAN_SOURCE } from './screens/PlanScreen';
import { ViewsScreen, VIEWS_SOURCE } from './screens/ViewsScreen';
import { StackScreen, STACK_SOURCE } from './screens/StackScreen';
import { SettingsScreen, SETTINGS_SOURCE } from './screens/SettingsScreen';
import { useThemePreference } from './lib/theme';
import type { SettingFieldTarget } from './lib/settings-highlight';
import { ErrorBoundary } from './components/ErrorBoundary';
import {
  ComponentSourcePanel,
  ScreenWorkbenchMobileToggle,
  ScreenWorkbenchPreview,
} from './components/ScreenWorkbench';
import { RouterModeSelect } from './components/RouterModeSelect';
import { AtlasContextSummary } from './components/AtlasContextSummary';

const SCREEN_SOURCES: Record<string, string> = {
  about: ABOUT_SOURCE,
  overview: OVERVIEW_SOURCE,
  destinations: DESTINATIONS_SOURCE,
  maps: MAPS_SOURCE,
  media: MEDIA_SOURCE,
  authoring: AUTHORING_SOURCE,
  intel: INTEL_SOURCE,
  plan: PLAN_SOURCE,
  views: VIEWS_SOURCE,
  stack: STACK_SOURCE,
  settings: SETTINGS_SOURCE,
};

export function App() {
  const initialDestId = MOCK_DESTINATIONS[0]?.id ?? '';
  const atlas = useDestinationAtlasState(initialDestId);
  const { theme, setTheme } = useThemePreference();
  const { routerMode, setRouterMode } = useClientRouterMode();
  const [mobileView, setMobileView] = useState<'preview' | 'source'>('preview');
  const activeScreen = DESTINATION_ATLAS_SCREENS.find((screen) => screen.id === atlas.screen);
  const visibleScreens = DESTINATION_ATLAS_NAV_SCREENS.filter((screen) =>
    screenAllowedForRole(screen.id, atlas.userRole),
  );

  const atlasQuery = {
    dest: atlas.selectedId,
    locale: atlas.locale,
    provider: atlas.mapProvider,
    role: atlas.userRole,
  };

  const urlDefaults = {
    dest: initialDestId,
    locale: 'en',
    provider: 'leaflet' as const,
    role: 'viewer' as const,
  };

  const screenTo = (screenId: (typeof visibleScreens)[number]['id']) => {
    const mapsPanel = screenId === 'maps' ? atlas.mapsPanel : 'map';
    const { pathname, search } = buildAtlasLocation(screenId, atlasQuery, urlDefaults, mapsPanel);
    return { pathname, search };
  };

  const openSetting = (field: SettingFieldTarget | 'theme' | 'ai') => {
    atlas.setHighlightTarget(field);
    atlas.setScreen('settings');
  };

  return (
    <div className="da-shell">
      <header className="da-header">
        <h1>Destination Atlas</h1>
        <p>Current and historic information about world locations — React proof</p>
      </header>

      <div className="da-body-row">
        <div className="da-preview-column">
          <div className="da-context-strip">
            <RouterModeSelect mode={routerMode} onChange={setRouterMode} />
            <AtlasContextSummary
              locale={atlas.locale}
              userRole={atlas.userRole}
              mapProvider={atlas.mapProvider}
              selectedId={atlas.selectedId}
              theme={theme}
              onOpenSetting={openSetting}
            />
          </div>

          <nav className="da-nav da-tabbar" aria-label="Screens">
            {visibleScreens.map((screen) => (
              <NavLink
                key={screen.id}
                className="da-tabbar__tab"
                to={screenTo(screen.id)}
                aria-current={atlas.screen === screen.id ? 'page' : undefined}
              >
                {screen.label}
              </NavLink>
            ))}
          </nav>

          <div className="da-workbench-host">
            <ErrorBoundary label={activeScreen?.label ?? atlas.screen}>
              <ScreenWorkbenchMobileToggle mobileView={mobileView} onChange={setMobileView} />
              <ScreenWorkbenchPreview mobileView={mobileView}>
              {atlas.screen === 'about' ? <AboutScreen /> : null}
              {atlas.screen === 'overview' ? (
                <OverviewScreen locale={atlas.locale} userRole={atlas.userRole} />
              ) : null}
              {atlas.screen === 'destinations' ? (
                <DestinationsScreen
                  locale={atlas.locale}
                  userRole={atlas.userRole}
                  selectedId={atlas.selectedId}
                  setSelectedId={atlas.setSelectedId}
                  destSearch={atlas.destSearch}
                  setDestSearch={atlas.setDestSearch}
                  destRegion={atlas.destRegion}
                  setDestRegion={atlas.setDestRegion}
                  timePreset={atlas.timePreset}
                  setTimePreset={atlas.setTimePreset}
                  visitPeriodStart={atlas.visitPeriodStart}
                  visitPeriodEnd={atlas.visitPeriodEnd}
                  setVisitPeriod={atlas.setVisitPeriod}
                  focusDestinationOnMap={atlas.focusDestinationOnMap}
                />
              ) : null}
              {atlas.screen === 'maps' ? (
                <MapsScreen
                  locale={atlas.locale}
                  selectedId={atlas.selectedId}
                  setSelectedId={atlas.setSelectedId}
                  mapProvider={atlas.mapProvider}
                  setMapProvider={atlas.setMapProvider}
                  mapLocationQuery={atlas.mapLocationQuery}
                  setMapLocationQuery={atlas.setMapLocationQuery}
                  mapViewOverride={atlas.mapViewOverride}
                  focusDestinationOnMap={atlas.focusDestinationOnMap}
                  goToMapView={atlas.goToMapView}
                  setScreen={atlas.setScreen}
                  setHighlightTarget={atlas.setHighlightTarget}
                  mapsPanel={atlas.mapsPanel}
                  setMapsPanel={atlas.setMapsPanel}
                />
              ) : null}
              {atlas.screen === 'media' ? (
                <MediaScreen
                  locale={atlas.locale}
                  selectedId={atlas.selectedId}
                  setSelectedId={atlas.setSelectedId}
                  openAuthoringForDestination={atlas.openAuthoringForDestination}
                />
              ) : null}
              {atlas.screen === 'authoring' ? (
                <AuthoringScreen locale={atlas.locale} selectedId={atlas.selectedId} />
              ) : null}
              {atlas.screen === 'intel' ? (
                <IntelScreen
                  userRole={atlas.userRole}
                  newsQuery={atlas.newsQuery}
                  setNewsQuery={atlas.setNewsQuery}
                  newsRegion={atlas.newsRegion}
                  setNewsRegion={atlas.setNewsRegion}
                  selectedArticleId={atlas.selectedArticleId}
                  setSelectedArticleId={atlas.setSelectedArticleId}
                  setScreen={atlas.setScreen}
                  setHighlightTarget={atlas.setHighlightTarget}
                />
              ) : null}
              {atlas.screen === 'plan' ? <PlanScreen userRole={atlas.userRole} locale={atlas.locale} /> : null}
              {atlas.screen === 'views' ? (
                <ViewsScreen locale={atlas.locale} selectedId={atlas.selectedId} setSelectedId={atlas.setSelectedId} />
              ) : null}
              {atlas.screen === 'stack' ? <StackScreen userRole={atlas.userRole} /> : null}
              {atlas.screen === 'settings' ? (
                <SettingsScreen
                  locale={atlas.locale}
                  userRole={atlas.userRole}
                  setLocale={atlas.setLocale}
                  setUserRole={atlas.setUserRole}
                  mapProvider={atlas.mapProvider}
                  setMapProvider={atlas.setMapProvider}
                  selectedId={atlas.selectedId}
                  setSelectedId={atlas.setSelectedId}
                  highlightTarget={atlas.highlightTarget}
                  setHighlightTarget={atlas.setHighlightTarget}
                  theme={theme}
                  setTheme={setTheme}
                />
              ) : null}
            </ScreenWorkbenchPreview>
            </ErrorBoundary>
          </div>
        </div>
        <ComponentSourcePanel
          source={SCREEN_SOURCES[atlas.screen] ?? ''}
          hidden={mobileView === 'preview'}
        />
      </div>
    </div>
  );
}
