<script setup lang="ts">
import { DEFAULT_APP_LOCALES, GEO_MAP_PROVIDERS, MOCK_DESTINATIONS, type GeoMapProvider } from '@destination-atlas';
import { AppLanguageSelect } from '@rosettadash/vue/domain/i18n/app-language-select';
import BoundSelectInput from './BoundSelectInput.vue';
import { ATLAS_USER_ROLES, type AtlasUserRole } from '../lib/roles';
import { localizedDestinationName } from '../lib/atlas-utils';
import type { SettingFieldTarget } from '../lib/settings-highlight';

const props = defineProps<{
  locale: string;
  userRole: AtlasUserRole;
  mapProvider: GeoMapProvider;
  selectedId: string;
  highlightField?: SettingFieldTarget | null;
  class?: string;
}>();

const emit = defineEmits<{
  'update:locale': [string];
  'update:userRole': [AtlasUserRole];
  'update:mapProvider': [GeoMapProvider];
  'update:selectedId': [string];
}>();

const ROLE_HINT = 'Preview permissions for gated screens.';
const LOCALE_HINT = 'Base locale for developer-owned destination labels.';
const MAP_HINT = 'Default 2D map engine for the Map screen.';
const SELECTED_HINT = 'Active destination across tabs and URL state.';

const mapOptions = GEO_MAP_PROVIDERS.map((entry) => ({ value: entry.id, label: entry.label }));

const destinationOptions = () =>
  MOCK_DESTINATIONS.map((dest) => ({
    value: dest.id,
    label: localizedDestinationName(dest, props.locale),
  }));

function cellClass(key: SettingFieldTarget) {
  return ['da-context-grid__cell', props.highlightField === key ? 'rd-highlight-target' : undefined]
    .filter(Boolean)
    .join(' ');
}

function onLocaleChange(detail: { locale?: string }) {
  if (detail.locale) {
    emit('update:locale', detail.locale);
  }
}
</script>

<template>
  <div :class="['da-context-grid', $props.class].filter(Boolean)">
    <div data-setting="role" :class="cellClass('role')">
      <BoundSelectInput
        field-label="Role"
        :options="ATLAS_USER_ROLES.map((entry) => ({ value: entry.id, label: entry.label }))"
        :value="userRole"
        @update:value="emit('update:userRole', $event as AtlasUserRole)"
      />
      <p class="da-context-grid__hint">{{ ROLE_HINT }}</p>
    </div>
    <div data-setting="locale" :class="cellClass('locale')">
      <AppLanguageSelect
        label="App locale"
        :locales="DEFAULT_APP_LOCALES"
        :value="locale"
        @locale-change="onLocaleChange"
      />
      <p class="da-context-grid__hint">{{ LOCALE_HINT }}</p>
    </div>
    <div data-setting="map" :class="cellClass('map')">
      <BoundSelectInput
        field-label="Map provider"
        :options="mapOptions"
        :value="mapProvider"
        @update:value="emit('update:mapProvider', $event as GeoMapProvider)"
      />
      <p class="da-context-grid__hint">{{ MAP_HINT }}</p>
    </div>
    <div data-setting="selected" :class="cellClass('selected')">
      <BoundSelectInput
        field-label="Selected"
        :options="destinationOptions()"
        :value="selectedId"
        @update:value="emit('update:selectedId', $event)"
      />
      <p class="da-context-grid__hint">{{ SELECTED_HINT }}</p>
    </div>
  </div>
</template>
