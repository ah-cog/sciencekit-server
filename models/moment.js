var mongoose = require('mongoose');

var momentSchema = new mongoose.Schema({
    timeline: { type: mongoose.Schema.ObjectId, ref: 'Timeline', required: true }, // Timeline upon which this event occurred (not the one created for this event)
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },

    // frame: { type: mongoose.Schema.Types.ObjectId, required: true }, // i.e., the referenced object itself
    // frameType: { type: String, required: true }, // i.e., the "ref" value, e.g., 'ThoughtFrame'

    entry: { type: mongoose.Schema.Types.ObjectId }, // first Topic created for TopicFrame
    entryType: { type: 'String' }, // e.g., 'Thought' (the name of the model being framed)

    date: { type: Date, default: Date.now },
    hidden: Boolean
});

momentSchema.statics.getPopulated = function(moment, fn) {

	this.findById(moment.id, function(err, moment) {
		moment.populate({ path: 'entry', model: moment.entryType }, function(err, populatedMoment) {
			populatedMoment.populate({ path: 'author' }, function(err, populatedAuthor) {
				fn(err, moment);
			});
		});
	});
}

momentSchema.statics.getPopulated2 = function(moment, fn) {

	moment.populate({ path: 'entry', model: moment.entryType }, function(err, populatedMoment) {
		populatedMoment.populate({ path: 'author' }, function(err, populatedAuthor) {
			fn(err, populatedMoment);
		});
	});
}

module.exports = mongoose.model('Moment', momentSchema); // Compile schema to a model