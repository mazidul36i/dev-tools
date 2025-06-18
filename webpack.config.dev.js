const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    liveReload: true,
    hot: true,
    open: true,
    static: ['./'],
    historyApiFallback: {
      rewrites: [
        // Handle specific tool routes
        { from: /^\/tools\/url-parser/, to: '/tools/url-parser/index.html' },
        // Handle all other routes - serve 404.html
        { from: /./, to: '/404.html' }
      ]
    }
  },
});
