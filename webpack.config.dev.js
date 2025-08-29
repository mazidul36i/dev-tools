const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    liveReload: true,
    hot: true,
    open: true,
    static: ['./src/'],
    historyApiFallback: {
      rewrites: [
        // Handle specific tool routes
        { from: /^\/tools\/url-parser/, to: '/tools/url-parser/index.html' },
        { from: /^\/tools\/json-formatter/, to: '/tools/json-formatter/index.html' },
        { from: /^\/tools\/color-picker/, to: '/tools/color-picker/index.html' },
        { from: /^\/tools\/encoder-decoder/, to: '/tools/encoder-decoder/index.html' },
        { from: /^\/tools\/image-to-text/, to: '/tools/image-to-text/index.html' },

        // Handle all other routes - serve 404.html
        { from: /./, to: '/404.html' }
      ]
    }
  },
});
