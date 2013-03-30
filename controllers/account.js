// Controller
// Exports methods for Account model.
var passport = require('passport')
	, bcrypt = require('bcrypt')
	, Account = require('../models/account.js');

// TODO: Delete the following code when done testing... this shouldn't be public :-)
exports.list = [
	passport.authenticate('bearer', { session: false }),
	function(req, res) {
		// req.authInfo is set using the `info` argument supplied by
	    // `BearerStrategy`.  It is typically used to indicate scope of the token,
	    // and used in access control checks.  For illustrative purposes, this
	    // example simply returns the scope in the response.
		Account.findById(req.user.id, function(err, account) {
			res.send(account);
			// res.json({ user_id: req.user.id, name: req.user.name, scope: req.authInfo.scope })
		});
	}
]

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = function(req, res) {

	var username = req.body.username;
	var password = req.body.password;
	console.log(username);
	console.log(password);

	if (username !== '' && password !== '') {

		// Hash the password using bcrypt
		var workFactor = 10;
		bcrypt.genSalt(workFactor, function(err, salt) {
		    bcrypt.hash(password, salt, function(err, hash) {
		        // Store hash in your password DB.

		        // Create account
				var account = new Account({
					username: username,
					password: hash,
					name: ''
				});

				// Save account to datastore
				account.save(function(err, account) {
					if (err) {
						console.log('Error creating account: ' + account);
						res.redirect('/signup');
					}

					console.log('Created account: ' + account);
					res.redirect('/timeline');
				});

		    });
		});
	}
}