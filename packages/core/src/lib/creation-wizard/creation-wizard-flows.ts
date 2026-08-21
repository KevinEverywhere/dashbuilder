import { findPaletteGroupIdForType } from '../palette/palette-groups';

export type CreationGoalId =
  | 'dashboard'
  | 'single-component'
  | 'filter-table-chart'
  | 'media-wasm'
  | 'explore';

export interface CreationWizardStep {
  id: string;
  title: string;
  description: string;
  /** Palette group to color-highlight during this step */
  highlightGroupId: string;
  /** Component types emphasized in the palette (subset of the group) */
  highlightTypes: string[];
  /** When set, wizard offers one-click add for this component type */
  suggestedType?: string;
  /** Step completes when canvas contains any of these types */
  completeWhenTypes: string[];
}

export interface CreationGoalDefinition {
  id: CreationGoalId;
  label: string;
  description: string;
  aiPromptHint: string;
  steps: CreationWizardStep[];
  /**
   * Optional starter template — for the Template picker only.
   * Guided creation never auto-applies this; users build piece by piece.
   */
  templateId?: string;
}

function step(
  partial: Omit<CreationWizardStep, 'highlightGroupId'> & { highlightGroupId?: string },
): CreationWizardStep {
  const primaryType = partial.suggestedType ?? partial.highlightTypes[0];
  const highlightGroupId =
    partial.highlightGroupId ??
    (primaryType ? findPaletteGroupIdForType(primaryType) : undefined) ??
    'form-inputs';

  return {
    highlightGroupId,
    ...partial,
  };
}

