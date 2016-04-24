'use strict';
/* jshint node: true, mocha: true, expr: true */

var expect = require('chai').expect;
var mongoose = require('mongoose');
var faker = require('faker');
var votes = require('./votes');

var connectionString = process.env.MONGO_URL || 'mongodb://localhost/unit_test';

var Schema = mongoose.Schema;
var connection;

// Mongoose uses internal caching for models.
// While {cache: false} works with most models, models using references
// use the internal model cache for the reference.
// This removes the mongoose entirely from node's cache
delete require.cache.mongoose;

var blogData = {
  title: faker.lorem.sentence(),
  blog: faker.lorem.paragraphs()
};

before(function (done) {
  connection = mongoose.createConnection(connectionString);
  connection.once('connected', done);
});

after(function (done) {
  connection.db.dropDatabase(function (err, result) {
    connection.close(done);
  });
});

describe('Mongoose plugin: votes', function () {
  var schema;

  // Prevent test timeout on travis
  this.timeout(5000);

  describe('with plugin declaration', function () {
    beforeEach(function () {
      schema = blogSchema();
    });

    it('should add `votes` path, `vote` and `unvote` methods to the schema', function () {
      schema.plugin(votes);

      expect(schema.pathType('votes')).to.be.equal('real');
      expect(schema.path('votes').caster.instance).to.be.equal('String');
      expect(schema.methods.vote).to.be.defined;
      expect(schema.methods.unvote).to.be.defined;
    });

    describe('with options', function () {
      it('should add `likes` path, `like` and `unlike` methods to the schema', function () {
        schema.plugin(votes, {path: 'likes', voteMethodName: 'like', unvoteMethodName: 'unlike'});

        expect(schema.pathType('likes')).to.be.equal('real');
        expect(schema.path('likes').caster.instance).to.be.equal('String');
        expect(schema.methods.like).to.be.defined;
        expect(schema.methods.unlike).to.be.defined;
      });

      it('should add a reference for `votes` to the schema', function () {
        schema.plugin(votes, {votes: {ref: 'User'}});

        expect(schema.pathType('votes')).to.be.equal('real');
        expect(schema.path('votes').caster.instance).to.be.equal('ObjectID');
      });

      it('should not allow path type for `votes` to be overwritten', function () {
        schema.plugin(votes, {options: {type: String}});

        expect(schema.path('votes').instance).to.be.equal('Array');
      });

      it('should not allow path type for `votes` item to be overwritten', function () {
        schema.plugin(votes, {votes: {options: {type: Boolean}}});

        expect(schema.path('votes').caster.instance).to.be.equal('String');
      });

      it('should make `votes` not selected', function () {
        schema.plugin(votes, {options: {select: false}});

        expect(schema.path('votes').selected).to.be.equal(false);
      });

      it('should make `votes` item not selected', function () {
        schema.plugin(votes, {votes: {options: {select: false}}});

        expect(schema.path('votes').caster.selected).to.be.equal(false);
      });
    });
  });

  describe('with documents', function () {
    var Blog;
    var blog;

    before(function () {
      var schema = blogSchema();
      schema.plugin(votes);

      Blog = model(schema);
    });

    beforeEach(function() {
      blog = new Blog();
    });

    it('should set `votes` to an empty array', function () {
      expect(blog.votes.length).to.be.equal(0);
    });

    it('should allow a voter to vote only once', function () {
      var voter = faker.name.findName();

      blog.vote(voter);
      expect(blog.votes.length).to.be.equal(1);
      expect(blog.votes[0]).to.be.equal(voter);

      blog.vote(voter);
      expect(blog.votes.length).to.be.equal(1);
    });

    it('should allow multiple users to vote', function () {
      var voter = faker.name.findName();
      var otherVoter = faker.name.findName();

      blog.vote(voter);
      expect(blog.votes.length).to.be.equal(1);
      expect(blog.votes[0]).to.be.equal(voter);

      blog.vote(otherVoter);
      expect(blog.votes.length).to.be.equal(2);
      expect(blog.votes[1]).to.be.equal(otherVoter);
    });

    it('should allow a user to "unvote" their vote', function () {
      var voter = faker.name.findName();
      var otherVoter = faker.name.findName();

      blog.vote(voter);
      expect(blog.votes.length).to.be.equal(1);
      expect(blog.votes[0]).to.be.equal(voter);

      blog.vote(otherVoter);
      expect(blog.votes.length).to.be.equal(2);
      expect(blog.votes[1]).to.be.equal(otherVoter);

      blog.unvote(voter);
      expect(blog.votes.length).to.be.equal(1);
      expect(blog.votes[0]).to.be.equal(otherVoter);
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

function blogSchema() {
  return new Schema({
    title: String,
    blog: String,
    created: {type: Date, 'default': Date.now}
  });
}
