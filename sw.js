/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-cafb5428'], (function (workbox) { 'use strict';

  /**
  * Welcome to your Workbox-powered service worker!
  *
  * You'll need to register this file in your web app.
  * See https://goo.gl/nhQhGp
  *
  * The rest of the code is auto-generated. Please don't update this file
  * directly; instead, make changes to your Workbox build configuration
  * and re-run your build process.
  * See https://goo.gl/2aRDsh
  */

  self.skipWaiting();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */

  workbox.precacheAndRoute([{
    "url": "build/bundle.css",
    "revision": "b7567a691ba94e7cc461ede4999b8eab"
  }, {
    "url": "build/main.js",
    "revision": "d6cf69c07fdabbfc3dc431743c404912"
  }, {
    "url": "favicon.png",
    "revision": "c64beab291de80970aa4887a5a1c9135"
  }, {
    "url": "fonts/Framework7Icons-Regular.ttf",
    "revision": "779ca33542ec8c51cfe0cf3b879e9613"
  }, {
    "url": "fonts/Framework7Icons-Regular.woff",
    "revision": "d03b787b6492fa2b0141c43fb7e56689"
  }, {
    "url": "fonts/Framework7Icons-Regular.woff2",
    "revision": "4a39aba9fb8a2f831fa437780e1a058a"
  }, {
    "url": "global.css",
    "revision": "16364ffe1e5250c3c76cb79eda874195"
  }, {
    "url": "images/icons/icon-128x128.png",
    "revision": "a9467e01473c6fac0544269bc6dc09f3"
  }, {
    "url": "images/icons/icon-144x144.png",
    "revision": "5c863da2881747be530e6432e727eba0"
  }, {
    "url": "images/icons/icon-152x152.png",
    "revision": "1c92fd424421cf3d2bc42a7487e4a811"
  }, {
    "url": "images/icons/icon-192x192.png",
    "revision": "71490a7396ea496db30f6490e5bd38a4"
  }, {
    "url": "images/icons/icon-384x384.png",
    "revision": "2034a4a991be20456cfbafe8c12988c8"
  }, {
    "url": "images/icons/icon-512x512.png",
    "revision": "a5c7063b1d6bf35684c659d9f804ecbe"
  }, {
    "url": "images/icons/icon-72x72.png",
    "revision": "653ffcba4f05f1783b842ba444dbe50a"
  }, {
    "url": "images/icons/icon-96x96.png",
    "revision": "a88ce7befd73fdd7a7a2d393c818c77d"
  }, {
    "url": "index.html",
    "revision": "058ec8a0c5b0a56b2958cbc8edab4b52"
  }], {
    "ignoreURLParametersMatching": [/^utm_/, /^fbclid$/]
  });

}));
//# sourceMappingURL=sw.js.map
