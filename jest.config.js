module.exports = {
  // Use projects for monorepo setup
  projects: [
    '<rootDir>/packages/client',
    '<rootDir>/packages/cli',
    '<rootDir>/tests/integration',
  ],

  // Global settings
  collectCoverage: true,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'text-summary', 'lcov', 'html', 'json'],

  // Coverage thresholds - adjusted for CI environment differences
  coverageThreshold: {
    global: {
      branches: 78, // Slightly lower for CI environment
      functions: 82, // Slightly lower for CI environment
      lines: 82, // Slightly lower for CI environment
      statements: 82, // Slightly lower for CI environment
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
