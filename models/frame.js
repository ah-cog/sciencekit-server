var mongoose = require('mongoose')
	, Account = require('./account')
	, Timeline = require('./timeline');

var frameSchema = new mongoose.Schema({
	// TODO: Remove this?  Attach Timeline in the same way as a Tag?
	timeline: { type: mongoose.Schema.Types.ObjectId, ref: 'Timeline' }, // Timeline on which this event occurred.  (NOT! the following) Timeline for which this element is the head

	// myModelObject.constructor.modelName;
	//frameType: { type: String }, // e.g., 'ThoughtFrame'

	first: { type: mongoose.Schema.Types.ObjectId }, // first Topic created for TopicFrame
	last:  { type: mongoose.Schema.Types.ObjectId }, // most recently created Topic for TopicFrame

	date: { type: Date, default: Date.now },
	hidden: Boolean
});

topicFrameSchema.statics.getPopulated = function(topicFrame, fn) {

	this.findById(topicFrame.id, function(err, topicFrame) {
		topicFrame.populate({ path: 'last', model: 'Topic' }, function(err, populatedTopicFrame) {
			populatedTopicFrame.populate({ path: 'author' }, function(err, populatedAuthor) {
				fn(err, topicFrame);
			});
		});
	});
}

topicFrameSchema.statics.getPopulated2 = function(topicFrame, fn) {

	topicFrame.populate({ path: 'last', model: 'Topic' }, function(err, populatedTopicFrame) {
		populatedTopicFrame.populate({ path: 'author' }, function(err, populatedAuthor) {
			fn(err, populatedTopicFrame);
		});
	});
}

module.exports = mongoose.model('TopicFrame', frameSchema); // Compile schema to a model