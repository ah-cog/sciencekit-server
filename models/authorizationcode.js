var mongoose = require('mongoose');

// Prototypical Example:
// exports.save = function(code, clientID, redirectURI, userID, done) {
//   codes[code] = { clientID: clientID, redirectURI: redirectURI, userID: userID };
//   return done(null);
// };

// Define schema for access token
var authorizationCodeSchema = new mongoose.Schema({
	'code': String,
	'clientID': String,
	'redirectURI': String,
	'userID': String
});

module.exports = mongoose.model('AuthorizationCode', authorizationCodeSchema); // Compile schema to a model