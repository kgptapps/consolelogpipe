module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation changes
        'style', // Code style changes (formatting, etc.)
        'refactor', // Code refactoring
        'perf', // Performance improvements
        'test', // Adding or updating tests
        'build', // Build system changes
        'ci', // CI/CD changes
        'chore', // Maintenance tasks
        'revert', // Reverting changes
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'client', // Browser client library
        'cli', // CLI tool
        'server', // Server package
        'desktop', // Desktop application
        'shared', // Shared utilities
        'extensions', // Browser extensions
        'docs', // Documentation
        'tests', // Test files
        'build', // Build configuration
        'deps', // Dependencies
        'release', // Release related
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never', '.'],
    'type-case': [2, 'always', 'lower-case'],
    'type-empty': [2, 'never'],
  },
};
