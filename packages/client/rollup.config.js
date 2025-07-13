/**
 * Rollup configuration for Console Log Pipe Client Library
 */

import { defineConfig } from 'rollup';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { babel } from '@rollup/plugin-babel';
import terser from '@rollup/plugin-terser';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const isProduction = process.env.NODE_ENV === 'production';

export default defineConfig([
  // UMD build for browsers
  {
    input: 'src/index.js',
    output: {
      file: 'dist/console-log-pipe.umd.js',
      format: 'umd',
      name: 'ConsoleLogPipe',
      sourcemap: !isProduction,
      banner: `/**
 * Console Log Pipe Client Library v${pkg.version}
 * ${pkg.description}
 * ${pkg.homepage}
 * 
 * Copyright (c) ${new Date().getFullYear()} ${pkg.author}
 * Licensed under ${pkg.license}
 */`,
    },
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: false,
      }),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                browsers: ['> 1%', 'last 2 versions', 'not dead'],
              },
              modules: false,
            },
          ],
        ],
      }),
      ...(isProduction ? [terser()] : []),
    ],
    external: [],
  },

  // ES Module build
  {
    input: 'src/index.js',
    output: {
      file: 'dist/console-log-pipe.esm.js',
      format: 'es',
      sourcemap: !isProduction,
      banner: `/**
 * Console Log Pipe Client Library v${pkg.version}
 * ${pkg.description}
 * ${pkg.homepage}
 * 
 * Copyright (c) ${new Date().getFullYear()} ${pkg.author}
 * Licensed under ${pkg.license}
 */`,
    },
    plugins: [
      nodeResolve({
        browser: true,
        preferBuiltins: false,
      }),
      babel({
        babelHelpers: 'bundled',
        exclude: 'node_modules/**',
        presets: [
          [
            '@babel/preset-env',
            {
              targets: {
                browsers: ['> 1%', 'last 2 versions', 'not dead'],
              },
              modules: false,
            },
          ],
        ],
      }),
      ...(isProduction ? [terser()] : []),
    ],
    external: [],
  },

  // CommonJS build for Node.js
  {
    input: 'src/index.js',
    output: {
      file: 'dist/console-log-pipe.cjs.js',
      format: 'cjs',
      sourcemap: !isProduction,
      exports: 'auto',
      banner: `/**
 * Console Log Pipe Client Library v${pkg.version}
 * ${pkg.description}
 * ${pkg.homepage}
 * 
 * Copyright (c) ${new Date().getFullYear()} ${pkg.author}
 * Licensed under ${pkg.license}
 */`,
    },
    plugins: [
      nodeResolve({
        preferBuiltins: true,
      }),
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
      ...(isProduction ? [terser()] : []),
    ],
    external: [],
  },
]);
