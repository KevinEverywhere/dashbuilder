<script module lang="ts">
  export const GLOBE_SOURCE = `<GlobeScreen part="explorer" locale={locale} selectedId={selectedId}>
  <GeoExplorerLayout items={…} selectedId={selectedId} />
  <VueMount component={ThreeGeoGlobe} textureUrl markers selectedId />
</GlobeScreen>`;
</script>

<script lang="ts">
  import { ThreeGeoGlobe } from '@rosettadash/vue/visual/display/3d-geo-globe';
  import {
    DEFAULT_WORLD_EQUIRECT_ATTRIBUTION,
    DEFAULT_WORLD_EQUIRECT_URL,
    GLOBE_TEXTURE_SOURCE_OPTIONS,
    MOCK_DESTINATIONS,
  } from '@destination-atlas';
  import GeoExplorerLayout, { type GeoExplorerListPlacement } from '../components/GeoExplorerLayout.svelte';
  import VueMount from '../components/VueMount.svelte';
  import { formatRegionLabel, localizedDestinationName } from '../lib/atlas-utils';

  let {
    locale,
    selectedId,
    embedded = false,
    part,
    listPlacement = 'right',
    onSelectedIdChange,
    onFocusDestinationOnMap,
  }: {
    locale: string;
    selectedId: string;
    embedded?: boolean;
    part?: 'explorer' | 'footer';
    listPlacement?: GeoExplorerListPlacement;
    onSelectedIdChange?: (id: string) => void;
    onFocusDestinationOnMap?: (id: string) => void;
  } = $props();

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

  function selectFromList(id: string) {
    onSelectedIdChange?.(id);
  }

  function selectFromGlobe(id: string) {
    if (id === selectedId) {
      onFocusDestinationOnMap?.(id);
      return;
    }
    onSelectedIdChange?.(id);
  }

  function onMarkerDetail(detail: { id?: string } | undefined) {
    if (detail?.id) {
      selectFromGlobe(detail.id);
    }
  }

  const globeMountProps = $derived({
    textureUrl: DEFAULT_WORLD_EQUIRECT_URL,
    markers,
    selectedId,
    className: 'da-globe-stage__globe',
    onMarkerSelect: onMarkerDetail,
    'onMarker-select': onMarkerDetail,
  });

  function onStageMarkerSelect(event: Event) {
    const id = (event as CustomEvent<{ id?: string }>).detail?.id;
    if (id) {
      selectFromGlobe(id);
    }
  }
</script>

{#if !embedded || part === 'explorer'}
  <div class="da-interop-callout" role="note">
    <strong>Cross-framework showcase.</strong>
    Globe mounts <code>@rosettadash/vue</code> <code>ThreeGeoGlobe</code> via
    <code>VueMount.svelte</code> (Vue wrapper around <code>rd-three-geo-globe</code>).
  </div>
  <GeoExplorerLayout {listPlacement} items={listItems} {selectedId} onSelect={selectFromList}>
    <div
      class="da-globe-stage"
      {@attach (node) => {
        const listener = (event: Event) => onStageMarkerSelect(event);
        node.addEventListener('marker-select', listener);
        return () => node.removeEventListener('marker-select', listener);
      }}
    >
      <VueMount component={ThreeGeoGlobe} componentProps={globeMountProps} />
    </div>
  </GeoExplorerLayout>
{/if}

{#if embedded && part === 'footer'}
  <div class="da-maps-footer">
    <p class="da-note">{DEFAULT_WORLD_EQUIRECT_ATTRIBUTION}</p>
    <details class="da-globe-sources">
      <summary>Future globe texture sources</summary>
      <ul>
        {#each GLOBE_TEXTURE_SOURCE_OPTIONS as source (source.id)}
          <li>
            <strong>{source.label}</strong> — {source.license}. {source.notes}
            {#if source.apiKeyRequired}<span> API key required.</span>{/if}
          </li>
        {/each}
      </ul>
    </details>
  </div>
{/if}
