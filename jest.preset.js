const path = require('node:path');

const nxPreset = require('@nx/jest/preset').default;

const webComponentsRoot = path.join(__dirname, 'packages/web-components');

module.exports = {
  ...nxPreset,
  moduleNameMapper: {
    ...(nxPreset.moduleNameMapper ?? {}),
    'rd-geo-map\\.shadow\\.js$': path.join(
      webComponentsRoot,
      'jest-geo-map-shadow.cjs',
    ),
  },
  transform: {
    ...(nxPreset.transform ?? {}),
    '\\?raw$': path.join(webComponentsRoot, 'jest-raw-loader.cjs'),
  },
};
