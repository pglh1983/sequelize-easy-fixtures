const path = require('path')
const Sequelize = require('sequelize')

const sequelize = new Sequelize(null, null, null, {
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'tmp', 'testdb.sqlite3')
})

module.exports = sequelize
