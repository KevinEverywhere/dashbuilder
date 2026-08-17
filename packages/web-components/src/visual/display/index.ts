export {
  RdGeoMapElement,
  DB_GEO_MAP_TAG,
  registerRdGeoMap,
  type GeoMapProps,
  type GeoMapMarker,
  type GeoMapProvider,
} from './geo-map/index.js';
export * from './3d-bar-chart/index.js';
export * from './3d-scatter/index.js';
export * from './3d-scene/index.js';
export * from './3d-gltf-model/index.js';
export * from './3d-geo-globe/index.js';

import { registerRdGeoMap } from './geo-map/index.js';
import { registerRdThreeBarChart } from './3d-bar-chart/index.js';
import { registerRdThreeScatterPlot } from './3d-scatter/index.js';
import { registerRdThreeScenePointCloud } from './3d-scene/index.js';
import { registerRdThreeGltfModel } from './3d-gltf-model/index.js';
import { registerRdThreeGeoGlobe } from './3d-geo-globe/index.js';

export function registerRosettaDashDisplayElements(): void {
  registerRdGeoMap();
  registerRdThreeBarChart();
  registerRdThreeScatterPlot();
  registerRdThreeScenePointCloud();
  registerRdThreeGltfModel();
  registerRdThreeGeoGlobe();
}
