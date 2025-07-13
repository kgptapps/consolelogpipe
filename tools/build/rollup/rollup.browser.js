import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  input: 'src/ConsoleLogPipe.js',
  
  output: {
    file: isProduction ? 'dist/console-log-pipe.min.js' : 'dist/console-log-pipe.js',
    format: 'iife',
    name: 'ConsoleLogPipe',
    sourcemap: true,
    banner: `/*! Console Log Pipe v${process.env.npm_package_version || '1.0.0'} | MIT License */`
  },

  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    
    commonjs(),
    
    typescript({
      tsconfig: './tsconfig.json'
    }),
    
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**',
      presets: [
        ['@babel/preset-env', {
          targets: {
            browsers: ['last 2 versions', 'not dead', '> 1%']
          }
        }],
        '@babel/preset-typescript'
      ]
    }),
    
    // Always minify browser builds
    terser({
      compress: {
        drop_console: false, // Keep console for debugging
        drop_debugger: true,
        pure_funcs: ['console.debug']
      },
      mangle: {
        reserved: ['ConsoleLogPipe'] // Don't mangle main class name
      },
      format: {
        comments: /^!/
      }
    })
  ],

  treeshake: {
    moduleSideEffects: false
  }
};
