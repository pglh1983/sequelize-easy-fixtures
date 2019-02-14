const { Post } = require('../../factories')
const rolf = require('../../support/users/rolf')

module.exports = () => Post({
  title: 'My Second Post',
  body: 'This is my second post. Here it is',
  assets: null,
  Comments: [
    {
      title: 'Comment 2',
      body: 'This is the body of the other comment',
      User: rolf
    }
  ],
  User: {
    firstName: 'Adam',
    lastName: 'Swartz',
    username: 'adam',
    password_hash: '123123123123123',
    salt: 'pepper',
    email: 'adam@jamieai.com',
    isActive: true
  }
})