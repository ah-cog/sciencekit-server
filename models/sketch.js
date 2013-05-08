var mongoose = require('mongoose')
	, Account = require('./account');

var sketchSchema = new mongoose.Schema({
	frame: { type: mongoose.Schema.Types.ObjectId, ref: 'Frame' },
	reference: { type: mongoose.Schema.Types.ObjectId, ref: 'Sketch' },

	imageData: { type: String },

	date: { type: Date, default: Date.now },
	hidden: Boolean,
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }
});

module.exports = mongoose.model('Sketch', sketchSchema); // Compile schema to a model