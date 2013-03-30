// Controller
// Exports methods for Account model.
var passport = require('passport')
	, Account = require('../models/account.js')
	, Photo = require('../models/photo.js');

// TODO: Delete the following code when done testing... this shouldn't be public :-)
exports.list = [
	passport.authenticate('bearer', { session: false }),
	function(req, res) {
		// req.authInfo is set using the `info` argument supplied by
	    // `BearerStrategy`.  It is typically used to indicate scope of the token,
	    // and used in access control checks.  For illustrative purposes, this
	    // example simply returns the scope in the response.
		//Thought.findById(req.user.id, function(err, account) {
		Photo.find({}, function(err, photos) {
			res.json(photos);
			// res.json({ user_id: req.user.id, name: req.user.name, scope: req.authInfo.scope })
		});
	}
]

exports.read = [
	function(req, res, next) {
		var id = req.params.id;
		console.log("requesting image id = " + id);
		if (id) {
			// req.authInfo is set using the `info` argument supplied by
		    // `BearerStrategy`.  It is typically used to indicate scope of the token,
		    // and used in access control checks.  For illustrative purposes, this
		    // example simply returns the scope in the response.
			//Thought.findById(req.user.id, function(err, account) {
			Photo.findById(id, function(err, photo) {
				res.json(photo);
				// res.json({ user_id: req.user.id, name: req.user.name, scope: req.authInfo.scope })
			});
		}
	}
]

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
	passport.authenticate('bearer', { session: false }),
	function(req, res, next) {

		console.log(req.files);

		Account.findById(req.user.id, function(err, account) {
			// res.json({ user_id: req.user.id, name: req.user.name, scope: req.authInfo.scope })

			var filenameStart = req.files.myphoto.path.indexOf("/photos");
			var photoUri = req.files.myphoto.path.substring(filenameStart);
			console.log("photoUri = " + photoUri);

			// // Create photo
			var photo = new Photo({
				uri: photoUri,
				author: account
			});

			// // Save thought to datastore
			photo.save(function(err, photo) {
				if (err) {
					console.log('Error creating photo: ' + photo);
				}
				console.log('Created photo: ' + photo);
				res.json(photo);
			});
		});

		

		

		// res.send();
	}
]