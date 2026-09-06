import { parityStackGuideParagraph } from '../parity-stack-reference.js';
import type { ComponentDefinition, PortDefinition } from '@rosettadash/core';

export interface ComponentCatalogSubcomponent {
  tag: string;
  bind?: string;
  required?: boolean;
  attributes?: Array<{ name: string; value?: string; required?: boolean }>;
}

export interface ComponentCatalogExtras {
  dependencies?: string[];
  assumptions?: string[];
  subcomponents?: ComponentCatalogSubcomponent[];
}

/** Optional dependencies and assumptions beyond registry port definitions. */
export const COMPONENT_CATALOG_EXTRAS: Partial<Record<string, ComponentCatalogExtras>> = {
  'visual.input.select': {
    assumptions: ['Options can come from a bound rowset or static inspector configuration.'],
  },
  'visual.table': {
    assumptions: ['Rowset columns should match table field bindings; filter input is optional.'],
    subcomponents: [
      {
        tag: 'detail-panel',
        bind: 'selectedRow',
        attributes: [{ name: 'row', required: true }],
      },
    ],
  },
  'visual.detail': {
    dependencies: ['Upstream row source — typically Data Table selectedRow output.'],
    assumptions: ['Shows empty state until a row is bound or selected.'],
    subcomponents: [{ tag: 'data-table', bind: 'selectedRow', required: true }],
  },
  'visual.skeleton': {
    dependencies: ['Boolean loading signal from a data-fetch or query node.'],
  },
  'logic.timer': {
    assumptions: ['Downstream nodes listen to tick events or elapsed values for polling UX.'],
  },
  'visual.chart.line': {
    assumptions: ['Rowset must include xField (time) and yField (numeric) columns per inspector.'],
  },
  'visual.chart.bar': {
    assumptions: ['Rowset rows map to categorical bars; optional date-range filter narrows data.'],
  },
  'visual.chart.pie': {
    assumptions: ['Rowset uses labelField and valueField for slice labels and sizes.'],
  },
  'visual.chart.sankey': {
    assumptions: ['Provide nodes (id, label) and links (source, target, value) for journey or funnel flows.'],
  },
  'visual.chart.venn': {
    assumptions: ['Sets define circle labels and totals; overlaps define intersection counts for 2–3 segments.'],
  },
  'visual.media.carousel': {
    assumptions: ['Slides need id, title, and imageUrl; optional onSelect for destination or media binding.'],
  },
  'layout.grid': {
    assumptions: ['Child visuals are placed in grid slots in the builder canvas.'],
  },
  'layout.flex': {
    assumptions: ['Child visuals flow in the configured row or column direction.'],
  },
  'layout.tabs': {
    assumptions: ['Each tab panel hosts separate child components on the canvas.'],
  },
  'layout.modal': {
    assumptions: ['Open input triggers visibility; body hosts child slot content.'],
  },
  'domain.role-gate': {
    dependencies: ['Authenticated user context with role claims in exported apps.'],
    assumptions: ['Children render only when the viewer role matches allowed roles.'],
  },
  'domain.i18n.app-language-select': {
    dependencies: ['Developer-owned i18n library (vue-i18n, ngx-translate, react-intl, etc.).'],
    assumptions: [
      'Sets app base locale (BCP-47) — does not translate RosettaDash builder or catalog UI.',
      'Distinct from visual.news.language-select (news API filter only).',
      'Emits locale-change; wire to your translation layer.',
    ],
  },
  'domain.person-invite': {
    assumptions: ['Typically first step in admin onboarding before Role Assign.'],
  },
  'domain.role-assign': {
    dependencies: ['Role options rowset — often from domain context or static JSON.'],
    assumptions: ['Confirms access after Person Invite; pairs with Role Gate on sensitive pages.'],
  },
  'infra.env': {
    dependencies: ['Referenced by database and server infra nodes during export.'],
  },
  'infra.postgresql': {
    dependencies: ['Environment Config (connection env key)', 'pg driver in generated export'],
    assumptions: [parityStackGuideParagraph()],
  },
  'infra.mongodb': {
    dependencies: ['Environment Config (connection env key)', 'mongodb driver in generated export'],
    assumptions: [parityStackGuideParagraph()],
  },
  'infra.supabase': {
    dependencies: ['Environment Config (URL + anon key env keys)', '@supabase/supabase-js in export'],
    assumptions: [parityStackGuideParagraph()],
  },
  'infra.mysql': {
    dependencies: ['Environment Config (connection env key)', 'mysql2 driver in generated export'],
    assumptions: [parityStackGuideParagraph()],
  },
  'infra.server.nest': {
    dependencies: ['Database infra node', 'NestJS scaffold in export wizard'],
    assumptions: [parityStackGuideParagraph()],
  },
  'infra.server.express': {
    dependencies: ['Database infra node', 'Express scaffold in export wizard'],
    assumptions: [parityStackGuideParagraph()],
  },
  'infra.server.next': {
    dependencies: ['Database infra node', 'Next.js API routes in export wizard'],
    assumptions: [parityStackGuideParagraph()],
  },
  'infra.server.nuxt': {
    dependencies: ['Database infra node', 'Nuxt server routes in export wizard'],
    assumptions: [parityStackGuideParagraph()],
  },
  'visual.news.results-table': {
    dependencies: ['News query/API rowset upstream of the table.'],
    assumptions: ['Headline row-select binds forward to Article Detail in the same composite.'],
  },
  'visual.news.article-detail': {
    dependencies: ['News Results selectedRow output.'],
  },
  'visual.news.search-box': {
    assumptions: ['Query and search event drive upstream news fetch in a full News Discovery composite.'],
  },
  'visual.display.3d-bar-chart': {
    dependencies: ['Three.js runtime (builder preview + exported host).'],
    assumptions: ['Rowset xField/yField map to bar positions and heights.'],
  },
  'visual.display.3d-scatter': {
    dependencies: ['Three.js runtime (builder preview + exported host).'],
    assumptions: [
      'Rowset provides x, y, and z numeric fields per inspector mapping (e.g. price, distance, rating).',
    ],
  },
  'visual.display.3d-scene': {
    dependencies: ['Three.js runtime (builder preview + exported host).'],
  },
  'visual.display.gltf-model': {
    dependencies: ['Three.js runtime', 'Accessible GLTF/GLB URL for the model asset.'],
  },
  'visual.display.3d-gltf-model': {
    dependencies: ['Three.js runtime', 'Accessible GLTF/GLB URL for the model asset.'],
  },
  'visual.display.geo-globe': {
    dependencies: ['Three.js runtime', 'Globe texture URL (e.g. equirectangular earth map).'],
    assumptions: ['Markers bind from rowset lat/lng fields.'],
  },
  'visual.display.3d-geo-globe': {
    dependencies: ['Three.js runtime', 'Globe texture URL (e.g. equirectangular earth map).'],
    assumptions: ['Markers bind from rowset lat/lng fields per latField/lngField inspector keys.'],
  },
  'visual.display.geo-map': {
    dependencies: [
      'Provider library: leaflet (default), maplibre-gl, or @googlemaps/js-api-loader + Maps JavaScript API key.',
      'Tile URL and/or API key depending on provider — see Destination Atlas provider matrix.',
    ],
    assumptions: [
      'Props: provider, tile-url, api-key, center, zoom, markers (JSON rowset), selected-id.',
      'Emits marker-select with { id, lat, lng }.',
      'maplibre — OSS vector UX; tiles often need MapTiler or similar key.',
      'leaflet — lightweight raster-first; OSM tiles have usage limits.',
      'google-maps — paid after free tier; Google branding and ToS apply.',
    ],
  },
  'visual.svg.inline': {
    assumptions: ['Markup, remote URL, or asset path must resolve in the host app.'],
  },
  'visual.svg.icon': {
    assumptions: ['Optional row binding can drive dynamic icon color via colorField.'],
  },
  'visual.media.video-source': {
    dependencies: ['@rosettadash/web-components (`<rd-video-source>`) when shipped to npm consumers.'],
    assumptions: ['Expects equirectangular (2:1) or flat video; emits metadata for downstream crop.'],
  },
  'visual.media.youtube-embed': {
    dependencies: ['YouTube embed availability; subject to Google Terms of Service and advertising/branding rules.'],
    assumptions: [
      'Use `video-id` or parseable YouTube URL; privacy-enhanced nocookie host by default.',
      'No offline playback — use Video Source for owned media files.',
    ],
  },
  'visual.media.equirect-viewport': {
    dependencies: ['@rosettadash/web-components (`<rd-equirect-viewport>`)', 'Video Source metadata input.'],
    assumptions: ['Defines crop/framing on a 2:1 frame — not a 3D renderer; host app owns WebGL preview.'],
  },
  'visual.media.equirect-sphere-viewport': {
    dependencies: [
      '@rosettadash/web-components (`<rd-equirect-sphere-viewport>`)',
      'Video Source or bound video-src for texture',
    ],
    assumptions: [
      'Interior Three.js sphere with orbit + Shift+drag export rectangle; emits camera-change and output-size events.',
    ],
  },
  'visual.media.flat-video-viewport': {
    dependencies: [
      '@rosettadash/web-components (`<rd-flat-video-viewport>`)',
      'Video Source or bound video-src',
    ],
    assumptions: ['Draggable crop rectangle on flat video with output mirror canvas; emits crop-change events.'],
  },
  'visual.media.live-capture': {
    dependencies: ['Browser getUserMedia APIs', 'HTTPS or localhost in production hosts.'],
    assumptions: ['Authoring-only unless includeInExport is enabled.'],
  },
  'infra.wasm.asset': {
    dependencies: ['.wasm binary + glue JavaScript paths in content library.'],
    assumptions: ['Not rendered — declares module references for worker/module nodes.'],
  },
  'visual.wasm.worker-host': {
    dependencies: ['WASM Asset assetRef input', 'Dedicated worker script URL.'],
  },
  'visual.wasm.module': {
    dependencies: ['WASM Asset assetRef input'],
    assumptions: ['Invokes named WASM export (default run) with optional payload binding.'],
  },
  'visual.wasm.media': {
    dependencies: [
      '@rosettadash/web-components (`<rd-wasm-media>`)',
      'Optional peer packages @ffmpeg/ffmpeg and @ffmpeg/util for browser transcode',
      'Video Source or crop-region from Equirect Viewport for equirect-extract',
    ],
    assumptions: ['ffmpeg.wasm runs client-side; large files may need worker tuning.'],
  },
};

