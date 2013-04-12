// Controller
// Exports methods for Account model.
var passport = require('passport')
	, Account = require('../models/account.js')
	, PhotoFrame = require('../models/photo-frame.js');

// TODO: Delete the following code when done testing... this shouldn't be public :-)
exports.list = [
	passport.authenticate('bearer', { session: false }),
	function(req, res) {
		// req.authInfo is set using the `info` argument supplied by
	    // `BearerStrategy`.  It is typically used to indicate scope of the token,
	    // and used in access control checks.  For illustrative purposes, this
	    // example simply returns the scope in the response.
		//Thought.findById(req.user.id, function(err, account) {
		PhotoFrame.find({}, function(err, photoFrames) {
			res.json(photoFrames);
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
			PhotoFrame.findById(id, function(err, photoFrame) {
				res.json(photoFrame);
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
			var photoFrame = new PhotoFrame({
				uri: photoUri,
				author: account
			});

			// // Save thought to datastore
			photoFrame.save(function(err, photoFrame) {
				if (err) {
					console.log('Error creating PhotoFrame: ' + photoFrame);
				}
				console.log('Created PhotoFrame: ' + photoFrame);
				res.json(photoFrame);
			});
		});

		

		

		// res.send();
	}
]