#!/usr/bin/env node

require('lie/polyfill')
var rollup = require('rollup')
var nodeResolveAuto = require('rollup-plugin-node-resolve-auto')
var json = require('rollup-plugin-json')
var fs = require('fs')
var denodeify = require('denodeify')
var stat = denodeify(fs.stat)
var readFile = denodeify(fs.readFile)
var writeFile = denodeify(fs.writeFile)
var path = require('path')
var findRequires = require('find-requires')

function noop () {
}

var resolved = Promise.resolve()

module.exports = function rollupPrepublish (opts) {
  var inputFile = opts.entry
  var outputFile = opts.dest
  var browser = opts.browser
  var quiet = opts.quiet
  var fixDependencies = opts.fixDependencies

  return resolved.then(function () {
    return stat(inputFile)
  }).then(function (stats) {
    if (stats.isDirectory()) {
      return readFile(path.join(inputFile, 'package.json'), 'utf8').then(function (pkgJson) {
        var pkg = JSON.parse(pkgJson)
        return pkg['jsnext:main'] || pkg['module'] || pkg['main']
      }).catch(function () {
        return 'index.js'
      }).then(function (filename) {
        return path.join(inputFile, filename)
      })
    } else {
      return inputFile
    }
  }).then(function (entry) {
    return rollup.rollup({
      entry: entry,
      onwarn: quiet && noop,
      plugins: [
        json(),
        nodeResolveAuto({
          browser: browser,
          extensions: ['.js', '.json'],
          onwarn: quiet && noop
        })
      ]
    })
  }).then(function (bundle) {
    var code = bundle.generate({format: 'cjs'}).code

    return resolved.then(function () {
      if (!fixDependencies) {
        return
      }
      return readFile('package.json', 'utf8').then(function (pkgJson) {
        var pkg = JSON.parse(pkgJson)
        var deps = pkg.dependencies || {}
        var requires = findRequires(code)
        return Promise.all(requires.map(function (req) {
          var subPkgJsonPath = path.join('node_modules', req, 'package.json')
          return readFile(subPkgJsonPath, 'utf8').then(function (pkgJson) {
            deps[req] = JSON.parse(pkgJson).version
          }, noop) // ignore errors, e.g. from built-in modules like 'events'
        })).then(function () {
          pkg.dependencies = {}
          // sort dependencies by name
          Object.keys(deps).sort().forEach(function (dep) {
            pkg.dependencies[dep] = deps[dep]
          })
          var stringified = JSON.stringify(pkg, null, '  ') + '\n'
          return writeFile('package.json', stringified, 'utf8')
        })
      })
    }).then(function () {
      if (!outputFile) {
        return
      }
      return writeFile(outputFile, code, 'utf8')
    }).then(function () {
      return code
    })
  })
}
