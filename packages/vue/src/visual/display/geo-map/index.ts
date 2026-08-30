import {
  DB_GEO_MAP_TAG,
  registerRdGeoMap,
  type GeoMapMarker,
  type GeoMapProvider,
} from '@rosettadash/web-components/visual/display/geo-map';
import { defineCustomElementHost } from '../../../lib/custom-element-host';

export type { GeoMapMarker, GeoMapProvider };

export interface GeoMapProps {
  provider?: GeoMapProvider;
  tileUrl?: string;
  apiKey?: string;
  center?: string;
  zoom?: number;
  markers?: GeoMapMarker[];
  selectedId?: string;
  className?: string;
  onMarkerSelect?: (detail: { id: string; lat: number; lng: number }) => void;
}

/** Vue wrapper around `<rd-geo-map>`. */
export const GeoMap = defineCustomElementHost(
  {
    name: 'RdGeoMap',
    tagName: DB_GEO_MAP_TAG,
    register: registerRdGeoMap,
    attrs: {
      tileUrl: 'tile-url',
      apiKey: 'api-key',
      selectedId: 'selected-id',
    },
    properties: ['markers'],
    events: {
      'marker-select': 'onMarkerSelect',
    },
  },
  {
    provider: { type: String, default: undefined },
    tileUrl: { type: String, default: undefined },
    apiKey: { type: String, default: undefined },
    center: { type: String, default: undefined },
    zoom: { type: Number, default: undefined },
    markers: { type: Array, default: undefined },
    selectedId: { type: String, default: undefined },
  },
);

export type GeoMapComponent = typeof GeoMap;
