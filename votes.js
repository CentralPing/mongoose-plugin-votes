var mongoose = require('mongoose');
var _ = require('lodash-node/modern');

module.exports = function votePlugin(schema, options) {
  /* jshint eqnull: true */
  options = _.merge({
    path: 'votes',
    pathOptions: {},
    voteMethodName: 'vote',
    unvoteMethodName: 'unvote',
    votesRef: undefined,
    votesOptions: {}
  }, options || {});

  schema.path(options.path, _.defaults(
    {type: [
      _.defaults(
        options.votesRef != null ?
          {type: mongoose.Schema.Types.ObjectId, ref: options.votesRef} :
          {type: String},
        options.votesOptions
      )
    ]},
    options.pathOptions
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
