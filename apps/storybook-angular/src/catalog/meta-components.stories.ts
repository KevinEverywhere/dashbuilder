import type { Meta, StoryObj } from '@storybook/angular-vite';
import {
  META_COMPOSITIONS,
  mountMetaComposition,
  mountMetaCompositionCoverage,
} from '../../../../tools/storybook-shared/meta-compositions/mount-meta-composition.js';
import { metaCompositionStoryConfig } from '../../../../tools/storybook-shared/meta-compositions/meta-composition-story-config.ts';
import { mountFullStackOrdersDemo } from '../../../../tools/storybook-shared/full-stack-orders-demo.ts';
import { mountFullStackNewsDemo } from '../../../../tools/storybook-shared/full-stack-news-demo.ts';
import { storybookAggregateStoryParameters } from '../../../../tools/storybook-shared/storybook-actions.ts';
import { DomStoryHostComponent } from '../../../../tools/storybook-shared/dom-story-host.component.ts';
import '../../../../tools/storybook-shared/meta-compositions/meta-composition-styles.css';
import '../../../../tools/storybook-shared/palette-catalog/palette-demo-styles.css';

const meta: Meta = {
  title: 'Catalog/Meta components',
};

export default meta;

type Story = StoryObj;

function domStory(mount: () => HTMLElement): Story {
  return {
    render: () => ({
      moduleMetadata: { imports: [DomStoryHostComponent] },
      props: { mount },
      template: '<rd-dom-story-host [mount]="mount" />',
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
      moduleMetadata: { imports: [DomStoryHostComponent] },
      props: {
        mount: () =>
          mountMetaComposition(definition, args as Record<string, unknown>, config.demoOverrides),
      },
      template: '<rd-dom-story-host [mount]="mount" />',
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

export const FullStackOrdersLive: Story = {
  name: 'Full-stack orders (live API)',
  ...domStory(() => mountFullStackOrdersDemo({ runtime: 'angular' })),
  parameters: {
    docs: {
      description: {
        story:
          'Live UI → NestJS parity server (:53101) → seeded PostgreSQL orders. Start the stack with parity:db:up and parity:servers:up.',
      },
    },
  },
};

export const FullStackNewsLive: Story = {
  name: 'Full-stack news (live API)',
  ...domStory(() => mountFullStackNewsDemo({ destinationId: 'tokyo' })),
  parameters: {
    docs: {
      description: {
        story:
          'Live news discovery → builder GET /api/news → Google News RSS ingest (~24h cache). Start with npm run storybook:angular:live.',
      },
    },
  },
};

export const ComponentCoverageAudit: Story = {
  name: 'Component coverage audit',
  ...domStory(() => mountMetaCompositionCoverage()),
  parameters: {
    ...storybookAggregateStoryParameters,
  },
};
