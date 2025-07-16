/**
 * Rollup configuration for Console Log Pipe Client Library
 */

const { defineConfig } = require('rollup');
const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { babel } = require('@rollup/plugin-babel');
const commonjs = require('@rollup/plugin-commonjs');
const terser = require('@rollup/plugin-terser');
const json = require('@rollup/plugin-json');

const pkg = require('./package.json');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = defineConfig([
  // UMD build for browsers (readable for CDN usage)
  {
    input: 'src/browser.js',
    output: {
      file: 'dist/console-log-pipe.umd.js',
      format: 'umd',
      name: 'ConsoleLogPipe',
      sourcemap: true,
      indent: '  ',
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
      json({
        preferConst: true,
        compact: true,
        namedExports: false,
      }),
      nodeResolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs({
        include: ['src/**'],
        transformMixedEsModules: true,
      }),
      // No Babel for UMD to keep it readable
    ],
    external: [],
  },

  // ES Module build
  {
    input: 'src/browser.js',
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
      json(),
      nodeResolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs({
        include: ['src/**'],
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

  // CommonJS build for Node.js (use simple implementation)
  {
    input: 'src/browser.js',
    output: {
      file: 'dist/console-log-pipe.cjs.js',
      format: 'cjs',
      sourcemap: !isProduction,
      exports: 'default',
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
      json(),
      nodeResolve({
        preferBuiltins: true,
      }),
      commonjs({
        include: ['src/**'],
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
