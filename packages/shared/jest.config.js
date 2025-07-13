module.exports = {
  displayName: 'shared',

  // Node environment for shared utilities
  testEnvironment: 'node',

  // Test files
  testMatch: [
    '<rootDir>/tests/**/*.(test|spec).(js|ts)',
    '<rootDir>/**/*.test.(js|ts)',
    '<rootDir>/**/*.spec.(js|ts)',
  ],

  // Coverage settings
  collectCoverageFrom: [
    'constants/**/*.{js,ts}',
    'utils/**/*.{js,ts}',
    'protocols/**/*.{js,ts}',
    'types/**/*.{js,ts}',
    'index.js',
    '!**/*.d.ts',
    '!**/*.config.{js,ts}',
    '!**/*.test.{js,ts}',
    '!**/*.spec.{js,ts}',
  ],

  // Coverage thresholds
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
    '^@/(.*)$': '<rootDir>/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
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
};
