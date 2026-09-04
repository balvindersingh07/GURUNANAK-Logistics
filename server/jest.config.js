export default {
  testEnvironment: 'node',
  transform: {},
  setupFiles: ['<rootDir>/tests/setup.js'],
  setupFilesAfterEnv: ['<rootDir>/tests/setupAfterEnv.js'],
  globalTeardown: '<rootDir>/tests/globalTeardown.js',
  testMatch: ['**/tests/**/*.test.js'],
  testTimeout: 30000,
  maxWorkers: 1,
};
