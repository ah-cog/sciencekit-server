var mongoose = require('mongoose')
	, Account = require('./account');

var sketchSchema = new mongoose.Schema({
	// frame: { type: mongoose.Schema.Types.ObjectId, ref: 'Frame' },
	// reference: { type: mongoose.Schema.Types.ObjectId, ref: 'Sketch' },
	moment: { type: mongoose.Schema.Types.ObjectId, ref: 'Moment' },

	imageData: { type: String },
	imageWidth: { type: Number },
	imageHeight: { type: Number },

	date: { type: Date, default: Date.now },
	hidden: Boolean,
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }
});

module.exports = mongoose.model('Sketch', sketchSchema); // Compile schema to a model