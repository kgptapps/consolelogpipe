module.exports = {
  displayName: 'client',

  // Browser environment for client-side code
  testEnvironment: 'jsdom',

  // Setup files for browser mocking
  setupFilesAfterEnv: ['<rootDir>/tests/setup/browser.setup.js'],

  // Test files
  testMatch: ['<rootDir>/tests/**/*.(test|spec).(js|ts)'],

  // Coverage settings
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/**/*.config.{js,ts}',
    '!src/**/*.test.{js,ts}',
    '!src/**/*.spec.{js,ts}',
  ],

  // Coverage thresholds for client package
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },

  // Module mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
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
              targets: {
                browsers: ['last 2 versions', 'not dead', '> 1%'],
              },
            },
          ],
          '@babel/preset-typescript',
        ],
      },
    ],
  },

  // Browser globals
  globals: {
    window: {},
    document: {},
    navigator: {},
    console: {},
    fetch: {},
    XMLHttpRequest: {},
  },

  // Clear mocks between tests
  clearMocks: true,
  restoreMocks: true,
};
