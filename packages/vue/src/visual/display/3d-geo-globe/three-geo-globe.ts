import {
  RD_THREE_GEO_GLOBE_TAG,
  registerRdThreeGeoGlobe,
  type GlobeMarker,
} from '@rosettadash/web-components/visual/display/3d-geo-globe';
import { defineCustomElementHost } from '../../../lib/custom-element-host';

export type { GlobeMarker };

export interface ThreeGeoGlobeProps {
  title?: string;
  textureUrl?: string;
  markers?: GlobeMarker[];
  selectedId?: string;
  minHeight?: string | number;
  className?: string;
  onMarkerSelect?: (detail: { id: string }) => void;
}

/** Vue wrapper around `<rd-three-geo-globe>`. */
export const ThreeGeoGlobe = defineCustomElementHost(
  {
    name: 'RdThreeGeoGlobe',
    tagName: RD_THREE_GEO_GLOBE_TAG,
    register: registerRdThreeGeoGlobe,
    attrs: {
      textureUrl: 'texture-url',
      selectedId: 'selected-id',
      minHeight: 'min-height',
    },
    properties: ['markers'],
    events: {
      'marker-select': 'onMarkerSelect',
    },
  },
  {
    title: { type: String, default: undefined },
    textureUrl: { type: String, default: undefined },
    markers: { type: Array, default: undefined },
    selectedId: { type: String, default: undefined },
    minHeight: { type: [String, Number], default: undefined },
  },
);

export type ThreeGeoGlobeComponent = typeof ThreeGeoGlobe;
