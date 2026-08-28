/** Shared globe projection and equirect texture wrap — used by rd-three-geo-globe. */

export const GLOBE_RADIUS = 1.6;
export const GLOBE_CAMERA_DISTANCE = 4.8;
export const GLOBE_WIDTH_SEGMENTS = 96;
export const GLOBE_HEIGHT_SEGMENTS = 64;
export const GLOBE_MARKER_RADIUS_OFFSET = 0.04;
export const GLOBE_FLY_DURATION_MS = 900;

export interface GlobeVec3 {
  x: number;
  y: number;
  z: number;
}

/** Equirectangular map UVs meet at ±180°. ClampToEdge leaves a hard white seam there. */
export interface EquirectTextureLike {
  colorSpace: string;
  wrapS: number;
  wrapT: number;
  anisotropy: number;
  generateMipmaps: boolean;
  minFilter: number;
  magFilter: number;
  needsUpdate: boolean;
}

export interface EquirectTextureWrapConstants {
  colorSpace: string;
  wrapS: number;
  wrapT: number;
  minFilter: number;
  magFilter: number;
  anisotropy: number;
}

export function latLngToGlobePosition(
  lat: number,
  lng: number,
  radius: number = GLOBE_RADIUS,
): GlobeVec3 {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lng + 180) * Math.PI) / 180;
  const surfaceRadius = radius + GLOBE_MARKER_RADIUS_OFFSET;
  return {
    x: -surfaceRadius * Math.sin(phi) * Math.cos(theta),
    y: surfaceRadius * Math.cos(phi),
    z: surfaceRadius * Math.sin(phi) * Math.sin(theta),
  };
}

/** Camera on the ray from the origin through `lat`/`lng`, so that point faces the user. */
export function cameraPositionFacingLatLng(
  lat: number,
  lng: number,
  distance: number = GLOBE_CAMERA_DISTANCE,
): GlobeVec3 {
  const marker = latLngToGlobePosition(lat, lng, GLOBE_RADIUS);
  const length = Math.hypot(marker.x, marker.y, marker.z) || 1;
  const scale = distance / length;
  return {
    x: marker.x * scale,
    y: marker.y * scale,
    z: marker.z * scale,
  };
}

export function applyEquirectGlobeTextureWrap(
  texture: EquirectTextureLike,
  constants: EquirectTextureWrapConstants,
): void {
  texture.colorSpace = constants.colorSpace;
  texture.wrapS = constants.wrapS;
  texture.wrapT = constants.wrapT;
  texture.generateMipmaps = false;
  texture.minFilter = constants.minFilter;
  texture.magFilter = constants.magFilter;
  texture.anisotropy = Math.max(1, constants.anisotropy);
  texture.needsUpdate = true;
}

export type EquirectRgb = readonly [number, number, number];

/** Near-white page margins on cartographic JPEGs become a hard meridian strip on a sphere. */
export function measureEquirectEdgeInset(
  width: number,
  height: number,
  getRgb: (x: number, y: number) => EquirectRgb,
  maxInset = 16,
): { left: number; right: number; top: number; bottom: number } {
  const isPad = (rgb: EquirectRgb): boolean => rgb[0] + rgb[1] + rgb[2] > 720;
  const sampleStep = Math.max(1, Math.floor(Math.min(width, height) / 64));

  const colIsPad = (x: number): boolean => {
    let hits = 0;
    let samples = 0;
    for (let y = 0; y < height; y += sampleStep) {
      samples += 1;
      if (isPad(getRgb(x, y))) {
        hits += 1;
      }
    }
    return samples > 0 && hits / samples > 0.8;
  };

  const rowIsPad = (y: number): boolean => {
    let hits = 0;
    let samples = 0;
    for (let x = 0; x < width; x += sampleStep) {
      samples += 1;
      if (isPad(getRgb(x, y))) {
        hits += 1;
      }
    }
    return samples > 0 && hits / samples > 0.8;
  };

  let left = 0;
  while (left < maxInset && left < width - 2 && colIsPad(left)) {
    left += 1;
  }
  let right = 0;
  while (right < maxInset && right < width - 2 - left && colIsPad(width - 1 - right)) {
    right += 1;
  }
  let top = 0;
  while (top < maxInset && top < height - 2 && rowIsPad(top)) {
    top += 1;
  }
  let bottom = 0;
  while (bottom < maxInset && bottom < height - 2 - top && rowIsPad(height - 1 - bottom)) {
    bottom += 1;
  }
  return { left, right, top, bottom };
}

