import {
  applyEquirectGlobeShaderPatch,
  applyEquirectGlobeTextureWrap,
  cameraPositionFacingLatLng,
  GLOBE_CAMERA_DISTANCE,
  latLngToGlobePosition,
  measureEquirectEdgeInset,
  parseGlobeMarkersJson,
} from './globe-view.js';

describe('globe-view', () => {
  it('places the camera on the ray through the selected lat/lng', () => {
    const lat = -33.8688;
    const lng = 151.2093;
    const marker = latLngToGlobePosition(lat, lng);
    const camera = cameraPositionFacingLatLng(lat, lng, GLOBE_CAMERA_DISTANCE);
    const markerLen = Math.hypot(marker.x, marker.y, marker.z);
    const cameraLen = Math.hypot(camera.x, camera.y, camera.z);

    expect(cameraLen).toBeCloseTo(GLOBE_CAMERA_DISTANCE);
    expect(camera.x / cameraLen).toBeCloseTo(marker.x / markerLen);
    expect(camera.y / cameraLen).toBeCloseTo(marker.y / markerLen);
    expect(camera.z / cameraLen).toBeCloseTo(marker.z / markerLen);
  });

  it('does not use the default equatorial camera for Sydney', () => {
    const camera = cameraPositionFacingLatLng(-33.8688, 151.2093);
    expect(camera.x).not.toBeCloseTo(0, 1);
    expect(camera.y).toBeLessThan(0);
  });

  it('wraps equirect textures on U so the ±180° meridian meets', () => {
    const texture = {
      colorSpace: '',
      wrapS: 0,
      wrapT: 0,
      anisotropy: 0,
      generateMipmaps: true,
      minFilter: 0,
      magFilter: 0,
      needsUpdate: false,
    };
    applyEquirectGlobeTextureWrap(texture, {
      colorSpace: 'srgb',
      wrapS: 1000,
      wrapT: 1001,
      minFilter: 1006,
      magFilter: 1006,
      anisotropy: 8,
    });
    expect(texture.wrapS).toBe(1000);
    expect(texture.wrapT).toBe(1001);
    expect(texture.generateMipmaps).toBe(false);
    expect(texture.needsUpdate).toBe(true);
  });

  it('samples the equirect map from surface direction instead of mesh UVs', () => {
    const shader = {
      vertexShader: '#include <common>\n#include <begin_vertex>\n',
      fragmentShader: '#include <common>\n#include <map_fragment>\n',
    };
    applyEquirectGlobeShaderPatch(shader);
    expect(shader.vertexShader).toContain('vGlobeDir = transformed;');
    expect(shader.fragmentShader).toContain('atan( globeDir.z, -globeDir.x )');
    expect(shader.fragmentShader).toContain('mapU = 0.0035 + mapU * 0.993');
    expect(shader.fragmentShader).not.toContain('vMapUv');
  });

  it('measures white page margins on framed equirect maps', () => {
    const width = 8;
    const height = 6;
    const getRgb = (x: number, y: number): readonly [number, number, number] => {
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        return [255, 255, 255];
      }
      return [20, 40, 80];
    };
    expect(measureEquirectEdgeInset(width, height, getRgb)).toEqual({
      left: 1,
      right: 1,
      top: 1,
      bottom: 1,
    });
  });

  it('ignores non-JSON marker attribute values from Vue String(array)', () => {
    expect(parseGlobeMarkersJson(null)).toBeNull();
    expect(parseGlobeMarkersJson('[object Object]')).toBeNull();
    expect(parseGlobeMarkersJson('[{"id":"sydney"}]')).toEqual([{ id: 'sydney' }]);
  });
});
