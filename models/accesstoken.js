var mongoose = require('mongoose');

// tokens[token] = { userID: userID, clientID: clientID };

// Define schema for access token
var accessTokenSchema = new mongoose.Schema({
  'token': String,
  'userID': String,
  'clientID': String
});

module.exports = mongoose.model('AccessToken', accessTokenSchema); // Compile schema to a model