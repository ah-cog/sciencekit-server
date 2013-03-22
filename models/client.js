var mongoose = require('mongoose');

// A client is software registered with ScienceKit for access using the OAuth2 interface.
//
// Example client:
//
// { id: '1', name: 'ScienceKit Probe', clientId: 'abc123', clientSecret: 'ssh-secret' }

// Define schema for OAuth2 client
var clientSchema = new mongoose.Schema({
  'name': String,
  'clientId': String,
  'clientSecret': String
});

module.exports = mongoose.model('Client', clientSchema); // Compile schema to a model