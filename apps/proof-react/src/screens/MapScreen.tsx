import { useState } from 'react';
import { GeoExplorerLayout, type GeoExplorerListPlacement } from '@rosettadash/react/layout/geo-explorer';
import { GeoMap } from '@rosettadash/react/visual/display/geo-map';
import { SelectInput } from '@rosettadash/react/visual/input/select';
import { TextInput } from '@rosettadash/react/visual/input/text';
import { GEO_MAP_PROVIDERS, MOCK_DESTINATIONS, getDestinationById, type GeoMapProvider, attributionNoticeJson, mapProviderAttribution } from '@destination-atlas';
import type { AtlasContext } from '../state/useDestinationAtlasState';
import { useConsumerSecrets } from '../state/consumer-secrets-context';
import { formatRegionLabel, localizedDestinationName } from '../lib/atlas-utils';
import { destinationMapView, resolveMapLocationQuery } from '../lib/map-location';

export const MAP_SOURCE = `<MapScreen part="toolbar|explorer" mapProvider={mapProvider} selectedId={selectedId}>
  <TextInput label="Request location" value={mapLocationQuery} />
  <SelectInput label="Map provider" value={mapProvider} />
  <GeoExplorerLayout listPlacement={listPlacement} items={destinationItems} selectedId={selectedId}>
    <GeoMap center={…} zoom={…} markers={destinationMarkers} selectedId={selectedId} apiKey={byokGoogleMapsKey} />
  </GeoExplorerLayout>
</MapScreen>`;

type MapScreenPart = 'toolbar' | 'explorer';

type Props = Pick<
  AtlasContext,
  | 'locale'
  | 'selectedId'
  | 'setSelectedId'
  | 'mapProvider'
  | 'setMapProvider'
  | 'mapLocationQuery'
  | 'setMapLocationQuery'
  | 'mapViewOverride'
  | 'focusDestinationOnMap'
  | 'goToMapView'
  | 'setScreen'
  | 'setHighlightTarget'
> & {
  embedded?: boolean;
  part?: MapScreenPart;
  listPlacement?: GeoExplorerListPlacement;
};

