const Sequelize = require('sequelize')
const fixture = require('./fixture')

/**
 * Build either a fixture factory from a single model class, or an
 * object of fixture factories from an object of models.
 *
 * @param {Object<Sequelize.Model>} models An object of Sequelize models to map to fixture factories
 * @return {function|Object<function>} If {models} is a single Sequelize model, a fixture factory for it, otherwise an object of fixture factories for {models}
 */
function buildFixtureFactories (models) {
  // Did we get a single model input or multiple inputs?
  if (_isModel(models)) {
    return _buildFixtureFactory(models)
  } else if (models instanceof Object) {
    const ret = {}
    for (let el in models) {
      if (_isModel(models[el])) {
        ret[el] = _buildFixtureFactory(models[el])
      }
    }
    return ret
  }
}

/**
 * Build a fixture factory for a single model class.
 *
 * @param {Sequelize.Model} model A model to build for
 * @return {function} A fixture factory for {model}
 */
function _buildFixtureFactory (model) {
  return function _fixtureFactoryForModel (...args) {
    return fixture(model, ...args)
  }
}

/**
 * Determine whether a given input is a Seuqelize model.
 *
 * This is done by testing for inheritance from
 * Sequelize.Model.
 *
 * @param {any} object Object to test for modelness
 * @return {boolean} true if input is a Sequelize model
 */
function _isModel (object) {
  return Sequelize.Model.isPrototypeOf(object)
}

module.exports = buildFixtureFactories
