const Sequelize = require('sequelize')

async function fixture (model, where, defaults = {}) {
  if (where instanceof Array) {
    return Promise.all(where.map((el, i) => fixture(model, el, defaults[i])))
  }
  const { baseData: baseWhere, associations: whereAssociations } = _pullAssociations(model, where)
  const { baseData: baseDefaults, associations: defaultsAssociations } = _pullAssociations(model, defaults)

  // const whereRecords = await _executePrerequisiteAssociations(whereAssociations, baseWhere)
  // const defaultsRecords = await _executePrerequisiteAssociations(defaultsAssociations, baseDefaults)
  await Promise.all([
    _executePrerequisiteAssociations(whereAssociations, baseWhere),
    _executePrerequisiteAssociations(defaultsAssociations, baseDefaults)
  ])

  const obj = await (model.findOrCreate({
    where: baseWhere,
    defaults: baseDefaults
  })
    .spread(obj => obj))

  await Promise.all([
    _executeDependentAssociations(whereAssociations, obj),
    _executeDependentAssociations(defaultsAssociations, obj)
  ])
  // _mapObj(whereRecords, (rec, i) => { obj[i] = rec })
  // _mapObj(defaultsRecords, (rec, i) => { obj[i] = rec })

  return obj
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
  const postCreatePromises = _mapObj(belongsToAssociations, async (a) => {
    const record = await _executeAssociation(a.association.target, a.value)
    data[a.association.foreignKey] = record[a.association.targetKey]
    return record
  })
  return _objPromiseAll(postCreatePromises)
}

function _executeDependentAssociations (associations, obj) {
  const hasManyAssociations = _filterObj(associations, (a) => a.association.associationType !== 'BelongsTo')
  const postCreatePromises = _mapObj(hasManyAssociations, async (a) => {
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
  }
  if (data instanceof Sequelize.Promise || data instanceof Sequelize.Model) {
    return data
  }
  return fixture(model, data)
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

function _objPromiseAll (obj) {
  const ret = {}
  const map = []
  _mapObj(obj, (promise, i) => {
    map.push(
      promise.then(res => { ret[i] = res })
    )
  })
  return Promise.all(map).then(() => ret)
}

module.exports = fixture