export function MapScreen({
  locale,
  selectedId,
  setSelectedId,
  mapProvider,
  setMapProvider,
  mapLocationQuery,
  setMapLocationQuery,
  mapViewOverride,
  focusDestinationOnMap,
  goToMapView,
  setScreen,
  setHighlightTarget,
  embedded = false,
  part,
  listPlacement = 'right',
}: Props) {
  const [locationError, setLocationError] = useState('');
  const secrets = useConsumerSecrets();
  const googleMapsApiKey = secrets.googleMapsApiKey;
  const maplibreTileUrl = secrets.maplibreTileUrl;

  const openIntegrationsSettings = () => {
    setHighlightTarget('integrations');
    setScreen('settings');
  };

  const selected = getDestinationById(selectedId);
  const view =
    mapViewOverride ??
    (selected ? destinationMapView(selected, locale) : { lat: 20, lng: 0, zoom: 2, label: 'World' });

  const markers = MOCK_DESTINATIONS.map((dest) => ({
    id: dest.id,
    lat: dest.lat,
    lng: dest.lng,
    label: localizedDestinationName(dest, locale),
  }));

  const listItems = MOCK_DESTINATIONS.map((dest) => ({
    id: dest.id,
    label: localizedDestinationName(dest, locale),
    meta: formatRegionLabel(dest.region),
  }));

  const activeProvider = GEO_MAP_PROVIDERS.find((entry) => entry.id === mapProvider);

  const submitLocation = () => {
    const resolved = resolveMapLocationQuery(mapLocationQuery, locale);
    if (!resolved) {
      setLocationError('No match — try a dataset destination (Tokyo, Paris, New York City…) or lat, lng (40.71, -74.01).');
      return;
    }
    setLocationError('');
    const matchedDest = MOCK_DESTINATIONS.find(
      (dest) => localizedDestinationName(dest, locale).toLowerCase() === resolved.label.toLowerCase(),
    );
    if (matchedDest) {
      focusDestinationOnMap(matchedDest.id);
      return;
    }
    goToMapView(resolved);
  };

  const selectDestination = (id: string) => {
    setSelectedId(id);
  };

  const renderToolbar = () => (
    <>
      <div className="rd-map-location">
        <TextInput
          label="Request location"
          placeholder="Destination name or lat, lng…"
          value={mapLocationQuery}
          onChange={(value) => {
            setMapLocationQuery(value);
            if (locationError) {
              setLocationError('');
            }
          }}
        />
        <button type="button" className="rd-button" onClick={submitLocation}>
          Go to location
        </button>
      </div>
      {locationError ? <p className="da-map-location-error">{locationError}</p> : null}
      {view.label ? (
        <p className="da-note da-maps-toolbar__view-label">
          Map view: <strong>{view.label}</strong>
          {mapViewOverride ? ' (custom coordinates)' : selected ? '' : ' (default)'}
        </p>
      ) : null}

      <SelectInput
        label="Map provider"
        options={GEO_MAP_PROVIDERS.map((entry) => ({
          value: entry.id,
          label: entry.label,
        }))}
        value={mapProvider}
        onChange={(value) => setMapProvider(value as GeoMapProvider)}
      />
      {activeProvider ? (
        <dl className="da-provider-meta">
          <dt>Cost</dt>
          <dd>{activeProvider.costSummary}</dd>
          <dt>API key</dt>
          <dd>{activeProvider.apiKeyRequired ? 'Required' : 'Optional'}</dd>
          <dt>Notes</dt>
          <dd>{activeProvider.notes}</dd>
        </dl>
      ) : null}
      {mapProvider === 'google-maps' && !googleMapsApiKey ? (
        <p className="da-note da-byok-cta">
          Google Maps requires an API key.{' '}
          <button type="button" className="da-locale-link" onClick={openIntegrationsSettings}>
            Configure in Settings → Integrations
          </button>{' '}
          or set <code>VITE_GOOGLE_MAPS_API_KEY</code> in <code>.env.local</code>.
        </p>
      ) : null}
      {mapProvider === 'maplibre' && !maplibreTileUrl ? (
        <p className="da-note">
          Using demo MapLibre tiles. Add a MapTiler key in{' '}
          <button type="button" className="da-locale-link" onClick={openIntegrationsSettings}>
            Settings → Integrations
          </button>{' '}
          for hosted vector tiles.
        </p>
      ) : null}
    </>
  );

  const renderExplorer = () => (
    <GeoExplorerLayout
      listPlacement={listPlacement}
      items={listItems}
      selectedId={selectedId}
      onSelect={selectDestination}
    >
      <div className="da-map-stage">
        <GeoMap
          className="da-map-stage__map"
          provider={mapProvider}
          center={JSON.stringify({ lat: view.lat, lng: view.lng })}
          zoom={view.zoom}
          markers={markers}
          selectedId={selectedId}
          apiKey={mapProvider === 'google-maps' ? googleMapsApiKey : undefined}
          tileUrl={mapProvider === 'maplibre' ? maplibreTileUrl : undefined}
          onMarkerSelect={({ id }) => selectDestination(id)}
        />
        <rd-attribution-notice
          notice={attributionNoticeJson(mapProviderAttribution(mapProvider))}
        />
      </div>
    </GeoExplorerLayout>
  );

  if (embedded && part === 'toolbar') {
    return <div className="da-maps-toolbar__map-fields">{renderToolbar()}</div>;
  }

  if (embedded && part === 'explorer') {
    return renderExplorer();
  }

  if (embedded) {
    return (
      <>
        {renderToolbar()}
        {renderExplorer()}
      </>
    );
  }

  return (
    <section className="da-panel">
      <h2>Map</h2>
      <p>2D exploration with developer-selectable geo-map provider.</p>
      {renderToolbar()}
      {renderExplorer()}
    </section>
  );
}
