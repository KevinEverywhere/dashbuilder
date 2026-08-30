import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerRosettaDashElements } from '@rosettadash/web-components';
import '../../../packages/web-components/src/styles/styles.css';
import { SensorDashboard } from './SensorDashboard.js';
import './host.css';

registerRosettaDashElements();

const root = document.getElementById('app');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <div className="rd-demo-page">
        <header className="rd-demo-page__intro">
          <p className="rd-demo-page__eyebrow">Host page</p>
          <h1>Air desk</h1>
          <p>
            The block on the right is <code>SensorDashboard</code> — a React drop-in composed from
            RosettaDash map, KPI, chart, timer, and detail atoms. Readings come from Open-Meteo.
          </p>
        </header>
        <SensorDashboard />
      </div>
    </StrictMode>,
  );
}
