const { User } = require('../../factories')
const rolf = require('../../support/users/rolf')

module.exports = () => User({
  firstName: 'Peter',
  lastName: 'Hall',
  username: 'peter',
  password_hash: '123123123123123',
  salt: 'pepper',
  email: 'p.g.l.hall@gmail.com',
  isActive: true,
  Articles: [
    {
      title: 'My First Post',
      body: 'This is my first post. Here it is',
      assets: null,
      Comments: [
        {
          title: 'Comment 1',
          body: 'This is the body of the comment',
          User: rolf
        }
      ]
    }
  ]
})