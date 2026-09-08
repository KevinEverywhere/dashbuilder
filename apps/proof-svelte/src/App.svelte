<script lang="ts">
  import { buildAtlasLocation } from '@rosettadash/core';
  import { DESTINATION_ATLAS_NAV_SCREENS, DESTINATION_ATLAS_SCREENS, MOCK_DESTINATIONS } from '@destination-atlas';
  import { screenAllowedForRole } from './lib/roles';
  import { provideConsumerSecrets } from './lib/consumer-secrets.svelte';
  import { createThemePreference } from './lib/theme-preference.svelte';
  import { createClientRouterMode } from './state/client-router-mode.svelte';
  import { createDestinationAtlasState } from './state/destination-atlas-state.svelte';
  import type { SettingFieldTarget } from './lib/settings-highlight';
  import ErrorBoundary from './components/ErrorBoundary.svelte';
  import ScreenWorkbenchMobileToggle from './components/ScreenWorkbenchMobileToggle.svelte';
  import ScreenWorkbenchPreview from './components/ScreenWorkbenchPreview.svelte';
  import ComponentSourcePanel from './components/ComponentSourcePanel.svelte';
  import RouterModeSelect from './components/RouterModeSelect.svelte';
  import AtlasContextSummary from './components/AtlasContextSummary.svelte';
  import AboutScreen, { ABOUT_SOURCE } from './screens/AboutScreen.svelte';
  import OverviewScreen, { OVERVIEW_SOURCE } from './screens/OverviewScreen.svelte';
  import DestinationsScreen, { DESTINATIONS_SOURCE } from './screens/DestinationsScreen.svelte';
  import MapsScreen, { MAPS_SOURCE } from './screens/MapsScreen.svelte';
  import MediaScreen, { MEDIA_SOURCE } from './screens/MediaScreen.svelte';
  import AuthoringScreen, { AUTHORING_SOURCE } from './screens/AuthoringScreen.svelte';
  import IntelScreen, { INTEL_SOURCE } from './screens/IntelScreen.svelte';
  import PlanScreen, { PLAN_SOURCE } from './screens/PlanScreen.svelte';
  import ViewsScreen, { VIEWS_SOURCE } from './screens/ViewsScreen.svelte';
  import StackScreen, { STACK_SOURCE } from './screens/StackScreen.svelte';
  import SettingsScreen, { SETTINGS_SOURCE } from './screens/SettingsScreen.svelte';

  provideConsumerSecrets();

  const initialDestId = MOCK_DESTINATIONS[0]?.id ?? '';
  const atlas = createDestinationAtlasState(initialDestId);
  const themeStore = createThemePreference();
  const routerModeStore = createClientRouterMode();

  let mobileView = $state<'preview' | 'source'>('preview');

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

  const activeScreen = $derived(DESTINATION_ATLAS_SCREENS.find((screen) => screen.id === atlas.screen));
  const visibleScreens = $derived(
    DESTINATION_ATLAS_NAV_SCREENS.filter((screen) => screenAllowedForRole(screen.id, atlas.userRole)),
  );

  const atlasQuery = $derived({
    dest: atlas.selectedId,
    locale: atlas.locale,
    provider: atlas.mapProvider,
    role: atlas.userRole,
  });

  const urlDefaults = {
    dest: initialDestId,
    locale: 'en',
    provider: 'leaflet' as const,
    role: 'viewer' as const,
  };

  function screenTo(screenId: (typeof visibleScreens)[number]['id']) {
    const mapsPanel = screenId === 'maps' ? atlas.mapsPanel : 'map';
    const { pathname, search } = buildAtlasLocation(screenId, atlasQuery, urlDefaults, mapsPanel);
    const query = Object.fromEntries(new URLSearchParams(search.replace(/^\?/, '')));
    return { path: pathname, query };
  }

  function screenHref(screenId: (typeof visibleScreens)[number]['id']) {
    const { path, query } = screenTo(screenId);
    const search = new URLSearchParams(query).toString();
    return search ? `${path}?${search}` : path;
  }

  function navigateScreen(screenId: (typeof visibleScreens)[number]['id'], event: MouseEvent) {
    event.preventDefault();
    atlas.setScreen(screenId);
  }

  function openSetting(field: SettingFieldTarget | 'theme' | 'ai') {
    atlas.setHighlightTarget(field);
    atlas.setScreen('settings');
  }

</script>

