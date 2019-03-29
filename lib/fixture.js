const Sequelize = require('sequelize')

async function fixture (model, data) {
  try {
    if (data instanceof Array) {
      return Promise.all(data.map((el, i) => fixture(model, el)))
    }
    const { where, defaults, sets } = _extractData(data)
    const { baseData: baseWhere, associations: whereAssociations } = _pullAssociations(model, where)
    const { baseData: baseDefaults, associations: defaultsAssociations } = _pullAssociations(model, defaults)
    const { baseData: baseSets, associations: setsAssociations } = _pullAssociations(model, sets)

    // Find or create search associations
    await _executePrerequisiteAssociations(whereAssociations, baseWhere)

    let obj = await model.findOne({ where: baseWhere })
    if (obj) {
      // Run sets
      await _executePrerequisiteAssociations(setsAssociations, baseSets)
      obj = await obj.update(Object.assign({}, baseSets))
      await _promiseAllCompat([
        () => _executeDependentAssociations(whereAssociations, obj),
        () => _executeDependentAssociations(setsAssociations, obj)
      ])
      return obj
    } else {
      // Create and run defaults
      await _executePrerequisiteAssociations(defaultsAssociations, baseDefaults)
      obj = await model.create(Object.assign({}, baseWhere, baseDefaults))
      await _promiseAllCompat([
        () => _executeDependentAssociations(whereAssociations, obj),
        () => _executeDependentAssociations(defaultsAssociations, obj)
      ])
      return obj
    }
  } catch (e) {
    throw e // Breakpoint
  }
}

/**
 * Reformat arguments to fixture()
 *
 * Transforms any input object into an object of where, default
 * and sets.
 *
 * @param {object} data - Input arg to fixture()
 * @return {object} Object transformed into fixed structure
 */
function _extractData (data) {
  let keys
  try {
    keys = Object.keys(data)
  } catch (e) {
    throw e // Breakpoint
  }
  if (data.where && keys.filter(k => k !== 'where' && k !== 'defaults' && k !== 'sets').length === 0) {
    return Object.assign({ defaults: {}, sets: {} }, data)
  } else {
    return { where: data, defaults: {}, sets: {} }
  }
}

function _pullAssociations (model, data) {
  const associations = {}
  const baseData = {}
  for (let i in data) {
    if (model.associations[i]) {
      associations[i] = {
        association: model.associations[i],
        value: data[i]
      }
    } else {
      baseData[i] = data[i]
    }
  }
  return { baseData, associations }
}

function _executePrerequisiteAssociations (associations, data) {
  const belongsToAssociations = _filterObj(associations, (a) => a.association.associationType === 'BelongsTo')
  const postCreatePromises = _mapObj(belongsToAssociations, (a) => async () => {
    const record = await _executeAssociation(a.association.target, a.value)
    data[a.association.foreignKey] = record === null ? null : record[a.association.targetKey] // nullable assocs
    return record
  })
  return _objPromiseAll(postCreatePromises)
}

function _executeDependentAssociations (associations, obj) {
  const hasManyAssociations = _filterObj(associations, (a) => a.association.associationType !== 'BelongsTo')
  const postCreatePromises = _mapObj(hasManyAssociations, (a) => async () => {
    // If association is object, set the foreign keys
    const write = _setForeignKeysOnAssociation(a.association, a.value, obj)
    const record = await _executeAssociation(a.association.target, write)
    return record
  })
  return _objPromiseAll(postCreatePromises)
}

function _setForeignKeysOnAssociation (association, data, parent) {
  if (data instanceof Array) {
    return data.map(record => _setForeignKeysOnAssociation(association, record, parent))
  }
  if (data instanceof Object && !(data instanceof Sequelize.Promise)) {
    data[association.foreignKeyField] = parent[association.sourceKeyField]
  }
  return data
}

async function _executeAssociation (model, data) {
  if (data instanceof Array) {
    // return Promise.all(data.map(el => _executeAssociation(model, el)))
    const resolved = []
    for (let i = 0; i < data.length; ++i) {
      resolved.push(await _executeAssociation(model, data[i]))
    }
    return resolved
  } else if (data instanceof Sequelize.Promise || data instanceof Sequelize.Model) {
    return data
  } else if (data === null) {
    return null
  } else {
    return fixture(model, data)
  }
}

function _filterObj (obj, callback) {
  const filtered = {}
  for (let i in obj) {
    if (callback(obj[i], i)) {
      filtered[i] = obj[i]
    }
  }
  return filtered
}

function _mapObj (obj, callback) {
  const mapped = {}
  for (let i in obj) {
    mapped[i] = callback(obj[i], i)
  }
  return mapped
}

async function _objPromiseAll (obj) {
  const map = []
  const keys = []
  const ret = {}
  _mapObj(obj, (promiseFunc, i) => {
    map.push(promiseFunc)
    keys.push(i)
  })
  const results = await _promiseAllCompat(map)
  keys.forEach(i => { ret[keys[i]] = results[i] })
  return ret
}

/**
 * sqlite-compatible Promise.all()
 *
 * sqlite doesn't like running multiple inserts at
 * once because the table will be locked, so we have
 * to run promise arrays in sequence for it.
 */
async function _promiseAllCompat (promiseArray) {
  const out = []
  for (let i = 0; i < promiseArray.length; ++i) {
    out.push(await promiseArray[i]())
  }
  return out
}

module.exports = fixture
