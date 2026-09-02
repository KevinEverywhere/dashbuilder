/** Storybook display names — must match `name` in components-catalog.stories.* */
export const PALETTE_GROUP_STORY_NAMES: Record<string, string> = {
  'form-inputs': 'Form Inputs',
  'data-display': 'Data Display',
  'logic-motion': 'Logic & Motion',
  'charts': 'Charts',
  'views': 'Views',
  'layout': 'Layout & Navigation',
  'access-onboarding': 'Access & Onboarding',
  'data-sources': 'Data Sources',
  'api-servers': 'API Servers',
  'news-discovery': 'News Discovery',
  'plugin-extensions': 'Plugin Extensions',
  'vr-visuals': 'VR & 3D',
  'svg-visuals': 'SVG',
  'media-authoring': 'Media Authoring',
  'wasm-compute': 'WASM Compute',
};

/** Storybook story ids — fallback when addon-links is unavailable in iframe embeds */
export const PALETTE_GROUP_STORY_IDS: Record<string, string> = {
  'form-inputs': 'catalog-components--form-inputs',
  'data-display': 'catalog-components--data-display',
  'logic-motion': 'catalog-components--logic-and-motion',
  'charts': 'catalog-components--charts',
  'views': 'catalog-components--views',
  'layout': 'catalog-components--layout-and-navigation',
  'access-onboarding': 'catalog-components--access-and-onboarding',
  'data-sources': 'catalog-components--data-sources',
  'api-servers': 'catalog-components--api-servers',
  'news-discovery': 'catalog-components--news-discovery',
  'plugin-extensions': 'catalog-components--plugin-extensions',
  'vr-visuals': 'catalog-components--vr-and-3-d',
  'svg-visuals': 'catalog-components--svg-visuals',
  'media-authoring': 'catalog-components--media-authoring',
  'wasm-compute': 'catalog-components--wasm-compute',
};

export interface PaletteGroupGuide {
  id: string;
  /** Universal = fits most dashboards; specialized = domain-specific flows */
  fit: 'universal' | 'specialized' | 'mixed';
  summary: string;
  relationships: string;
  learnMore: string;
  relatedGroupIds: string[];
}

