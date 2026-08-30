import { forwardRef, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { FlexLayout } from '@rosettadash/react/layout/flex';
import { DetailHistoricList, DetailPanel, DetailStats } from '@rosettadash/react/visual/detail';
import { GeoMap } from '@rosettadash/react/visual/display/geo-map';
import { SelectInput } from '@rosettadash/react/visual/input/select';
import { KpiCard } from '@rosettadash/react/visual/kpi';
import { StatusBadge } from '@rosettadash/react/visual/plugin/status-badge';
import { LoadingSkeleton } from '@rosettadash/react/visual/skeleton';
import { DEFAULT_WEATHER_LOCATIONS, getWeatherLocation, type WeatherLocation } from './locations.js';
import {
  fetchWeatherReport,
  formatTemperature,
  weatherBadgeTone,
  type TemperatureUnit,
  type WeatherReport,
} from './weather.js';
import './WeatherWidget.css';

export type { TemperatureUnit, WeatherLocation };

export interface WeatherWidgetProps {
  locations?: WeatherLocation[];
  defaultLocationId?: string;
  unit?: TemperatureUnit;
  className?: string;
  style?: CSSProperties;
}

/** Page-embed weather widget composed from @rosettadash/react atoms. */
export const WeatherWidget = forwardRef<HTMLElement, WeatherWidgetProps>(function WeatherWidget(
  {
    locations = DEFAULT_WEATHER_LOCATIONS,
    defaultLocationId,
    unit = 'celsius',
    className,
    style,
  },
  ref,
) {
  const initialId = defaultLocationId && getWeatherLocation(defaultLocationId, locations)
    ? defaultLocationId
    : (locations[0]?.id ?? '');
  const [selectedId, setSelectedId] = useState(initialId);
  const [report, setReport] = useState<WeatherReport | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  const selected = getWeatherLocation(selectedId, locations) ?? locations[0];
  const selectOptions = useMemo(
    () => locations.map((location) => ({ value: location.id, label: location.label })),
    [locations],
  );
  const markers = useMemo(
    () =>
      locations.map((location) => ({
        id: location.id,
        lat: location.lat,
        lng: location.lng,
        label: location.label,
      })),
    [locations],
  );

  useEffect(() => {
    if (!selected) {
      setStatus('error');
      setErrorMessage('No locations available');
      setReport(null);
      return;
    }

    const controller = new AbortController();
    setStatus('loading');
    setErrorMessage('');

    fetchWeatherReport(selected.lat, selected.lng, unit, controller.signal)
      .then((next) => {
        setReport(next);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setReport(null);
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Weather request failed');
      });

    return () => controller.abort();
  }, [selected, unit]);

  const windUnit = unit === 'fahrenheit' ? 'mph' : 'km/h';
  const precipUnit = unit === 'fahrenheit' ? 'in' : 'mm';

  return (
    <FlexLayout
      ref={ref}
      title="Weather"
      direction="column"
      gap={10}
      className={['rd-weather-widget', className].filter(Boolean).join(' ')}
      style={style}
    >
      <SelectInput
        label="Location"
        options={selectOptions}
        value={selectedId}
        onChange={(value) => {
          if (value) {
            setSelectedId(value);
          }
        }}
      />
      <GeoMap
        className="rd-weather-widget__map"
        provider="leaflet"
        center={
          selected
            ? JSON.stringify({ lat: selected.lat, lng: selected.lng })
            : undefined
        }
        zoom={10}
        markers={markers}
        selectedId={selectedId}
        minHeight="11rem"
        onMarkerSelect={({ id }) => setSelectedId(id)}
      />
      <FlexLayout direction="row" gap={8} stretchItems>
        <KpiCard
          title={selected ? `${selected.label} temperature` : 'Temperature'}
          value={
            status === 'ready' && report
              ? formatTemperature(report.temperature, report.unit)
              : '—'
          }
          delta={
            status === 'ready' && report
              ? `Feels like ${formatTemperature(report.apparentTemperature, report.unit)}`
              : undefined
          }
        />
        <StatusBadge
          statusText={
            status === 'loading'
              ? 'Updating'
              : status === 'error'
                ? 'Unavailable'
                : (report?.summary ?? '—')
          }
          tone={
            status === 'loading'
              ? 'neutral'
              : status === 'error'
                ? 'error'
                : weatherBadgeTone(report?.weatherCode ?? 0)
          }
        />
      </FlexLayout>
      <DetailPanel
        title="Report"
        emptyMessage={status === 'error' ? errorMessage || 'Weather unavailable' : 'Select a location'}
      >
        {status === 'loading' ? (
          <LoadingSkeleton lines={3} />
        ) : status === 'ready' && report ? (
          <>
            <DetailStats
              compact
              items={[
                { label: 'Condition', value: report.summary },
                { label: 'Humidity', value: `${Math.round(report.humidity)}%` },
                { label: 'Wind', value: `${Math.round(report.windSpeed)} ${windUnit}` },
                {
                  label: 'Precipitation',
                  value: `${report.precipitation.toFixed(1)} ${precipUnit}`,
                },
              ]}
            />
            <DetailHistoricList
              compact
              title="Next 3 days"
              items={report.daily.map((day) => ({
                label: day.label,
                value: `${formatTemperature(day.min, report.unit)} / ${formatTemperature(day.max, report.unit)} · ${day.summary}`,
              }))}
            />
          </>
        ) : null}
      </DetailPanel>
    </FlexLayout>
  );
});
