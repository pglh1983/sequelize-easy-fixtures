const fs = require('fs')
const path = require('path')
const Sequelize = require('sequelize')

try {
  fs.unlinkSync(path.join(__dirname, '..', 'testdb.sqlite3'))
} catch (e) {
  // swallow errors
}
try {
  fs.unlinkSync(path.join(__dirname, '..', 'testdb.sqlite3-journal'))
} catch (e) {
  // swallow errors
}

const sequelize = new Sequelize(null, null, null, {
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'testdb.sqlite3'),
  logging: false
  // retry: {
  //   max: 10
  // }
})

module.exports = sequelize
