var mongoose = require('mongoose');

// Define schema for account
var accountSchema = new mongoose.Schema({
  'username': String,
  'password': String,
  'name': String
});

module.exports = mongoose.model('Account', accountSchema); // Compile schema to a model