<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import { buildAtlasLocation } from '@rosettadash/core';
import { DESTINATION_ATLAS_NAV_SCREENS, DESTINATION_ATLAS_SCREENS, MOCK_DESTINATIONS } from '@destination-atlas';
import { screenAllowedForRole } from './lib/roles';
import { useClientRouterMode } from './composables/use-client-router-mode';
import { useDestinationAtlasState } from './composables/use-destination-atlas-state';
import { useThemePreference } from './composables/use-theme-preference';
import type { SettingFieldTarget } from './lib/settings-highlight';
import ErrorBoundary from './components/ErrorBoundary.vue';
import ScreenWorkbenchMobileToggle from './components/ScreenWorkbenchMobileToggle.vue';
import ScreenWorkbenchPreview from './components/ScreenWorkbenchPreview.vue';
import ComponentSourcePanel from './components/ComponentSourcePanel.vue';
import RouterModeSelect from './components/RouterModeSelect.vue';
import AtlasContextSummary from './components/AtlasContextSummary.vue';
import AboutScreen, { ABOUT_SOURCE } from './screens/AboutScreen.vue';
import OverviewScreen, { OVERVIEW_SOURCE } from './screens/OverviewScreen.vue';
import DestinationsScreen, { DESTINATIONS_SOURCE } from './screens/DestinationsScreen.vue';
import MapsScreen, { MAPS_SOURCE } from './screens/MapsScreen.vue';
import MediaScreen, { MEDIA_SOURCE } from './screens/MediaScreen.vue';
import AuthoringScreen, { AUTHORING_SOURCE } from './screens/AuthoringScreen.vue';
import IntelScreen, { INTEL_SOURCE } from './screens/IntelScreen.vue';
import PlanScreen, { PLAN_SOURCE } from './screens/PlanScreen.vue';
import ViewsScreen, { VIEWS_SOURCE } from './screens/ViewsScreen.vue';
import StackScreen, { STACK_SOURCE } from './screens/StackScreen.vue';
import SettingsScreen, { SETTINGS_SOURCE } from './screens/SettingsScreen.vue';

const initialDestId = MOCK_DESTINATIONS[0]?.id ?? '';
const atlas = useDestinationAtlasState(initialDestId);
const { theme, setTheme } = useThemePreference();
const { routerMode, setRouterMode } = useClientRouterMode();
const mobileView = ref<'preview' | 'source'>('preview');

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

const activeScreen = computed(() => DESTINATION_ATLAS_SCREENS.find((screen) => screen.id === atlas.screen.value));
const visibleScreens = computed(() =>
  DESTINATION_ATLAS_NAV_SCREENS.filter((screen) => screenAllowedForRole(screen.id, atlas.userRole.value)),
);

const atlasQuery = computed(() => ({
  dest: atlas.selectedId.value,
  locale: atlas.locale.value,
  provider: atlas.mapProvider.value,
  role: atlas.userRole.value,
}));

const urlDefaults = {
  dest: initialDestId,
  locale: 'en',
  provider: 'leaflet' as const,
  role: 'viewer' as const,
};

function screenTo(screenId: (typeof visibleScreens.value)[number]['id']) {
  const mapsPanel = screenId === 'maps' ? atlas.mapsPanel.value : 'map';
  const { pathname, search } = buildAtlasLocation(screenId, atlasQuery.value, urlDefaults, mapsPanel);
  const query = Object.fromEntries(new URLSearchParams(search.replace(/^\?/, '')));
  return { path: pathname, query };
}

function openSetting(field: SettingFieldTarget | 'theme' | 'ai') {
  atlas.setHighlightTarget(field);
  atlas.setScreen('settings');
}

</script>

