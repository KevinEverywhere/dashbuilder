/** Runtime ids for Destination Atlas proof apps — use to highlight the active row on About. */
export type DestinationAtlasRuntimeId =
  | 'web-components'
  | 'react'
  | 'angular'
  | 'vue'
  | 'svelte';

/** Column labels for the About runtime matrix (Package | Proof app | Storybook). */
export const DESTINATION_ATLAS_RUNTIME_MATRIX_COLUMNS = [
  { id: 'package', label: 'Package' },
  { id: 'proof', label: 'Proof app' },
  { id: 'storybook', label: 'Storybook' },
] as const;

/** Badge copy on the highlighted runtime row in each proof app's About page. */
export const DESTINATION_ATLAS_CURRENT_RUNTIME_BADGE = 'You are here';

/** Runtime catalog for Destination Atlas About page — proof apps and Storybook ports. */
export interface DestinationAtlasRuntimeGuide {
  id: DestinationAtlasRuntimeId;
  label: string;
  npmPackage: string;
  ticket: string;
  proofPath: string;
  proofCommand: string;
  proofPort: number;
  storybookCommand: string;
  storybookPort: number;
  summary: string;
}

export const DESTINATION_ATLAS_RUNTIME_GUIDES: DestinationAtlasRuntimeGuide[] = [
  {
    id: 'web-components',
    label: 'Web Components (Custom Elements)',
    npmPackage: '@rosettadash/web-components',
    ticket: 'DAS-121',
    proofPath: 'apps/proof-web-components',
    proofCommand: 'npm run proof:web-components',
    proofPort: 4310,
    storybookCommand: 'npm run storybook:web-components',
    storybookPort: 6006,
    summary:
      'Shadow-DOM hosts and catalog elements. Map, Globe, Media, and Authoring stay native rd-* custom elements — `<rd-equirect-sphere-viewport>`, `<rd-flat-video-viewport>`, and `<rd-wasm-media>` on Authoring. No foreign mount. Use when exporting CE-first dashboards or embedding rd-* tags in any stack.',
  },
  {
    id: 'react',
    label: 'React',
    npmPackage: '@rosettadash/react',
    ticket: 'DAS-122',
    proofPath: 'apps/proof-react',
    proofCommand: 'npm run proof:react',
    proofPort: 4311,
    storybookCommand: 'npm run storybook:react',
    storybookPort: 6007,
    summary:
      'Native React wrappers with forwardRef hosts. This app is the reference UX for Destination Atlas — copy patterns into your React dashboard.',
  },
  {
    id: 'angular',
    label: 'Angular',
    npmPackage: '@rosettadash/angular',
    ticket: 'DAS-123',
    proofPath: 'apps/proof-angular',
    proofCommand: 'nx serve proof-angular',
    proofPort: 4312,
    storybookCommand: 'npm run storybook:angular',
    storybookPort: 6009,
    summary:
      'Standalone Angular components mirroring the React proof screens. Import from @rosettadash/angular subpaths per component.',
  },
  {
    id: 'vue',
    label: 'Vue',
    npmPackage: '@rosettadash/vue',
    ticket: 'DAS-124',
    proofPath: 'apps/proof-vue',
    proofCommand: 'nx serve proof-vue',
    proofPort: 4313,
    storybookCommand: 'npm run storybook:vue',
    storybookPort: 6008,
    summary:
      'Vue 3 SFC wrappers with the same Destination Atlas navigation and mock data as the React reference app — native Authoring with EquirectSphereViewport and FlatVideoViewport (DAS-157, DAS-179).',
  },
  {
    id: 'svelte',
    label: 'Svelte',
    npmPackage: '@rosettadash/svelte',
    ticket: 'DAS-125',
    proofPath: 'apps/proof-svelte',
    proofCommand: 'nx serve proof-svelte',
    proofPort: 4314,
    storybookCommand: 'npm run storybook:svelte',
    storybookPort: 6010,
    summary:
      'Svelte 5 Destination Atlas — native Authoring (DAS-179) plus three cross-framework hosts: Vue globe, Angular YouTube embed, and rd-geo-map custom element (DAS-158).',
  },
];

