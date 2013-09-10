var mongoose = require('mongoose')
	, Account = require('./account');

var questionSchema = new mongoose.Schema({
	parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Moment' },

	question: { type: String },
	
	date: { type: Date, default: Date.now },
	hidden: Boolean,
	author: { type: mongoose.Schema.Types.ObjectId, ref: 'Account' },
}, 
{
  autoIndex: true
});

module.exports = mongoose.model('Question', questionSchema); // Compile schema to a model