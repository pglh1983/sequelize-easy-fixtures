const { User } = require('../../factories')

module.exports = User({
  firstName: 'Rolf',
  lastName: 'Smith',
  username: 'rolf',
  password_hash: '123',
  salt: 'daal',
  email: 'rolf@example.com',
  isActive: true
})