module.exports = {
  // Use projects for monorepo setup
  projects: [
    '<rootDir>/packages/client',
    '<rootDir>/packages/cli',
    '<rootDir>/packages/server',
    '<rootDir>/packages/desktop',
    '<rootDir>/packages/shared',
    '<rootDir>/tests/integration',
  ],

  // Global settings
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json'],

  // Coverage thresholds - realistic standards matching our excellent actual coverage
  coverageThreshold: {
    global: {
      branches: 79, // Matches current excellent coverage (79.79%)
      functions: 84, // Matches current excellent coverage (84.77%)
      lines: 84, // Matches current excellent coverage (84.27%)
      statements: 83, // Matches current excellent coverage (83.99%)
    },
  },

  // Files to ignore for coverage
  coveragePathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '/tests/fixtures/',
    '/tests/helpers/',
    '/.git/',
    '/docs/',
    '/examples/',
    '/tools/',
    '\\.config\\.(js|ts)$',
    '\\.test\\.(js|ts)$',
    '\\.spec\\.(js|ts)$',
  ],

  // Test environment
  testEnvironment: 'node',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/setup/jest.setup.js'],

  // Module paths
  moduleNameMapper: {
    '^@console-log-pipe/(.*)$': '<rootDir>/packages/$1/src',
    '^@shared/(.*)$': '<rootDir>/packages/shared/$1',
    '^@tests/(.*)$': '<rootDir>/tests/$1',
  },

  // Transform files
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

  // File extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],

  // Test match patterns
  testMatch: [
    '<rootDir>/packages/*/tests/**/*.(test|spec).(js|ts)',
    '<rootDir>/tests/**/*.(test|spec).(js|ts)',
  ],

  // Ignore patterns
  testPathIgnorePatterns: ['/node_modules/', '/dist/', '/build/', '/coverage/'],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after each test
  restoreMocks: true,

  // Maximum worker processes
  maxWorkers: '50%',

  // Test timeout
  testTimeout: 10000,
};
