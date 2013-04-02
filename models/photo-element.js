var mongoose = require('mongoose')
	, Account = require('./account')
	, Photo = require('./photo');

var photoElementSchema = new mongoose.Schema({
	photo: { type: mongoose.Schema.Types.ObjectId, ref: 'Photo' },
	reference: { type: mongoose.Schema.Types.ObjectId, ref: 'PhotoElement' },

	uri: { type: String, required: true }, // e.g., 'Photo'

	date: { type: Date, default: Date.now },
	hidden: Boolean,
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }
});

photoElementSchema.statics.createPhotoElement = function(photo, photoElementTemplate, fn) {

	// Create photo node
	this.create({
		photo: photo,
		reference: photoElementTemplate.reference || null,

		uri: photoElementTemplate.uri,

		author: photoElementTemplate.account
		}, function(err, photoElement) {
			// Save photo to datastore
			console.log('Creating photo element.');
			if (err) {
				console.log('Error creating photo element: ' + photoElement);
			}
			console.log('Created photo element: ' + photoElement);

			// Update latest photo
			// TODO: create function 'photo.setLatest' and 'photo.setFirst' or just '.set' and '.get'
			var updateOptions = {};
			updateOptions.latest = photoElement;
			if(photo.first == null) { // If the photo is new
				updateOptions.first = photoElement;
			}

			Photo.update({ _id: photo._id, }, updateOptions, function(err, numberAffected) {

			fn(null, photoElement);
		});
	});
}

module.exports = mongoose.model('PhotoElement', photoElementSchema); // Compile schema to a model