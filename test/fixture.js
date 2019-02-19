/* eslint-env mocha */
const connection = require('../test-files/connection')
const { User, Post, Comment } = require('../test-files/models/index')
const fixture = require('../lib/fixture')
const assert = require('../test-files/assert')

describe('fixture', function describeFixture () {
  beforeEach(function dbStart () {
    // Trash DB before each test
    return connection.sync({ force: true })
  })

  it('creates a single fixture', async function testSingleFixture () {
    const result = await fixture(User, {
      name: 'Amy',
      email: 'amy@example.com'
    })
    assert.deepEqual(result.get({ plain: true }), {
      id: 1,
      name: 'Amy',
      email: 'amy@example.com'
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
      email: 'amy@example.com'
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
      User: { id: 1, name: 'Amy', email: 'amy@example.com' },
      Comments: [{
        id: 1, title: 'Comment title', body: 'Stupid comment', PostId: 1, UserId: 2, User: { id: 2, name: 'Keith', email: 'keith@example.com' }
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
      User: { id: 1, name: 'Amy', email: 'amy@example.com' },
      Comments: [{
        id: 1, title: 'Comment title', body: 'Stupid comment', PostId: 1, UserId: 2, User: { id: 2, name: 'Keith', email: 'keith@example.com' }
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
      { id: 1, name: 'Amy', email: 'amy@example.com' }
    )
  })

  it('Does not overwrite default values', async function testNoThwompDefaults () {
    await User.create({ name: 'Amy', email: 'amy@example.com' })
    const fixie = await fixture(User, {
      where: { email: 'amy@example.com' },
      defaults: { name: 'Steve' }
    })
    assert.deepEqual(
      fixie.get({ plain: true }),
      { id: 1, name: 'Amy', email: 'amy@example.com' }
    )
  })

  it('Sets default values on new records', async function testCreateNewDefaults () {
    const fixie = await fixture(User, {
      where: { email: 'amy@example.com' },
      defaults: { name: 'Amy' }
    })
    assert.deepEqual(
      fixie.get({ plain: true }),
      { id: 1, name: 'Amy', email: 'amy@example.com' }
    )
  })
})
