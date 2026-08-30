import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerRosettaDashElements } from '@rosettadash/web-components';
import '../../../packages/web-components/src/styles/styles.css';
import { WeatherWidget } from './WeatherWidget.js';
import './host.css';

registerRosettaDashElements();

const root = document.getElementById('app');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <div className="weather-demo-page">
        <header className="weather-demo-page__intro">
          <p className="weather-demo-page__eyebrow">Host page</p>
          <h1>Neighborhood brief</h1>
          <p>
            The weather block on the right is <code>WeatherWidget</code> — a React 19 drop-in
            composed from RosettaDash components.
          </p>
        </header>
        <WeatherWidget />
      </div>
    </StrictMode>,
  );
}
