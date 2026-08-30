import { createPanoramaViewport } from './panorama';
import { getTourScene, TOUR_SCENES, type TourScene } from './scenes';
import './TourPlayer.css';

export interface TourPlayerOptions {
  defaultSceneId?: string;
  scenes?: TourScene[];
}

function createEl(tag: string, attrs: Record<string, string> = {}, className?: string): HTMLElement {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    node.setAttribute(name, value);
  }
  if (className) {
    node.className = className;
  }
  return node;
}

function sceneOptions(scenes: TourScene[]): string {
  return JSON.stringify(scenes.map((scene) => ({ value: scene.id, label: scene.label })));
}

function sceneMarkers(scenes: TourScene[]): Array<{ id: string; lat: number; lng: number; label: string }> {
  return scenes.map((scene) => ({
    id: scene.id,
    lat: scene.lat,
    lng: scene.lng,
    label: scene.label,
  }));
}

export function createTourPlayer(options: TourPlayerOptions = {}): HTMLElement {
  const scenes = options.scenes ?? TOUR_SCENES;
  const initial = getTourScene(options.defaultSceneId ?? '', scenes) ?? scenes[0];
  if (!initial) {
    return createEl('rd-flex-layout', { title: '360 tour', direction: 'column', gap: '10' }, 'rd-tour-player');
  }

  let current = initial;

  const root = createEl(
    'rd-flex-layout',
    { title: '360 tour', direction: 'column', gap: '10' },
    'rd-tour-player',
  );
  const select = createEl('rd-select-input', {
    label: 'Scene',
    options: sceneOptions(scenes),
    value: current.id,
  });
  const map = createEl(
    'rd-geo-map',
    {
      provider: 'leaflet',
      center: JSON.stringify({ lat: current.lat, lng: current.lng }),
      zoom: '12',
      'selected-id': current.id,
    },
    'rd-tour-player__map',
  );
  const metrics = createEl('rd-flex-layout', { direction: 'row', gap: '8' });
  const kpi = createEl('rd-kpi-card', {
    title: current.label,
    value: current.heading,
    delta: `${current.lat.toFixed(2)}, ${current.lng.toFixed(2)}`,
  });
  const badge = createEl('rd-status-badge', { 'status-text': 'Live scene', tone: 'success' });
  const skeleton = createEl('rd-loading-skeleton', { lines: '2' });
  const detail = createEl('rd-detail-panel', {
    title: 'Look',
    'empty-message': 'Drag the panorama to look around',
  });

  const pano = createPanoramaViewport(current.imageUrl, (heading) => {
    kpi.setAttribute('value', heading);
  });
  pano.setHeading(current.heading);

  metrics.append(kpi, badge);
  root.append(select, map, metrics, pano.element, skeleton, detail);

  const applyScene = (scene: TourScene) => {
    current = scene;
    select.setAttribute('value', scene.id);
    map.setAttribute('center', JSON.stringify({ lat: scene.lat, lng: scene.lng }));
    map.setAttribute('selected-id', scene.id);
    kpi.setAttribute('title', scene.label);
    kpi.setAttribute('value', scene.heading);
    kpi.setAttribute('delta', `${scene.lat.toFixed(2)}, ${scene.lng.toFixed(2)}`);
    pano.setImage(scene.imageUrl);
    pano.setHeading(scene.heading);
    badge.setAttribute('status-text', 'Live scene');
    badge.setAttribute('tone', 'success');
  };

  const setScene = (id: string) => {
    const next = getTourScene(id, scenes);
    if (next) {
      applyScene(next);
    }
  };

  select.addEventListener('value-change', (event) => {
    const value = (event as CustomEvent<{ value?: string }>).detail?.value;
    if (value) {
      setScene(value);
    }
  });

  map.addEventListener('marker-select', (event) => {
    const id = (event as CustomEvent<{ id?: string }>).detail?.id;
    if (id) {
      setScene(id);
    }
  });

  queueMicrotask(() => {
    const host = map as HTMLElement & { setProperty?: (name: string, value: unknown) => void };
    host.setProperty?.('markers', sceneMarkers(scenes));
  });

  return root;
}