<div class="da-shell">
  <header class="da-header">
    <h1>Destination Atlas</h1>
    <p>Current and historic information about world locations — Svelte proof (DAS-158)</p>
  </header>

  <div class="da-body-row">
    <div class="da-preview-column">
      <div class="da-context-strip">
        <RouterModeSelect
          mode={routerModeStore.routerMode}
          onChange={routerModeStore.setRouterMode}
        />
        <AtlasContextSummary
          locale={atlas.locale}
          userRole={atlas.userRole}
          mapProvider={atlas.mapProvider}
          selectedId={atlas.selectedId}
          theme={themeStore.theme}
          onOpenSetting={openSetting}
        />
      </div>

      <nav class="da-nav da-tabbar" aria-label="Screens">
        {#each visibleScreens as screen (screen.id)}
          <a
            href={screenHref(screen.id)}
            class="da-tabbar__tab"
            aria-current={atlas.screen === screen.id ? 'page' : undefined}
            onclick={(event) => navigateScreen(screen.id, event)}
          >
            {screen.label}
          </a>
        {/each}
      </nav>

      <div class="da-workbench-host">
        {#key atlas.screen}
          <ErrorBoundary label={activeScreen?.label ?? atlas.screen}>
            <ScreenWorkbenchMobileToggle {mobileView} onChange={(view) => (mobileView = view)} />
            <ScreenWorkbenchPreview {mobileView}>
              {#if atlas.screen === 'about'}
              <AboutScreen />
            {:else if atlas.screen === 'overview'}
              <OverviewScreen locale={atlas.locale} userRole={atlas.userRole} />
            {:else if atlas.screen === 'destinations'}
              <DestinationsScreen
                locale={atlas.locale}
                userRole={atlas.userRole}
                selectedId={atlas.selectedId}
                destSearch={atlas.destSearch}
                destRegion={atlas.destRegion}
                timePreset={atlas.timePreset}
                visitPeriodStart={atlas.visitPeriodStart}
                visitPeriodEnd={atlas.visitPeriodEnd}
                onSelectedIdChange={atlas.setSelectedId}
                onDestSearchChange={atlas.setDestSearch}
                onDestRegionChange={atlas.setDestRegion}
                onTimePresetChange={atlas.setTimePreset}
                onVisitPeriodChange={atlas.setVisitPeriod}
                onFocusDestinationOnMap={atlas.focusDestinationOnMap}
              />
            {:else if atlas.screen === 'maps'}
              <MapsScreen
                locale={atlas.locale}
                selectedId={atlas.selectedId}
                mapProvider={atlas.mapProvider}
                mapLocationQuery={atlas.mapLocationQuery}
                mapViewOverride={atlas.mapViewOverride}
                mapsPanel={atlas.mapsPanel}
                onSelectedIdChange={atlas.setSelectedId}
                onMapProviderChange={atlas.setMapProvider}
                onMapLocationQueryChange={atlas.setMapLocationQuery}
                onMapsPanelChange={atlas.setMapsPanel}
                onFocusDestinationOnMap={atlas.focusDestinationOnMap}
                onGoToMapView={atlas.goToMapView}
                onOpenSettings={() => openSetting('integrations')}
              />
            {:else if atlas.screen === 'media'}
              <MediaScreen
                locale={atlas.locale}
                selectedId={atlas.selectedId}
                onSelectedIdChange={atlas.setSelectedId}
                onOpenAuthoring={atlas.openAuthoringForDestination}
              />
            {:else if atlas.screen === 'authoring'}
              <AuthoringScreen
                locale={atlas.locale}
                selectedId={atlas.selectedId}
                onSelectedIdChange={atlas.setSelectedId}
              />
            {:else if atlas.screen === 'intel'}
              <IntelScreen
                userRole={atlas.userRole}
                selectedId={atlas.selectedId}
                newsQuery={atlas.newsQuery}
                newsRegion={atlas.newsRegion}
                selectedArticleId={atlas.selectedArticleId}
                onNewsQueryChange={atlas.setNewsQuery}
                onNewsRegionChange={atlas.setNewsRegion}
                onSelectedArticleIdChange={atlas.setSelectedArticleId}
              />
            {:else if atlas.screen === 'plan'}
              <PlanScreen userRole={atlas.userRole} locale={atlas.locale} />
            {:else if atlas.screen === 'views'}
              <ViewsScreen
                locale={atlas.locale}
                selectedId={atlas.selectedId}
                onSelectedIdChange={atlas.setSelectedId}
              />
            {:else if atlas.screen === 'stack'}
              <StackScreen userRole={atlas.userRole} />
            {:else if atlas.screen === 'settings'}
              <SettingsScreen
                locale={atlas.locale}
                userRole={atlas.userRole}
                mapProvider={atlas.mapProvider}
                selectedId={atlas.selectedId}
                highlightTarget={atlas.highlightTarget}
                theme={themeStore.theme}
                onLocaleChange={atlas.setLocale}
                onUserRoleChange={atlas.setUserRole}
                onMapProviderChange={atlas.setMapProvider}
                onSelectedIdChange={atlas.setSelectedId}
                onHighlightTargetChange={atlas.setHighlightTarget}
                onThemeChange={themeStore.setTheme}
              />
              {/if}
            </ScreenWorkbenchPreview>
          </ErrorBoundary>
        {/key}
      </div>
    </div>
    <ComponentSourcePanel source={SCREEN_SOURCES[atlas.screen] ?? ''} hidden={mobileView === 'preview'} />
  </div>
</div>
