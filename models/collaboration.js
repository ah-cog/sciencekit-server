var mongoose = require('mongoose');

var collaborationSchema = new mongoose.Schema({
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },

    entry: { type: mongoose.Schema.ObjectId, ref: 'Moment'},

    authors: [{
		author: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }
	}],

    date: { type: Date, default: Date.now },
    hidden: Boolean
});

collaborationSchema.statics.getPopulated = function(collaboration, fn) {

	this.findById(collaboration.id, function(err, collaboration) {
		collaboration.populate({ path: 'entry', model: 'Moment' }, function(err, populatedMoment) {
			populatedMoment.populate({ path: 'author' }, function(err, populatedAuthor) {
				fn(err, collaboration);
			});
		});
	});
}

collaborationSchema.statics.getPopulated2 = function(collaboration, fn) {

	collaboration.populate({ path: 'entry', model: 'Moment' }, function(err, populatedMoment) {
		populatedMoment.populate({ path: 'author' }, function(err, populatedAuthor) {
			populatedMoment.populate({ path: 'authors' }, function(err, populatedAuthors) {
				fn(err, populatedMoment);
			});
		});
	});
}

module.exports = mongoose.model('Collaboration', collaborationSchema); // Compile schema to a model