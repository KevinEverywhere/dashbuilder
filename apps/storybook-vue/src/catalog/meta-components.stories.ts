import type { Meta, StoryObj } from '@storybook/vue3-vite';
import {
  META_COMPOSITIONS,
  mountMetaComposition,
  mountMetaCompositionCoverage,
} from '../../../../tools/storybook-shared/meta-compositions/mount-meta-composition.js';
import { metaCompositionStoryConfig } from '../../../../tools/storybook-shared/meta-compositions/meta-composition-story-config.ts';
import { mountFullStackNewsDemo } from '../../../../tools/storybook-shared/full-stack-news-demo.ts';
import { storybookAggregateStoryParameters } from '../../../../tools/storybook-shared/storybook-actions.ts';
import DomStoryHost from '../../../../tools/storybook-shared/dom-story-host.vue.ts';
import '../../../../tools/storybook-shared/meta-compositions/meta-composition-styles.css';
import '../../../../tools/storybook-shared/palette-catalog/palette-demo-styles.css';

const meta: Meta = {
  title: 'Catalog/Meta components',
  parameters: {
    docs: {
      description: {
        component:
          '**Live dashboard and recipe layouts** — use **Controls** to tune KPIs, charts, media framing, and filters in context.',
      },
    },
  },
};

export default meta;

type Story = StoryObj;

function domStory(mount: () => HTMLElement): Story {
  return {
    render: () => ({
      components: { DomStoryHost },
      setup: () => ({ mount }),
      template: '<DomStoryHost :mount="mount" />',
    }),
  };
}

function compositionStory(id: string): Story {
  const definition = META_COMPOSITIONS.find((entry) => entry.id === id);
  if (!definition) {
    throw new Error(`Unknown meta composition: ${id}`);
  }
  const config = metaCompositionStoryConfig(id);
  return {
    name: definition.title,
    args: config.args,
    argTypes: config.argTypes,
    render: (args) => ({
      components: { DomStoryHost },
      setup: () => ({
        mount: () =>
          mountMetaComposition(definition, args as Record<string, unknown>, config.demoOverrides),
      }),
      template: '<DomStoryHost :mount="mount" />',
    }),
    play: config.play,
    parameters: {
      docs: {
        description: {
          story: definition.summary,
        },
      },
    },
  };
}

export const OperationsKpiDashboard = compositionStory('operations-kpi');
export const AnalyticsReportingDashboard = compositionStory('analytics-reporting');
export const AdminSettingsDashboard = compositionStory('admin-settings');
export const NewsDiscoveryFlow = compositionStory('news-discovery');
export const MediaAuthoringPipeline = compositionStory('media-authoring');
export const WasmComputeLab = compositionStory('wasm-compute-lab');
export const Vr3dGallery = compositionStory('vr-3d-gallery');
export const DataPlatformPanel = compositionStory('data-platform');
export const NavigationLayoutShell = compositionStory('navigation-shell');

export const FullStackNewsLive: Story = {
  name: 'Full-stack news (live API)',
  ...domStory(() => mountFullStackNewsDemo({ destinationId: 'tokyo' })),
};

export const ComponentCoverageAudit: Story = {
  name: 'Component coverage audit',
  ...domStory(() => mountMetaCompositionCoverage()),
  parameters: {
    ...storybookAggregateStoryParameters,
  },
};
