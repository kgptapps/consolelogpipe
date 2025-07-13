const path = require('path');

module.exports = {
  // Common webpack configuration for all packages
  
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, '../../../src'),
      '@shared': path.resolve(__dirname, '../../../packages/shared'),
      '@tests': path.resolve(__dirname, '../../../tests')
    }
  },

  module: {
    rules: [
      {
        test: /\.(ts|tsx|js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', { targets: { node: 'current' } }],
              '@babel/preset-typescript'
            ]
          }
        }
      },
      {
        test: /\.json$/,
        type: 'json'
      }
    ]
  },

  externals: {
    // Don't bundle Node.js modules
    'fs': 'commonjs fs',
    'path': 'commonjs path',
    'os': 'commonjs os',
    'crypto': 'commonjs crypto',
    'http': 'commonjs http',
    'https': 'commonjs https',
    'url': 'commonjs url',
    'util': 'commonjs util',
    'stream': 'commonjs stream',
    'events': 'commonjs events',
    'child_process': 'commonjs child_process'
  },

  stats: {
    colors: true,
    modules: false,
    chunks: false,
    chunkModules: false
  },

  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000
  }
};
