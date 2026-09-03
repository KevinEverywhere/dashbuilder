import { GeoExplorerLayout, type GeoExplorerListPlacement } from '@rosettadash/react/layout/geo-explorer';
import { ThreeGeoGlobe } from '@rosettadash/react/visual/display/3d-geo-globe';
import {
  DEFAULT_WORLD_EQUIRECT_URL,
  GLOBE_TEXTURE_SOURCE_OPTIONS,
  MOCK_DESTINATIONS,
  GLOBE_EQUIRECT_ATTRIBUTION,
  THREE_JS_ATTRIBUTION,
  attributionNoticeJson,
} from '@destination-atlas';
import type { AtlasContext } from '../state/useDestinationAtlasState';
import { formatRegionLabel, localizedDestinationName } from '../lib/atlas-utils';

export const GLOBE_SOURCE = `<GlobeScreen part="explorer" locale={locale} selectedId={selectedId}>
  <GeoExplorerLayout listPlacement={listPlacement} items={destinationItems} selectedId={selectedId}>
    <ThreeGeoGlobe textureUrl={DEFAULT_WORLD_EQUIRECT_URL} markers={destinationMarkers} selectedId={selectedId} />
  </GeoExplorerLayout>
</GlobeScreen>`;

type GlobeScreenPart = 'explorer' | 'footer';

type Props = Pick<AtlasContext, 'locale' | 'selectedId' | 'setSelectedId' | 'focusDestinationOnMap'> & {
  embedded?: boolean;
  part?: GlobeScreenPart;
  listPlacement?: GeoExplorerListPlacement;
};

export function GlobeScreen({
  locale,
  selectedId,
  setSelectedId,
  embedded = false,
  part,
  listPlacement = 'right',
}: Props) {
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

  const selectFromList = (id: string) => {
    setSelectedId(id);
  };

  const selectFromGlobe = (id: string) => {
    if (!id) {
      return;
    }
    setSelectedId(id);
  };

  const renderExplorer = () => (
    <GeoExplorerLayout
      listPlacement={listPlacement}
      items={listItems}
      selectedId={selectedId}
      onSelect={selectFromList}
    >
      <div className="da-globe-stage">
        <ThreeGeoGlobe
          title="Destination globe (Three.js)"
          textureUrl={DEFAULT_WORLD_EQUIRECT_URL}
          markers={markers}
          selectedId={selectedId}
          onMarkerSelect={selectFromGlobe}
        />
      </div>
    </GeoExplorerLayout>
  );

  const renderFooter = () => (
    <>
      <rd-attribution-notice notice={attributionNoticeJson(GLOBE_EQUIRECT_ATTRIBUTION)} />
      <rd-attribution-notice notice={attributionNoticeJson(THREE_JS_ATTRIBUTION)} />
      <details className="da-globe-sources">
        <summary>Future globe texture sources</summary>
        <ul>
          {GLOBE_TEXTURE_SOURCE_OPTIONS.map((source) => (
            <li key={source.id}>
              <strong>{source.label}</strong> — {source.license}. {source.notes}
              {source.apiKeyRequired ? ' API key required.' : ''}
            </li>
          ))}
        </ul>
      </details>
    </>
  );

  if (embedded && part === 'explorer') {
    return renderExplorer();
  }

  if (embedded && part === 'footer') {
    return <div className="da-maps-footer">{renderFooter()}</div>;
  }

  if (embedded) {
    return (
      <>
        {renderExplorer()}
        {renderFooter()}
      </>
    );
  }

  return (
    <section className="da-panel">
      <h2>Globe</h2>
      <p>
        Three.js globe with dataset destination markers — click any point on the globe (or a list item) to
        select that destination.
      </p>
      {renderExplorer()}
      {renderFooter()}
    </section>
  );
}
