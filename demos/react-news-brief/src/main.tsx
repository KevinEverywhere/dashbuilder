import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerRosettaDashElements } from '@rosettadash/web-components';
import '../../../packages/web-components/src/styles/styles.css';
import { NewsBrief } from './NewsBrief.js';
import './host.css';

registerRosettaDashElements();

const root = document.getElementById('app');
if (root) {
  createRoot(root).render(
    <StrictMode>
      <div className="rd-demo-page">
        <header className="rd-demo-page__intro">
          <p className="rd-demo-page__eyebrow">Host page</p>
          <h1>Morning desk</h1>
          <p>
            The block on the right is <code>NewsBrief</code> — a React drop-in composed from
            RosettaDash news selects, table, KPI, badge, and detail atoms.
          </p>
        </header>
        <NewsBrief />
      </div>
    </StrictMode>,
  );
}
