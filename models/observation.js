var mongoose = require('mongoose')
	, Account = require('./account');

var observationSchema = new mongoose.Schema({
	parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Moment' },

	effect: { type: String },
	cause: { type: String },
	
	date: { type: Date, default: Date.now },
	hidden: Boolean,
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }
}, 
{
  autoIndex: false
});

module.exports = mongoose.model('Observation', observationSchema); // Compile schema to a model