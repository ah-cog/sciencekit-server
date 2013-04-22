var mongoose = require('mongoose')
	, Account = require('./account');

var photoFrameSchema = new mongoose.Schema({
	timeline: { type: mongoose.Schema.Types.ObjectId, ref: 'Timeline' }, // Timeline on which this event occurred.  (NOT! the following) Timeline for which this element is the head
	
	first: { type: mongoose.Schema.Types.ObjectId, ref: 'Photo' }, // first photo, the root, seed photo
	last: { type: mongoose.Schema.Types.ObjectId, ref: 'Photo' }, // most recent photo temporally

	date: { type: Date, default: Date.now },
	hidden: Boolean
});

photoFrameSchema.statics.getPopulated = function(frame, fn) {

	this.findById(frame.id, function(err, frame) {
		frame.populate({ path: 'last', model: 'Photo' }, function(err, populatedFrame) {
			populatedFrame.populate({ path: 'author' }, function(err, populatedAuthor) {
				fn(err, frame);
			});
		});
	});
}

photoFrameSchema.statics.getPopulated2 = function(frame, fn) {

	frame.populate({ path: 'last', model: 'Photo' }, function(err, populatedFrame) {
		populatedFrame.populate({ path: 'author' }, function(err, populatedAuthor) {
			fn(err, populatedFrame);
		});
	});
}

module.exports = mongoose.model('PhotoFrame', photoFrameSchema); // Compile schema to a model