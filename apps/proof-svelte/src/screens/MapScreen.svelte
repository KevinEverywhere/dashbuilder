<script module lang="ts">
  export const MAP_SOURCE = `<MapScreen part="toolbar|explorer" mapProvider={mapProvider} selectedId={selectedId}>
  <!-- Cross-framework: Svelte host mounts rd-geo-map custom element -->
  <rd-geo-map provider={mapProvider} markers={…} selected-id={selectedId} />
</MapScreen>`;
</script>

<script lang="ts">
  import { GEO_MAP_PROVIDERS, MOCK_DESTINATIONS, getDestinationById, type GeoMapProvider, attributionNoticeJson, mapProviderAttribution } from '@destination-atlas';
  import {
    DB_GEO_MAP_TAG,
    registerRdGeoMap,
  } from '@rosettadash/web-components/visual/display/geo-map';
  import { attachHostEvents, setHostAttribute, setHostProperty } from '../lib/ce-host';
  import GeoExplorerLayout, { type GeoExplorerListPlacement } from '../components/GeoExplorerLayout.svelte';
  import BoundSelectInput from '../components/BoundSelectInput.svelte';
  import BoundTextInput from '../components/BoundTextInput.svelte';
  import { useConsumerSecrets } from '../lib/consumer-secrets.svelte';
  import { formatRegionLabel, localizedDestinationName } from '../lib/atlas-utils';
  import { destinationMapView, resolveMapLocationQuery } from '../lib/map-location';

  let {
    locale,
    selectedId,
    mapProvider,
    mapLocationQuery,
    mapViewOverride,
    embedded = false,
    part,
    listPlacement = 'right',
    onSelectedIdChange,
    onMapProviderChange,
    onMapLocationQueryChange,
    onFocusDestinationOnMap,
    onGoToMapView,
    onOpenSettings,
  }: {
    locale: string;
    selectedId: string;
    mapProvider: GeoMapProvider;
    mapLocationQuery: string;
    mapViewOverride: { lat: number; lng: number; zoom: number; label: string } | null;
    embedded?: boolean;
    part?: 'toolbar' | 'explorer';
    listPlacement?: GeoExplorerListPlacement;
    onSelectedIdChange?: (id: string) => void;
    onMapProviderChange?: (provider: GeoMapProvider) => void;
    onMapLocationQueryChange?: (query: string) => void;
    onFocusDestinationOnMap?: (id: string) => void;
    onGoToMapView?: (view: { lat: number; lng: number; zoom: number; label: string }) => void;
    onOpenSettings?: () => void;
  } = $props();

  const secrets = useConsumerSecrets();
  let locationError = $state('');
  let mapHost = $state<HTMLElement | null>(null);

  const showToolbar = $derived(!embedded || part === 'toolbar');
  const showExplorer = $derived(!embedded || part === 'explorer');

  const view = $derived.by(() => {
    if (mapViewOverride) {
      return mapViewOverride;
    }
    const selected = getDestinationById(selectedId);
    return selected
      ? destinationMapView(selected, locale)
      : { lat: 20, lng: 0, zoom: 2, label: 'World' };
  });

  const centerJson = $derived(JSON.stringify({ lat: view.lat, lng: view.lng }));

  const markers = $derived(
    MOCK_DESTINATIONS.map((dest) => ({
      id: dest.id,
      lat: dest.lat,
      lng: dest.lng,
      label: localizedDestinationName(dest, locale),
    })),
  );

  const listItems = $derived(
    MOCK_DESTINATIONS.map((dest) => ({
      id: dest.id,
      label: localizedDestinationName(dest, locale),
      meta: formatRegionLabel(dest.region),
    })),
  );

  const activeProvider = $derived(GEO_MAP_PROVIDERS.find((entry) => entry.id === mapProvider));
  const mapAttributionNotice = $derived(attributionNoticeJson(mapProviderAttribution(mapProvider)));

  function submitLocation() {
    const resolved = resolveMapLocationQuery(mapLocationQuery, locale);
    if (!resolved) {
      locationError =
        'No match — try a dataset destination (Tokyo, Paris, New York City…) or lat, lng (40.71, -74.01).';
      return;
    }
    locationError = '';
    const matched = MOCK_DESTINATIONS.find(
      (dest) => localizedDestinationName(dest, locale).toLowerCase() === resolved.label.toLowerCase(),
    );
    if (matched) {
      onFocusDestinationOnMap?.(matched.id);
      return;
    }
    onGoToMapView?.(resolved);
  }

  function selectDestination(id: string) {
    onSelectedIdChange?.(id);
  }

  $effect(() => {
    registerRdGeoMap();
    const el = mapHost;
    if (!el) {
      return;
    }
    const detach = attachHostEvents(el, {
      'marker-select': (detail) => selectDestination((detail as { id: string }).id),
    });
    return detach;
  });

  $effect(() => {
    const el = mapHost;
    if (!el) {
      return;
    }
    setHostAttribute(el, 'provider', mapProvider);
    setHostAttribute(el, 'tile-url', mapProvider === 'maplibre' ? secrets.maplibreTileUrl : undefined);
    setHostAttribute(el, 'api-key', mapProvider === 'google-maps' ? secrets.googleMapsApiKey : undefined);
    setHostAttribute(el, 'center', centerJson);
    setHostAttribute(el, 'zoom', view.zoom);
    setHostProperty(el, 'markers', markers);
    setHostAttribute(el, 'selected-id', selectedId);
  });
