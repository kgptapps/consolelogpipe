module.exports = {
  displayName: 'integration',

  // Node environment for integration tests
  testEnvironment: 'node',

  // Test files
  testMatch: ['<rootDir>/**/*.(test|spec).(js|ts)'],

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/setup/integration.setup.js'],

  // Coverage settings (integration tests don't contribute to coverage)

  // Module mapping
  moduleNameMapper: {
    '^@console-log-pipe/(.*)$': '<rootDir>/../../packages/$1/src',
    '^@tests/(.*)$': '<rootDir>/../$1',
  },

  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      {
        presets: [
          ['@babel/preset-env', { targets: { node: 'current' } }],
          '@babel/preset-typescript',
        ],
      },
    ],
  },

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Run tests serially to avoid port conflicts
  maxWorkers: 1,
};
