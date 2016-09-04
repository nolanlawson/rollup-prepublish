#!/usr/bin/env node

var argv = require('yargs')
  .usage('Usage: $0 [options] [inputFile] [outputFile]')
  .boolean('browser')
  .alias('b', 'browser')
  .describe('browser', 'Bundle using browser-resolve instead of node-resolve')
  .boolean('fix-dependencies')
  .alias('f', 'fix-dependencies')
  .describe('fix-dependencies', 'Update dependencies in package.json to add external deps')
  .boolean('quiet')
  .alias('q', 'quiet')
  .describe('quiet', "Don't print warnings about excluded/included deps")
  .example('$0', 'Bundle current project and output to stdout')
  .example('$0 --browser', 'Same thing, but emit a browser bundle')
  .example('$0 --quiet', 'Silence warnings')
  .help('help')
  .alias('h', 'help')
  .argv

var rollupPrepublish = require('./index')

var inputFile = argv._[0] || process.cwd()
var outputFile = argv._[1]
var browser = !!argv.browser
var quiet = !!argv.quiet
var fixDependencies = !!argv['fix-dependencies']

rollupPrepublish({
  entry: inputFile,
  dest: outputFile,
  browser: browser,
  quiet: quiet,
  fixDependencies: fixDependencies
}).then(function (code) {
  if (!outputFile) { // nothing written, write to stdout
    process.stdout.write(code)
  }
  process.exit(0)
}).catch(function (err) {
  console.error(err.stack)
  process.exit(1)
})
