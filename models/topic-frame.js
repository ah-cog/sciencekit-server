var mongoose = require('mongoose')
	, Account = require('./account')
	, Timeline = require('./timeline');

var topicFrameSchema = new mongoose.Schema({
	timeline: { type: mongoose.Schema.Types.ObjectId, ref: 'Timeline' }, // Timeline on which this event occurred.  (NOT! the following) Timeline for which this element is the head

	first: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }, // first Topic created for TopicFrame
	last: { type: mongoose.Schema.Types.ObjectId, ref: 'Topic' }, // most recently created Topic for TopicFrame

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

module.exports = mongoose.model('TopicFrame', topicFrameSchema); // Compile schema to a model