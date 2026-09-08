export type DestinationAtlasScreenId =
  | 'about'
  | 'overview'
  | 'destinations'
  | 'maps'
  | 'media'
  | 'authoring'
  | 'intel'
  | 'plan'
  | 'views'
  | 'stack'
  | 'settings';

export type MapsPanelId = 'map' | 'globe';

export interface DestinationAtlasRouteDefinition {
  id: DestinationAtlasScreenId;
  path: string;
}

/** Canonical path table for Destination Atlas proof apps. */
export const DESTINATION_ATLAS_ROUTES: readonly DestinationAtlasRouteDefinition[] = [
  { id: 'about', path: '/' },
  { id: 'overview', path: '/overview' },
  { id: 'destinations', path: '/destinations' },
  { id: 'maps', path: '/maps' },
  { id: 'media', path: '/media' },
  { id: 'authoring', path: '/authoring' },
  { id: 'intel', path: '/intel' },
  { id: 'plan', path: '/plan' },
  { id: 'views', path: '/views' },
  { id: 'stack', path: '/stack' },
  { id: 'settings', path: '/settings' },
] as const;

const PATH_BY_SCREEN = new Map(
  DESTINATION_ATLAS_ROUTES.map((route) => [route.id, route.path] as const),
);

const SCREEN_BY_PATH = new Map(
  DESTINATION_ATLAS_ROUTES.map((route) => [normalizePath(route.path), route.id] as const),
);

export const DEFAULT_DESTINATION_ATLAS_SCREEN: DestinationAtlasScreenId = 'about';

/** Screens that remain in code but are not shown in Destination Atlas nav (DAS-164). */
export const DESTINATION_ATLAS_NAV_HIDDEN_SCREEN_IDS = ['views'] as const;

export function atlasScreenVisibleInNav(screenId: DestinationAtlasScreenId): boolean {
  return !(DESTINATION_ATLAS_NAV_HIDDEN_SCREEN_IDS as readonly string[]).includes(screenId);
}

function normalizePath(pathname: string): string {
  if (!pathname || pathname === '/') {
    return '/';
  }
  const trimmed = pathname.replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export function mapsPanelFromPath(pathname: string): MapsPanelId {
  return normalizePath(pathname) === '/maps/globe' ? 'globe' : 'map';
}

export function pathForMapsPanel(panel: MapsPanelId): string {
  return panel === 'globe' ? '/maps/globe' : '/maps';
}

/** Legacy proof-app paths redirected in client routers. */
export function legacyAtlasPathRedirect(pathname: string): string | null {
  const normalized = normalizePath(pathname);
  if (normalized === '/map') {
    return '/maps';
  }
  if (normalized === '/globe') {
    return '/maps/globe';
  }
  if (normalized === '/maps/map') {
    return '/maps';
  }
  if (normalized === '/scout') {
    return '/settings';
  }
  if (normalized === '/views') {
    return '/';
  }
  return null;
}

export function pathForDestinationAtlasScreen(screen: DestinationAtlasScreenId): string {
  return PATH_BY_SCREEN.get(screen) ?? '/';
}

export function screenFromDestinationAtlasPath(pathname: string): DestinationAtlasScreenId {
  const normalized = normalizePath(pathname);
  if (
    normalized === '/maps' ||
    normalized === '/maps/map' ||
    normalized === '/maps/globe' ||
    normalized === '/map' ||
    normalized === '/globe'
  ) {
    return 'maps';
  }
  return SCREEN_BY_PATH.get(normalized) ?? DEFAULT_DESTINATION_ATLAS_SCREEN;
}

export function isKnownDestinationAtlasPath(pathname: string): boolean {
  const normalized = normalizePath(pathname);
  if (
    normalized === '/maps/map' ||
    normalized === '/maps/globe' ||
    normalized === '/map' ||
    normalized === '/globe'
  ) {
    return true;
  }
  return SCREEN_BY_PATH.has(normalized);
}
