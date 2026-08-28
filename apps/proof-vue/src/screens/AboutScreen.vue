<script lang="ts">
export const ABOUT_SOURCE = `<AboutScreen>
  <section class="da-panel da-panel--about">
    {/* Intro, runtime npm packages, Component source panel, docs */}
  </section>
</AboutScreen>`;
</script>

<script setup lang="ts">
import {
  DESTINATION_ATLAS_ABOUT_INTRO,
  DESTINATION_ATLAS_CROSS_FRAMEWORK_SHOWCASES,
  DESTINATION_ATLAS_CURRENT_RUNTIME_BADGE,
  DESTINATION_ATLAS_RUNTIME_GUIDES,
  DESTINATION_ATLAS_RUNTIME_MATRIX_COLUMNS,
  type DestinationAtlasRuntimeId,
} from '@destination-atlas';

const CURRENT_RUNTIME_ID: DestinationAtlasRuntimeId = 'vue';
</script>

<template>
  <section class="da-panel da-panel--about">
    <h2>About Destination Atlas</h2>
    <div class="da-about">
      <p class="da-about__lead">{{ DESTINATION_ATLAS_ABOUT_INTRO.lead }}</p>

      <section class="da-about__section">
        <h3>{{ DESTINATION_ATLAS_ABOUT_INTRO.title }}</h3>
        <p>{{ DESTINATION_ATLAS_ABOUT_INTRO.proofPurpose }}</p>
        <p>{{ DESTINATION_ATLAS_ABOUT_INTRO.consumerInstall }}</p>
      </section>

      <section class="da-about__section">
        <h3>Runtimes — proof apps &amp; Storybook</h3>
        <p>
          Each runtime ships a <strong>proof app</strong> (full Destination Atlas UX) and a
          <strong>Storybook catalog</strong> (isolated component review). Use the same npm package in your consumer
          project.
        </p>
        <p class="da-about__note">{{ DESTINATION_ATLAS_ABOUT_INTRO.runtimeCardsNote }}</p>
        <div class="da-about__runtime-matrix-wrap">
          <div class="da-about__runtime-matrix-head" aria-hidden="true">
            <span v-for="column in DESTINATION_ATLAS_RUNTIME_MATRIX_COLUMNS" :key="column.id">
              {{ column.label }}
            </span>
          </div>
          <ul class="da-about__runtime-list">
            <li
              v-for="runtime in DESTINATION_ATLAS_RUNTIME_GUIDES"
              :key="runtime.id"
              class="da-about__runtime-card"
              :class="{ 'da-about__runtime-card--current': runtime.id === CURRENT_RUNTIME_ID }"
              :aria-current="runtime.id === CURRENT_RUNTIME_ID ? 'true' : undefined"
            >
              <header>
                <h4>{{ runtime.label }}</h4>
                <span class="da-about__ticket">{{ runtime.ticket }}</span>
                <span
                  v-if="runtime.id === CURRENT_RUNTIME_ID"
                  class="da-about__runtime-current-badge"
                >
                  {{ DESTINATION_ATLAS_CURRENT_RUNTIME_BADGE }}
                </span>
              </header>
              <p>{{ runtime.summary }}</p>
              <div class="da-about__runtime-matrix">
                <div class="da-about__runtime-matrix-col">
                  <span class="da-about__runtime-matrix-label">
                    {{ DESTINATION_ATLAS_RUNTIME_MATRIX_COLUMNS[0].label }}
                  </span>
                  <code>{{ runtime.npmPackage }}</code>
                </div>
                <div class="da-about__runtime-matrix-col">
                  <span class="da-about__runtime-matrix-label">
                    {{ DESTINATION_ATLAS_RUNTIME_MATRIX_COLUMNS[1].label }}
                  </span>
                  <code>{{ runtime.proofCommand }}</code>
                  <span class="da-about__port">localhost:{{ runtime.proofPort }}</span>
                  <span class="da-about__path">{{ runtime.proofPath }}</span>
                </div>
                <div class="da-about__runtime-matrix-col">
                  <span class="da-about__runtime-matrix-label">
                    {{ DESTINATION_ATLAS_RUNTIME_MATRIX_COLUMNS[2].label }}
                  </span>
                  <code>{{ runtime.storybookCommand }}</code>
                  <span class="da-about__port">localhost:{{ runtime.storybookPort }}</span>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </section>

      <section class="da-about__section">
        <h3>Cross-framework composition</h3>
        <p>
          Proof apps are mostly native to their runtime. When a feature is ahead in another package — or you are
          migrating incrementally — you can embed a subtree from another framework instead of rewriting it.
        </p>
        <ul class="da-about__interop-list">
          <li
            v-for="showcase in DESTINATION_ATLAS_CROSS_FRAMEWORK_SHOWCASES"
            :key="showcase.id"
            class="da-about__interop-card"
            :class="{ 'da-about__interop-card--planned': showcase.planned }"
          >
            <header>
              <h4>
                {{ showcase.hostRuntime }} + {{ showcase.embeddedRuntime }}
                <span v-if="showcase.planned" class="da-about__interop-planned">planned</span>
              </h4>
              <span class="da-about__ticket">{{ showcase.hostTicket }}</span>
            </header>
            <p class="da-about__interop-meta">
              <strong>{{ showcase.screen }}</strong> — {{ showcase.feature }}
            </p>
            <p>{{ showcase.summary }}</p>
            <p class="da-about__interop-bridge">
              Bridge: <code>{{ showcase.bridge }}</code>
            </p>
          </li>
        </ul>
      </section>

      <section class="da-about__section">
        <h3>{{ DESTINATION_ATLAS_ABOUT_INTRO.componentSourceTitle }}</h3>
        <p>{{ DESTINATION_ATLAS_ABOUT_INTRO.componentSourceBody }}</p>
      </section>

      <section class="da-about__section">
        <h3>How to work with components</h3>
        <ol class="da-about__steps">
          <li>
            Open <strong>Storybook</strong> for your runtime — browse palette groups, preview bindings, and copy import
            paths from the catalog.
          </li>
          <li>
            Run the matching <strong>proof app</strong> — see components composed into real screens (this Vue app is the
            reference implementation).
          </li>
          <li>
            On any other tab, read the <strong>Component source</strong> panel — inspect template structure, prop names,
            and how RosettaDash imports nest together.
          </li>
          <li>
            Install packages in your app via npm; wire developer-owned i18n, data, and providers (map tiles, API keys) at
            the component prop level.
          </li>
        </ol>
      </section>

      <section class="da-about__section da-about__section--muted da-about__section--last">
        <h3>Documentation</h3>
        <ul class="da-about__doc-links">
          <li><code>docs/43-destination-atlas-proof-apps.md</code> — screen map and mock data</li>
          <li><code>docs/38-storybook-component-catalog.md</code> — Storybook ports and sidebar taxonomy</li>
          <li><code>docs/34-public-component-api.md</code> — import paths and recipes</li>
        </ul>
      </section>
    </div>
  </section>
</template>
