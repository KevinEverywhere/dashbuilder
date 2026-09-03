import { MOCK_DESTINATIONS } from './destinations.js';
import { getAuthoring360Source } from './authoring-360-sources.js';

/** Default camera framing preset when Authoring opens for a destination. */
export interface AuthoringExample {
  id: string;
  destinationId: string;
  label: string;
  summary: string;
  projection: 'equirect' | 'flat';
  defaultYaw: number;
  defaultPitch: number;
  defaultHorizontalFov: number;
  outputWidth: number;
  outputHeight: number;
}

export const DESTINATION_ATLAS_AUTHORING_EXAMPLES: AuthoringExample[] = MOCK_DESTINATIONS.map(
  (dest) => {
    const source = getAuthoring360Source(dest.id);
    return {
      id: `${dest.id}-360`,
      destinationId: dest.id,
      label: source ? `${source.label} (360°)` : `${dest.name} (upload 360°)`,
      summary: source
        ? `Commons ${source.license} still encoded as an 8s equirect clip (${source.credit}). Orbit, trim, and extract.`
        : 'No shipped Commons clip for this city yet — upload your own 2:1 equirect source.',
      projection: 'equirect',
      defaultYaw: 25,
      defaultPitch: -8,
      defaultHorizontalFov: 75,
      outputWidth: 1280,
      outputHeight: 720,
    };
  },
);

export const DEFAULT_AUTHORING_EXAMPLE_ID =
  DESTINATION_ATLAS_AUTHORING_EXAMPLES.find((entry) => entry.destinationId === 'tokyo')?.id ??
  DESTINATION_ATLAS_AUTHORING_EXAMPLES[0]?.id ??
  'tokyo-360';

export function getAuthoringExampleById(id: string): AuthoringExample | undefined {
  return DESTINATION_ATLAS_AUTHORING_EXAMPLES.find((entry) => entry.id === id);
}

export function getAuthoringExampleForDestinationId(
  destinationId: string,
): AuthoringExample | undefined {
  return DESTINATION_ATLAS_AUTHORING_EXAMPLES.find((entry) => entry.destinationId === destinationId);
}
