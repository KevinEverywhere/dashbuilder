/** Default 2:1 equirectangular world texture for globe preview (public domain). */
export const DEFAULT_WORLD_EQUIRECT_URL =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Equirectangular_projection_SW.jpg/1280px-Equirectangular_projection_SW.jpg';

export const DEFAULT_WORLD_EQUIRECT_ATTRIBUTION =
  'Equirectangular world map — Wikimedia Commons / public domain. Replace with your licensed texture in production.';

/** Candidate globe / equirect texture sources for product planning (not wired automatically). */
export interface GlobeTextureSourceOption {
  id: string;
  label: string;
  kind: 'static-image' | 'tile-service' | 'export-pipeline' | 'procedural';
  license: string;
  apiKeyRequired: boolean;
  notes: string;
}

export const GLOBE_TEXTURE_SOURCE_OPTIONS: GlobeTextureSourceOption[] = [
  {
    id: 'nasa-visible-earth',
    label: 'NASA Visible Earth',
    kind: 'static-image',
    license: 'Public domain (U.S. government work)',
    apiKeyRequired: false,
    notes: 'High-quality Blue Marble / topography equirect PNGs; good default until a 3D globe host lands.',
  },
  {
    id: 'natural-earth',
    label: 'Natural Earth',
    kind: 'static-image',
    license: 'Public domain',
    apiKeyRequired: false,
    notes: 'Cartographic textures with cultural / physical shading; common in GIS stacks.',
  },
  {
    id: 'maptiler-satellite',
    label: 'MapTiler Satellite (static export)',
    kind: 'tile-service',
    license: 'Commercial; MapTiler Terms',
    apiKeyRequired: true,
    notes: 'Render a 2:1 equirect from satellite tiles for a dated snapshot — not a live tile globe.',
  },
  {
    id: 'google-earth-studio',
    label: 'Google Earth Studio',
    kind: 'export-pipeline',
    license: 'Google Earth Studio Terms',
    apiKeyRequired: true,
    notes: 'Animated flyovers and still exports — not an embeddable runtime globe API for web apps.',
  },
  {
    id: 'cesium-ion',
    label: 'Cesium ion / 3D Tiles globe',
    kind: 'tile-service',
    license: 'Cesium ion Terms',
    apiKeyRequired: true,
    notes: 'Full 3D globe with terrain + imagery; strongest replacement path when leaving equirect preview.',
  },
  {
    id: 'mapbox-globe',
    label: 'Mapbox GL globe projection',
    kind: 'tile-service',
    license: 'Mapbox Terms',
    apiKeyRequired: true,
    notes: 'Vector/raster globe in MapLibre/Mapbox GL — pairs well if MapLibre is already the map provider.',
  },
  {
    id: 'three-globe',
    label: 'Three.js / react-globe.gl',
    kind: 'procedural',
    license: 'Depends on texture + engine (MIT engine, texture license varies)',
    apiKeyRequired: false,
    notes: 'Sphere mesh + equirect texture + markers; what Destination Atlas will likely adopt post-proof.',
  },
];
