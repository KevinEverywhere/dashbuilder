export type TemperatureUnit = 'celsius' | 'fahrenheit';

export interface DailyOutlook {
  date: string;
  label: string;
  min: number;
  max: number;
  summary: string;
}

export interface WeatherReport {
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  weatherCode: number;
  summary: string;
  unit: TemperatureUnit;
  observedAt: string;
  daily: DailyOutlook[];
}

interface OpenMeteoResponse {
  current?: {
    time?: string;
    temperature_2m?: number;
    apparent_temperature?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
    wind_speed_10m?: number;
    precipitation?: number;
  };
  daily?: {
    time?: string[];
    weather_code?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
  };
}

/** WMO weather interpretation codes used by Open-Meteo. */
export function describeWeatherCode(code: number): string {
  if (code === 0) {
    return 'Clear';
  }
  if (code === 1) {
    return 'Mainly clear';
  }
  if (code === 2) {
    return 'Partly cloudy';
  }
  if (code === 3) {
    return 'Overcast';
  }
  if (code === 45 || code === 48) {
    return 'Fog';
  }
  if (code === 51 || code === 53 || code === 55) {
    return 'Drizzle';
  }
  if (code === 56 || code === 57) {
    return 'Freezing drizzle';
  }
  if (code === 61 || code === 63 || code === 65) {
    return 'Rain';
  }
  if (code === 66 || code === 67) {
    return 'Freezing rain';
  }
  if (code === 71 || code === 73 || code === 75 || code === 77) {
    return 'Snow';
  }
  if (code === 80 || code === 81 || code === 82) {
    return 'Rain showers';
  }
  if (code === 85 || code === 86) {
    return 'Snow showers';
  }
  if (code === 95 || code === 96 || code === 99) {
    return 'Thunderstorm';
  }
  return 'Mixed conditions';
}

export function formatTemperature(value: number, unit: TemperatureUnit): string {
  const rounded = Math.round(value);
  return unit === 'fahrenheit' ? `${rounded}°F` : `${rounded}°C`;
}

export function weatherBadgeTone(
  code: number,
): 'success' | 'warning' | 'error' | 'neutral' {
  if (code === 0 || code === 1) {
    return 'success';
  }
  if (code >= 95) {
    return 'error';
  }
  if (code >= 51) {
    return 'warning';
  }
  return 'neutral';
}

function weekdayLabel(isoDate: string): string {
  const parsed = new Date(`${isoDate}T12:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return isoDate;
  }
  return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(parsed);
}

export async function fetchWeatherReport(
  lat: number,
  lng: number,
  unit: TemperatureUnit,
  signal?: AbortSignal,
): Promise<WeatherReport> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: [
      'temperature_2m',
      'apparent_temperature',
      'relative_humidity_2m',
      'weather_code',
      'wind_speed_10m',
      'precipitation',
    ].join(','),
    daily: ['weather_code', 'temperature_2m_max', 'temperature_2m_min'].join(','),
    forecast_days: '3',
    timezone: 'auto',
    temperature_unit: unit,
    wind_speed_unit: unit === 'fahrenheit' ? 'mph' : 'kmh',
    precipitation_unit: unit === 'fahrenheit' ? 'inch' : 'mm',
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, { signal });
  if (!response.ok) {
    throw new Error(`Weather request failed (${response.status})`);
  }

  const payload = (await response.json()) as OpenMeteoResponse;
  const current = payload.current;
  if (!current || typeof current.temperature_2m !== 'number') {
    throw new Error('Weather response had no current temperature');
  }

  const weatherCode = current.weather_code ?? 0;
  const dailyTimes = payload.daily?.time ?? [];
  const daily = dailyTimes.slice(0, 3).map((date, index) => {
    const code = payload.daily?.weather_code?.[index] ?? 0;
    return {
      date,
      label: weekdayLabel(date),
      min: payload.daily?.temperature_2m_min?.[index] ?? 0,
      max: payload.daily?.temperature_2m_max?.[index] ?? 0,
      summary: describeWeatherCode(code),
    };
  });

  return {
    temperature: current.temperature_2m,
    apparentTemperature: current.apparent_temperature ?? current.temperature_2m,
    humidity: current.relative_humidity_2m ?? 0,
    windSpeed: current.wind_speed_10m ?? 0,
    precipitation: current.precipitation ?? 0,
    weatherCode,
    summary: describeWeatherCode(weatherCode),
    unit,
    observedAt: current.time ?? '',
    daily,
  };
}
