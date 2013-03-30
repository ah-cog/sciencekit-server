// Controller
// Exports methods for Account model.
var passport = require('passport')
	, socketio = require('socket.io')
	, Account = require('../models/account.js')
	, Thought = require('../models/thought.js');

// TODO: Delete the following code when done testing... this shouldn't be public :-)
exports.list = [
	passport.authenticate('bearer', { session: false }),
	function(req, res) {
		// req.authInfo is set using the `info` argument supplied by
	    // `BearerStrategy`.  It is typically used to indicate scope of the token,
	    // and used in access control checks.  For illustrative purposes, this
	    // example simply returns the scope in the response.
		//Thought.findById(req.user.id, function(err, account) {
		//Thought.find({}, function(err, thoughts) {
		Thought.find({}).populate('author').exec(function(err, thoughts) {
			res.json(thoughts);
			// res.json({ user_id: req.user.id, name: req.user.name, scope: req.authInfo.scope })
		});
	}
]

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = [
	passport.authenticate('bearer', { session: false }),
	function(req, res) {
		
		Account.findById(req.user.id, function(err, account) {
			// res.json({ user_id: req.user.id, name: req.user.name, scope: req.authInfo.scope })

			// // Create thought
			var thought = new Thought({
				text: req.body.thought.text,
				author: account
			});

			// // Save thought to datastore
			thought.save(function(err, thought) {
				if (err) {
					console.log('Error creating thought: ' + thought);
				}
				console.log('Created thought: ' + thought);

				res.json(thought);
				socketio.sockets.emit('thought', thought);
			});
		});

		

		

		// res.send();
	}
]