<template>
  <div class="da-shell">
    <header class="da-header">
      <h1>Destination Atlas</h1>
      <p>Current and historic information about world locations — Vue proof (DAS-124)</p>
    </header>

    <div class="da-body-row">
      <div class="da-preview-column">
        <div class="da-context-strip">
          <RouterModeSelect :mode="routerMode" @change="setRouterMode" />
          <AtlasContextSummary
            :locale="atlas.locale.value"
            :user-role="atlas.userRole.value"
            :map-provider="atlas.mapProvider.value"
            :selected-id="atlas.selectedId.value"
            :theme="theme"
            @open-setting="openSetting"
          />
        </div>

        <nav class="da-nav da-tabbar" aria-label="Screens">
          <RouterLink
            v-for="screen in visibleScreens"
            :key="screen.id"
            class="da-tabbar__tab"
            :to="screenTo(screen.id)"
            :aria-current="atlas.screen.value === screen.id ? 'page' : undefined"
          >
            {{ screen.label }}
          </RouterLink>
        </nav>

        <div class="da-workbench-host">
          <ErrorBoundary :label="activeScreen?.label ?? atlas.screen.value">
            <ScreenWorkbenchMobileToggle :mobile-view="mobileView" @change="mobileView = $event" />
            <ScreenWorkbenchPreview :mobile-view="mobileView">
              <AboutScreen v-if="atlas.screen.value === 'about'" />
              <OverviewScreen
                v-else-if="atlas.screen.value === 'overview'"
                :locale="atlas.locale.value"
                :user-role="atlas.userRole.value"
              />
              <DestinationsScreen
                v-else-if="atlas.screen.value === 'destinations'"
                :locale="atlas.locale.value"
                :user-role="atlas.userRole.value"
                :selected-id="atlas.selectedId.value"
                :dest-search="atlas.destSearch.value"
                :dest-region="atlas.destRegion.value"
                :time-preset="atlas.timePreset.value"
                :visit-period-start="atlas.visitPeriodStart.value"
                :visit-period-end="atlas.visitPeriodEnd.value"
                @update:selected-id="atlas.setSelectedId"
                @update:dest-search="atlas.setDestSearch"
                @update:dest-region="atlas.setDestRegion"
                @update:time-preset="atlas.setTimePreset"
                @update:visit-period="atlas.setVisitPeriod"
                @focus-destination-on-map="atlas.focusDestinationOnMap"
              />
              <MapsScreen
                v-else-if="atlas.screen.value === 'maps'"
                :locale="atlas.locale.value"
                :selected-id="atlas.selectedId.value"
                :map-provider="atlas.mapProvider.value"
                :map-location-query="atlas.mapLocationQuery.value"
                :map-view-override="atlas.mapViewOverride.value"
                :maps-panel="atlas.mapsPanel.value"
                @update:selected-id="atlas.setSelectedId"
                @update:map-provider="atlas.setMapProvider"
                @update:map-location-query="atlas.setMapLocationQuery"
                @update:maps-panel="atlas.setMapsPanel"
                @focus-destination-on-map="atlas.focusDestinationOnMap"
                @go-to-map-view="atlas.goToMapView"
                @open-settings="openSetting('integrations')"
              />
              <MediaScreen
                v-else-if="atlas.screen.value === 'media'"
                :locale="atlas.locale.value"
                :selected-id="atlas.selectedId.value"
                @update:selected-id="atlas.setSelectedId"
                @open-authoring="atlas.openAuthoringForDestination"
              />
              <AuthoringScreen
                v-else-if="atlas.screen.value === 'authoring'"
                :locale="atlas.locale.value"
                :selected-id="atlas.selectedId.value"
                @update:selected-id="atlas.setSelectedId"
              />
              <IntelScreen
                v-else-if="atlas.screen.value === 'intel'"
                :user-role="atlas.userRole.value"
                :news-query="atlas.newsQuery.value"
                :news-region="atlas.newsRegion.value"
                :selected-article-id="atlas.selectedArticleId.value"
                @update:news-query="atlas.setNewsQuery"
                @update:news-region="atlas.setNewsRegion"
                @update:selected-article-id="atlas.setSelectedArticleId"
              />
              <PlanScreen
                v-else-if="atlas.screen.value === 'plan'"
                :user-role="atlas.userRole.value"
                :locale="atlas.locale.value"
              />
              <ViewsScreen
                v-else-if="atlas.screen.value === 'views'"
                :locale="atlas.locale.value"
                :selected-id="atlas.selectedId.value"
                @update:selected-id="atlas.setSelectedId"
              />
              <StackScreen v-else-if="atlas.screen.value === 'stack'" :user-role="atlas.userRole.value" />
              <SettingsScreen
                v-else-if="atlas.screen.value === 'settings'"
                :locale="atlas.locale.value"
                :user-role="atlas.userRole.value"
                :map-provider="atlas.mapProvider.value"
                :selected-id="atlas.selectedId.value"
                :highlight-target="atlas.highlightTarget.value"
                :theme="theme"
                @update:locale="atlas.setLocale"
                @update:user-role="atlas.setUserRole"
                @update:map-provider="atlas.setMapProvider"
                @update:selected-id="atlas.setSelectedId"
                @update:highlight-target="atlas.setHighlightTarget"
                @update:theme="setTheme"
              />
            </ScreenWorkbenchPreview>
          </ErrorBoundary>
        </div>
      </div>
      <ComponentSourcePanel
        :source="SCREEN_SOURCES[atlas.screen.value] ?? ''"
        :hidden="mobileView === 'preview'"
      />
    </div>
  </div>
</template>
