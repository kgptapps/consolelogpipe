const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'production',
  
  devtool: 'source-map',
  
  optimization: {
    minimize: true,
    sideEffects: false,
    usedExports: true
  },
  
  performance: {
    hints: 'error',
    maxEntrypointSize: 256000,
    maxAssetSize: 256000
  }
});
