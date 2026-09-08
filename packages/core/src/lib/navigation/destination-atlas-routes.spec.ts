import {
  DEFAULT_DESTINATION_ATLAS_SCREEN,
  atlasScreenVisibleInNav,
  legacyAtlasPathRedirect,
  mapsPanelFromPath,
  pathForDestinationAtlasScreen,
  pathForMapsPanel,
  screenFromDestinationAtlasPath,
} from './destination-atlas-routes';

describe('destination atlas routes', () => {
  it('maps about to root', () => {
    expect(pathForDestinationAtlasScreen('about')).toBe('/');
    expect(screenFromDestinationAtlasPath('/')).toBe('about');
  });

  it('resolves maps screen', () => {
    expect(pathForDestinationAtlasScreen('maps')).toBe('/maps');
    expect(screenFromDestinationAtlasPath('/maps')).toBe('maps');
    expect(screenFromDestinationAtlasPath('/maps/globe')).toBe('maps');
  });

  it('redirects legacy scout path to settings', () => {
    expect(legacyAtlasPathRedirect('/scout')).toBe('/settings');
  });

  it('redirects hidden Views path to About', () => {
    expect(legacyAtlasPathRedirect('/views')).toBe('/');
    expect(legacyAtlasPathRedirect('/intel')).toBeNull();
  });

  it('derives maps panel from nested paths', () => {
    expect(mapsPanelFromPath('/maps')).toBe('map');
    expect(mapsPanelFromPath('/maps/map')).toBe('map');
    expect(mapsPanelFromPath('/maps/globe')).toBe('globe');
    expect(pathForMapsPanel('map')).toBe('/maps');
    expect(pathForMapsPanel('globe')).toBe('/maps/globe');
  });

  it('redirects legacy map and globe paths', () => {
    expect(legacyAtlasPathRedirect('/map')).toBe('/maps');
    expect(legacyAtlasPathRedirect('/globe')).toBe('/maps/globe');
    expect(legacyAtlasPathRedirect('/maps/map')).toBe('/maps');
  });

  it('shows News (intel) in nav but hides Views', () => {
    expect(atlasScreenVisibleInNav('intel')).toBe(true);
    expect(atlasScreenVisibleInNav('views')).toBe(false);
    expect(atlasScreenVisibleInNav('settings')).toBe(true);
    expect(atlasScreenVisibleInNav('about')).toBe(true);
  });

  it('falls back to about for unknown paths', () => {
    expect(screenFromDestinationAtlasPath('/missing')).toBe(DEFAULT_DESTINATION_ATLAS_SCREEN);
  });
});
