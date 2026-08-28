import { ScrollRegion } from '@rosettadash/react/layout/scroll-region';
import {
  DESTINATION_ATLAS_ABOUT_INTRO,
  DESTINATION_ATLAS_CURRENT_RUNTIME_BADGE,
  DESTINATION_ATLAS_RUNTIME_GUIDES,
  DESTINATION_ATLAS_RUNTIME_MATRIX_COLUMNS,
  type DestinationAtlasRuntimeId,
} from '@destination-atlas';

const CURRENT_RUNTIME_ID: DestinationAtlasRuntimeId = 'react';

export const ABOUT_SOURCE = `<AboutScreen>
  <ScrollRegion title="About Destination Atlas" maxHeight="calc(100vh - 12rem)" overlayScrollbar>
    {/* Intro, runtime npm packages, Component source panel, docs */}
  </ScrollRegion>
</AboutScreen>`;

export function AboutScreen() {
  return (
    <section className="da-panel da-panel--about">
      <ScrollRegion title="About Destination Atlas" maxHeight="calc(100vh - 12rem)">
        <h2>About Destination Atlas</h2>
        <div className="da-about">
        <p className="da-about__lead">{DESTINATION_ATLAS_ABOUT_INTRO.lead}</p>

        <section className="da-about__section">
          <h3>{DESTINATION_ATLAS_ABOUT_INTRO.title}</h3>
          <p>{DESTINATION_ATLAS_ABOUT_INTRO.proofPurpose}</p>
          <p>{DESTINATION_ATLAS_ABOUT_INTRO.consumerInstall}</p>
        </section>

        <section className="da-about__section">
          <h3>Runtimes — proof apps &amp; Storybook</h3>
          <p>
            Each runtime ships a <strong>proof app</strong> (full Destination Atlas UX) and a{' '}
            <strong>Storybook catalog</strong> (isolated component review). Use the same npm package in your
            consumer project.
          </p>
          <p className="da-about__note">{DESTINATION_ATLAS_ABOUT_INTRO.runtimeCardsNote}</p>
          <div className="da-about__runtime-matrix-wrap">
            <div className="da-about__runtime-matrix-head" aria-hidden="true">
              {DESTINATION_ATLAS_RUNTIME_MATRIX_COLUMNS.map((column) => (
                <span key={column.id}>{column.label}</span>
              ))}
            </div>
            <ul className="da-about__runtime-list">
              {DESTINATION_ATLAS_RUNTIME_GUIDES.map((runtime) => {
                const isCurrent = runtime.id === CURRENT_RUNTIME_ID;
                return (
                  <li
                    key={runtime.id}
                    className={`da-about__runtime-card${isCurrent ? ' da-about__runtime-card--current' : ''}`}
                    aria-current={isCurrent ? 'true' : undefined}
                  >
                    <header>
                      <h4>{runtime.label}</h4>
                      <span className="da-about__ticket">{runtime.ticket}</span>
                      {isCurrent ? (
                        <span className="da-about__runtime-current-badge">
                          {DESTINATION_ATLAS_CURRENT_RUNTIME_BADGE}
                        </span>
                      ) : null}
                    </header>
                    <p>{runtime.summary}</p>
                    <div className="da-about__runtime-matrix">
                      <div className="da-about__runtime-matrix-col">
                        <span className="da-about__runtime-matrix-label">
                          {DESTINATION_ATLAS_RUNTIME_MATRIX_COLUMNS[0].label}
                        </span>
                        <code>{runtime.npmPackage}</code>
                      </div>
                      <div className="da-about__runtime-matrix-col">
                        <span className="da-about__runtime-matrix-label">
                          {DESTINATION_ATLAS_RUNTIME_MATRIX_COLUMNS[1].label}
                        </span>
                        <code>{runtime.proofCommand}</code>
                        <span className="da-about__port">localhost:{runtime.proofPort}</span>
                        <span className="da-about__path">{runtime.proofPath}</span>
                      </div>
                      <div className="da-about__runtime-matrix-col">
                        <span className="da-about__runtime-matrix-label">
                          {DESTINATION_ATLAS_RUNTIME_MATRIX_COLUMNS[2].label}
                        </span>
                        <code>{runtime.storybookCommand}</code>
                        <span className="da-about__port">localhost:{runtime.storybookPort}</span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="da-about__section">
          <h3>{DESTINATION_ATLAS_ABOUT_INTRO.componentSourceTitle}</h3>
          <p>{DESTINATION_ATLAS_ABOUT_INTRO.componentSourceBody}</p>
        </section>

        <section className="da-about__section">
          <h3>How to work with components</h3>
          <ol className="da-about__steps">
            <li>
              Open <strong>Storybook</strong> for your runtime — browse palette groups, preview bindings, and copy
              import paths from the catalog.
            </li>
            <li>
              Run the matching <strong>proof app</strong> — see components composed into real screens (this React app
              is the reference implementation).
            </li>
            <li>
              On any other tab, read the <strong>Component source</strong> panel — inspect JSX structure, prop names,
              and how RosettaDash imports nest together.
            </li>
            <li>
              Install packages in your app via npm; wire developer-owned i18n, data, and providers (map tiles, API keys)
              at the component prop level.
            </li>
          </ol>
        </section>

        <section className="da-about__section da-about__section--muted da-about__section--last">
          <h3>Documentation</h3>
          <ul className="da-about__doc-links">
            <li>
              <code>docs/43-destination-atlas-proof-apps.md</code> — screen map and mock data
            </li>
            <li>
              <code>docs/38-storybook-component-catalog.md</code> — Storybook ports and sidebar taxonomy
            </li>
            <li>
              <code>docs/34-public-component-api.md</code> — import paths and recipes
            </li>
          </ul>
        </section>
        </div>
      </ScrollRegion>
    </section>
  );
}
