var mongoose = require('mongoose');
var _ = require('lodash-node/modern');

module.exports = function votePlugin(schema, options) {
  options = _.merge({
    path: 'votes',
    options: {},
    voteMethodName: 'vote',
    unvoteMethodName: 'unvote',
    votes: {
      ref: undefined,
      options: {}
    }
  }, options || {});

  schema.path(options.path, _.defaults(
    {type: [
      _.defaults(
        options.votes.ref ?
          {type: mongoose.Schema.Types.ObjectId, ref: options.votes.ref} :
          {type: String},
        options.votes.options
      )
    ]},
    options.options
  ));

  schema.method(options.voteMethodName, function (voter) {
    // Add voter if not already in set
    this[options.path].addToSet(voter);
  });

  schema.method(options.unvoteMethodName, function (voter) {
    // Remove voter if in set
    this[options.path].pull(voter);
  });
};
