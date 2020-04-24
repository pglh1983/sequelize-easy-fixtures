# sequelize-easy-fixtures

Load data quickly &amp; easily with Sequelize.

## !!! Unmaintained !!!

This project is unmaintained an exists only as a
repository of code to demonstrate my coding
abilities. I once intended to open-source it but
ultimately decided it didn't offer anything new or
different enough to be worthwhile. It gets security
and compatibility updates very, very infrequently.
As such, __use at your own risk.__

## Installation

Once again, __please do not use this repo__. But you
can add it to your project with:

```bash
npm install pglh1983/sequelize-easy-fixtures
```

## Purpose and usage

The purpose of this repo is to allow you to add large
amounts of structured data to your Sequelize-fronted
relational database as quickly as possible, using a
hierarchical syntax, like so:

```javascript
const postFixture = await fixture(Post, {
    title: 'Post title',
    body: 'Insightful post',
    User: {
      name: 'Amy',
      email: 'amy@example.com',
    },
    Comments: [
      {
        title: 'Comment title',
        body: 'Stupid comment',
        User: {
          name: 'Keith',
          email: 'keith@example.com'
        }
      }
    ]
  })
```

As you can see above, you can supply `hasMany` or
`belongsTo` associations inline, and the library
will figure out what order it needs to insert the
model records in.

As well as supplying associations as regular old
Javascript objects, you can also supply existing
Sequelize model records, or Promises that resolve
to them:

```javascript
const amy = fixture(User, {
  name: 'Amy',
  email: 'amy@exmple.org'
})
const keith = fixture(User, {
  name: 'Keith',
  email: 'keith@exmple.org'
})
const postFixture = await fixture(Post, {
    title: 'Post title',
    body: 'Insightful post',
    User: await amy, // Existing record
    Comments: [
      {
        title: 'Comment title',
        body: 'Stupid comment',
        User: keith // Promise
      }
    ]
  })
```

## Feedback

If you have any feedback about this repo or would 
like to see it actually developed, please get in
touch with my via Github.