function inferInfraAssumption(definition: ComponentDefinition): string | undefined {
  if (definition.category === 'infra' && !definition.isVisual) {
    return 'Not rendered in operator UI — configures export and stack generation only.';
  }
  return undefined;
}

function formatPort(port: PortDefinition): string {
  const required = port.required ? ' <span class="rd-spec-required">required</span>' : '';
  const desc = port.description ? `<span class="rd-spec-desc">${port.description}</span>` : '';
  return `<li><code>${port.name}</code> <span class="rd-spec-type">${port.dataType}</span>${required}${desc}</li>`;
}

function listSection(label: string, items: string[]): string {
  if (items.length === 0) {
    return '';
  }
  return `<div class="rd-spec-section"><span class="rd-spec-label">${label}</span><ul class="rd-spec-list">${items.map((item) => `<li>${item}</li>`).join('')}</ul></div>`;
}

/** Render inputs, outputs, dependencies, and assumptions for a palette component card. */
export function renderComponentSpecHtml(definition: ComponentDefinition): string {
  const extras = COMPONENT_CATALOG_EXTRAS[definition.type] ?? {};
  const assumptions = [...(extras.assumptions ?? [])];
  const infraAssumption = inferInfraAssumption(definition);
  if (infraAssumption && !assumptions.includes(infraAssumption)) {
    assumptions.unshift(infraAssumption);
  }

  const sections: string[] = [];

  if (definition.inputs.length > 0) {
    sections.push(
      `<div class="rd-spec-section"><span class="rd-spec-label">Inputs</span><ul class="rd-spec-list rd-spec-list--ports">${definition.inputs.map(formatPort).join('')}</ul></div>`,
    );
  }

  if (definition.outputs.length > 0) {
    sections.push(
      `<div class="rd-spec-section"><span class="rd-spec-label">Outputs</span><ul class="rd-spec-list rd-spec-list--ports">${definition.outputs.map(formatPort).join('')}</ul></div>`,
    );
  }

  const depsSection = listSection('Dependencies', extras.dependencies ?? []);
  if (depsSection) {
    sections.push(depsSection);
  }

  const assumSection = listSection('Assumptions', assumptions);
  if (assumSection) {
    sections.push(assumSection);
  }

  if (sections.length === 0) {
    return '';
  }

  return `<div class="rd-catalog-item__spec">${sections.join('')}</div>`;
}

export function getComponentCatalogExtras(type: string): ComponentCatalogExtras {
  return COMPONENT_CATALOG_EXTRAS[type] ?? {};
}

export function getComponentCatalogAssumptions(
  type: string,
  definition: { category: string; isVisual: boolean },
): string[] {
  const extras = getComponentCatalogExtras(type);
  const assumptions = [...(extras.assumptions ?? [])];
  if (definition.category === 'infra' && !definition.isVisual) {
    const line = 'Not rendered in operator UI — configures export and stack generation only.';
    if (!assumptions.includes(line)) {
      assumptions.unshift(line);
    }
  }
  return assumptions;
}
