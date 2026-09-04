import { createPanoramaViewport } from './panorama';
import {
  attributionNoticeJson,
  authoring360Attribution,
  destinationMissingContentMessage,
  mapProviderAttribution,
  THREE_JS_ATTRIBUTION,
} from '@destination-atlas';
import { defaultTourScene, getTourScene, TOUR_SCENES, type TourScene } from './scenes';
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
  return JSON.stringify(scenes.map((scene) => ({ value: scene.id, label: scene.pulldownLabel })));
}

function sceneMarkers(scenes: TourScene[]): Array<{ id: string; lat: number; lng: number; label: string }> {
  return scenes.map((scene) => ({
    id: scene.id,
    lat: scene.lat,
    lng: scene.lng,
    label: scene.pulldownLabel,
  }));
}

export function createTourPlayer(options: TourPlayerOptions = {}): HTMLElement {
  const scenes = options.scenes ?? TOUR_SCENES;
  const initial =
    getTourScene(options.defaultSceneId ?? '', scenes) ?? defaultTourScene(scenes);
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
    label: '360° destination',
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
  const badge = createEl('rd-status-badge', { 'status-text': '360 still', tone: 'success' });
  const detail = createEl(
    'rd-detail-panel',
    {
      title: 'Look',
      'empty-message': 'Drag the panorama to look around',
    },
    'rd-tour-player__look',
  );
  const facts = document.createElement('dl');
  facts.className = 'rd-tour-player__facts';

  const paintLook = (scene: TourScene, heading = scene.heading) => {
    facts.replaceChildren();
    const rows: Array<[string, string, string?]> =
      scene.status === 'upload-required'
        ? [
            ['Destination', scene.pulldownLabel],
            ['Status', 'No shipped still — upload in Authoring'],
          ]
        : [
            ['Scene', scene.label],
            ['Look', heading],
            ['Credit', scene.credit, scene.sourceUrl],
            ['License', scene.license],
          ];
    for (const [label, value, href] of rows) {
      const row = document.createElement('div');
      const dt = document.createElement('dt');
      const dd = document.createElement('dd');
      dt.textContent = label;
      if (href) {
        const link = document.createElement('a');
        link.href = href;
        link.textContent = value;
        link.rel = 'license noreferrer';
        link.target = '_blank';
        dd.append(link);
      } else {
        dd.textContent = value;
      }
      row.append(dt, dd);
      facts.append(row);
    }
  };

  const pano = createPanoramaViewport(current.videoUrl, (heading) => {
    kpi.setAttribute('value', heading);
    paintLook(current, heading);
  });
  pano.setHeading(current.heading);

  metrics.append(kpi, badge);
  detail.append(facts);
  root.append(select, map, metrics, pano.element, detail);
  paintLook(current);

  const mapAttribution = document.createElement('rd-attribution-notice');
  mapAttribution.setAttribute('notice', attributionNoticeJson(mapProviderAttribution('leaflet')));
  root.insertBefore(mapAttribution, metrics);

  const applySceneAttribution = (scene: TourScene) => {
    let sphereNotice = root.querySelector('[data-ref="sphere-attribution"]');
    if (scene.status === 'shipped') {
      const notice = authoring360Attribution(scene.id);
      if (notice) {
        if (!sphereNotice) {
          sphereNotice = document.createElement('rd-attribution-notice');
          sphereNotice.setAttribute('data-ref', 'sphere-attribution');
          root.insertBefore(sphereNotice, detail);
        }
        sphereNotice.setAttribute('notice', attributionNoticeJson(notice));
        (sphereNotice as HTMLElement).hidden = false;
      }
    } else if (sphereNotice) {
      (sphereNotice as HTMLElement).hidden = true;
    }
  };

  applySceneAttribution(current);

  const threeNotice = document.createElement('rd-attribution-notice');
  threeNotice.setAttribute('notice', attributionNoticeJson(THREE_JS_ATTRIBUTION));
  root.insertBefore(threeNotice, detail);

  const applyScene = (scene: TourScene) => {
    current = scene;
    select.setAttribute('value', scene.id);
    map.setAttribute('center', JSON.stringify({ lat: scene.lat, lng: scene.lng }));
    map.setAttribute('selected-id', scene.id);
    kpi.setAttribute('title', scene.pulldownLabel);
    kpi.setAttribute('value', scene.heading);
    kpi.setAttribute('delta', `${scene.lat.toFixed(2)}, ${scene.lng.toFixed(2)}`);
    pano.setVideoUrl(scene.videoUrl);
    pano.setHeading(scene.heading);
    if (scene.status === 'upload-required') {
      pano.setMissingContent(destinationMissingContentMessage(scene.label));
      badge.setAttribute('status-text', 'Upload in Authoring');
      badge.setAttribute('tone', 'warning');
    } else {
      pano.setMissingContent(null);
      badge.setAttribute('status-text', '360 still');
      badge.setAttribute('tone', 'success');
    }
    paintLook(scene);
    applySceneAttribution(scene);
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
