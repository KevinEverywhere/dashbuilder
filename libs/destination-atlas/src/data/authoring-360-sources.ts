import catalogJson from './authoring-360-sources.json';
import { MOCK_DESTINATIONS } from './destinations.js';

/** Wikimedia Commons 2:1 (or near) still used to build a short Authoring clip. */
export interface Authoring360Source {
  destinationId: string;
  commonsTitle: string;
  label: string;
  credit: string;
  license: string;
}

export const AUTHORING_360_SOURCES: Authoring360Source[] = Array.isArray(catalogJson)
  ? catalogJson
  : (catalogJson as { default: Authoring360Source[] }).default;

export const AUTHORING_360_PUBLIC_DIR = '/authoring-360';

const sourceByDestinationId = new Map(
  AUTHORING_360_SOURCES.map((source) => [source.destinationId, source]),
);

export function getAuthoring360Source(destinationId: string): Authoring360Source | undefined {
  return sourceByDestinationId.get(destinationId);
}

export function authoring360PublicUrl(destinationId: string): string | undefined {
  if (!sourceByDestinationId.has(destinationId)) {
    return undefined;
  }
  return `${AUTHORING_360_PUBLIC_DIR}/${destinationId}.mp4`;
}

export function commonsFilePageUrl(commonsTitle: string): string {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(commonsTitle.replace(/ /g, '_'))}`;
}

/** Wikimedia Special:FilePath thumb for tour stills and fetch script downloads. */
export function commonsThumbUrl(commonsTitle: string, width = 2048): string {
  const file = commonsTitle.replace(/ /g, '_');
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}?width=${width}`;
}

export function destinationsMissingAuthoring360(): string[] {
  return MOCK_DESTINATIONS.map((dest) => dest.id).filter((id) => !sourceByDestinationId.has(id));
}

/** User-facing copy when a destination has no library clip in the player viewport. */
export function destinationMissingContentMessage(destinationName: string): string {
  return `We currently have no content for ${destinationName}. Please try again later.`;
}

export function destinationAuthoring360Shipped(destinationId: string): boolean {
  return sourceByDestinationId.has(destinationId);
}

/** One row per destination for Authoring UI — shipped clips + upload gaps. */
export interface Authoring360CatalogEntry {
  destinationId: string;
  destinationName: string;
  sceneLabel: string | null;
  credit: string | null;
  license: string | null;
  commonsTitle: string | null;
  commonsUrl: string | null;
  clipPath: string | null;
  status: 'shipped' | 'upload-required';
}

export function buildAuthoring360DisplayCatalog(): Authoring360CatalogEntry[] {
  return MOCK_DESTINATIONS.map((dest) => {
    const source = getAuthoring360Source(dest.id);
    return {
      destinationId: dest.id,
      destinationName: dest.name,
      sceneLabel: source?.label ?? null,
      credit: source?.credit ?? null,
      license: source?.license ?? null,
      commonsTitle: source?.commonsTitle ?? null,
      commonsUrl: source ? commonsFilePageUrl(source.commonsTitle) : null,
      clipPath: source ? (authoring360PublicUrl(dest.id) ?? null) : null,
      status: source ? 'shipped' : 'upload-required',
    };
  });
}

/** JSON-ready catalog for Authoring screens (30 rows). */
export const AUTHORING_360_DISPLAY_CATALOG: Authoring360CatalogEntry[] =
  buildAuthoring360DisplayCatalog();

export function authoring360CatalogJson(spaces = 2): string {
  return JSON.stringify(AUTHORING_360_DISPLAY_CATALOG, null, spaces);
}

/** Fetch the local proof-app clip. Returns null if the city has no source or the file is missing. */
export async function fetchAuthoring360File(destinationId: string): Promise<File | null> {
  const url = authoring360PublicUrl(destinationId);
  if (!url) {
    return null;
  }
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('text/html')) {
    return null;
  }
  const blob = await response.blob();
  return new File([blob], `${destinationId}-360.mp4`, { type: blob.type || 'video/mp4' });
}
