var mongoose = require('mongoose');

var pageSchema = new mongoose.Schema({
    story: { type: mongoose.Schema.ObjectId, ref: 'Story' }, // Timeline upon which this event occurred (not the one created for this event)
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },

    page: { type: mongoose.Schema.ObjectId, ref: 'Moment'}, // first Topic created for TopicFrame
    // entryType: { type: 'String' }, // e.g., 'Thought' (the name of the model being framed)

    chapter: { type: String, default: '' },

    date: { type: Date, default: Date.now },
    hidden: Boolean
});

pageSchema.statics.getPopulated = function(page, fn) {

	this.findById(page.id, function(err, page) {
		page.populate({ path: 'entry', model: 'Moment' }, function(err, populatedMoment) {
			populatedMoment.populate({ path: 'author' }, function(err, populatedAuthor) {
				fn(err, page);
			});
		});
	});
}

pageSchema.statics.getPopulated2 = function(page, fn) {

	page.populate({ path: 'entry', model: 'Moment' }, function(err, populatedMoment) {
		populatedMoment.populate({ path: 'author' }, function(err, populatedAuthor) {
			fn(err, populatedMoment);
		});
	});
}

module.exports = mongoose.model('Page', pageSchema); // Compile schema to a model