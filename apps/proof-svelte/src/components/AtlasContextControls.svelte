<script lang="ts">
  import { DEFAULT_APP_LOCALES, GEO_MAP_PROVIDERS, MOCK_DESTINATIONS, type GeoMapProvider } from '@destination-atlas';
  import AppLanguageSelect from '@rosettadash/svelte/domain/i18n/app-language-select';
  import BoundSelectInput from './BoundSelectInput.svelte';
  import { ATLAS_USER_ROLES, type AtlasUserRole } from '../lib/roles';
  import { localizedDestinationName } from '../lib/atlas-utils';
  import type { SettingFieldTarget } from '../lib/settings-highlight';

  let {
    locale,
    userRole,
    mapProvider,
    selectedId,
    highlightField = null,
    class: className,
    onLocaleChange,
    onUserRoleChange,
    onMapProviderChange,
    onSelectedIdChange,
  }: {
    locale: string;
    userRole: AtlasUserRole;
    mapProvider: GeoMapProvider;
    selectedId: string;
    highlightField?: SettingFieldTarget | null;
    class?: string;
    onLocaleChange?: (locale: string) => void;
    onUserRoleChange?: (role: AtlasUserRole) => void;
    onMapProviderChange?: (provider: GeoMapProvider) => void;
    onSelectedIdChange?: (id: string) => void;
  } = $props();

  const ROLE_HINT = 'Preview permissions for gated screens.';
  const LOCALE_HINT = 'Base locale for developer-owned destination labels.';
  const MAP_HINT = 'Default 2D map engine for the Map screen.';
  const SELECTED_HINT = 'Active destination across tabs and URL state.';

  const mapOptions = GEO_MAP_PROVIDERS.map((entry) => ({ value: entry.id, label: entry.label }));

  const destinationOptions = $derived(
    MOCK_DESTINATIONS.map((dest) => ({
      value: dest.id,
      label: localizedDestinationName(dest, locale),
    })),
  );

  function cellClass(key: SettingFieldTarget) {
    return ['da-context-grid__cell', highlightField === key ? 'rd-highlight-target' : undefined]
      .filter(Boolean)
      .join(' ');
  }

  function onLocaleDetail(detail: { locale?: string }) {
    if (detail.locale) {
      onLocaleChange?.(detail.locale);
    }
  }
</script>

<div class={['da-context-grid', className].filter(Boolean).join(' ')}>
  <div data-setting="role" class={cellClass('role')}>
    <BoundSelectInput
      fieldLabel="Role"
      options={ATLAS_USER_ROLES.map((entry) => ({ value: entry.id, label: entry.label }))}
      value={userRole}
      onValueChange={(value) => onUserRoleChange?.(value as AtlasUserRole)}
    />
    <p class="da-context-grid__hint">{ROLE_HINT}</p>
  </div>
  <div data-setting="locale" class={cellClass('locale')}>
    <AppLanguageSelect
      label="App locale"
      locales={DEFAULT_APP_LOCALES}
      value={locale}
      onLocaleChange={onLocaleDetail}
    />
    <p class="da-context-grid__hint">{LOCALE_HINT}</p>
  </div>
  <div data-setting="map" class={cellClass('map')}>
    <BoundSelectInput
      fieldLabel="Map provider"
      options={mapOptions}
      value={mapProvider}
      onValueChange={(value) => onMapProviderChange?.(value as GeoMapProvider)}
    />
    <p class="da-context-grid__hint">{MAP_HINT}</p>
  </div>
  <div data-setting="selected" class={cellClass('selected')}>
    <BoundSelectInput
      fieldLabel="Selected"
      options={destinationOptions}
      value={selectedId}
      onValueChange={(value) => onSelectedIdChange?.(value)}
    />
    <p class="da-context-grid__hint">{SELECTED_HINT}</p>
  </div>
</div>
