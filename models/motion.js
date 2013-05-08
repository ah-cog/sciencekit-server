var mongoose = require('mongoose')
	, Account = require('./account');

var motionSchema = new mongoose.Schema({
	frame: { type: mongoose.Schema.Types.ObjectId, ref: 'Frame' },
	reference: { type: mongoose.Schema.Types.ObjectId, ref: 'Motion' },

	points: [{
		x: Number,
		y: Number,
		z: Number,
		t: Number
	}],

	date: { type: Date, default: Date.now },
	hidden: Boolean,
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }
});

module.exports = mongoose.model('Motion', motionSchema); // Compile schema to a model