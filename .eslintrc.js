module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
    jest: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['jest'],
  rules: {
    // General rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-template': 'error',

    // Jest rules
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error',
  },
  overrides: [
    {
      files: [
        '**/*.test.js',
        '**/*.test.ts',
        '**/*.spec.js',
        '**/*.spec.ts',
        '**/tests/**/*.js',
        '**/setup/**/*.js',
      ],
      env: {
        jest: true,
        node: true,
      },
      globals: {
        global: 'writable',
      },
      rules: {
        'no-console': 'off',
        'no-unused-vars': 'off',
        'no-undef': 'off',
      },
    },
    {
      files: ['**/*.config.js', '**/*.config.ts', '.eslintrc.js'],
      env: {
        node: true,
      },
      rules: {
        'no-undef': 'off',
      },
    },
    {
      files: ['packages/cli/**/*'],
      rules: {
        'no-console': 'off', // CLI tools need console output
      },
    },
    {
      files: ['packages/client/**/*'],
      env: {
        browser: true,
        node: false,
      },
      globals: {
        console: 'readonly',
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        fetch: 'readonly',
        XMLHttpRequest: 'readonly',
      },
    },
  ],
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.min.js',
    'packages/*/dist/',
    'packages/*/build/',
    'packages/*/types/',
    'tools/build/webpack/',
    'tools/build/rollup/',
  ],
};
