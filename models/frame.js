var mongoose = require('mongoose')
	, Account = require('./account')
	, Timeline = require('./timeline');

var frameSchema = new mongoose.Schema({
	// TODO: Remove this?  Attach Timeline in the same way as a Tag?
	timeline: { type: mongoose.Schema.Types.ObjectId, ref: 'Timeline' }, // Timeline on which this event occurred.  (NOT! the following) Timeline for which this element is the head

	// myModelObject.constructor.modelName;
	type: { type: 'String' }, // e.g., 'Thought' (the name of the model being framed)

	first: { type: mongoose.Schema.Types.ObjectId }, // first Topic created for TopicFrame
	last:  { type: mongoose.Schema.Types.ObjectId }, // most recently created Topic for TopicFrame

	date: { type: Date, default: Date.now },
	hidden: Boolean
});

frameSchema.statics.getPopulated = function(frame, fn) {

	this.findById(frame.id, function(err, frame) {
		frame.populate({ path: 'last', model: frame.type }, function(err, populatedTopicFrame) {
			populatedTopicFrame.populate({ path: 'author' }, function(err, populatedAuthor) {
				fn(err, frame);
			});
		});
	});
}

frameSchema.statics.getPopulated2 = function(frame, fn) {

	frame.populate({ path: 'last', model: frame.type }, function(err, populatedTopicFrame) {
		populatedTopicFrame.populate({ path: 'author' }, function(err, populatedAuthor) {
			fn(err, populatedTopicFrame);
		});
	});
}

module.exports = mongoose.model('Frame', frameSchema); // Compile schema to a model