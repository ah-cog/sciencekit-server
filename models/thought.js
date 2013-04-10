var mongoose = require('mongoose')
	, Account = require('./account')
	, Thought = require('./thought')
	, Timeline = require('./timeline');

// A thought is a tree, structurally, but can be listed linearly.
var thoughtSchema = new mongoose.Schema({
	first: { type: mongoose.Schema.Types.ObjectId, ref: 'ThoughtElement' }, // first thought, the root, seed thought
	latest: { type: mongoose.Schema.Types.ObjectId, ref: 'ThoughtElement' }, // most recent thought temporally

	timeline: { type: mongoose.Schema.Types.ObjectId, ref: 'Timeline' }, // Timeline on which this event occurred.  (NOT! the following) Timeline for which this element is the head

	date: { type: Date, default: Date.now },
	hidden: Boolean
});

thoughtSchema.statics.getPopulated = function(thought, fn) {

	this.findById(thought.id, function(err, thought) {
		thought.populate({ path: 'latest', model: 'ThoughtElement' }, function(err, populatedThought) {
			populatedThought.populate({ path: 'author' }, function(err, populatedAuthor) {
				fn(err, thought);
			});
		});
	});
}

thoughtSchema.statics.getPopulated2 = function(thought, fn) {

	thought.populate({ path: 'latest', model: 'ThoughtElement' }, function(err, populatedThought) {
		populatedThought.populate({ path: 'author' }, function(err, populatedAuthor) {
			fn(err, thought);
		});
	});
}

module.exports = mongoose.model('Thought', thoughtSchema); // Compile schema to a model