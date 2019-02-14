/**
  index.js is an import utility that grabs all models in the same folder,
  and instantiate a Sequelize object once for all models (instead of for each model).
  This is done by passing the single Sequelize object to each
  model as a reference, which each model then piggy-backs (sequelize.define())
  for creating a single db class model.

  https://github.com/sequelize/sequelize/issues/6524#issuecomment-329664805
*/

'use strict' // typical JS thing to enforce strict syntax

const fs = require('fs') // file system for grabbing files
const path = require('path') // better than '\/..\/' for portability
// const Sequelize = require('sequelize') // Sequelize is a constructor
// const env = process.env.NODE_ENV || 'development' // use process environment
// const config = require(path.join(__dirname, '..', 'config.js'))[env] // Use the .config.json file in the parent folder
// const sequelize = new Sequelize(config.database, config.username, config.password, {
//   dialect: config.dialect,
// })
const sequelize = require('../connection')

// Load each model file
const models = Object.assign({}, ...fs.readdirSync(__dirname)
  .filter(file =>
    (file.indexOf('.') !== 0) && (file !== 'index.js')
  )
  .map(function (file) {
    const model = require(path.join(__dirname, file))
    // console.log(model.init(sequelize).tableName)
    return {
      [model.name]: model.init(sequelize)
    }
  })
)

// Load model associations
for (const model of Object.keys(models)) {
  typeof models[model].associate === 'function' && models[model].associate(models)
}

module.exports = models