export function trimEquirectTextureImage(texture: { image?: unknown; needsUpdate: boolean }): void {
  const image = texture.image as
    | { width: number; height: number }
    | HTMLImageElement
    | HTMLCanvasElement
    | ImageBitmap
    | undefined;
  if (!image || !('width' in image) || !image.width || !image.height) {
    return;
  }
  if (typeof document === 'undefined') {
    return;
  }

  const width = image.width;
  const height = image.height;
  const source = document.createElement('canvas');
  source.width = width;
  source.height = height;
  const ctx = source.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return;
  }

  try {
    ctx.drawImage(image as CanvasImageSource, 0, 0);
    const pixels = ctx.getImageData(0, 0, width, height).data;
    const inset = measureEquirectEdgeInset(width, height, (x, y) => {
      const i = (y * width + x) * 4;
      return [pixels[i] ?? 0, pixels[i + 1] ?? 0, pixels[i + 2] ?? 0];
    });
    if (inset.left === 0 && inset.right === 0 && inset.top === 0 && inset.bottom === 0) {
      return;
    }
    const cropW = width - inset.left - inset.right;
    const cropH = height - inset.top - inset.bottom;
    if (cropW < 8 || cropH < 8) {
      return;
    }
    const cropped = document.createElement('canvas');
    cropped.width = cropW;
    cropped.height = cropH;
    const cropCtx = cropped.getContext('2d');
    if (!cropCtx) {
      return;
    }
    cropCtx.drawImage(source, inset.left, inset.top, cropW, cropH, 0, 0, cropW, cropH);
    texture.image = cropped;
    texture.needsUpdate = true;
  } catch {
    /* Cross-origin textures cannot be read; skip trim. */
  }
}

export function prepareEquirectGlobeTexture(
  texture: EquirectTextureLike & { image?: unknown },
  constants: EquirectTextureWrapConstants,
): void {
  trimEquirectTextureImage(texture);
  applyEquirectGlobeTextureWrap(texture, constants);
}

/**
 * Mesh UVs on SphereGeometry interpolate across the ±180° meridian and the poles,
 * which shows up as a hard white wedge. Sample the equirect map from the surface
 * direction instead so each fragment computes UVs independently.
 */
export const EQUIRECT_GLOBE_PROGRAM_KEY = 'rd-equirect-globe-dir-sample-v2';

export interface GlobeMaterialShaderPatch {
  vertexShader: string;
  fragmentShader: string;
}

const EQUIRECT_GLOBE_MAP_FRAGMENT = /* glsl */ `
#ifdef USE_MAP

	vec3 globeDir = normalize( vGlobeDir );
	float mapU = atan( globeDir.z, -globeDir.x ) * 0.15915494309189535;
	if ( mapU < 0.0 ) mapU += 1.0;
	float mapV = 0.5 + asin( clamp( globeDir.y, -1.0, 1.0 ) ) * 0.3183098861837907;
	mapU = 0.0035 + mapU * 0.993;
	mapV = 0.007 + mapV * 0.986;
	vec4 sampledDiffuseColor = texture2D( map, vec2( mapU, mapV ) );

	#ifdef DECODE_VIDEO_TEXTURE

		sampledDiffuseColor = sRGBTransferEOTF( sampledDiffuseColor );

	#endif

	diffuseColor *= sampledDiffuseColor;

#endif
`;

export function applyEquirectGlobeShaderPatch(shader: GlobeMaterialShaderPatch): void {
  if (!shader.vertexShader.includes('vGlobeDir')) {
    shader.vertexShader = `varying vec3 vGlobeDir;\n${shader.vertexShader}`;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\nvGlobeDir = transformed;',
    );
  }
  if (!shader.fragmentShader.includes('vGlobeDir')) {
    shader.fragmentShader = `varying vec3 vGlobeDir;\n${shader.fragmentShader}`;
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      EQUIRECT_GLOBE_MAP_FRAGMENT,
    );
  }
}

export function patchEquirectGlobeMaterial(material: {
  onBeforeCompile: unknown;
  customProgramCacheKey: unknown;
}): void {
  const target = material as {
    onBeforeCompile: (shader: GlobeMaterialShaderPatch) => void;
    customProgramCacheKey: () => string;
  };
  target.customProgramCacheKey = () => EQUIRECT_GLOBE_PROGRAM_KEY;
  target.onBeforeCompile = (shader) => {
    applyEquirectGlobeShaderPatch(shader);
  };
}

export function parseGlobeMarkersJson(raw: string | null): unknown[] | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}
