const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const path = require("node:path");

module.exports = merge(common, {
  mode: 'production',
  // entry: "src",
  plugins: [
    new CopyPlugin({
      patterns: [
        {
          from: 'src/**/*.{html,css,js}', to: ({context, absoluteFilename}) => {
            return path.relative(context, absoluteFilename.replace("/src/", "/"));
          }
        },
        {
          from: 'src/*.{svg,png,ico,txt,webmanifest}', to: ({context, absoluteFilename}) => {
            return path.relative(context, absoluteFilename.replace("/src/", "/"));
          }
        },
        {
          from: 'src/img/**/*.*', to: ({context, absoluteFilename}) => {
            return path.relative(context, absoluteFilename.replace("/src/", "/"));
          }
        }
      ],
    }),
  ],
});
