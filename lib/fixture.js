const Sequelize = require('sequelize')

async function fixture (model, data) {
  if (data instanceof Array) {
    return Promise.all(data.map(el => fixture(model, el)))
  }
  const mappedData = await _resolveDependentAssociations(model, data)
  const options = _generateIncludes(mappedData, model.associations)
  return model.create(mappedData, options)
}

async function _resolveDependentAssociations (model, data) {
  const map = {}

  for (let key in data) {
    let val = data[key]

    // If this field is an association, remember it
    const association = model.associations[key]

    // Create any child model that is a dependency of the parent
    if (association !== undefined) {
      val = await _resolveAssociation(association, data[key])
    }

    // Wait for any fixtures or models that are in progress
    if (val instanceof Promise) {
      val = await val
    }

    // Set ID field, not association name
    if (val instanceof Sequelize.Model && association !== undefined) {
      map[association.foreignKey] = val[association.targetKey]
      // TODO: foreignKey/identifier/identifierField
      // TODO: targetKey/targetKeyField/targetIdentifier
    } else {
      map[key] = val
    }
  }

  return map
}

function _resolveAssociation (association, value) {
  if (value instanceof Array) {
    return Promise.all(value.map(val => _resolveAssociation(association, val)))
  }

  if (association.associationType === 'BelongsTo') {
    return _resolveRecord(association.target, value)
  } else {
    return _resolveDependentAssociations(association.target, value)
  }
}

function _resolveRecord (model, data) {
  return data instanceof Promise
  || data instanceof Sequelize.Promise
  || data instanceof Sequelize.Model
    ? data
    : fixture(model, data)
}

function _generateIncludes (data, associations) {
  const include = []
  for (let key in data) {
    if (associations[key] !== undefined) {
      include.push(
        Object.assign(
          { association: associations[key] },
          _generateIncludes(data[key], associations[key].target.associations)
        )
      )
    }
  }
  return include.length > 0 ? { include } : {}
}

module.exports = fixture