export const DESTINATION_ATLAS_ABOUT_INTRO = {
  title: 'Why Destination Atlas?',
  lead:
    'Destination Atlas is a functional demo — not a component kitchen sink. Each screen exercises real RosettaDash components the way you would wire them in production: filters bound to tables, maps with provider choice, role gates, and media embeds.',
  proofPurpose:
    'The five proof apps (Web Components + four frameworks) share a 30-city mock library from libs/destination-atlas and identical screen names. Compare runtime imports side-by-side, then open Storybook on the matching port to inspect components in isolation.',
  consumerInstall:
    'Install @rosettadash/core and the runtime package you need (@rosettadash/react, /angular, /vue, /svelte, or /web-components). See docs/39-npm-consumer-install.md for tarball and registry workflows.',
  runtimeCardsNote:
    'The Web Components, React, Angular, Vue, and Svelte blocks below are not RosettaDash palette components — they are npm runtime packages (delivery targets). Each card is proof-app documentation UI: plain layout markup styled for this About page. The actual reusable components live inside those packages (KpiCard, GeoMap, ScrollRegion, etc.) and appear on the other tabs and in Storybook.',
  componentSourceTitle: 'Component source panel',
  componentSourceBody:
    'Every screen, including About, shows a workbench with two panes. On the right, the Component source panel lists the JSX or SFC markup for the active tab: screen component, imported RosettaDash wrappers, prop names, and nesting. Use it to copy composition patterns into your app. On narrow viewports, switch between Atlas preview and Component source with the toggle above the panes. About is the only tab without a source pane — you are reading the onboarding copy instead.',
};

/** Intentional cross-framework composition demos in proof apps. */
export interface DestinationAtlasCrossFrameworkShowcase {
  id: string;
  hostRuntime: string;
  hostTicket: string;
  embeddedRuntime: string;
  screen: string;
  feature: string;
  bridge: string;
  summary: string;
  planned?: boolean;
}

export const DESTINATION_ATLAS_CROSS_FRAMEWORK_SHOWCASES: DestinationAtlasCrossFrameworkShowcase[] = [
  {
    id: 'svelte-globe-vue',
    hostRuntime: 'Svelte',
    hostTicket: 'DAS-158',
    embeddedRuntime: 'Vue',
    screen: 'Globe',
    feature: 'Three.js geo globe + destination markers',
    bridge: 'VueMount.svelte → createApp(@rosettadash/vue ThreeGeoGlobe)',
    summary:
      'Globe mounts the Vue ThreeGeoGlobe wrapper around rd-three-geo-globe. Marker select stays bound to the same destination as Map and Settings.',
  },
  {
    id: 'svelte-media-angular',
    hostRuntime: 'Svelte',
    hostTicket: 'DAS-158',
    embeddedRuntime: 'Angular',
    screen: 'Media',
    feature: 'YouTube destination embed',
    bridge: 'AngularMount.svelte → createComponent(YoutubeEmbed) on rd-youtube-embed',
    summary:
      'Flat Media video is @rosettadash/angular YoutubeEmbed bootstrapped from Svelte onto the rd-youtube-embed host element.',
  },
  {
    id: 'svelte-map-custom-element',
    hostRuntime: 'Svelte',
    hostTicket: 'DAS-158',
    embeddedRuntime: 'Custom element',
    screen: 'Map',
    feature: '2D geo map + destination selection',
    bridge: 'svelte:element → <rd-geo-map> (registerRdGeoMap)',
    summary:
      'Map uses the web-components GeoMap custom element directly. selected-id and marker-select stay in lockstep with the destination list and Settings Selected.',
  },
];
