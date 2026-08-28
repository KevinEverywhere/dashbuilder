jest.mock('three/examples/jsm/controls/OrbitControls.js', () => ({
  OrbitControls: jest.fn().mockImplementation(() => ({
    enableDamping: false,
    dampingFactor: 0,
    minDistance: 0,
    maxDistance: 0,
    autoRotate: false,
    autoRotateSpeed: 0,
    update: jest.fn(),
    dispose: jest.fn(),
  })),
}));

jest.mock('three', () => {
  class MockVector3 {
    x = 0;
    y = 0;
    z = 0;
    copy() {
      return this;
    }
    set(x: number, y: number, z: number) {
      this.x = x;
      this.y = y;
      this.z = z;
      return this;
    }
  }

  const mockRenderer = {
    domElement: document.createElement('canvas'),
    setPixelRatio: jest.fn(),
    setSize: jest.fn(),
    render: jest.fn(),
    dispose: jest.fn(),
    outputColorSpace: '',
    capabilities: { getMaxAnisotropy: () => 1 },
  };

  return {
    Scene: jest.fn().mockImplementation(() => ({
      add: jest.fn(),
      background: null,
    })),
    PerspectiveCamera: jest.fn().mockImplementation(() => ({
      position: {
        set: jest.fn(),
        copy: jest.fn(),
        clone: jest.fn(() => new MockVector3()),
        length: jest.fn(() => 4.8),
        lerpVectors: jest.fn(),
      },
      aspect: 1,
      updateProjectionMatrix: jest.fn(),
    })),
    WebGLRenderer: jest.fn(() => mockRenderer),
    RepeatWrapping: 1000,
    ClampToEdgeWrapping: 1001,
    LinearFilter: 1006,
    SRGBColorSpace: 'srgb',
    Color: jest.fn(),
    AmbientLight: jest.fn(),
    DirectionalLight: jest.fn().mockImplementation(() => ({ position: { set: jest.fn() } })),
    Mesh: jest.fn().mockImplementation(() => ({
      geometry: { dispose: jest.fn() },
      material: {
        dispose: jest.fn(),
        color: { set: jest.fn() },
        emissive: { set: jest.fn() },
        emissiveIntensity: 0,
        needsUpdate: false,
        map: null,
      },
      position: { copy: jest.fn() },
      removeFromParent: jest.fn(),
      userData: {},
    })),
    SphereGeometry: jest.fn().mockImplementation(() => ({
      dispose: jest.fn(),
    })),
    MeshStandardMaterial: jest.fn().mockImplementation(() => ({
      color: { set: jest.fn() },
      emissive: { set: jest.fn() },
      emissiveIntensity: 0,
      dispose: jest.fn(),
      needsUpdate: false,
      map: null,
    })),
    TextureLoader: jest.fn().mockImplementation(() => ({
      load: jest.fn((_url: string, onLoad?: (texture: { dispose: () => void }) => void) => {
        onLoad?.({ dispose: jest.fn() });
      }),
    })),
    Raycaster: jest.fn().mockImplementation(() => ({
      setFromCamera: jest.fn(),
      intersectObjects: jest.fn(() => []),
    })),
    Vector2: jest.fn(),
    Vector3: MockVector3,
  };
});

import { render, screen } from '@testing-library/react';
import { ThreeGeoGlobe } from './ThreeGeoGlobe.js';

describe('ThreeGeoGlobe', () => {
  beforeAll(() => {
    class MockResizeObserver {
      observe = jest.fn();
      disconnect = jest.fn();
    }
    global.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;
    global.requestAnimationFrame = jest.fn(() => 1);
    global.cancelAnimationFrame = jest.fn();
  });

  it('renders with taxonomy-aligned BEM root block', () => {
    render(<ThreeGeoGlobe />);
    expect(screen.getByTestId('rd-display-3d-geo-globe')).toBeTruthy();
  });

  it('forwards ref', () => {
    const ref = { current: null as HTMLElement | null };
    render(<ThreeGeoGlobe ref={ref} />);
    expect(ref.current).toBeTruthy();
  });
});
