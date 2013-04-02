var mongoose = require('mongoose')
	, Account = require('./account')
	, Photo = require('./photo');

var photoSchema = new mongoose.Schema({
	first: { type: mongoose.Schema.Types.ObjectId, ref: 'PhotoElement' }, // first photo, the root, seed photo
	latest: { type: mongoose.Schema.Types.ObjectId, ref: 'PhotoElement' }, // most recent photo temporally

	date: { type: Date, default: Date.now },
	hidden: Boolean
});

photoSchema.statics.getOrCreatePhoto = function(photoElementTemplate, fn) {

	// Store reference to Thought object
	var myThis = this;

	this.findById(photoElementTemplate.photo, function(err, existingPhoto) {
		if(err) throw err;

		// Check if a photo exists with the specified ID.  If not, create a new photo.
		if(existingPhoto !== null) {
			console.log("Found existing photo: " + existingPhoto);

		// Create timeline element
		//createThoughtElement(thoughtElementTemplate, existingPhoto);
		fn(null, existingPhoto);

		} else {

			// Save a new photo to datastore
			var photo = new myThis();
			console.log('Saving photo: ' + photo);
			photo.save(function(err) {
				// if(err) throw err;
				if (err) {
					console.log('Error creating photo: ' + photo);
				}
				console.log('Created photo: ' + photo);

				// Create timeline element (always do this when creating any kind collection like a thought, but not elements in collections)
				// TODO: Move this elsewhere and add a callback parameter for further calls

				// Create timeline element
				//createTimelineElement(thoughtElementTemplate, newThought, createThoughtElement);
				//createThoughtElement(thoughtElementTemplate, newThought);
				fn(null, photo);

			});
		}
	});
}

module.exports = mongoose.model('Photo', photoSchema); // Compile schema to a model