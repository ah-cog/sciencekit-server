// Controller
// Exports methods for Account model.
var passport = require('passport')
	, bcrypt = require('bcrypt')
	, Account = require('../models/account')
	, Inquiry = require('../models/inquiry')
	, Client = require('../models/client');

// TODO: Delete the following code when done testing... this shouldn't be public :-)
exports.readOne = [
	passport.authenticate('bearer', { session: false }),
	function(req, res) {
		// req.authInfo is set using the `info` argument supplied by
	    // `BearerStrategy`.  It is typically used to indicate scope of the token,
	    // and used in access control checks.  For illustrative purposes, this
	    // example simply returns the scope in the response.
		Account.findById(req.user.id, function(err, account) {
			delete account.password;
			res.json(account);
		});
	}
];

// TODO: Delete the following code when done testing... this shouldn't be public :-)
exports.read = [
	passport.authenticate('bearer', { session: false }),
	function(req, res) {
		// req.authInfo is set using the `info` argument supplied by
	    // `BearerStrategy`.  It is typically used to indicate scope of the token,
	    // and used in access control checks.  For illustrative purposes, this
	    // example simply returns the scope in the response.
	    var response = [];
		Account.find({}, function(err, accounts) {

			var count = accounts.length; // Hacky solution used to force synchronous operation. Optimize!
			accounts.forEach(function (account) {

				// Only respond with accounts other than the requester's account
				if (account._id != req.user.id) {
					var accountObject = account.toObject();
					// accountObject.password = '';
					delete accountObject['password'];
					response.push(accountObject);
				}

				count--;

				if(count <= 0) {
					// Return result
					res.json(response);
				}
			});
		});
	}
];

// [Source: http://codahale.com/how-to-safely-store-a-password/]
exports.create = function(req, res) {

	var accountTemplate = req.body;

	if (accountTemplate.username !== '' && accountTemplate.password !== '') {

		// Hash the password using bcrypt
		var workFactor = 10;
		bcrypt.genSalt(workFactor, function(err, salt) {
		    bcrypt.hash(accountTemplate.password, salt, function(err, hash) {
		        // Store hash in your password DB.

		        // Create account
				var account = new Account({
					username: accountTemplate.username,
					password: hash,
					name: ''
				});

				// Save account to datastore
				account.save(function(err, account) {
					if (err) {
						console.log('Error creating account: ' + account);
						res.redirect('/signup');
					}

					// Create client for account (for authentication using OAuth2)
					Client.create({
						name: 'ScienceKit Client',
						clientId: 'abc123',
						clientSecret: 'ssh-secret'

					}, function(err, client) {

						res.redirect('/login');

						// Create timeline for account
						// Inquiry.createTimelineByActivity(account, function(err, timeline) {
						// 	if (err) {
						// 		console.log('Error creating timeline for new account:' + account);
						// 	}

						// 	console.log('Created account: ' + account);
						// 	res.redirect('/timeline');
						// });

					});
				});
		    });
		});
	}
}