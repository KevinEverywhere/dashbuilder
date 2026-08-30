import { registerRosettaDashElements } from '@rosettadash/web-components';
import '../../../packages/web-components/src/styles/styles.css';
import { createTourPlayer } from './TourPlayer';
import './host.css';

registerRosettaDashElements();

const root = document.getElementById('app');
if (root) {
  root.innerHTML = `
    <div class="rd-demo-page">
      <header class="rd-demo-page__intro">
        <p class="rd-demo-page__eyebrow">Host page</p>
        <h1>Visit desk</h1>
        <p>
          The block on the right is <code>TourPlayer</code> — a vanilla drop-in composed from
          RosettaDash select, map, KPI, badge, and detail atoms plus a local panorama viewport.
        </p>
      </header>
    </div>
  `;
  root.querySelector('.rd-demo-page')?.append(createTourPlayer());
}
