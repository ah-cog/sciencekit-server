var mongoose = require('mongoose')
	, Account = require('./account');

var observationSchema = new mongoose.Schema({
	moment: { type: mongoose.Schema.Types.ObjectId, ref: 'Moment' },

	effect: { type: String, required: true },
	cause: { type: String, required: true },
	
	date: { type: Date, default: Date.now },
	hidden: Boolean,
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' }
}, 
{
  autoIndex: false
});

module.exports = mongoose.model('Observation', observationSchema); // Compile schema to a model