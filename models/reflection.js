var mongoose = require('mongoose')
	, Account = require('./account');

var reflectionSchema = new mongoose.Schema({

	moment: { type: mongoose.Schema.Types.ObjectId, ref: 'Moment' },

	text: { type: String, required: false },

	date: { type: Date, default: Date.now },
	hidden: Boolean,
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }
});

module.exports = mongoose.model('Reflection', reflectionSchema); // Compile schema to a model