export const CREATION_GOAL_DEFINITIONS: CreationGoalDefinition[] = [
  {
    id: 'dashboard',
    label: 'Full dashboard',
    description: 'Filters, KPIs, tables, and charts wired together',
    aiPromptHint: 'Build a dashboard with a date filter, KPI cards, a data table, and a trend chart.',
    steps: [
      step({
        id: 'filter',
        title: 'Add a time or category filter',
        description:
          'Start with a Date Range or Select input at the top of your layout. Look for the blue Form Inputs group in the palette.',
        highlightTypes: ['visual.input.date-range', 'visual.input.select'],
        suggestedType: 'visual.input.date-range',
        completeWhenTypes: ['visual.input.date-range', 'visual.input.select', 'visual.input.text'],
      }),
      step({
        id: 'kpi',
        title: 'Add KPI cards',
        description: 'Place KPI cards below your filter to show headline metrics.',
        highlightTypes: ['visual.kpi'],
        suggestedType: 'visual.kpi',
        completeWhenTypes: ['visual.kpi'],
      }),
      step({
        id: 'table',
        title: 'Add a data table',
        description: 'Tables hold row-level detail and pair with filters and charts.',
        highlightTypes: ['visual.table'],
        suggestedType: 'visual.table',
        completeWhenTypes: ['visual.table'],
      }),
      step({
        id: 'chart',
        title: 'Add a chart',
        description: 'Finish with a line or bar chart bound to the same filter range.',
        highlightTypes: ['visual.chart.line', 'visual.chart.bar'],
        suggestedType: 'visual.chart.line',
        completeWhenTypes: ['visual.chart.line', 'visual.chart.bar', 'visual.chart.pie'],
      }),
    ],
  },
  {
    id: 'filter-table-chart',
    label: 'Filter → table → chart',
    description: 'Classic analytics slice: filter data, list rows, visualize trends',
    aiPromptHint: 'Add a date range filter, bind it to a table and a line chart.',
    steps: [
      step({
        id: 'filter',
        title: 'Add a filter',
        description: 'Use Date Range or Select from Form Inputs (blue).',
        highlightTypes: ['visual.input.date-range', 'visual.input.select'],
        suggestedType: 'visual.input.date-range',
        completeWhenTypes: ['visual.input.date-range', 'visual.input.select'],
      }),
      step({
        id: 'table',
        title: 'Add a table',
        description: 'Data Display (green) — bind table rows to your filter output.',
        highlightTypes: ['visual.table'],
        suggestedType: 'visual.table',
        completeWhenTypes: ['visual.table'],
      }),
      step({
        id: 'chart',
        title: 'Add a chart',
        description: 'Charts group (amber) — share the same date range binding.',
        highlightTypes: ['visual.chart.line', 'visual.chart.bar'],
        suggestedType: 'visual.chart.line',
        completeWhenTypes: ['visual.chart.line', 'visual.chart.bar'],
      }),
    ],
  },
  {
    id: 'single-component',
    label: 'One or two components',
    description: 'Implement a focused UI piece without a full dashboard',
    aiPromptHint: 'Help me add a single component and configure its properties.',
    steps: [
      step({
        id: 'pick',
        title: 'Pick a component category',
        description:
          'Choose any group in the palette — color bands show each category. Click + to add, then inspect properties on the right.',
        highlightGroupId: 'form-inputs',
        highlightTypes: [
          'visual.input.text',
          'visual.input.select',
          'visual.kpi',
          'visual.table',
          'layout.collapsible',
        ],
        completeWhenTypes: defaultCompletableVisualTypes(),
      }),
      step({
        id: 'companion',
        title: 'Add a companion (optional)',
        description:
          'Use the ⛓ button on a selected palette item to see typical companions, or add a Collapsible wrapper from Layout (cyan).',
        highlightGroupId: 'layout',
        highlightTypes: ['layout.collapsible', 'layout.flex'],
        suggestedType: 'layout.collapsible',
        completeWhenTypes: defaultCompletableVisualTypes(),
      }),
    ],
  },
  {
    id: 'media-wasm',
    label: 'Media / WASM pipeline',
    description: 'Video source, equirect viewport, and WASM media extract',
    aiPromptHint: 'Build a media pipeline with video upload, equirect viewport, and WASM equirect extract.',
    steps: [
      step({
        id: 'video',
        title: 'Add a video source',
        description: 'Media Authoring (sky blue) — upload an equirectangular video file.',
        highlightTypes: ['visual.media.video-source'],
        suggestedType: 'visual.media.video-source',
        completeWhenTypes: ['visual.media.video-source'],
      }),
      step({
        id: 'viewport',
        title: 'Add an equirect viewport',
        description: 'Preview flat crop and rectilinear views before extraction.',
        highlightTypes: ['visual.media.equirect-viewport'],
        suggestedType: 'visual.media.equirect-viewport',
        completeWhenTypes: ['visual.media.equirect-viewport'],
      }),
      step({
        id: 'wasm',
        title: 'Add WASM media extract',
        description:
          'WASM Compute (indigo) at the bottom of the palette — drag freely; the canvas extends to match.',
        highlightTypes: ['visual.wasm.media'],
        suggestedType: 'visual.wasm.media',
        completeWhenTypes: ['visual.wasm.media', 'infra.wasm.asset'],
      }),
    ],
  },
  {
    id: 'explore',
    label: 'Explore on my own',
    description: 'Skip guided steps — palette and builder guides remain available',
    aiPromptHint: 'I am exploring the builder — suggest components when I ask.',
    steps: [],
  },
];

function defaultCompletableVisualTypes(): string[] {
  return [
    'visual.input.text',
    'visual.input.select',
    'visual.input.date-range',
    'visual.kpi',
    'visual.table',
    'visual.chart.line',
    'layout.collapsible',
    'layout.flex',
    'visual.media.video-source',
    'visual.wasm.media',
  ];
}

export function getCreationGoal(goalId: CreationGoalId): CreationGoalDefinition {
  const goal = CREATION_GOAL_DEFINITIONS.find((entry) => entry.id === goalId);
  if (!goal) {
    throw new Error(`Unknown creation goal: ${goalId}`);
  }
  return goal;
}

export function listCreationGoals(): CreationGoalDefinition[] {
  return CREATION_GOAL_DEFINITIONS;
}
