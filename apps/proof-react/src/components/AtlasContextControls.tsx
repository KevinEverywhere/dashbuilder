import { DEFAULT_APP_LOCALES, GEO_MAP_PROVIDERS, MOCK_DESTINATIONS, type GeoMapProvider } from '@destination-atlas';
import { AppLanguageSelect } from '@rosettadash/react/domain/i18n/app-language-select';
import { SelectInput } from '@rosettadash/react/visual/input/select';
import { ATLAS_USER_ROLES, type AtlasUserRole } from '../lib/roles';
import { localizedDestinationName } from '../lib/atlas-utils';
import type { SettingFieldTarget } from '../lib/settings-highlight';

export interface AtlasContextControlsProps {
  locale: string;
  setLocale: (locale: string) => void;
  userRole: AtlasUserRole;
  setUserRole: (role: AtlasUserRole) => void;
  mapProvider: GeoMapProvider;
  setMapProvider: (provider: GeoMapProvider) => void;
  selectedId: string;
  setSelectedId: (id: string) => void;
  highlightField?: SettingFieldTarget | null;
  className?: string;
}

const ROLE_HINT = 'Preview permissions for gated screens.';
const LOCALE_HINT = 'Base locale for developer-owned destination labels.';
const MAP_HINT = 'Default 2D map engine for the Map screen.';
const SELECTED_HINT = 'Active destination across tabs and URL state.';

export function AtlasContextControls({
  locale,
  setLocale,
  userRole,
  setUserRole,
  mapProvider,
  setMapProvider,
  selectedId,
  setSelectedId,
  highlightField,
  className,
}: AtlasContextControlsProps) {
  const rootClass = ['da-context-grid', className].filter(Boolean).join(' ');

  const cellClass = (key: SettingFieldTarget) =>
    ['da-context-grid__cell', highlightField === key ? 'rd-highlight-target' : undefined]
      .filter(Boolean)
      .join(' ');

  return (
    <div className={rootClass}>
      <div data-setting="role" className={cellClass('role')}>
        <SelectInput
          label="Role"
          options={ATLAS_USER_ROLES.map((entry) => ({ value: entry.id, label: entry.label }))}
          value={userRole}
          onChange={(value) => setUserRole(value as AtlasUserRole)}
        />
        <p className="da-context-grid__hint">{ROLE_HINT}</p>
      </div>
      <div data-setting="locale" className={cellClass('locale')}>
        <AppLanguageSelect
          label="App locale"
          locales={DEFAULT_APP_LOCALES}
          value={locale}
          onLocaleChange={({ locale: next }) => {
            if (next) {
              setLocale(next);
            }
          }}
        />
        <p className="da-context-grid__hint">{LOCALE_HINT}</p>
      </div>
      <div data-setting="map" className={cellClass('map')}>
        <SelectInput
          label="Map provider"
          options={GEO_MAP_PROVIDERS.map((entry) => ({ value: entry.id, label: entry.label }))}
          value={mapProvider}
          onChange={(value) => setMapProvider(value as GeoMapProvider)}
        />
        <p className="da-context-grid__hint">{MAP_HINT}</p>
      </div>
      <div data-setting="selected" className={cellClass('selected')}>
        <SelectInput
          label="Selected"
          options={MOCK_DESTINATIONS.map((dest) => ({
            value: dest.id,
            label: localizedDestinationName(dest, locale),
          }))}
          value={selectedId}
          onChange={setSelectedId}
        />
        <p className="da-context-grid__hint">{SELECTED_HINT}</p>
      </div>
    </div>
  );
}
