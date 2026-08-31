import { forwardRef, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { FlexLayout } from '@rosettadash/react/layout/flex';
import { Timer } from '@rosettadash/react/logic/timer';
import { LineChart } from '@rosettadash/react/visual/chart/line';
import { DetailPanel, DetailStats } from '@rosettadash/react/visual/detail';
import { GeoMap } from '@rosettadash/react/visual/display/geo-map';
import { SelectInput } from '@rosettadash/react/visual/input/select';
import { KpiCard } from '@rosettadash/react/visual/kpi';
import { StatusBadge } from '@rosettadash/react/visual/plugin/status-badge';
import { aqiLabel, aqiTone, fetchAirQuality, type AirQualityReading } from './air-quality.js';
import { SENSOR_STATIONS, getSensorStation, type SensorStation } from './stations.js';
import './SensorDashboard.css';

export type { SensorStation };

export interface SensorDashboardProps {
  stations?: SensorStation[];
  defaultStationId?: string;
  className?: string;
  style?: CSSProperties;
}

const REFRESH_MS = 60_000;
const DASH = '—';

function readingStats(reading: AirQualityReading | null) {
  return [
    { label: 'US AQI', value: reading ? String(reading.aqi) : DASH },
    { label: 'PM2.5', value: reading ? `${reading.pm25.toFixed(1)} µg/m³` : DASH },
    { label: 'PM10', value: reading ? `${reading.pm10.toFixed(1)} µg/m³` : DASH },
    { label: 'Ozone', value: reading ? `${Math.round(reading.ozone)} µg/m³` : DASH },
    { label: 'NO₂', value: reading ? `${Math.round(reading.nitrogenDioxide)} µg/m³` : DASH },
  ];
}

/** Page-embed air-quality sensor board composed from @rosettadash/react atoms. */
export const SensorDashboard = forwardRef<HTMLElement, SensorDashboardProps>(function SensorDashboard(
  { stations = SENSOR_STATIONS, defaultStationId, className, style },
  ref,
) {
  const initialId =
    defaultStationId && getSensorStation(defaultStationId, stations)
      ? defaultStationId
      : (stations[0]?.id ?? '');
  const [selectedId, setSelectedId] = useState(initialId);
  const [reading, setReading] = useState<AirQualityReading | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [ticks, setTicks] = useState(0);

  const selected = getSensorStation(selectedId, stations) ?? stations[0];
  const selectOptions = useMemo(
    () => stations.map((station) => ({ value: station.id, label: station.label })),
    [stations],
  );
  const markers = useMemo(
    () =>
      stations.map((station) => ({
        id: station.id,
        lat: station.lat,
        lng: station.lng,
        label: station.label,
      })),
    [stations],
  );

  useEffect(() => {
    if (!selected) {
      setStatus('error');
      setErrorMessage('No stations available');
      return;
    }

    const controller = new AbortController();
    setStatus('loading');
    setErrorMessage('');

    fetchAirQuality(selected.lat, selected.lng, controller.signal)
      .then((next) => {
        setReading(next);
        setStatus('ready');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) {
          return;
        }
        setStatus('error');
        setErrorMessage(error instanceof Error ? error.message : 'Sensor request failed');
      });

    return () => controller.abort();
  }, [selected, ticks]);

  useEffect(() => {
    const id = window.setInterval(() => setTicks((count) => count + 1), REFRESH_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <FlexLayout
      ref={ref}
      title="Sensors"
      direction="column"
      gap={10}
      className={['rd-sensor-dashboard', className].filter(Boolean).join(' ')}
      style={style}
    >
      <SelectInput
        label="Station"
        options={selectOptions}
        value={selectedId}
        onChange={(value) => {
          if (value) {
            setSelectedId(value);
          }
        }}
      />
      <GeoMap
        className="rd-sensor-dashboard__map"
        provider="leaflet"
        center={
          selected ? JSON.stringify({ lat: selected.lat, lng: selected.lng }) : undefined
        }
        zoom={8}
        markers={markers}
        selectedId={selectedId}
        minHeight="11rem"
        onMarkerSelect={({ id }) => setSelectedId(id)}
      />
      <FlexLayout direction="row" gap={8} stretchItems>
        <KpiCard
          title={selected ? `${selected.label} AQI` : 'AQI'}
          value={reading ? reading.aqi : DASH}
          delta={reading ? `${reading.pm25.toFixed(1)} µg/m³ PM2.5` : 'µg/m³ PM2.5'}
        />
        <StatusBadge
          statusText={
            status === 'loading'
              ? 'Sampling'
              : status === 'error'
                ? 'Offline'
                : aqiLabel(reading?.aqi ?? 0)
          }
          tone={
            status === 'loading'
              ? 'neutral'
              : status === 'error'
                ? 'error'
                : aqiTone(reading?.aqi ?? 0)
          }
        />
      </FlexLayout>
      <Timer label="Auto refresh" mode="interval" intervalMs={REFRESH_MS} tickCount={ticks} />
      <LineChart
        className="rd-sensor-dashboard__chart"
        title="PM2.5 today"
        points={reading?.hourly ?? []}
        xAxisLabel="Hour"
        yAxisLabel="µg/m³"
      />
      <DetailPanel
        className="rd-sensor-dashboard__reading"
        title="Reading"
        emptyMessage={status === 'error' ? errorMessage || 'Sensors unavailable' : 'Select a station'}
      >
        <DetailStats compact items={readingStats(reading)} />
      </DetailPanel>
    </FlexLayout>
  );
});
