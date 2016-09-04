#!/usr/bin/env node

require('lie/polyfill')
var rollup = require('rollup')
var nodeResolveAuto = require('rollup-plugin-node-resolve-auto')
var json = require('rollup-plugin-json')
var fs = require('fs')
var denodeify = require('denodeify')
var stat = denodeify(fs.stat)
var readFile = denodeify(fs.readFile)
var path = require('path')

function noop () {
}

module.exports = function rollupPrepublish (opts) {
  var inputFile = opts.entry
  var outputFile = opts.dest
  var browser = opts.browser
  var quiet = opts.quiet
  return Promise.resolve().then(function () {
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
    if (outputFile) {
      return bundle.write({
        format: 'cjs',
        dest: outputFile
      })
    } else { // just return the code
      return bundle.generate({
        format: 'cjs'
      }).code
    }
  })
}
