import type { StorybookConfig } from '@storybook/angular-vite';
import { rosettadashStorybookFeatures } from '../../../tools/storybook-shared/storybook-features.ts';
import { rosettadashStorybookStories } from '../../../tools/storybook-shared/storybook-main-config.ts';
import { rosettadashViteFinal } from '../../../tools/storybook-shared/vite-final.ts';

const config: StorybookConfig = {
  stories: [...rosettadashStorybookStories],
  addons: ['@storybook/addon-docs', '@storybook/addon-links'],
  framework: {
    name: '@storybook/angular-vite',
    options: {
      compodoc: false,
    },
  },
  features: rosettadashStorybookFeatures,
  async viteFinal(viteConfig) {
    return rosettadashViteFinal(viteConfig, { parityServerPort: 53101 });
  },
};

export default config;
