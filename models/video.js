var mongoose = require('mongoose')
	, Account = require('./account');

var videoSchema = new mongoose.Schema({
	// frame: { type: mongoose.Schema.Types.ObjectId, ref: 'Frame' },
	// reference: { type: mongoose.Schema.Types.ObjectId, ref: 'Video' },
	moment: { type: mongoose.Schema.Types.ObjectId, ref: 'Moment' },

	uri: { type: String, required: true },

	date: { type: Date, default: Date.now },
	hidden: Boolean,
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }
});

module.exports = mongoose.model('Video', videoSchema); // Compile schema to a model