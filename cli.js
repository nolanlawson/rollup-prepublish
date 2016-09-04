#!/usr/bin/env node

var argv = require('yargs')
  .usage('Usage: $0 [options] [input] [output]')
  .boolean('browser')
  .describe('browser', 'Bundle using browser-resolve instead of node-resolve')
  .help('help')
  .alias('h', 'help')
  .argv

var rollupPrepublish = require('./index')

var inputFile = argv._[0] || process.cwd()
var outputFile = argv._[1]
var browser = !!argv.browser

rollupPrepublish({
  entry: inputFile,
  dest: outputFile,
  browser: browser
}).then(function (code) {
  if (!outputFile) { // nothing written, write to stdout
    process.stdout.write(code)
  }
  process.exit(0)
}).catch(function (err) {
  console.error(err.stack)
  process.exit(1)
})
