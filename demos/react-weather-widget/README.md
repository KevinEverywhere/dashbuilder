# React weather widget

[DAS-168](https://planetkevin.atlassian.net/browse/DAS-168) proof of concept: a **page-sized** React 19 widget a host app can drop in. Visible UI is existing `@rosettadash/react` atoms only. There is no weather catalog component yet — temperature uses `KpiCard`; a dedicated atom can replace that later.

## What it composes

| Piece | Import |
|-------|--------|
| Location selector | `@rosettadash/react/visual/input/select` |
| Leaflet map | `@rosettadash/react/visual/display/geo-map` (`provider="leaflet"`) |
| Current temperature | `@rosettadash/react/visual/kpi` |
| Condition badge | `@rosettadash/react/visual/plugin/status-badge` |
| Weather report | `@rosettadash/react/visual/detail` (`DetailPanel`, `DetailStats`, `DetailHistoricList`) |
| Loading | `@rosettadash/react/visual/skeleton` |
| Layout | `@rosettadash/react/layout/flex` |

Live conditions come from [Open-Meteo](https://open-meteo.com/) (no API key). Locations default to the Destination Atlas city set.

## Run the host page

From the RosettaDash repo root:

```bash
npm run demo:weather
```

Opens [http://localhost:4320](http://localhost:4320). The widget sits in a page column so you can judge embed size.

## Integrate in a React 18/19 app

```tsx
import { WeatherWidget } from '../../demos/react-weather-widget/src';
import '@rosettadash/web-components/styles.css';

export function Sidebar() {
  return <WeatherWidget />;
}
```

Optional props:

```tsx
<WeatherWidget
  defaultLocationId="paris"
  unit="fahrenheit"
  locations={[{ id: 'lisbon', label: 'Lisbon', meta: 'Europe', lat: 38.7223, lng: -9.1393 }]}
/>
```

Peer needs: `react` / `react-dom` 18 or 19, `@rosettadash/react`, `@rosettadash/web-components` (Leaflet is already a web-components peer).
