var mongoose = require('mongoose');
var votes = require('./votes');
var Schema = mongoose.Schema;

// Mongoose uses internal caching for models.
// While {cache: false} works with most models, models using references
// use the internal model cache for the reference.
// This removes the mongoose entirely from node's cache
delete require.cache.mongoose;

var blogData = {
  title: 'My first blog! #Super',
  blog: 'This is my very first #blog! I hope you enjoy it. #WOOHOO'
};

describe('Mongoose plugin: votes', function () {
  var user;
  var otherUser;

  it('should add `votes` methods without model reference', function () {
    var schema = BlogSchema();
    schema.plugin(votes);
    expect(schema.methods.vote).toBeDefined();
    expect(schema.methods.unvote).toBeDefined();
  });

  it('should add `votes` methods with model reference', function () {
    var schema = BlogSchema();
    schema.plugin(votes, {model: 'User'});
    expect(schema.methods.vote).toBeDefined();
    expect(schema.methods.unvote).toBeDefined();
  });

  it('should connect to test DB', function (done) {
    connection = mongoose.createConnection('mongodb://localhost/unit_test');
    connection.once('connected', function () {
      done();
    });
  });

  it('should save users to DB', function (done) {
    var User = model('User', UserSchema());
    User.create([{displayName: 'Foo'}, {displayName: 'Bar'}], function (err, _user, _otherUser) {
      user = _user;
      otherUser = _otherUser;
      done();
    });
  });

  describe('with plugin declaration', function () {
    var schema;

    beforeEach(function () {
      schema = BlogSchema();
    });

    it('should add `votes` to the schema', function () {
      schema.plugin(votes, {model: 'User'});
      expect(schema.path('votes')).toBeDefined();
    });
  });

  describe('with documents', function () {
    var Blog;

    it('should compile the model with the votes plugin', function () {
      var schema = BlogSchema();
      schema.plugin(votes, {model: 'User'});

      Blog = model(schema);
      expect(Blog).toEqual(jasmine.any(Function));
    });

    it('should set `votes` to an empty array', function () {
      expect(Blog().votes).toEqual([]);
    });

    it('should allow a user to vote only once', function (done) {
      Blog().save(function (err, blog) {
        blog.vote(user);
        expect(blog.votes.length).toBe(1);
        expect(blog.votes[0].toJSON()).toBe(user.id);

        blog.vote(user);
        expect(blog.votes.length).toBe(1);

        done();
      });
    });

    it('should allow multiple users to vote', function (done) {
      Blog().save(function (err, blog) {
        blog.vote(user);
        expect(blog.votes.length).toBe(1);
        expect(blog.votes[0].toJSON()).toBe(user.id);

        blog.vote(otherUser);
        expect(blog.votes.length).toBe(2);
        expect(blog.votes[1].toJSON()).toBe(otherUser.id);

        done();
      });
    });

    it('should allow a user to "unvote" their vote', function (done) {
      Blog().save(function (err, blog) {
        blog.vote(user);
        expect(blog.votes.length).toBe(1);
        expect(blog.votes[0].toJSON()).toBe(user.id);

        blog.vote(otherUser);
        expect(blog.votes.length).toBe(2);
        expect(blog.votes[1].toJSON()).toBe(otherUser.id);

        blog.unvote(otherUser);
        expect(blog.votes.length).toBe(1);
        expect(blog.votes[0].toJSON()).toBe(user.id);

        done();
      });
    });
  });

  it('should drop DB and disconnect', function (done) {
    connection.db.dropDatabase(function (err, result) {
      connection.close(function () {
        done();
      });
    });
  });
});

function model(name, schema) {
  if (arguments.length === 1) {
    schema = name;
    name = 'Model';
  }

  // Specifying a collection name allows the model to be overwritten in
  // Mongoose's model cache
  return connection.model(name, schema, name);
}

function BlogSchema() {
  return Schema({
    title: String,
    blog: String,
    created: {type: Date, 'default': Date.now}
  });
}

function UserSchema() {
  return Schema({
    displayName: String
  });
}
