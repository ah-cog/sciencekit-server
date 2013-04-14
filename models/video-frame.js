var mongoose = require('mongoose')
	, Account = require('./account');

var videoFrameSchema = new mongoose.Schema({
	timeline: { type: mongoose.Schema.Types.ObjectId, ref: 'Timeline' }, // Timeline on which this event occurred.  (NOT! the following) Timeline for which this element is the head
	
	first: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' }, // the first Video
	last: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' }, // the most recent Video

	date: { type: Date, default: Date.now },
	hidden: Boolean
});

videoFrameSchema.statics.getPopulated = function(frame, fn) {

	this.findById(frame.id, function(err, frame) {
		frame.populate({ path: 'last', model: 'Video' }, function(err, populatedFrame) {
			populatedFrame.populate({ path: 'author' }, function(err, populatedAuthor) {
				fn(err, frame);
			});
		});
	});
}

videoFrameSchema.statics.getPopulated2 = function(frame, fn) {

	frame.populate({ path: 'last', model: 'Video' }, function(err, populatedFrame) {
		populatedFrame.populate({ path: 'author' }, function(err, populatedAuthor) {
			fn(err, populatedFrame);
		});
	});
}

module.exports = mongoose.model('VideoFrame', videoFrameSchema); // Compile schema to a model