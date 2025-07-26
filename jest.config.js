module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Test file patterns
  testMatch: [
    '<rootDir>/packages/*/tests/**/*.(test|spec).(js|ts)',
    '<rootDir>/packages/*/**/__tests__/**/*.(test|spec).(js|ts)',
  ],

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/test-app/',
    '/tests/integration/',
    '/dist/',
    '/build/',
    'packages/client/tests/core/log/LogUtils.test.js',
    'packages/client/tests/core/LogCapture.test.js',
    'packages/cli/src/__tests__/StorageCommand.test.js',
  ],

  // Module name mapping
  moduleNameMapper: {
    '^@console-log-pipe/(.*)$': '<rootDir>/packages/$1/src',
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Transform configuration
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      {
        presets: [
          [
            '@babel/preset-env',
            {
              targets: { node: 'current' },
              modules: 'commonjs',
            },
          ],
          '@babel/preset-typescript',
        ],
      },
    ],
  },

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Coverage configuration
  collectCoverageFrom: [
    'packages/*/src/**/*.{js,ts}',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/**/*.test.{js,ts}',
    '!packages/*/src/**/*.spec.{js,ts}',
    '!packages/*/src/**/index.{js,ts}',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 65,
      functions: 65,
      lines: 65,
      statements: 65,
    },
  },

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,

  // Verbose output
  verbose: false,

  // Max workers for parallel execution
  maxWorkers: '50%',
};
