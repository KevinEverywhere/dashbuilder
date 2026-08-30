export interface AirQualityReading {
  aqi: number;
  pm25: number;
  pm10: number;
  ozone: number;
  nitrogenDioxide: number;
  hourly: Array<{ x: string; y: number }>;
}

export type AirQualityTone = 'success' | 'warning' | 'error';

export function aqiLabel(aqi: number): string {
  if (aqi <= 50) {
    return 'Good';
  }
  if (aqi <= 100) {
    return 'Moderate';
  }
  if (aqi <= 150) {
    return 'Unhealthy (sensitive)';
  }
  return 'Unhealthy';
}

export function aqiTone(aqi: number): AirQualityTone {
  if (aqi <= 50) {
    return 'success';
  }
  if (aqi <= 100) {
    return 'warning';
  }
  return 'error';
}

interface OpenMeteoAirQuality {
  current?: {
    us_aqi?: number;
    pm2_5?: number;
    pm10?: number;
    ozone?: number;
    nitrogen_dioxide?: number;
  };
  hourly?: {
    time?: string[];
    pm2_5?: Array<number | null>;
  };
}

export async function fetchAirQuality(
  lat: number,
  lng: number,
  signal?: AbortSignal,
): Promise<AirQualityReading> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    current: 'us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide',
    hourly: 'pm2_5',
    forecast_days: '1',
    timezone: 'auto',
  });
  const response = await fetch(
    `https://air-quality-api.open-meteo.com/v1/air-quality?${params}`,
    { signal },
  );
  if (!response.ok) {
    throw new Error(`Air quality request failed (${response.status})`);
  }
  const body = (await response.json()) as OpenMeteoAirQuality;
  const times = body.hourly?.time ?? [];
  const values = body.hourly?.pm2_5 ?? [];
  const hourly = times
    .map((time, index) => {
      const value = values[index];
      if (value == null) {
        return null;
      }
      return { x: time.slice(11, 16), y: value };
    })
    .filter((point): point is { x: string; y: number } => point !== null)
    .filter((_, index) => index % 3 === 0)
    .slice(0, 8);

  return {
    aqi: Math.round(body.current?.us_aqi ?? 0),
    pm25: body.current?.pm2_5 ?? 0,
    pm10: body.current?.pm10 ?? 0,
    ozone: body.current?.ozone ?? 0,
    nitrogenDioxide: body.current?.nitrogen_dioxide ?? 0,
    hourly,
  };
}
