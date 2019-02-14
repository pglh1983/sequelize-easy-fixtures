const models = require('./test-files/models/index')
const buildFixtureFactories = require('./lib/fixture-factory-builder')

module.exports = buildFixtureFactories(models)
