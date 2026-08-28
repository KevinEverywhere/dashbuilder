import { Injectable, inject, signal, computed } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import {
  ATLAS_URL_PARAM_SCOUT,
  buildAtlasLocation,
  isKnownDestinationAtlasPath,
  legacyAtlasPathRedirect,
  mapsPanelFromPath,
  parseAtlasUrlState,
  type AtlasUrlDefaults,
  type DestinationAtlasScreenId,
  type MapsPanelId,
} from '@rosettadash/core';
import type { GeoMapProvider } from '@destination-atlas';
import { MOCK_DESTINATIONS } from '@destination-atlas';
import type { AtlasUserRole } from '../lib/roles';
import { screenAllowedForRole } from '../lib/roles';
import type { SettingsHighlightTarget } from '../lib/settings-highlight';

@Injectable({ providedIn: 'root' })
export class AtlasStateService {
  private readonly router = inject(Router);

  readonly initialSelectedId = MOCK_DESTINATIONS[0]?.id ?? '';

  readonly urlDefaults: AtlasUrlDefaults = {
    dest: this.initialSelectedId,
    locale: 'en',
    provider: 'leaflet',
    role: 'viewer',
  };

  readonly newsQuery = signal('');
  readonly newsRegion = signal('');
  readonly selectedArticleId = signal('');
  readonly mapLocationQuery = signal('');
  readonly mapTabId = signal<'map' | 'list'>('map');
  readonly mapViewOverride = signal<{
    lat: number;
    lng: number;
    zoom: number;
    label: string;
  } | null>(null);
  readonly destSearch = signal('');
  readonly destRegion = signal('');
  readonly timePreset = signal('5y');
  readonly visitPeriodStart = signal('2015-01');
  readonly visitPeriodEnd = signal('2024-12');
  readonly highlightTarget = signal<SettingsHighlightTarget>(null);

  private readonly pathname = signal(this.router.url.split('?')[0] ?? '/');
  private readonly search = signal(this.router.url.includes('?') ? `?${this.router.url.split('?')[1]}` : '');

  readonly urlState = computed(() =>
    parseAtlasUrlState(this.pathname(), this.search(), this.urlDefaults),
  );

  readonly screen = computed(() => this.urlState().screen);
  readonly mapsPanel = computed(() => mapsPanelFromPath(this.pathname()));
  readonly selectedId = computed(() => this.urlState().dest || this.initialSelectedId);
  readonly locale = computed(() => this.urlState().locale);
  readonly mapProvider = computed(() => this.urlState().provider as GeoMapProvider);
  readonly userRole = computed(() => this.urlState().role as AtlasUserRole);

  readonly settingsScoutFocus = computed(() => {
    const params = new URLSearchParams(this.search().replace(/^\?/, ''));
    return this.screen() === 'settings' && params.get(ATLAS_URL_PARAM_SCOUT) === '1';
  });

