import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import babel from '@rollup/plugin-babel';

const isProduction = process.env.NODE_ENV === 'production';

export default {
  input: 'src/ConsoleLogPipe.js',
  
  output: [
    // ES Module build
    {
      file: 'dist/index.esm.js',
      format: 'esm',
      sourcemap: true
    },
    // CommonJS build
    {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true,
      exports: 'default'
    },
    // UMD build for browsers
    {
      file: 'dist/index.umd.js',
      format: 'umd',
      name: 'ConsoleLogPipe',
      sourcemap: true,
      globals: {
        // Define globals for external dependencies if any
      }
    }
  ],

  plugins: [
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    
    commonjs(),
    
    typescript({
      tsconfig: './tsconfig.json',
      declaration: true,
      declarationDir: './types',
      rootDir: './src'
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
    
    // Minify in production
    isProduction && terser({
      compress: {
        drop_console: false, // Keep console for debugging
        drop_debugger: true,
        pure_funcs: ['console.debug']
      },
      mangle: {
        reserved: ['ConsoleLogPipe'] // Don't mangle main class name
      }
    })
  ].filter(Boolean),

  external: [
    // Don't bundle these - they should be provided by the environment
  ],

  treeshake: {
    moduleSideEffects: false
  }
};
