var _ = require('lodash-node/modern');
var mongoose = require('mongoose');

var defaultOptions = {
  path: 'votes',
  model: undefined
};

module.exports = function votePlugin(schema, options) {
  options = _.merge({}, defaultOptions, options || {});

  if (!schema.path(options.path)) {
    schema.path(options.path,
      options.model ?
        [{
          type: mongoose.Schema.Types.ObjectId,
          ref: options.model
        }] :
        []
    );
  }

  schema.method('vote', function (voter) {
    // Add voter if not already in set
    this[options.path].addToSet(voter);
  });

  schema.method('unvote', function (voter) {
    this[options.path].pull(voter);
  });
};