export const PALETTE_GROUP_GUIDES: Record<string, PaletteGroupGuide> = {
  'form-inputs': {
    id: 'form-inputs',
    fit: 'universal',
    summary:
      'Form Inputs collect operator filters and parameters — text, numbers, selects, dates, and presets. Nearly every analytics or operations dashboard starts here: users narrow what the rest of the page shows.',
    relationships:
      'Date Range and Time Preset typically feed Data Table and Charts. Select and Text Input often drive query scope. Checkbox toggles optional series or archived rows. These atoms rarely stand alone; they bind forward to visuals via the builder’s binding panel.',
    learnMore:
      'Explore **Data Display → Data Table** to see filter bindings in action, and **Charts** for time-series driven by Date Range. Time Preset is the compact alternative when you want one-click periods instead of a full calendar.',
    relatedGroupIds: ['data-display', 'charts', 'layout'],
  },
  'data-display': {
    id: 'data-display',
    fit: 'universal',
    summary:
      'Data Display turns rowsets into readable operator views — tabular data, drill-down detail, and headline KPIs. This is the core “read the business” layer of most dashboards.',
    relationships:
      'Data Table emits row selection; Detail Panel listens and shows the chosen record. KPI Card summarizes a metric without requiring row interaction. In the builder, connect Table → Detail with a binding; KPI often binds to the same dataset aggregate.',
    learnMore:
      'Click rows in the **Data Table** demo above, then watch **Detail Panel** update. For loading states while queries run, see **Logic & Motion → Loading Skeleton**.',
    relatedGroupIds: ['form-inputs', 'charts', 'logic-motion'],
  },
  'logic-motion': {
    id: 'logic-motion',
    fit: 'universal',
    summary:
      'Logic & Motion components manage timing and perceived performance — placeholders while data loads and timers that trigger refresh or countdown UX.',
    relationships:
      'Loading Skeleton binds to a boolean “loading” input from your data layer; swap it for real visuals when ready. Timer ticks drive polling intervals or auto-refresh of Table and Chart nodes downstream.',
    learnMore:
      'Pair **Loading Skeleton** with any **Data Display** or **Charts** component. Use **Timer** when documenting refresh behavior for live ops dashboards.',
    relatedGroupIds: ['data-display', 'charts'],
  },
  'charts': {
    id: 'charts',
    fit: 'universal',
    summary:
      'Charts visualize trends and composition — line for time-series, bar for comparisons, pie for part-to-whole. Standard analytics dashboards rely on this group alongside filters.',
    relationships:
      'Charts consume the same rowsets as Data Table, often filtered by Form Inputs. Line Chart expects a time field; Bar and Pie map label/value columns. Bindings surface in the preview chip when a date range is linked.',
    learnMore:
      'Start with **Form Inputs → Date Range**, then open **Charts** stories. For spatial or immersive alternatives, compare **VR & 3D** bar/scatter hosts.',
    relatedGroupIds: ['form-inputs', 'data-display', 'vr-visuals'],
  },
  'views': {
    id: 'views',
    fit: 'mixed',
    summary:
      'Views showcase richer storytelling visuals — journey Sankey flows, Venn overlap diagrams, 3D scatter plots, and media carousels. Use for travel funnels, segment overlap, multi-axis comparisons, and thumbnail navigation.',
    relationships:
      'Sankey and Venn bind to pre-aggregated datasets or derived metrics. Three Scatter Plot maps three numeric fields (price, distance, rating). Slide Carousel pairs with destination or media rowsets and emits selection for Detail or Map nodes.',
    learnMore:
      'Open the Destination Atlas **Views** proof screen for a four-panel demo. Compare with **Charts** for standard 2D analytics and **VR & 3D** for immersive hosts.',
    relatedGroupIds: ['charts', 'data-display', 'vr-visuals', 'media-authoring'],
  },
  'layout': {
    id: 'layout',
    fit: 'universal',
    summary:
      'Layout & Navigation structures the page — grids, flex rows, tabs, modals, and collapsible sections. Use this group to organize any dashboard regardless of domain.',
    relationships:
      'Grid and Flex hold other components in the canvas. Tabs separate concerns (overview vs settings). Modal and Collapsible hide advanced controls until needed. NPM **rd-accordion** (see NPM layout atoms) is an alternative collapsible pattern for docs-style pages.',
    learnMore:
      'See **Catalog → NPM layout atoms** for shipped `<rd-accordion>` and link-list recipes. Combine **Layout → Tabs** with **Data Display** panels in separate tab panels.',
    relatedGroupIds: ['data-display', 'form-inputs'],
  },
  'access-onboarding': {
    id: 'access-onboarding',
    fit: 'specialized',
    summary:
      'Access & Onboarding governs who sees what and how new members join — role gates, invitations, and role assignment. These appear in admin settings dashboards and team onboarding flows, not in every analytics screen.',
    relationships:
      'Role Gate wraps sensitive panels: only selected roles see child content. Person Invite captures email for invites; Role Assign confirms access level. Typical flow: invite → assign role → gate protects admin-only composites.',
    learnMore:
      '**Role Gate** is the visibility switch — inspect allowed roles in the demo. Follow with **Role Assign** to see how operators grant access. For general forms, compare **Form Inputs**; this group is domain-specific to team admin.',
    relatedGroupIds: ['layout', 'form-inputs'],
  },
  'data-sources': {
    id: 'data-sources',
    fit: 'specialized',
    summary:
      'Data Sources declare where exported dashboards connect — environment variables and database bindings (PostgreSQL, MongoDB, Supabase, MySQL). These are infrastructure nodes, not visual widgets; they appear in stack/export configuration.',
    relationships:
      'Environment Config holds secrets and feature flags referenced by servers and ORMs. Database nodes point at connection env keys and table/collection names. Export wizards use these when generating Nest, Express, or Next backends.',
    learnMore:
      'Pair with **API Servers** to see the full stack profile. Visual dashboards bind to APIs that these sources back — start from **Data Display** for the UI side.',
    relatedGroupIds: ['api-servers', 'data-display'],
  },
  'api-servers': {
    id: 'api-servers',
    fit: 'specialized',
    summary:
      'API Servers choose the backend framework for exported projects — NestJS, Express, Next.js, or Nuxt. Like Data Sources, this is a stack/export concern rather than an in-dashboard visual.',
    relationships:
      'Each server node sets API prefix and routing conventions for generated code. Combined with Data Sources, they define the full server + database export target shown in the builder’s export wizard.',
    learnMore:
      'Review **Data Sources** for persistence, then **Data Display** for what operators actually see. Single use: picked once per exported project stack.',
    relatedGroupIds: ['data-sources'],
  },
  'news-discovery': {
    id: 'news-discovery',
    fit: 'specialized',
    summary:
      'News Discovery is a complete vertical slice for media monitoring dashboards — language/region/type filters, search, results table, and article detail. Use the whole group together; individual pieces are less useful alone.',
    relationships:
      'Language, Region, and Type Selects narrow the query. Search Box submits keywords. Results Table lists headlines; Article Detail opens the selected story. Mirrors the News Finder composite template in RosettaDash.',
    learnMore:
      'Click headlines in **News Results** to populate **Article Detail**. Compare the generic **Data Display** table/detail pattern — News Discovery is a opinionated, pre-wired variant.',
    relatedGroupIds: ['form-inputs', 'data-display'],
  },
  'plugin-extensions': {
    id: 'plugin-extensions',
    fit: 'mixed',
    summary:
      'Plugin Extensions show how third-party or internal plugins surface in the palette — status badges and metric chips. Useful anywhere you need compact status or inline KPIs outside the full KPI Card layout.',
    relationships:
      'Status Badge communicates state (success/warning/info). Metric Chip shows a labeled number with optional suffix. Plugins register through the component SDK; these demos reflect the default plugin preview templates.',
    learnMore:
      'For full-size metrics use **Data Display → KPI Card**. For charting trends, see **Charts**.',
    relatedGroupIds: ['data-display', 'charts'],
  },
  'vr-visuals': {
    id: 'vr-visuals',
    fit: 'specialized',
    summary:
      'VR & 3D hosts immersive visuals — 3D bar/scatter/scene charts, GLTF models, and geo globes. Best for spatial analytics, digital twins, or presentation dashboards; not required for standard 2D CRUD/analytics pages.',
    relationships:
      '3D Bar and Scatter map rowset fields to spatial encodings. Scene adds point clouds; GLTF Model loads external assets; Geo Globe plots lat/lng markers. All reuse the same Three.js preview runtime as the builder canvas.',
    learnMore:
      'Interact with orbit controls in each host above. Compare flat **Charts** for simpler 2D equivalents. Field mapping docs live in builder inspector guides for each visual type.',
    relatedGroupIds: ['charts', 'data-display'],
  },
  'svg-visuals': {
    id: 'svg-visuals',
    fit: 'mixed',
    summary:
      'SVG components render vector graphics — inline diagrams or icons. Icons fit any dashboard; inline SVG suits logos, diagrams, and custom illustration slots.',
    relationships:
      'Inline SVG accepts markup, URL, or asset path with width/height. Icon is a sized, colored variant for toolbars and KPI adornments. Pair with **Layout** flex rows for toolbar composition.',
    learnMore:
      'Use **Plugin Extensions → Metric Chip** beside icons for compact stat rows. Media-heavy dashboards may also use **Media Authoring**.',
    relatedGroupIds: ['layout', 'plugin-extensions'],
  },
  'media-authoring': {
    id: 'media-authoring',
    fit: 'specialized',
    summary:
      'Media Authoring supports 360° / equirect and flat video workflows — ingest video, frame with sphere or flat viewports, define crop metadata, and optionally capture live camera input. Built for immersive production tools (e.g. ffmp3Console), not generic BI dashboards.',
    relationships:
      'Video Source ingests files and emits metadata. Equirect Sphere Viewport renders interior Three.js sphere framing; Flat Video Viewport owns draggable 2D crop. Equirect Viewport (legacy) emits crop/filter strings without WebGL. Live Capture previews camera input. Shipped npm elements `<rd-video-source>`, `<rd-equirect-sphere-viewport>`, `<rd-flat-video-viewport>`, and `<rd-equirect-viewport>`.',
    learnMore:
      'See **Meta components → Media authoring pipeline** and **Wasm compute lab** for end-to-end flows. Shipped npm viewport elements are on **NPM layout atoms**.',
    relatedGroupIds: ['wasm-compute', 'vr-visuals'],
  },
  'wasm-compute': {
    id: 'wasm-compute',
    fit: 'specialized',
    summary:
      'WASM Compute covers client-side modules — asset bundles, worker hosts, module entry points, and ffmpeg-style media extract. Used when dashboards need in-browser processing rather than server batch jobs.',
    relationships:
      'WASM Asset declares module + glue paths. Worker Host runs background threads. WASM Module exposes an entry export. Wasm Media performs equirect extract in the browser (optional ffmpeg peers). Media Authoring feeds files into Wasm Media.',
    learnMore:
      'See **Media Authoring** for ingest/framing UI. `<rd-wasm-media>` is the shipped custom element; other rows are configuration/preview nodes for export and builder palette.',
    relatedGroupIds: ['media-authoring'],
  },
};

