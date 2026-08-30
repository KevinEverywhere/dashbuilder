import { registerRosettaDashElements } from '@rosettadash/web-components';
import '../../../packages/web-components/src/styles/styles.css';
import { createListingBrowser } from './ListingBrowser';
import './host.css';

registerRosettaDashElements();

const root = document.getElementById('app');
if (root) {
  root.innerHTML = `
    <div class="rd-demo-page">
      <header class="rd-demo-page__intro">
        <p class="rd-demo-page__eyebrow">Host page</p>
        <h1>Open houses</h1>
        <p>
          The block on the right is <code>ListingBrowser</code> — a vanilla drop-in composed from
          RosettaDash select, map, KPI, badge, table, and detail atoms.
        </p>
      </header>
    </div>
  `;
  root.querySelector('.rd-demo-page')?.append(createListingBrowser());
}
