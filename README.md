rollup-prepublish
====

A Rollup-based CLI with some handy defaults, useful as a prepublish script for library authors.

What it does:

- [rollup-plugin-node-resolve-auto](https://github.com/nolanlawson/rollup-plugin-node-resolve-auto) to automatically include third-party ES6 modules (but ignore third-party CommonJS modules)
- [rollup-plugin-json](https://github.com/rollup/rollup-plugin-json) to automatically include `.json` dependencies

The goal is to take your first-party _and_ third-party ES6 modules and bundle them into a very trim CommonJS file, suitable
to be exported to CommonJS users.

Install
---

    npm install -g rollup-prepublish

Usage
----

    rollup-prepublish index.js > bundle.js
    rollup-prepublish --browser index.js > bundle-browser.js

In `--browser` mode, Rollup will use the `"browser"` field if it's available to serve up the "browser" version of the module. You may
need to do this if any of your dependencies are using `"browser"`.

You can pass in the input file and output file as the first and second arguments, or else it will assume CWD for the first
(locating the main `index.js` as necessary) and stdout for the second.

### Example prepublish script:

```js
// package.json
{
  /* ... */
  "scripts": {
    "prepublish": "rollup-prepublish > lib/index.js && rollup-prepublish --browser > lib/browser.js"
  },
  "main": {
    "lib/index.js"
  },
  "browser": {
    "lib/index.js": "lib/browser.js"
  }
  /* ... */
}
```

With the above configuration, CommonJS consumers will get:

- `lib/index.js` if they are using Node, and
- `lib/browser.js` if they are using Webpack, Browserify, etc.

Also, Rollup consumers will get `src/index.js` (assuming that's your ES6 source).

### Tips

Since third-party ES6 modules are bundled by default, you can include them in your `devDependencies` instead of
regular `dependencies`. (No reason to ship them to consumers, which unnecessarily increases `npm install` time!)
On the other hand, note that this will prevent de-duplication of shared modules.

Also, if you have any `"browser"` code in your ES6 source, you should add those to `"browser"` as well:

```js
{
  "browser": {
    "lib/index.js": "lib/browser.js",
    "src/somefile.js": "src/somefile-browser.js"
  }
}
```

You should also be sure to add a `"jsnext:main"` or `"module"` to your own `package.json`, so that consumers of your library
can use `rollup-prepublish` script and get the same benefits.

```js
{
  "module": {
    "src/index.js"
  }
}
```

JavaScript API
----

There's also a straight-up JavaScript API:

```js
var rollupPrepublish = require('rollup-prepublish');
rollupPrepublish({
  entry: 'index.js',
  dest: 'bundle.js',
  browser: true // false by default
}).then(function (code) {
  // if you don't specify a `dest`, then the code will be returned here
  // as a string
  console.log('code: ', code)
}).catch(function (err) {
  console.error(err)
})
```