  readonly atlasQuery = computed(() => ({
    dest: this.selectedId(),
    locale: this.locale(),
    provider: this.mapProvider(),
    role: this.userRole(),
  }));

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      this.syncFromRouter();
      this.applyLegacyRedirects();
      this.applyGuards();
    });
    this.syncFromRouter();
    this.applyLegacyRedirects();
    this.applyGuards();
    queueMicrotask(() => {
      this.syncFromRouter();
      this.applyLegacyRedirects();
      this.applyGuards();
    });
  }

  private syncFromRouter(): void {
    const url = this.router.url;
    const q = url.indexOf('?');
    this.pathname.set(q >= 0 ? url.slice(0, q) : url);
    this.search.set(q >= 0 ? url.slice(q) : '');
  }

  private applyLegacyRedirects(): void {
    const redirect = legacyAtlasPathRedirect(this.pathname());
    if (!redirect) {
      return;
    }
    if (this.pathname().replace(/\/+$/, '') === '/scout') {
      this.highlightTarget.set('ai');
      const params = new URLSearchParams(this.search().replace(/^\?/, ''));
      params.set('scout', '1');
      const nextSearch = params.toString();
      void this.router.navigateByUrl(`${redirect}${nextSearch ? `?${nextSearch}` : ''}`, { replaceUrl: true });
      return;
    }
    void this.router.navigateByUrl(`${redirect}${this.search()}`, { replaceUrl: true });
  }

  private applyGuards(): void {
    if (!isKnownDestinationAtlasPath(this.pathname())) {
      this.navigateAtlas('about', this.atlasQuery(), true);
      return;
    }
    if (!screenAllowedForRole(this.screen(), this.userRole())) {
      this.navigateAtlas('about', this.atlasQuery(), true);
    }
  }

  navigateAtlas(
    nextScreen: DestinationAtlasScreenId,
    query = this.atlasQuery(),
    replace = false,
    nextMapsPanel: MapsPanelId = this.mapsPanel(),
  ): void {
    const panel = nextScreen === 'maps' ? nextMapsPanel : 'map';
    const { pathname, search } = buildAtlasLocation(nextScreen, query, this.urlDefaults, panel);
    void this.router.navigateByUrl(`${pathname}${search}`, { replaceUrl: replace });
  }

  setScreen(nextScreen: DestinationAtlasScreenId): void {
    this.navigateAtlas(nextScreen);
  }

  setMapsPanel(panel: MapsPanelId): void {
    this.navigateAtlas('maps', this.atlasQuery(), false, panel);
  }

  setSelectedId(id: string): void {
    this.mapViewOverride.set(null);
    this.mapLocationQuery.set('');
    this.navigateAtlas(this.screen(), { ...this.atlasQuery(), dest: id });
  }

  setLocale(nextLocale: string): void {
    this.navigateAtlas(this.screen(), { ...this.atlasQuery(), locale: nextLocale });
  }

  setMapProvider(provider: GeoMapProvider): void {
    this.navigateAtlas(this.screen(), { ...this.atlasQuery(), provider });
  }

  setUserRole(role: AtlasUserRole): void {
    this.navigateAtlas(this.screen(), { ...this.atlasQuery(), role });
  }

  setHighlightTarget(target: SettingsHighlightTarget): void {
    this.highlightTarget.set(target);
  }

  setVisitPeriod(range: { startDate: string; endDate: string }): void {
    this.visitPeriodStart.set(range.startDate);
    this.visitPeriodEnd.set(range.endDate);
  }

  focusDestinationOnMap(id: string): void {
    this.mapViewOverride.set(null);
    this.mapLocationQuery.set('');
    this.mapTabId.set('map');
    this.navigateAtlas('maps', { ...this.atlasQuery(), dest: id }, false, 'map');
  }

  goToMapView(view: { lat: number; lng: number; zoom: number; label: string }): void {
    this.mapViewOverride.set(view);
    this.mapTabId.set('map');
    this.navigateAtlas('maps', this.atlasQuery(), false, 'map');
  }

  openAuthoringForDestination(destinationId: string): void {
    this.navigateAtlas('authoring', { ...this.atlasQuery(), dest: destinationId });
  }

  openScoutSettings(): void {
    this.highlightTarget.set('ai');
    const { pathname, search } = buildAtlasLocation('settings', this.atlasQuery(), this.urlDefaults);
    const params = new URLSearchParams(search.replace(/^\?/, ''));
    params.set('scout', '1');
    const nextSearch = params.toString();
    void this.router.navigateByUrl(`${pathname}${nextSearch ? `?${nextSearch}` : ''}`);
  }

  screenLink(screenId: DestinationAtlasScreenId, mapsPanel: MapsPanelId = 'map'): string {
    const panel = screenId === 'maps' ? mapsPanel : 'map';
    const { pathname, search } = buildAtlasLocation(screenId, this.atlasQuery(), this.urlDefaults, panel);
    return `${pathname}${search}`;
  }

  screenRouterLink(
    screenId: DestinationAtlasScreenId,
    mapsPanel: MapsPanelId = 'map',
  ): { path: string; queryParams: Record<string, string> } {
    const panel = screenId === 'maps' ? mapsPanel : 'map';
    const { pathname, search } = buildAtlasLocation(screenId, this.atlasQuery(), this.urlDefaults, panel);
    const queryParams = Object.fromEntries(new URLSearchParams(search.replace(/^\?/, '')));
    return { path: pathname, queryParams };
  }
}
