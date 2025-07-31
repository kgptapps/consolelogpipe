import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';

const isProduction = process.env.NODE_ENV === 'production';

export default [
  // Browser UMD build
  {
    input: 'src/browser.js',
    output: {
      file: 'dist/storage-monitor.umd.js',
      format: 'umd',
      name: 'StorageMonitor',
      sourcemap: !isProduction,
      banner: `/**
 * Console Log Pipe Storage Monitor v2.5.0
 * Real-time browser storage and cookies monitoring
 * (c) 2025 Console Log Pipe Team
 * Released under the MIT License
 */`,
    },
    plugins: [
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                browsers: ['> 1%', 'last 2 versions', 'not ie <= 8'],
              },
            },
          ],
        ],
      }),
      isProduction &&
        terser({
          compress: {
            drop_console: false, // Keep console logs for debugging
            drop_debugger: true,
          },
          format: {
            comments: /^!/,
          },
        }),
    ].filter(Boolean),
  },

  // ES Module build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.esm.js',
      format: 'es',
      sourcemap: !isProduction,
    },
    plugins: [
      resolve({
        preferBuiltins: true,
      }),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                node: '14',
              },
              modules: false,
            },
          ],
        ],
      }),
      isProduction &&
        terser({
          compress: {
            drop_console: false,
            drop_debugger: true,
          },
        }),
    ].filter(Boolean),
    external: ['ws', 'events'],
  },

  // CommonJS build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: !isProduction,
      exports: 'named',
    },
    plugins: [
      resolve({
        preferBuiltins: true,
      }),
      commonjs(),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                node: '14',
              },
            },
          ],
        ],
      }),
      isProduction &&
        terser({
          compress: {
            drop_console: false,
            drop_debugger: true,
          },
        }),
    ].filter(Boolean),
    external: ['ws', 'events'],
  },
];
