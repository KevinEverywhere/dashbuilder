module.exports = {
  displayName: 'web-components',
  preset: '../../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
    '\\?raw$': '<rootDir>/jest-raw-loader.cjs',
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  setupFilesAfterEnv: ['<rootDir>/jest-setup.cjs'],
  coverageDirectory: '../../coverage/packages/web-components',
};