/** Per-component pointers shown on catalog cards (especially in All components view). */
export const COMPONENT_LEARN_MORE: Partial<Record<string, string>> = {
  'visual.input.date-range': 'Often binds to Data Table and Charts — see **Data Display** and **Charts** groups.',
  'domain.time-preset': 'Compact filter alternative to Date Range; pairs with KPI and line charts.',
  'visual.table': 'Select a row here, then open **Data Display** for Detail Panel binding pattern.',
  'visual.detail': 'Designed to bind to Data Table row-select output in the same composite.',
  'visual.kpi': 'Summarizes one metric; compare **Plugin Extensions → Metric Chip** for inline use.',
  'visual.skeleton': 'Wrap any slow-loading visual; toggle loading binding in builder inspector.',
  'logic.timer': 'Drives refresh intervals for tables/charts in live ops dashboards.',
  'domain.role-gate': 'Wraps admin-only sections — see **Access & Onboarding** group intro.',
  'domain.person-invite': 'First step in team onboarding; follow with Role Assign in this group.',
  'domain.role-assign': 'Confirms access after Person Invite; pair with Role Gate on sensitive pages.',
  'visual.news.results-table': 'Click a headline, then see **Article Detail** in this group.',
  'visual.media.video-source': 'Shipped npm `<rd-video-source>` — see **NPM layout atoms** and **Media Authoring** group.',
  'visual.media.equirect-viewport': 'Shipped npm `<rd-equirect-viewport>` — metadata/crop strings only · see **NPM layout atoms**.',
  'visual.media.equirect-sphere-viewport': 'Shipped npm `<rd-equirect-sphere-viewport>` — Three.js interior sphere + export rectangle · Destination Atlas Authoring.',
  'visual.media.flat-video-viewport': 'Shipped npm `<rd-flat-video-viewport>` — draggable flat crop + output mirror · Destination Atlas Authoring.',
  'visual.wasm.media': 'Live demo on **WASM Compute** group + **Meta components → WASM compute lab** · optional @ffmpeg peers.',
  'layout.collapsible': 'Similar UX to npm `<rd-accordion>` — see **NPM layout atoms**.',
};

