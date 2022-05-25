const normalize = require('postcss-normalize-url');
const postCssUrl = require("postcss-url");
const path = require('path');

module.exports = {
  extract: true,
    plugins: [
      // extracts all url() assets into _assets folder, and replaces the url() to a relative path
      // consumers of this package (e.g. webpack apps) will import the css and handle getting assets as well
      postCssUrl({
        url: 'copy',
        // base path to search assets from
        basePath: path.resolve('node_modules/'),
        // dir to copy assets
        assetsPath: 'img',
        // using hash names for assets (generates from asset content)
        useHash: true
      })
    ],
}