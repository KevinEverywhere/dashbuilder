import type { StorybookConfig } from '@storybook/react-vite';
import { rosettadashStorybookFeatures } from '../../../tools/storybook-shared/storybook-features.ts';
import { rosettadashStorybookStories } from '../../../tools/storybook-shared/storybook-main-config.ts';
import { rosettadashViteFinal } from '../../../tools/storybook-shared/vite-final.ts';

const config: StorybookConfig = {
  stories: [...rosettadashStorybookStories],
  addons: ['@storybook/addon-docs', '@storybook/addon-links'],
  framework: '@storybook/react-vite',
  features: rosettadashStorybookFeatures,
  async viteFinal(viteConfig) {
    return rosettadashViteFinal(viteConfig, { parityServerPort: 53103 });
  },
};

export default config;
