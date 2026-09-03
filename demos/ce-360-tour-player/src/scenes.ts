import {
  MOCK_DESTINATIONS,
  authoring360PublicUrl,
  commonsFilePageUrl,
  getAuthoring360Source,
} from '@destination-atlas';

export interface TourScene {
  id: string;
  /** Pulldown label — matches Destination Atlas Authoring: `{name} · 360°`. */
  pulldownLabel: string;
  label: string;
  lat: number;
  lng: number;
  heading: string;
  /** Local Authoring library clip (`/authoring-360/{id}.mp4`), padded 2:1 equirect. */
  videoUrl: string | null;
  credit: string;
  license: string;
  sourceUrl: string;
  status: 'shipped' | 'upload-required';
}

/** All thirty Destination Atlas cities; 26 use the same Authoring library clips. */
export function buildTourScenes(): TourScene[] {
  return MOCK_DESTINATIONS.map((dest) => {
    const pulldownLabel = `${dest.name} · 360°`;
    const source = getAuthoring360Source(dest.id);
    if (!source) {
      return {
        id: dest.id,
        pulldownLabel,
        label: dest.name,
        lat: dest.lat,
        lng: dest.lng,
        heading: dest.name,
        videoUrl: null,
        credit: '—',
        license: '—',
        sourceUrl: '',
        status: 'upload-required',
      };
    }
    return {
      id: dest.id,
      pulldownLabel,
      label: source.label,
      lat: dest.lat,
      lng: dest.lng,
      heading: source.label,
      videoUrl: authoring360PublicUrl(dest.id) ?? null,
      credit: source.credit,
      license: source.license,
      sourceUrl: commonsFilePageUrl(source.commonsTitle),
      status: 'shipped',
    };
  });
}

export const TOUR_SCENES: TourScene[] = buildTourScenes();

export function getTourScene(id: string, scenes: TourScene[] = TOUR_SCENES): TourScene | undefined {
  return scenes.find((scene) => scene.id === id);
}

export function defaultTourScene(scenes: TourScene[] = TOUR_SCENES): TourScene {
  return scenes.find((scene) => scene.status === 'shipped') ?? scenes[0]!;
}
