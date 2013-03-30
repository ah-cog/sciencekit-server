var mongoose = require('mongoose')
	, AccountSchema = require('./account');

var photoSchema = new mongoose.Schema({
	uri: { type: String, required: true }, // e.g., 'Thought'
	date: { type: Date, default: Date.now },
	hidden: Boolean,
	author: { type: mongoose.Schema.ObjectId, ref: 'AccountSchema' }
});

module.exports = mongoose.model('Photo', photoSchema); // Compile schema to a model