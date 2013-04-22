var mongoose = require('mongoose')
	, Account = require('./account')
	, Timeline = require('./timeline');

// A thought is a tree, structurally, but can be listed linearly.
var thoughtFrameSchema = new mongoose.Schema({
	timeline: { type: mongoose.Schema.Types.ObjectId, ref: 'Timeline' }, // Timeline on which this event occurred.  (NOT! the following) Timeline for which this element is the head

	first: { type: mongoose.Schema.Types.ObjectId, ref: 'Thought' }, // first thought, the root, seed thought
	last: { type: mongoose.Schema.Types.ObjectId, ref: 'Thought' }, // most recent thought temporally

	date: { type: Date, default: Date.now },
	hidden: Boolean
});

thoughtFrameSchema.statics.getPopulated = function(thoughtFrame, fn) {

	this.findById(thoughtFrame.id, function(err, thoughtFrame) {
		thoughtFrame.populate({ path: 'last', model: 'Thought' }, function(err, populatedThoughtFrame) {
			populatedThoughtFrame.populate({ path: 'author' }, function(err, populatedAuthor) {
				fn(err, thoughtFrame);
			});
		});
	});
}

thoughtFrameSchema.statics.getPopulated2 = function(thoughtFrame, fn) {

	thoughtFrame.populate({ path: 'last', model: 'Thought' }, function(err, populatedThoughtFrame) {
		populatedThoughtFrame.populate({ path: 'author' }, function(err, populatedAuthor) {
			fn(err, populatedThoughtFrame);
		});
	});
}

module.exports = mongoose.model('ThoughtFrame', thoughtFrameSchema); // Compile schema to a model