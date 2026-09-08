module.exports = {
  displayName: 'runtime-vue',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    '\\?raw$': '<rootDir>/../web-components/jest-raw-loader.cjs',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  setupFilesAfterEnv: ['<rootDir>/../web-components/jest-setup.cjs'],
  coverageDirectory: '../../coverage/packages/vue',
};
