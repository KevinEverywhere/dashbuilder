export const ABOUT_SOURCE = `<AboutScreen>
  <section class="da-panel da-panel--about">
    <!-- Intro, runtime npm packages, Component source panel, docs -->
  </section>
</AboutScreen>`;

export const OVERVIEW_SOURCE = `<OverviewScreen [locale]="locale" [userRole]="userRole">
  <rd-grid columns="3" gap="12" title="Destination KPIs">…</rd-grid>
  <rd-chart-line title="Visitors over time (aggregate trend)" />
  <rd-chart-bar title="2024 visitors by destination" />
  <rd-role-gate label="Operations metrics" [allowedRoles]="['admin']">…</rd-role-gate>
</OverviewScreen>`;

export const SETTINGS_SOURCE = `<SettingsScreen>
  <header><h2>Settings</h2><da-theme-toggle /></header>
  <da-atlas-context-controls [highlightField]="…" />
  <da-collapsible title="Integration keys (BYOK)">…</da-collapsible>
  <da-collapsible title="AI providers (BYOK)">…</da-collapsible>
  <da-bound-textarea-input label="Feedback" />
</SettingsScreen>`;

export const MAPS_SOURCE = `<MapsScreen>…</MapsScreen>`;

export const DESTINATIONS_SOURCE = `<DestinationsScreen>
  <section class="rd-filter-grid">…</section>
  <da-filter-summary />
  <rd-flex>
    <section class="rd-table">…</section>
    <rd-detail>…</rd-detail>
  </rd-flex>
</DestinationsScreen>`;

export const MEDIA_SOURCE = `<MediaScreen>
  <da-bound-select-input label="Flat video (YouTube)" />
  <rd-youtube-embed />
  <da-bound-select-input label="360° video (Authoring)" />
  <da-video-metadata-panel />
</MediaScreen>`;

export const AUTHORING_SOURCE = `<AuthoringScreen>
  <rd-video-source />
  <rd-equirect-sphere-viewport />
  <rd-wasm-media operation="equirect-extract" />
</AuthoringScreen>`;

export const INTEL_SOURCE = `<IntelScreen>
  <da-role-gate-panel>…search + region…</da-role-gate-panel>
  <section class="rd-news-results-table">…</section>
  <rd-news-article-detail>…</rd-news-article-detail>
</IntelScreen>`;

export const PLAN_SOURCE = `<PlanScreen>
  <da-role-gate-panel label="Trip editor">
    <da-form-section-grid>…</da-form-section-grid>
  </da-role-gate-panel>
  <rd-timer />
</PlanScreen>`;

export const VIEWS_SOURCE = `<ViewsScreen>
  <da-journey-sankey-chart />
  <da-venn-overlap-chart />
  <rd-display-3d-scatter />
  <da-slide-carousel />
</ViewsScreen>`;

export const STACK_SOURCE = `<StackScreen>
  <da-role-gate-panel label="Infrastructure stack">
    <rd-postgresql /> … infra nodes …
  </da-role-gate-panel>
</StackScreen>`;

export const GAP_SOURCE = `<GapScreen screenId="..." runtime="angular">…</GapScreen>`;

export const SCREEN_SOURCES: Record<string, string> = {
  about: ABOUT_SOURCE,
  overview: OVERVIEW_SOURCE,
  settings: SETTINGS_SOURCE,
  maps: MAPS_SOURCE,
  destinations: DESTINATIONS_SOURCE,
  media: MEDIA_SOURCE,
  authoring: AUTHORING_SOURCE,
  intel: INTEL_SOURCE,
  plan: PLAN_SOURCE,
  views: VIEWS_SOURCE,
  stack: STACK_SOURCE,
};
