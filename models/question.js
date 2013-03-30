var mongoose = require('mongoose')
	, AccountSchema = require('./account');

var questionSchema = new mongoose.Schema({
	text: { type: String, required: true },
	date: { type: Date, default: Date.now },
	hidden: Boolean,
	author: AccountSchema
}, 
{
  autoIndex: false
});

module.exports = mongoose.model('Question', questionSchema); // Compile schema to a model