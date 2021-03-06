/* eslint-env mocha */
const connection = require('../test-files/connection')
const { User, Post, Comment } = require('../test-files/models/index')
const fixture = require('../lib/fixture')
const assert = require('../test-files/assert')

describe('fixture()', function describeFixture () {
  beforeEach(function dbStart () {
    // Trash DB before each test
    return connection.sync({ force: true })
  })

  describe('{ where }', function describeWhereOption () {
    it('creates a single fixture', async function testSingleFixture () {
      const result = await fixture(User, {
        name: 'Amy',
        email: 'amy@example.com'
      })
      assert.deepEqual(result.get({ plain: true }), {
        id: 1,
        name: 'Amy',
        email: 'amy@example.com',
        initial: 'A'
      })
    })

    it('creates BelongsTo associations', async function testAssocFixture () {
      const result = await fixture(Post, {
        title: 'Test post',
        body: 'Test body',
        User: { name: 'Amy', email: 'amy@example.com' }
      })

      assert.deepEqual(result.get({ plain: true }), {
        id: 1,
        title: 'Test post',
        body: 'Test body',
        UserId: 1
      })
    })

    it('creates HasMany associations', async function testAssocFixture () {
      const result = await fixture(User, {
        name: 'Amy',
        email: 'amy@example.com',
        Articles: [
          { title: 'Title 1', body: 'Body 1' },
          { title: 'Title 2', body: 'Body 2' }
        ]
      })
      assert.deepEqual(result.get({ plain: true }), {
        id: 1,
        name: 'Amy',
        email: 'amy@example.com',
        initial: 'A'
      })
      const articles = await Post.findAll({ where: { UserId: 1 } })
      assert.deepEqual(
        articles.map(article => article.get({ plain: true })),
        [
          { id: 1, title: 'Title 1', body: 'Body 1', UserId: 1 },
          { id: 2, title: 'Title 2', body: 'Body 2', UserId: 1 }
        ]
      )
    })

    it('creates associations from Sequelize promises', async function testSequelizePromises () {
      await User.create({ name: 'Amy', email: 'amy@example.com' })
      const keithPromise = User.create({ name: 'Keith', email: 'keith@example.com' })
      const postFixture = await fixture(Post, {
        title: 'Post title',
        body: 'Insightful post',
        UserId: 1,
        Comments: [
          { title: 'Comment title', body: 'Stupid comment', User: keithPromise }
        ]
      })

      const post = await Post.findByPk(postFixture.id, {
        include: [
          {
            association: Post.associations.User
          },
          {
            association: Post.associations.Comments,
            include: [{ association: Comment.associations.User }]
          }
        ]
      })
      assert.deepEqual(post.get({ plain: true }), {
        id: 1,
        title: 'Post title',
        body: 'Insightful post',
        UserId: 1,
        User: { id: 1, name: 'Amy', email: 'amy@example.com', initial: 'A' },
        Comments: [{
          id: 1,
          title: 'Comment title',
          body: 'Stupid comment',
          PostId: 1,
          UserId: 2,
          User: {
            id: 2, name: 'Keith', email: 'keith@example.com', initial: 'K'
          }
        }]
      })
    })

    it('creates associations from Sequelize models', async function testSequelizeModel () {
      await User.create({ name: 'Amy', email: 'amy@example.com' })
      const keith = await User.create({ name: 'Keith', email: 'keith@example.com' })
      const postFixture = await fixture(Post, {
        title: 'Post title',
        body: 'Insightful post',
        UserId: 1,
        Comments: [
          { title: 'Comment title', body: 'Stupid comment', User: keith }
        ]
      })

      const post = await Post.findByPk(postFixture.id, {
        include: [
          {
            association: Post.associations.User
          },
          {
            association: Post.associations.Comments,
            include: [{ association: Comment.associations.User }]
          }
        ]
      })
      assert.deepEqual(post.get({ plain: true }), {
        id: 1,
        title: 'Post title',
        body: 'Insightful post',
        UserId: 1,
        User: { id: 1, name: 'Amy', email: 'amy@example.com', initial: 'A' },
        Comments: [{
          id: 1,
          title: 'Comment title',
          body: 'Stupid comment',
          PostId: 1,
          UserId: 2,
          User: {
            id: 2, name: 'Keith', email: 'keith@example.com', initial: 'K'
          }
        }]
      })
    })

    it('Finds records that already exist', async function testUpdateExisting () {
      await User.create({ name: 'Amy', email: 'amy@example.com' })
      const fixie = await fixture(User, {
        where: { email: 'amy@example.com' },
        defaults: { name: 'Amy' }
      })
      assert.deepEqual(
        fixie.get({ plain: true }),
        { id: 1, name: 'Amy', email: 'amy@example.com', initial: 'A' }
      )
    })

    it('creates and finds associations without clashes', async function testAssociationNoClash () {
      // Here we are going to reference the same user by object multiple times and test that
      // they all resolve to the same one. Async code could jeopardise that.
      const postFixture = await fixture(Post, {
        title: 'Post title',
        body: 'Insightful post',
        User: { name: 'Amy', email: 'amy@example.com' },
        Comments: [
          { title: 'Comment title 1', body: 'Thoughtful comment', User: { name: 'Amy', email: 'amy@example.com' } },
          { title: 'Comment title 2', body: 'Sophisticated comment', User: { name: 'Amy', email: 'amy@example.com' } },
          { title: 'Comment title 3', body: 'Ridiculous comment', User: { name: 'Keith', email: 'keith@example.com' } },
          { title: 'Comment title 4', body: 'Amazing comment', User: { name: 'Amy', email: 'amy@example.com' } }
        ]
      })
      const post = await Post.findByPk(postFixture.id, {
        include: [
          {
            association: Post.associations.User
          },
          {
            association: Post.associations.Comments,
            include: [{ association: Comment.associations.User }]
          }
        ]
      })
      assert.deepEqual(post.get({ plain: true }), {
        id: 1,
        title: 'Post title',
        body: 'Insightful post',
        UserId: 1,
        User: { id: 1, name: 'Amy', email: 'amy@example.com', initial: 'A' },
        Comments: [
          { id: 1,
            PostId: 1,
            title: 'Comment title 1',
            body: 'Thoughtful comment',
            UserId: 1,
            User: {
              id: 1, name: 'Amy', email: 'amy@example.com', initial: 'A'
            } },
          { id: 2,
            PostId: 1,
            title: 'Comment title 2',
            body: 'Sophisticated comment',
            UserId: 1,
            User: {
              id: 1, name: 'Amy', email: 'amy@example.com', initial: 'A'
            } },
          { id: 3,
            PostId: 1,
            title: 'Comment title 3',
            body: 'Ridiculous comment',
            UserId: 2,
            User: {
              id: 2, name: 'Keith', email: 'keith@example.com', initial: 'K'
            } },
          { id: 4,
            PostId: 1,
            title: 'Comment title 4',
            body: 'Amazing comment',
            UserId: 1,
            User: {
              id: 1, name: 'Amy', email: 'amy@example.com', initial: 'A'
            } }
        ]
      })
    })

    it('tolerates nullable associations', async function testNullableAssoc () {
      const result = await fixture(Post, {
        title: 'Test post',
        body: 'Test body',
        User: null
      })

      assert.deepEqual(result.get({ plain: true }), {
        id: 1,
        title: 'Test post',
        body: 'Test body',
        UserId: null
      })
    })

    it('ignores virtual fields for existing records', async function testIgnoreVirtual () {
      await User.create({ name: 'Amy', email: 'amy@example.com' })
      const fixie = await fixture(User, {
        where: { email: 'amy@example.com', initial: 'Q' },
        defaults: { name: 'Amy' }
      })
      assert.deepEqual(
        fixie.get({ plain: true }),
        { id: 1, name: 'Amy', email: 'amy@example.com', initial: 'A' }
      )
    })

    it('pays attention to virtual fields for new records', async function testSetVirtual () {
      const result = await fixture(User, {
        name: 'Amy',
        email: 'amy@example.com',
        initial: 'R'
      })
      assert.deepEqual(result.get({ plain: true }), {
        id: 1,
        name: 'Rmy',
        email: 'amy@example.com',
        initial: 'R'
      })
    })
  })

  describe('{ default }', function describeDefaultOption () {
    it('Sets default values on new records', async function testCreateNewDefaults () {
      const fixie = await fixture(User, {
        where: { email: 'amy@example.com' },
        defaults: { name: 'Amy' }
      })
      assert.deepEqual(
        fixie.get({ plain: true }),
        { id: 1, name: 'Amy', email: 'amy@example.com', initial: 'A' }
      )
    })

    it('Does not overwrite default values on records that exist already', async function testNoThwompDefaults () {
      await User.create({ name: 'Amy', email: 'amy@example.com' })
      const fixie = await fixture(User, {
        where: { email: 'amy@example.com' },
        defaults: { name: 'Steve' }
      })
      assert.deepEqual(
        fixie.get({ plain: true }),
        { id: 1, name: 'Amy', email: 'amy@example.com', initial: 'A' }
      )
    })
  })

  describe('{ sets }', function describeSetOption () {
    it('Sets set values on existing records', async function testThwompExisting () {
      await User.create({ name: 'Amy', email: 'amy@example.com' })
      const fixie = await fixture(User, {
        where: { email: 'amy@example.com' },
        sets: { name: 'Aimee' }
      })
      // Set the values in the return obj
      assert.deepEqual(
        fixie.get({ plain: true }),
        { id: 1, name: 'Aimee', email: 'amy@example.com', initial: 'A' }
      )
      // Set the values in the DB
      const user = await User.findOne({ where: { email: 'amy@example.com' } })
      assert.deepEqual(
        user.get({ plain: true }),
        { id: 1, name: 'Aimee', email: 'amy@example.com', initial: 'A' }
      )
    })
  })

  it('Doesn\'t set values on created records', async function testSetCreated () {
    const fixie = await fixture(User, {
      where: { email: 'amy@example.com' },
      defaults: { name: 'Amy' },
      sets: { name: 'Aimee' }
    })
    // Set the values in the return obj
    assert.deepEqual(
      fixie.get({ plain: true }),
      { id: 1, name: 'Amy', email: 'amy@example.com', initial: 'A' }
    )
    // Set the values in the DB
    const user = await User.findOne({ where: { email: 'amy@example.com' } })
    assert.deepEqual(
      user.get({ plain: true }),
      { id: 1, name: 'Amy', email: 'amy@example.com', initial: 'A' }
    )
  })
})