</script>

{#if showToolbar}
  <div class="da-maps-toolbar__map-fields">
    <div class="rd-map-location">
      <BoundTextInput
        fieldLabel="Request location"
        placeholder="Destination name or lat, lng…"
        value={mapLocationQuery}
        onValueChange={(value) => onMapLocationQueryChange?.(value)}
      />
      <button type="button" class="rd-button" onclick={submitLocation}>Go to location</button>
    </div>
    {#if locationError}<p class="da-map-location-error">{locationError}</p>{/if}
    {#if view.label}
      <p class="da-note da-maps-toolbar__view-label">
        Map view: <strong>{view.label}</strong>
        {#if mapViewOverride}<span> (custom coordinates)</span>{/if}
      </p>
    {/if}

    <BoundSelectInput
      fieldLabel="Map provider"
      options={GEO_MAP_PROVIDERS.map((entry) => ({ value: entry.id, label: entry.label }))}
      value={mapProvider}
      onValueChange={(value) => onMapProviderChange?.(value as GeoMapProvider)}
    />
    {#if activeProvider}
      <dl class="da-provider-meta">
        <dt>Cost</dt>
        <dd>{activeProvider.costSummary}</dd>
        <dt>API key</dt>
        <dd>{activeProvider.apiKeyRequired ? 'Required' : 'Optional'}</dd>
        <dt>Notes</dt>
        <dd>{activeProvider.notes}</dd>
      </dl>
    {/if}
    {#if mapProvider === 'google-maps' && !secrets.googleMapsApiKey}
      <p class="da-note da-byok-cta">
        Google Maps requires an API key.
        <button type="button" class="da-locale-link" onclick={() => onOpenSettings?.()}>Configure in Settings → Integrations</button>
        or set <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>.env.local</code>.
      </p>
    {/if}
    {#if mapProvider === 'maplibre' && !secrets.maplibreTileUrl}
      <p class="da-note">
        Using demo MapLibre tiles. Add a MapTiler key in
        <button type="button" class="da-locale-link" onclick={() => onOpenSettings?.()}>Settings → Integrations</button>
        for hosted vector tiles.
      </p>
    {/if}
  </div>
{/if}

{#if showExplorer}
  <div class="da-interop-callout" role="note">
    <strong>Cross-framework showcase.</strong>
    Map is a Svelte screen hosting the <code>{DB_GEO_MAP_TAG}</code> custom element directly
    (<code>@rosettadash/web-components</code>) — not the Svelte GeoMap wrapper. Marker select
    and <code>selected-id</code> stay bound to the same destination as the list and Settings.
  </div>
  <GeoExplorerLayout {listPlacement} items={listItems} {selectedId} onSelect={selectDestination}>
    <div class="da-map-stage">
      <svelte:element this={DB_GEO_MAP_TAG} bind:this={mapHost} class="da-map-stage__map"></svelte:element>
      <rd-attribution-notice notice={mapAttributionNotice}></rd-attribution-notice>
    </div>
  </GeoExplorerLayout>
{/if}