export function getGroupGuide(groupId: string): PaletteGroupGuide | undefined {
  return PALETTE_GROUP_GUIDES[groupId];
}

export function renderRelatedGroupButtonsHtml(relatedGroupIds: string[]): string {
  if (relatedGroupIds.length === 0) {
    return '';
  }
  return relatedGroupIds
    .map((id) => {
      const guide = PALETTE_GROUP_GUIDES[id];
      const label = guide ? PALETTE_GROUP_STORY_NAMES[id] ?? id : id;
      return `<button type="button" class="rd-catalog-guide__link" data-nav-group="${id}">${label}</button>`;
    })
    .join('');
}

export function renderRelatedGroupsHtml(relatedGroupIds: string[]): string {
  const links = renderRelatedGroupButtonsHtml(relatedGroupIds);
  if (!links) {
    return '';
  }
  return `<p class="rd-catalog-guide__related"><span>Related groups:</span> ${links}</p>`;
}

export function renderGroupGuideHtml(guide: PaletteGroupGuide, options?: { showTitle?: boolean }): string {
  const fitLabel =
    guide.fit === 'universal'
      ? 'Fits most dashboards'
      : guide.fit === 'specialized'
        ? 'Specialized / single-purpose flows'
        : 'Mixed — some universal, some specialized';

  const titleBlock =
    options?.showTitle === false
      ? ''
      : `<h2 class="rd-catalog-guide__title">${PALETTE_GROUP_STORY_NAMES[guide.id] ?? guide.id}</h2>`;

  return `<aside class="rd-catalog-guide" data-guide-group="${guide.id}">
    ${titleBlock}
    <p class="rd-catalog-guide__fit"><span>${fitLabel}</span></p>
    <p class="rd-catalog-guide__summary">${guide.summary}</p>
    <h3 class="rd-catalog-guide__heading">How components relate</h3>
    <p class="rd-catalog-guide__body">${guide.relationships}</p>
    <h3 class="rd-catalog-guide__heading">Where to learn more</h3>
    <p class="rd-catalog-guide__body rd-catalog-guide__learn">${formatLearnMore(guide.learnMore)}</p>
    ${renderRelatedGroupsHtml(guide.relatedGroupIds)}
  </aside>`;
}

function formatLearnMore(text: string): string {
  return text.replace(/\*\*([^*]+)\*\*/g, (_, label: string) => {
    const trimmed = label.trim();
    const groupEntry = Object.entries(PALETTE_GROUP_STORY_NAMES).find(([, name]) => {
      if (name === trimmed || trimmed.startsWith(`${name} →`) || trimmed.startsWith(`${name} ·`)) {
        return true;
      }
      return trimmed.includes(`→ ${name}`) || trimmed.endsWith(name);
    });
    if (groupEntry) {
      const [groupId, name] = groupEntry;
      return `<button type="button" class="rd-catalog-guide__link" data-nav-group="${groupId}">${label}</button>`;
    }
    return `<strong>${label}</strong>`;
  });
}

export function renderComponentLearnMore(type: string): string {
  const hint = COMPONENT_LEARN_MORE[type];
  if (!hint) {
    return '';
  }
  return `<p class="rd-catalog-item__learn">${formatLearnMore(hint)}</p>`;
}
