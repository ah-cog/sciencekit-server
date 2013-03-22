// Controller
// Exports methods for Client model.
var passport = require('passport')
	, Client = require('../models/client.js');

// TODO: Delete the following code when done testing... this shouldn't be public :-)
// exports.list = [
// 	passport.authenticate('bearer', { session: false }),
// 	function(req, res) {
// 		// req.authInfo is set using the `info` argument supplied by
// 	    // `BearerStrategy`.  It is typically used to indicate scope of the token,
// 	    // and used in access control checks.  For illustrative purposes, this
// 	    // example simply returns the scope in the response.
// 		Account.find(function(err, accounts) {
// 			res.send(accounts);
// 			// res.json({ user_id: req.user.id, name: req.user.name, scope: req.authInfo.scope })
// 		});
// 	}
// ]